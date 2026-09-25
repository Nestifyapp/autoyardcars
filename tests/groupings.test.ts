import { describe, expect, it } from 'vitest';
import { computeCarGroupings } from '../src/lib/domain/groupings';

describe('computeCarGroupings', () => {
  it('preserves manual tags and derives marketplace tags', () => {
    const tags = computeCarGroupings({ make: 'BMW', price: 5_000_000, mileageKm: 30_000, usageType: 'foreign_used', isOriginalPaint: true, groupings: ['uber_ready'], createdAt: new Date(), metrics: { impressions: 0, detailViews: 30, whatsappClicks: 0, callClicks: 0, financingClicks: 0, leads: 0 } });
    expect(tags).toEqual(expect.arrayContaining(['uber_ready', 'luxury_executive', 'low_mileage', 'under_50k_miles', 'fresh_import', 'hot_today', 'original_paint']));
  });

  it('marks locally used vehicles without requiring new fields on old records', () => {
    expect(computeCarGroupings({ condition: 'locally_used' })).toContain('locally_used');
  });
});