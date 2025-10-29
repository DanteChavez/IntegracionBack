import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PaymentFactoryRegistry }   from '../../infrastructure/factories/payment-factory-registry.service';
import { ProcessPaymentDto }        from '../dto/process-payment.dto';
import { RefundPaymentDto }         from '../dto/refund-payment.dto';
import { Payment, PaymentStatus, PaymentProvider } from '../../domain/entities/payment.entity';
import {
  PaymentMethodInfoDto,
  ValidatePaymentMethodDto,
  PaymentMethodValidationResponse,
} from '../dto/payment-method-info.dto';

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
      
      // En modo mock, marcar como completado inmediatamente
      payment.updateStatus(PaymentStatus.COMPLETED);
      
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

  /**
   * Historia de Usuario 1 - CA8, CA9: Obtener métodos de pago disponibles
   * Retorna información completa para mostrar en la interfaz de frontend
   */
  async getAvailablePaymentMethods(): Promise<PaymentMethodInfoDto[]> {
    const methods: PaymentMethodInfoDto[] = [
      {
        provider: PaymentProvider.STRIPE,
        displayName: 'Tarjeta de Crédito/Débito',
        description: 'Paga con Visa, Mastercard o American Express',
        logoUrl: 'https://cdn.stripe.com/img/v3/logos/logo-stripe.svg',
        enabled: true,
        priority: 1,
        supportedCurrencies: ['USD', 'EUR', 'CLP', 'MXN', 'ARS'],
        validation: {
          requiredFields: ['cardNumber', 'cvv', 'expiryMonth', 'expiryYear', 'cardHolderName'],
          cvvLength: 3,
          cardNumberPattern: '^[0-9]{13,19}$',
          formatDescription: '13-19 dígitos (Visa: 16, Amex: 15)',
        },
        estimatedProcessingTime: 2,
      },
      {
        provider: PaymentProvider.PAYPAL,
        displayName: 'PayPal',
        description: 'Paga con tu cuenta de PayPal de forma segura',
        logoUrl: 'https://www.paypalobjects.com/webstatic/mktg/logo/pp_cc_mark_37x23.jpg',
        enabled: true,
        priority: 2,
        supportedCurrencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD'],
        validation: {
          requiredFields: ['email'],
          cvvLength: 0,
          formatDescription: 'Redireccionamiento a PayPal',
        },
        estimatedProcessingTime: 5,
      },
      {
        provider: PaymentProvider.WEBPAY,
        displayName: 'Webpay Plus',
        description: 'Pago con tarjetas bancarias chilenas (Transbank)',
        logoUrl: 'https://www.webpay.cl/img/logos/webpay.svg',
        enabled: true,
        priority: 3,
        supportedCurrencies: ['CLP'],
        validation: {
          requiredFields: ['cardNumber', 'cvv', 'expiryMonth', 'expiryYear'],
          cvvLength: 3,
          cardNumberPattern: '^[0-9]{16}$',
          formatDescription: '16 dígitos',
        },
        estimatedProcessingTime: 3,
      },
      {
        provider: PaymentProvider.MERCADO_PAGO,
        displayName: 'Mercado Pago',
        description: 'Paga con Mercado Pago (tarjetas o dinero en cuenta)',
        logoUrl: 'https://http2.mlstatic.com/frontend-assets/ui-navigation/5.12.0/mercadopago/logo__large_plus.png',
        enabled: false, // Deshabilitado por ahora
        priority: 4,
        supportedCurrencies: ['ARS', 'BRL', 'MXN', 'CLP'],
        validation: {
          requiredFields: ['email'],
          cvvLength: 0,
          formatDescription: 'Redireccionamiento a Mercado Pago',
        },
        estimatedProcessingTime: 5,
      },
    ];

    // Filtrar solo los habilitados
    return methods.filter(m => m.enabled);
  }

  /**
   * Historia de Usuario 1 - CA11, CA12, CA13: Validar método de pago
   * Valida formato de tarjeta, CVV, y fecha de vencimiento
   */
  async validatePaymentMethod(dto: ValidatePaymentMethodDto): Promise<PaymentMethodValidationResponse> {
    const errors: Record<string, string> = {};
    let cardType: string | undefined;
    let last4Digits: string | undefined;

    // Validar número de tarjeta si se proporciona
    if (dto.cardNumber) {
      const cleaned = dto.cardNumber.replace(/\s/g, '');
      last4Digits = cleaned.slice(-4);

      // Algoritmo de Luhn para validar número de tarjeta
      if (!this.validateLuhn(cleaned)) {
        errors.cardNumber = 'Número de tarjeta inválido';
      } else {
        // Detectar tipo de tarjeta
        cardType = this.detectCardType(cleaned);
      }

      // Validar longitud
      if (cleaned.length < 13 || cleaned.length > 19) {
        errors.cardNumber = 'El número de tarjeta debe tener entre 13 y 19 dígitos';
      }
    }

    // CA13: Validar fecha de vencimiento
    if (dto.expiryMonth !== undefined && dto.expiryYear !== undefined) {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1; // getMonth() retorna 0-11

      // Validar rango del mes
      if (dto.expiryMonth < 1 || dto.expiryMonth > 12) {
        errors.expiryMonth = 'El mes debe estar entre 1 y 12';
      }

      // Validar que no esté expirada
      if (dto.expiryYear < currentYear) {
        errors.expiryDate = 'La tarjeta ha expirado';
      } else if (dto.expiryYear === currentYear && dto.expiryMonth < currentMonth) {
        errors.expiryDate = 'La tarjeta ha expirado';
      }

      // Validar que no sea demasiado lejos en el futuro (más de 20 años)
      if (dto.expiryYear > currentYear + 20) {
        errors.expiryYear = 'Año de vencimiento inválido';
      }
    } else if (dto.cardNumber) {
      // Si se proporciona tarjeta pero no fecha de vencimiento
      errors.expiryDate = 'La fecha de vencimiento es requerida';
    }

    // Validar CVV
    if (dto.cvv) {
      const cvvLength = dto.cvv.length;
      const expectedLength = cardType === 'American Express' ? 4 : 3;

      if (!/^[0-9]+$/.test(dto.cvv)) {
        errors.cvv = 'El CVV debe contener solo números';
      } else if (cvvLength !== expectedLength) {
        errors.cvv = `El CVV debe tener ${expectedLength} dígitos${cardType ? ` para ${cardType}` : ''}`;
      }
    } else if (dto.cardNumber) {
      errors.cvv = 'El CVV es requerido';
    }

    const valid = Object.keys(errors).length === 0;

    return {
      valid,
      errors: valid ? undefined : errors,
      cardType,
      last4Digits,
    };
  }

  /**
   * Algoritmo de Luhn para validar números de tarjeta
   * https://en.wikipedia.org/wiki/Luhn_algorithm
   */
  private validateLuhn(cardNumber: string): boolean {
    let sum = 0;
    let isEven = false;

    // Recorrer de derecha a izquierda
    for (let i = cardNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cardNumber[i], 10);

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  }

  /**
   * Detectar tipo de tarjeta según los primeros dígitos
   */
  private detectCardType(cardNumber: string): string {
    // Visa: empieza con 4
    if (/^4/.test(cardNumber)) {
      return 'Visa';
    }
    // Mastercard: empieza con 51-55 o 2221-2720
    if (/^5[1-5]/.test(cardNumber) || /^222[1-9]|22[3-9][0-9]|2[3-6][0-9]{2}|27[01][0-9]|2720/.test(cardNumber)) {
      return 'Mastercard';
    }
    // American Express: empieza con 34 o 37
    if (/^3[47]/.test(cardNumber)) {
      return 'American Express';
    }
    // Discover: empieza con 6011, 622126-622925, 644-649, o 65
    if (/^6011|^622[1-9]|^64[4-9]|^65/.test(cardNumber)) {
      return 'Discover';
    }
    // Diners Club: empieza con 36 o 38
    if (/^3[068]/.test(cardNumber)) {
      return 'Diners Club';
    }
    // JCB: empieza con 35
    if (/^35/.test(cardNumber)) {
      return 'JCB';
    }

    return 'Unknown';
  }
}
