'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CreditCard, Plus, Truck } from 'lucide-react';
import { useCms } from './CmsProvider';
import { Section, T } from './Editable';
import { Frame, Frieze, WhatsAppIcon } from './Ornaments';
import { AddButton, Price, ProductCard } from './ProductCard';
import { trackWhatsApp } from './Shell';
import { absMedia, CMS_SLUG, CMS_URL, getCategories, getProducts, getSection, sectionVisible, type Product } from '@/lib/cms';
import { waLink } from '@/lib/format';

export function HomeView() {
  const { payload } = useCms();
  const products = useMemo(() => getProducts(payload), [payload]);
  const categories = useMemo(() => getCategories(payload), [payload]);
  const bySlug = useMemo(() => new Map(products.map((p) => [p.slug, p])), [products]);
  const [filter, setFilter] = useState<string>('');

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('objetivo');
    if (q) setFilter(q);
  }, []);

  const pick = (goal: string) => {
    setFilter(goal);
    requestAnimationFrame(() => document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  const vis = (k: string) => sectionVisible(payload, '/', k);

  return (
    <>
      {vis('hero') ? <Hero bySlug={bySlug} products={products} /> : null}
      {vis('objetivos') ? <Goals categories={categories} products={products} active={filter} onPick={pick} /> : null}
      {vis('catalogo') ? <Catalog categories={categories} products={products} filter={filter} setFilter={setFilter} /> : null}
      {vis('envios') ? <Shipping /> : null}
      {vis('asesoria') ? <Advice /> : null}
      {vis('preguntas') ? <Faq /> : null}
    </>
  );
}

function Hero({ bySlug, products }: { bySlug: Map<string, Product>; products: Product[] }) {
  const { payload } = useCms();
  const s = getSection(payload, '/', 'hero');
  const d = s.data;
  const featured = bySlug.get(d.featuredProduct) || products.find((p) => p.isFeatured) || products[0];
  const sideKeys = String(d.sideProducts || '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
  const side = (sideKeys.length ? sideKeys.map((k) => bySlug.get(k)).filter(Boolean) : products.filter((p) => p.isFeatured && p !== featured))
    .filter((p): p is Product => Boolean(p) && p !== featured)
    .slice(0, 3);

  return (
    <Section s={s} className="hero" label="Portada">
      <div className="wrap">
        <Frieze className="frieze--thin wall__frieze" />
        <div className="wall">
          <Frame className="wall__cartouche" tone="mustard">
            <T s={s} f="headline" as="h1" />
            <T s={s} f="subheadline" as="p" className="lede" />
            <div className="wall__actions">
              <a href="#catalogo" className="plaque">
                {d.secondaryCtaText || 'Ver el catálogo'}
                <ArrowRight />
              </a>
            </div>
            {d.factLine ? (
              <p className="wall__fact">
                <Truck />
                <T s={s} f="factLine" />
              </p>
            ) : null}
          </Frame>

          {featured ? (
            <div className="wall__featured">
              <Link href={`/producto/${featured.slug}`} className="featured__panel" aria-label={`${featured.title}, ver ficha`}>
                <img src={absMedia(featured.imageUrl)} alt={`${featured.title} ${featured.brand || ''}`} width={1200} height={1200} fetchPriority="high" />
              </Link>
              <div className="featured__plate">
                <div style={{ minWidth: 0 }}>
                  <h2>{featured.title}</h2>
                  <span className="card__pres">
                    {[featured.brand, featured.presentation].filter(Boolean).join(' · ')}
                  </span>
                </div>
                <div className="featured__buy">
                  <Price p={featured} big />
                  <AddButton product={featured} label={d.primaryCtaText || 'Agregar al carrito'} className="plaque" />
                </div>
              </div>
            </div>
          ) : null}

          {side.map((p) => (
            <div className="wall__side" key={p.id}>
              <Link href={`/producto/${p.slug}`} className="side__photo" aria-label={`${p.title}, ver ficha`}>
                <img src={absMedia(p.imageUrl)} alt={`${p.title} ${p.brand || ''}`} width={600} height={600} />
              </Link>
              <div className="side__row">
                <div style={{ minWidth: 0 }}>
                  <span className="side__title">{p.title}</span>
                  <Price p={p} />
                </div>
                <AddSmall p={p} />
              </div>
            </div>
          ))}
        </div>
        <Frieze className="frieze--thin wall__frieze" />
      </div>
    </Section>
  );
}

function AddSmall({ p }: { p: Product }) {
  return <AddButton product={p} className="icon-plaque" label="Agregar" icon iconOnly />;
}

function Goals({
  categories,
  products,
  active,
  onPick,
}: {
  categories: string[];
  products: Product[];
  active: string;
  onPick: (g: string) => void;
}) {
  const { payload } = useCms();
  const s = getSection(payload, '/', 'objetivos');
  const g = payload.global || {};
  const widgets = s.data.widgets || [];
  const panels = categories.map((c) => {
    const w = widgets.find((x) => (x.title || '').trim().toLowerCase() === c.toLowerCase());
    const sample = products.find((p) => p.category === c);
    return {
      name: c,
      body: w?.body || '',
      image: w?.imageUrl || sample?.imageUrl || '',
      count: products.filter((p) => p.category === c).length,
    };
  });

  return (
    <Section s={s} id="objetivos" className="band grout-ground" label="Objetivos">
      <div className="wrap">
        <div className="band__head">
          <T s={s} f="heading" as="h2" />
          <T s={s} f="intro" as="p" className="lede" />
        </div>
        <Frame className="goals-frame" tone="mustard">
        <div className={`tiles goals${active ? ' has-active' : ''}`}>
          {panels.map((pn, i) => (
            <button
              type="button"
              key={pn.name}
              className={`goal${i === 0 ? ' goal--lead' : ''}${active === pn.name ? ' is-active' : ''}`}
              onClick={() => onPick(pn.name)}
              aria-pressed={active === pn.name}
            >
              <span className="goal__photo">{pn.image ? <img src={absMedia(pn.image)} alt="" loading="lazy" width={600} height={450} /> : null}</span>
              <span className="goal__body">
                <span className="goal__name">{pn.name}</span>
                {pn.body ? <span style={{ color: 'var(--muted)', fontSize: 15 }}>{pn.body}</span> : null}
                <span className="goal__count">
                  {pn.count} {pn.count === 1 ? 'producto' : 'productos'}
                  <ArrowRight />
                </span>
              </span>
            </button>
          ))}
          {g.whatsappNumber ? (
            <a className="goal goal--ask" href={waLink(g.whatsappNumber, g.whatsappPrefill || 'Hola')} target="_blank" rel="noopener noreferrer" onClick={trackWhatsApp}>
              <span className="goal__name">¿No sabes por dónde empezar?</span>
              <p>Cuéntanos qué entrenas y cómo duermes. Te respondemos con dos o tres opciones.</p>
              <span className="goal__count" style={{ color: 'var(--milk)' }}>
                <WhatsAppIcon className="wa-inline" />
                Escribir por WhatsApp
              </span>
            </a>
          ) : null}
          <span className="blank-tile goals__blank" aria-hidden="true" />
        </div>
        </Frame>
      </div>
    </Section>
  );
}

function Catalog({
  categories,
  products,
  filter,
  setFilter,
}: {
  categories: string[];
  products: Product[];
  filter: string;
  setFilter: (f: string) => void;
}) {
  const { payload } = useCms();
  const s = getSection(payload, '/', 'catalogo');
  const d = s.data;
  const list = filter ? products.filter((p) => p.category === filter) : products;
  return (
    <Section s={s} id="catalogo" className="band" label="Catálogo">
      <div className="wrap">
        <div className="band__head">
          <T s={s} f="heading" as="h2" />
          <T s={s} f="intro" as="p" className="lede" />
        </div>
        <div className="filters" role="toolbar" aria-label="Filtrar por objetivo">
          <button type="button" className="filter" aria-pressed={!filter} onClick={() => setFilter('')}>
            {d.allLabel || 'Todos'}
            <span className="filter__n">{products.length}</span>
          </button>
          {categories.map((c) => (
            <button type="button" key={c} className="filter" aria-pressed={filter === c} onClick={() => setFilter(c)}>
              {c}
              <span className="filter__n">{products.filter((p) => p.category === c).length}</span>
            </button>
          ))}
        </div>
        {list.length ? (
          <div className="tiles catalog">
            {list.map((p) => (
              <ProductCard key={p.id} p={p} addLabel={d.addLabel} soldOutLabel={d.soldOutLabel} />
            ))}
            <BlankTiles n={list.length} />
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 16 }}>
            <div className="empty-tiles" aria-hidden="true">
              {Array.from({ length: 6 }).map((_, i) => (
                <span key={i} />
              ))}
            </div>
            <T s={s} f="emptyText" as="p" className="lede" />
          </div>
        )}
      </div>
    </Section>
  );
}

