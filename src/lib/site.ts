import { tryFetchDelivery, type DeliveryPayload } from '@latinovation/cms-client';

export const CMS_URL = (process.env.NEXT_PUBLIC_CMS_URL || 'https://webproai.tech').replace(/\/$/, '');
export const CMS_SLUG = process.env.NEXT_PUBLIC_CMS_SLUG || 'tusplatos';
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://tusplatos.webproai.tech').replace(/\/$/, '');
/** Orígenes extra del portal (desarrollo local del CMS). */
export const PORTAL_ORIGINS = (process.env.NEXT_PUBLIC_PORTAL_ORIGINS || 'http://localhost:3005').split(',').map((s) => s.trim()).filter(Boolean);

export const EMPTY_SITE: DeliveryPayload = {
  project: { id: '', name: 'TusPlatos', slug: CMS_SLUG },
  global: {},
  seo: {},
  navigation: {},
  ecommerce: { enabled: true, currency: 'COP', freeShippingThreshold: 0, flatShippingRate: 0 },
  pages: [],
  collections: {},
  collectionDefinitions: {},
};

/** Contenido publicado (ISR 60 s, etiqueta `cms:<slug>` para el webhook de revalidación). */
export async function getSite(): Promise<DeliveryPayload> {
  return (await tryFetchDelivery({ slug: CMS_SLUG, baseUrl: CMS_URL, revalidate: 60 })) || EMPTY_SITE;
}
