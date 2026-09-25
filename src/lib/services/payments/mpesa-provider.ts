import 'server-only';
import type { CallbackResult, ChargeRequest, ChargeResult, PaymentProvider } from './types';

const BASE = process.env.MPESA_ENV === 'production'
  ? 'https://api.safaricom.co.ke'
  : 'https://sandbox.safaricom.co.ke';

async function token(): Promise<string> {
  const auth = Buffer.from(`${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`).toString('base64');
  const res = await fetch(`${BASE}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${auth}` }, cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Daraja auth failed: ${res.status}`);
  return (await res.json()).access_token;
}

/**
 * M-Pesa STK Push (Lipa na M-Pesa Online). Requires production Daraja credentials —
 * see docs/INTEGRATIONS.md. Until then PAYMENTS_PROVIDER=mock is used.
 */
export const mpesaProvider: PaymentProvider = {
  name: 'mpesa',
  simulated: false,

  async charge(request: ChargeRequest): Promise<ChargeResult> {
    const timestamp = new Date().toISOString().replace(/[-T:.Z]/g, '').slice(0, 14);
    const shortcode = process.env.MPESA_SHORTCODE!;
    const password = Buffer.from(`${shortcode}${process.env.MPESA_PASSKEY}${timestamp}`).toString('base64');

    const res = await fetch(`${BASE}/mpesa/stkpush/v1/processrequest`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${await token()}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        BusinessShortCode: shortcode, Password: password, Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: Math.round(request.amount),
        PartyA: request.payerPhone, PartyB: shortcode, PhoneNumber: request.payerPhone,
        CallBackURL: `${process.env.MPESA_CALLBACK_URL}?k=${process.env.MPESA_CALLBACK_SECRET}`,
        AccountReference: request.accountReference.slice(0, 12),
        TransactionDesc: request.description.slice(0, 13),
      }),
    });
    const body = await res.json();
    const ok = body.ResponseCode === '0';
    return {
      provider: 'mpesa',
      status: ok ? 'pending' : 'failed',
      providerRefs: { merchantRequestId: body.MerchantRequestID, checkoutRequestId: body.CheckoutRequestID },
      message: ok ? 'Check your phone and enter your M-Pesa PIN.' : (body.errorMessage ?? 'Payment request rejected.'),
      simulated: false,
    };
  },

  parseCallback(payload: unknown): CallbackResult {
    const cb = (payload as any)?.Body?.stkCallback ?? {};
    const items: { Name: string; Value?: string | number }[] = cb.CallbackMetadata?.Item ?? [];
    const pick = (name: string) => items.find(i => i.Name === name)?.Value;
    const ok = cb.ResultCode === 0;
    return {
      checkoutRequestId: cb.CheckoutRequestID,
      status: ok ? 'succeeded' : cb.ResultCode === 1032 ? 'cancelled' : 'failed',
      mpesaReceiptNumber: pick('MpesaReceiptNumber') as string | undefined,
      amount: pick('Amount') as number | undefined,
      failureReason: ok ? undefined : cb.ResultDesc,
      raw: payload,
    };
  },

  verifyCallbackSignature(_headers, _rawBody) {
    return true; // Daraja has no signature; the URL secret + IP allowlist guard the endpoint.
  },
};
