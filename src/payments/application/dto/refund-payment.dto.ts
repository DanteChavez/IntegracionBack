import { IsNumber, IsOptional, IsString, Min, IsBoolean, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RefundPaymentDto {
  @ApiProperty({
    description : 'ID del pago a reembolsar',
    example     : 'pay_1699876543210_abc123'
  })
  @IsString()
  paymentId: string;

  @ApiPropertyOptional({
    description : 'Monto a reembolsar (si no se especifica, se reembolsa el total)',
    example     : 50.00,
    minimum     : 0.01
  })
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  amount?: number; // Si no se especifica, se reembolsa el total

  @ApiPropertyOptional({
    description : 'Motivo del reembolso',
    example     : 'Producto defectuoso'
  })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({
    description : 'Metadatos adicionales para el reembolso',
    example     : {
      supportTicket : 'TICKET_456',
      approvedBy    : 'manager_001'
    }
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  // Validaciones adicionales específicas por proveedor
  
  @ApiPropertyOptional({
    description : 'Para Stripe: reembolsar también las comisiones de la aplicación',
    example     : true,
    default     : false
  })
  @IsOptional()
  @IsBoolean()
  refundApplicationFee?: boolean; // Para Stripe: reembolsar también las comisiones

  @ApiPropertyOptional({
    description : 'Para plataformas marketplace: revertir transferencias a terceros',
    example     : false,
    default     : false
  })
  @IsOptional()
  @IsBoolean()
  reverseTransfer?: boolean; // Para plataformas: revertir transferencias a terceros

  @ApiPropertyOptional({
    description : 'Razón específica del reembolso para Stripe',
    enum        : ['duplicate', 'fraudulent', 'requested_by_customer', 'expired_uncaptured_charge'],
    example     : 'requested_by_customer'
  })
  @IsOptional()
  @IsString()
  refundReason?: 'duplicate' | 'fraudulent' | 'requested_by_customer' | 'expired_uncaptured_charge'; // Razones estándar de Stripe

  @ApiPropertyOptional({
    description : 'Instrucciones específicas para el procesador de pagos',
    example     : 'Procesar reembolso inmediatamente'
  })
  @IsOptional()
  @IsString()
  instructions?: string; // Instrucciones específicas para el procesador de pagos
}
