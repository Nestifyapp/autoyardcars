/**
 * Financing engine. Pure functions — no Firestore, no network — so the same code
 * runs in the buyer's calculator, in server rendering and in tests.
 * Output is always an ESTIMATE. Nothing here approves anything.
 */
import type { FinancingProduct, Vehicle } from './types';

export interface QuoteInput {
  price: number;
  depositAmount: number;
  repaymentMonths: number;
  annualRatePercent: number;
  rateType: 'reducing_balance' | 'flat';
  processingFeePercent?: number;
}

export interface Quote {
  vehiclePrice: number;
  depositAmount: number;
  depositPercent: number;
  financedAmount: number;
  repaymentMonths: number;
  monthlyPayment: number;
  totalRepayment: number;
  totalInterest: number;
  processingFee: number;
  isEstimate: true;
}

export function calculateQuote(input: QuoteInput): Quote {
  const price = Math.max(0, input.price);
  const deposit = Math.min(Math.max(0, input.depositAmount), price);
  const principal = price - deposit;
  const months = Math.max(1, Math.round(input.repaymentMonths));
  const processingFee = Math.round((principal * (input.processingFeePercent ?? 0)) / 100);

  let monthlyPayment: number;
  if (input.rateType === 'flat') {
    const totalInterest = (principal * (input.annualRatePercent / 100) * months) / 12;
    monthlyPayment = (principal + totalInterest) / months;
  } else {
    const r = input.annualRatePercent / 100 / 12;
    monthlyPayment = r === 0 ? principal / months : (principal * r) / (1 - Math.pow(1 + r, -months));
  }

  const rounded = Math.round(monthlyPayment);
  const totalRepayment = rounded * months;
  return {
    vehiclePrice: price,
    depositAmount: deposit,
    depositPercent: price === 0 ? 0 : Math.round((deposit / price) * 1000) / 10,
    financedAmount: principal,
    repaymentMonths: months,
    monthlyPayment: rounded,
    totalRepayment,
    totalInterest: Math.max(0, totalRepayment - principal),
    processingFee,
    isEstimate: true,
  };
}

/** Does this financing product's configured eligibility match this vehicle? */
export function productMatchesVehicle(
  product: FinancingProduct,
  vehicle: Pick<Vehicle,
    'yearOfManufacture' | 'bodyType' | 'condition' | 'make' | 'price' | 'logbookAvailable' | 'location' | 'dealerSnapshot' | 'financingEligible'>,
  now = new Date(),
): boolean {
  if (!product.active || !vehicle.financingEligible) return false;
  const e = product.eligibility;

  if (e.minVehicleYear && vehicle.yearOfManufacture < e.minVehicleYear) return false;
  if (e.maxVehicleAgeYears != null && now.getFullYear() - vehicle.yearOfManufacture > e.maxVehicleAgeYears) return false;
  if (e.allowedBodyTypes?.length && !e.allowedBodyTypes.includes(vehicle.bodyType)) return false;
  if (e.allowedConditions?.length && !e.allowedConditions.includes(vehicle.condition)) return false;
  if (e.allowedMakes?.length && !e.allowedMakes.map(m => m.toLowerCase()).includes(vehicle.make.toLowerCase())) return false;
  if (e.minPrice != null && vehicle.price < e.minPrice) return false;
  if (e.maxPrice != null && vehicle.price > e.maxPrice) return false;
  if (e.requiresLogbook && !vehicle.logbookAvailable) return false;
  if (e.requiresVerifiedDealer && !vehicle.dealerSnapshot?.verified) return false;
  if (e.locationPathPrefixes?.length &&
      !e.locationPathPrefixes.some(p => vehicle.location.locationPath.startsWith(p))) return false;
  return true;
}

/** Cheapest indicative monthly payment across matching products — for listing cards. */
export function bestMonthlyEstimate(products: FinancingProduct[], price: number): { monthly: number; product: FinancingProduct } | null {
  const quotes = products.map(product => {
    const deposit = Math.round((price * product.terms.minDepositPercent) / 100);
    const months = Math.max(...product.terms.repaymentMonths);
    return {
      product,
      monthly: calculateQuote({
        price, depositAmount: deposit, repaymentMonths: months,
        annualRatePercent: product.terms.annualRatePercent, rateType: product.terms.rateType,
        processingFeePercent: product.terms.processingFeePercent,
      }).monthlyPayment,
    };
  });
  return quotes.sort((a, b) => a.monthly - b.monthly)[0] ?? null;
}

export const FINANCING_DISCLAIMER =
  'This is an estimate only. Deposit, rate and monthly repayment are indicative and final terms depend on the financier’s approval and your credit assessment.';
