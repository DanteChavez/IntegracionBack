export enum PaymentMethodType {
  CARD              = 'card',
  BANK_TRANSFER     = 'bank_transfer',
  DIGITAL_WALLET    = 'digital_wallet',
  CRYPTO            = 'crypto',
}

// Interfaz base
export interface BasePaymentMethod {
  id         ?: string;
  type        : PaymentMethodType;
  provider    : string;
  isActive    : boolean;
  createdAt  ?: Date;
}

// Específico para tarjetas de crédito/débito (Stripe, etc.)
export interface CardPaymentMethod extends BasePaymentMethod {
  type                   : PaymentMethodType.CARD;
  last4                  : string;
  brand                  : string; // visa, mastercard, amex
  expiryMonth            : number;
  expiryYear             : number;
  holderName            ?: string;
  stripePaymentMethodId ?: string; // ID específico de Stripe
}

// Específico para transferencias bancarias (Webpay, etc.)
export interface BankTransferPaymentMethod extends BasePaymentMethod {
  type                   : PaymentMethodType.BANK_TRANSFER;
  bankName               : string;
  accountType            : 'checking' | 'savings';
  accountNumber          ?: string; // Últimos dígitos por seguridad
  webpayToken            ?: string; // Token específico de Webpay
}

// Específico para wallets digitales (PayPal, etc.)
export interface DigitalWalletPaymentMethod extends BasePaymentMethod {
  type                   : PaymentMethodType.DIGITAL_WALLET;
  email                  : string;
  accountId              ?: string;
  walletProvider         : 'paypal' | 'apple_pay' | 'google_pay';
  paypalPayerId         ?: string; // ID específico de PayPal
}

// Específico para criptomonedas
export interface CryptoPaymentMethod extends BasePaymentMethod {
  type                   : PaymentMethodType.CRYPTO;
  walletAddress          : string;
  network                : 'bitcoin' | 'ethereum' | 'litecoin';
  currency               : 'BTC' | 'ETH' | 'LTC';
}

// Union type para todos los métodos de pago
export type PaymentMethod = 
  | CardPaymentMethod 
  | BankTransferPaymentMethod 
  | DigitalWalletPaymentMethod 
  | CryptoPaymentMethod;
