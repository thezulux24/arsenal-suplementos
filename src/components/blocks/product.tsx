'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Check, CreditCard, Heart, Minus, Plus, RotateCcw, Truck } from 'lucide-react';
import { editAttrs, getProducts, markdownToHtml, type Product } from '@latinovation/cms-client';
import { CmsGlobalText, CmsItem, CmsItemImage, CmsItemText, CmsText, useCms, useProduct, type CmsBlockProps } from '@latinovation/cms-client/react';
import { useStore } from '../StoreProvider';
import { BlankTiles, WhatsAppIcon } from '../Ornaments';
import { Badges, Price, ProductTile } from '../ProductTile';
import { sized } from '../SmartImage';
import { trackWhatsApp, useWhatsApp } from '../Shell';
import { Wrap } from './common';
import { fill, formatCop } from '@/lib/format';
import { categoryHref, completeTheTable, swatch } from '@/lib/shop';

export const ProductSlugContext = createContext<string>('');

const MainImg = sized('(max-width: 900px) 100vw, 52vw');
const ThumbImg = sized('120px');

export function ProductDetail({ data }: CmsBlockProps) {
  const slug = useContext(ProductSlugContext);
  const p = useProduct(slug);
  const { payload } = useCms();
  const all = useMemo(() => getProducts(payload), [payload]);
  const { add, markViewed, isFavorite, toggleFavorite, ready } = useStore();
  const [qty, setQty] = useState(1);
  const [active, setActive] = useState(0);
  const [variant, setVariant] = useState(0);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const wa = useWhatsApp(p ? `Hola, tengo una pregunta sobre ${p.title}${p.brand ? ` de ${p.brand}` : ''}.` : undefined);

  useEffect(() => {
    if (p) markViewed(p.slug);
  }, [p, markViewed]);

  if (!p) return null;

  const images: Array<{ f: string; index: number }> = [...(p.imageUrl ? [{ f: 'imageUrl', index: 0 }] : []), ...p.gallery.map((_, i) => ({ f: 'gallery', index: i }))];
  const current = images[Math.min(active, images.length - 1)];
  const v = p.variants[variant];
  const stock = v?.stock ?? p.stock;
  const inStock = v ? v.stock === undefined || v.stock > 0 : p.inStock;
  const max = typeof stock === 'number' && stock > 0 ? stock : 99;
  const related = all.filter((x) => x.category === p.category && x.id !== p.id).slice(0, 4);
  const complete = completeTheTable(all, p, 4);
  const fav = ready && isFavorite(p.slug);
  const buy = () => add(p, qty, v ? { label: v.label, price: v.price, stock: v.stock } : undefined);

  return (
    <>
      <Wrap>
        <nav className="crumbs" aria-label="Ruta">
          <Link href="/">
            <CmsText f="homeLabel" />
          </Link>
          <span aria-hidden="true">/</span>
          <Link href="/tienda">
            <CmsText f="shopLabel" />
          </Link>
          {p.category ? (
            <>
              <span aria-hidden="true">/</span>
              <Link href={categoryHref(p.category)}>
                <CmsItemText item={p} f="category" />
              </Link>
            </>
          ) : null}
          <span aria-hidden="true">/</span>
          <span aria-current="page">{p.title}</span>
        </nav>

        <CmsItem item={p} className="pdp">
          <div className="pdp__gallery">
            <div
              className={`pdp__main ${current?.f === 'gallery' ? 'is-scene' : 'tile-seams'}${zoom ? ' is-zoomed' : ''}`}
              onMouseMove={(e) => {
                if (window.matchMedia('(hover: hover)').matches) {
                  const r = e.currentTarget.getBoundingClientRect();
                  setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
                }
              }}
              onMouseLeave={() => setZoom(null)}
              onClick={(e) => {
                if (window.matchMedia('(hover: hover)').matches) return;
                const r = e.currentTarget.getBoundingClientRect();
                setZoom((z) => (z ? null : { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 }));
              }}
              style={zoom ? ({ '--zx': `${zoom.x}%`, '--zy': `${zoom.y}%` } as React.CSSProperties) : undefined}
            >
              {current ? <CmsItemImage key={`${current.f}${current.index}`} item={p} f={current.f} index={current.index} as={MainImg} alt={`${p.title}${p.brand ? `, ${p.brand}` : ''}`} fetchPriority="high" loading="eager" /> : null}
              <Badges p={p} />
            </div>
            {images.length > 1 ? (
              <div className="pdp__thumbs">
                {images.map((im, i) => (
                  <button type="button" key={`${im.f}${im.index}`} className={`pdp__thumb${im.f === 'gallery' ? ' is-scene' : ''}`} aria-pressed={i === active} onClick={() => setActive(i)} aria-label={`Foto ${i + 1} de ${images.length}`}>
                    <CmsItemImage item={p} f={im.f} index={im.index} as={ThumbImg} alt="" />
                  </button>
                ))}
                <BlankTiles n={images.length} cols={[4, 4, 4]} />
              </div>
            ) : null}
            <CmsText f="zoomHint" as="p" className="agate pdp__hint" />
          </div>

          <div className="pdp__info">
            <CmsItemText item={p} f="title" as="h1" className="pdp__title" />
            <span className="card__meta pdp__meta">
              <CmsItemText item={p} f="brand" />
              {p.brand && p.size ? <span aria-hidden="true"> · </span> : null}
              <CmsItemText item={p} f="size" />
            </span>
            <CmsItemText item={p} f="summary" as="p" className="lede" multiline />
            <div className="pdp__price">
              <Price p={p} big />
              <span className={`stock${inStock ? '' : ' stock--out'}`}>
                <i aria-hidden="true" />
                <CmsText f={inStock ? 'inStockLabel' : 'soldOutLabel'} />
                {inStock && typeof stock === 'number' && stock <= 10 ? <CmsText f="stockNote" format={(t) => ` · ${fill(t, { n: stock })}`} /> : null}
              </span>
            </div>

            {p.variants.length ? (
              <fieldset className="variants">
                <legend>
                  <CmsText f="variantLabel" />
                </legend>
                {p.variants.map((o, i) => (
                  <label key={o.label} className={`chip${i === variant ? ' is-on' : ''}`}>
                    <input type="radio" name="variant" checked={i === variant} onChange={() => setVariant(i)} disabled={o.stock === 0} />
                    {o.label}
                    {o.price && o.price !== p.price ? ` · ${formatCop(o.price)}` : ''}
                  </label>
                ))}
              </fieldset>
            ) : null}

            <div className="pdp__buy">
              <div className="pdp__qty">
              <CmsText f="quantityLabel" className="agate" />
              <div className="stepper stepper--big" role="group" aria-label={data.quantityLabel}>
                <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Quitar una unidad">
                  <Minus aria-hidden="true" />
                </button>
                <span aria-live="polite">{qty}</span>
                <button type="button" onClick={() => setQty((q) => Math.min(max, q + 1))} aria-label="Agregar una unidad" disabled={qty >= max}>
                  <Plus aria-hidden="true" />
                </button>
              </div>
              </div>
              <button type="button" className="plaque pdp__add" disabled={!inStock} onClick={buy}>
                {inStock ? <Plus aria-hidden="true" /> : null}
                <CmsText f={inStock ? 'addLabel' : 'soldOutLabel'} />
              </button>
            </div>
            <div className="pdp__links">
            <button type="button" className="textlink pdp__fav" aria-pressed={fav} onClick={() => toggleFavorite(p.slug)}>
              <Heart aria-hidden="true" />
              <CmsText f="favoriteLabel" />
            </button>
            {wa ? (
              <a className="textlink pdp__wa" href={wa} target="_blank" rel="noopener noreferrer" onClick={trackWhatsApp}>
                <WhatsAppIcon className="wa-inline" />
                <CmsText f="whatsappAsk" />
              </a>
            ) : null}
            </div>

            <ul className="seals">
              {p.madeInColombia ? (
                <li>
                  <CmsGlobalText f="madeInColombiaBadge" />
                </li>
              ) : null}
              {p.handPainted ? (
                <li>
                  <CmsGlobalText f="handPaintedBadge" />
                </li>
              ) : null}
              {p.microwaveSafe ? (
                <li>
                  <Check aria-hidden="true" />
                  <CmsText f="microwaveLabel" />
                </li>
              ) : null}
              {p.dishwasherSafe ? (
                <li>
                  <Check aria-hidden="true" />
                  <CmsText f="dishwasherLabel" />
                </li>
              ) : null}
            </ul>

            <section className="pdp__block" aria-labelledby="pdp-delivery">
              <CmsText f="deliveryHeading" as="h2" id="pdp-delivery" className="pdp__h" />
              <ul className="tiles notes">
                <li>
                  <Truck aria-hidden="true" />
                  <span>
                    <CmsText f="deliveryNote" as="span" multiline />
                    <CmsText f="shippingNote" as="span" className="agate" multiline />
                  </span>
                </li>
                <li>
                  <CreditCard aria-hidden="true" />
                  <CmsText f="paymentNote" as="span" multiline />
                </li>
                <li>
                  <RotateCcw aria-hidden="true" />
                  <CmsText f="returnsNote" as="span" multiline />
                </li>
              </ul>
            </section>

            <section className="pdp__block" aria-labelledby="pdp-details">
              <CmsText f="detailsHeading" as="h2" id="pdp-details" className="pdp__h" />
              <dl className="spec">
                <Spec label="brandLabel" p={p} f="brand" />
                <Spec label="categoryLabel" p={p} f="category" />
                <Spec label="styleLabel" p={p} f="style" />
                {p.color ? (
                  <>
                    <dt>
                      <CmsText f="colorLabel" />
                    </dt>
                    <dd className="fact-color">
                      <i className="swatch" style={{ background: swatch(p.color) }} aria-hidden="true" />
                      <CmsItemText item={p} f="color" />
                    </dd>
                  </>
                ) : null}
                <Spec label="materialLabel" p={p} f="material" />
                <Spec label="piecesLabel" p={p} f="pieces" numeric />
                <Spec label="placesLabel" p={p} f="places" numeric />
                <Spec label="sizeLabel" p={p} f="size" />
                <Spec label="skuLabel" p={p} f="sku" />
              </dl>
            </section>

            {p.description ? (
              <section className="pdp__block" aria-labelledby="pdp-desc">
                <CmsText f="descriptionHeading" as="h2" id="pdp-desc" className="pdp__h" />
                <div
                  className="prose"
                  {...editAttrs({ item: { collection: 'productos', id: p.id }, field: 'description', type: 'richtext' })}
                  dangerouslySetInnerHTML={{ __html: markdownToHtml(tidyDescription(p.description)) }}
                />
              </section>
            ) : null}
            {p.care ? (
              <section className="pdp__block" aria-labelledby="pdp-care">
                <CmsText f="careHeading" as="h2" id="pdp-care" className="pdp__h" />
                <CmsItemText item={p} f="care" as="p" multiline className="prose" />
              </section>
            ) : null}
          </div>
        </CmsItem>
      </Wrap>

      {complete.length ? <Shelf heading="completeHeading" list={complete} /> : null}
      {related.length ? <Shelf heading="relatedHeading" list={related} /> : null}

      <div className="sticky-buy" aria-hidden={false}>
        <div className="sticky-buy__info">
          <span className="sticky-buy__name">{p.title}</span>
          <span className="price">{formatCop(v?.price ?? p.price)}</span>
        </div>
        <button type="button" className="plaque" disabled={!inStock} onClick={buy}>
          {inStock ? <Plus aria-hidden="true" /> : null}
          <CmsText f={inStock ? 'stickyLabel' : 'soldOutLabel'} />
        </button>
      </div>
    </>
  );
}

/** Las descripciones importadas separan rasgos con " - ": se muestran como lista. */
function tidyDescription(v: unknown) {
  return String(v ?? '')
    .replace(/\s+-\s+(?=[A-ZÁÉÍÓÚÑ])/g, '\n- ')
    .replace(/\s+(Incluye:)/g, '\n\n**$1**');
}

function Spec({ label, p, f, numeric = false }: { label: string; p: Product; f: string; numeric?: boolean }) {
  const v = p[f];
  if (v === undefined || v === null || v === '' || (numeric && !(Number(v) > 0))) return null;
  return (
    <>
      <dt>
        <CmsText f={label} />
      </dt>
      <dd>
        <CmsItemText item={p} f={f} format={numeric ? (x) => String(x) : undefined} />
      </dd>
    </>
  );
}

function Shelf({ heading, list }: { heading: string; list: Product[] }) {
  return (
    <div className="band band--tight">
      <Wrap>
        <div className="band__head">
          <CmsText f={heading} as="h2" />
        </div>
        <div className="tiles catalog">
          {list.map((r) => (
            <ProductTile key={r.id} p={r} />
          ))}
          <BlankTiles n={list.length} />
        </div>
      </Wrap>
    </div>
  );
}
