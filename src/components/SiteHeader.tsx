import Link from 'next/link';
import { Menu, UserRound } from 'lucide-react';
import { brand } from '@/lib/brand';

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 md:px-6">
        <Link href="/" className="shrink-0 font-display text-xl font-bold text-ink">
          {brand.name}
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-ink-muted md:flex" aria-label="Primary navigation">
          <Link href="/cars" className="hover:text-yard-600">Buy a car</Link>
          <Link href="/sell/dealer" className="hover:text-yard-600">Sell a car</Link>
          <Link href="/financing" className="hover:text-yard-600">Financing</Link>
          <Link href="/#why-autoyardcars" className="hover:text-yard-600">About</Link>
        </nav>
        <div className="flex items-center gap-1.5">
          <Link href="/yard/login" aria-label="Dealer account sign in" className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-ink-muted hover:bg-surface hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-yard-500">
            <UserRound className="h-5 w-5" aria-hidden />
          </Link>
          <Link href="/yard/signup" className="hidden min-h-10 items-center justify-center rounded-lg bg-yard-500 px-4 text-sm font-semibold text-white hover:bg-yard-600 md:inline-flex">Get started</Link>
          <details className="group relative md:hidden">
            <summary aria-label="Toggle navigation menu" className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-lg text-ink-muted hover:bg-surface hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-yard-500 [&::-webkit-details-marker]:hidden">
              <Menu className="h-5 w-5" aria-hidden />
            </summary>
            <nav aria-label="Mobile navigation" className="absolute right-0 top-12 z-50 grid w-56 gap-1 rounded-xl border border-line bg-white p-2 shadow-lg">
              <Link href="/cars" className="rounded-lg px-3 py-3 text-sm font-medium text-ink hover:bg-surface">Buy a car</Link>
              <Link href="/sell/dealer" className="rounded-lg px-3 py-3 text-sm font-medium text-ink hover:bg-surface">Sell a car</Link>
              <Link href="/financing" className="rounded-lg px-3 py-3 text-sm font-medium text-ink hover:bg-surface">Financing</Link>
              <Link href="/#why-autoyardcars" className="rounded-lg px-3 py-3 text-sm font-medium text-ink hover:bg-surface">About</Link>
              <Link href="/yard/signup" className="rounded-lg bg-yard-500 px-3 py-3 text-sm font-semibold text-white">Get started</Link>
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
