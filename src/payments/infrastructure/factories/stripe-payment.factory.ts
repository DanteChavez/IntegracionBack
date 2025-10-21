import { PaymentProcessorFactory }  from './payment-processor.factory';
import { PaymentProcessor }         from './payment-processor.interface';
import { PaymentValidator }         from './payment-validator.interface';
import { PaymentNotifier }          from './payment-notifier.interface';

export class StripePaymentFactory extends PaymentProcessorFactory {
  createProcessor(): PaymentProcessor {
    // TODO: Retornar instancia de StripePaymentProcessor
    throw new Error('Method not implemented.');
  }

  createValidator(): PaymentValidator {
    // TODO: Retornar instancia de StripePaymentValidator
    throw new Error('Method not implemented.');
  }

  createNotifier(): PaymentNotifier {
    // TODO: Retornar instancia de StripePaymentNotifier
    throw new Error('Method not implemented.');
  }
}
