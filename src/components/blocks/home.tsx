'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Award, BookOpen, Calendar, Check, Clock, CreditCard, Heart, Leaf, MapPin, Phone, Plus, ShieldCheck, Truck, Users, Wrench } from 'lucide-react';
import { getProducts, type Product } from '@latinovation/cms-client';
import {
  CmsAddItem,
  CmsImage,
  CmsItem,
  CmsItemText,
  CmsLink,
  CmsList,
  CmsRichText,
  CmsText,
  useCms,
  useCurrentSection,
  type CmsBlockProps,
} from '@latinovation/cms-client/react';
import { BlankTiles, Frame, Frieze } from '../Ornaments';
import { AddButton, Facts, Meta, Price, ProductTile } from '../ProductTile';
import { sized } from '../SmartImage';
import { BandHead, sendLead, toRoman, Wrap, type LeadState } from './common';

const HeroImg = sized('(max-width: 1100px) 100vw, 56vw');
const HalfImg = sized('(max-width: 900px) 100vw, 50vw');
const CatLeadImg = sized('(max-width: 760px) 100vw, 46vw');
const CatImg = sized('(max-width: 760px) 50vw, 23vw');

// ───────────── Portada: el muro de azulejos ─────────────

export function Hero({ data, section }: CmsBlockProps) {
  const { payload } = useCms();
  const featured = useMemo(() => (data.featuredProduct ? getProducts(payload).find((p) => p.slug === String(data.featuredProduct).trim()) : undefined), [payload, data.featuredProduct]);
  const variant = section.block === 'hero.centered' ? 'centered' : section.block === 'hero.fullImage' || section.block === 'hero.video' ? 'full' : 'split';
  const side = data.imageSide === 'left' ? 'left' : 'right';
  return (
    <Wrap className={`hero hero--${variant} hero--${side}`}>
      <Frieze className="frieze--thin" />
      <div className="wall">
        <Frame className="wall__cartouche" tone="mustard">
          <CmsText f="headline" as="h1" />
          <CmsText f="subheadline" as="p" className="lede" />
          <div className="wall__actions">
            <CmsLink f="primaryCta" className="plaque" />
            <CmsLink f="secondaryCta" className="plaque plaque--ghost" />
          </div>
          <CmsList
            f="highlights"
            as="ul"
            itemAs="li"
            className="wall__facts"
            renderItem={() => (
              <>
                <Check aria-hidden="true" />
                <CmsText f="text" />
              </>
            )}
          />
        </Frame>
        <div className="wall__photo tile-photo">
          <CmsImage f={section.block === 'hero.video' ? 'posterImage' : 'image'} as={HeroImg} priority />
          {featured ? (
            <CmsItem item={featured} className="wall__plate">
              <CmsText f="featuredLabel" className="wall__plate-label" />
              <Link href={`/producto/${featured.slug}`} className="wall__plate-name">
                <CmsItemText item={featured} f="title" />
              </Link>
              <Meta p={featured} />
              <Facts p={featured} className="card__facts agate" />
              <div className="wall__plate-buy">
                <Price p={featured} />
                <AddButton p={featured} className="icon-plaque" iconOnly />
              </div>
            </CmsItem>
          ) : null}
        </div>
      </div>
      <Frieze className="frieze--thin" />
    </Wrap>
  );
}

// ───────────── Categorías: un panel de 3 × 3 azulejos ─────────────

