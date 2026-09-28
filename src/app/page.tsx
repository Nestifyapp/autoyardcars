import Image from 'next/image';
import Link from 'next/link';
import { getSearchProvider } from '@/lib/services/search';
import { brand } from '@/lib/brand';
import { VehicleCard } from '@/components/marketplace/VehicleCard';
import { BodyTypeTiles, BrowseLinks, VehicleSearch } from '@/components/marketplace/VehicleSearch';
import { GroupingSection, HOME_GROUPINGS } from '@/components/marketplace/GroupingSection';
import type { Vehicle } from '@/lib/domain/types';

export const revalidate = 120;

export default async function HomePage() {
  let items = [] as Awaited<ReturnType<ReturnType<typeof getSearchProvider>['searchVehicles']>>['items'];
  try {
    ({ items } = await getSearchProvider().searchVehicles({ sort: 'newest', limit: 8 }));
  } catch (error) {
    console.error('[home] Vehicle search unavailable:', error);
  }
  const grouped = await Promise.all(HOME_GROUPINGS.map(async ({ id: grouping }) => {
    try { return [grouping, (await getSearchProvider().searchVehicles({ grouping, sort: 'newest', limit: 60 })).items] as const; }
    catch (error) { console.error(`[home] Grouping ${grouping} unavailable:`, error); return [grouping, [] as Vehicle[]] as const; }
  }));
  const heroVehicle = items.find(vehicle => vehicle.coverImage?.url);
  const heroImage = heroVehicle?.coverImage?.url ?? 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1400&q=85';

  return (
    <main className="bg-white">
      <section className="border-b border-line bg-[#fbfcfc] px-4 py-8 md:px-6 md:py-12">
        <div className="mx-auto grid max-w-7xl items-center gap-8 md:grid-cols-[0.9fr_1.1fr] md:gap-12">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-yard-600">Kenya&apos;s vehicle marketplace</p>
            <h1 className="mt-3 max-w-xl font-display text-4xl font-bold leading-tight text-ink md:text-5xl">Find your next car in Kenya.</h1>
            <p className="mt-3 max-w-lg text-base leading-7 text-ink-muted">Browse vehicles from dealers and sellers across Kenya.</p>
            <div className="mt-6 max-w-2xl"><VehicleSearch hero /></div>
            <div className="mt-4"><BrowseLinks /></div>
          </div>
          <div className="relative aspect-[1.45] overflow-hidden rounded-2xl bg-surface md:aspect-[1.35]">
            <Image
              src={heroImage}
              alt={heroVehicle ? heroVehicle.coverImage?.alt ?? heroVehicle.title : 'Vehicle on the road'}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 55vw"
              className="object-cover"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
            {heroVehicle && <Link href={`/cars/${heroVehicle.slug}`} className="absolute bottom-4 left-4 rounded-lg bg-white/95 px-3 py-2 text-sm font-semibold text-ink shadow-sm">Explore {heroVehicle.title}</Link>}
          </div>
        </div>
      </section>

      <BodyTypeTiles />

      <section className="mx-auto max-w-7xl px-4 pb-7 pt-8 md:px-6 md:pt-10">
        <div className="flex items-end justify-between gap-4">
          <div><p className="text-xs font-bold uppercase tracking-wide text-yard-600">Fresh stock</p><h2 className="mt-1 font-display text-2xl font-bold text-ink">Recently listed</h2></div>
          <Link href="/cars" className="text-sm font-semibold text-yard-600 hover:underline">View all cars</Link>
        </div>
        {items.length > 0 ? <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">{items.map((vehicle, i) => <VehicleCard key={vehicle.id} vehicle={vehicle} position={i} />)}</div> : <p className="mt-5 rounded-card border border-line p-6 text-ink-muted">No vehicles are listed right now. Browse all cars to explore available filters.</p>}
      </section>

      {grouped.map(([grouping, vehicles]) => <GroupingSection key={grouping} grouping={grouping} vehicles={vehicles} />)}

      <section id="why-autoyardcars" className="scroll-mt-24 border-y border-line bg-[#f8fafb] px-4 py-9 md:px-6">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-bold uppercase tracking-wide text-yard-600">Buy with clarity</p>
          <h2 className="mt-1 font-display text-2xl font-bold text-ink">Why {brand.name}?</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div><h3 className="font-semibold text-ink">Verified yard profiles</h3><p className="mt-1 text-sm leading-6 text-ink-muted">See seller identity and contact details alongside their stock.</p></div>
            <div><h3 className="font-semibold text-ink">Useful vehicle details</h3><p className="mt-1 text-sm leading-6 text-ink-muted">Review price, mileage, condition, and specifications before you enquire.</p></div>
            <div><h3 className="font-semibold text-ink">Financing estimates</h3><p className="mt-1 text-sm leading-6 text-ink-muted">Explore repayment estimates on eligible vehicle listings.</p></div>
            <div><h3 className="font-semibold text-ink">Direct dealer contact</h3><p className="mt-1 text-sm leading-6 text-ink-muted">Reach sellers by phone or WhatsApp from the vehicle details page.</p></div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-9 md:px-6">
        <div className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-5 sm:flex-row sm:items-center sm:justify-between md:px-7">
          <div><p className="text-xs font-bold uppercase tracking-wide text-yard-600">For dealers and yards</p><h2 className="mt-1 font-display text-2xl font-bold text-ink">Bring your stock to more buyers.</h2><p className="mt-1 text-sm text-ink-muted">Create a yard profile and publish your vehicle listings.</p></div>
          <Link href="/sell/dealer" className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg bg-yard-500 px-5 py-3 text-sm font-semibold text-white hover:bg-yard-600">List your stock</Link>
        </div>
      </section>
    </main>
  );
}