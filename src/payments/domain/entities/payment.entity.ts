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
  WEBPAY        = 'webpay',
  MERCADO_PAGO  = 'mercado_pago',
  CRYPTO        = 'crypto',
}

export class Payment {
  constructor(
    public readonly id          : string,
    public readonly amount      : number,
    public readonly currency    : string,
    public readonly provider    : PaymentProvider,
    private _status             : PaymentStatus,
    private _metadata          ?: Record<string, any>,
    public readonly createdAt  ?: Date,
    private _updatedAt         ?: Date,
  ) {}

  // Getters
  get status(): PaymentStatus {
    return this._status;
  }

  get metadata(): Record<string, any> | undefined {
    return this._metadata;
  }

  get updatedAt(): Date | undefined {
    return this._updatedAt;
  }

  // Métodos de dominio
  updateStatus(newStatus: PaymentStatus): void {
    // Reglas de negocio para cambios de estado válidos
    const validTransitions: Record<PaymentStatus, PaymentStatus[]> = {
      [PaymentStatus.PENDING]     : [PaymentStatus.PROCESSING, PaymentStatus.CANCELLED],
      [PaymentStatus.PROCESSING]  : [PaymentStatus.COMPLETED, PaymentStatus.FAILED],
      [PaymentStatus.COMPLETED]   : [PaymentStatus.REFUNDED],
      [PaymentStatus.FAILED]      : [],
      [PaymentStatus.CANCELLED]   : [],
      [PaymentStatus.REFUNDED]    : [],
    };

    if (!validTransitions[this._status].includes(newStatus)) {
      throw new Error(`Cannot transition from ${this._status} to ${newStatus}`);
    }

    this._status = newStatus;
    this._updatedAt = new Date();
  }

  canBeRefunded(): boolean {
    return this._status === PaymentStatus.COMPLETED && this.amount > 0;
  }

  canBeCancelled(): boolean {
    return this._status === PaymentStatus.PENDING;
  }

  addMetadata(key: string, value: any): void {
    if (!this._metadata) {
      this._metadata = {};
    }
    this._metadata[key] = value;
    this._updatedAt = new Date();
  }
}
