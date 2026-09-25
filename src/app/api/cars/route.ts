import { NextResponse } from 'next/server';
import { getSearchProvider, type VehicleQuery } from '@/lib/services/search';

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const number = (value: string | null) => value ? Number(value) : undefined;
  const query: VehicleQuery = {
    q: params.get('q') ?? undefined, make: params.get('make') ?? undefined, model: params.get('model') ?? undefined,
    grouping: params.get('grouping') as VehicleQuery['grouping'], usageType: params.get('usage_type') as VehicleQuery['usageType'],
    bodyType: params.get('bodyType') as VehicleQuery['bodyType'], fuelType: params.get('fuelType') as VehicleQuery['fuelType'], transmission: params.get('transmission') as VehicleQuery['transmission'],
    priceMin: number(params.get('priceMin')), priceMax: number(params.get('priceMax')), yearMin: number(params.get('yearMin')), yearMax: number(params.get('yearMax')), mileageMax: number(params.get('mileageMax')), seatsMin: number(params.get('seats')),
    dealershipId: params.get('dealershipId') ?? undefined, collection: params.get('collection') ?? undefined, locationPath: params.get('location') ?? undefined,
    financingAvailable: params.get('financing') === 'true', verifiedDealerOnly: params.get('verified') === 'true', sponsoredOnly: params.get('sponsored') === 'true',
    sort: (params.get('sort') as VehicleQuery['sort']) ?? 'newest', cursor: params.get('cursor') ?? undefined, limit: number(params.get('limit')),
  };
  try { return NextResponse.json(await getSearchProvider().searchVehicles(query)); }
  catch (error) { const e = error as Error; return NextResponse.json({ error: e.message }, { status: 503 }); }
}