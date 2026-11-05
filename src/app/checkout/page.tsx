import type { Metadata } from 'next';
import { SitePage } from '@/components/blocks/registry';
import { getSite } from '@/lib/site';
import { pageMetadata } from '@/lib/seo';
import { getStoreConfig } from '@/lib/store-config';

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  return { ...pageMetadata(await getSite(), '/checkout'), robots: { index: false } };
}

/** Métodos de pago públicos de la tienda (el pago en línea solo aparece si la pasarela tiene llave pública). */
export default async function Page() {
  return <SitePage pageSlug="/checkout" storeConfig={await getStoreConfig()} />;
}
