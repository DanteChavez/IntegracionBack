export enum PaymentStatus {
  PENDING       = 'pending',
  PROCESSING    = 'processing',
  COMPLETED     = 'completed',
  FAILED        = 'failed',
  CANCELLED     = 'cancelled',
  REFUNDED      = 'refunded',
}

export enum PaymentProvider {
  STRIPE        = 'stripe',
  PAYPAL        = 'paypal',
  MERCADO_PAGO  = 'mercado_pago',
  CRYPTO        = 'crypto',
}

export class Payment {
  constructor(
    public readonly id          : string,
    public readonly amount      : number,
    public readonly currency    : string,
    public readonly provider    : PaymentProvider,
    public readonly status      : PaymentStatus,
    public readonly metadata   ?: Record<string, any>,
    public readonly createdAt  ?: Date,
    public readonly updatedAt  ?: Date,
  ) {}

  // TODO: Implementar métodos de dominio
  // - updateStatus(status: PaymentStatus): void
  // - canBeRefunded(): boolean
  // - canBeCancelled(): boolean
  // - addMetadata(key: string, value: any): void
}
