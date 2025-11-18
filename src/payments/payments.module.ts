import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ConfigModule }                 from '@nestjs/config';
import { ThrottlerModule }              from '@nestjs/throttler';
import { TypeOrmModule }                from '@nestjs/typeorm';
import { PaymentController }            from './presentation/controllers/payment.controller';
import { WebhookController }            from './presentation/controllers/webhook.controller';
import { PayPalController }             from './presentation/controllers/paypal.controller';
import { PaymentApplicationService }    from './application/services/payment-application.service';
import { PaymentFactoryRegistry }       from './infrastructure/factories/payment-factory-registry.service';
import { SecurityAuditService }         from './infrastructure/services/security-audit.service';
import { PaymentConfirmationService }   from './infrastructure/services/payment-confirmation.service';
import { PaymentAttemptGuard }          from './infrastructure/guards/payment-attempt.guard';
import { 
  DataSanitizationMiddleware, 
  SecurityHeadersMiddleware, 
  HttpsOnlyMiddleware,
  SecurityContextMiddleware,
} from './infrastructure/middleware/security.middleware';

// Payment Processors
import { StripePaymentProcessor }  from './infrastructure/processors/stripe-payment.processor';
import { PayPalPaymentProcessor }  from './infrastructure/processors/paypal-payment.processor';
import { WebpayPaymentProcessor }  from './infrastructure/processors/webpay-payment.processor';
import { PayPalRealProcessor }     from './infrastructure/processors/paypal-real.processor';

// Payment Factories
import { StripePaymentFactory }    from './infrastructure/factories/stripe-payment.factory';
import { PayPalPaymentFactory }    from './infrastructure/factories/paypal-payment.factory';
import { WebpayPaymentFactory }    from './infrastructure/factories/webpay-payment.factory';

// Payment Domain
import { PaymentProvider }         from './domain/entities/payment.entity';

// Database
import { PagoEntity }              from './infrastructure/database/entities/pago.entity';
import { HistorialErrorEntity }    from './infrastructure/database/entities/historial-error.entity';
import { PagoRepository }          from './infrastructure/database/repositories/pago.repository';

@Module({
  imports: [
    ConfigModule,
    // TypeORM para entidades de pago
    TypeOrmModule.forFeature([PagoEntity, HistorialErrorEntity]),
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
    PayPalController,
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
    
    // Repositorio de base de datos
    PagoRepository,
    
    // Payment Processors
    StripePaymentProcessor,
    PayPalPaymentProcessor,
    WebpayPaymentProcessor,
    PayPalRealProcessor,
    
    // Payment Factories
    StripePaymentFactory,
    PayPalPaymentFactory,
    WebpayPaymentFactory,
    
    // Configurar registro dinámico de factories al inicializar
    {
      provide: 'PAYMENT_FACTORIES_SETUP',
      useFactory: (
        registry: PaymentFactoryRegistry,
        stripeFactory: StripePaymentFactory,
        paypalFactory: PayPalPaymentFactory,
        webpayFactory: WebpayPaymentFactory,
      ) => {
        // Registrar todas las factories disponibles
        registry.register(PaymentProvider.STRIPE, stripeFactory);
        registry.register(PaymentProvider.PAYPAL, paypalFactory);
        registry.register(PaymentProvider.WEBPAY, webpayFactory);
        return registry;
      },
      inject: [
        PaymentFactoryRegistry,
        StripePaymentFactory,
        PayPalPaymentFactory,
        WebpayPaymentFactory,
      ],
    },
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
    // Orden de middlewares (importante):
    // 1. Extraer contexto de seguridad (sessionId, userId, ipAddress)
    consumer
      .apply(SecurityContextMiddleware)
      .forRoutes(PaymentController, WebhookController);

    // 2. CA1: Forzar HTTPS en producción
    consumer
      .apply(HttpsOnlyMiddleware)
      .forRoutes(PaymentController, WebhookController);

    // 3. CA1, CA6: Headers de seguridad HTTP
    consumer
      .apply(SecurityHeadersMiddleware)
      .forRoutes(PaymentController, WebhookController);

    // 4. CA6: Sanitización de datos sensibles
    consumer
      .apply(DataSanitizationMiddleware)
      .forRoutes(
        { path: 'pagos', method: RequestMethod.POST },
        { path: 'pagos/:id', method: RequestMethod.PATCH },
        { path: 'pagos/confirm-amount', method: RequestMethod.POST },
      );
  }
}
