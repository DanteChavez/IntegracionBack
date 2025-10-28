import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ConfigModule }                 from '@nestjs/config';
import { ThrottlerModule }              from '@nestjs/throttler';
import { PaymentController }            from './presentation/controllers/payment.controller';
import { WebhookController }            from './presentation/controllers/webhook.controller';
import { PaymentApplicationService }    from './application/services/payment-application.service';
import { PaymentFactoryRegistry }       from './infrastructure/factories/payment-factory-registry.service';
import { SecurityAuditService }         from './infrastructure/services/security-audit.service';
import { PaymentConfirmationService }   from './infrastructure/services/payment-confirmation.service';
import { PaymentAttemptGuard }          from './infrastructure/guards/payment-attempt.guard';
import { 
  DataSanitizationMiddleware, 
  SecurityHeadersMiddleware, 
  HttpsOnlyMiddleware 
} from './infrastructure/middleware/security.middleware';

@Module({
  imports: [
    ConfigModule,
    // CA4: Throttling global para prevenir ataques de fuerza bruta
    ThrottlerModule.forRoot([{
      ttl: 60000,      // 60 segundos
      limit: 10,       // 10 requests por minuto por IP
    }]),
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
    // Servicios de aplicación
    PaymentApplicationService,
    PaymentFactoryRegistry,
    
    // CA5: Servicios de seguridad y auditoría
    SecurityAuditService,
    PaymentConfirmationService,
    
    // CA4: Guards de seguridad
    PaymentAttemptGuard,
    
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
    SecurityAuditService,
    PaymentConfirmationService,
  ],
})
export class PaymentsModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // CA1: Forzar HTTPS en producción
    consumer
      .apply(HttpsOnlyMiddleware)
      .forRoutes(PaymentController, WebhookController);

    // CA1, CA6: Headers de seguridad HTTP
    consumer
      .apply(SecurityHeadersMiddleware)
      .forRoutes(PaymentController, WebhookController);

    // CA6: Sanitización de datos sensibles
    consumer
      .apply(DataSanitizationMiddleware)
      .forRoutes(
        { path: 'pagos', method: RequestMethod.POST },
        { path: 'pagos/:id', method: RequestMethod.PATCH },
        { path: 'pagos/confirm-amount', method: RequestMethod.POST },
      );
  }
}
