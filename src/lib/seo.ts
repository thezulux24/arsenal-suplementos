import type { Metadata } from 'next';
import { getPage, getProducts, mediaUrl, type DeliveryPayload, type Product } from '@latinovation/cms-client';
import { CMS_URL, SITE_URL } from './site';
import { categoryHref, productHref } from './shop';

/** Metadatos de una página del CMS (seoTitle/seoImage de la página; SEO global como respaldo). */
export function pageMetadata(payload: DeliveryPayload, pageSlug: string, path = pageSlug): Metadata {
  const page = getPage(payload, pageSlug);
  const seo = payload.seo || {};
  const title = page?.seoTitle || page?.title;
  const image = page?.seoImage || seo.ogImage;
  return {
    title: pageSlug === '/' ? { absolute: seo.metaTitle || payload.global?.brandName || 'TusPlatos' } : title,
    description: seo.metaDescription,
    alternates: { canonical: path },
    openGraph: { images: image ? [{ url: mediaUrl(image, CMS_URL) }] : undefined, url: path },
  };
}

export function abs(path: string) {
  return /^https?:/.test(path) ? path : `${SITE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
}

export function organizationLd(payload: DeliveryPayload) {
  const g = payload.global || {};
  const social = Array.isArray(g.social) ? g.social.map((s: any) => s?.url).filter(Boolean) : [];
  return {
    '@context': 'https://schema.org',
    '@type': 'Store',
    name: g.brandName || payload.project.name,
    url: SITE_URL,
    logo: g.logoUrl ? mediaUrl(g.logoUrl, CMS_URL) : undefined,
    image: payload.seo?.ogImage ? mediaUrl(payload.seo.ogImage, CMS_URL) : undefined,
    description: payload.seo?.metaDescription,
    address: g.city ? { '@type': 'PostalAddress', addressLocality: g.city, addressCountry: 'CO', streetAddress: g.address || undefined } : undefined,
    telephone: g.phone || undefined,
    email: g.email || undefined,
    sameAs: social.length ? social : undefined,
  };
}

export function productLd(p: Product, payload: DeliveryPayload) {
  const images = [p.imageUrl, ...p.gallery].filter(Boolean).map((u) => mediaUrl(String(u), CMS_URL));
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: p.title,
      sku: p.sku || undefined,
      brand: p.brand ? { '@type': 'Brand', name: p.brand } : undefined,
      category: p.category,
      color: p.color,
      material: p.material,
      image: images,
      description: p.summary || String(p.description || '').slice(0, 300),
      offers: {
        '@type': 'Offer',
        url: abs(productHref(p)),
        priceCurrency: payload.ecommerce?.currency || 'COP',
        price: p.price,
        availability: p.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        itemCondition: 'https://schema.org/NewCondition',
        seller: { '@type': 'Organization', name: payload.global?.brandName || payload.project.name },
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Inicio', item: abs('/') },
        { '@type': 'ListItem', position: 2, name: 'Tienda', item: abs('/tienda') },
        ...(p.category ? [{ '@type': 'ListItem', position: 3, name: p.category, item: abs(categoryHref(p.category)) }] : []),
        { '@type': 'ListItem', position: p.category ? 4 : 3, name: p.title, item: abs(productHref(p)) },
      ],
    },
  ];
}

export function findProduct(payload: DeliveryPayload, slug: string) {
  return getProducts(payload).find((p) => p.slug === slug);
}

/** JSON-LD seguro dentro de <script>. */
export function ldScript(data: unknown) {
  return { __html: JSON.stringify(data).replace(/</g, '\\u003c') };
}
