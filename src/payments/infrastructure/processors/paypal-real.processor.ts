import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as paypal from '@paypal/checkout-server-sdk';

@Injectable()
export class PayPalRealProcessor {
  private readonly logger = new Logger(PayPalRealProcessor.name);
  private client: paypal.core.PayPalHttpClient;

  constructor(private configService: ConfigService) {
    this.initializeClient();
  }

  private initializeClient() {
    try {
      const clientId = this.configService.get<string>('PAYPAL_CLIENT_ID');
      const clientSecret = this.configService.get<string>('PAYPAL_CLIENT_SECRET');
      const mode = this.configService.get<string>('PAYPAL_MODE', 'sandbox');

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
   * CREAR ORDEN (Ahora convierte CLP → USD antes de mandarlo a PayPal)
   */
  async createPayment(amountCLP: number, currency: string, metadata: any) {
    try {
      // Conversión CLP → USD
      // Ejemplo: 793 CLP → 0.79 USD
      const conversionRate = 1000; // 1 USD = 1000 CLP
      const amountUSD = (amountCLP / conversionRate).toFixed(2);

      const request = new paypal.orders.OrdersCreateRequest();
      request.prefer('return=representation');

      request.requestBody({
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: {
              currency_code: "USD",
              value: amountUSD, // 💵 Monto convertido a dólares
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

      this.logger.log(`🟢 PayPal order created: ${order.id}`);

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
   * CAPTURAR PAGO
   * Convertimos USD → CLP nuevamente para almacenar en tu sistema interno
   */
  async capturePayment(orderId: string) {
    try {
      const request = new paypal.orders.OrdersCaptureRequest(orderId);
      request.requestBody({});

      const response = await this.client.execute(request);
      const captureData = response.result;

      const capture = captureData.purchase_units[0].payments.captures[0];

      const currency = capture.amount.currency_code;
      const rawValue = capture.amount.value;

      let finalAmountCLP = 0;

      if (currency === 'USD') {
        const conversionRate = 1000; // 1 USD = 1000 CLP
        finalAmountCLP = Math.round(parseFloat(rawValue) * conversionRate);
      }

      this.logger.log(`🟢 PayPal payment captured: ${capture.id}`);

      return {
        success: true,
        transactionId: capture.id,
        status: capture.status,
        amount: finalAmountCLP, // Devuelto en CLP a tu backend
        currency: 'CLP',
        payerId: captureData.payer.payer_id,
        payerEmail: captureData.payer.email_address,
        createTime: capture.create_time,
      };
    } catch (error) {
      this.logger.error('❌ Error capturing PayPal payment:', error);
      throw new Error(`PayPal payment capture failed: ${error.message}`);
    }
  }

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

  async refundPayment(captureId: string, amountCLP?: number) {
    try {
      const request = new paypal.payments.CapturesRefundRequest(captureId);

      if (amountCLP) {
        const conversionRate = 1000;
        const amountUSD = (amountCLP / conversionRate).toFixed(2);

        request.requestBody({
          amount: {
            currency_code: "USD",
            value: amountUSD,
          },
        });
      }

      const response = await this.client.execute(request);
      const refund = response.result;

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
