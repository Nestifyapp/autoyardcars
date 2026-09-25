import Link from 'next/link';
import Image from 'next/image';
import { BadgeCheck, CalendarDays, CarFront, Flame, Fuel, Gauge, MapPin, Settings2, ShieldCheck, UsersRound, Zap } from 'lucide-react';
import { formatKes } from '@/lib/brand';
import type { Vehicle } from '@/lib/domain/types';

const daysSince = (value: unknown) => {
  const date = (value as { toDate?: () => Date })?.toDate?.() ?? (value ? new Date(value as string) : null);
  return date ? Math.floor((Date.now() - date.getTime()) / 86_400_000) : null;
};

/** Freshness is stated honestly: old stock is not dressed up as new. */
function freshness(vehicle: Vehicle) {
  const days = daysSince(vehicle.lastConfirmedAt);
  if (days === null) return null;
  if (days <= 7) return 'Confirmed this week';
  if (days <= 30) return `Confirmed ${days} days ago`;
  return 'Availability not confirmed recently';
}

export function VehicleCard({ vehicle, position }: { vehicle: Vehicle; position?: number }) {
  const fuelLabel = vehicle.fuelType.replace('_', ' ');
  const transmissionLabel = vehicle.transmission === 'cvt' ? 'CVT' : vehicle.transmission;

  return (
    <Link
      href={`/cars/${vehicle.slug}`}
      data-vehicle-id={vehicle.id}
      data-position={position}
      className="group block overflow-hidden rounded-card border border-line bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-yard-100 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-yard-500"
    >
      <div className="relative aspect-[4/3] bg-surface">
        {vehicle.coverImage ? (
          <Image src={vehicle.coverImage.url} alt={vehicle.coverImage.alt ?? vehicle.title} fill sizes="(max-width: 640px) 100vw, 320px" className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-ink-muted">Photos coming soon</div>
        )}
        {vehicle.status === 'sold' && (
          <span className="absolute left-3 top-3 rounded bg-ink px-2 py-1 text-xs font-semibold text-white">Sold</span>
        )}
        {vehicle.boost?.active && vehicle.status !== 'sold' && (
          <span className="absolute left-3 top-3 rounded bg-signal px-2 py-1 text-xs font-semibold text-ink">Featured</span>
        )}
        {vehicle.financingEligible && vehicle.status !== 'sold' && (
          <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-amber-400 px-2 py-1 text-[11px] font-bold text-slate-950 shadow-sm"><Flame className="h-3.5 w-3.5" aria-hidden /> Finance available</span>
        )}
      </div>

      <div className="space-y-3 p-3.5">
        <div>
          <p className="font-display text-lg font-semibold tabular-nums text-yard-900">{formatKes(vehicle.price)}</p>
          <h3 className="mt-1 break-words text-[15px] font-semibold leading-5 text-ink">{vehicle.title}</h3>
        </div>
        <div className="grid grid-cols-2 gap-2 text-[11px] text-ink-muted">
          <span className="flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5 text-sky-600" aria-hidden />{vehicle.yearOfManufacture}</span>
          <span className="flex items-center gap-1.5"><Gauge className="h-3.5 w-3.5 text-orange-500" aria-hidden />{vehicle.mileageKm ? `${Math.round(vehicle.mileageKm / 1000)}k km` : 'Mileage n/a'}</span>
          <span className="flex items-center gap-1.5 capitalize"><Fuel className="h-3.5 w-3.5 text-emerald-600" aria-hidden />{fuelLabel}</span>
          <span className="flex items-center gap-1.5 capitalize"><Settings2 className="h-3.5 w-3.5 text-violet-600" aria-hidden />{transmissionLabel}</span>
          <span className="flex items-center gap-1.5"><Zap className="h-3.5 w-3.5 text-amber-500" aria-hidden />{vehicle.engineCapacityCc} cc</span>
          <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-rose-600" aria-hidden />{vehicle.location.locationName}</span>
        </div>
        <div className="flex flex-wrap gap-1.5 text-[11px]">
          <span className="flex items-center gap-1 rounded-full bg-sky-50 px-2 py-1 capitalize text-sky-700"><CarFront className="h-3.5 w-3.5" aria-hidden />{vehicle.bodyType.replace('_', ' ')}</span>
          <span className="flex items-center gap-1 rounded-full bg-violet-50 px-2 py-1 text-violet-700"><UsersRound className="h-3.5 w-3.5" aria-hidden />{vehicle.seats} seats</span>
          <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 capitalize text-emerald-700"><ShieldCheck className="h-3.5 w-3.5" aria-hidden />{vehicle.condition.replace('_', ' ')}</span>
        </div>
        <div className="flex items-center gap-1.5 border-t border-line pt-2 text-xs text-ink-muted">
          <span className="truncate">{vehicle.dealerSnapshot.name}</span>
          {vehicle.dealerSnapshot.verified && <BadgeCheck className="h-4 w-4 shrink-0 text-yard-500" aria-label="Verified dealer" />}
          <span className="ml-auto shrink-0">{freshness(vehicle)}</span>
        </div>
      </div>
    </Link>
  );
}

export function VehicleCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-card border border-line bg-white">
      <div className="aspect-[4/3] animate-pulse bg-surface" />
      <div className="space-y-2 p-3.5">
        <div className="h-5 w-28 animate-pulse rounded bg-surface" />
        <div className="h-4 w-full animate-pulse rounded bg-surface" />
        <div className="h-3 w-32 animate-pulse rounded bg-surface" />
      </div>
    </div>
  );
}
