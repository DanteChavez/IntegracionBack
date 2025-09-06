export interface PaymentMethod {
  type: string;
  provider: string;
  // propiedades opcionales para crypto
  walletAddress?: string;
  network?: string;
  // propiedades opcionales para wallets digitales
  email?: string;
  accountId?: string;
  // propiedades opcionales para tarjetas
  last4?: number;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;


  // TODO: Definir propiedades específicas según el tipo
  // - Para tarjetas: last4, brand, expiryMonth, expiryYear
  // - Para wallets digitales: email, accountId
  // - Para crypto: walletAddress, network
}
