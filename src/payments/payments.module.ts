import { Module }                       from '@nestjs/common';
import { ConfigModule }                 from '@nestjs/config';
import { PaymentController }            from './presentation/controllers/payment.controller';
import { WebhookController }            from './presentation/controllers/webhook.controller';
import { PaymentApplicationService }    from './application/services/payment-application.service';
import { PaymentFactoryRegistry }       from './infrastructure/factories/payment-factory-registry.service';

@Module({
  imports: [
    ConfigModule,
    // TODO: Agregar otros módulos necesarios
    // DatabaseModule,
    // LoggerModule,
    // EventModule,
  ],
  controllers: [
    PaymentController,
    WebhookController,
  ],
  providers: [
    PaymentApplicationService,
    PaymentFactoryRegistry,
    // TODO: Registrar factories específicas
    // {
    //   provide: 'STRIPE_FACTORY',
    //   useClass: StripePaymentFactory,
    // },
    // {
    //   provide: 'PAYPAL_FACTORY',
    //   useClass: PayPalPaymentFactory,
    // },
    // TODO: Configurar registro dinámico de factories
    // {
    //   provide: 'PAYMENT_FACTORIES_SETUP',
    //   useFactory: (registry: PaymentFactoryRegistry) => {
    //     // Registrar factories disponibles según configuración
    //   },
    //   inject: [PaymentFactoryRegistry],
    // },
  ],
  exports: [
    PaymentApplicationService,
    PaymentFactoryRegistry,
  ],
})
export class PaymentsModule {}
