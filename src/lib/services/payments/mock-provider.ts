import type { CallbackResult, ChargeRequest, ChargeResult, PaymentProvider } from './types';

/**
 * Development fallback. Behaves exactly like the real provider — including the
 * asynchronous callback — so subscription and boost activation are genuinely
 * exercised without Daraja credentials. Every response is marked simulated, and
 * the dealer UI shows a "Simulated payment" banner.
 */
export const mockPaymentProvider: PaymentProvider = {
  name: 'mock',
  simulated: true,

  async charge(request: ChargeRequest): Promise<ChargeResult> {
    const checkoutRequestId = `MOCK-${request.idempotencyKey.slice(0, 18)}`;
    // Simulate the operator callback a moment later, same path as production.
    setTimeout(() => {
      fetch(`${process.env.MPESA_CALLBACK_URL}?k=${process.env.MPESA_CALLBACK_SECRET}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          Body: { stkCallback: {
            CheckoutRequestID: checkoutRequestId,
            MerchantRequestID: `MOCK-M-${Date.now()}`,
            ResultCode: 0, ResultDesc: 'Simulated success',
            CallbackMetadata: { Item: [
              { Name: 'Amount', Value: request.amount },
              { Name: 'MpesaReceiptNumber', Value: `SIM${Date.now().toString().slice(-8)}` },
              { Name: 'PhoneNumber', Value: request.payerPhone },
            ] },
          } },
        }),
      }).catch(err => console.error('[payments:mock] callback failed', err));
    }, 2500);

    return {
      provider: 'mock',
      status: 'pending',
      providerRefs: { checkoutRequestId, merchantRequestId: `MOCK-M-${Date.now()}` },
      message: 'Simulated M-Pesa prompt — this will confirm automatically in a few seconds.',
      simulated: true,
    };
  },

  parseCallback(payload: unknown): CallbackResult {
    const cb = (payload as any)?.Body?.stkCallback ?? {};
    const items: { Name: string; Value?: string | number }[] = cb.CallbackMetadata?.Item ?? [];
    return {
      checkoutRequestId: cb.CheckoutRequestID,
      status: cb.ResultCode === 0 ? 'succeeded' : 'failed',
      mpesaReceiptNumber: items.find(i => i.Name === 'MpesaReceiptNumber')?.Value as string,
      amount: items.find(i => i.Name === 'Amount')?.Value as number,
      raw: payload,
    };
  },
};
