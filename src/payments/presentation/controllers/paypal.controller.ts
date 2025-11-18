import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  HttpStatus,
  HttpException,
  Logger,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { PayPalRealProcessor } from '../../infrastructure/processors/paypal-real.processor';
import { CreatePayPalPaymentDto } from '../../application/dto/create-paypal-payment.dto';
import { ExecutePayPalPaymentDto } from '../../application/dto/execute-paypal-payment.dto';
import { PagoRepository } from '../../infrastructure/database/repositories/pago.repository';

/**
 * Controlador de PayPal
 * HU4: Implementación completa de pagos con PayPal
 * 
 * Endpoints:
 * - POST /paypal/create-payment: Crea una orden de pago (CA1, CA2)
 * - POST /paypal/execute-payment: Ejecuta el pago aprobado (CA3, CA4, CA5)
 * - POST /paypal/webhook: Recibe notificaciones de PayPal (CA6, CA7)
 * - GET /paypal/order/:orderId: Obtiene detalles de una orden
 * - POST /paypal/refund/:captureId: Reembolsa un pago (CA9)
 */
@ApiTags('paypal')
@Controller('paypal')
export class PayPalController {
  private readonly logger = new Logger(PayPalController.name);

  constructor(
    private readonly paypalProcessor: PayPalRealProcessor,
    private readonly pagoRepository: PagoRepository,
  ) {}

