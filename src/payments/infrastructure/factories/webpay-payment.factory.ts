import { Injectable } from '@nestjs/common';
import { PaymentProcessorFactory }  from './payment-processor.factory';
import { PaymentProcessor }         from './payment-processor.interface';
import { PaymentValidator }         from './payment-validator.interface';
import { PaymentNotifier }          from './payment-notifier.interface';
import { WebpayPaymentProcessor }   from '../processors/webpay-payment.processor';

@Injectable()
export class WebpayPaymentFactory extends PaymentProcessorFactory {
  constructor(private readonly webpayProcessor: WebpayPaymentProcessor) {
    super();
  }

  createProcessor(): PaymentProcessor {
    return this.webpayProcessor;
  }

  createValidator(): PaymentValidator {
    // TODO: Implementar validador específico de Webpay si es necesario
    // Por ahora, la validación se hace en el application service
    return null;
  }

  createNotifier(): PaymentNotifier {
    // TODO: Implementar notificador específico de Webpay si es necesario
    // Webpay usa redirect flow, no webhooks tradicionales
    return null;
  }
}
