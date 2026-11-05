'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ExternalLink, Lock, Search } from 'lucide-react';
import { editAttrs, getProducts, mediaUrl } from '@latinovation/cms-client';
import { CmsGlobalText, CmsLink, CmsList, CmsText, useCms, useCurrentSection, type CmsBlockProps } from '@latinovation/cms-client/react';
import { useStore } from '../StoreProvider';
import { BlankTiles, Frame, WhatsAppIcon } from '../Ornaments';
import { ProductTile } from '../ProductTile';
import { trackWhatsApp, useWhatsApp } from '../Shell';
import { BandHead, sendLead, Wrap, type LeadState } from './common';
import { ShopRouteContext } from './catalog';
import { CMS_SLUG, CMS_URL } from '@/lib/site';
import { formatCop } from '@/lib/format';
import { label as statusLabel, settleWompi, trackOrder } from '@/lib/orders';
import { DEFAULT_FILTERS, runShopQuery } from '@/lib/shop';

// ───────────── Configuración pública de la tienda (métodos de pago) ─────────────

export interface StoreConfig {
  paymentMethods?: Record<string, { enabled?: boolean; publicKey?: string; instructions?: string; bankDetails?: string }>;
}
export const StoreConfigContext = createContext<StoreConfig | null>(null);

type Method = 'wompi' | 'transfer' | 'cod';
export function availableMethods(cfg: StoreConfig | null): Method[] {
  const pm = cfg?.paymentMethods || {};
  const out: Method[] = [];
  if (pm.wompi?.enabled !== false && pm.wompi?.publicKey) out.push('wompi');
  if (pm.transfer?.enabled) out.push('transfer');
  if (pm.cod?.enabled) out.push('cod');
  return out;
}

// ───────────── Contacto ─────────────

export function ContactForm({ data }: CmsBlockProps) {
  const s = useCurrentSection();
  const wa = useWhatsApp();
  const [state, setState] = useState<LeadState>('idle');
  const fields: any[] = Array.isArray(data.fields) ? data.fields : [];
  return (
    <div className="band">
      <Wrap className={`contact${data.showContactInfo === false ? ' contact--solo' : ''}`}>
        <div>
          <div className="page-head">
            <CmsText f="heading" as={s?.key === 'contacto' ? 'h1' : 'h2'} />
            <CmsText f="body" as="p" className="lede" />
          </div>
          <Frame
            as="form"
            className="form-frame"
            onSubmit={async (e: React.FormEvent<HTMLFormElement>) => {
              e.preventDefault();
              const form = e.currentTarget;
              const fd = new FormData(form);
              const answers: Record<string, string> = {};
              let fullName = '';
              let email = '';
              let phone = '';
              let message = '';
              for (const f of fields) {
                const v = String(fd.get(f.name) || '').trim();
                answers[f.label || f.name] = v;
                if (f.type === 'email' && !email) email = v;
                else if (f.type === 'tel' && !phone) phone = v;
                else if (f.type === 'textarea' && !message) message = v;
                else if (f.type === 'text' && !fullName) fullName = v;
              }
              setState('sending');
              try {
                await sendLead({ fullName, email, phone, message, formName: data.formName || 'Contacto', subject: answers.Tema || data.formName, payload: answers, sourceSection: s?.key, website: fd.get('website') });
                setState('done');
                form.reset();
              } catch {
                setState('error');
              }
            }}
          >
            <CmsList
              f="fields"
              className="form-grid"
              itemClassName={(it: any) => `field${it?.type === 'textarea' ? ' field--full' : ''}`}
              renderItem={(it: any, i) => {
                const id = `cf-${it?.name || i}`;
                const common = { id, name: it?.name || `campo${i}`, required: Boolean(it?.required), placeholder: it?.placeholder || undefined, ...editAttrs({ field: `fields.${i}.name`, type: 'text' }) };
                return (
                  <>
                    <label htmlFor={id}>
                      <CmsText f="label" />
                      {it?.required ? <span aria-hidden="true"> *</span> : null}
                    </label>
                    {it?.type === 'textarea' ? (
                      <textarea {...common} rows={5} />
                    ) : it?.type === 'select' ? (
                      <select {...common} defaultValue="">
                        <option value="" disabled>
                          —
                        </option>
                        {String(it?.options || '')
                          .split(/\s*[,|\n]\s*/)
                          .filter(Boolean)
                          .map((o) => (
                            <option key={o}>{o}</option>
                          ))}
                      </select>
                    ) : (
                      <input {...common} type={['email', 'tel', 'number', 'date'].includes(it?.type) ? it.type : 'text'} autoComplete={it?.type === 'email' ? 'email' : it?.type === 'tel' ? 'tel' : i === 0 ? 'name' : undefined} inputMode={it?.type === 'tel' ? 'tel' : undefined} />
                    )}
                  </>
                );
              }}
            />
            <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hp" aria-hidden="true" />
            <p className={`form-msg${state === 'done' ? '' : ' is-hidden'}`} role="status">
              <CmsText f="successMessage" />
            </p>
            {state === 'error' ? (
              <p className="form-msg form-msg--error" role="alert">
                <CmsText f="errorText" />
              </p>
            ) : null}
            <button type="submit" className="plaque" disabled={state === 'sending'}>
              <CmsText f="submitLabel" />
            </button>
          </Frame>
        </div>
        {data.showContactInfo !== false ? (
          <Frame as="aside" className="contact__info" tone="mustard">
            <CmsText f="contactHeading" as="h2" className="fieldset-title" />
            {wa ? (
              <a className="plaque" href={wa} target="_blank" rel="noopener noreferrer" onClick={trackWhatsApp}>
                <WhatsAppIcon />
                <CmsText f="whatsappLabel" />
              </a>
            ) : null}
            <dl className="spec">
              <CmsGlobalText f="phone" as="dd" />
              <CmsGlobalText f="email" as="dd" />
              <CmsGlobalText f="hours" as="dd" />
              <CmsGlobalText f="city" as="dd" />
            </dl>
          </Frame>
        ) : null}
      </Wrap>
    </div>
  );
}

