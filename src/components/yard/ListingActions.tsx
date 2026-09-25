'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Vehicle } from '@/lib/domain/types';

export function ListingActions({ vehicle }: { vehicle: Vehicle }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const request = async (method: 'PATCH' | 'DELETE', body?: object) => { setBusy(true); await fetch(`/api/yard/listings/${vehicle.id}`, { method, headers: body ? { 'content-type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined }); router.refresh(); setBusy(false); };
  return <div className="flex flex-wrap items-center gap-2"><a href={`/yard/listings/${vehicle.id}/edit`} className="font-semibold text-yard-600 hover:underline">Edit</a>{vehicle.status !== 'sold' && <button disabled={busy} onClick={() => request('PATCH', { status: 'sold' })} className="text-xs font-semibold text-ink-muted hover:text-ink">Mark sold</button>}{vehicle.status !== 'archived' && <button disabled={busy} onClick={() => request('DELETE')} className="text-xs font-semibold text-red-600 hover:text-red-700">Delete</button>}<button disabled={busy} onClick={() => request('PATCH', { isSponsored: !vehicle.isSponsored })} className="text-xs font-semibold text-orange-700 hover:text-orange-800">{vehicle.isSponsored ? 'Remove sponsor' : 'Sponsor'}</button></div>;
}