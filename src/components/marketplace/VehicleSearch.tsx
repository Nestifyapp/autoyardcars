import Link from 'next/link';
import { CarFront, CircleGauge, Fuel, Leaf, Search, Truck, UsersRound, Zap } from 'lucide-react';

export function VehicleSearch({ hero = false }: { hero?: boolean }) {
  return (
    <form action="/cars" className={`grid gap-2 rounded-xl border border-line bg-white p-1.5 shadow-sm ${hero ? 'sm:grid-cols-[1fr_auto]' : 'sm:grid-cols-[1fr_auto_auto]'}`}>
      <label className="sr-only" htmlFor="vehicle-search">Search vehicles</label>
      <input id="vehicle-search" name="q" placeholder={hero ? 'Search make, model, location or price...' : 'Search make, model or body type'} className="min-w-0 rounded-lg px-3 py-3 text-sm text-ink outline-none placeholder:text-ink-muted focus:ring-2 focus:ring-yard-500" />
      {!hero && <select name="bodyType" defaultValue="" className="rounded-lg border border-line bg-white px-3 py-3 text-sm text-ink outline-none focus:ring-2 focus:ring-yard-500">
        <option value="">Any body type</option>
        <option value="suv">SUV</option>
        <option value="sedan">Sedan</option>
        <option value="hatchback">Hatchback</option>
        <option value="pickup">Pickup</option>
      </select>}
      <button type="submit" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-yard-500 px-5 py-3 text-sm font-semibold text-white hover:bg-yard-600"><Search className="h-4 w-4" aria-hidden />{hero ? 'Search' : 'Search cars'}</button>
    </form>
  );
}

const bodyTypes = [
  { label: 'Pickup', href: '/cars?bodyType=pickup', icon: Truck },
  { label: 'SUV', href: '/cars?bodyType=suv', icon: CarFront },
  { label: 'Sedan', href: '/cars?bodyType=sedan', icon: CarFront },
  { label: 'Wagon', href: '/cars?bodyType=station_wagon', icon: UsersRound },
  { label: 'Hatchback', href: '/cars?bodyType=hatchback', icon: CircleGauge },
  { label: 'Electric', href: '/cars?fuelType=electric', icon: Zap },
  { label: 'More', href: '/cars', icon: CarFront },
];

export function BodyTypeTiles() {
  return (
    <section aria-labelledby="shop-by-type" className="border-b border-line bg-white px-4 py-5 md:px-6">
      <div className="mx-auto max-w-7xl">
        <h2 id="shop-by-type" className="font-display text-lg font-bold text-ink">Shop by vehicle type</h2>
        <nav aria-label="Shop by vehicle type" className="-mx-4 mt-3 flex snap-x gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:overflow-visible md:px-0">
          {bodyTypes.map(({ label, href, icon: Icon }) => (
            <Link key={label} href={href} className="inline-flex min-h-11 shrink-0 snap-start items-center gap-2 rounded-full border border-line bg-white px-4 text-sm font-medium text-ink transition hover:border-yard-500 hover:bg-yard-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-yard-500">
              <Icon className="h-4 w-4 text-yard-600" aria-hidden />{label}
            </Link>
          ))}
        </nav>
      </div>
    </section>
  );
}

export function BrowseLinks() {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs">
      <Link href="/cars?collection=fuel-savers" className="inline-flex min-h-8 items-center gap-1 text-ink-muted hover:text-yard-600"><Fuel className="h-3.5 w-3.5 text-yard-600" aria-hidden />Fuel efficient</Link>
      <Link href="/cars?collection=family-cars" className="inline-flex min-h-8 items-center gap-1 text-ink-muted hover:text-yard-600"><UsersRound className="h-3.5 w-3.5 text-yard-600" aria-hidden />Family cars</Link>
      <Link href="/cars?collection=under-1m" className="inline-flex min-h-8 items-center gap-1 text-ink-muted hover:text-yard-600"><CircleGauge className="h-3.5 w-3.5 text-yard-600" aria-hidden />Under 1M KES</Link>
      <Link href="/cars?collection=hybrid-cars" className="inline-flex min-h-8 items-center gap-1 text-ink-muted hover:text-yard-600"><Leaf className="h-3.5 w-3.5 text-yard-600" aria-hidden />Hybrid cars</Link>
      <Link href="/cars?collection=financing-available" className="inline-flex min-h-8 items-center text-ink-muted hover:text-yard-600">Financing available</Link>
    </div>
  );
}