export function CategoryWall({ data }: CmsBlockProps) {
  const { payload } = useCms();
  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of getProducts(payload)) if (p.category) m.set(p.category.toLowerCase(), (m.get(p.category.toLowerCase()) || 0) + 1);
    return m;
  }, [payload]);
  const items: any[] = Array.isArray(data.items) ? data.items : [];
  const cells = items.length ? items.length + 3 : 0; // la primera ocupa 2 × 2
  return (
    <div className="band grout-ground">
      <Wrap>
        <BandHead />
        <Frame className="cats-frame" tone="mustard">
          <div className="tiles cats">
          <CmsList
            f="items"
            className="contents"
            itemClassName={(_, i) => `cat${i === 0 ? ' cat--lead' : ''}`}
            renderItem={(it: any, i) => (
              <>
                <span className="cat__photo">
                  <CmsImage f="image" as={i === 0 ? CatLeadImg : CatImg} />
                </span>
                <span className="cat__body">
                  <CmsText f="title" as="h3" className="cat__name" />
                  <CmsRichText f="body" className="cat__text" />
                  <span className="cat__foot">
                    <span className="agate">
                      {counts.get(String(it?.title || '').toLowerCase()) ?? 0} <CmsText f="/countLabel" />
                    </span>
                    <CmsLink f="link" className="cat__link" />
                    <ArrowRight aria-hidden="true" className="cat__arrow" />
                  </span>
                </span>
              </>
            )}
          />
          <BlankTiles n={cells} cols={[3, 3, 2]} />
          </div>
        </Frame>
      </Wrap>
    </div>
  );
}

// ───────────── Vitrina de productos ─────────────

export function ProductShelf({ data }: CmsBlockProps) {
  const { payload } = useCms();
  const all = useMemo(() => getProducts(payload), [payload]);
  const list = useMemo(() => {
    let l: Product[] = all;
    if (data.featuredOnly) l = l.filter((p) => p.isFeatured);
    if (data.category) l = l.filter((p) => p.category === data.category);
    const cols = Number(data.columns) || 4;
    return l.slice(0, Number(data.limit) || cols * 2);
  }, [all, data.featuredOnly, data.category, data.columns, data.limit]);
  return (
    <div className="band">
      <Wrap>
        <BandHead />
        <div className={`tiles catalog catalog--${Number(data.columns) || 4}`}>
          {list.map((p) => (
            <ProductTile key={p.id} p={p} />
          ))}
          <BlankTiles n={list.length} />
        </div>
        <div className="band__foot">
          <CmsAddItem collection="productos" label="Agregar producto" />
          <CmsLink f="moreLink" className="plaque plaque--ghost" />
        </div>
      </Wrap>
    </div>
  );
}

// ───────────── Historia: foto de azulejo + cartela ─────────────

export function Story({ data, index }: CmsBlockProps) {
  const side = data.imageSide === 'left' ? 'left' : 'right';
  return (
    <div className="band">
      <Wrap className={`story story--${side}`}>
        <div className="story__photo tile-photo">
          <CmsImage f="image" as={HalfImg} priority={index === 0} />
        </div>
        <Frame className="story__text">
          <CmsText f="heading" as={index === 0 ? 'h1' : 'h2'} />
          <CmsRichText f="body" className="prose" />
          <CmsLink f="cta" className="plaque" />
        </Frame>
      </Wrap>
    </div>
  );
}

// ───────────── Ventajas (la banda cobalto) ─────────────

const ICONS: Record<string, React.ComponentType<{ 'aria-hidden'?: boolean }>> = {
  check: Check,
  shield: ShieldCheck,
  clock: Clock,
  truck: Truck,
  heart: Heart,
  leaf: Leaf,
  'map-pin': MapPin,
  phone: Phone,
  users: Users,
  award: Award,
  wrench: Wrench,
  calendar: Calendar,
  'credit-card': CreditCard,
  book: BookOpen,
};

export function FeatureTiles({ data }: CmsBlockProps) {
  const drench = data.tone === 'primary' || data.tone === 'dark';
  const cols = Math.min(4, Math.max(2, Number(data.columns) || 3));
  const body = (
    <div className="band">
      <Wrap>
        <BandHead />
        <CmsList
          f="items"
          className={`features features--${cols}`}
          itemClassName="feature"
          renderItem={(it: any) => {
            const Icon = ICONS[String(it?.icon || '')];
            return (
              <>
                {Icon ? (
                  <span className="feature__icon">
                    <Icon aria-hidden />
                  </span>
                ) : null}
                <CmsText f="title" as="h3" />
                <CmsText f="body" as="p" />
                <CmsLink f="link" className="textlink" />
              </>
            );
          }}
        />
      </Wrap>
    </div>
  );
  if (!drench) return body;
  return (
    <div className="drench">
      <Frieze />
      {body}
      <Frieze />
    </div>
  );
}