/** Blank glazed tiles that complete the last row, at each breakpoint's column count. */
function BlankTiles({ n }: { n: number }) {
  const need = (cols: number) => (cols - (n % cols)) % cols;
  const f4 = need(4), f3 = need(3), f2 = need(2);
  const total = Math.max(f4, f3, f2);
  return (
    <>
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          aria-hidden="true"
          className={`blank-tile${i < f4 ? " b4" : ""}${i < f3 ? " b3" : ""}${i < f2 ? " b2" : ""}`}
        />
      ))}
    </>
  );
}

function Shipping() {
  const { payload } = useCms();
  const s = getSection(payload, '/', 'envios');
  const steps = s.data.widgets || [];
  return (
    <Section s={s} id="envios" className="drench" label="Envíos">
      <Frieze />
      <div className="band">
        <div className="wrap">
          <div className="band__head">
            <T s={s} f="heading" as="h2" />
            <T s={s} f="intro" as="p" className="lede" />
          </div>
          <div className="steps">
            {steps.map((w, i) => (
              <div className="step" key={w.id || i}>
                <span className="step__num" aria-hidden="true">
                  {w.badge || ['I', 'II', 'III', 'IV'][i]}
                </span>
                <h3>{w.title}</h3>
                <p>{w.body}</p>
              </div>
            ))}
          </div>
          <div className="drench__foot">
            {s.data.carriersLine ? (
              <span>
                <Truck />
                <T s={s} f="carriersLine" />
              </span>
            ) : null}
            {s.data.paymentLine ? (
              <span>
                <CreditCard />
                <T s={s} f="paymentLine" />
              </span>
            ) : null}
          </div>
        </div>
      </div>
      <Frieze />
    </Section>
  );
}

