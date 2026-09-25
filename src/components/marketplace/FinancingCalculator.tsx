'use client';
import { useMemo, useState } from 'react';
import { calculateQuote, FINANCING_DISCLAIMER } from '@/lib/domain/financing';
import { formatKes } from '@/lib/brand';
import { Landmark, ShieldCheck } from 'lucide-react';

type CalculatorProduct = {
  id: string;
  financierName: string;
  name: string;
  terms: {
    minDepositPercent: number;
    repaymentMonths: number[];
    annualRatePercent: number;
    rateType: 'flat' | 'reducing_balance';
    processingFeePercent?: number;
  };
};

export function FinancingCalculator({ price, products }: { price: number; products: CalculatorProduct[] }) {
  const [productId, setProductId] = useState(products[0]?.id);
  const product = products.find(p => p.id === productId) ?? products[0];
  const [depositPercent, setDepositPercent] = useState(product?.terms.minDepositPercent ?? 20);
  const [months, setMonths] = useState(product?.terms.repaymentMonths.at(-1) ?? 36);

  const quote = useMemo(() => calculateQuote({
    price,
    depositAmount: Math.round((price * depositPercent) / 100),
    repaymentMonths: months,
    annualRatePercent: product?.terms.annualRatePercent ?? 15,
    rateType: product?.terms.rateType ?? 'reducing_balance',
    processingFeePercent: product?.terms.processingFeePercent,
  }), [price, depositPercent, months, product]);

  if (!product) {
    return <p className="text-sm text-ink-muted">No financing partner currently covers this vehicle. Ask the dealer about other options.</p>;
  }

  return (
    <div className="space-y-4 rounded-card border border-amber-200 bg-white p-4 shadow-sm">
      <div className="rounded-lg bg-gradient-to-r from-slate-900 to-yard-900 p-3 text-white">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-amber-300"><Landmark className="h-4 w-4" aria-hidden /> Financing partner</p>
            <p className="mt-1 font-display text-lg font-bold">{product.financierName}</p>
            <p className="mt-1 flex items-center gap-1 text-xs text-white/70"><ShieldCheck className="h-3.5 w-3.5 text-emerald-300" aria-hidden /> Indicative estimate from this partner</p>
          </div>
          {products.length > 1 && (
            <label className="shrink-0 text-right text-[10px] font-semibold uppercase tracking-wide text-white/70">
              <span className="sr-only">Choose financing partner</span>
              <select value={productId} onChange={e => { const p = products.find(x => x.id === e.target.value)!; setProductId(p.id); setDepositPercent(p.terms.minDepositPercent); setMonths(p.terms.repaymentMonths.at(-1)!); }} className="mt-1 max-w-[150px] rounded-md border border-white/30 bg-white/10 px-2 py-1.5 text-xs font-normal normal-case tracking-normal text-white outline-none [&>option]:text-ink">
                {products.map(p => <option key={p.id} value={p.id}>{p.financierName}</option>)}
              </select>
            </label>
          )}
        </div>
      </div>
      <div className="flex items-baseline justify-between">
        <p className="font-display text-xl font-semibold text-yard-900">{formatKes(quote.monthlyPayment)}<span className="text-sm font-normal text-ink-muted">/month</span></p>
        <p className="text-sm text-ink-muted">{quote.repaymentMonths} months</p>
      </div>

      <label className="block text-sm">
        Deposit: {depositPercent}% — {formatKes(quote.depositAmount)}
        <input
          type="range" min={product.terms.minDepositPercent} max={80} step={5}
          value={depositPercent} onChange={e => setDepositPercent(Number(e.target.value))}
          className="mt-2 w-full accent-yard-500"
        />
      </label>

      <fieldset className="flex flex-wrap gap-2">
        <legend className="mb-2 text-sm">Repayment period</legend>
        {product.terms.repaymentMonths.map(m => (
          <button key={m} type="button" onClick={() => setMonths(m)}
            className={`rounded-full border px-3 py-1.5 text-sm ${m === months ? 'border-yard-500 bg-yard-50 text-yard-600' : 'border-line text-ink-muted'}`}>
            {m} mo
          </button>
        ))}
      </fieldset>

      <dl className="grid grid-cols-2 gap-y-1.5 text-sm">
        <dt className="text-ink-muted">Vehicle price</dt><dd className="text-right tabular-nums">{formatKes(quote.vehiclePrice)}</dd>
        <dt className="text-ink-muted">Amount financed</dt><dd className="text-right tabular-nums">{formatKes(quote.financedAmount)}</dd>
        <dt className="text-ink-muted">Total repayment</dt><dd className="text-right tabular-nums">{formatKes(quote.totalRepayment)}</dd>
        <dt className="text-ink-muted">Partner</dt><dd className="text-right font-semibold text-yard-900">{product.financierName}</dd>
      </dl>

      <p className="text-xs text-ink-muted">{FINANCING_DISCLAIMER}</p>
    </div>
  );
}
