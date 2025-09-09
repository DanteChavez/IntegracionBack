import { IsEnum, IsNumber, IsOptional, IsString, Min, ValidateIf, IsUrl, IsObject } from 'class-validator';
import { PaymentProvider } from '../../domain/entities/payment.entity';

// Tipos específicos de paymentMethod según el proveedor
export interface StripePaymentMethod {
  paymentMethodId: string;
  customerId?: string;
}

export interface WebpayPaymentMethod {
  buyOrder: string;
  sessionId: string;
}

export interface PaypalPaymentMethod {
  payerId?: string;
  paymentId?: string;
}

// Union type para todos los métodos de pago
export type PaymentMethodData = StripePaymentMethod | WebpayPaymentMethod | PaypalPaymentMethod;

export class ProcessPaymentDto {
  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsEnum(PaymentProvider)
  provider: PaymentProvider;

  // Campos obligatorios para STRIPE
  @ValidateIf(o => o.provider === PaymentProvider.STRIPE)
  @IsString()
  customerId?: string;

  // Campo obligatorio para WEBPAY - debe ser una URL válida
  @ValidateIf(o => o.provider === PaymentProvider.WEBPAY)
  @IsUrl()
  returnUrl?: string;

  // Campo obligatorio para PAYPAL - debe ser una URL válida
  @ValidateIf(o => o.provider === PaymentProvider.PAYPAL)
  @IsUrl()
  cancelUrl?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsObject()
  paymentMethod?: PaymentMethodData;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
