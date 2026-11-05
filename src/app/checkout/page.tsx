import type { Metadata } from 'next';
import { SitePage } from '@/components/blocks/registry';
import type { StoreConfig } from '@/components/blocks/pages';
import { CMS_SLUG, CMS_URL, getSite } from '@/lib/site';
import { pageMetadata } from '@/lib/seo';

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  return { ...pageMetadata(await getSite(), '/checkout'), robots: { index: false } };
}

/** Métodos de pago públicos de la tienda (el pago en línea solo aparece si la pasarela tiene llave pública). */
async function getStoreConfig(): Promise<StoreConfig | null> {
  try {
    const res = await fetch(`${CMS_URL}/api/ecommerce/public/${CMS_SLUG}/config`, { next: { revalidate: 60, tags: [`cms:${CMS_SLUG}`] } });
    return res.ok ? ((await res.json()) as StoreConfig) : null;
  } catch {
    return null;
  }
}

export default async function Page() {
  return <SitePage pageSlug="/checkout" storeConfig={await getStoreConfig()} />;
}
