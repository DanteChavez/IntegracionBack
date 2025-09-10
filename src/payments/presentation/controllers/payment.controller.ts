import { Controller, Post, Body, Get, Param, Patch, HttpStatus, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { PaymentApplicationService } from '../../application/services/payment-application.service';
import { ProcessPaymentDto } from '../../application/dto/process-payment.dto';
import { RefundPaymentDto } from '../../application/dto/refund-payment.dto';

@ApiTags('pagos')
@Controller('pagos')
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentApplicationService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary     : 'Crear un nuevo pago',
    description : 'Crea un nuevo pago con validaciones específicas según el proveedor seleccionado. Cada proveedor requiere campos específicos obligatorios.'
  })
  @ApiBody({
    type      : ProcessPaymentDto,
    examples  : {
      stripe: {
        summary     : 'Pago con Stripe',
        description : 'Ejemplo de pago usando Stripe (requiere customerId)',
        value       : {
          amount      : 100,
          currency    : 'USD',
          provider    : 'stripe',
          customerId  : 'cus_1234567890',
          description : 'Pago con tarjeta de crédito',
          metadata    : {
            idCarrito  : 'CART_123',
            idUsuario  : 'USER_456'
          }
        }
      },
      webpay: {
        summary     : 'Pago con Webpay',
        description : 'Ejemplo de pago usando Webpay (requiere returnUrl)',
        value       : {
          amount      : 25000,
          currency    : 'CLP',
          provider    : 'webpay',
          returnUrl   : 'https://mi-tienda.com/webpay/return',
          description : 'Pago con transferencia bancaria',
          metadata    : {
            idCarrito  : 'CART_789',
            idUsuario  : 'USER_123'
          }
        }
      },
      paypal: {
        summary     : 'Pago con PayPal',
        description : 'Ejemplo de pago usando PayPal (requiere cancelUrl)',
        value       : {
          amount      : 75.99,
          currency    : 'USD',
          provider    : 'paypal',
          cancelUrl   : 'https://mi-tienda.com/paypal/cancel',
          description : 'Pago con wallet digital',
          metadata    : {
            subscriptionId  : 'SUB_456'
          }
        }
      }
    }
  })
  @ApiResponse({ 
    status      : 201, 
    description : 'Pago creado exitosamente',
    schema      : {
      example    : {
        id        : 'pay_1699876543210_abc123',
        amount    : 100,
        currency  : 'USD',
        provider  : 'stripe',
        status    : 'pending',
        metadata  : {
          idCarrito : 'CART_123',
          idUsuario : 'USER_456'
        },
        createdAt : '2024-09-09T21:30:00.000Z'
      }
    }
  })
  @ApiResponse({ 
    status      : 400, 
    description : 'Datos de validación incorrectos',
    schema      : {
      example    : {
        message     : ['customerId must be a string'],
        error       : 'Bad Request',
        statusCode  : 400
      }
    }
  })
  @ApiResponse({ 
    status      : 422, 
    description : 'Error de validación de reglas de negocio',
    schema      : {
      example    : {
        message     : 'Invalid payment method for selected provider',
        error       : 'Unprocessable Entity',
        statusCode  : 422
      }
    }
  })
  // POST api/pagos - Crear un nuevo pago
  async createPayment(@Body() dto: ProcessPaymentDto) {
    return await this.paymentService.processPayment(dto);
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
