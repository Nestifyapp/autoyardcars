/**
 * Single source of truth for product naming. Rename the platform by changing
 * environment variables — no component, route or collection references "Motoyard".
 */
export const brand = {
  name: process.env.NEXT_PUBLIC_BRAND_NAME ?? 'Autoyardcars',
  tagline:
    process.env.NEXT_PUBLIC_BRAND_TAGLINE ??
    'Discover cars. Compare options. Find financing. Contact verified dealers.',
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  currency: process.env.NEXT_PUBLIC_DEFAULT_CURRENCY ?? 'KES',
  defaultCountry: process.env.NEXT_PUBLIC_DEFAULT_COUNTRY ?? 'KE',
  /** Used in WhatsApp templates and SEO titles. */
  shortName: (process.env.NEXT_PUBLIC_BRAND_NAME ?? 'Autoyardcars').split(' ')[0],
} as const;

export const formatKes = (value: number) =>
  new Intl.NumberFormat('en-KE', { style: 'currency', currency: brand.currency, maximumFractionDigits: 0 }).format(value);
