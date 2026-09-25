import { brand } from '@/lib/brand';

/** Kenyan numbers arrive as 07…, +2547…, 2547… — normalise to wa.me format. */
export function normalisePhone(input: string, countryCode = process.env.WHATSAPP_DEFAULT_COUNTRY_CODE ?? '254'): string {
  const digits = input.replace(/\D/g, '');
  if (digits.startsWith(countryCode)) return digits;
  if (digits.startsWith('0')) return countryCode + digits.slice(1);
  if (digits.length === 9) return countryCode + digits;
  return digits;
}

export interface InquiryContext {
  vehicleTitle: string;
  reference?: string;
  vehicleUrl?: string;
  intent?: 'general' | 'test_drive' | 'financing';
}

/** The message a buyer sends. Context is prefilled so dealers know what's being asked about. */
export function buildInquiryMessage(ctx: InquiryContext): string {
  const base = `Hi, I'm interested in the ${ctx.vehicleTitle} listed on ${brand.name}`;
  const ref = ctx.reference ? `, reference ${ctx.reference}` : '';
  const ask =
    ctx.intent === 'test_drive' ? ' Could I book a test drive?'
    : ctx.intent === 'financing' ? ' Is financing available for it?'
    : ' Is it still available?';
  return `${base}${ref}.${ask}${ctx.vehicleUrl ? `\n${ctx.vehicleUrl}` : ''}`;
}

export function whatsappLink(phone: string, ctx: InquiryContext): string {
  return `https://wa.me/${normalisePhone(phone)}?text=${encodeURIComponent(buildInquiryMessage(ctx))}`;
}
