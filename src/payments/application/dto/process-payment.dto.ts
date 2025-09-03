import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { PaymentProvider } from '../../domain/entities/payment.entity';

export class ProcessPaymentDto {
  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsString()
  currency: string;

  @IsEnum(PaymentProvider)
  provider: PaymentProvider;

  @IsOptional()
  paymentMethod?: any; // TODO: Definir tipos específicos según el proveedor

  @IsOptional()
  metadata?: Record<string, any>;

  // TODO: Agregar más validaciones específicas
  // - customerId?: string
  // - description?: string
  // - returnUrl?: string (para algunos proveedores)
  // - cancelUrl?: string
}
