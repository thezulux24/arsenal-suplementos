import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SitePage } from '@/components/blocks/registry';
import { getSite } from '@/lib/site';
import { pageMetadata } from '@/lib/seo';
import { accountsEnabled, getStoreConfig } from '@/lib/store-config';

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  return { ...pageMetadata(await getSite(), '/cuenta/pedidos'), robots: { index: false, follow: false } };
}

export default async function Page() {
  // Sin cuentas activas en la tienda, la ruta no existe (404 del CMS).
  if (!accountsEnabled(await getStoreConfig())) notFound();
  return <SitePage pageSlug="/cuenta/pedidos" />;
}
