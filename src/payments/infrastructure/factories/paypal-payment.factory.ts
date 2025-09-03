import { PaymentProcessorFactory }  from './payment-processor.factory';
import { PaymentProcessor }         from './payment-processor.interface';
import { PaymentValidator }         from './payment-validator.interface';
import { PaymentNotifier }          from './payment-notifier.interface';

export class PayPalPaymentFactory extends PaymentProcessorFactory {
  createProcessor(): PaymentProcessor {
    // TODO: Retornar instancia de PayPalPaymentProcessor
    throw new Error('Method not implemented.');
  }

  createValidator(): PaymentValidator {
    // TODO: Retornar instancia de PayPalPaymentValidator
    throw new Error('Method not implemented.');
  }

  createNotifier(): PaymentNotifier {
    // TODO: Retornar instancia de PayPalPaymentNotifier
    throw new Error('Method not implemented.');
  }
}
