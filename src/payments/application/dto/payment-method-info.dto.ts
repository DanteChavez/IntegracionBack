import { ApiProperty } from '@nestjs/swagger';
import { PaymentProvider } from '../../domain/entities/payment.entity';

/**
 * DTO para proporcionar información de métodos de pago al frontend
 * Soporta Historia de Usuario 1 - Interfaz y métodos de pago
 * 
 * CA8: Mostrar al menos 2 métodos de pago disponibles
 * CA9: Mostrar los métodos con íconos reconocibles y nombres claros
 * CA11: Información de validación requerida para cada método
 */

export class PaymentMethodValidation {
  @ApiProperty({
    description: 'Campos requeridos para este método de pago',
    example: ['cardNumber', 'cvv', 'expiryMonth', 'expiryYear', 'cardHolderName'],
  })
  requiredFields: string[];

  @ApiProperty({
    description: 'Longitud del CVV (3 para Visa/MC, 4 para AMEX)',
    example: 3,
  })
  cvvLength: number;

  @ApiProperty({
    description: 'Patrón de validación para número de tarjeta (regex)',
    example: '^4[0-9]{12}(?:[0-9]{3})?$',
  })
  cardNumberPattern?: string;

  @ApiProperty({
    description: 'Descripción del formato esperado',
    example: '16 dígitos para Visa',
  })
  formatDescription: string;
}

export class PaymentMethodInfoDto {
  @ApiProperty({
    description: 'Identificador único del método de pago',
    enum: PaymentProvider,
    example: PaymentProvider.STRIPE,
  })
  provider: PaymentProvider;

  @ApiProperty({
    description: 'Nombre legible del método de pago',
    example: 'Tarjeta de Crédito/Débito',
  })
  displayName: string;

  @ApiProperty({
    description: 'Descripción del método de pago',
    example: 'Paga con Visa, Mastercard o American Express',
  })
  description: string;

  @ApiProperty({
    description: 'URL del logo del método de pago',
    example: 'https://cdn.example.com/logos/visa-mastercard.png',
  })
  logoUrl: string;

  @ApiProperty({
    description: 'Indica si el método de pago está activo',
    example: true,
  })
  enabled: boolean;

  @ApiProperty({
    description: 'Orden de prioridad para mostrar (menor número = mayor prioridad)',
    example: 1,
  })
  priority: number;

  @ApiProperty({
    description: 'Monedas soportadas por este método',
    example: ['USD', 'EUR', 'CLP'],
    type: [String],
  })
  supportedCurrencies: string[];

  @ApiProperty({
    description: 'Información de validación requerida',
    type: PaymentMethodValidation,
  })
  validation: PaymentMethodValidation;

  @ApiProperty({
    description: 'Tiempo estimado de procesamiento en minutos',
    example: 5,
  })
  estimatedProcessingTime: number;
}

/**
 * CA11: Validación de formato de método de pago antes de proceder
 * CA13: Validación de fecha de vencimiento de tarjetas
 */
export class ValidatePaymentMethodDto {
  @ApiProperty({
    description: 'Proveedor de pago',
    enum: PaymentProvider,
  })
  provider: PaymentProvider;

  @ApiProperty({
    description: 'Número de tarjeta (será validado pero no almacenado)',
    example: '4242424242424242',
    required: false,
  })
  cardNumber?: string;

  @ApiProperty({
    description: 'Mes de vencimiento (1-12)',
    example: 12,
    required: false,
  })
  expiryMonth?: number;

  @ApiProperty({
    description: 'Año de vencimiento (YYYY)',
    example: 2025,
    required: false,
  })
  expiryYear?: number;

  @ApiProperty({
    description: 'CVV (3-4 dígitos)',
    example: '123',
    required: false,
  })
  cvv?: string;
}

/**
 * Respuesta de validación con mensajes específicos para el frontend
 * CA12: Mostrar mensajes de error específicos y claros
 */
export class PaymentMethodValidationResponse {
  @ApiProperty({
    description: 'Indica si la validación fue exitosa',
    example: true,
  })
  valid: boolean;

  @ApiProperty({
    description: 'Errores de validación por campo',
    example: {
      cardNumber: 'Número de tarjeta inválido',
      expiryDate: 'La tarjeta ha expirado',
    },
    required: false,
  })
  errors?: Record<string, string>;

  @ApiProperty({
    description: 'Tipo de tarjeta detectado',
    example: 'Visa',
    required: false,
  })
  cardType?: string;

  @ApiProperty({
    description: 'Últimos 4 dígitos (enmascaramiento CA16)',
    example: '4242',
    required: false,
  })
  last4Digits?: string;
}

/**
 * CA2: Temporizador para completar el pago
 * Información de sesión de pago con tiempo límite
 */
export class PaymentSessionInfoDto {
  @ApiProperty({
    description: 'ID de la sesión de pago',
    example: 'sess_1a2b3c4d5e6f',
  })
  sessionId: string;

  @ApiProperty({
    description: 'Token de confirmación de monto',
    example: 'conf_1a2b3c4d5e6f',
  })
  confirmationToken: string;

  @ApiProperty({
    description: 'Monto confirmado',
    example: 100,
  })
  amount: number;

  @ApiProperty({
    description: 'Moneda',
    example: 'USD',
  })
  currency: string;

  @ApiProperty({
    description: 'Fecha/hora de expiración del token (ISO 8601)',
    example: '2025-10-28T23:00:00.000Z',
  })
  expiresAt: string;

  @ApiProperty({
    description: 'Segundos restantes para completar el pago',
    example: 300,
  })
  remainingSeconds: number;

  @ApiProperty({
    description: 'Indica si el token ya expiró',
    example: false,
  })
  expired: boolean;
}
