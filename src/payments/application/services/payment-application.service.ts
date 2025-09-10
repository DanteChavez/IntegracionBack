import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PaymentFactoryRegistry }   from '../../infrastructure/factories/payment-factory-registry.service';
import { ProcessPaymentDto }        from '../dto/process-payment.dto';
import { RefundPaymentDto }         from '../dto/refund-payment.dto';
import { Payment, PaymentStatus, PaymentProvider } from '../../domain/entities/payment.entity';

@Injectable()
export class PaymentApplicationService {
  // Simulamos una base de datos en memoria para los ejemplos
  private payments: Map<string, Payment> = new Map();
  
  constructor(
    private readonly factoryRegistry: PaymentFactoryRegistry,
  ) {}

  // Procesar un nuevo pago
  async processPayment(dto: ProcessPaymentDto): Promise<Payment> {
    const factory = this.factoryRegistry.getFactory(dto.provider);
    const processor = factory.createProcessor();
    const validator = factory.createValidator();

    // Validar datos del pago
    // await validator.validatePaymentData(dto);
    
    // Crear nueva instancia de Payment
    const paymentId = this.generatePaymentId();
    const payment = new Payment(
      paymentId,
      dto.amount,
      dto.currency || 'USD',
      dto.provider,
      PaymentStatus.PENDING,
      dto.metadata,
      new Date()
    );
    
    // Guardar pago en "base de datos"
    this.payments.set(paymentId, payment);
    
    try {
      // Procesar pago con el proveedor correspondiente
      // const result = await processor.processPayment(dto);
      
      // Simular procesamiento exitoso
      payment.updateStatus(PaymentStatus.PROCESSING);
      setTimeout(() => {
        payment.updateStatus(PaymentStatus.COMPLETED);
      }, 1000);
      
      return payment;
    } catch (error) {
      payment.updateStatus(PaymentStatus.FAILED);
      throw error;
    }
  }

  // Obtener todos los pagos
  async getAllPayments(): Promise<Payment[]> {
    return Array.from(this.payments.values());
  }

  // Obtener un pago por ID
  async getPaymentById(paymentId: string): Promise<Payment> {
    const payment = this.payments.get(paymentId);
    if (!payment) {
      throw new NotFoundException(`Payment with ID ${paymentId} not found`);
    }
    return payment;
  }

  // Reembolsar un pago
  async refundPayment(dto: RefundPaymentDto): Promise<Payment> {
    const payment = await this.getPaymentById(dto.paymentId);
    
    if (!payment.canBeRefunded()) {
      throw new BadRequestException('Payment cannot be refunded');
    }
    
    const factory = this.factoryRegistry.getFactory(payment.provider);
    const processor = factory.createProcessor();
    
    try {
      // Procesar reembolso con el proveedor
      // await processor.refundPayment(dto);
      
      payment.updateStatus(PaymentStatus.REFUNDED);
      payment.addMetadata('refund_reason', dto.reason || 'No reason provided');
      payment.addMetadata('refund_amount', dto.amount || payment.amount);
      
      return payment;
    } catch (error) {
      throw new BadRequestException(`Refund failed: ${error.message}`);
    }
  }

  // Cancelar un pago
  async cancelPayment(paymentId: string): Promise<Payment> {
    const payment = await this.getPaymentById(paymentId);
    
    if (!payment.canBeCancelled()) {
      throw new BadRequestException('Payment cannot be cancelled');
    }
    
    payment.updateStatus(PaymentStatus.CANCELLED);
    payment.addMetadata('cancelled_at', new Date().toISOString());
    
    return payment;
  }

  // Obtener estado de un pago
  async getPaymentStatus(paymentId: string): Promise<{ status: PaymentStatus; payment: Payment }> {
    const payment = await this.getPaymentById(paymentId);
    return {
      status: payment.status,
      payment: payment
    };
  }

  // Manejar webhooks por proveedor
  async handleWebhook(provider: PaymentProvider, webhookData: any): Promise<void> {
    const factory = this.factoryRegistry.getFactory(provider);
    // Lógica para manejar webhooks
    console.log(`Webhook received from ${provider}:`, webhookData);
  }

  // Método auxiliar para generar IDs únicos
  private generatePaymentId(): string {
    return `pay_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}
