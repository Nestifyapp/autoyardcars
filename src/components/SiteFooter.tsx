import Link from 'next/link';
import { brand } from '@/lib/brand';

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-[#f8fafb] px-4 py-9 text-ink md:px-6">
      <div className="mx-auto grid max-w-7xl gap-8 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div>
          <Link href="/" className="font-display text-xl font-bold">{brand.name}</Link>
          <p className="mt-2 max-w-sm text-sm leading-6 text-ink-muted">{brand.tagline}</p>
        </div>
        <div>
          <h2 className="text-sm font-semibold">Buy</h2>
          <div className="mt-3 grid gap-2 text-sm text-ink-muted">
            <Link href="/cars" className="hover:text-yard-600">Browse cars</Link>
            <Link href="/cars?bodyType=suv" className="hover:text-yard-600">Browse SUVs</Link>
            <Link href="/cars?collection=financing-available" className="hover:text-yard-600">Financing available</Link>
          </div>
        </div>
        <div>
          <h2 className="text-sm font-semibold">Sell</h2>
          <div className="mt-3 grid gap-2 text-sm text-ink-muted">
            <Link href="/sell/dealer" className="hover:text-yard-600">List your stock</Link>
            <Link href="/yard/signup" className="hover:text-yard-600">Register your yard</Link>
            <Link href="/yard/login" className="hover:text-yard-600">Dealer sign in</Link>
          </div>
        </div>
        <div>
          <h2 className="text-sm font-semibold">Explore</h2>
          <div className="mt-3 grid gap-2 text-sm text-ink-muted">
            <Link href="/financing" className="hover:text-yard-600">Vehicle financing</Link>
            <Link href="/#why-autoyardcars" className="hover:text-yard-600">About {brand.name}</Link>
          </div>
        </div>
      </div>
      <div className="mx-auto mt-8 max-w-7xl border-t border-line pt-4 text-xs text-ink-muted">© {new Date().getFullYear()} {brand.name}. Built for Kenya.</div>
    </footer>
  );
}
