import { Injectable } from '@nestjs/common';
import { PaymentProcessorFactory }  from './payment-processor.factory';
import { PaymentProcessor }         from './payment-processor.interface';
import { PaymentValidator }         from './payment-validator.interface';
import { PaymentNotifier }          from './payment-notifier.interface';
import { PayPalPaymentProcessor }   from '../processors/paypal-payment.processor';

@Injectable()
export class PayPalPaymentFactory extends PaymentProcessorFactory {
  constructor(private readonly paypalProcessor: PayPalPaymentProcessor) {
    super();
  }

  createProcessor(): PaymentProcessor {
    return this.paypalProcessor;
  }

  createValidator(): PaymentValidator {
    // TODO: Implementar validador específico de PayPal si es necesario
    // Por ahora, la validación se hace en el application service
    return null;
  }

  createNotifier(): PaymentNotifier {
    // TODO: Implementar notificador específico de PayPal si es necesario
    // Por ahora, las notificaciones se manejan vía webhooks/IPN
    return null;
  }
}
