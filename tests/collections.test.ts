import { describe, expect, it } from 'vitest';
import { resolveCollectionSlugs, vehicleInCollection } from '../src/lib/domain/collections';
import type { MarketplaceCollection, Vehicle } from '../src/lib/domain/types';

const collection = (over: Partial<MarketplaceCollection> = {}): MarketplaceCollection => ({
  id: 'ride', name: 'Ride-hailing friendly', slug: 'ride-hailing-friendly', mode: 'rule',
  rules: [
    { field: 'yearOfManufacture', operator: 'gte', value: 2015 },
    { field: 'bodyType', operator: 'in', value: ['sedan', 'hatchback'] },
    { field: 'price', operator: 'lte', value: 2_000_000 },
  ],
  manualVehicleIds: [], sortOrder: 1, showOnHomepage: true, active: true,
  createdAt: new Date(), updatedAt: new Date(), ...over,
});

const vehicle = (over: Partial<Vehicle> = {}) => ({
  id: 'v1', yearOfManufacture: 2018, bodyType: 'sedan', price: 1_450_000,
  location: { locationPath: 'ke/nairobi/nairobi/kangundo-road' }, ...over,
} as unknown as Vehicle);

describe('collection rule engine', () => {
  it('matches when every rule passes', () => {
    expect(vehicleInCollection(collection(), vehicle())).toBe(true);
  });
  it('fails the whole collection when one rule fails', () => {
    expect(vehicleInCollection(collection(), vehicle({ price: 3_000_000 }))).toBe(false);
    expect(vehicleInCollection(collection(), vehicle({ yearOfManufacture: 2012 }))).toBe(false);
  });
  it('reads nested fields by dot path, so location rules work', () => {
    const c = collection({ rules: [{ field: 'location.locationPath', operator: 'eq', value: 'ke/nairobi/nairobi/kangundo-road' }] });
    expect(vehicleInCollection(c, vehicle())).toBe(true);
  });
  it('lets admins change eligibility without a code change', () => {
    // Regulator raises the minimum year: edit the rule document, nothing else.
    const tightened = collection({ rules: [{ field: 'yearOfManufacture', operator: 'gte', value: 2019 }] });
    expect(vehicleInCollection(tightened, vehicle())).toBe(false);
  });
  it('honours manual curation in hybrid mode', () => {
    const c = collection({ mode: 'hybrid', manualVehicleIds: ['v1'], rules: [{ field: 'price', operator: 'lte', value: 10 }] });
    expect(vehicleInCollection(c, vehicle())).toBe(true);
  });
  it('ignores inactive collections', () => {
    expect(vehicleInCollection(collection({ active: false }), vehicle())).toBe(false);
  });
  it('resolves the slug list stored on the vehicle document', () => {
    const slugs = resolveCollectionSlugs(
      [collection(), collection({ id: 'u1m', slug: 'under-1m', rules: [{ field: 'price', operator: 'lte', value: 1_000_000 }] })],
      vehicle());
    expect(slugs).toEqual(['ride-hailing-friendly']);
  });
});
