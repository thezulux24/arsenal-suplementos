export const CMS_URL = (process.env.NEXT_PUBLIC_CMS_URL || 'https://webproai.tech').replace(/\/$/, '');
export const CMS_SLUG = process.env.NEXT_PUBLIC_CMS_SLUG || 'arsenal';
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://shop.bzuluaga.site').replace(/\/$/, '');

export type Widget = {
  id: string;
  type?: string;
  badge?: string;
  title?: string;
  body?: string;
  imageUrl?: string;
  ctaText?: string;
  ctaHref?: string;
  metric?: string;
  metricLabel?: string;
};

export type SectionData = Record<string, any> & { widgets?: Widget[] };

export type SectionRow = {
  id: string;
  key: string;
  name?: string;
  isVisible?: boolean;
  order?: number;
  data?: SectionData;
  draftData?: SectionData;
};

export type CmsPage = {
  id: string;
  title: string;
  slug: string;
  sections: Record<string, SectionData>;
  sectionsList: SectionRow[];
};

export type Product = {
  id: string;
  slug: string;
  title: string;
  isFeatured?: boolean;
  status?: string;
  brand?: string;
  category?: string;
  price: number;
  compareAtPrice?: number;
  presentation?: string;
  units?: number;
  unitLabel?: string;
  netGrams?: number;
  servings?: number;
  invima?: string;
  summary?: string;
  description?: string;
  howToUse?: string;
  highlights?: string;
  imageUrl?: string;
  gallery?: string;
  stock?: number;
};

export type DeliveryPayload = {
  project: { id: string; name: string; slug: string; productionUrl?: string };
  global: Record<string, any>;
  seo: Record<string, any>;
  navigation: {
    headerLinks?: { id: string; label: string; href: string; isVisible?: boolean }[];
    headerCtaText?: string;
  };
  ecommerce: { enabled: boolean; currency: string; freeShippingThreshold: number; flatShippingRate: number };
  pages: CmsPage[];
  collections: Record<string, any[]>;
  collectionDefinitions: Record<string, { categories?: string[] }>;
  meta?: { mode: string };
};

export async function fetchDelivery(preview = false): Promise<DeliveryPayload | null> {
  try {
    const res = await fetch(`${CMS_URL}/api/v1/delivery/${CMS_SLUG}${preview ? '?preview=1' : ''}`, {
      ...(preview ? { cache: 'no-store' as const } : { next: { revalidate: 30 } }),
    });
    if (!res.ok) return null;
    return (await res.json()) as DeliveryPayload;
  } catch {
    return null;
  }
}

const num = (v: unknown): number | undefined => {
  if (v === null || v === undefined || v === '') return undefined;
  const n = typeof v === 'number' ? v : Number(String(v).replace(/[^\d.-]/g, ''));
  return Number.isFinite(n) ? n : undefined;
};

export function normalizeProduct(raw: any): Product {
  return {
    ...raw,
    title: raw.title || raw.name || 'Producto',
    price: num(raw.price) ?? 0,
    compareAtPrice: num(raw.compareAtPrice),
    units: num(raw.units),
    netGrams: num(raw.netGrams),
    servings: num(raw.servings),
    stock: num(raw.stock),
  };
}

export function getProducts(p: DeliveryPayload | null): Product[] {
  const list = p?.collections?.productos || [];
  return list.filter((x) => !x.status || x.status === 'PUBLISHED').map(normalizeProduct);
}

export function getCategories(p: DeliveryPayload | null): string[] {
  const defs = p?.collectionDefinitions?.productos?.categories;
  if (defs?.length) return defs;
  return Array.from(new Set(getProducts(p).map((x) => x.category).filter(Boolean) as string[]));
}

export function getPage(p: DeliveryPayload | null, slug: string): CmsPage | undefined {
  return p?.pages?.find((x) => x.slug === slug);
}

export function getSection(p: DeliveryPayload | null, pageSlug: string, key: string): { id: string; key: string; data: SectionData } {
  const page = getPage(p, pageSlug);
  const row = page?.sectionsList?.find((s) => s.key === key);
  const data = row?.data || page?.sections?.[key] || {};
  return { id: row?.id || `sec-${key}`, key, data };
}

export function sectionVisible(p: DeliveryPayload | null, pageSlug: string, key: string) {
  const page = getPage(p, pageSlug);
  const row = page?.sectionsList?.find((s) => s.key === key);
  return row ? row.isVisible !== false : false;
}

export function absMedia(url?: string) {
  if (!url) return '';
  if (/^https?:\/\//.test(url)) return url;
  return `${CMS_URL}${url.startsWith('/') ? '' : '/'}${url}`;
}

export function splitList(v?: string, sep: RegExp = /\s*[|]\s*/): string[] {
  return (v || '').split(sep).map((s) => s.trim()).filter(Boolean);
}

/**
 * Merges the live state the /portal editor posts into the iframe (CMS_LIVE_PREVIEW_STATE),
 * mirroring applyLivePreviewState in the CMS renderer so unsaved edits show instantly.
 */
export function applyLiveState(prev: DeliveryPayload, msg: any, activePageSlug: string): DeliveryPayload {
  const next: DeliveryPayload = { ...prev };
  if (Array.isArray(msg.sectionsList)) {
    const rows: SectionRow[] = msg.sectionsList.map((s: any) => ({
      id: s.id,
      key: s.key,
      name: s.name,
      isVisible: s.isVisible,
      order: s.order,
      data: s.draftData && Object.keys(s.draftData).length > 0 ? s.draftData : s.data || {},
    }));
    const keys = new Set(rows.map((r) => r.key));
    const pages = prev.pages.map((pg) => {
      const matches = pg.sectionsList.some((s) => keys.has(s.key));
      const isTarget = matches || pg.slug === activePageSlug;
      if (!isTarget) return pg;
      const sorted = [...rows].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      const sections: Record<string, SectionData> = {};
      for (const r of sorted) if (r.isVisible !== false) sections[r.key] = r.data || {};
      return { ...pg, sectionsList: sorted, sections };
    });
    next.pages = pages;
  }
  if (msg.globalData && typeof msg.globalData === 'object') next.global = { ...prev.global, ...msg.globalData };
  if (msg.navigationConfig && typeof msg.navigationConfig === 'object') next.navigation = msg.navigationConfig;
  if (msg.collections && typeof msg.collections === 'object') {
    const cols = { ...prev.collections };
    for (const [k, v] of Object.entries(msg.collections)) {
      if (Array.isArray(v) && (v.length > 0 || msg.collectionsAuthoritative)) cols[k] = v as any[];
    }
    next.collections = cols;
  }
  if (msg.collectionDefinitions && typeof msg.collectionDefinitions === 'object') {
    next.collectionDefinitions = { ...prev.collectionDefinitions, ...msg.collectionDefinitions };
  }
  return next;
}
