import Link from 'next/link';
import { brand } from '@/lib/brand';

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-line bg-ink px-4 py-10 text-white md:px-6">
      <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <Link href="/" className="font-display text-xl font-bold">{brand.name}</Link>
          <p className="mt-2 max-w-sm text-sm leading-6 text-white/70">{brand.tagline}</p>
        </div>
        <div>
          <h2 className="text-sm font-semibold">Shop</h2>
          <div className="mt-3 grid gap-2 text-sm text-white/70">
            <Link href="/cars" className="hover:text-white">All cars</Link>
            <Link href="/cars?collection=financing-available" className="hover:text-white">Financing available</Link>
            <Link href="/cars?bodyType=suv" className="hover:text-white">SUVs</Link>
          </div>
        </div>
        <div>
          <h2 className="text-sm font-semibold">Dealers</h2>
          <div className="mt-3 grid gap-2 text-sm text-white/70">
            <Link href="/sell/dealer" className="hover:text-white">List your stock</Link>
            <Link href="/financing" className="hover:text-white">Vehicle financing</Link>
          </div>
        </div>
      </div>
      <div className="mx-auto mt-10 max-w-7xl border-t border-white/15 pt-4 text-xs text-white/50">© {new Date().getFullYear()} {brand.name}. Built for Kenya.</div>
    </footer>
  );
}