function Advice() {
  const { payload } = useCms();
  const s = getSection(payload, '/', 'asesoria');
  const d = s.data;
  const g = payload.global || {};
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [err, setErr] = useState('');

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setState('sending');
    setErr('');
    try {
      const res = await fetch(`${CMS_URL}/api/public/leads/${CMS_SLUG}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fd.get('fullName'),
          email: fd.get('email'),
          phone: fd.get('phone'),
          message: fd.get('message'),
          formName: 'Asesoría de suplementos',
          subject: 'Pregunta desde la tienda',
          sourcePage: window.location.href,
          payload: { goal: fd.get('goal') },
        }),
      });
      if (!res.ok) throw new Error();
      setState('done');
      e.currentTarget.reset();
    } catch {
      setState('error');
      setErr('No pudimos enviar tu pregunta. Revisa tu conexión o escríbenos por WhatsApp.');
    }
  }

  return (
    <Section s={s} id="asesoria" className="band grout-ground" label="Asesoría">
      <div className="wrap advice">
        <Frame className="advice__wa" tone="mustard">
          <T s={s} f="heading" as="h2" />
          <T s={s} f="body" as="p" className="lede" />
          {g.whatsappNumber ? (
            <a
              className="plaque"
              style={{ alignSelf: 'flex-start' }}
              href={waLink(g.whatsappNumber, g.whatsappPrefill || 'Hola')}
              target="_blank"
              rel="noopener noreferrer"
              onClick={trackWhatsApp}
            >
              <WhatsAppIcon />
              {d.whatsappCta || 'Escribir por WhatsApp'}
            </a>
          ) : null}
          {g.storeHours ? <p className="agate">{g.storeHours}</p> : null}
        </Frame>
        <Frame as="form" className="advice__form" onSubmit={submit} aria-label={d.formTitle || 'Formulario de asesoría'}>
          <T s={s} f="formTitle" as="h3" />
          <div className="field__row">
            <div className="field">
              <label htmlFor="a-name">Nombre</label>
              <input id="a-name" name="fullName" required autoComplete="name" />
            </div>
            <div className="field">
              <label htmlFor="a-phone">Celular</label>
              <input id="a-phone" name="phone" inputMode="tel" autoComplete="tel" />
            </div>
          </div>
          <div className="field">
            <label htmlFor="a-email">Correo</label>
            <input id="a-email" name="email" type="email" required autoComplete="email" />
          </div>
          <div className="field">
            <label htmlFor="a-goal">Objetivo</label>
            <select id="a-goal" name="goal" defaultValue="">
              <option value="">Aún no sé</option>
              {(payload.collectionDefinitions?.productos?.categories || []).map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="a-msg">Tu pregunta</label>
            <textarea id="a-msg" name="message" required placeholder="Entreno 4 veces por semana y duermo mal…" />
          </div>
          {state === 'done' ? <p className="form-msg" role="status">{d.successText}</p> : null}
          {state === 'error' ? <p className="form-msg form-msg--error" role="alert">{err}</p> : null}
          <button type="submit" className="plaque" disabled={state === 'sending'}>
            {state === 'sending' ? 'Enviando…' : d.submitText || 'Enviar'}
          </button>
        </Frame>
      </div>
    </Section>
  );
}

function Faq() {
  const { payload } = useCms();
  const s = getSection(payload, '/', 'preguntas');
  const items = s.data.widgets || [];
  return (
    <Section s={s} id="preguntas" className="band" label="Preguntas frecuentes">
      <div className="wrap" style={{ maxWidth: 980 }}>
        <div className="band__head" style={{ gridTemplateColumns: '1fr' }}>
          <T s={s} f="heading" as="h2" />
        </div>
        <div className="tiles faq">
          {items.map((w, i) => (
            <details key={w.id || i}>
              <summary>
                {w.title}
                <Plus aria-hidden="true" />
              </summary>
              <p>{w.body}</p>
            </details>
          ))}
        </div>
      </div>
    </Section>
  );
}

