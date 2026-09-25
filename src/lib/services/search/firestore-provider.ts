import 'server-only';
import { adminDb, col } from '@/lib/firebase/admin';
import type { SearchProvider, VehicleQuery, VehicleSearchResult } from './types';
import type { Vehicle } from '@/lib/domain/types';

const SORTS: Record<NonNullable<VehicleQuery['sort']>, [string, FirebaseFirestore.OrderByDirection]> = {
  newest: ['publishedAt', 'desc'],
  price_asc: ['price', 'asc'],
  price_desc: ['price', 'desc'],
  mileage_asc: ['mileageKm', 'asc'],
};

/**
 * MVP provider. Native Firestore only — launching does not require an external
 * search service. Every combination below is backed by firestore.indexes.json.
 */
export const firestoreSearchProvider: SearchProvider = {
  name: 'firestore',

  async searchVehicles(query: VehicleQuery): Promise<VehicleSearchResult> {
    const limit = Math.min(query.limit ?? 24, 60);
    let ref: FirebaseFirestore.Query = adminDb.collection(col.vehicles).where('status', '==', 'active');

    if (query.dealershipId) ref = ref.where('dealershipId', '==', query.dealershipId);
    if (query.make) ref = ref.where('make', '==', query.make);
    if (query.model) ref = ref.where('model', '==', query.model);
    if (query.bodyType) ref = ref.where('bodyType', '==', query.bodyType);
    if (query.fuelType) ref = ref.where('fuelType', '==', query.fuelType);
    if (query.transmission) ref = ref.where('transmission', '==', query.transmission);
    if (query.collection) ref = ref.where('collectionSlugs', 'array-contains', query.collection);
    if (query.financingAvailable) ref = ref.where('financingEligible', '==', true);
    if (query.verifiedDealerOnly) ref = ref.where('dealerSnapshot.verified', '==', true);
    if (query.locationPath) {
      ref = ref.where('location.locationPath', '>=', query.locationPath)
               .where('location.locationPath', '<=', `${query.locationPath}\uf8ff`)
               .orderBy('location.locationPath');
    }
    if (query.q) {
      ref = ref.where('searchTokens', 'array-contains', query.q.trim().toLowerCase().split(/\s+/)[0]);
    }
    if (query.priceMin != null) ref = ref.where('price', '>=', query.priceMin);
    if (query.priceMax != null) ref = ref.where('price', '<=', query.priceMax);

    const [sortField, dir] = SORTS[query.sort ?? 'newest'];
    if ((query.priceMin != null || query.priceMax != null) && sortField !== 'price') {
      ref = ref.orderBy('price', 'asc');
    }
    ref = ref.orderBy(sortField, dir);

    if (query.cursor) ref = ref.startAfter(...JSON.parse(Buffer.from(query.cursor, 'base64').toString()));

    const snap = await ref.limit(limit).get();
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }) as Vehicle);

    // Year/mileage/seat ranges are applied in memory: Firestore allows range
    // filters on one field per query. Move to Algolia/Typesense as volume grows.
    const filtered = items.filter(v =>
      (query.yearMin == null || v.yearOfManufacture >= query.yearMin) &&
      (query.yearMax == null || v.yearOfManufacture <= query.yearMax) &&
      (query.mileageMax == null || (v.mileageKm ?? 0) <= query.mileageMax) &&
      (query.seatsMin == null || (v.seats ?? 0) >= query.seatsMin));

    const last = snap.docs.at(-1);
    return {
      items: filtered,
      provider: 'firestore',
      nextCursor: snap.size === limit && last
        ? Buffer.from(JSON.stringify([last.get(sortField)])).toString('base64')
        : undefined,
    };
  },
};
