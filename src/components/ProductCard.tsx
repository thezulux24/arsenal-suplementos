'use client';

import React from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { useCart } from './CartProvider';
import { absMedia, type Product } from '@/lib/cms';
import { formatCop, unitPrice } from '@/lib/format';

export function AddButton({
  product,
  label = 'Agregar',
  className = 'plaque plaque--small',
  qty = 1,
  soldOutLabel = 'Agotado',
  icon = true,
  iconOnly = false,
}: {
  product: Product;
  label?: string;
  className?: string;
  qty?: number;
  soldOutLabel?: string;
  icon?: boolean;
  iconOnly?: boolean;
}) {
  const { add } = useCart();
  const soldOut = typeof product.stock === 'number' && product.stock <= 0;
  return (
    <button
      type="button"
      className={className}
      disabled={soldOut}
      onClick={() => add(product, qty)}
      aria-label={soldOut ? `${product.title}: ${soldOutLabel}` : `${label}: ${product.title}`}
    >
      {icon && !soldOut ? <Plus /> : null}
      {iconOnly ? null : soldOut ? soldOutLabel : label}
    </button>
  );
}

export function Price({ p, big = false }: { p: Product; big?: boolean }) {
  return (
    <span className={`price${big ? ' price--big' : ''}`}>
      {formatCop(p.price)}
      {p.compareAtPrice && p.compareAtPrice > p.price ? <s>{formatCop(p.compareAtPrice)}</s> : null}
    </span>
  );
}

export function ProductCard({ p, addLabel, soldOutLabel }: { p: Product; addLabel?: string; soldOutLabel?: string }) {
  const soldOut = typeof p.stock === 'number' && p.stock <= 0;
  const onSale = p.compareAtPrice && p.compareAtPrice > p.price;
  const per = unitPrice(p);
  return (
    <article className={`card${soldOut ? ' is-soldout' : ''}`}>
      {onSale ? <span className="card__flag">Oferta</span> : null}
      <Link href={`/producto/${p.slug}`} className="card__photo tile-seams" tabIndex={-1} aria-hidden="true">
        <img src={absMedia(p.imageUrl)} alt="" loading="lazy" width={600} height={600} />
      </Link>
      <div className="card__body">
        <Link href={`/producto/${p.slug}`} className="card__title">
          {p.title}
        </Link>
        <span className="card__pres">{[p.brand, p.presentation].filter(Boolean).join(' · ')}</span>
        <div className="card__buy">
          <Price p={p} />
          <AddButton product={p} label={addLabel} soldOutLabel={soldOutLabel} />
        </div>
      </div>
      <div className="card__agate agate">
        {per ? <span>{per}</span> : null}
        {per ? ' · ' : null}
        {p.invima ? <span>INVIMA {p.invima}</span> : <span className="pending">INVIMA por confirmar</span>}
      </div>
    </article>
  );
}