// ───────────── Checkout ─────────────

const DEPARTMENTS = [
  'Valle del Cauca', 'Amazonas', 'Antioquia', 'Arauca', 'Atlántico', 'Bogotá D.C.', 'Bolívar', 'Boyacá', 'Caldas', 'Caquetá', 'Casanare', 'Cauca', 'Cesar', 'Chocó', 'Córdoba',
  'Cundinamarca', 'Guainía', 'Guaviare', 'Huila', 'La Guajira', 'Magdalena', 'Meta', 'Nariño', 'Norte de Santander', 'Putumayo', 'Quindío', 'Risaralda', 'San Andrés y Providencia',
  'Santander', 'Sucre', 'Tolima', 'Vaupés', 'Vichada',
];

export const LAST_ORDER_KEY = 'tusplatos.lastOrder';

export function Checkout({ data }: CmsBlockProps) {
  const { payload } = useCms();
  const cfg = useContext(StoreConfigContext);
  const methods = availableMethods(cfg);
  const { lines, subtotal, clear, notes, ready } = useStore();
  const [method, setMethod] = useState<Method | ''>('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const chosen = method || methods[0] || '';
  const free = payload.ecommerce?.freeShippingThreshold || 0;
  const flat = payload.ecommerce?.flatShippingRate || 0;
  const shipping = lines.length === 0 ? 0 : free > 0 && subtotal >= free ? 0 : flat;
  const total = subtotal + shipping;
  const count = lines.reduce((a, l) => a + l.quantity, 0);
  const empty = ready && lines.length === 0;

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!lines.length || !chosen) return;
    const fd = new FormData(e.currentTarget);
    setSending(true);
    setError('');
    try {
      const back = `${window.location.origin}/pedido`;
      const res = await fetch(`${CMS_URL}/api/ecommerce/public/${CMS_SLUG}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: fd.get('name'),
          customerEmail: fd.get('email'),
          customerPhone: fd.get('phone'),
          documentType: fd.get('docType'),
          documentId: fd.get('docId'),
          shippingAddress: { address: fd.get('address'), city: fd.get('city'), department: fd.get('department'), country: 'Colombia', notes: fd.get('deliveryNotes') },
          // El servidor recalcula precios y stock con el catálogo del CMS; aquí solo van referencias y cantidades.
          items: lines.map((l) => ({ productId: l.productId, variantLabel: l.variantLabel, quantity: l.quantity, title: l.title, unitPrice: l.unitPrice, imageUrl: mediaUrl(l.imageUrl || '', CMS_URL) })),
          paymentProvider: chosen === 'wompi' ? 'WOMPI' : chosen,
          redirectUrl: back,
          notes: [notes, fd.get('deliveryNotes')].filter(Boolean).join(' · '),
        }),
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof out?.message === 'string' ? out.message : '');
      const orderNumber = out.orderNumber || out.order?.orderNumber || '';
      try {
        sessionStorage.setItem(LAST_ORDER_KEY, JSON.stringify({ orderNumber, total: out.totalAmount ?? total, method: chosen, instructions: out.paymentSession?.instructions || '' }));
      } catch {}
      const url = out.checkoutUrl || out.paymentSession?.checkoutUrl;
      const backWithOrder = `${back}?orden=${encodeURIComponent(orderNumber)}`;
      clear();
      if (url) {
        const u = new URL(url);
        u.searchParams.set('redirect-url', backWithOrder);
        window.location.href = u.toString();
      } else window.location.href = backWithOrder;
    } catch (err: any) {
      setSending(false);
      setError(err?.message ? `${err.message}. ` : '');
    }
  }

  return (
    <Wrap>
      <div className="page-head">
        <CmsText f="heading" as="h1" />
      </div>
      <div className="checkout">
        <Frame as="form" className="checkout__form" onSubmit={submit} aria-describedby="co-security">
          <fieldset disabled={empty || sending}>
            <CmsText f="contactHeading" as="legend" className="fieldset-title" />
            <div className="field">
              <label htmlFor="c-name">
                <CmsText f="nameLabel" />
              </label>
              <input id="c-name" name="name" required autoComplete="name" />
            </div>
            <div className="field__row">
              <div className="field">
                <label htmlFor="c-email">
                  <CmsText f="emailLabel" />
                </label>
                <input id="c-email" name="email" type="email" required autoComplete="email" />
              </div>
              <div className="field">
                <label htmlFor="c-phone">
                  <CmsText f="phoneLabel" />
                </label>
                <input id="c-phone" name="phone" required inputMode="tel" autoComplete="tel" pattern="[0-9 +]{10,15}" title="Celular de 10 dígitos" />
              </div>
            </div>
            <div className="field__row">
              <div className="field">
                <label htmlFor="c-doctype">
                  <CmsText f="docTypeLabel" />
                </label>
                <select id="c-doctype" name="docType" defaultValue="CC">
                  <option value="CC">Cédula de ciudadanía</option>
                  <option value="CE">Cédula de extranjería</option>
                  <option value="NIT">NIT</option>
                  <option value="PP">Pasaporte</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="c-docid">
                  <CmsText f="docLabel" />
                </label>
                <input id="c-docid" name="docId" required inputMode="numeric" autoComplete="off" />
              </div>
            </div>
          </fieldset>
          <fieldset disabled={empty || sending}>
            <CmsText f="shippingHeading" as="legend" className="fieldset-title" />
            <div className="field">
              <label htmlFor="c-address">
                <CmsText f="addressLabel" />
              </label>
              <input id="c-address" name="address" required autoComplete="street-address" />
            </div>
            <div className="field__row">
              <div className="field">
                <label htmlFor="c-city">
                  <CmsText f="cityLabel" />
                </label>
                <input id="c-city" name="city" required defaultValue={String(payload.global?.city || '')} autoComplete="address-level2" />
              </div>
              <div className="field">
                <label htmlFor="c-dep">
                  <CmsText f="departmentLabel" />
                </label>
                <select id="c-dep" name="department" defaultValue="Valle del Cauca">
                  {DEPARTMENTS.map((dp) => (
                    <option key={dp}>{dp}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="field">
              <label htmlFor="c-notes">
                <CmsText f="notesLabel" />
              </label>
              <textarea id="c-notes" name="deliveryNotes" rows={2} />
            </div>
          </fieldset>
          <fieldset disabled={empty || sending}>
            <CmsText f="paymentHeading" as="legend" className="fieldset-title" />
            <div className="methods" role="radiogroup">
              {methods.map((m) => {
                const k = m === 'wompi' ? 'online' : m;
                return (
                  <label key={m} className={`method${chosen === m ? ' is-on' : ''}`}>
                    <input type="radio" name="method" value={m} checked={chosen === m} onChange={() => setMethod(m)} />
                    <span className="method__box" aria-hidden="true" />
                    <span className="method__text">
                      <CmsText f={`${k}Label`} className="method__name" />
                      <CmsText f={`${k}Note`} className="agate" />
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>
          {error ? (
            <p className="form-msg form-msg--error" role="alert">
              {error}
              <CmsText f="errorText" />
            </p>
          ) : null}
          <button type="submit" className="plaque plaque--block" disabled={empty || sending || !chosen}>
            <Lock aria-hidden="true" />
            {sending ? <CmsText f="sendingLabel" /> : <CmsText f="payButton" />}
            {!sending && lines.length ? <span> · {formatCop(total)}</span> : null}
          </button>
          <CmsText f="securityNote" as="p" className="agate" id="co-security" />
        </Frame>

        <Frame as="aside" className="checkout__summary" aria-label={data.summaryHeading}>
          <CmsText f="summaryHeading" as="h2" className="fieldset-title" />
          {empty || !ready ? (
            <div className="checkout__empty">
              <CmsText f="emptyCart" as="p" />
              <CmsLink f="emptyCta" className="plaque plaque--ghost plaque--small" />
            </div>
          ) : (
            <ul className="lines">
              {lines.map((l) => (
                <li className="line line--small" key={l.key}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="line__img" src={mediaUrl(l.imageUrl || '', CMS_URL)} alt="" width={60} height={60} />
                  <div className="line__main">
                    <span className="line__title">{l.title}</span>
                    <p className="agate">
                      {l.quantity} × {formatCop(l.unitPrice)}
                      {l.variantLabel ? ` · ${l.variantLabel}` : ''}
                    </p>
                  </div>
                  <span className="price">{formatCop(l.unitPrice * l.quantity)}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="row-between">
            <span>
              <CmsText f="subtotalLabel" /> ({count})
            </span>
            <span>{formatCop(subtotal)}</span>
          </div>
          <div className="row-between">
            <CmsText f="shippingLabel" />
            <span>{shipping === 0 && lines.length ? <CmsText f="freeLabel" /> : formatCop(shipping)}</span>
          </div>
          <div className="row-between row-between--total">
            <strong>
              <CmsText f="totalLabel" />
            </strong>
            <span className="price price--big">{formatCop(total)}</span>
          </div>
          <CmsText f="taxNote" as="p" className="agate" />
        </Frame>
      </div>
    </Wrap>
  );
}

// ───────────── Confirmación (regreso de la pasarela) ─────────────

export function Confirmation({ data }: CmsBlockProps) {
  const [orderNumber, setOrderNumber] = useState('');
  const [pay, setPay] = useState<{ status: string } | null>(null);
  const [order, setOrder] = useState<any>(null);
  const [instructions, setInstructions] = useState('');

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    let num = q.get('orden') || '';
    try {
      const last = JSON.parse(sessionStorage.getItem(LAST_ORDER_KEY) || '{}');
      if (!num) num = last.orderNumber || '';
      if (last.orderNumber === num && last.instructions) setInstructions(last.instructions);
    } catch {}
    setOrderNumber(num);
    const txId = q.get('id');
    (async () => {
      if (txId) setPay(await settleWompi(txId, q.get('env'), num));
      if (num) trackOrder(num).then(setOrder).catch(() => {});
    })();
  }, []);

  const bad = pay && ['DECLINED', 'VOIDED', 'ERROR'].includes(pay.status);
  const payKey = !pay ? '' : pay.status === 'APPROVED' ? 'approvedText' : bad ? 'declinedText' : 'pendingText';

  return (
    <Wrap>
      <div className="page-head">
        <CmsText f="heading" as="h1" />
      </div>
      <Frame className="status-tile" tone="mustard">
        {payKey ? (
          <span className={`status${bad ? ' status--bad' : ''}`}>
            <CmsText f={payKey} />
          </span>
        ) : null}
        <div>
          <CmsText f="orderLabel" as="p" className="agate" />
          <p className="order-code">{orderNumber || '—'}</p>
        </div>
        <CmsText f="body" as="p" className="lede" />
        {instructions ? <p className="form-msg">{instructions}</p> : null}
        <dl className="spec">
          <dt>
            <CmsText f="statusLabel" />
          </dt>
          <dd>{order ? statusLabel(order.status) : '—'}</dd>
          <dt>
            <CmsText f="totalLabel" />
          </dt>
          <dd>{order ? formatCop(order.totalAmount) : '—'}</dd>
          <dt>
            <CmsText f="destinationLabel" />
          </dt>
          <dd>{order?.destinationCity || order?.shippingAddress?.city || '—'}</dd>
        </dl>
        <div className="wall__actions">
          <CmsLink f="trackCta" className="plaque" />
          <CmsLink f="backCta" className="plaque plaque--ghost" />
        </div>
      </Frame>
    </Wrap>
  );
}

// ───────────── Rastreo ─────────────

export function Tracking({ data }: CmsBlockProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [order, setOrder] = useState<any>(null);

  async function lookup(c: string) {
    if (!c.trim()) return;
    setLoading(true);
    setError(false);
    setOrder(null);
    try {
      setOrder(await trackOrder(c));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let c = new URLSearchParams(window.location.search).get('codigo') || '';
    if (!c) {
      try {
        c = JSON.parse(sessionStorage.getItem(LAST_ORDER_KEY) || '{}').orderNumber || '';
      } catch {}
    }
    if (c) {
      setCode(c);
      lookup(c);
    }
  }, []);

  const events: any[] = Array.isArray(order?.trackingEvents) ? [...order.trackingEvents].reverse() : [];

  return (
    <Wrap className="track">
      <div className="page-head band__head">
        <CmsText f="heading" as="h1" />
        <CmsText f="intro" as="p" className="lede" />
      </div>
      <div className="track__grid">
        <Frame
          as="form"
          className="form-frame"
          onSubmit={(e: React.FormEvent) => {
            e.preventDefault();
            lookup(code);
          }}
        >
          <div className="field">
            <label htmlFor="t-code">
              <CmsText f="inputLabel" />
            </label>
            <input id="t-code" value={code} onChange={(e) => setCode(e.target.value)} required placeholder="ORD-2026-…" autoCapitalize="characters" />
          </div>
          <button type="submit" className="plaque" disabled={loading}>
            <Search aria-hidden="true" />
            <CmsText f="submitText" />
          </button>
          <p className={`form-msg form-msg--error${error ? '' : ' is-hidden'}`} role="alert">
            <CmsText f="notFound" />
          </p>
        </Frame>
        <Frame className="status-tile" tone="mustard" aria-live="polite">
          <span className="status">{order ? statusLabel(order.status) : '—'}</span>
          <p className="order-code">{order?.orderNumber || '—'}</p>
          <dl className="spec">
            <dt>
              <CmsText f="paymentLabel" />
            </dt>
            <dd>{order ? statusLabel(order.paymentStatus) : '—'}</dd>
            <dt>
              <CmsText f="totalLabel" />
            </dt>
            <dd>{order ? formatCop(order.totalAmount) : '—'}</dd>
            <dt>
              <CmsText f="destinationLabel" />
            </dt>
            <dd>{order?.destinationCity || '—'}</dd>
            <dt>
              <CmsText f="carrierLabel" />
            </dt>
            <dd>{order?.carrierName || '—'}</dd>
            <dt>
              <CmsText f="trackingLabel" />
            </dt>
            <dd>
              {order?.trackingNumber ? (
                order.trackingUrl ? (
                  <a className="textlink" href={order.trackingUrl} target="_blank" rel="noopener noreferrer">
                    {order.trackingNumber} <ExternalLink size={14} aria-hidden="true" />
                  </a>
                ) : (
                  order.trackingNumber
                )
              ) : (
                <CmsText f="pendingTracking" />
              )}
            </dd>
          </dl>
          {events.length ? (
            <ol className="tiles timeline">
              {events.map((ev, i) => (
                <li key={ev.id || i}>
                  <strong>{ev.title || statusLabel(ev.status)}</strong>
                  <span className="agate">
                    {ev.timestamp ? new Date(ev.timestamp).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' }) : ''}
                    {ev.location ? ` · ${ev.location}` : ''}
                  </span>
                </li>
              ))}
            </ol>
          ) : null}
        </Frame>
      </div>
    </Wrap>
  );
}

// ───────────── Favoritos y vistos recientemente ─────────────

export function Favorites() {
  const { payload } = useCms();
  const { favorites, recent, ready } = useStore();
  const all = useMemo(() => getProducts(payload), [payload]);
  const favs = ready ? favorites.map((s) => all.find((p) => p.slug === s)).filter(Boolean) : [];
  const seen = ready ? recent.filter((s) => !favorites.includes(s)).map((s) => all.find((p) => p.slug === s)).filter(Boolean).slice(0, 4) : [];
  return (
    <Wrap>
      <div className="page-head band__head">
        <CmsText f="heading" as="h1" />
        <CmsText f="intro" as="p" className="lede" />
      </div>
      {favs.length ? (
        <div className="tiles catalog">
          {favs.map((p) => (
            <ProductTile key={p!.id} p={p!} />
          ))}
          <BlankTiles n={favs.length} />
        </div>
      ) : (
        <div className="empty">
          <div className="empty-tiles" aria-hidden="true">
            {Array.from({ length: 6 }).map((_, i) => (
              <span key={i} />
            ))}
          </div>
          <CmsText f="emptyText" as="p" className="lede" />
          <CmsLink f="cta" className="plaque" />
        </div>
      )}
      {seen.length ? (
        <div className="band band--tight">
          <div className="band__head">
            <CmsText f="recentHeading" as="h2" />
          </div>
          <div className="tiles catalog">
            {seen.map((p) => (
              <ProductTile key={p!.id} p={p!} />
            ))}
            <BlankTiles n={seen.length} />
          </div>
        </div>
      ) : null}
    </Wrap>
  );
}

// ───────────── Búsqueda ─────────────

export function SearchPage({ data }: CmsBlockProps) {
  const { payload } = useCms();
  const route = useContext(ShopRouteContext);
  const initial = Array.isArray(route.params.q) ? route.params.q[0] : route.params.q || '';
  const [q, setQ] = useState(initial);
  useEffect(() => {
    const url = `${window.location.pathname}${q ? `?q=${encodeURIComponent(q)}` : ''}`;
    window.history.replaceState(window.history.state, '', url);
  }, [q]);
  const res = useMemo(() => (q.trim() ? runShopQuery(payload, DEFAULT_FILTERS, { filters: {}, search: q.trim(), sort: 'relevance', view: 'grid', limit: 48 }) : null), [payload, q]);
  return (
    <Wrap>
      <div className="page-head band__head">
        <CmsText f="heading" as="h1" />
        <CmsText f="intro" as="p" className="lede" />
      </div>
      <form className="search search--big" role="search" onSubmit={(e) => e.preventDefault()}>
        <label htmlFor="search-q" className="sr-only">
          {data.heading}
        </label>
        <Search className="search__icon" aria-hidden="true" />
        <input id="search-q" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={data.placeholder || ''} autoFocus={!initial} />
      </form>
      <div className="suggest">
        <CmsText f="suggestionsHeading" className="agate" />
        <CmsList
          f="suggestions"
          as="ul"
          itemAs="li"
          className="chips chips--plain"
          renderItem={(it: any) => (
            <button type="button" className="chip" onClick={() => setQ(String(it?.text || ''))}>
              <CmsText f="text" />
            </button>
          )}
        />
      </div>
      {res ? (
        <>
          <p className="shop__count" aria-live="polite">
            <strong>{res.total}</strong> <CmsText f="resultsLabel" />
          </p>
          {res.items.length ? (
            <div className="tiles catalog">
              {res.items.map((p) => (
                <ProductTile key={p.id} p={p} />
              ))}
              <BlankTiles n={res.items.length} />
            </div>
          ) : (
            <CmsText f="emptyText" as="p" className="lede empty" />
          )}
        </>
      ) : null}
    </Wrap>
  );
}
