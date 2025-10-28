import { IsEnum, IsNumber, IsOptional, IsString, Min, ValidateIf, IsUrl, IsObject, Matches, Length, IsNotEmpty, Max, IsInt } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentProvider } from '../../domain/entities/payment.entity';
import { Transform } from 'class-transformer';

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

/**
 * CA2: Los datos de tarjeta NO deben almacenarse en la base de datos
 * CA3: Validación CVV requerida para verificación de identidad
 * CA6: Protección de datos personales con enmascaramiento
 * CA13: Validación de fecha de vencimiento de tarjetas (Historia de Usuario 1)
 * 
 * NOTA: Este DTO recibe el CVV solo para validación, NUNCA se almacena en BD
 */
export class CardSecurityData {
  @ApiProperty({
    description: 'Código de seguridad CVV/CVC (3-4 dígitos) - NO SE ALMACENA',
    example: '123',
    minLength: 3,
    maxLength: 4,
  })
  @IsNotEmpty({ message: 'El código CVV es requerido para verificación de identidad' })
  @IsString()
  @Length(3, 4, { message: 'El CVV debe tener 3 o 4 dígitos' })
  @Matches(/^[0-9]{3,4}$/, { message: 'El CVV debe contener solo números' })
  cvv: string;

  @ApiPropertyOptional({
    description: 'Últimos 4 dígitos de la tarjeta (para referencia enmascarada)',
    example: '4242',
    minLength: 4,
    maxLength: 4,
  })
  @IsOptional()
  @IsString()
  @Length(4, 4)
  @Matches(/^[0-9]{4}$/)
  last4Digits?: string;

  @ApiPropertyOptional({
    description: 'Nombre del titular (para validación adicional)',
    example: 'JOHN DOE',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.toUpperCase())
  cardHolderName?: string;

  @ApiPropertyOptional({
    description: 'Mes de vencimiento de la tarjeta (1-12) - CA13: Historia de Usuario 1',
    example: 12,
    minimum: 1,
    maximum: 12,
  })
  @IsOptional()
  @IsInt({ message: 'El mes de vencimiento debe ser un número entero' })
  @Min(1, { message: 'El mes de vencimiento debe estar entre 1 y 12' })
  @Max(12, { message: 'El mes de vencimiento debe estar entre 1 y 12' })
  expiryMonth?: number;

  @ApiPropertyOptional({
    description: 'Año de vencimiento de la tarjeta (YYYY) - CA13: Historia de Usuario 1',
    example: 2025,
    minimum: 2024,
  })
  @IsOptional()
  @IsInt({ message: 'El año de vencimiento debe ser un número entero' })
  @Min(2024, { message: 'El año de vencimiento no puede ser anterior a 2024' })
  @Max(2050, { message: 'El año de vencimiento no puede ser posterior a 2050' })
  expiryYear?: number;
}

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

  @ApiProperty({
    description: 'Datos de seguridad de la tarjeta (CVV requerido) - NO SE ALMACENAN',
    type: CardSecurityData,
  })
  @IsNotEmpty({ message: 'Los datos de seguridad de la tarjeta son requeridos' })
  @IsObject()
  cardSecurity: CardSecurityData;

  @ApiProperty({
    description: 'Token de confirmación de monto (obtenido del endpoint /pagos/confirm-amount)',
    example: 'conf_1a2b3c4d5e6f',
  })
  @IsNotEmpty({ message: 'El token de confirmación es requerido' })
  @IsString()
  confirmationToken: string;

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
