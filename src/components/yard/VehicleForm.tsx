'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ImagePlus, Star, Trash2 } from 'lucide-react';
import type { Vehicle, VehicleGrouping } from '@/lib/domain/types';

const groupOptions: { value: VehicleGrouping; label: string }[] = [
  { value: 'uber_ready', label: 'Uber / ride-share ready' },
  { value: 'original_paint', label: 'Original paint' },
];

type ListingFormVehicle = Pick<Vehicle,
  'id' | 'make' | 'model' | 'variant' | 'yearOfManufacture' | 'price' | 'mileageKm' |
  'transmission' | 'fuelType' | 'bodyType' | 'condition' | 'usageType' | 'engineCapacityCc' |
  'exteriorColour' | 'seats' | 'description' | 'isOriginalPaint' | 'isLuxury' | 'groupings' | 'images' | 'coverImage'
>;

export function VehicleForm({ vehicle }: { vehicle?: ListingFormVehicle }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const [images, setImages] = useState(vehicle?.images ?? []);
  const [coverImageId, setCoverImageId] = useState(vehicle?.coverImage?.id ?? vehicle?.images?.[0]?.id);
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
    router.push(vehicle ? '/yard/listings' : `/yard/listings/${data.id}/edit`); router.refresh();
  };
  const uploadPhotos = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!vehicle || !files?.length) return;
    setPhotoBusy(true); setPhotoError('');
    const body = new FormData();
    Array.from(files).forEach(file => body.append('files', file));
    try {
      const response = await fetch(`/api/yard/listings/${vehicle.id}/images`, { method: 'POST', body });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error ?? 'Could not upload photos.');
      setImages(data.images);
      setCoverImageId(data.coverImage?.id);
    } catch (cause) {
      setPhotoError(cause instanceof Error ? cause.message : 'Could not upload photos.');
    } finally {
      event.target.value = '';
      setPhotoBusy(false);
    }
  };
  const updatePhoto = async (method: 'PATCH' | 'DELETE', imageId: string) => {
    if (!vehicle) return;
    setPhotoBusy(true); setPhotoError('');
    try {
      const response = await fetch(`/api/yard/listings/${vehicle.id}/images`, {
        method,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ imageId }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error ?? 'Could not update the gallery.');
      if (method === 'DELETE') {
        setImages(data.images);
        setCoverImageId(data.coverImage?.id);
      } else {
        setCoverImageId(data.coverImage.id);
      }
    } catch (cause) {
      setPhotoError(cause instanceof Error ? cause.message : 'Could not update the gallery.');
    } finally {
      setPhotoBusy(false);
    }
  };
  return <form onSubmit={submit} className="space-y-6 rounded-card border border-line bg-white p-5 shadow-sm">
    <div><h1 className="font-display text-2xl font-bold text-ink">{vehicle ? 'Edit listing' : 'Create listing'}</h1><p className="mt-1 text-sm text-ink-muted">Groupings are refreshed automatically when you save.</p></div>
    <section aria-labelledby="vehicle-photos-heading" className="space-y-4 rounded-xl border border-line p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h2 id="vehicle-photos-heading" className="font-semibold text-ink">Vehicle photos</h2><p className="mt-1 text-sm text-ink-muted">Upload up to 10 photos. The cover photo appears first in the listing gallery.</p></div>
        {vehicle && <label htmlFor="vehicle-photo-upload" className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg bg-yard-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-yard-600 ${photoBusy ? 'pointer-events-none opacity-60' : ''}`}><ImagePlus className="h-4 w-4" aria-hidden />{photoBusy ? 'Working...' : 'Add photos'}<input id="vehicle-photo-upload" type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple disabled={photoBusy || images.length >= 10} onChange={uploadPhotos} className="sr-only" /></label>}
      </div>
      {!vehicle && <p className="rounded-lg bg-surface p-3 text-sm text-ink-muted">Save this draft first. You can add its photos in the editor that opens next.</p>}
      {vehicle && images.length === 0 && <p className="rounded-lg bg-surface p-3 text-sm text-ink-muted">No photos added yet.</p>}
      {images.length > 0 && <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{images.map(image => <div key={image.id} className="overflow-hidden rounded-lg border border-line">
        <div className="relative aspect-[4/3] bg-surface"><Image src={image.variants?.card || image.url} alt={image.alt || (vehicle ? `${vehicle.yearOfManufacture} ${vehicle.make} ${vehicle.model}` : 'Vehicle photo')} fill sizes="(max-width: 640px) 45vw, 220px" className="object-cover" />{coverImageId === image.id && <span className="absolute left-2 top-2 rounded-full bg-white/95 px-2 py-1 text-[11px] font-semibold text-ink">Cover photo</span>}</div>
        <div className="flex items-center justify-between gap-1 p-2"><button type="button" onClick={() => updatePhoto('PATCH', image.id)} disabled={photoBusy || coverImageId === image.id} className="inline-flex min-h-9 items-center gap-1 rounded px-2 text-xs font-medium text-ink-muted hover:bg-surface disabled:opacity-50" aria-label={`Set ${image.alt || 'photo'} as cover`}><Star className="h-3.5 w-3.5 text-yard-600" aria-hidden />Cover</button><button type="button" onClick={() => updatePhoto('DELETE', image.id)} disabled={photoBusy} className="inline-flex h-9 w-9 items-center justify-center rounded text-ink-muted hover:bg-red-50 hover:text-red-700" aria-label={`Remove ${image.alt || 'photo'}`}><Trash2 className="h-4 w-4" aria-hidden /></button></div>
      </div>)}</div>}
      {photoError && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{photoError}</p>}
    </section>
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