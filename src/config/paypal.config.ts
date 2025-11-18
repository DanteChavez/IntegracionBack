import { registerAs } from '@nestjs/config';

export default registerAs('paypal', () => ({
  mode: process.env.PAYPAL_MODE || 'sandbox',
  clientId: process.env.PAYPAL_CLIENT_ID,
  clientSecret: process.env.PAYPAL_CLIENT_SECRET,
  returnUrl: process.env.PAYPAL_RETURN_URL || 'https://localhost:3001/payment-success',
  cancelUrl: process.env.PAYPAL_CANCEL_URL || 'https://localhost:3001/payment-cancel',
}));
