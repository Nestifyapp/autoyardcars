import Link from 'next/link';
import { getSearchProvider } from '@/lib/services/search';
import { VehicleCard } from '@/components/marketplace/VehicleCard';
import { BodyTypeTiles, BrowseLinks, VehicleSearch } from '@/components/marketplace/VehicleSearch';
import { brand } from '@/lib/brand';

export const revalidate = 120;

export default async function HomePage() {
  let items = [] as Awaited<ReturnType<ReturnType<typeof getSearchProvider>['searchVehicles']>>['items'];
  try {
    ({ items } = await getSearchProvider().searchVehicles({ sort: 'newest', limit: 8 }));
  } catch (error) {
    console.error('[home] Vehicle search unavailable:', error);
  }

  return (
    <main>
      <section
        className="relative isolate overflow-hidden bg-slate-950 px-4 py-16 text-white md:px-6 md:py-24"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=2200&q=85')", backgroundPosition: 'center', backgroundSize: 'cover' }}
      >
        <div className="absolute inset-0 -z-10 bg-slate-950/70" />
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-300">Kenya&apos;s vehicle marketplace</p>
          <h1 className="mt-4 max-w-3xl font-display text-4xl font-bold leading-[0.98] tracking-tight md:text-7xl">Find your ideal vehicle<br />in Kenya. Verified &amp; local.</h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-white/85 md:text-lg">Explore diverse listings, connect with verified dealers, and find tailored financing for your journey.</p>
          <div className="mt-8 max-w-2xl"><BodyTypeTiles /></div>
          <div className="mt-4 max-w-2xl rounded-card bg-white/95 p-2 shadow-2xl"><VehicleSearch hero /></div>
          <div className="mt-4"><BrowseLinks /></div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 md:px-6">
        <div className="flex items-end justify-between gap-4">
          <div><p className="text-sm font-semibold text-yard-600">Fresh stock</p><h2 className="mt-1 font-display text-2xl font-bold text-ink">Recently listed vehicles</h2></div>
          <Link href="/cars" className="text-sm font-semibold text-yard-600 hover:underline">View all cars</Link>
        </div>
        {items.length > 0 ? <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">{items.map((vehicle, i) => <VehicleCard key={vehicle.id} vehicle={vehicle} position={i} />)}</div> : <p className="mt-5 rounded-card border border-line p-6 text-ink-muted">Sample inventory will appear here after the local database is seeded.</p>}
      </section>

      <section className="border-y border-line bg-white px-4 py-12 md:px-6">
        <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-3">
          <div><h2 className="font-display text-lg font-bold">Verified dealers</h2><p className="mt-2 text-sm leading-6 text-ink-muted">Browse stock from yards with clear contact details and location information.</p></div>
          <div><h2 className="font-display text-lg font-bold">Compare financing</h2><p className="mt-2 text-sm leading-6 text-ink-muted">See repayment estimates before you contact a dealer.</p></div>
          <div><h2 className="font-display text-lg font-bold">Search by area</h2><p className="mt-2 text-sm leading-6 text-ink-muted">Find cars near Kangundo Road, Nairobi and beyond.</p></div>
        </div>
      </section>
    </main>
  );
}