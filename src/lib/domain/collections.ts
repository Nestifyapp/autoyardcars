/**
 * Admin-configurable collection rule engine ("Ride-hailing friendly", "Family cars").
 * Rules are data, stored in marketplace_collections. No eligibility logic is
 * hard-coded, because ride-hailing regulations and buyer intents change.
 */
import type { CollectionRule, MarketplaceCollection, Vehicle } from './types';

function readPath(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => (acc == null ? acc : (acc as Record<string, unknown>)[key]), obj);
}

export function ruleMatches(rule: CollectionRule, vehicle: Partial<Vehicle>): boolean {
  const actual = readPath(vehicle, String(rule.field));
  const expected = rule.value;
  switch (rule.operator) {
    case 'eq': return actual === expected;
    case 'neq': return actual !== expected;
    case 'gte': return typeof actual === 'number' && typeof expected === 'number' && actual >= expected;
    case 'lte': return typeof actual === 'number' && typeof expected === 'number' && actual <= expected;
    case 'in': return Array.isArray(expected) && expected.includes(actual as never);
    case 'not_in': return Array.isArray(expected) && !expected.includes(actual as never);
    case 'exists': return expected ? actual != null && actual !== '' : actual == null || actual === '';
    default: return false;
  }
}

/** All rules AND together. A vehicle in manualVehicleIds always qualifies. */
export function vehicleInCollection(collection: MarketplaceCollection, vehicle: Vehicle): boolean {
  if (!collection.active) return false;
  if (collection.mode !== 'rule' && collection.manualVehicleIds?.includes(vehicle.id)) return true;
  if (collection.mode === 'manual') return false;
  if (!collection.rules?.length) return false;
  return collection.rules.every(rule => ruleMatches(rule, vehicle));
}

/**
 * Recomputed on every vehicle write (Cloud Function `onVehicleWritten`) and stored
 * on the vehicle as `collectionSlugs` so the marketplace can use one
 * array-contains query instead of evaluating rules at read time.
 */
export function resolveCollectionSlugs(collections: MarketplaceCollection[], vehicle: Vehicle): string[] {
  return collections.filter(c => vehicleInCollection(c, vehicle)).map(c => c.slug).sort();
}
