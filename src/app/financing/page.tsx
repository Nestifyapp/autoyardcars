import Link from 'next/link';

export const metadata = { title: 'Vehicle financing | Motoyard', description: 'Compare vehicle financing estimates for cars in Kenya.' };

export default function FinancingPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-12 md:px-6">
      <p className="text-sm font-semibold uppercase tracking-widest text-yard-600">Finance your next car</p>
      <h1 className="mt-3 max-w-2xl font-display text-4xl font-bold text-ink">Understand the numbers before you commit.</h1>
      <p className="mt-4 max-w-2xl text-lg leading-7 text-ink-muted">Every eligible listing includes an estimate with deposit, repayment period and partner details. Estimates are not approvals.</p>
      <Link href="/cars?financing=true" className="mt-8 inline-block rounded-lg bg-yard-500 px-5 py-3 font-semibold text-white">Browse finance-eligible cars</Link>
    </main>
  );
}
