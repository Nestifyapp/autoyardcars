'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function OnboardingForm() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', phone: '', whatsappPhone: '', email: '', addressLine: '', description: '' });
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const update = (key: keyof typeof form, value: string) => setForm(current => ({ ...current, [key]: value }));
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setError('');
    const response = await fetch('/api/yard/onboarding', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(form) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) { setError(data.error ?? 'Could not create your yard.'); setBusy(false); return; }
    router.push('/yard/listings'); router.refresh();
  };
  return <form onSubmit={submit} className="space-y-5 rounded-card border border-line bg-white p-6 shadow-sm"><div><h1 className="font-display text-2xl font-bold">Set up your yard</h1><p className="mt-1 text-sm text-ink-muted">Your profile will be reviewed before it appears publicly.</p></div><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold">Yard name<input required value={form.name} onChange={event => update('name', event.target.value)} className="mt-1 w-full rounded-lg border border-line px-3 py-2.5 font-normal" /></label><label className="text-sm font-semibold">Primary phone<input required value={form.phone} onChange={event => update('phone', event.target.value)} placeholder="07... or 254..." className="mt-1 w-full rounded-lg border border-line px-3 py-2.5 font-normal" /></label><label className="text-sm font-semibold">WhatsApp number<input value={form.whatsappPhone} onChange={event => update('whatsappPhone', event.target.value)} placeholder="2547..." className="mt-1 w-full rounded-lg border border-line px-3 py-2.5 font-normal" /></label><label className="text-sm font-semibold">Yard email<input type="email" value={form.email} onChange={event => update('email', event.target.value)} className="mt-1 w-full rounded-lg border border-line px-3 py-2.5 font-normal" /></label></div><label className="block text-sm font-semibold">Address or area<input value={form.addressLine} onChange={event => update('addressLine', event.target.value)} placeholder="Kangundo Road, Nairobi" className="mt-1 w-full rounded-lg border border-line px-3 py-2.5 font-normal" /></label><label className="block text-sm font-semibold">About the yard<textarea value={form.description} onChange={event => update('description', event.target.value)} rows={4} className="mt-1 w-full rounded-lg border border-line px-3 py-2.5 font-normal" /></label>{error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}<button disabled={busy} className="rounded-lg bg-yard-500 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">{busy ? 'Creating yard...' : 'Submit yard for review'}</button></form>;
}