export interface ChargeRequest {
  amount: number;
  currency: string;
  payerPhone: string;            // 2547XXXXXXXX
  accountReference: string;      // dealership slug + purpose
  description: string;
  dealershipId: string;
  purpose: 'subscription' | 'boost';
  referenceId: string;
  idempotencyKey: string;
}

export interface ChargeResult {
  provider: string;
  status: 'initiated' | 'pending' | 'succeeded' | 'failed';
  providerRefs: { merchantRequestId?: string; checkoutRequestId?: string; mpesaReceiptNumber?: string };
  message: string;
  /** True when no real money moved — surfaced in the dealer UI as "Simulated". */
  simulated: boolean;
}

export interface CallbackResult {
  checkoutRequestId: string;
  status: 'succeeded' | 'failed' | 'cancelled';
  mpesaReceiptNumber?: string;
  amount?: number;
  failureReason?: string;
  raw: unknown;
}

export interface PaymentProvider {
  readonly name: string;
  readonly simulated: boolean;
  charge(request: ChargeRequest): Promise<ChargeResult>;
  parseCallback(payload: unknown): CallbackResult;
  verifyCallbackSignature?(headers: Record<string, string | undefined>, rawBody: string): boolean;
}
