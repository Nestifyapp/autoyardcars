import Link from 'next/link';
import { CarFront, Check, CircleGauge, Fuel, Leaf, UsersRound } from 'lucide-react';

export function VehicleSearch({ hero = false }: { hero?: boolean }) {
  return (
    <form action="/cars" className={`grid gap-2 rounded-card border border-line bg-white p-2 shadow-sm ${hero ? 'sm:grid-cols-[1fr_auto]' : 'sm:grid-cols-[1fr_auto_auto]'}`}>
      <label className="sr-only" htmlFor="vehicle-search">Search vehicles</label>
      <input id="vehicle-search" name="q" placeholder={hero ? 'Make, model, location or price' : 'Search make, model or body type'} className="min-w-0 rounded-lg px-3 py-3 text-sm outline-none placeholder:text-ink-muted focus:ring-2 focus:ring-yard-500" />
      {!hero && <select name="bodyType" defaultValue="" className="rounded-lg border border-line bg-white px-3 py-3 text-sm text-ink outline-none focus:ring-2 focus:ring-yard-500">
        <option value="">Any body type</option>
        <option value="suv">SUV</option>
        <option value="sedan">Sedan</option>
        <option value="hatchback">Hatchback</option>
        <option value="pickup">Pickup</option>
      </select>}
      <button type="submit" className="rounded-lg bg-yard-500 px-5 py-3 text-sm font-semibold text-white hover:bg-yard-600">{hero ? 'Search' : 'Search cars'}</button>
    </form>
  );
}

const bodyTypes = [
  { label: 'Pickup', value: 'pickup', icon: CarFront, color: 'bg-orange-500' },
  { label: 'Family wagon', value: 'station_wagon', icon: UsersRound, color: 'bg-amber-500' },
  { label: 'City hatch', value: 'hatchback', icon: CircleGauge, color: 'bg-sky-500' },
  { label: 'Sedan', value: 'sedan', icon: CarFront, color: 'bg-rose-500' },
];

export function BodyTypeTiles() {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {bodyTypes.map(({ label, value, icon: Icon, color }) => (
        <Link key={value} href={`/cars?bodyType=${value}`} className="group rounded-xl border border-white/35 bg-white/15 p-3 text-center backdrop-blur-sm transition hover:-translate-y-1 hover:bg-white/25">
          <span className={`mx-auto flex h-12 w-16 items-center justify-center rounded-lg ${color} text-white shadow-lg`}><Icon className="h-7 w-7" aria-hidden /></span>
          <span className="mt-2 block text-xs font-semibold uppercase tracking-wide text-white">{label}</span>
          <span className="mx-auto mt-2 flex w-fit items-center gap-1 rounded-full bg-yard-500 px-3 py-1 text-[11px] font-bold text-white"><Check className="h-3 w-3" aria-hidden /> Select</span>
        </Link>
      ))}
    </div>
  );
}

export function BrowseLinks() {
  return (
    <div className="flex flex-wrap gap-2 text-sm">
      <Link href="/cars?collection=fuel-savers" className="rounded-full border border-white/50 bg-white px-3 py-2 text-ink-muted hover:border-yard-500 hover:text-yard-600"><Fuel className="mr-1 inline h-3.5 w-3.5" aria-hidden />Fuel efficient</Link>
      <Link href="/cars?collection=family-cars" className="rounded-full border border-white/50 bg-white px-3 py-2 text-ink-muted hover:border-yard-500 hover:text-yard-600"><UsersRound className="mr-1 inline h-3.5 w-3.5" aria-hidden />Family cars</Link>
      <Link href="/cars?collection=under-1m" className="rounded-full border border-white/50 bg-white px-3 py-2 text-ink-muted hover:border-yard-500 hover:text-yard-600"><CircleGauge className="mr-1 inline h-3.5 w-3.5" aria-hidden />Under 1M KES</Link>
      <Link href="/cars?collection=hybrid-cars" className="rounded-full border border-white/50 bg-white px-3 py-2 text-ink-muted hover:border-yard-500 hover:text-yard-600"><Leaf className="mr-1 inline h-3.5 w-3.5" aria-hidden />Hybrid cars</Link>
      <Link href="/cars?collection=financing-available" className="rounded-full border border-white/50 bg-white px-3 py-2 text-ink-muted hover:border-yard-500 hover:text-yard-600">Financing available</Link>
    </div>
  );
}
