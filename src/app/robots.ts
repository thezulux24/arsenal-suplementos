import type { MetadataRoute } from 'next';
import { getSite, SITE_URL } from '@/lib/site';

export default async function robots(): Promise<MetadataRoute.Robots> {
  const site = await getSite();
  if (site.seo?.robotsIndex === false) return { rules: { userAgent: '*', disallow: '/' } };
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/checkout', '/pedido', '/cuenta', '/api/'] },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
