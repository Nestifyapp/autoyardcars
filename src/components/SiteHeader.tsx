import Link from 'next/link';
import { brand } from '@/lib/brand';

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 md:px-6">
        <Link href="/" className="shrink-0 font-display text-xl font-bold tracking-tight text-yard-900">
          {brand.name}
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-ink-muted md:flex" aria-label="Primary navigation">
          <Link href="/cars" className="hover:text-yard-600">Browse cars</Link>
          <Link href="/financing" className="hover:text-yard-600">Financing</Link>
          <Link href="/sell/dealer" className="hover:text-yard-600">List your stock</Link>
          <Link href="/yard/login" className="hover:text-yard-600">Yard login</Link>
        </nav>
        <div className="flex items-center gap-2"><Link href="/yard/signup" className="hidden rounded-lg border border-yard-500 px-3 py-2 text-sm font-semibold text-yard-700 hover:bg-yard-50 sm:inline-flex">Add your yard</Link><Link href="/cars" className="rounded-lg bg-yard-500 px-3 py-2 text-sm font-semibold text-white hover:bg-yard-600">Find a car</Link></div>
      </div>
    </header>
  );
}
