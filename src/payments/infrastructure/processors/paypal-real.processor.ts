import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as paypal from '@paypal/checkout-server-sdk';

/**
 * PayPal Payment Processor - Integración Real con PayPal SDK
 * Soporta CLP correctamente (sin decimales) y USD con decimales.
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

      if (!clientId || !clientSecret) {
        throw new Error('PayPal credentials not configured');
      }

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
   * Crea una orden de pago (CLP soportado)
   */
  async createPayment(amount: number, currency: string, metadata: any) {
    try {
      const request = new paypal.orders.OrdersCreateRequest();
      request.prefer('return=representation');

      // CLP no tiene decimales → PayPal requiere ENTERO
      const formattedAmount =
        currency === 'CLP'
          ? amount.toString() // ejemplo: 793
          : (amount / 100).toFixed(2); // ejemplo USD: 793 → 7.93

      request.requestBody({
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: {
              currency_code: currency,
              value: formattedAmount,
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

      const approvalLink = order.links.find((link) => link.rel === 'approve');

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
   */
  async capturePayment(orderId: string) {
    try {
      const request = new paypal.orders.OrdersCaptureRequest(orderId);
      request.requestBody({});

      const response = await this.client.execute(request);
      const captureData = response.result;

      const capture = captureData.purchase_units[0].payments.captures[0];

      const currency = capture.amount.currency_code;
      const rawValue = capture.amount.value; // string

      // Normalizar monto para devolverlo al sistema interno
      const normalizedAmount =
        currency === 'CLP'
          ? parseInt(rawValue) // CLP → no decimales
          : Math.round(parseFloat(rawValue) * 100); // USD → centavos

      this.logger.log(`✅ PayPal payment captured: ${capture.id}`);

      return {
        success: true,
        transactionId: capture.id,
        status: capture.status,
        amount: normalizedAmount,
        currency,
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
   * Reembolsa una transacción (Refund)
   */
  async refundPayment(captureId: string, amount?: number, currency?: string) {
    try {
      const request = new paypal.payments.CapturesRefundRequest(captureId);

      if (amount && currency) {
        const formatted =
          currency === 'CLP'
            ? amount.toString()
            : (amount / 100).toFixed(2);

        request.requestBody({
          amount: {
            currency_code: currency,
            value: formatted,
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
        amount: refund.amount?.value,
        currency: refund.amount?.currency_code,
      };
    } catch (error) {
      this.logger.error('❌ Error refunding PayPal payment:', error);
      throw new Error(`PayPal refund failed: ${error.message}`);
    }
  }
}
