'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { LayoutGrid, List, Search, SlidersHorizontal, X } from 'lucide-react';
import type { CollectionFacet, CollectionFilterDef, FilterValue } from '@latinovation/cms-client';
import { CmsAddItem, CmsText, useCms, type CmsBlockProps } from '@latinovation/cms-client/react';
import { BlankTiles } from '../Ornaments';
import { ProductTile } from '../ProductTile';
import { useFocusTrap } from '../CartDrawer';
import { Wrap } from './common';
import { formatCop } from '@/lib/format';
import { filterDefs, paramsFromState, runShopQuery, stateFromParams, swatch, type SearchParamsLike, type ShopState } from '@/lib/shop';

/** Parámetros de la URL (del servidor) y filtros fijos de la ruta (/categoria/<slug>). */
export interface ShopRoute {
  params: SearchParamsLike;
  preset?: Record<string, FilterValue>;
  /** Título de la categoría fija (sustituye el título de la sección). */
  title?: string;
  basePath?: string;
}
export const ShopRouteContext = createContext<ShopRoute>({ params: {} });

type Def = CollectionFilterDef & { index: number; fromSection: boolean };

export function Catalog({ data }: CmsBlockProps) {
  const { payload } = useCms();
  const route = useContext(ShopRouteContext);
  const pageSize = Math.max(4, Number(data.pageSize) || 12);
  const defs: Def[] = useMemo(() => {
    const own = Array.isArray(data.filters) && data.filters.some((f: any) => f?.field);
    return filterDefs(payload, data.filters).map((d, index) => ({ ...d, index, fromSection: own }));
  }, [payload, data.filters]);
  const preset = route.preset || {};
  const [state, setState] = useState<ShopState>(() => stateFromParams(route.params, defs, pageSize, preset));
  const [drawer, setDrawer] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeDrawer = useCallback(() => setDrawer(false), []);
  useFocusTrap(drawer, drawerRef, closeDrawer);

  const result = useMemo(() => runShopQuery(payload, defs, state), [payload, defs, state]);

  // URL ↔ estado (sin navegar: replaceState conserva el scroll y el historial)
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const qs = paramsFromState(state, defs, pageSize, preset).toString();
    const url = `${window.location.pathname}${qs ? `?${qs}` : ''}${window.location.hash}`;
    window.history.replaceState(window.history.state, '', url);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const setFilter = (field: string, value: FilterValue) => setState((s) => ({ ...s, limit: pageSize, filters: { ...s.filters, [field]: value } }));
  const toggleValue = (field: string, value: string) => {
    const cur = state.filters[field];
    const list = Array.isArray(cur) ? cur : cur ? [String(cur)] : [];
    setFilter(field, list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  };
  const clearAll = () => setState((s) => ({ ...s, search: '', limit: pageSize, filters: { ...preset } }));

  const chips: Array<{ key: string; label: string; remove: () => void }> = [];
  for (const d of defs) {
    if (preset[d.field] !== undefined) continue;
    const v = state.filters[d.field];
    if (d.type === 'boolean' && v === true) chips.push({ key: d.field, label: d.label || d.field, remove: () => setFilter(d.field, undefined) });
    else if (d.type === 'range' && v && typeof v === 'object' && !Array.isArray(v) && (v.min !== undefined || v.max !== undefined))
      chips.push({ key: d.field, label: `${d.label || d.field}: ${formatCop(v.min ?? result.priceBounds.min)} – ${formatCop(v.max ?? result.priceBounds.max)}`, remove: () => setFilter(d.field, undefined) });
    else if (Array.isArray(v)) for (const x of v) chips.push({ key: `${d.field}:${x}`, label: x, remove: () => toggleValue(d.field, x) });
  }
  if (state.search) chips.unshift({ key: 'q', label: `“${state.search}”`, remove: () => setState((s) => ({ ...s, search: '' })) });

  const sortOptions: Array<{ value: string; label: string }> = Array.isArray(data.sortOptions) && data.sortOptions.length ? data.sortOptions : [{ value: 'relevance', label: 'Relevancia' }];
  const facetFor = (field: string) => result.facets.find((f) => f.field === field);

  const panel = (
    <div className="filters-panel">
      <div className="filters-panel__head">
        <CmsText f="filtersLabel" as="h2" className="filters-panel__title" />
        {chips.length ? (
          <button type="button" className="textlink" onClick={clearAll}>
            <CmsText f="clearLabel" />
          </button>
        ) : null}
      </div>
      {defs.some((d) => d.type === 'boolean') ? (
        <div className="fgroup fgroup--toggles">
          {defs
            .filter((d) => d.type === 'boolean')
            .map((d) => {
              const f = facetFor(d.field);
              const on = state.filters[d.field] === true;
              if (!on && !f?.count) return null;
              return (
                <label key={d.field} className="toggle">
                  <input type="checkbox" checked={on} onChange={(e) => setFilter(d.field, e.target.checked ? true : undefined)} />
                  <span className="toggle__box" aria-hidden="true" />
                  <FilterLabel d={d} />
                  <span className="fcount">{f?.count ?? 0}</span>
                </label>
              );
            })}
        </div>
      ) : null}
      {defs
        .filter((d) => d.type !== 'boolean' && preset[d.field] === undefined)
        .map((d, i) => (
          <FacetGroup key={d.field} d={d} facet={facetFor(d.field)} open={i < 6} state={state} bounds={result.priceBounds} onToggle={toggleValue} onRange={setFilter} />
        ))}
    </div>
  );

  return (
    <div className="shop">
      <Wrap>
        <div className="page-head band__head">
          {route.title ? <h1>{route.title}</h1> : <CmsText f="heading" as="h1" />}
          <CmsText f="intro" as="p" className="lede" />
        </div>
        <div className="shop__toolbar">
          <div className="search shop__search">
            <label htmlFor="shop-q" className="sr-only">
              {data.searchLabel}
            </label>
            <Search className="search__icon" aria-hidden="true" />
            <input
              id="shop-q"
              type="search"
              value={state.search}
              placeholder={data.searchPlaceholder || ''}
              onChange={(e) => setState((s) => ({ ...s, search: e.target.value, limit: pageSize }))}
              aria-describedby="shop-count"
            />
            <CmsText f="searchLabel" className="sr-only" />
          </div>
          <p id="shop-count" className="shop__count" aria-live="polite">
            <strong>{result.total}</strong> <CmsText f="resultsLabel" />
          </p>
          <div className="shop__controls">
            <label className="select">
              <CmsText f="sortLabel" className="select__label" />
              <select value={state.sort} onChange={(e) => setState((s) => ({ ...s, sort: e.target.value }))}>
                {sortOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="seg" role="group">
              <button type="button" aria-pressed={state.view === 'grid'} onClick={() => setState((s) => ({ ...s, view: 'grid' }))}>
                <LayoutGrid aria-hidden="true" />
                <CmsText f="gridLabel" className="seg__label" />
              </button>
              <button type="button" aria-pressed={state.view === 'list'} onClick={() => setState((s) => ({ ...s, view: 'list' }))}>
                <List aria-hidden="true" />
                <CmsText f="listLabel" className="seg__label" />
              </button>
            </div>
            <button type="button" className="plaque plaque--ghost plaque--small shop__filters-btn" onClick={() => setDrawer(true)} aria-expanded={drawer}>
              <SlidersHorizontal aria-hidden="true" />
              <CmsText f="filtersLabel" />
              {chips.length ? <span className="cart-btn__count">{chips.length}</span> : null}
            </button>
          </div>
        </div>
        {chips.length ? (
          <ul className="chips" aria-label="Filtros activos">
            {chips.map((c) => (
              <li key={c.key}>
                <button type="button" className="chip" onClick={c.remove} aria-label={`Quitar ${c.label}`}>
                  {c.label}
                  <X aria-hidden="true" />
                </button>
              </li>
            ))}
            <li>
              <button type="button" className="textlink" onClick={clearAll}>
                <CmsText f="clearLabel" />
              </button>
            </li>
          </ul>
        ) : null}
        <div className="shop__layout">
          <aside className="shop__aside" aria-label={data.filtersLabel || 'Filtros'}>
            {panel}
          </aside>
          <div className="shop__results">
            {result.items.length ? (
              <div className={`tiles catalog catalog--3 catalog--${state.view}`}>
                {result.items.map((p, i) => (
                  <ProductTile key={p.id} p={p} view={state.view} priority={i < 3} />
                ))}
                {state.view === 'grid' ? <BlankTiles n={result.items.length} cols={[3, 3, 2]} /> : null}
              </div>
            ) : (
              <div className="empty">
                <div className="empty-tiles" aria-hidden="true">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <span key={i} />
                  ))}
                </div>
                <CmsText f="emptyText" as="p" className="lede" />
                <button type="button" className="plaque plaque--ghost" onClick={clearAll}>
                  <CmsText f="clearLabel" />
                </button>
              </div>
            )}
            <div className="shop__more">
              <CmsAddItem collection="productos" label="Agregar producto" />
              {result.items.length < result.total ? (
                <>
                  <p className="agate">
                    {result.items.length} / {result.total}
                  </p>
                  <button type="button" className="plaque plaque--ghost" onClick={() => setState((s) => ({ ...s, limit: s.limit + pageSize }))}>
                    <CmsText f="loadMoreLabel" />
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </Wrap>
      {drawer ? (
        <>
          <div className="scrim is-open" onClick={closeDrawer} aria-hidden="true" />
          <div ref={drawerRef} className="drawer drawer--left is-open" role="dialog" aria-modal="true" aria-label={data.filtersLabel || 'Filtros'}>
            <div className="drawer__head">
              <span className="drawer__title">{data.filtersLabel}</span>
              <button type="button" className="icon-btn" onClick={closeDrawer} aria-label="Cerrar" data-autofocus>
                <X aria-hidden="true" />
              </button>
            </div>
            <div className="drawer__body">{panel}</div>
            <div className="drawer__foot">
              <button type="button" className="plaque plaque--block" onClick={closeDrawer}>
                {data.applyLabel} · {result.total}
              </button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

function FilterLabel({ d }: { d: Def }) {
  if (d.fromSection) return <CmsText f={`filters.${d.index}.label`} className="flabel" />;
  return <span className="flabel">{d.label || d.field}</span>;
}

function FacetGroup({
  d,
  facet,
  open,
  state,
  bounds,
  onToggle,
  onRange,
}: {
  d: Def;
  facet?: CollectionFacet;
  open: boolean;
  state: ShopState;
  bounds: { min: number; max: number };
  onToggle: (field: string, value: string) => void;
  onRange: (field: string, value: FilterValue) => void;
}) {
  const v = state.filters[d.field];
  if (d.type === 'range') {
    const r = v && typeof v === 'object' && !Array.isArray(v) ? v : {};
    return (
      <details className="fgroup" open={open}>
        <summary>
          <FilterLabel d={d} />
        </summary>
        <PriceRange bounds={bounds} value={r as { min?: number; max?: number }} onChange={(nv) => onRange(d.field, nv)} />
      </details>
    );
  }
  const options = (facet?.options || []).filter((o) => o.value);
  if (!options.length) return null;
  const selected = Array.isArray(v) ? v : [];
  const isColor = d.field === 'color';
  const numeric = options.every((o) => /^\d+$/.test(o.value));
  const sorted = numeric ? [...options].sort((a, b) => Number(a.value) - Number(b.value)) : options;
  return (
    <details className="fgroup" open={open}>
      <summary>
        <FilterLabel d={d} />
        {selected.length ? <span className="fcount fcount--on">{selected.length}</span> : null}
      </summary>
      <ul className={`fopts${isColor ? ' fopts--color' : ''}`}>
        {sorted.map((o) => {
          const on = selected.includes(o.value);
          return (
            <li key={o.value}>
              <label className={`fopt${o.count === 0 && !on ? ' is-empty' : ''}`}>
                <input type="checkbox" checked={on} disabled={o.count === 0 && !on} onChange={() => onToggle(d.field, o.value)} />
                {isColor ? <span className="swatch swatch--lg" style={{ background: swatch(o.value) }} aria-hidden="true" /> : <span className="fopt__box" aria-hidden="true" />}
                <span className="fopt__name">{o.value}</span>
                <span className="fcount">{o.count}</span>
              </label>
            </li>
          );
        })}
      </ul>
    </details>
  );
}

function PriceRange({ bounds, value, onChange }: { bounds: { min: number; max: number }; value: { min?: number; max?: number }; onChange: (v: FilterValue) => void }) {
  const step = bounds.max - bounds.min > 200000 ? 10000 : 1000;
  const lo = value.min ?? bounds.min;
  const hi = value.max ?? bounds.max;
  const span = Math.max(1, bounds.max - bounds.min);
  const set = (nlo: number, nhi: number) => onChange(nlo <= bounds.min && nhi >= bounds.max ? undefined : { min: nlo <= bounds.min ? undefined : nlo, max: nhi >= bounds.max ? undefined : nhi });
  return (
    <div className="range">
      <div className="range__track" style={{ ['--lo' as any]: (lo - bounds.min) / span, ['--hi' as any]: (hi - bounds.min) / span }}>
        <input type="range" min={bounds.min} max={bounds.max} step={step} value={lo} aria-label="Precio mínimo" onChange={(e) => set(Math.min(Number(e.target.value), hi - step), hi)} />
        <input type="range" min={bounds.min} max={bounds.max} step={step} value={hi} aria-label="Precio máximo" onChange={(e) => set(lo, Math.max(Number(e.target.value), lo + step))} />
      </div>
      <div className="range__vals">
        <span>
          <CmsText f="priceFromLabel" className="agate" /> <strong>{formatCop(lo)}</strong>
        </span>
        <span>
          <CmsText f="priceToLabel" className="agate" /> <strong>{formatCop(hi)}</strong>
        </span>
      </div>
    </div>
  );
}
