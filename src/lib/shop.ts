import {
  getProducts,
  normalizeProduct,
  queryCollection,
  type CollectionFacet,
  type CollectionFilterDef,
  type DeliveryPayload,
  type FilterValue,
  type Product,
} from '@latinovation/cms-client';
import { slugify } from './format';

export const COLLECTION = 'productos';

/** Filtros por defecto si la sección /tienda no trae `filters` ni la colección `collectionDefinitions.filters`. */
export const DEFAULT_FILTERS: CollectionFilterDef[] = [
  { field: 'category', type: 'select', label: 'Categoría' },
  { field: 'style', type: 'select', label: 'Estilo' },
  { field: 'color', type: 'select', label: 'Color' },
  { field: 'material', type: 'select', label: 'Material' },
  { field: 'brand', type: 'select', label: 'Marca' },
  { field: 'price', type: 'range', label: 'Precio' },
  { field: 'pieces', type: 'select', label: 'Piezas' },
  { field: 'places', type: 'select', label: 'Puestos' },
  { field: 'madeInColombia', type: 'boolean', label: 'Hecho en Colombia' },
  { field: 'handPainted', type: 'boolean', label: 'Pintado a mano' },
  { field: 'microwaveSafe', type: 'boolean', label: 'Apto para microondas' },
  { field: 'dishwasherSafe', type: 'boolean', label: 'Apto para lavavajillas' },
  { field: 'onSale', type: 'boolean', label: 'En oferta' },
  { field: 'inStock', type: 'boolean', label: 'Disponible' },
];

/** Nombres de parámetros de URL en español (el resto usa el nombre del campo). */
const PARAM: Record<string, string> = {
  category: 'categoria',
  style: 'estilo',
  color: 'color',
  material: 'material',
  brand: 'marca',
  price: 'precio',
  pieces: 'piezas',
  places: 'puestos',
  madeInColombia: 'hecho',
  handPainted: 'pintado',
  microwaveSafe: 'microondas',
  dishwasherSafe: 'lavavajillas',
  onSale: 'oferta',
  inStock: 'disponible',
};
export const paramFor = (field: string) => PARAM[field] || field;

export interface ShopState {
  filters: Record<string, FilterValue>;
  search: string;
  sort: string;
  view: 'grid' | 'list';
  /** Productos visibles (cargar más suma una tanda). */
  limit: number;
}

export type SearchParamsLike = Record<string, string | string[] | undefined>;

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || '';

export function filterDefs(payload: DeliveryPayload, sectionFilters?: unknown): CollectionFilterDef[] {
  const fromSection = Array.isArray(sectionFilters) ? (sectionFilters as CollectionFilterDef[]).filter((f) => f && f.field) : [];
  if (fromSection.length) return fromSection.map((f) => ({ field: f.field, type: f.type || 'select', label: f.label }));
  const fromCms = payload.collectionDefinitions?.[COLLECTION]?.filters;
  return Array.isArray(fromCms) && fromCms.length ? fromCms : DEFAULT_FILTERS;
}

export function stateFromParams(sp: SearchParamsLike, defs: CollectionFilterDef[], pageSize: number, preset: Record<string, FilterValue> = {}): ShopState {
  const filters: Record<string, FilterValue> = { ...preset };
  for (const d of defs) {
    const raw = first(sp[paramFor(d.field)]);
    if (!raw) continue;
    if (d.type === 'boolean') filters[d.field] = raw === '1' || raw === 'true' || raw === 'si';
    else if (d.type === 'range') {
      const [a, b] = raw.split('-').map((x) => (x === '' ? undefined : Number(x)));
      filters[d.field] = { min: Number.isFinite(a as number) ? a : undefined, max: Number.isFinite(b as number) ? b : undefined };
    } else filters[d.field] = raw.split(',').map((x) => x.trim()).filter(Boolean);
  }
  const view = first(sp.vista) === 'lista' ? 'list' : 'grid';
  return { filters, search: first(sp.q), sort: first(sp.orden) || 'relevance', view, limit: Math.max(pageSize, Number(first(sp.ver)) || pageSize) };
}

export function paramsFromState(s: ShopState, defs: CollectionFilterDef[], pageSize: number, preset: Record<string, FilterValue> = {}): URLSearchParams {
  const p = new URLSearchParams();
  if (s.search) p.set('q', s.search);
  for (const d of defs) {
    const v = s.filters[d.field];
    if (v === undefined || v === null || v === '' || preset[d.field] !== undefined) continue;
    if (d.type === 'boolean') {
      if (v === true) p.set(paramFor(d.field), '1');
    } else if (d.type === 'range' && typeof v === 'object' && !Array.isArray(v)) {
      if (v.min !== undefined || v.max !== undefined) p.set(paramFor(d.field), `${v.min ?? ''}-${v.max ?? ''}`);
    } else if (Array.isArray(v) && v.length) p.set(paramFor(d.field), v.join(','));
  }
  if (s.sort && s.sort !== 'relevance') p.set('orden', s.sort);
  if (s.view === 'list') p.set('vista', 'lista');
  if (s.limit > pageSize) p.set('ver', String(s.limit));
  return p;
}

