import type { Metadata } from 'next';
import { SitePage } from '@/components/blocks/registry';
import { getSite } from '@/lib/site';
import { pageMetadata } from '@/lib/seo';

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  return { ...pageMetadata(await getSite(), '/nosotros') };
}

export default function Page() {
  return <SitePage pageSlug="/nosotros" />;
}
