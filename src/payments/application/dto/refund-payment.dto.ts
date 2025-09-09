import { IsNumber, IsOptional, IsString, Min, IsBoolean, IsObject } from 'class-validator';

export class RefundPaymentDto {
  @IsString()
  paymentId: string;

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  amount?: number; // Si no se especifica, se reembolsa el total

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  // Validaciones adicionales específicas por proveedor
  
  @IsOptional()
  @IsBoolean()
  refundApplicationFee?: boolean; // Para Stripe: reembolsar también las comisiones

  @IsOptional()
  @IsBoolean()
  reverseTransfer?: boolean; // Para plataformas: revertir transferencias a terceros

  @IsOptional()
  @IsString()
  refundReason?: 'duplicate' | 'fraudulent' | 'requested_by_customer' | 'expired_uncaptured_charge'; // Razones estándar de Stripe

  @IsOptional()
  @IsString()
  instructions?: string; // Instrucciones específicas para el procesador de pagos
}
