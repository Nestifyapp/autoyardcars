import type { Vehicle, VehicleGrouping } from './types';

const PREMIUM_MAKES = new Set(['audi', 'bmw', 'jaguar', 'lexus', 'mercedes-benz', 'porsche', 'range rover', 'land rover']);
const LUXURY_PRICE_THRESHOLD = 4_000_000;
const HOT_VIEW_THRESHOLD = 25;
const HOT_LEAD_THRESHOLD = 3;

function asDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof (value as { toDate?: unknown }).toDate === 'function') return (value as { toDate: () => Date }).toDate();
  const date = new Date(value as string);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Computes discoverability tags while preserving tags explicitly supplied by a yard. */
export function computeCarGroupings(car: Partial<Vehicle>): VehicleGrouping[] {
  const tags = new Set<VehicleGrouping>((car.groupings ?? []).filter(Boolean));
  const mileage = car.mileageKm ?? Number.POSITIVE_INFINITY;
  const usageType = car.usageType ?? car.condition;
  const make = car.make?.trim().toLowerCase() ?? '';
  const metrics = car.metrics ?? { detailViews: 0, leads: 0 };

  if (mileage <= 50_000) {
    tags.add('low_mileage');
    tags.add('under_50k_miles');
  }
  if (car.isLuxury === true || PREMIUM_MAKES.has(make) || (car.price ?? 0) >= LUXURY_PRICE_THRESHOLD) tags.add('luxury_executive');
  const createdAt = asDate(car.createdAt);
  if (usageType === 'foreign_used' && createdAt && Date.now() - createdAt.getTime() <= 14 * 86_400_000) tags.add('fresh_import');
  if ((metrics.detailViews ?? 0) >= HOT_VIEW_THRESHOLD || (metrics.leads ?? 0) >= HOT_LEAD_THRESHOLD) tags.add('hot_today');
  if (usageType === 'locally_used') tags.add('locally_used');
  if (car.isOriginalPaint === true) tags.add('original_paint');

  return [...tags];
}