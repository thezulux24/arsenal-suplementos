import type { Metadata } from 'next';
import { SitePage } from '@/components/blocks/registry';
import { getSite } from '@/lib/site';
import { pageMetadata } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  return { ...pageMetadata(await getSite(), '/buscar'), robots: { index: false, follow: true } };
}

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <SitePage pageSlug="/buscar" shop={{ params: await searchParams }} />;
}
