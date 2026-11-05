import type { Metadata } from 'next';
import { SitePage } from '@/components/blocks/registry';
import { getSite } from '@/lib/site';
import { pageMetadata } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata(await getSite(), '/tienda');
}

// Los filtros viven en la URL (?categoria=Vajillas&color=Azul…): el servidor pinta el mismo resultado que verá el cliente.
export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <SitePage pageSlug="/tienda" shop={{ params: await searchParams }} />;
}