export function Steps() {
  return (
    <div className="band grout-ground">
      <Wrap>
        <BandHead />
        <CmsList
          f="items"
          as="ol"
          itemAs="li"
          className="tiles steps"
          itemClassName="step"
          renderItem={(_, i) => (
            <>
              <span className="step__num" aria-hidden="true">
                {toRoman(i)}
              </span>
              <CmsText f="title" as="h3" />
              <CmsText f="body" as="p" />
            </>
          )}
        />
      </Wrap>
    </div>
  );
}

export function AlternatingRows() {
  return (
    <div className="band">
      <Wrap>
        <BandHead />
        <CmsList
          f="items"
          className="alt-rows"
          itemClassName={(_, i) => `story story--${i % 2 ? 'right' : 'left'}`}
          renderItem={() => (
            <>
              <div className="story__photo tile-photo">
                <CmsImage f="image" as={HalfImg} />
              </div>
              <Frame className="story__text">
                <CmsText f="title" as="h3" />
                <CmsRichText f="body" className="prose" />
                <CmsLink f="link" className="plaque plaque--ghost" />
              </Frame>
            </>
          )}
        />
      </Wrap>
    </div>
  );
}

// ───────────── Preguntas ─────────────

export function Faq() {
  return (
    <div className="band">
      <Wrap className="wrap--narrow">
        <BandHead />
        <CmsList
          f="items"
          className="tiles faq"
          itemAs="details"
          renderItem={() => (
            <>
              <summary>
                <CmsText f="question" />
                <Plus aria-hidden="true" />
              </summary>
              <CmsRichText f="answer" className="faq__answer prose" />
            </>
          )}
        />
      </Wrap>
    </div>
  );
}

// ───────────── Boletín ─────────────

export function Newsletter({ data }: CmsBlockProps) {
  const [state, setState] = useState<LeadState>('idle');
  const s = useCurrentSection();
  return (
    <div className="band grout-ground">
      <Wrap className="newsletter">
        <Frame className="newsletter__frame" tone="mustard">
          <div className="newsletter__copy">
            <CmsText f="heading" as="h2" />
            <CmsText f="body" as="p" className="lede" />
          </div>
          <form
            className="newsletter__form"
            onSubmit={async (e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const email = String(fd.get('email') || '');
              setState('sending');
              try {
                await sendLead({ fullName: email.split('@')[0] || email, email, formName: data.formName || 'Boletín', sourceSection: s?.key, website: fd.get('website') });
                setState('done');
              } catch {
                setState('error');
              }
            }}
          >
            <div className="field">
              <label htmlFor="nl-email">
                <CmsText f="emailLabel" />
              </label>
              <div className="newsletter__row">
                <input id="nl-email" name="email" type="email" required autoComplete="email" placeholder={data.placeholder || ''} />
                <button type="submit" className="plaque" disabled={state === 'sending'}>
                  <CmsText f="submitLabel" />
                </button>
              </div>
            </div>
            <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hp" aria-hidden="true" />
            <p className={`form-msg${state === 'done' ? '' : ' is-hidden'}`} role="status">
              <CmsText f="successMessage" />
            </p>
            {state === 'error' ? (
              <p className="form-msg form-msg--error" role="alert">
                {data.errorMessage || 'No pudimos registrar tu correo. Inténtalo de nuevo en un momento.'}
              </p>
            ) : null}
          </form>
        </Frame>
      </Wrap>
    </div>
  );
}

// ───────────── Llamado a la acción ─────────────

export function CtaBanner() {
  return (
    <div className="band">
      <Wrap>
        <Frame className="cta-banner" tone="mustard">
          <div>
            <CmsText f="headline" as="h2" />
            <CmsText f="body" as="p" className="lede" />
          </div>
          <div className="wall__actions">
            <CmsLink f="primaryCta" className="plaque" />
            <CmsLink f="secondaryCta" className="plaque plaque--ghost" />
          </div>
        </Frame>
      </Wrap>
    </div>
  );
}
