import { mockPaymentProvider } from './mock-provider';
import type { PaymentProvider } from './types';

export function getPaymentProvider(): PaymentProvider {
  if ((process.env.PAYMENTS_PROVIDER ?? 'mock') === 'daraja') {
    // Lazy require keeps Daraja config out of environments that don't use it.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('./mpesa-provider').mpesaProvider as PaymentProvider;
  }
  return mockPaymentProvider;
}
export * from './types';
