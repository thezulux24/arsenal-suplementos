'use client';

import React, { useCallback, useRef } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';
import { CmsGlobalText, CmsItem, CmsItemImage, CmsItemText, useProduct } from '@latinovation/cms-client/react';
import { useStore } from './StoreProvider';
import { useFocusTrap } from './CartDrawer';
import { AddButton, Badges, Facts, FavoriteButton, Meta, Price, Sets } from './ProductTile';
import { sized } from './SmartImage';
import { productHref } from '@/lib/shop';

const QvImage = sized('(max-width: 760px) 100vw, 480px');

/** Vista rápida: la ficha esencial sin salir de la tienda. */
export function QuickView() {
  const { quickView, openQuickView } = useStore();
  const p = useProduct(quickView || undefined);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => openQuickView(null), [openQuickView]);
  useFocusTrap(Boolean(quickView && p), ref, close);
  if (!quickView || !p) return null;
  return (
    <>
      <div className="scrim is-open" onClick={close} aria-hidden="true" />
      <div ref={ref} className="qv" role="dialog" aria-modal="true" aria-labelledby="qv-title">
        <CmsItem item={p} className="qv__grid">
          <div className="qv__photo tile-seams">
            <CmsItemImage item={p} as={QvImage} alt={p.title} />
            <Badges p={p} />
          </div>
          <div className="qv__info">
            <button type="button" className="icon-btn qv__close" onClick={close} aria-label="Cerrar" data-autofocus>
              <X aria-hidden="true" />
            </button>
            <h2 id="qv-title" className="qv__title">
              <CmsItemText item={p} f="title" />
            </h2>
            <Meta p={p} />
            <CmsItemText item={p} f="summary" as="p" className="lede" multiline />
            <Price p={p} big />
            <Facts p={p} />
            <Sets p={p} />
            <div className="qv__buy">
              <AddButton p={p} className="plaque" />
              <FavoriteButton p={p} className="fav-btn fav-btn--plain" />
            </div>
            <Link href={productHref(p)} className="textlink" onClick={close}>
              <CmsGlobalText f="viewProductLabel" />
            </Link>
          </div>
        </CmsItem>
      </div>
    </>
  );
}
