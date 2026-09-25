import type { MetadataRoute } from 'next';
import { brand } from '@/lib/brand';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{
      userAgent: '*',
      allow: '/',
      // Dealer portal, admin and deep filter permutations stay out of the index.
      disallow: ['/portal/', '/admin/', '/api/', '/cars?*sort=', '/cars?*cursor='],
    }],
    sitemap: `${brand.siteUrl}/sitemap.xml`,
  };
}
