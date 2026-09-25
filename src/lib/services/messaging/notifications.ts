import 'server-only';

export interface EmailMessage { to: string[]; subject: string; html: string; replyTo?: string }
export interface SmsMessage { to: string; body: string }

export interface NotificationProvider {
  readonly name: string; readonly simulated: boolean;
  sendEmail(message: EmailMessage): Promise<{ ok: boolean; id?: string; error?: string }>;
  sendSms(message: SmsMessage): Promise<{ ok: boolean; id?: string; error?: string }>;
}

/** Logs instead of sending. Keeps lead routing working with no vendor account. */
const mockProvider: NotificationProvider = {
  name: 'mock', simulated: true,
  async sendEmail(m) { console.info('[notify:mock] email →', m.to.join(', '), '|', m.subject); return { ok: true, id: `mock-${Date.now()}` }; },
  async sendSms(m) { console.info('[notify:mock] sms →', m.to, '|', m.body.slice(0, 60)); return { ok: true, id: `mock-${Date.now()}` }; },
};

const resendProvider: NotificationProvider = {
  name: 'resend', simulated: false,
  async sendEmail(m) {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: process.env.EMAIL_FROM, to: m.to, subject: m.subject, html: m.html, reply_to: m.replyTo }),
    });
    const body = await res.json().catch(() => ({}));
    return res.ok ? { ok: true, id: body.id } : { ok: false, error: body.message ?? `HTTP ${res.status}` };
  },
  sendSms: mockProvider.sendSms,
};

export function getNotificationProvider(): NotificationProvider {
  return process.env.EMAIL_PROVIDER === 'resend' && process.env.RESEND_API_KEY ? resendProvider : mockProvider;
}
