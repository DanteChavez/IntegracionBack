import { Controller, Post, Body, Param, Headers } from '@nestjs/common';
import { PaymentApplicationService } from '../../application/services/payment-application.service';

@Controller('webhooks')
export class WebhookController {
  constructor(
    private readonly paymentService: PaymentApplicationService,
  ) {}

  // TODO: Implementar endpoints para webhooks
  // @Post('stripe')
  // async handleStripeWebhook(
  //   @Body() body: any,
  //   @Headers('stripe-signature') signature: string,
  // ) {
  //   return await this.paymentService.handleWebhook('stripe', { body, signature });
  // }

  // @Post('paypal')
  // async handlePayPalWebhook(@Body() body: any) {
  //   return await this.paymentService.handleWebhook('paypal', body);
  // }

  // @Post('mercadopago')
  // async handleMercadoPagoWebhook(@Body() body: any) {
  //   return await this.paymentService.handleWebhook('mercado_pago', body);
  // }

  // TODO: Agregar middleware para verificar signatures de webhooks
}
