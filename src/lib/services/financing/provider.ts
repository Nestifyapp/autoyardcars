import 'server-only';
import type { FinancingApplication, Financier } from '@/lib/domain/types';
import { getNotificationProvider } from '@/lib/services/messaging/notifications';
import { calculateQuote } from '@/lib/domain/financing';
import { brand, formatKes } from '@/lib/brand';

export interface EligibilityCheck { eligible: boolean; reasons: string[]; indicativeRatePercent?: number }
export interface QuoteRequest { price: number; depositAmount: number; repaymentMonths: number; annualRatePercent: number; rateType: 'reducing_balance' | 'flat' }
export interface SubmissionResult { accepted: boolean; externalReference?: string; deliveryMethod: 'email' | 'webhook' | 'dashboard'; error?: string }

/**
 * Financier adapter contract. Live lender APIs are a later phase — each one
 * implements this and registers below without touching the application flow.
 */
export interface FinancingProviderAdapter {
  readonly key: string;
  checkEligibility(app: FinancingApplication, financier: Financier): Promise<EligibilityCheck>;
  getQuote(request: QuoteRequest): Promise<ReturnType<typeof calculateQuote>>;
  submitApplication(app: FinancingApplication, financier: Financier): Promise<SubmissionResult>;
}

/** MVP default: route the lead by email and into the partner dashboard. */
export const internalAdapter: FinancingProviderAdapter = {
  key: 'internal',
  async checkEligibility() { return { eligible: true, reasons: ['Eligibility is confirmed by the financier after review.'] }; },
  async getQuote(r) { return calculateQuote(r); },
  async submitApplication(app, financier) {
    const notify = getNotificationProvider();
    const html = `
      <h2>New financing enquiry from ${brand.name}</h2>
      <p><strong>${app.applicant.fullName}</strong> — ${app.applicant.phone}${app.applicant.email ? ` — ${app.applicant.email}` : ''}</p>
      <ul>
        <li>Vehicle price: ${formatKes(app.requested.vehiclePrice)}</li>
        <li>Deposit: ${formatKes(app.requested.depositAmount)} (${app.requested.depositPercent}%)</li>
        <li>Amount to finance: ${formatKes(app.requested.financedAmount)}</li>
        <li>Term: ${app.requested.repaymentMonths} months</li>
        <li>Indicative monthly: ${formatKes(app.requested.estimatedMonthlyPayment)}</li>
      </ul>
      <p>Reference ${app.id}. Figures are indicative estimates, not an approval.</p>`;
    const res = await notify.sendEmail({
      to: financier.contact.leadRoutingEmails.length ? financier.contact.leadRoutingEmails : [financier.contact.email],
      subject: `Financing enquiry ${app.id} — ${formatKes(app.requested.financedAmount)}`,
      html,
    });
    return { accepted: res.ok, externalReference: res.id, deliveryMethod: 'email', error: res.error };
  },
};

/** Generic outbound webhook — covers partners who can accept JSON before building an API. */
export const webhookAdapter: FinancingProviderAdapter = {
  key: 'http_webhook',
  checkEligibility: internalAdapter.checkEligibility,
  getQuote: internalAdapter.getQuote,
  async submitApplication(app, financier) {
    const url = financier.adapterConfig?.webhookUrl;
    if (!url) return { accepted: false, deliveryMethod: 'dashboard', error: 'No webhook URL configured.' };
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(financier.adapterConfig?.authHeader ? { Authorization: financier.adapterConfig.authHeader } : {}) },
        body: JSON.stringify(app),
      });
      return { accepted: res.ok, deliveryMethod: 'webhook', externalReference: res.headers.get('x-reference') ?? undefined, error: res.ok ? undefined : `HTTP ${res.status}` };
    } catch (error) {
      return { accepted: false, deliveryMethod: 'webhook', error: (error as Error).message };
    }
  },
};

const adapters: Record<string, FinancingProviderAdapter> = {
  internal: internalAdapter,
  http_webhook: webhookAdapter,
};

export const getFinancingAdapter = (key: string): FinancingProviderAdapter => adapters[key] ?? internalAdapter;
