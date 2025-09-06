import { Injectable }               from '@nestjs/common';
import { PaymentFactoryRegistry }   from '../../infrastructure/factories/payment-factory-registry.service';
import { ProcessPaymentDto }        from '../dto/process-payment.dto';
import { RefundPaymentDto }         from '../dto/refund-payment.dto';
import { Payment }                  from '../../domain/entities/payment.entity';

@Injectable()
export class PaymentApplicationService {
  constructor(
    private readonly factoryRegistry: PaymentFactoryRegistry,
  ) {
  }
  async processPayment(dto: ProcessPaymentDto): Promise<Payment> {
        const factory = this.factoryRegistry.getFactory(dto.provider);
        const processor = factory.createProcessor();
        const validator = factory.createValidator();

      // await validator.validatePaymentData(dto);
      throw new Error('unfinished method');
      //return await processor.processPayment(dto);
      }
  // TODO: Implementar casos de uso de la aplicación

  // async refundPayment(dto: RefundPaymentDto): Promise<Payment> {
  //   // Obtener el pago original para determinar el proveedor
  //   // Validar que se puede hacer refund
  //   // Procesar refund usando el processor apropiado
  // }

  // async cancelPayment(paymentId: string): Promise<Payment> {
  //   // Lógica similar para cancelación
  // }

  // async getPaymentStatus(paymentId: string): Promise<string> {
  //   // Consultar status del pago
  // }

  // async handleWebhook(provider: string, webhookData: any): Promise<void> {
  //   // Manejar webhooks por proveedor
  // }
}
function getPaymentStatus(id: any) {
  throw new Error('Function not implemented.');
}

