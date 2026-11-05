'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { Minus, Plus, Trash2, X } from 'lucide-react';
import { useCart } from './CartProvider';
import { useCms } from './CmsProvider';
import { absMedia } from '@/lib/cms';
import { formatCop } from '@/lib/format';

export function CartDrawer() {
  const { lines, open, setOpen, subtotal, setQty, remove, count } = useCart();
  const { payload } = useCms();
  const closeRef = useRef<HTMLButtonElement>(null);
  const free = payload.ecommerce?.freeShippingThreshold || 0;
  const flat = payload.ecommerce?.flatShippingRate || 0;
  const missing = Math.max(0, free - subtotal);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, setOpen]);

  return (
    <>
      <div className={`scrim${open ? ' is-open' : ''}`} onClick={() => setOpen(false)} aria-hidden="true" />
      <aside className={`drawer${open ? ' is-open' : ''}`} role="dialog" aria-modal="true" aria-label="Carrito" aria-hidden={!open}>
        <div className="drawer__head">
          <h2 style={{ fontSize: '1.5rem' }}>Tu carrito</h2>
          <button ref={closeRef} type="button" className="close-btn" onClick={() => setOpen(false)} aria-label="Cerrar carrito">
            <X />
          </button>
        </div>
        <div className="drawer__body">
          {lines.length === 0 ? (
            <div style={{ display: 'grid', gap: 18, paddingTop: 12 }}>
              <div className="empty-tiles" aria-hidden="true">
                {Array.from({ length: 6 }).map((_, i) => (
                  <span key={i} />
                ))}
              </div>
              <p className="lede">Tu carrito está vacío. Elige por objetivo y agrega desde cualquier azulejo.</p>
              <Link href="/#objetivos" className="plaque plaque--ghost" onClick={() => setOpen(false)}>
                Ver objetivos
              </Link>
            </div>
          ) : (
            lines.map((l) => (
              <div className="line" key={l.productId}>
                <img className="line__img" src={absMedia(l.imageUrl)} alt="" width={76} height={76} />
                <div style={{ minWidth: 0 }}>
                  <Link href={`/producto/${l.slug}`} className="line__title" onClick={() => setOpen(false)}>
                    {l.title}
                  </Link>
                  <p className="agate">
                    {l.brand}
                    {l.presentation ? ` · ${l.presentation}` : ''}
                  </p>
                  <div className="stepper" aria-label={`Cantidad de ${l.title}`}>
                    <button type="button" onClick={() => setQty(l.productId, l.quantity - 1)} aria-label="Quitar una unidad">
                      <Minus />
                    </button>
                    <span aria-live="polite">{l.quantity}</span>
                    <button type="button" onClick={() => setQty(l.productId, l.quantity + 1)} aria-label="Agregar una unidad">
                      <Plus />
                    </button>
                  </div>
                </div>
                <div style={{ display: 'grid', justifyItems: 'end', gap: 8 }}>
                  <span className="price" style={{ fontSize: '1rem' }}>
                    {formatCop(l.unitPrice * l.quantity)}
                  </span>
                  <button type="button" className="close-btn" style={{ width: 34, height: 34 }} onClick={() => remove(l.productId)} aria-label={`Eliminar ${l.title}`}>
                    <Trash2 />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
        {lines.length > 0 ? (
          <div className="drawer__foot">
            <div className="row-between">
              <span>Subtotal · {count} {count === 1 ? 'producto' : 'productos'}</span>
              <span className="price">{formatCop(subtotal)}</span>
            </div>
            {free > 0 ? (
              <p className="meter">
                {missing > 0 ? (
                  <>
                    Te faltan <b>{formatCop(missing)}</b> para el envío gratis. Envío: {formatCop(flat)}.
                  </>
                ) : (
                  <b>Tu envío es gratis.</b>
                )}
              </p>
            ) : null}
            <Link href="/checkout" className="plaque plaque--block" onClick={() => setOpen(false)}>
              Ir a pagar
            </Link>
          </div>
        ) : null}
      </aside>
    </>
  );
}
