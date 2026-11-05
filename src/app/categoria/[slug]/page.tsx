import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SitePage } from '@/components/blocks/registry';
import { getSite } from '@/lib/site';
import { pageMetadata } from '@/lib/seo';
import { categoryList } from '@/lib/shop';

export const revalidate = 60;

export async function generateStaticParams() {
  return categoryList(await getSite()).map((c) => ({ slug: c.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const site = await getSite();
  const cat = categoryList(site).find((c) => c.slug === slug);
  return { ...pageMetadata(site, '/tienda', `/categoria/${slug}`), title: cat?.name || 'Categoría' };
}

/** Landing de categoría: la tienda con la categoría fija (los demás filtros siguen disponibles). */
export default async function Page({ params }: Props) {
  const { slug } = await params;
  const cat = categoryList(await getSite()).find((c) => c.slug === slug);
  if (!cat) notFound();
  return <SitePage pageSlug="/tienda" shop={{ params: {}, preset: { category: [cat.name] }, title: cat.name }} />;
}
