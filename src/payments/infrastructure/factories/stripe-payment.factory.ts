import { Injectable } from '@nestjs/common';
import { PaymentProcessorFactory }  from './payment-processor.factory';
import { PaymentProcessor }         from './payment-processor.interface';
import { PaymentValidator }         from './payment-validator.interface';
import { PaymentNotifier }          from './payment-notifier.interface';
import { StripePaymentProcessor }   from '../processors/stripe-payment.processor';

@Injectable()
export class StripePaymentFactory extends PaymentProcessorFactory {
  constructor(private readonly stripeProcessor: StripePaymentProcessor) {
    super();
  }

  createProcessor(): PaymentProcessor {
    return this.stripeProcessor;
  }

  createValidator(): PaymentValidator {
    // TODO: Implementar validador específico de Stripe si es necesario
    // Por ahora, la validación se hace en el application service
    return null;
  }

  createNotifier(): PaymentNotifier {
    // TODO: Implementar notificador específico de Stripe si es necesario
    // Por ahora, las notificaciones se manejan vía webhooks
    return null;
  }
}

