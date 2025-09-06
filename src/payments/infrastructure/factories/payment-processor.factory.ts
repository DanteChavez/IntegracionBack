import { PaymentProcessor } from './payment-processor.interface';
import { PaymentValidator } from './payment-validator.interface';
import { PaymentNotifier }  from './payment-notifier.interface';

export abstract class PaymentProcessorFactory {
  abstract createProcessor(): PaymentProcessor;
  abstract createValidator(): PaymentValidator;
  abstract createNotifier() : PaymentNotifier;
  

  // TODO: Método template para crear toda la familia de objetos
  // createPaymentSuite(): PaymentSuite {
  //   return {
  //     processor: this.createProcessor(),
  //     validator: this.createValidator(),
  //     notifier: this.createNotifier(),
  //   };
  // }
}
