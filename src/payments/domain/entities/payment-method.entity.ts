export interface PaymentMethod {
  type: string;
  provider: string;
  // TODO: Definir propiedades específicas según el tipo
  // - Para tarjetas: last4, brand, expiryMonth, expiryYear
  // - Para wallets digitales: email, accountId
  // - Para crypto: walletAddress, network
}
