import type { MetadataRoute } from 'next';
import { adminDb, col } from '@/lib/firebase/admin';
import { brand } from '@/lib/brand';

export const revalidate = 3600;

/**
 * Vehicles, dealer storefronts, locations and collections each get indexable
 * URLs. Thin filter permutations are deliberately excluded.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const url = (p: string) => `${brand.siteUrl}${p}`;
  let vehicles: FirebaseFirestore.QuerySnapshot;
  let dealers: FirebaseFirestore.QuerySnapshot;
  let locations: FirebaseFirestore.QuerySnapshot;
  let collections: FirebaseFirestore.QuerySnapshot;
  try {
    [vehicles, dealers, locations, collections] = await Promise.all([
      adminDb.collection(col.vehicles).where('status', '==', 'active').orderBy('publishedAt', 'desc').limit(20_000).get(),
      adminDb.collection(col.dealerships).where('status', '==', 'verified').get(),
      adminDb.collection(col.locations).where('active', '==', true).get(),
      adminDb.collection(col.collections).where('active', '==', true).get(),
    ]);
  } catch (error) {
    console.error('[sitemap] Firestore unavailable:', error);
    return [
      { url: url('/'), priority: 1, changeFrequency: 'daily' },
      { url: url('/cars'), priority: 0.9, changeFrequency: 'hourly' },
      { url: url('/yards'), priority: 0.8, changeFrequency: 'daily' },
      { url: url('/financing'), priority: 0.7, changeFrequency: 'weekly' },
    ];
  }

  return [
    { url: url('/'), priority: 1, changeFrequency: 'daily' },
    { url: url('/cars'), priority: 0.9, changeFrequency: 'hourly' },
    { url: url('/yards'), priority: 0.8, changeFrequency: 'daily' },
    { url: url('/financing'), priority: 0.7, changeFrequency: 'weekly' },
    ...vehicles.docs.map(d => ({ url: url(`/cars/${d.get('slug')}`), lastModified: d.get('updatedAt')?.toDate?.(), priority: 0.8, changeFrequency: 'daily' as const })),
    ...dealers.docs.map(d => ({ url: url(`/yards/${d.get('slug')}`), priority: 0.7, changeFrequency: 'daily' as const })),
    ...locations.docs.map(d => ({ url: url(`/locations/${d.get('slug')}`), priority: 0.7, changeFrequency: 'daily' as const })),
    ...collections.docs.map(d => ({ url: url(`/cars?collection=${d.get('slug')}`), priority: 0.6, changeFrequency: 'daily' as const })),
  ];
}
