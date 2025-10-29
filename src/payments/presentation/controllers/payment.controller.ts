import { Controller, Post, Body, Get, Param, Patch, HttpStatus, HttpCode, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiSecurity } from '@nestjs/swagger';
import { PaymentApplicationService } from '../../application/services/payment-application.service';
import { ProcessPaymentDto } from '../../application/dto/process-payment.dto';
import { RefundPaymentDto } from '../../application/dto/refund-payment.dto';
import { ConfirmPaymentAmountDto, PaymentAmountConfirmationResponse } from '../../application/dto/confirm-amount.dto';
import { 
  PaymentMethodInfoDto, 
  ValidatePaymentMethodDto, 
  PaymentMethodValidationResponse,
  PaymentSessionInfoDto 
} from '../../application/dto/payment-method-info.dto';
import { PaymentAttemptGuard } from '../../infrastructure/guards/payment-attempt.guard';
import { SecurityAuditService } from '../../infrastructure/services/security-audit.service';
import { PaymentConfirmationService } from '../../infrastructure/services/payment-confirmation.service';
import { Request } from 'express';

@ApiTags('pagos')
@Controller('pagos')
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentApplicationService,
    private readonly securityAuditService: SecurityAuditService,
    private readonly confirmationService: PaymentConfirmationService,
  ) {}

  /**
   * GET /api/pagos/payment-methods
   * Historia de Usuario 1 - CA8, CA9: Obtener métodos de pago disponibles
   */
  @Get('payment-methods')
  @HttpCode(HttpStatus.OK)
  @ApiTags('interfaz-pago')
  @ApiOperation({
    summary: 'Obtener lista de métodos de pago disponibles',
    description: 
      'Retorna información completa de todos los métodos de pago soportados ' +
      'para que el frontend pueda mostrar la interfaz de selección. ' +
      'Incluye logos, validaciones requeridas, y monedas soportadas.\n\n' +
      '**Historia de Usuario 1:**\n' +
      '- CA8: Mostrar al menos 2 métodos de pago disponibles\n' +
      '- CA9: Mostrar los métodos con íconos reconocibles y nombres claros\n' +
      '- CA11: Información de validación para cada método',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de métodos de pago disponibles',
    type: [PaymentMethodInfoDto],
  })
  async getPaymentMethods(): Promise<PaymentMethodInfoDto[]> {
    return this.paymentService.getAvailablePaymentMethods();
  }

  /**
   * POST /api/pagos/validate-payment-method
   * Historia de Usuario 1 - CA11, CA12, CA13: Validar método de pago antes de procesar
   */
  @Post('validate-payment-method')
  @HttpCode(HttpStatus.OK)
  @ApiTags('interfaz-pago')
  @ApiOperation({
    summary: 'Validar formato de método de pago',
    description: 
      'Valida el formato de tarjeta, CVV, y fecha de vencimiento ' +
      'antes de proceder al procesamiento del pago. ' +
      'Retorna errores específicos por campo para mostrar en el frontend.\n\n' +
      '**Historia de Usuario 1:**\n' +
      '- CA11: Validar el formato del método de pago antes de proceder\n' +
      '- CA12: Mostrar mensajes de error específicos y claros\n' +
      '- CA13: Validar la fecha de vencimiento de tarjetas\n' +
      '- CA15: No permitir avanzar hasta que la validación sea exitosa',
  })
  @ApiBody({ type: ValidatePaymentMethodDto })
  @ApiResponse({
    status: 200,
    description: 'Resultado de validación',
    type: PaymentMethodValidationResponse,
  })
  async validatePaymentMethod(
    @Body() dto: ValidatePaymentMethodDto,
  ): Promise<PaymentMethodValidationResponse> {
    return this.paymentService.validatePaymentMethod(dto);
  }

  /**
   * GET /api/pagos/session/:sessionId
   * Historia de Usuario 1 - CA2: Obtener información de sesión con temporizador
   */
  @Get('session/:sessionId')
  @HttpCode(HttpStatus.OK)
  @ApiTags('interfaz-pago')
  @ApiOperation({
    summary: 'Obtener información de sesión de pago',
    description: 
      'Retorna el estado de la sesión de pago incluyendo tiempo restante ' +
      'para completar el pago (temporizador).\n\n' +
      '**Historia de Usuario 1:**\n' +
      '- CA2: Mostrar un temporizador o indicación del tiempo límite',
  })
  @ApiParam({
    name: 'sessionId',
    description: 'ID de la sesión de pago',
    example: 'sess_1a2b3c4d5e6f',
  })
  @ApiResponse({
    status: 200,
    description: 'Información de sesión con temporizador',
    type: PaymentSessionInfoDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Sesión no encontrada o expirada',
  })
  async getPaymentSession(
    @Param('sessionId') sessionId: string,
  ): Promise<PaymentSessionInfoDto> {
    return this.confirmationService.getSessionInfo(sessionId);
  }

  /**
   * PASO 1: Confirmar el monto antes de procesar el pago
   * Cumple con requisito de confirmación de monto y seguridad
   */
  @Post('confirm-amount')
  @HttpCode(HttpStatus.OK)
  @ApiTags('seguridad')
  @ApiOperation({
    summary: 'Confirmar monto antes de procesar el pago',
    description: 
      'Genera un token de confirmación temporal para el monto del pago. ' +
      'Este token debe ser usado en el siguiente paso para procesar el pago. ' +
      'El token expira en 5 minutos por seguridad.',
  })
  @ApiBody({ type: ConfirmPaymentAmountDto })
  @ApiResponse({
    status: 200,
    description: 'Monto confirmado exitosamente',
    type: PaymentAmountConfirmationResponse,
  })
  async confirmAmount(
    @Body() dto: ConfirmPaymentAmountDto,
    @Req() request: Request,
  ): Promise<PaymentAmountConfirmationResponse> {
    const userId = (request as any).securityContext?.userId || 'anonymous';
    const sessionId = (request as any).securityContext?.sessionId || 'unknown';

    return await this.confirmationService.generateConfirmation(dto, userId, sessionId);
  }

  /**
   * PASO 2: Procesar el pago con seguridad completa
   * Incluye todas las validaciones de seguridad (CA1-CA6)
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(PaymentAttemptGuard) // CA4: Limitar a 3 intentos
  @ApiOperation({ 
    summary     : 'Procesar un nuevo pago (PASO 2)',
    description : 
      '⚠️ REQUISITOS DE SEGURIDAD:\n' +
      '1. Debe obtener un token de confirmación primero (POST /pagos/confirm-amount)\n' +
      '2. CVV es requerido para todas las transacciones (CA3)\n' +
      '3. Los datos de tarjeta NO se almacenan (CA2)\n' +
      '4. Máximo 3 intentos fallidos por sesión (CA4)\n' +
      '5. Todas las transacciones son auditadas (CA5)\n' +
      '6. Solo conexiones HTTPS/TLS 1.2+ (CA1)\n\n' +
      'Crea un nuevo pago con validaciones específicas según el proveedor seleccionado.'
  })
  @ApiSecurity('JWT')
  @ApiBody({
    type      : ProcessPaymentDto,
    examples  : {
      stripe: {
        summary     : 'Pago con Stripe',
        description : 'Ejemplo completo con CVV y token de confirmación',
        value       : {
          amount            : 100,
          currency          : 'USD',
          provider          : 'stripe',
          cardSecurity      : {
            cvv             : '123',
            last4Digits     : '4242',
            cardHolderName  : 'JOHN DOE'
          },
          confirmationToken : 'conf_1a2b3c4d5e6f',
          customerId        : 'cus_1234567890',
          description       : 'Pago con tarjeta de crédito',
          metadata          : {
            idCarrito  : 'CART_123',
            idUsuario  : 'USER_456'
          }
        }
      },
      webpay: {
        summary     : 'Pago con Webpay',
        description : 'Ejemplo de pago usando Webpay con CVV',
        value       : {
          amount            : 25000,
          currency          : 'CLP',
          provider          : 'webpay',
          cardSecurity      : {
            cvv             : '456',
            last4Digits     : '1234',
            cardHolderName  : 'MARIA SILVA'
          },
          confirmationToken : 'conf_7g8h9i0j1k2l',
          returnUrl         : 'https://mi-tienda.com/webpay/return',
          description       : 'Pago con transferencia bancaria',
          metadata          : {
            idCarrito  : 'CART_789',
            idUsuario  : 'USER_123'
          }
        }
      },
      paypal: {
        summary     : 'Pago con PayPal',
        description : 'Ejemplo de pago usando PayPal',
        value       : {
          amount            : 75.99,
          currency          : 'USD',
          provider          : 'paypal',
          cardSecurity      : {
            cvv             : '789',
          },
          confirmationToken : 'conf_3m4n5o6p7q8r',
          cancelUrl         : 'https://mi-tienda.com/paypal/cancel',
          description       : 'Pago con wallet digital',
          metadata          : {
            subscriptionId  : 'SUB_456'
          }
        }
      }
    }
  })
  @ApiResponse({ 
    status      : 201, 
    description : 'Pago procesado exitosamente con todas las validaciones de seguridad',
    schema      : {
      example    : {
        id        : 'pay_1699876543210_abc123',
        amount    : 100,
        currency  : 'USD',
        provider  : 'stripe',
        status    : 'pending',
        metadata  : {
          idCarrito : 'CART_123',
          idUsuario : 'USER_456',
          securityChecks: {
            cardSecurityValidated: true,
            amountConfirmed: true,
            tlsVersion: 'TLSv1.3'
          }
        },
        createdAt : '2024-09-09T21:30:00.000Z'
      }
    }
  })
  @ApiResponse({ 
    status      : 400, 
    description : 'Datos de validación incorrectos o CVV inválido',
    schema      : {
      example    : {
        message     : ['El código CVV es requerido para verificación de identidad'],
        error       : 'Bad Request',
        statusCode  : 400
      }
    }
  })
  @ApiResponse({ 
    status      : 429, 
    description : 'Límite de intentos excedido (máximo 3 intentos)',
    schema      : {
      example    : {
        message     : 'Límite de intentos de pago excedido. Por favor, intente más tarde.',
        error       : 'Too Many Requests',
        statusCode  : 429,
        details     : {
          maxAttempts     : 3,
          currentAttempts : 3,
          retryAfter      : '1 hour'
        }
      }
    }
  })
  @ApiResponse({ 
    status      : 422, 
    description : 'Error de validación de reglas de negocio',
    schema      : {
      example    : {
        message     : 'Token de confirmación inválido o expirado',
        error       : 'Unprocessable Entity',
        statusCode  : 422
      }
    }
  })
  async createPayment(
    @Body() dto: ProcessPaymentDto,
    @Req() request: Request,
  ) {
    const securityContext = (request as any).securityContext || {};
    const { userId, sessionId, ipAddress, userAgent } = securityContext;

    try {
      // CA3: Validar CVV
      if (!dto.cardSecurity?.cvv) {
        this.securityAuditService.logCvvValidationFailed(userId, sessionId, ipAddress);
        throw new Error('CVV es requerido para verificación de identidad');
      }

      // Validar token de confirmación de monto
      await this.confirmationService.validateConfirmation(
        dto.confirmationToken,
        dto.amount,
        dto.currency || 'USD',
        userId,
        sessionId,
      );

      // Log de intento de pago (CA5)
      this.securityAuditService.logPaymentAttempt(
        userId,
        sessionId,
        ipAddress,
        dto.amount,
        dto.provider,
      );

      // Procesar pago (CA2: CVV no se pasa al servicio de aplicación, solo se valida)
      const { cardSecurity, confirmationToken, ...paymentData } = dto;
      const result = await this.paymentService.processPayment(paymentData as any);

      // Log de éxito (CA5)
      this.securityAuditService.logPaymentSuccess(
        userId,
        sessionId,
        result.id,
        dto.amount,
        dto.provider,
      );

      // CA6: Agregar información de seguridad sin exponer datos sensibles
      return {
        id: result.id,
        amount: result.amount,
        currency: result.currency,
        provider: result.provider,
        status: result.status, // Usar getter explícitamente
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
        metadata: {
          ...result.metadata,
          securityChecks: 'PASSED', // Todas las validaciones pasaron
        },
      };
    } catch (error) {
      // Log de fallo (CA5)
      this.securityAuditService.logPaymentFailure(
        userId,
        sessionId,
        ipAddress,
        dto.amount,
        dto.provider,
        error.code || 'UNKNOWN',
        error.message,
      );

      throw error;
    }
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary     : 'Obtener todos los pagos',
    description : 'Retorna una lista con todos los pagos registrados en el sistema'
  })
  @ApiResponse({ 
    status      : 200, 
    description : 'Lista de pagos obtenida exitosamente',
    schema      : {
      example    : [
        {
          id        : 'pay_1699876543210_abc123',
          amount    : 100,
          currency  : 'USD',
          provider  : 'stripe',
          status    : 'completed',
          createdAt : '2024-09-09T21:30:00.000Z'
        },
        {
          id        : 'pay_1699876543211_def456',
          amount    : 25000,
          currency  : 'CLP',
          provider  : 'webpay',
          status    : 'pending',
          createdAt : '2024-09-09T21:35:00.000Z'
        }
      ]
    }
  })
  // GET api/pagos - Obtener todos los pagos
  async getAllPayments() {
    return await this.paymentService.getAllPayments();
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary     : 'Obtener un pago específico',
    description : 'Retorna los detalles completos de un pago específico utilizando su ID único'
  })
  @ApiParam({
    name        : 'id',
    description : 'ID único del pago',
    example     : 'pay_1699876543210_abc123'
  })
  @ApiResponse({
    status      : 200,
    description : 'Pago encontrado exitosamente',
    schema      : {
      example    : {
        id        : 'pay_1699876543210_abc123',
        amount    : 100,
        currency  : 'USD',
        provider  : 'stripe',
        status    : 'completed',
        metadata  : {
          idCarrito: 'CART_123',
          idUsuario: 'USER_456'
        },
        createdAt : '2024-09-09T21:30:00.000Z',
        updatedAt : '2024-09-09T21:31:00.000Z'
      }
    }
  })
  @ApiResponse({ 
    status      : 404, 
    description : 'Pago no encontrado',
    schema      : {
      example    : {
        statusCode : 404,
        message    : 'Payment with ID pay_123 not found',
        error      : 'Not Found'
      }
    }
  })
  // GET api/pagos/:id - Obtener un pago específico por ID
  async getPayment(@Param('id') id: string) {
    return await this.paymentService.getPaymentById(id);
  }

  @Post(':id/refund')
  @HttpCode(HttpStatus.OK)
  @ApiTags('reembolsos')
  @ApiOperation({ 
    summary     : 'Reembolsar un pago',
    description : 'Procesa el reembolso total o parcial de un pago completado. Solo se pueden reembolsar pagos en estado "completed".'
  })
  @ApiParam({
    name        : 'id',
    description : 'ID único del pago a reembolsar',
    example     : 'pay_1699876543210_abc123'
  })
  @ApiBody({
    type      : RefundPaymentDto,
    examples  : {
      total    : {
        summary     : 'Reembolso total',
        description : 'Reembolso completo del pago',
        value       : {
          paymentId  : 'pay_1699876543210_abc123',
          reason     : 'Producto no entregado'
        }
      },
      partial  : {
        summary     : 'Reembolso parcial',
        description : 'Reembolso de una parte del monto pagado',
        value       : {
          paymentId  : 'pay_1699876543210_abc123',
          amount     : 50.00,
          reason     : 'Producto parcialmente dañado',
          metadata   : {
            supportTicket: 'TICKET_789'
          }
        }
      }
    }
  })
  @ApiResponse({ 
    status      : 200, 
    description : 'Reembolso procesado exitosamente',
    schema      : {
      example    : {
        id        : 'pay_1699876543210_abc123',
        amount    : 100,
        currency  : 'USD',
        provider  : 'stripe',
        status    : 'refunded',
        metadata  : {
          refund_reason  : 'Producto defectuoso',
          refund_amount  : 100
        },
        updatedAt : '2024-09-09T21:45:00.000Z'
      }
    }
  })
  @ApiResponse({ 
    status      : 400, 
    description : 'El pago no puede ser reembolsado',
    schema      : {
      example    : {
        statusCode : 400,
        message    : 'Payment cannot be refunded',
        error      : 'Bad Request'
      }
    }
  })
  @ApiResponse({ 
    status      : 404, 
    description : 'Pago no encontrado',
    schema      : {
      example    : {
        statusCode : 404,
        message    : 'Payment with ID pay_123 not found',
        error      : 'Not Found'
      }
    }
  })
  // POST api/pagos/:id/refund - Reembolsar un pago
  async refundPayment(
    @Param('id') id: string,
    @Body() dto: RefundPaymentDto,
  ) {
    return await this.paymentService.refundPayment({ ...dto, paymentId: id });
  }

  @Patch(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiTags('cancelaciones')
  @ApiOperation({ 
    summary     : 'Cancelar un pago',
    description : 'Cancela un pago que está en estado "pending" o "processing". No se pueden cancelar pagos ya completados.'
  })
  @ApiParam({
    name        : 'id',
    description : 'ID único del pago a cancelar',
    example     : 'pay_1699876543210_xyz789'
  })
  @ApiResponse({ 
    status      : 200, 
    description : 'Pago cancelado exitosamente',
    schema      : {
      example    : {
        id        : 'pay_1699876543210_xyz789',
        amount    : 75,
        currency  : 'USD',
        provider  : 'paypal',
        status    : 'cancelled',
        metadata  : {
          cancellation_reason : 'User requested',
          cancelled_at        : '2024-09-09T21:45:00.000Z'
        },
        updatedAt: '2024-09-09T21:45:00.000Z'
      }
    }
  })
  @ApiResponse({ 
    status      : 400, 
    description : 'El pago no puede ser cancelado',
    schema      : {
      example    : {
        statusCode : 400,
        message    : 'Payment cannot be cancelled. Current status: completed',
        error      : 'Bad Request'
      }
    }
  })
  @ApiResponse({ 
    status      : 404, 
    description : 'Pago no encontrado',
    schema      : {
      example    : {
        statusCode : 404,
        message    : 'Payment with ID pay_xyz789 not found',
        error      : 'Not Found'
      }
    }
  })
  // PATCH api/pagos/:id/cancel - Cancelar un pago
  async cancelPayment(@Param('id') id: string) {
    return await this.paymentService.cancelPayment(id);
  }

  @Get(':id/status')
  @HttpCode(HttpStatus.OK)
  @ApiTags('consultas')
  @ApiOperation({ 
    summary     : 'Obtener estado de un pago',
    description : 'Consulta el estado actual de un pago específico. Útil para verificar el progreso de transacciones pendientes.'
  })
  @ApiParam({
    name        : 'id',
    description : 'ID único del pago',
    example     : 'pay_1699876543210_def456'
  })
  @ApiResponse({ 
    status      : 200, 
    description : 'Estado del pago obtenido exitosamente',
    schema      : {
      example    : {
        id        : 'pay_1699876543210_def456',
        status    : 'processing',
        amount    : 150,
        currency  : 'USD',
        provider  : 'webpay',
        createdAt : '2024-09-09T21:30:00.000Z',
        updatedAt : '2024-09-09T21:32:00.000Z',
        metadata  : {
          estimated_completion : '2024-09-09T21:35:00.000Z',
          processing_step      : 'bank_authorization'
        }
      }
    }
  })
  @ApiResponse({ 
    status      : 404, 
    description : 'Pago no encontrado',
    schema      : {
      example    : {
        statusCode : 404,
        message    : 'Payment with ID pay_def456 not found',
        error      : 'Not Found'
      }
    }
  })
  // GET api/pagos/:id/status - Obtener estado de un pago
  async getPaymentStatus(@Param('id') id: string) {
    return await this.paymentService.getPaymentStatus(id);
  }
}

// TODO
// GET reembolso de pago por id
// GET todos los reembolsos
