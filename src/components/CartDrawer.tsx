'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { Minus, Plus, Trash2, X } from 'lucide-react';
import { mediaUrl } from '@latinovation/cms-client';
import { CmsGlobalText, useCms, useGlobal } from '@latinovation/cms-client/react';
import { useStore } from './StoreProvider';
import { CMS_URL } from '@/lib/site';
import { fill, formatCop } from '@/lib/format';

/** Mantiene el foco dentro de un diálogo modal mientras está abierto. */
export function useFocusTrap(open: boolean, ref: React.RefObject<HTMLElement | null>, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const el = ref.current;
    const sel = 'a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])';
    const t = setTimeout(() => (el?.querySelector<HTMLElement>('[data-autofocus]') || el?.querySelector<HTMLElement>(sel))?.focus(), 30);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key !== 'Tab' || !el) return;
      const items = Array.from(el.querySelectorAll<HTMLElement>(sel)).filter((n) => n.offsetParent !== null);
      if (!items.length) return;
      const firstEl = items[0];
      const lastEl = items[items.length - 1];
      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      clearTimeout(t);
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      prev?.focus?.();
    };
  }, [open, ref, onClose]);
}

export function CartDrawer() {
  const { lines, cartOpen, setCartOpen, subtotal, setQty, remove, count, notes, setNotes } = useStore();
  const { payload } = useCms();
  const ref = useRef<HTMLElement>(null);
  const free = payload.ecommerce?.freeShippingThreshold || 0;
  const missing = Math.max(0, free - subtotal);
  const missingText = useGlobal<string>('cartFreeMissing', '');
  const close = React.useCallback(() => setCartOpen(false), [setCartOpen]);
  useFocusTrap(cartOpen, ref, close);
  const progress = free > 0 ? Math.min(1, subtotal / free) : 0;

  return (
    <>
      <div className={`scrim${cartOpen ? ' is-open' : ''}`} onClick={close} aria-hidden="true" />
      <aside ref={ref} className={`drawer${cartOpen ? ' is-open' : ''}`} role="dialog" aria-modal="true" aria-labelledby="cart-title" aria-hidden={!cartOpen} inert={!cartOpen}>
        <div className="drawer__head">
          <h2 id="cart-title" className="drawer__title">
            <CmsGlobalText f="cartTitle" />
            {count ? <span className="drawer__count"> · {count}</span> : null}
          </h2>
          <button type="button" className="icon-btn" onClick={close} aria-label="Cerrar" data-autofocus>
            <X aria-hidden="true" />
          </button>
        </div>
        {free > 0 && lines.length ? (
          <div className="meter" role="status">
            <p>{missing > 0 ? fill(missingText, { monto: formatCop(missing) }) : <CmsGlobalText f="cartFreeDone" />}</p>
            <span className="meter__track" aria-hidden="true">
              <span className="meter__fill" style={{ transform: `scaleX(${progress})` }} />
            </span>
          </div>
        ) : null}
        <div className="drawer__body">
          {lines.length === 0 ? (
            <div className="drawer__empty">
              <div className="empty-tiles" aria-hidden="true">
                {Array.from({ length: 6 }).map((_, i) => (
                  <span key={i} />
                ))}
              </div>
              <CmsGlobalText f="cartEmpty" as="p" className="lede" />
              <Link href="/tienda" className="plaque plaque--ghost" onClick={close}>
                <CmsGlobalText f="cartContinue" />
              </Link>
            </div>
          ) : (
            <ul className="lines">
              {lines.map((l) => (
                <li className="line" key={l.key}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="line__img" src={mediaUrl(l.imageUrl || '', CMS_URL)} alt="" width={76} height={76} loading="lazy" />
                  <div className="line__main">
                    <Link href={`/producto/${l.slug}`} className="line__title" onClick={close}>
                      {l.title}
                    </Link>
                    <p className="agate">{[l.brand, l.variantLabel].filter(Boolean).join(' · ')}</p>
                    <div className="stepper" role="group" aria-label={`Cantidad de ${l.title}`}>
                      <button type="button" onClick={() => setQty(l.key, l.quantity - 1)} aria-label="Quitar una unidad">
                        <Minus aria-hidden="true" />
                      </button>
                      <span aria-live="polite">{l.quantity}</span>
                      <button type="button" onClick={() => setQty(l.key, l.quantity + 1)} aria-label="Agregar una unidad" disabled={typeof l.stock === 'number' && l.stock > 0 && l.quantity >= l.stock}>
                        <Plus aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                  <div className="line__side">
                    <span className="price">{formatCop(l.unitPrice * l.quantity)}</span>
                    <button type="button" className="icon-btn icon-btn--small" onClick={() => remove(l.key)} aria-label={`Eliminar ${l.title}`}>
                      <Trash2 aria-hidden="true" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        {lines.length > 0 ? (
          <div className="drawer__foot">
            <div className="field">
              <label htmlFor="cart-notes">
                <CmsGlobalText f="cartNotesLabel" />
              </label>
              <textarea id="cart-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} />
            </div>
            <div className="row-between">
              <CmsGlobalText f="cartSubtotal" />
              <span className="price">{formatCop(subtotal)}</span>
            </div>
            <Link href="/checkout" className="plaque plaque--block" onClick={close}>
              <CmsGlobalText f="cartCheckout" />
            </Link>
            <button type="button" className="textlink drawer__continue" onClick={close}>
              <CmsGlobalText f="cartContinue" />
            </button>
          </div>
        ) : null}
      </aside>
    </>
  );
}
