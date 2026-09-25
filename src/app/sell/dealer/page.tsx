import Link from 'next/link';

export const metadata = { title: 'List your stock | Motoyard', description: 'Bring your verified vehicle stock to Motoyard.' };

export default function DealerPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-12 md:px-6">
      <p className="text-sm font-semibold uppercase tracking-widest text-yard-600">For dealers and car yards</p>
      <h1 className="mt-3 max-w-2xl font-display text-4xl font-bold text-ink">Put your stock in front of serious buyers.</h1>
      <p className="mt-4 max-w-2xl text-lg leading-7 text-ink-muted">Create a verified yard profile, publish your inventory and receive enquiries with useful attribution.</p>
      <div className="mt-8 flex flex-wrap gap-3"><Link href="/yard/signup" className="rounded-lg bg-yard-500 px-5 py-3 font-semibold text-white">Create your yard account</Link><Link href="/yard/login" className="rounded-lg border border-yard-500 px-5 py-3 font-semibold text-yard-600">Yard login</Link><Link href="/cars" className="rounded-lg border border-line px-5 py-3 font-semibold text-ink-muted">See the marketplace</Link></div>
    </main>
  );
}
