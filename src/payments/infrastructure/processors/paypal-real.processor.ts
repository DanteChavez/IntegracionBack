import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as paypal from '@paypal/checkout-server-sdk';

/**
 * PayPal Payment Processor - Integración Real con PayPal SDK
 * HU4: Pago con PayPal
 * 
 * Implementa la integración completa con PayPal usando el SDK oficial
 * Maneja creación de pagos, ejecución y webhooks
 */
@Injectable()
export class PayPalRealProcessor {
  private readonly logger = new Logger(PayPalRealProcessor.name);
  private client: paypal.core.PayPalHttpClient;

  constructor(private configService: ConfigService) {
    this.initializeClient();
  }

  /**
   * Inicializa el cliente de PayPal con credenciales del entorno
   */
  private initializeClient() {
    try {
      const clientId = this.configService.get<string>('PAYPAL_CLIENT_ID');
      const clientSecret = this.configService.get<string>('PAYPAL_CLIENT_SECRET');
      const mode = this.configService.get<string>('PAYPAL_MODE', 'sandbox');

      this.logger.log(`🔑 PayPal Config - Mode: ${mode}`);
      this.logger.log(`🔑 PayPal Config - Client ID length: ${clientId?.length || 0}`);
      this.logger.log(`🔑 PayPal Config - Secret length: ${clientSecret?.length || 0}`);
      this.logger.log(`🔑 PayPal Config - Client ID starts with: ${clientId?.substring(0, 10)}...`);

      if (!clientId || !clientSecret) {
        throw new Error('PayPal credentials not configured');
      }

      // Configurar entorno (sandbox o production)
      let environment;
      if (mode === 'production') {
        environment = new paypal.core.LiveEnvironment(clientId, clientSecret);
      } else {
        environment = new paypal.core.SandboxEnvironment(clientId, clientSecret);
      }

      this.client = new paypal.core.PayPalHttpClient(environment);
      
      this.logger.log(`✅ PayPal Client initialized in ${mode} mode`);
    } catch (error) {
      this.logger.error('❌ Failed to initialize PayPal client:', error.message);
      throw error;
    }
  }

  /**
   * Crea una orden de pago en PayPal
   * CA1, CA2: Permite seleccionar PayPal y redirige al entorno seguro
   */
  async createPayment(amount: number, currency: string, metadata: any) {
    try {
      const request = new paypal.orders.OrdersCreateRequest();
      request.prefer('return=representation');
      request.requestBody({
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: {
              currency_code: currency,
              value: (amount / 1000).toFixed(2), // Convertir de centavos a unidad
            },
            description: `Pedido #${metadata.sessionId || 'N/A'}`,
            custom_id: metadata.sessionId,
            reference_id: metadata.userId,
          },
        ],
        application_context: {
          return_url: this.configService.get<string>('PAYPAL_RETURN_URL'),
          cancel_url: this.configService.get<string>('PAYPAL_CANCEL_URL'),
          brand_name: 'PulgaShop',
          landing_page: 'BILLING',
          user_action: 'PAY_NOW',
        },
      });

      const response = await this.client.execute(request);
      const order = response.result;

      // CA3: Obtener el link de aprobación para redirigir al usuario
      const approvalLink = order.links.find(link => link.rel === 'approve');

      this.logger.log(`✅ PayPal order created: ${order.id}`);

      return {
        success: true,
        orderId: order.id,
        approvalUrl: approvalLink?.href,
        status: order.status,
      };
    } catch (error) {
      this.logger.error('❌ Error creating PayPal order:', error);
      throw new Error(`PayPal order creation failed: ${error.message}`);
    }
  }

  /**
   * Captura (ejecuta) un pago aprobado por el usuario
   * CA4: Valida el token de autenticación devuelto por PayPal
   */
  async capturePayment(orderId: string) {
    try {
      const request = new paypal.orders.OrdersCaptureRequest(orderId);
      request.requestBody({});

      const response = await this.client.execute(request);
      const captureData = response.result;

      // Extraer información de la transacción
      const capture = captureData.purchase_units[0].payments.captures[0];

      this.logger.log(`✅ PayPal payment captured: ${capture.id}`);

      return {
        success: true,
        transactionId: capture.id,
        status: capture.status,
        amount: parseFloat(capture.amount.value) * 100, // Convertir a centavos
        currency: capture.amount.currency_code,
        payerId: captureData.payer.payer_id,
        payerEmail: captureData.payer.email_address,
        createTime: capture.create_time,
      };
    } catch (error) {
      this.logger.error('❌ Error capturing PayPal payment:', error);
      throw new Error(`PayPal payment capture failed: ${error.message}`);
    }
  }

  /**
   * Obtiene detalles de una orden de PayPal
   */
  async getOrderDetails(orderId: string) {
    try {
      const request = new paypal.orders.OrdersGetRequest(orderId);
      const response = await this.client.execute(request);
      
      return response.result;
    } catch (error) {
      this.logger.error('❌ Error getting PayPal order details:', error);
      throw new Error(`Failed to get order details: ${error.message}`);
    }
  }

  /**
   * Reembolsa una transacción de PayPal
   * CA9: Permite la reversión del pago
   */
  async refundPayment(captureId: string, amount?: number, currency?: string) {
    try {
      const request = new paypal.payments.CapturesRefundRequest(captureId);
      
      if (amount && currency) {
        request.requestBody({
          amount: {
            currency_code: currency,
            value: (amount / 1000).toFixed(2),
          },
        });
      }

      const response = await this.client.execute(request);
      const refund = response.result;

      this.logger.log(`✅ PayPal refund created: ${refund.id}`);

      return {
        success: true,
        refundId: refund.id,
        status: refund.status,
        amount: parseFloat(refund.amount.value) * 100,
        currency: refund.amount.currency_code,
      };
    } catch (error) {
      this.logger.error('❌ Error refunding PayPal payment:', error);
      throw new Error(`PayPal refund failed: ${error.message}`);
    }
  }
}
