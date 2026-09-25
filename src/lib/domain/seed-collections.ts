import type { CollectionRule } from './types';

export interface SeedCollection {
  name: string;
  slug: string;
  showOnHomepage: boolean;
  sortOrder: number;
  description: string;
  rules: CollectionRule[];
}

export const SEED_COLLECTIONS: SeedCollection[] = [
  { name: 'Ride-hailing friendly', slug: 'ride-hailing-friendly', showOnHomepage: true, sortOrder: 1, description: 'Cars that meet the vehicle age, size and economy requirements most ride-hailing platforms ask for today.', rules: [{ field: 'yearOfManufacture', operator: 'gte', value: 2015 }, { field: 'bodyType', operator: 'in', value: ['sedan', 'saloon', 'hatchback', 'station_wagon'] }, { field: 'seats', operator: 'gte', value: 5 }, { field: 'price', operator: 'lte', value: 2_000_000 }] },
  { name: 'Family cars', slug: 'family-cars', showOnHomepage: true, sortOrder: 2, description: 'Space for car seats, school runs and weekend trips.', rules: [{ field: 'seats', operator: 'gte', value: 5 }, { field: 'bodyType', operator: 'in', value: ['suv', 'crossover', 'station_wagon', 'minivan', 'van'] }] },
  { name: '7-seaters', slug: '7-seaters', showOnHomepage: false, sortOrder: 3, description: 'Seven seats or more.', rules: [{ field: 'seats', operator: 'gte', value: 7 }] },
  { name: 'First car', slug: 'first-car', showOnHomepage: true, sortOrder: 4, description: 'Easy to park, cheap to run, simple to resell.', rules: [{ field: 'price', operator: 'lte', value: 1_300_000 }, { field: 'bodyType', operator: 'in', value: ['hatchback', 'sedan'] }] },
  { name: 'Under KES 1M', slug: 'under-1m', showOnHomepage: true, sortOrder: 5, description: 'Everything on the marketplace below one million shillings.', rules: [{ field: 'price', operator: 'lte', value: 1_000_000 }] },
  { name: 'Fuel savers', slug: 'fuel-savers', showOnHomepage: true, sortOrder: 6, description: 'Small engines and hybrids that survive Nairobi traffic.', rules: [{ field: 'engineCapacityCc', operator: 'lte', value: 1500 }] },
  { name: 'Hybrid cars', slug: 'hybrid-cars', showOnHomepage: true, sortOrder: 7, description: 'Petrol-electric and plug-in hybrids.', rules: [{ field: 'fuelType', operator: 'in', value: ['hybrid', 'plugin_hybrid'] }] },
  { name: 'Executive cars', slug: 'executive-cars', showOnHomepage: false, sortOrder: 8, description: 'Saloons and SUVs for business use.', rules: [{ field: 'price', operator: 'gte', value: 3_000_000 }] },
  { name: 'Pickups', slug: 'pickups', showOnHomepage: true, sortOrder: 9, description: 'Double cabs and workhorses.', rules: [{ field: 'bodyType', operator: 'eq', value: 'pickup' }] },
  { name: 'Commercial vehicles', slug: 'commercial-vehicles', showOnHomepage: false, sortOrder: 10, description: 'Trucks, vans and buses.', rules: [{ field: 'bodyType', operator: 'in', value: ['truck', 'van', 'bus'] }] },
  { name: 'Financing available', slug: 'financing-available', showOnHomepage: true, sortOrder: 11, description: 'Vehicles at least one partner will finance.', rules: [{ field: 'financingEligible', operator: 'eq', value: true }] },
];
