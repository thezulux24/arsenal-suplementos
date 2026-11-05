import type { MetadataRoute } from 'next';
import { getProducts, mediaUrl } from '@latinovation/cms-client';
import { CMS_URL, getSite } from '@/lib/site';
import { abs } from '@/lib/seo';
import { categoryList, productHref } from '@/lib/shop';

export const revalidate = 3600;

const PRIVATE = new Set(['/checkout', '/pedido', '/rastreo', '/favoritos', '/buscar', '/producto']);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = await getSite();
  const now = new Date();
  const pages = site.pages
    .filter((p) => !PRIVATE.has(p.slug))
    .map((p) => ({ url: abs(p.slug), lastModified: now, changeFrequency: 'weekly' as const, priority: p.slug === '/' ? 1 : 0.7 }));
  const cats = categoryList(site).map((c) => ({ url: abs(`/categoria/${c.slug}`), lastModified: now, changeFrequency: 'weekly' as const, priority: 0.7 }));
  const products = getProducts(site).map((p) => ({
    url: abs(productHref(p)),
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.6,
    images: p.imageUrl ? [mediaUrl(p.imageUrl, CMS_URL)] : undefined,
  }));
  return [...pages, ...cats, ...products];
}
