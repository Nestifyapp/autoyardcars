'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Vehicle, VehicleGrouping } from '@/lib/domain/types';

const groupOptions: { value: VehicleGrouping; label: string }[] = [
  { value: 'uber_ready', label: 'Uber / ride-share ready' },
  { value: 'original_paint', label: 'Original paint' },
];

export function VehicleForm({ vehicle }: { vehicle?: Vehicle }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [groupings, setGroupings] = useState<VehicleGrouping[]>(vehicle?.groupings ?? []);
  const [form, setForm] = useState({
    make: vehicle?.make ?? '', model: vehicle?.model ?? '', variant: vehicle?.variant ?? '', yearOfManufacture: vehicle?.yearOfManufacture ?? new Date().getFullYear(), price: vehicle?.price ?? 0,
    mileageKm: vehicle?.mileageKm ?? 0, transmission: vehicle?.transmission ?? 'automatic', fuelType: vehicle?.fuelType ?? 'petrol', bodyType: vehicle?.bodyType ?? 'sedan', condition: vehicle?.condition ?? 'foreign_used', usageType: vehicle?.usageType ?? vehicle?.condition ?? 'foreign_used',
    engineCapacityCc: vehicle?.engineCapacityCc ?? 0, exteriorColour: vehicle?.exteriorColour ?? '', seats: vehicle?.seats ?? 5, description: vehicle?.description ?? '', isOriginalPaint: vehicle?.isOriginalPaint ?? false, isLuxury: vehicle?.isLuxury ?? false,
  });
  const set = (key: string, value: string | number | boolean) => setForm(current => ({ ...current, [key]: value }));
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setError('');
    const response = await fetch(vehicle ? `/api/yard/listings/${vehicle.id}` : '/api/yard/listings', { method: vehicle ? 'PATCH' : 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...form, groupings }) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) { setError(data.error ?? 'Could not save listing.'); setBusy(false); return; }
    router.push('/yard/listings'); router.refresh();
  };
  return <form onSubmit={submit} className="space-y-6 rounded-card border border-line bg-white p-5 shadow-sm">
    <div><h1 className="font-display text-2xl font-bold text-ink">{vehicle ? 'Edit listing' : 'Create listing'}</h1><p className="mt-1 text-sm text-ink-muted">Groupings are refreshed automatically when you save.</p></div>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {([['make', 'Make', 'text'], ['model', 'Model', 'text'], ['variant', 'Variant', 'text'], ['yearOfManufacture', 'Year', 'number'], ['price', 'Price (KES)', 'number'], ['mileageKm', 'Mileage (km)', 'number'], ['engineCapacityCc', 'Engine (cc)', 'number'], ['exteriorColour', 'Exterior colour', 'text'], ['seats', 'Seats', 'number']] as const).map(([key, label, type]) => <label key={key} className="text-sm font-semibold text-ink">{label}<input required={['make', 'model', 'yearOfManufacture', 'price'].includes(key)} type={type} value={form[key]} onChange={event => set(key, type === 'number' ? Number(event.target.value) : event.target.value)} className="mt-1 w-full rounded-lg border border-line px-3 py-2.5 font-normal outline-none focus:ring-2 focus:ring-yard-500" /></label>)}
      <label className="text-sm font-semibold text-ink">Usage type<select value={form.usageType} onChange={event => { set('usageType', event.target.value); set('condition', event.target.value); }} className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2.5 font-normal"><option value="foreign_used">Foreign Used</option><option value="locally_used">Locally Used</option><option value="brand_new">Brand New</option></select></label>
      {([['transmission', 'Transmission', ['automatic', 'manual', 'cvt', 'dct', 'amt']], ['fuelType', 'Fuel type', ['petrol', 'diesel', 'hybrid', 'electric', 'plugin_hybrid', 'lpg']], ['bodyType', 'Body type', ['hatchback', 'sedan', 'suv', 'crossover', 'station_wagon', 'pickup', 'van', 'minivan', 'bus', 'truck', 'coupe', 'convertible']]] as const).map(([key, label, options]) => <label key={key} className="text-sm font-semibold text-ink">{label}<select value={form[key]} onChange={event => set(key, event.target.value)} className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2.5 font-normal">{options.map(option => <option key={option} value={option}>{option.replace('_', ' ')}</option>)}</select></label>)}
    </div>
    <label className="block text-sm font-semibold text-ink">Description<textarea value={form.description} onChange={event => set('description', event.target.value)} rows={4} className="mt-1 w-full rounded-lg border border-line px-3 py-2.5 font-normal outline-none focus:ring-2 focus:ring-yard-500" /></label>
    <div className="grid gap-3 sm:grid-cols-2">
      {([['isOriginalPaint', 'Original paint'], ['isLuxury', 'Luxury / VIP edition']] as const).map(([key, label]) => <label key={key} className="flex items-center gap-3 rounded-lg border border-line p-3 text-sm font-semibold"><input type="checkbox" checked={form[key]} onChange={event => set(key, event.target.checked)} className="h-4 w-4 accent-yard-500" />{label}</label>)}
      {groupOptions.map(option => <label key={option.value} className="flex items-center gap-3 rounded-lg border border-line p-3 text-sm font-semibold"><input type="checkbox" checked={groupings.includes(option.value)} onChange={event => setGroupings(current => event.target.checked ? [...new Set([...current, option.value])] : current.filter(value => value !== option.value))} className="h-4 w-4 accent-yard-500" />{option.label}</label>)}
    </div>
    {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    <button disabled={busy} className="rounded-lg bg-yard-500 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">{busy ? 'Saving...' : vehicle ? 'Save changes' : 'Save draft'}</button>
  </form>;
}