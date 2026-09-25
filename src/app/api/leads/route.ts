import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createLead } from '@/lib/repositories/leads';
import { rateLimit } from '@/lib/services/rate-limit';

export const runtime = 'nodejs';

const schema = z.object({
  source: z.enum(['whatsapp_click', 'call_click', 'test_drive_request', 'inquiry_form', 'storefront_form', 'financing_application']),
  vehicleId: z.string().min(1).optional(),
  dealershipId: z.string().min(1).optional(),
  name: z.string().trim().max(120).optional(),
  phone: z.string().trim().regex(/^[0-9+\s-]{9,15}$/, 'Enter a valid phone number.').optional(),
  email: z.string().email().optional(),
  message: z.string().trim().max(1000).optional(),
  preferredTestDriveAt: z.string().datetime().optional(),
  contactConsent: z.boolean().default(false),
  attribution: z.object({
    utmSource: z.string().max(80).optional(), utmMedium: z.string().max(80).optional(),
    utmCampaign: z.string().max(80).optional(), utmContent: z.string().max(80).optional(),
    referrer: z.string().max(500).optional(), landingPath: z.string().max(300).optional(),
  }).partial().optional(),
});

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const allowed = await rateLimit(`leads:${ip}`, Number(process.env.LEAD_RATE_LIMIT_PER_HOUR ?? 10), 3600);
  if (!allowed) {
    return NextResponse.json({ error: 'Too many enquiries from this connection. Try again in an hour.' }, { status: 429 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Check the details and try again.', issues: parsed.error.flatten().fieldErrors }, { status: 400 });
  }
  const input = parsed.data;

  // Contact-form style leads need a way to reach the buyer; click leads do not.
  const needsContact = ['inquiry_form', 'storefront_form', 'test_drive_request'].includes(input.source);
  if (needsContact && !input.phone && !input.email) {
    return NextResponse.json({ error: 'Add a phone number or email so the dealer can reply.' }, { status: 400 });
  }

  try {
    const lead = await createLead({
      source: input.source,
      vehicleId: input.vehicleId,
      dealershipId: input.dealershipId,
      buyer: { name: input.name, phone: input.phone, email: input.email, message: input.message },
      attribution: input.attribution,
      contactConsent: input.contactConsent,
      preferredTestDriveAt: input.preferredTestDriveAt ? new Date(input.preferredTestDriveAt) : undefined,
    });
    // A click is recorded as an enquiry, never as a sale.
    return NextResponse.json({ leadId: lead.id, recorded: true }, { status: 201 });
  } catch (error) {
    const status = (error as { status?: number }).status ?? 500;
    return NextResponse.json({ error: status === 500 ? 'We could not record that enquiry.' : (error as Error).message }, { status });
  }
}
