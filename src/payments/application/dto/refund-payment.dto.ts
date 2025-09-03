import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

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
  metadata?: Record<string, any>;

  // TODO: Agregar validaciones adicionales
  // - refundApplicationFee?: boolean (para Stripe)
  // - reverseTransfer?: boolean (para algunas plataformas)
}
