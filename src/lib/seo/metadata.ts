import type { Metadata } from 'next';
import { brand, formatKes } from '@/lib/brand';
import type { Dealership, LocationNode, Vehicle } from '@/lib/domain/types';

const abs = (path: string) => new URL(path, brand.siteUrl).toString();

/** "2018 Toyota Axio Hybrid for Sale in Kangundo Road, Nairobi | Motoyard" */
export function vehicleMetadata(vehicle: Vehicle): Metadata {
  const title = `${vehicle.title} for Sale in ${vehicle.location.locationName} | ${brand.name}`;
  const description = `${vehicle.title} at ${formatKes(vehicle.price)}${vehicle.mileageKm ? `, ${vehicle.mileageKm.toLocaleString()} km` : ''}, ${vehicle.transmission}, ${vehicle.fuelType}. Sold by ${vehicle.dealerSnapshot.name} in ${vehicle.location.locationName}. Contact the dealer directly on ${brand.name}.`;
  return {
    title, description,
    alternates: { canonical: abs(`/cars/${vehicle.slug}`) },
    // Sold listings stay reachable for buyers arriving from search but are de-indexed.
    robots: vehicle.status === 'sold' ? { index: false, follow: true } : undefined,
    openGraph: { title, description, url: abs(`/cars/${vehicle.slug}`), type: 'website',
      images: vehicle.coverImage ? [{ url: vehicle.coverImage.url }] : [] },
  };
}

/** Vehicle + Offer structured data. Only asserted facts — no invented inspection claims. */
export function vehicleJsonLd(vehicle: Vehicle) {
  return {
    '@context': 'https://schema.org', '@type': 'Vehicle',
    name: vehicle.title, vehicleIdentificationNumber: undefined,
    brand: { '@type': 'Brand', name: vehicle.make }, model: vehicle.model,
    vehicleModelDate: String(vehicle.yearOfManufacture),
    mileageFromOdometer: vehicle.mileageKm ? { '@type': 'QuantitativeValue', value: vehicle.mileageKm, unitCode: 'KMT' } : undefined,
    vehicleTransmission: vehicle.transmission, fuelType: vehicle.fuelType,
    bodyType: vehicle.bodyType, numberOfDoors: vehicle.doors, seatingCapacity: vehicle.seats,
    color: vehicle.exteriorColour, url: abs(`/cars/${vehicle.slug}`),
    image: vehicle.images.map(i => i.url),
    offers: {
      '@type': 'Offer', price: vehicle.price, priceCurrency: vehicle.currency,
      availability: vehicle.status === 'active' ? 'https://schema.org/InStock' : 'https://schema.org/SoldOut',
      itemCondition: vehicle.condition === 'brand_new' ? 'https://schema.org/NewCondition' : 'https://schema.org/UsedCondition',
      seller: { '@type': 'AutoDealer', name: vehicle.dealerSnapshot.name, url: abs(`/yards/${vehicle.dealerSnapshot.slug}`) },
    },
  };
}

export function dealershipMetadata(dealer: Dealership, vehicleCount: number): Metadata {
  const title = `${dealer.name} — Cars for Sale in ${dealer.location.addressLine ?? ''} | ${brand.name}`;
  const description = `${vehicleCount} vehicles in stock at ${dealer.name}. See prices, photos and contact the yard directly on WhatsApp.`;
  return { title, description, alternates: { canonical: abs(`/yards/${dealer.slug}`) },
    openGraph: { title, description, images: dealer.bannerUrl ? [{ url: dealer.bannerUrl }] : [] } };
}

export function locationMetadata(location: LocationNode): Metadata {
  const title = `Cars for Sale in ${location.name}${location.level === 'area' ? ', Nairobi' : ''} | ${brand.name}`;
  return { title, description: location.seo?.description ?? `Browse verified car yards and vehicles for sale in ${location.name}.`,
    alternates: { canonical: abs(`/locations/${location.slug}`) } };
}

/**
 * Indexing policy. Filter combinations explode combinatorially, so only a
 * curated set of high-intent parameters is indexable; everything else is
 * canonicalised back to /cars and marked noindex.
 */
const INDEXABLE_PARAMS = new Set(['make', 'bodyType', 'fuelType', 'location', 'collection']);

export function searchPageIndexing(params: Record<string, string | undefined>) {
  const used = Object.entries(params).filter(([, v]) => v);
  const indexable = used.length > 0 && used.length <= 2 && used.every(([k]) => INDEXABLE_PARAMS.has(k));
  const canonical = indexable
    ? abs(`/cars?${used.map(([k, v]) => `${k}=${v}`).sort().join('&')}`)
    : abs('/cars');
  return { indexable, canonical, robots: { index: indexable, follow: true } };
}