  /**
   * CA1, CA2: Crea una orden de pago en PayPal y retorna el link de aprobación
   */
  @Post('create-payment')
  @ApiOperation({
    summary: 'Crear orden de pago en PayPal',
    description: 'Inicia el proceso de pago creando una orden en PayPal y devuelve el enlace de aprobación',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Orden de pago creada exitosamente',
    schema: {
      example: {
        success: true,
        orderId: 'ORDER123456789',
        approvalUrl: 'https://www.sandbox.paypal.com/checkoutnow?token=EC-TOKEN123',
        message: 'Redirect user to approvalUrl to complete payment',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Error al crear la orden de pago',
  })
  async createPayment(@Body() dto: CreatePayPalPaymentDto) {
    try {
      this.logger.log(`Creating PayPal payment for session: ${dto.sessionId}`);

      // Crear orden en PayPal
      const result = await this.paypalProcessor.createPayment(
        dto.amount,
        dto.currency,
        {
          sessionId: dto.sessionId,
          userId: dto.userId,
          ...dto.metadata,
        },
      );

      // Registrar pago pendiente en la base de datos
      await this.pagoRepository.crearPago({
        idUsuario: dto.userId || 'anonymous',
        idCarrito: dto.sessionId,
        monto: dto.amount / 100, // Convertir a unidad monetaria
        tipoMoneda: dto.currency,
        proveedor: 'paypal',
        estado: 'PENDING',
        metadata: {
          paypalOrderId: result.orderId,
          sessionId: dto.sessionId,
          userId: dto.userId,
        },
      });

      return {
        ...result,
        message: 'Redirect user to approvalUrl to complete payment',
      };
    } catch (error) {
      this.logger.error('Error creating PayPal payment:', error);
      throw new HttpException(
        `Failed to create PayPal payment: ${error.message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * CA3, CA4, CA5: Ejecuta el pago después de que el usuario lo aprueba en PayPal
   */
  @Post('execute-payment')
  @ApiOperation({
    summary: 'Ejecutar pago aprobado de PayPal',
    description: 'Captura el pago después de que el usuario lo aprueba en la interfaz de PayPal',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Pago ejecutado y confirmado exitosamente',
    schema: {
      example: {
        success: true,
        transactionId: 'CAPTURE123456789',
        status: 'COMPLETED',
        amount: 5000,
        currency: 'USD',
        payerEmail: 'buyer@example.com',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Error al ejecutar el pago',
  })
  async executePayment(@Body() dto: ExecutePayPalPaymentDto) {
    try {
      this.logger.log(`Executing PayPal payment for order: ${dto.orderId}`);

      // CA4: Capturar el pago (valida automáticamente el token)
      const result = await this.paypalProcessor.capturePayment(dto.orderId);

      if (result.success && result.status === 'COMPLETED') {
        // CA5: Actualizar el estado del pago en la base de datos
        await this.pagoRepository.marcarComoExitoso(
          dto.orderId,
          result.transactionId,
          {
            payerId: result.payerId,
            payerEmail: result.payerEmail,
            captureTime: result.createTime,
          },
        );

        this.logger.log(`✅ Payment successful: ${result.transactionId}`);
        
        // TODO: CA5: Notificar al módulo de carrito
        // await this.notifyCart(dto.orderId, 'PAID');
      }

      return result;
    } catch (error) {
      this.logger.error('Error executing PayPal payment:', error);
      
      // CA6: Registrar el intento fallido
      try {
        await this.pagoRepository.marcarPayPalComoFallido(
          dto.orderId,
          `Error: ${error.message}`,
        );
      } catch (dbError) {
        this.logger.error('Error updating payment status:', dbError);
      }

      throw new HttpException(
        `Failed to execute PayPal payment: ${error.message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Webhook para recibir notificaciones de PayPal
   * CA6, CA7: Manejo seguro de webhooks
   */
  @Post('webhook')
  @ApiOperation({
    summary: 'Webhook de PayPal',
    description: 'Recibe notificaciones automáticas de PayPal sobre cambios en el estado de pagos',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Webhook procesado correctamente',
  })
  async handleWebhook(@Body() payload: any) {
    try {
      this.logger.log(`Received PayPal webhook: ${payload.event_type}`);

      // TODO: CA7: Validar la firma del webhook
      // const isValid = await this.paypalProcessor.verifyWebhookSignature(payload, headers);
      // if (!isValid) {
      //   throw new Error('Invalid webhook signature');
      // }

      // Procesar eventos relevantes
      switch (payload.event_type) {
        case 'PAYMENT.CAPTURE.COMPLETED':
          await this.handlePaymentCaptured(payload);
          break;
        case 'PAYMENT.CAPTURE.DENIED':
        case 'PAYMENT.CAPTURE.DECLINED':
          await this.handlePaymentFailed(payload);
          break;
        case 'PAYMENT.CAPTURE.REFUNDED':
          await this.handlePaymentRefunded(payload);
          break;
        default:
          this.logger.warn(`Unhandled webhook event: ${payload.event_type}`);
      }

      return { received: true };
    } catch (error) {
      this.logger.error('Error processing PayPal webhook:', error);
      throw new HttpException(
        'Webhook processing failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Obtiene detalles de una orden de PayPal
   */
  @Get('order/:orderId')
  @ApiOperation({
    summary: 'Obtener detalles de orden PayPal',
    description: 'Consulta el estado y detalles de una orden de PayPal',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Detalles de la orden obtenidos correctamente',
  })
  async getOrderDetails(@Param('orderId') orderId: string) {
    try {
      const details = await this.paypalProcessor.getOrderDetails(orderId);
      return { success: true, order: details };
    } catch (error) {
      this.logger.error(`Error getting order details: ${error.message}`);
      throw new HttpException(
        `Failed to get order details: ${error.message}`,
        HttpStatus.NOT_FOUND,
      );
    }
  }

  /**
   * CA9: Reembolsa un pago de PayPal
   */
  @Post('refund/:captureId')
  @ApiOperation({
    summary: 'Reembolsar pago de PayPal',
    description: 'Crea un reembolso total o parcial para un pago capturado',
  })
  @ApiQuery({ name: 'amount', required: false, description: 'Monto a reembolsar (en centavos)' })
  @ApiQuery({ name: 'currency', required: false, description: 'Código de moneda' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Reembolso procesado exitosamente',
  })
  async refundPayment(
    @Param('captureId') captureId: string,
    @Query('amount') amount?: number,
    @Query('currency') currency?: string,
  ) {
    try {
      const result = await this.paypalProcessor.refundPayment(
        captureId,
        amount ? parseInt(amount.toString()) : undefined,
        currency,
      );

      // Actualizar estado en la base de datos
      await this.pagoRepository.marcarComoReembolsado(captureId, result.refundId);

      return result;
    } catch (error) {
      this.logger.error(`Error refunding payment: ${error.message}`);
      throw new HttpException(
        `Failed to refund payment: ${error.message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // Métodos privados para procesar eventos de webhook

  private async handlePaymentCaptured(payload: any) {
    const captureId = payload.resource.id;
    const orderId = payload.resource.supplementary_data?.related_ids?.order_id;

    this.logger.log(`Payment captured: ${captureId}`);
    
    if (orderId) {
      await this.pagoRepository.marcarComoExitoso(orderId, captureId, {
        webhookReceived: true,
        eventType: payload.event_type,
      });
    }
  }

  private async handlePaymentFailed(payload: any) {
    const orderId = payload.resource.supplementary_data?.related_ids?.order_id;

    this.logger.warn(`Payment failed: ${payload.event_type}`);
    
    if (orderId) {
      const reason = payload.resource.status_details?.reason || 'Unknown';
      await this.pagoRepository.marcarPayPalComoFallido(
        orderId,
        `${payload.event_type}: ${reason}`,
      );
    }
  }

  private async handlePaymentRefunded(payload: any) {
    const refundId = payload.resource.id;
    const captureId = payload.resource.links?.find(l => l.rel === 'up')?.href.split('/').pop();

    this.logger.log(`Payment refunded: ${refundId}`);
    
    if (captureId) {
      await this.pagoRepository.marcarComoReembolsado(captureId, refundId);
    }
  }
}
