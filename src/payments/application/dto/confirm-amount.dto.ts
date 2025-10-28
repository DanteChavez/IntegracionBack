import { IsNumber, IsString, IsEnum, Min, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentProvider } from '../../domain/entities/payment.entity';

/**
 * DTO para confirmar el monto antes de procesar el pago
 * Cumple con requisito de seguridad de mostrar confirmación del monto
 */
export class ConfirmPaymentAmountDto {
  @ApiProperty({
    description: 'Monto a confirmar',
    example: 100.50,
    minimum: 0.01,
  })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({
    description: 'Moneda del pago',
    example: 'USD',
  })
  @IsString()
  currency: string;

  @ApiProperty({
    description: 'Proveedor de pago',
    enum: PaymentProvider,
    example: PaymentProvider.STRIPE,
  })
  @IsEnum(PaymentProvider)
  provider: PaymentProvider;

  @ApiPropertyOptional({
    description: 'Descripción del pago para confirmar',
    example: 'Compra de producto XYZ - 2 unidades',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Metadatos para verificación',
    example: {
      orderId: 'ORDER_123',
      items: 2,
    },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

/**
 * Respuesta de confirmación de monto
 */
export class PaymentAmountConfirmationResponse {
  @ApiProperty({
    description: 'Token de confirmación temporal (válido por 5 minutos)',
    example: 'conf_1a2b3c4d5e6f',
  })
  confirmationToken: string;

  @ApiProperty({
    description: 'Monto confirmado (alias de confirmedAmount)',
    example: 100.50,
  })
  amount: number;

  @ApiProperty({
    description: 'Monto confirmado',
    example: 100.50,
  })
  confirmedAmount: number;

  @ApiProperty({
    description: 'Moneda confirmada',
    example: 'USD',
  })
  confirmedCurrency: string;

  @ApiProperty({
    description: 'Monto formateado para mostrar al usuario',
    example: '$100.50 USD',
  })
  formattedAmount: string;

  @ApiProperty({
    description: 'Timestamp de expiración del token',
    example: '2025-10-28T12:35:00Z',
  })
  expiresAt: Date;

  @ApiProperty({
    description: 'Mensaje de confirmación',
    example: 'El monto ha sido verificado y confirmado. Proceda con el pago.',
  })
  message: string;

  @ApiPropertyOptional({
    description: 'Advertencias o información adicional',
    example: ['El pago se procesará en 24-48 horas'],
  })
  warnings?: string[];
}
