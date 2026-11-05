'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Check, Minus, Plus } from 'lucide-react';
import { useCms } from './CmsProvider';
import { Section, T } from './Editable';
import { WhatsAppIcon } from './Ornaments';
import { AddButton, Price, ProductCard } from './ProductCard';
import { trackWhatsApp } from './Shell';
import { absMedia, getProducts, getSection, splitList } from '@/lib/cms';
import { unitPrice, waLink } from '@/lib/format';

export function ProductView({ slug }: { slug: string }) {
  const { payload } = useCms();
  const products = useMemo(() => getProducts(payload), [payload]);
  const p = products.find((x) => x.slug === slug);
  const s = getSection(payload, '/producto', 'ficha');
  const d = s.data;
  const g = payload.global || {};
  const [qty, setQty] = useState(1);
  const [active, setActive] = useState(0);

  if (!p) {
    return (
      <div className="wrap page-head" style={{ minHeight: '50vh', display: 'grid', gap: 18, alignContent: 'start' }}>
        <h1>Producto no disponible</h1>
        <p className="lede">Este producto ya no está en el catálogo. Mira los otros objetivos.</p>
        <Link href="/#catalogo" className="plaque" style={{ justifySelf: 'start' }}>
          Ver el catálogo
        </Link>
      </div>
    );
  }

  const images = [p.imageUrl, ...splitList(p.gallery, /\s*,\s*/)].filter(Boolean) as string[];
  const per = unitPrice(p);
  const related = products.filter((x) => x.category === p.category && x.id !== p.id).slice(0, 4);
  const max = typeof p.stock === 'number' && p.stock > 0 ? p.stock : 99;

  return (
    <Section s={s} className="wrap" label="Ficha de producto">
      <nav className="crumbs" aria-label="Ruta">
        <Link href="/">Inicio</Link>
        <span aria-hidden="true">/</span>
        <Link href={`/?objetivo=${encodeURIComponent(p.category || '')}#catalogo`}>{p.category}</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{p.title}</span>
      </nav>
      <div className="pdp">
        <div className="pdp__gallery">
          <div className="pdp__main tile-photo">
            <img src={absMedia(images[active] || images[0])} alt={`${p.title} ${p.brand || ''}`} width={1200} height={1200} />
          </div>
          {images.length > 1 ? (
            <div className="pdp__thumbs">
              {images.map((src, i) => (
                <button type="button" key={src} className="pdp__thumb" aria-pressed={i === active} onClick={() => setActive(i)} aria-label={`Ver imagen ${i + 1}`}>
                  <img src={absMedia(src)} alt="" width={200} height={200} />
                </button>
              ))}
              {Array.from({ length: (4 - (images.length % 4)) % 4 }).map((_, i) => (
                <span key={i} className="blank-tile" aria-hidden="true" />
              ))}
            </div>
          ) : null}
        </div>

        <div className="pdp__info">
          <span className="card__brand">{p.brand}</span>
          <h1 style={{ fontSize: 'clamp(2rem, 1.3rem + 2.2vw, 3.2rem)' }}>{p.title}</h1>
          {p.summary ? <p className="lede">{p.summary}</p> : null}
          <div style={{ display: 'grid', gap: 4 }}>
            <Price p={p} big />
            {per ? <span className="agate">{per} · IVA incluido</span> : <span className="agate">IVA incluido</span>}
          </div>
          <div className="pdp__buy">
            <div className="stepper" aria-label="Cantidad">
              <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Quitar una unidad">
                <Minus />
              </button>
              <span aria-live="polite">{qty}</span>
              <button type="button" onClick={() => setQty((q) => Math.min(max, q + 1))} aria-label="Agregar una unidad">
                <Plus />
              </button>
            </div>
            <AddButton product={p} qty={qty} label={d.addLabel || 'Agregar al carrito'} className="plaque" />
          </div>
          {g.whatsappNumber ? (
            <a
              className="textlink"
              style={{ display: 'inline-flex', gap: 8, alignItems: 'center', justifySelf: 'start' }}
              href={waLink(g.whatsappNumber, `Hola Arsenal, tengo una pregunta sobre ${p.title} de ${p.brand}.`)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={trackWhatsApp}
            >
              <WhatsAppIcon className="wa-inline" />
              {d.whatsappAsk || 'Preguntar por WhatsApp'}
            </a>
          ) : null}

          <dl className="spec">
            <dt>Presentación</dt>
            <dd>{p.presentation}</dd>
            <dt>{d.registrationLabel || 'Registro sanitario'}</dt>
            <dd>{p.invima ? `INVIMA ${p.invima}` : d.noRegistrationText || 'Pídelo por WhatsApp'}</dd>
            <dt>Objetivo</dt>
            <dd>{p.category}</dd>
            <dt>Envío</dt>
            <dd>
              <T s={s} f="shippingNote" />
            </dd>
          </dl>

          {splitList(p.highlights).length ? (
            <ul className="highlights">
              {splitList(p.highlights).map((h) => (
                <li key={h}>
                  <Check aria-hidden="true" />
                  {h}
                </li>
              ))}
            </ul>
          ) : null}

          {p.description ? <p>{p.description}</p> : null}
          {p.howToUse ? (
            <div style={{ display: 'grid', gap: 6 }}>
              <T s={s} f="howToUseLabel" as="h3" />
              <p>{p.howToUse}</p>
            </div>
          ) : null}
          <T s={s} f="legalNote" as="p" className="agate" />
        </div>
      </div>

      {related.length ? (
        <div style={{ paddingBottom: 96 }}>
          <div className="band__head">
            <T s={s} f="relatedHeading" as="h2" />
          </div>
          <div className="tiles catalog">
            {related.map((r) => (
              <ProductCard key={r.id} p={r} />
            ))}
          </div>
        </div>
      ) : null}
    </Section>
  );
}
