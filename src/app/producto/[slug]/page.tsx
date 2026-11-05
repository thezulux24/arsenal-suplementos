import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getProducts, mediaUrl } from '@latinovation/cms-client';
import { SitePage } from '@/components/blocks/registry';
import { CMS_URL, getSite } from '@/lib/site';
import { findProduct, ldScript, productLd } from '@/lib/seo';
import { productHref } from '@/lib/shop';

export const revalidate = 60;

export async function generateStaticParams() {
  return getProducts(await getSite()).map((p) => ({ slug: p.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = findProduct(await getSite(), decodeURIComponent(slug));
  if (!p) return { title: 'Producto' };
  // OG con las fotos reales del producto (1400 × 1400)
  const images = [p.imageUrl, ...p.gallery].filter(Boolean).slice(0, 4).map((u) => ({ url: mediaUrl(String(u), CMS_URL), width: 1400, height: 1400, alt: p.title }));
  const description = p.summary || String(p.description || '').slice(0, 160);
  return {
    title: [p.title, p.brand].filter(Boolean).join(' · '),
    description,
    alternates: { canonical: productHref(p) },
    openGraph: { type: 'website', title: p.title, description, images, url: productHref(p) },
    twitter: { card: 'summary_large_image', images: images.map((i) => i.url) },
  };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const site = await getSite();
  const p = findProduct(site, decodeURIComponent(slug));
  if (!p) notFound();
  return (
    <>
      <SitePage pageSlug="/producto" productSlug={p.slug} />
      <script type="application/ld+json" dangerouslySetInnerHTML={ldScript(productLd(p, site))} />
    </>
  );
}
