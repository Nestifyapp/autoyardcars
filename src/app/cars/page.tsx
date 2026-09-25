import { Suspense } from 'react';
import Link from 'next/link';
import { getSearchProvider, type VehicleQuery } from '@/lib/services/search';
import { VehicleCard, VehicleCardSkeleton } from '@/components/marketplace/VehicleCard';
import { searchPageIndexing } from '@/lib/seo/metadata';
import { brand } from '@/lib/brand';
import { VehicleSearch } from '@/components/marketplace/VehicleSearch';

export const revalidate = 120;

type Params = Record<string, string | undefined>;

function toQuery(params: Params): VehicleQuery {
  const num = (v?: string) => (v ? Number(v) : undefined);
  return {
    q: params.q, make: params.make, model: params.model,
    priceMin: num(params.priceMin), priceMax: num(params.priceMax),
    yearMin: num(params.yearMin), yearMax: num(params.yearMax),
    mileageMax: num(params.mileageMax), seatsMin: num(params.seats),
    bodyType: params.bodyType as VehicleQuery['bodyType'],
    fuelType: params.fuelType as VehicleQuery['fuelType'],
    transmission: params.transmission as VehicleQuery['transmission'],
    locationPath: params.location, collection: params.collection,
    financingAvailable: params.financing === 'true',
    verifiedDealerOnly: params.verified === 'true',
    sort: (params.sort as VehicleQuery['sort']) ?? 'newest',
    cursor: params.cursor,
  };
}

export async function generateMetadata({ searchParams }: { searchParams: Params }) {
  const { canonical, robots } = searchPageIndexing(searchParams);
  const bits = [searchParams.make, searchParams.bodyType, searchParams.collection].filter(Boolean).join(' ');
  return {
    title: bits ? `${bits} for sale in Kenya | ${brand.name}` : `Cars for sale in Kenya | ${brand.name}`,
    description: 'Search verified car yards across Kenya. Compare prices, check financing estimates and contact dealers directly.',
    alternates: { canonical }, robots,
  };
}

async function Results({ params }: { params: Params }) {
  const { items, nextCursor } = await getSearchProvider().searchVehicles(toQuery(params));

  if (items.length === 0) {
    return (
      <div className="rounded-card border border-line p-8 text-center">
        <p className="font-display text-lg">No vehicles match those filters yet.</p>
        <p className="mt-1 text-sm text-ink-muted">Try widening the price range, removing the year filter, or searching a nearby area.</p>
        <Link href="/cars" className="mt-4 inline-block rounded-lg bg-yard-500 px-4 py-2 text-white">Clear all filters</Link>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {items.map((v, i) => <VehicleCard key={v.id} vehicle={v} position={i} />)}
      </div>
      {nextCursor && (
        <Link
          href={{ pathname: '/cars', query: { ...params, cursor: nextCursor } }}
          rel="nofollow"
          className="mx-auto mt-6 block w-fit rounded-lg border border-yard-500 px-5 py-2.5 text-yard-600"
        >
          Show more vehicles
        </Link>
      )}
    </>
  );
}

export default function CarsPage({ searchParams }: { searchParams: Params }) {
  return (
    <main className="mx-auto max-w-7xl space-y-5 px-4 py-8 md:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-2xl font-semibold">
        {[searchParams.make, searchParams.bodyType].filter(Boolean).join(' ') || 'All vehicles'}
        </h1>
        <p className="text-sm text-ink-muted">Verified stock across Kenya</p>
      </div>
      <VehicleSearch />
      <Suspense fallback={<div className="grid grid-cols-2 gap-3 md:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <VehicleCardSkeleton key={i} />)}</div>}>
        <Results params={searchParams} />
      </Suspense>
    </main>
  );
}
