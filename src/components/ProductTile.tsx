'use client';

import React from 'react';
import Link from 'next/link';
import { Eye, Heart, Plus } from 'lucide-react';
import type { Product } from '@latinovation/cms-client';
import { CmsGlobalText, CmsItem, CmsItemImage, CmsItemText, useCms, useGlobal } from '@latinovation/cms-client/react';
import { useStore } from './StoreProvider';
import { sized } from './SmartImage';
import { formatCop } from '@/lib/format';
import { productHref, swatch } from '@/lib/shop';

const TileImage = sized('(max-width: 760px) 50vw, (max-width: 1100px) 33vw, 340px');
const ListImage = sized('(max-width: 760px) 34vw, 220px');

const priceFmt = (v: unknown) => formatCop(v);

export function onSale(p: Product) {
  return Boolean(p.compareAtPrice && p.compareAtPrice > p.price);
}

/** Precio con precio anterior tachado; ambos se editan desde el editor del producto. */
export function Price({ p, big = false }: { p: Product; big?: boolean }) {
  return (
    <span className={`price${big ? ' price--big' : ''}`}>
      <CmsItemText item={p} f="price" format={priceFmt} />
      {onSale(p) ? (
        <s>
          <CmsItemText item={p} f="compareAtPrice" format={priceFmt} />
        </s>
      ) : null}
    </span>
  );
}

/** Sellos del producto: solo los que la ficha tiene marcados en el CMS. */
export function Badges({ p, className = 'card__flags' }: { p: Product; className?: string }) {
  const flags: string[] = [];
  if (onSale(p)) flags.push('saleBadge');
  if (p.handPainted) flags.push('handPaintedBadge');
  if (p.madeInColombia) flags.push('madeInColombiaBadge');
  if (!p.inStock) flags.push('soldOutBadge');
  if (!flags.length) return null;
  return (
    <span className={className}>
      {flags.map((f) => (
        <CmsGlobalText key={f} f={f} className={`flag${f === 'soldOutBadge' ? ' flag--out' : ''}`} />
      ))}
    </span>
  );
}

export function AddButton({ p, qty = 1, className = 'plaque plaque--small', label, iconOnly = false }: { p: Product; qty?: number; className?: string; label?: React.ReactNode; iconOnly?: boolean }) {
  const { add } = useStore();
  const addText = useGlobal<string>('addLabel', '');
  const soldText = useGlobal<string>('soldOutBadge', '');
  const sold = !p.inStock;
  return (
    <button type="button" className={className} disabled={sold} onClick={() => add(p, qty)} aria-label={iconOnly ? `${sold ? soldText : addText}: ${p.title}` : undefined}>
      {sold ? null : <Plus aria-hidden="true" />}
      {iconOnly ? null : (label ?? <CmsGlobalText f={sold ? 'soldOutBadge' : 'addLabel'} />)}
    </button>
  );
}

export function FavoriteButton({ p, className = 'fav-btn' }: { p: Product; className?: string }) {
  const { isFavorite, toggleFavorite, ready } = useStore();
  const label = useGlobal<string>('favoritesLabel', '');
  const on = ready && isFavorite(p.slug);
  return (
    <button type="button" className={className} aria-pressed={on} aria-label={`${label}: ${p.title}`} onClick={() => toggleFavorite(p.slug)}>
      <Heart aria-hidden="true" />
    </button>
  );
}

/** Línea de datos de la pieza: color con muestra, estilo, material y medida o piezas. */
export function Facts({ p, className = 'card__facts' }: { p: Product; className?: string }) {
  const sep = <span aria-hidden="true"> · </span>;
  return (
    <span className={className}>
      {p.color ? (
        <span className="fact-color">
          <i className="swatch" style={{ background: swatch(p.color) }} aria-hidden="true" />
          <CmsItemText item={p} f="color" />
        </span>
      ) : null}
      {p.style ? (
        <>
          {sep}
          <CmsItemText item={p} f="style" />
        </>
      ) : null}
      {p.material ? (
        <>
          {sep}
          <CmsItemText item={p} f="material" />
        </>
      ) : null}
      {p.size ? (
        <>
          {sep}
          <CmsItemText item={p} f="size" />
        </>
      ) : null}
    </span>
  );
}

export function Meta({ p }: { p: Product }) {
  return (
    <span className="card__meta">
      <CmsItemText item={p} f="brand" />
      {p.brand && p.category ? <span aria-hidden="true"> · </span> : null}
      <CmsItemText item={p} f="category" />
    </span>
  );
}

export function Sets({ p }: { p: Product }) {
  const pieces = Number(p.pieces) || 0;
  const places = Number(p.places) || 0;
  if (pieces <= 1 && !places) return null;
  return (
    <span className="card__sets">
      {pieces > 1 ? (
        <span>
          {pieces} <CmsGlobalText f="piecesSuffix" />
        </span>
      ) : null}
      {places ? (
        <span>
          {places} <CmsGlobalText f="placesSuffix" />
        </span>
      ) : null}
    </span>
  );
}

/**
 * Azulejo de producto. Todo lo visible está marcado para el portal: los campos del producto
 * (data-cms-item) y los textos comunes (data-cms-global).
 */
export function ProductTile({ p, view = 'grid', priority = false }: { p: Product; view?: 'grid' | 'list'; priority?: boolean }) {
  const { openQuickView } = useStore();
  const { isBuilder } = useCms();
  const href = productHref(p);
  const Img = view === 'list' ? ListImage : TileImage;
  return (
    <CmsItem item={p} as="article" className={`card card--${view}${p.inStock ? '' : ' is-soldout'}`}>
      <div className="card__photo tile-seams">
        <Link href={href} className="card__photo-link" tabIndex={-1} aria-hidden="true">
          <CmsItemImage item={p} as={Img} alt="" {...(priority ? { fetchPriority: 'high' as any, loading: 'eager' as const } : {})} />
        </Link>
        <Badges p={p} />
        <FavoriteButton p={p} />
        {isBuilder ? null : (
          <button type="button" className="card__quick" onClick={() => openQuickView(p.slug)}>
            <Eye aria-hidden="true" />
            <CmsGlobalText f="quickViewLabel" />
          </button>
        )}
      </div>
      <div className="card__body">
        <Link href={href} className="card__title">
          <CmsItemText item={p} f="title" />
        </Link>
        <Meta p={p} />
        {view === 'list' ? <CmsItemText item={p} f="summary" as="p" className="card__summary" multiline /> : null}
        <div className="card__buy">
          <Price p={p} />
          <AddButton p={p} />
        </div>
      </div>
      <div className="card__agate">
        <Facts p={p} />
        <Sets p={p} />
      </div>
    </CmsItem>
  );
}
