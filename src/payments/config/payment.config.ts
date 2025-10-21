export interface PaymentConfig {
  providers: {
    stripe?: {
      apiKey        : string;
      webhookSecret : string;
      apiVersion?   : string;
    };
    paypal?: {
      clientId      : string;
      clientSecret  : string;
      environment   : 'sandbox' | 'production';
    };
    mercadoPago?: {
      accessToken   : string;
      publicKey     : string;
      webhookSecret : string;
    };
    crypto?: {
      networks      : string[];
      confirmations : number;
    };
  };
  // TODO: Agregar configuraciones globales
  // defaultCurrency: string;
  // maxRetries: number;
  // timeoutMs: number;
  // enabledProviders: PaymentProvider[];
}

// TODO: Implementar función de configuración
// export const paymentConfig = (): PaymentConfig => ({
//   providers: {
//     stripe: {
//       apiKey: process.env.STRIPE_API_KEY,
//       webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
//     },
//     paypal: {
//       clientId: process.env.PAYPAL_CLIENT_ID,
//       clientSecret: process.env.PAYPAL_CLIENT_SECRET,
//       environment: process.env.PAYPAL_ENVIRONMENT as 'sandbox' | 'production',
//     },
//   },
// });
