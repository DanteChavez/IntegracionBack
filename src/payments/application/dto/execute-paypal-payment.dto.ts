import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

/**
 * DTO para ejecutar un pago de PayPal después de la aprobación del usuario
 * HU4-CA4: Validación del token devuelto por PayPal
 */
export class ExecutePayPalPaymentDto {
  @ApiProperty({
    description: 'ID de la orden de PayPal devuelto después de la aprobación',
    example: 'ORDER123456789',
  })
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @ApiProperty({
    description: 'ID del pagador (payer_id) devuelto por PayPal',
    example: 'PAYER123',
    required: false,
  })
  @IsString()
  @IsOptional()
  payerId?: string;

  @ApiProperty({
    description: 'Token de la sesión de pago',
    example: 'EC-TOKEN123',
    required: false,
  })
  @IsString()
  @IsOptional()
  token?: string;
}
