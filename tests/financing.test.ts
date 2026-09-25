import { describe, expect, it } from 'vitest';
import { calculateQuote, productMatchesVehicle, bestMonthlyEstimate } from '../src/lib/domain/financing';
import type { FinancingProduct, Vehicle } from '../src/lib/domain/types';

const product = (over: Partial<FinancingProduct> = {}): FinancingProduct => ({
  id: 'p1', financierId: 'f1', financierName: 'Stawi', name: 'Used vehicle finance',
  eligibility: { minVehicleYear: 2014, maxVehicleAgeYears: 10, requiresLogbook: true },
  terms: { minDepositPercent: 20, repaymentMonths: [12, 24, 36, 48], annualRatePercent: 15.5, rateType: 'reducing_balance', processingFeePercent: 2.5 },
  active: true, sortOrder: 0, createdAt: new Date(), updatedAt: new Date(), ...over,
});

const vehicle = (over: Partial<Vehicle> = {}) => ({
  yearOfManufacture: 2018, bodyType: 'sedan', condition: 'foreign_used', make: 'Toyota',
  price: 1_450_000, logbookAvailable: true, financingEligible: true,
  location: { locationPath: 'ke/nairobi/nairobi/kangundo-road' },
  dealerSnapshot: { verified: true }, ...over,
} as unknown as Vehicle);

describe('calculateQuote', () => {
  it('amortises a reducing-balance loan correctly', () => {
    const q = calculateQuote({ price: 1_000_000, depositAmount: 200_000, repaymentMonths: 36, annualRatePercent: 15.5, rateType: 'reducing_balance' });
    expect(q.financedAmount).toBe(800_000);
    expect(q.depositPercent).toBe(20);
    // 800k over 36 months at 15.5% reducing ≈ 27,940/month
    expect(q.monthlyPayment).toBeGreaterThan(27_500);
    expect(q.monthlyPayment).toBeLessThan(28_400);
    expect(q.totalRepayment).toBe(q.monthlyPayment * 36);
    expect(q.totalInterest).toBeGreaterThan(0);
  });

  it('handles a flat rate and a zero rate', () => {
    const flat = calculateQuote({ price: 1_000_000, depositAmount: 0, repaymentMonths: 12, annualRatePercent: 12, rateType: 'flat' });
    expect(flat.monthlyPayment).toBe(Math.round((1_000_000 + 120_000) / 12));
    const zero = calculateQuote({ price: 600_000, depositAmount: 100_000, repaymentMonths: 10, annualRatePercent: 0, rateType: 'reducing_balance' });
    expect(zero.monthlyPayment).toBe(50_000);
  });

  it('never finances more than the price and always flags itself as an estimate', () => {
    const q = calculateQuote({ price: 500_000, depositAmount: 900_000, repaymentMonths: 24, annualRatePercent: 14, rateType: 'reducing_balance' });
    expect(q.depositAmount).toBe(500_000);
    expect(q.financedAmount).toBe(0);
    expect(q.isEstimate).toBe(true);
  });
});

describe('productMatchesVehicle', () => {
  const now = new Date('2026-01-01');
  it('matches an eligible vehicle', () => {
    expect(productMatchesVehicle(product(), vehicle(), now)).toBe(true);
  });
  it('rejects vehicles older than the configured maximum age', () => {
    expect(productMatchesVehicle(product(), vehicle({ yearOfManufacture: 2010 }), now)).toBe(false);
  });
  it('rejects when the logbook requirement is not met', () => {
    expect(productMatchesVehicle(product(), vehicle({ logbookAvailable: false }), now)).toBe(false);
  });
  it('respects a verified-dealer-only product', () => {
    const p = product({ eligibility: { requiresVerifiedDealer: true } });
    expect(productMatchesVehicle(p, vehicle({ dealerSnapshot: { verified: false } as never }), now)).toBe(false);
  });
  it('respects location prefixes so a financier can be county-limited', () => {
    const p = product({ eligibility: { locationPathPrefixes: ['ke/mombasa'] } });
    expect(productMatchesVehicle(p, vehicle(), now)).toBe(false);
  });
  it('never matches a vehicle the dealer excluded from financing', () => {
    expect(productMatchesVehicle(product(), vehicle({ financingEligible: false }), now)).toBe(false);
  });
});

describe('bestMonthlyEstimate', () => {
  it('returns the lowest indicative payment across products', () => {
    const cheap = product({ id: 'cheap', terms: { minDepositPercent: 30, repaymentMonths: [60], annualRatePercent: 13, rateType: 'reducing_balance' } });
    const best = bestMonthlyEstimate([product(), cheap], 1_450_000);
    expect(best?.product.id).toBe('cheap');
  });
});
