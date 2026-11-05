import type { Metadata } from 'next';
import { ProductView } from '@/components/ProductView';
import { fetchDelivery, getProducts } from '@/lib/cms';

export const revalidate = 30;

export async function generateStaticParams() {
  const p = await fetchDelivery();
  return getProducts(p).map((x) => ({ slug: x.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = getProducts(await fetchDelivery()).find((x) => x.slug === slug);
  if (!p) return { title: 'Producto' };
  return {
    title: `${p.title} ${p.brand || ''}`.trim(),
    description: p.summary || p.description,
    openGraph: { images: p.imageUrl ? [{ url: p.imageUrl }] : undefined },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ProductView slug={slug} />;
}