/** Payload con los filtros declarados y campos derivados (oferta, disponible) para `queryCollection`. */
export function queryablePayload(payload: DeliveryPayload, defs: CollectionFilterDef[]): DeliveryPayload {
  const items = (payload.collections?.[COLLECTION] || []).map((raw) => {
    const p = normalizeProduct(raw);
    return { ...raw, onSale: Boolean(p.compareAtPrice && p.compareAtPrice > p.price), inStock: p.inStock };
  });
  const def = payload.collectionDefinitions?.[COLLECTION] || { id: '', name: 'Productos', slug: COLLECTION };
  return {
    ...payload,
    collections: { ...payload.collections, [COLLECTION]: items },
    collectionDefinitions: { ...payload.collectionDefinitions, [COLLECTION]: { ...def, filters: defs } },
  };
}

export interface ShopResult {
  items: Product[];
  total: number;
  facets: CollectionFacet[];
  priceBounds: { min: number; max: number };
}

export function runShopQuery(payload: DeliveryPayload, defs: CollectionFilterDef[], s: ShopState): ShopResult {
  const qp = queryablePayload(payload, defs);
  const sort = s.sort && s.sort.includes(':') ? s.sort : undefined;
  const filters = Object.fromEntries(Object.entries(s.filters).filter(([, v]) => !(v === false || (Array.isArray(v) && !v.length))));
  const r = queryCollection(qp, { collection: COLLECTION, filters, search: s.search || undefined, sort });
  let items = r.items.map(normalizeProduct);
  if (s.sort === 'recent') items = [...items].reverse();
  else if (!sort) items = [...items].sort((a, b) => Number(Boolean(b.isFeatured)) - Number(Boolean(a.isFeatured)));
  const prices = getProducts(payload).map((p) => p.price).filter((n) => n > 0);
  const priceBounds = { min: prices.length ? Math.floor(Math.min(...prices) / 1000) * 1000 : 0, max: prices.length ? Math.ceil(Math.max(...prices) / 1000) * 1000 : 0 };
  return { items: items.slice(0, s.limit), total: r.total, facets: r.facets, priceBounds };
}

/** Categorías de la tienda con su slug para /categoria/<slug>. */
export function categoryList(payload: DeliveryPayload): Array<{ name: string; slug: string; count: number }> {
  const products = getProducts(payload);
  const defs = payload.collectionDefinitions?.[COLLECTION]?.categories;
  const names = defs?.length ? defs : Array.from(new Set(products.map((p) => p.category).filter(Boolean) as string[]));
  return names.map((name) => ({ name, slug: slugify(name), count: products.filter((p) => p.category === name).length }));
}

export function categoryHref(name: string) {
  return `/categoria/${slugify(name)}`;
}

export function productHref(p: { slug: string }) {
  return `/producto/${encodeURIComponent(p.slug)}`;
}

/** Colores de muestra para las fichas de color (el nombre viene del CMS). */
const SWATCH: Record<string, string> = {
  azul: '#2f5cb7',
  blanco: '#ffffff',
  beige: '#e2d3b4',
  verde: '#6f9a6c',
  amarillo: '#e6bf45',
  naranja: '#df7a37',
  gris: '#9aa0a8',
  negro: '#1d1f24',
  rojo: '#b63a2c',
  rosado: '#e7a4b4',
  cafe: '#7a5537',
};
export function swatch(color: unknown): string {
  const k = slugify(color);
  if (k === 'multicolor') return 'conic-gradient(#2f5cb7 0 25%, #e6bf45 0 50%, #6f9a6c 0 75%, #df7a37 0)';
  return SWATCH[k] || 'color-mix(in oklab, var(--muted) 40%, var(--milk))';
}

/** "Completa tu mesa": piezas de otras categorías que combinan (mismo color o estilo). */
export function completeTheTable(all: Product[], p: Product, n = 4): Product[] {
  const others = all.filter((x) => x.id !== p.id && x.category !== p.category && x.inStock);
  const score = (x: Product) => (x.color === p.color ? 2 : 0) + (x.style === p.style ? 1 : 0) + (x.brand === p.brand ? 0.5 : 0);
  const seen = new Set<string>();
  return [...others]
    .sort((a, b) => score(b) - score(a))
    .filter((x) => (seen.has(x.category || '') ? false : (seen.add(x.category || ''), true)))
    .slice(0, n);
}
