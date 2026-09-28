import Link from 'next/link';
import Image from 'next/image';
import { BadgeCheck, CalendarDays, Flame, Gauge, MapPin, Settings2 } from 'lucide-react';
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

export function VehicleCard({ vehicle, position, className = '' }: { vehicle: Vehicle; position?: number; className?: string }) {
  const transmissionLabel = vehicle.transmission === 'cvt' ? 'CVT' : vehicle.transmission;
  const details = [
    { label: String(vehicle.yearOfManufacture), Icon: CalendarDays },
    vehicle.mileageKm != null ? { label: `${vehicle.mileageKm.toLocaleString()} km`, Icon: Gauge } : null,
    vehicle.transmission ? { label: transmissionLabel, Icon: Settings2 } : null,
    vehicle.location?.locationName ? { label: vehicle.location.locationName, Icon: MapPin } : null,
  ].filter((item): item is NonNullable<typeof item> => item !== null);

  return (
    <Link
      href={`/cars/${vehicle.slug}`}
      data-vehicle-id={vehicle.id}
      data-position={position}
      className={`group block overflow-hidden rounded-card border border-line bg-white transition hover:border-yard-100 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-yard-500 ${className}`}
    >
      <div className="relative aspect-[4/3] bg-surface">
        {vehicle.coverImage?.url ? (
          <Image src={vehicle.coverImage.variants?.card || vehicle.coverImage.url} alt={vehicle.coverImage.alt || vehicle.title} fill sizes="(max-width: 640px) 82vw, (max-width: 1024px) 44vw, 25vw" className="object-cover transition duration-300 group-hover:scale-[1.02]" />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-ink-muted">Vehicle photo unavailable</div>
        )}
        {vehicle.status === 'sold' && (
          <span className="absolute left-3 top-3 rounded bg-ink px-2 py-1 text-xs font-semibold text-white">Sold</span>
        )}
        {vehicle.boost?.active && vehicle.status !== 'sold' && (
          <span className="absolute left-3 top-3 rounded bg-signal px-2 py-1 text-xs font-semibold text-ink">Featured</span>
        )}
        {vehicle.financingEligible && vehicle.status !== 'sold' && (
          <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1.5 text-[11px] font-semibold text-ink shadow-sm"><Flame className="h-3.5 w-3.5 text-yard-600" aria-hidden /> Finance available</span>
        )}
        {vehicle.dealerSnapshot?.verified && <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1.5 text-[11px] font-semibold text-ink shadow-sm"><BadgeCheck className="h-3.5 w-3.5 text-yard-600" aria-hidden /> Verified seller</span>}
      </div>

      <div className="flex min-h-36 flex-col p-3.5">
        <h3 className="line-clamp-1 text-[15px] font-semibold text-ink">{vehicle.title}</h3>
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1.5 text-xs text-ink-muted">
          {details.map(({ label, Icon }) => <span key={label} className="inline-flex items-center gap-1"><Icon className="h-3.5 w-3.5 text-yard-600" aria-hidden />{label}</span>)}
        </div>
        <div className="mt-auto flex items-end justify-between gap-2 border-t border-line pt-3">
          <span className="font-display text-lg font-bold tabular-nums text-ink">{formatKes(vehicle.price)}</span>
          {freshness(vehicle) && <span className="text-right text-[10px] text-ink-muted">{freshness(vehicle)}</span>}
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
