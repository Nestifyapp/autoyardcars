import type { BodyType, FuelType, Transmission, Vehicle } from '@/lib/domain/types';

export interface VehicleQuery {
  q?: string;
  make?: string; model?: string;
  priceMin?: number; priceMax?: number;
  yearMin?: number; yearMax?: number;
  mileageMax?: number;
  bodyType?: BodyType; fuelType?: FuelType; transmission?: Transmission;
  seatsMin?: number;
  locationPath?: string;          // prefix match: 'ke/nairobi'
  dealershipId?: string;
  collection?: string;            // collection slug
  financingAvailable?: boolean;
  verifiedDealerOnly?: boolean;
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'mileage_asc';
  cursor?: string;
  limit?: number;
}

export interface VehicleSearchResult {
  items: Vehicle[];
  nextCursor?: string;
  total?: number;
  facets?: Record<string, { value: string; count: number }[]>;
  provider: string;
}

/**
 * Swap Firestore for Algolia/Typesense/Meilisearch by implementing this and
 * changing SEARCH_PROVIDER. The marketplace never imports a provider directly.
 */
export interface SearchProvider {
  readonly name: string;
  searchVehicles(query: VehicleQuery): Promise<VehicleSearchResult>;
  indexVehicle?(vehicle: Vehicle): Promise<void>;
  removeVehicle?(vehicleId: string): Promise<void>;
}
