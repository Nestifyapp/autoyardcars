'use client';
import { useState } from 'react';
import { whatsappLink } from '@/lib/services/messaging/whatsapp';

type ContactVehicle = {
  id: string;
  title: string;
  dealerSnapshot: {
    whatsappPhone: string;
    primaryPhone: string;
  };
};

/**
 * Sticky mobile CTA bar. Every tap is recorded as an ENQUIRY before the handoff —
 * a WhatsApp click is never treated as a sale, and a call click is not a call.
 */
export function ContactActions({ vehicle }: { vehicle: ContactVehicle }) {
  const [pending, setPending] = useState<string | null>(null);

  async function record(source: 'whatsapp_click' | 'call_click') {
    setPending(source);
    const params = new URLSearchParams(window.location.search);
    try {
      await fetch('/api/leads', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, keepalive: true,
        body: JSON.stringify({
          source, vehicleId: vehicle.id, contactConsent: false,
          attribution: {
            utmSource: params.get('utm_source') ?? undefined,
            utmMedium: params.get('utm_medium') ?? undefined,
            utmCampaign: params.get('utm_campaign') ?? undefined,
            referrer: document.referrer || undefined,
            landingPath: window.location.pathname,
          },
        }),
      });
    } catch {
      // Attribution must never block the buyer from reaching the dealer.
    } finally {
      setPending(null);
    }
  }

  const waHref = whatsappLink(vehicle.dealerSnapshot.whatsappPhone, {
    vehicleTitle: vehicle.title,
    reference: vehicle.id.slice(-6).toUpperCase(),
    vehicleUrl: typeof window === 'undefined' ? undefined : window.location.href,
  });

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex gap-2 border-t border-line bg-white p-3 md:static md:border-0 md:p-0">
      <a
        href={waHref} target="_blank" rel="noopener noreferrer"
        onClick={() => record('whatsapp_click')}
        className="flex-1 rounded-lg bg-yard-500 py-3 text-center font-semibold text-white"
      >
        {pending === 'whatsapp_click' ? 'Opening WhatsApp…' : 'WhatsApp dealer'}
      </a>
      <a
        href={`tel:${vehicle.dealerSnapshot.primaryPhone}`}
        onClick={() => record('call_click')}
        className="flex-1 rounded-lg border border-yard-500 py-3 text-center font-semibold text-yard-600"
      >
        Call dealer
      </a>
    </div>
  );
}
