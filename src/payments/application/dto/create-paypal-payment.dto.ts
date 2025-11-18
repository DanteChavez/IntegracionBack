import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsObject, IsOptional } from 'class-validator';

/**
 * DTO para crear un pago de PayPal
 * HU4-CA1, CA2: Iniciar pago con PayPal
 */
export class CreatePayPalPaymentDto {
  @ApiProperty({
    description: 'Monto total del pago en centavos',
    example: 5000,
  })
  @IsNumber()
  amount: number;

  @ApiProperty({
    description: 'Código de moneda ISO 4217',
    example: 'USD',
    default: 'USD',
  })
  @IsString()
  @IsNotEmpty()
  currency: string;

  @ApiProperty({
    description: 'ID de sesión único',
    example: 'session_123',
  })
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @ApiProperty({
    description: 'ID del usuario',
    example: 'user_123',
  })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: 'Metadata adicional del pedido',
    required: false,
  })
  @IsObject()
  @IsOptional()
  metadata?: any;
}
