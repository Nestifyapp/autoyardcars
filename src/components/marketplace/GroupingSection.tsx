import Link from 'next/link';
import { VehicleCard } from './VehicleCard';
import type { Vehicle, VehicleGrouping } from '@/lib/domain/types';

const labels: Record<VehicleGrouping, string> = {
  luxury_executive: 'Luxury & Executive', uber_ready: 'Ride-share ready', fresh_import: 'Fresh off the ship', locally_used: 'Locally loved', low_mileage: 'Low-mile gems', under_50k_miles: 'Under 50k km', hot_today: 'Hot today', original_paint: 'Original paint',
};

export function GroupingSection({ grouping, vehicles }: { grouping: VehicleGrouping; vehicles: Vehicle[] }) {
  if (!vehicles.length) return null;
  return <section className="mx-auto max-w-7xl px-4 py-8 md:px-6"><div className="flex items-end justify-between gap-4"><div><p className="text-sm font-semibold text-yard-600">Smart grouping</p><h2 className="mt-1 font-display text-2xl font-bold text-ink">{labels[grouping]}</h2></div><Link href={`/cars?grouping=${grouping}`} className="text-sm font-semibold text-yard-600 hover:underline">See all</Link></div><div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">{vehicles.slice(0, 4).map((vehicle, index) => <VehicleCard key={vehicle.id} vehicle={vehicle} position={index} />)}</div></section>;
}