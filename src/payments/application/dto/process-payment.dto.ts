import { IsEnum, IsNumber, IsOptional, IsString, Min, ValidateIf, IsUrl, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentProvider } from '../../domain/entities/payment.entity';

// Tipos específicos de paymentMethod según el proveedor
export interface StripePaymentMethod {
  paymentMethodId  : string;
  customerId      ?: string;
}

export interface WebpayPaymentMethod {
  buyOrder   : string;
  sessionId  : string;
}

export interface PaypalPaymentMethod {
  payerId   ?: string;
  paymentId ?: string;
}

// Union type para todos los métodos de pago
export type PaymentMethodData = StripePaymentMethod | WebpayPaymentMethod | PaypalPaymentMethod;

export class ProcessPaymentDto {
  @ApiProperty({
    description : 'Monto del pago en la moneda especificada',
    example     : 100,
    minimum     : 0.01,
    type        : 'number'
  })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiPropertyOptional({
    description : 'Moneda del pago (por defecto USD)',
    example     : 'USD',
    default     : 'USD'
  })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiProperty({
    description : 'Proveedor de pago a utilizar',
    enum        : PaymentProvider,
    example     : PaymentProvider.STRIPE
  })
  @IsEnum(PaymentProvider)
  provider: PaymentProvider;

  @ApiPropertyOptional({
    description : 'ID del cliente en Stripe (OBLIGATORIO para provider: stripe)',
    example     : 'cus_1234567890'
  })
  // Campos obligatorios para STRIPE
  @ValidateIf(o => o.provider === PaymentProvider.STRIPE)
  @IsString()
  customerId?: string;

  @ApiPropertyOptional({
    description : 'URL de retorno después del pago (OBLIGATORIO para provider: webpay)',
    example     : 'https://mi-tienda.com/webpay/return'
  })
  // Campo obligatorio para WEBPAY - debe ser una URL válida
  @ValidateIf(o => o.provider === PaymentProvider.WEBPAY)
  @IsUrl()
  returnUrl?: string;

  @ApiPropertyOptional({
    description : 'URL de cancelación del pago (OBLIGATORIO para provider: paypal)',
    example     : 'https://mi-tienda.com/paypal/cancel'
  })
  // Campo obligatorio para PAYPAL - debe ser una URL válida
  @ValidateIf(o => o.provider === PaymentProvider.PAYPAL)
  @IsUrl()
  cancelUrl?: string;

  @ApiPropertyOptional({
    description : 'Descripción del pago',
    example     : 'Compra en línea - Producto XYZ'
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description : 'Datos específicos del método de pago según el proveedor',
    example     : {
      paymentMethodId : 'pm_1234567890',
      customerId      : 'cus_1234567890'
    }
  })
  @IsOptional()
  @IsObject()
  paymentMethod?: PaymentMethodData;

  @ApiPropertyOptional({
    description : 'Metadatos adicionales para el pago',
    example     : {
      idCarrito   : 'CART_123',
      idUsuario   : 'USER_456',
      orderId     : 'ORDER_789'
    }
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
