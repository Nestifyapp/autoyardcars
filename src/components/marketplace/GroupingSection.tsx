import Link from 'next/link';
import { VehicleCard } from './VehicleCard';
import type { Vehicle, VehicleGrouping } from '@/lib/domain/types';

export const HOME_GROUPINGS: { id: VehicleGrouping; title: string }[] = [
  { id: 'hot_today', title: 'Hot today' },
  { id: 'fresh_import', title: 'Fresh arrivals' },
  { id: 'low_mileage', title: 'Low-mile gems' },
  { id: 'luxury_executive', title: 'Luxury & Executive' },
  { id: 'locally_used', title: 'Locally loved' },
  { id: 'uber_ready', title: 'Ride-share ready' },
  { id: 'original_paint', title: 'Original paint' },
];

export function GroupingSection({ grouping, vehicles }: { grouping: VehicleGrouping; vehicles: Vehicle[] }) {
  if (vehicles.length < 3) return null;
  const title = HOME_GROUPINGS.find(item => item.id === grouping)?.title ?? grouping;

  return (
    <section aria-labelledby={`group-${grouping}`} className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
      <div className="flex items-end justify-between gap-4">
        <h2 id={`group-${grouping}`} className="font-display text-xl font-bold text-ink md:text-2xl">{title}</h2>
        <Link href={`/cars?grouping=${grouping}`} className="shrink-0 text-sm font-semibold text-yard-600 hover:underline">See all <span aria-hidden="true">→</span></Link>
      </div>
      <div className="mt-4 grid auto-cols-[82%] grid-flow-col gap-3 overflow-x-auto pb-3 snap-x snap-mandatory sm:auto-cols-[47%] md:auto-cols-[32%] lg:grid-flow-row lg:auto-cols-auto lg:grid-cols-4 lg:overflow-visible">
        {vehicles.slice(0, 4).map((vehicle, index) => <VehicleCard key={vehicle.id} vehicle={vehicle} position={index} className="snap-start" />)}
      </div>
    </section>
  );
}