'use client';

import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ExternalLink, Lock, RefreshCw, RotateCcw, Search, ShoppingBag, UserRound } from 'lucide-react';
import { editAttrs, getProducts, mediaUrl } from '@latinovation/cms-client';
import { CmsGlobalText, CmsLink, CmsList, CmsText, useCms, useCurrentSection, type CmsBlockProps } from '@latinovation/cms-client/react';
import { useStore } from '../StoreProvider';
import { useAccount } from '../AccountProvider';
import { BlankTiles, Frame, WhatsAppIcon } from '../Ornaments';
import { ProductTile } from '../ProductTile';
import { trackWhatsApp, useWhatsApp } from '../Shell';
import { sendLead, Wrap, type LeadState } from './common';
import { Check, Errors, Msg, PasswordInput, useReveal } from './forms';
import { PolicyLink } from './account';
import { ShopRouteContext } from './catalog';
import { CMS_URL } from '@/lib/site';
import { fill, formatCop } from '@/lib/format';
import { shop, type CustomerAddress } from '@/lib/account';
import { DEPARTMENTS, DOC_TYPES } from '@/lib/colombia';
import { isPaymentFailedError, label as statusLabel, retryPaymentAndGo, settleWompi, trackOrder } from '@/lib/orders';
import { LAST_ORDER_KEY, readCartSnapshot, readLastOrder, writeCartSnapshot, writeLastOrder, type CartSnapshot, type LastOrder } from '@/lib/last-order';
import type { StoreConfig } from '@/lib/store-config';
import { DEFAULT_FILTERS, runShopQuery } from '@/lib/shop';

// ───────────── Configuración pública de la tienda (métodos de pago) ─────────────

export type { StoreConfig };
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
                await sendLead({
                  fullName,
                  email,
                  phone,
                  message,
                  formName: data.formName || 'Contacto',
                  subject: answers.Tema || data.formName,
                  payload: answers,
                  sourceSection: s?.key,
                  website: fd.get('website'),
                });
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
                const common = {
                  id,
                  name: it?.name || `campo${i}`,
                  required: Boolean(it?.required),
                  placeholder: it?.placeholder || undefined,
                  ...editAttrs({ field: `fields.${i}.name`, type: 'text' }),
                };
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
                      <input
                        {...common}
                        type={['email', 'tel', 'number', 'date'].includes(it?.type) ? it.type : 'text'}
                        autoComplete={it?.type === 'email' ? 'email' : it?.type === 'tel' ? 'tel' : i === 0 ? 'name' : undefined}
                        inputMode={it?.type === 'tel' ? 'tel' : undefined}
                      />
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

export { LAST_ORDER_KEY };

const addressLine = (a: CustomerAddress) => [a.address, [a.city, a.department].filter(Boolean).join(', ')].filter(Boolean).join(' · ');

export function Checkout({ data }: CmsBlockProps) {
  const { payload } = useCms();
  const cfg = useContext(StoreConfigContext);
  const methods = availableMethods(cfg);
  const { lines, subtotal, clear, notes, ready } = useStore();
  const { enabled: accounts, customer, ready: sessionReady } = useAccount();
  const reveal = useReveal();
  const [method, setMethod] = useState<Method | ''>('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [failed, setFailed] = useState(false);
  const saved = customer?.addresses || [];
  const [addrId, setAddrId] = useState('');
  // Con sesión: la dirección principal queda elegida (o la primera); "Usar otra dirección" abre el formulario.
  useEffect(() => {
    if (!customer) return setAddrId('');
    const list = customer.addresses || [];
    setAddrId((cur) => (cur && (cur === 'other' || list.some((a) => a.id === cur)) ? cur : (list.find((a) => a.isDefault) || list[0])?.id || 'other'));
  }, [customer]);
  const usingSaved = Boolean(customer && saved.length && addrId && addrId !== 'other');
  const chosenAddress = usingSaved ? saved.find((a) => a.id === addrId) : undefined;

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
    setFailed(false);
    try {
      const back = `${window.location.origin}/pedido`;
      const a = chosenAddress;
      const shippingAddress = a
        ? { address: a.address, city: a.city, department: a.department, country: a.country || 'Colombia', notes: a.notes, recipientName: a.recipientName, phone: a.phone, label: a.label }
        : { address: fd.get('address'), city: fd.get('city'), department: fd.get('department'), country: 'Colombia', notes: fd.get('deliveryNotes') };
      const out = await shop.checkout({
        customerName: fd.get('name'),
        customerEmail: fd.get('email'),
        customerPhone: fd.get('phone'),
        documentType: fd.get('docType'),
        documentId: fd.get('docId'),
        shippingAddress,
        // Con sesión, la dirección nueva puede quedar en la cuenta (el servidor no la duplica).
        ...(customer && !a ? { saveAddress: fd.get('saveAddress') === 'on' } : {}),
        // El servidor recalcula precios y stock con el catálogo del CMS; aquí solo van referencias y cantidades.
        items: lines.map((l) => ({
          productId: l.productId,
          variantLabel: l.variantLabel,
          quantity: l.quantity,
          title: l.title,
          unitPrice: l.unitPrice,
          imageUrl: mediaUrl(l.imageUrl || '', CMS_URL),
        })),
        paymentProvider: chosen === 'wompi' ? 'WOMPI' : chosen,
        redirectUrl: back,
        notes: [notes, a ? a.notes : fd.get('deliveryNotes')].filter(Boolean).join(' · '),
      });
      const orderNumber = out.orderNumber || out.order?.orderNumber || '';
      writeLastOrder({
        orderNumber,
        total: out.totalAmount ?? total,
        method: chosen,
        instructions: out.paymentSession?.instructions || '',
        email: String(fd.get('email') || ''),
        name: String(fd.get('name') || ''),
        phone: String(fd.get('phone') || ''),
        claimToken: out.claimToken || undefined,
      });
      // El carrito se vacía antes de la pasarela; esta copia permite recuperarlo si el pago no pasa.
      writeCartSnapshot({ orderNumber, lines, notes });
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
      setFailed(true);
      setError(err?.message ? `${err.message}. ` : '');
    }
  }

  const c = customer;
  return (
    <Wrap>
      <div className="page-head">
        <CmsText f="heading" as="h1" />
      </div>
      <div className="checkout">
        <Frame as="form" className="checkout__form" onSubmit={submit} aria-describedby="co-security" key={c?.id || 'guest'}>
          <p className="checkout__account" hidden={reveal(accounts && sessionReady && !c)}>
            <UserRound aria-hidden="true" />
            <CmsLink f="accountPrompt" className="textlink" />
          </p>
          <fieldset disabled={empty || sending}>
            <CmsText f="contactHeading" as="legend" className="fieldset-title" />
            <div className="field">
              <label htmlFor="c-name">
                <CmsText f="nameLabel" />
              </label>
              <input id="c-name" name="name" required autoComplete="name" defaultValue={c?.name || ''} />
            </div>
            <div className="field__row">
              <div className="field">
                <label htmlFor="c-email">
                  <CmsText f="emailLabel" />
                </label>
                <input id="c-email" name="email" type="email" required autoComplete="email" defaultValue={c?.email || ''} />
              </div>
              <div className="field">
                <label htmlFor="c-phone">
                  <CmsText f="phoneLabel" />
                </label>
                <input id="c-phone" name="phone" required inputMode="tel" autoComplete="tel" pattern="[0-9 +]{10,15}" defaultValue={c?.phone || ''} />
              </div>
            </div>
            <div className="field__row">
              <div className="field">
                <label htmlFor="c-doctype">
                  <CmsText f="docTypeLabel" />
                </label>
                <select id="c-doctype" name="docType" defaultValue={c?.documentType || 'CC'}>
                  {DOC_TYPES.map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="c-docid">
                  <CmsText f="docLabel" />
                </label>
                <input id="c-docid" name="docId" required inputMode="numeric" autoComplete="off" defaultValue={c?.documentId || ''} />
              </div>
            </div>
          </fieldset>
          <fieldset disabled={empty || sending}>
            <CmsText f="shippingHeading" as="legend" className="fieldset-title" />
            <div className="saved-addresses" hidden={reveal(Boolean(c && saved.length))}>
              <CmsText f="savedAddressesLabel" as="p" className="agate" id="co-saved" />
              <div className="methods" role="radiogroup" aria-labelledby="co-saved">
                {saved.map((a) => (
                  <label key={a.id} className={`method${addrId === a.id ? ' is-on' : ''}`}>
                    <input type="radio" name="savedAddress" value={a.id} checked={addrId === a.id} onChange={() => setAddrId(a.id)} />
                    <span className="method__box" aria-hidden="true" />
                    <span className="method__text">
                      <span className="method__name">{a.label || a.recipientName || a.address}</span>
                      <span className="agate">{addressLine(a)}</span>
                    </span>
                  </label>
                ))}
                <label className={`method${addrId === 'other' ? ' is-on' : ''}`}>
                  <input type="radio" name="savedAddress" value="other" checked={addrId === 'other'} onChange={() => setAddrId('other')} />
                  <span className="method__box" aria-hidden="true" />
                  <span className="method__text">
                    <CmsText f="otherAddressLabel" className="method__name" />
                  </span>
                </label>
              </div>
            </div>
            {/* Con una dirección guardada elegida, el formulario se oculta y se desactiva (no exige campos). */}
            <div className="contents" hidden={usingSaved}>
              <fieldset className="contents" disabled={usingSaved}>
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
                <div hidden={reveal(Boolean(c))}>
                  <Check name="saveAddress" id="c-save" defaultChecked>
                    <CmsText f="saveAddressLabel" />
                  </Check>
                </div>
              </fieldset>
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
          <p className="form-msg form-msg--error" role="alert" hidden={reveal(failed)}>
            {error}
            <CmsText f="errorText" />
          </p>
          <button type="submit" className="plaque plaque--block" disabled={empty || sending || !chosen}>
            <Lock aria-hidden="true" />
            <CmsText f="sendingLabel" hidden={!sending} />
            <CmsText f="payButton" hidden={sending} />
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
                  {l.imageUrl ? <img className="line__img" src={mediaUrl(l.imageUrl, CMS_URL)} alt="" width={60} height={60} /> : <span className="line__img" aria-hidden="true" />}
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

type View = 'pending' | 'approved' | 'placed' | 'failed';

export function Confirmation({ data }: CmsBlockProps) {
  const reveal = useReveal();
  const { restore, setCartOpen, clear } = useStore();
  const { enabled: accounts, customer, ready: sessionReady, register } = useAccount();
  const [orderNumber, setOrderNumber] = useState('');
  const [view, setView] = useState<View>('pending');
  const [order, setOrder] = useState<any>(null);
  const [canRetry, setCanRetry] = useState(false);
  const [last, setLast] = useState<LastOrder | null>(null);
  const [snapshot, setSnapshot] = useState<CartSnapshot | null>(null);
  const [checking, setChecking] = useState(true);
  const [tick, setTick] = useState(0);
  const [retryBusy, setRetryBusy] = useState(false);
  const [retryErr, setRetryErr] = useState('');
  const [recovered, setRecovered] = useState(false);
  const [claim, setClaim] = useState<'idle' | 'busy' | 'done' | 'error'>('idle');
  const params = useRef<{ txId: string | null; env: string | null }>({ txId: null, env: null });

  // Lee el pedido y su pago: con transacción de la pasarela, confirm-order; sin ella, el rastreo público.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const lo = readLastOrder();
    const num = q.get('orden') || lo?.orderNumber || '';
    params.current = { txId: q.get('id'), env: q.get('env') };
    setOrderNumber(num);
    setLast(lo && lo.orderNumber === num ? lo : null);
    const snap = readCartSnapshot();
    setSnapshot(snap && snap.orderNumber === num && snap.lines?.length ? snap : null);
  }, []);

  useEffect(() => {
    if (!orderNumber && !params.current.txId) {
      setView('placed');
      setChecking(false);
      return;
    }
    let alive = true;
    const offline = Boolean(last?.method && last.method !== 'wompi');
    // Transferencia o pago asistido: no hay pago en línea que esperar, se muestra el pedido recibido de una vez.
    if (offline && !params.current.txId) setView('placed');
    (async () => {
      setChecking(true);
      const { txId, env } = params.current;
      let summary: any = null;
      if (txId) {
        const r = await settleWompi(txId, env, orderNumber);
        if (!alive) return;
        summary = r.order;
        setCanRetry(r.canRetry);
        setView(r.state === 'approved' ? 'approved' : r.state === 'failed' ? 'failed' : 'pending');
        if (r.state === 'failed') {
          if (summary) setOrder(summary);
          setChecking(false);
          return;
        }
      }
      if (orderNumber) {
        try {
          const t = await trackOrder(orderNumber);
          if (!alive) return;
          summary = { ...t, ...(summary || {}) };
          if (!txId) {
            const ps = String(t?.paymentStatus || '').toUpperCase();
            setView(ps === 'PAID' ? 'approved' : ps === 'FAILED' ? 'failed' : offline ? 'placed' : 'pending');
            setCanRetry(ps === 'FAILED' || (ps === 'PENDING' && !offline));
          }
        } catch (e) {
          if (!alive) return;
          if (isPaymentFailedError(e)) {
            setView('failed');
            setCanRetry(e.data?.canRetry !== false);
          } else if (!txId) setView(offline ? 'placed' : 'pending');
        }
      }
      if (summary) setOrder(summary);
      setChecking(false);
    })();
    return () => {
      alive = false;
    };
  }, [orderNumber, last, tick]);

  // Pagado: la copia del carrito sobra. Si el comprador lo había recuperado y luego reintentó este mismo pedido, se vacía.
  useEffect(() => {
    if (view !== 'approved' || !orderNumber) return;
    const snap = readCartSnapshot();
    if (snap?.orderNumber !== orderNumber) return;
    if (snap.recovered) clear();
    writeCartSnapshot(null);
  }, [view, orderNumber, clear]);

  // Pago en verificación (p. ej. PSE): se vuelve a consultar unas veces sola.
  useEffect(() => {
    if (view !== 'pending' || checking || !params.current.txId || tick >= 6) return;
    const t = setTimeout(() => setTick((n) => n + 1), 5000);
    return () => clearTimeout(t);
  }, [view, checking, tick]);

  const email = customer?.email || last?.email || '';
  const items: any[] = Array.isArray(order?.items) ? order.items : [];
  const total = order?.totalAmount ?? last?.total;
  const wa = useWhatsApp(fill(data.helpMessage, { orden: orderNumber }));
  const claimable = accounts && sessionReady && !customer && Boolean(last?.claimToken && last?.email) && (view === 'approved' || view === 'placed' || view === 'pending');
  const success = view === 'approved' || view === 'placed';
  const retryable = canRetry && (view === 'failed' || (view === 'pending' && !params.current.txId));

  async function retry(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setRetryBusy(true);
    setRetryErr('');
    try {
      await retryPaymentAndGo(orderNumber, String(fd.get('email') || email).trim());
    } catch (ex: any) {
      setRetryBusy(false);
      const closed = ex?.code === 'RETRY_LIMIT' || ex?.code === 'RETRY_NOT_ALLOWED';
      setRetryErr(ex?.code === 'OUT_OF_STOCK' ? 'outOfStockText' : closed ? 'retryLimitText' : 'retryErrorText');
    }
  }

  return (
    <Wrap>
      <div className="page-head">
        <CmsText f="heading" as="h1" hidden={reveal(success)} />
        <CmsText f="pendingHeading" as="h1" hidden={reveal(view === 'pending')} />
        <CmsText f="declinedHeading" as="h1" hidden={reveal(view === 'failed')} />
      </div>
      <div className={`order-result${claimable || claim === 'done' ? ' order-result--claim' : ''}`}>
        <Frame className="status-tile" tone="mustard" aria-live="polite" aria-busy={checking || undefined}>
          <span className="status" hidden={reveal(view === 'approved')}>
            <CmsText f="approvedText" />
          </span>
          <span className="status status--wait" hidden={reveal(view === 'pending')}>
            <CmsText f="pendingText" />
          </span>
          <span className="status status--bad" hidden={reveal(view === 'failed')}>
            <CmsText f="declinedText" />
          </span>
          <div>
            <CmsText f="orderLabel" as="p" className="agate" />
            <p className="order-code">{orderNumber || '—'}</p>
          </div>
          <CmsText f="body" as="p" className="lede" hidden={reveal(success)} />
          <CmsText f="pendingBody" as="p" className="lede" hidden={reveal(view === 'pending')} />
          <CmsText f="declinedBody" as="p" className="lede" hidden={reveal(view === 'failed')} />
          {success && last?.instructions ? <p className="form-msg">{last.instructions}</p> : null}
          <dl className="spec">
            <dt>
              <CmsText f="statusLabel" />
            </dt>
            <dd>{view === 'failed' ? statusLabel('PAYMENT_FAILED') : order ? statusLabel(order.status) : '—'}</dd>
            <dt>
              <CmsText f="totalLabel" />
            </dt>
            <dd>{total !== undefined && total !== null ? formatCop(total) : '—'}</dd>
            <dt>
              <CmsText f="destinationLabel" />
            </dt>
            <dd>{order?.destinationCity || order?.shippingAddress?.city || '—'}</dd>
          </dl>
          {items.length ? (
            <ul className="lines order-lines">
              {items.map((it, i) => (
                <li className="line line--small" key={i}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {it.imageUrl ? <img className="line__img" src={mediaUrl(it.imageUrl, CMS_URL)} alt="" width={60} height={60} /> : <span className="line__img" aria-hidden="true" />}
                  <div className="line__main">
                    <span className="line__title">{it.title}</span>
                    <p className="agate">
                      {it.quantity}
                      {it.unitPrice ? ` × ${formatCop(it.unitPrice)}` : ''}
                      {it.variantLabel ? ` · ${it.variantLabel}` : ''}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : null}

          {/* Pago rechazado (o pendiente sin transacción): nuevo intento con el correo del pedido. */}
          <form className="retry" onSubmit={retry} hidden={reveal(retryable)}>
            {!email ? (
              <div className="field">
                <label htmlFor="rt-email">
                  <CmsText f="retryEmailLabel" />
                </label>
                <input id="rt-email" name="email" type="email" required autoComplete="email" />
              </div>
            ) : null}
            <Errors keys={['retryErrorText', 'outOfStockText', 'retryLimitText']} active={retryErr} />
            <button type="submit" className="plaque" disabled={retryBusy || checking}>
              <RotateCcw aria-hidden="true" />
              <CmsText f="retryLabel" />
            </button>
          </form>
          <Msg f="recoveredText" show={recovered} />
          <div className="wall__actions">
            <span className="contents" hidden={reveal(success)}>
              <CmsLink f="trackCta" className="plaque" />
            </span>
            <button type="button" className="plaque plaque--ghost" hidden={reveal(view === 'pending')} disabled={checking} onClick={() => setTick((n) => n + 1)}>
              <RefreshCw aria-hidden="true" />
              <CmsText f="refreshLabel" />
            </button>
            <button
              type="button"
              className="plaque plaque--ghost"
              hidden={reveal(view === 'failed' && Boolean(snapshot && !snapshot.recovered) && !recovered)}
              onClick={() => {
                if (!snapshot) return;
                restore(snapshot.lines, snapshot.notes);
                writeCartSnapshot({ ...snapshot, recovered: true });
                setRecovered(true);
                setCartOpen(true);
              }}
            >
              <ShoppingBag aria-hidden="true" />
              <CmsText f="recoverCartLabel" />
            </button>
            <CmsLink f="backCta" className="plaque plaque--ghost" />
          </div>
          {wa ? (
            <a
              className="textlink"
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              onClick={trackWhatsApp}
              hidden={reveal(view !== 'approved')}
              {...editAttrs({ field: 'helpMessage', type: 'textarea' })}
            >
              <WhatsAppIcon className="wa-inline" />
              <CmsText f="helpLabel" />
            </a>
          ) : null}
        </Frame>

        {/* Invitado: crear la cuenta con los datos del pedido y vincularlo (claimToken del checkout). */}
        <Frame
          as="form"
          className="form-frame claim"
          hidden={reveal(claimable || claim === 'done')}
          onSubmit={async (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            if (!last?.claimToken || !last.email) return;
            const fd = new FormData(e.currentTarget);
            setClaim('busy');
            try {
              await register({
                email: last.email,
                name: last.name || last.email,
                phone: last.phone || undefined,
                password: String(fd.get('password')),
                acceptsTerms: true,
                claimOrders: [{ orderNumber, claimToken: last.claimToken }],
              });
              writeLastOrder({ ...last, claimToken: undefined });
              setClaim('done');
            } catch {
              setClaim('error');
            }
          }}
        >
          <CmsText f="claimHeading" as="h2" className="fieldset-title" />
          <div hidden={reveal(claim !== 'done')} className="claim__body">
            <CmsText f="claimBody" as="p" />
            {last?.email ? <p className="agate claim__email">{last.email}</p> : null}
            <fieldset disabled={claim === 'busy'}>
              <div className="field">
                <label htmlFor="cl-pass">
                  <CmsText f="claimPasswordLabel" />
                </label>
                <PasswordInput id="cl-pass" autoComplete="new-password" minLength={8} />
              </div>
              <Check name="terms" id="cl-terms" required>
                <CmsText f="claimTermsLabel" /> <PolicyLink f="claimTermsLink" />
              </Check>
            </fieldset>
            <Msg f="claimErrorText" show={claim === 'error'} tone="error" />
            <button type="submit" className="plaque" disabled={claim === 'busy'}>
              <CmsText f="claimButton" />
            </button>
          </div>
          <div hidden={reveal(claim === 'done')} className="claim__body" role="status">
            <CmsText f="claimDoneText" as="p" className="form-msg" />
            <CmsLink f="claimDoneCta" className="plaque plaque--ghost" />
          </div>
        </Frame>
      </div>
    </Wrap>
  );
}

// ───────────── Rastreo ─────────────

export function Tracking({ data }: CmsBlockProps) {
  const reveal = useReveal();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [failed, setFailed] = useState('');
  const [order, setOrder] = useState<any>(null);

  async function lookup(c: string) {
    if (!c.trim()) return;
    setLoading(true);
    setError(false);
    setFailed('');
    setOrder(null);
    try {
      setOrder(await trackOrder(c));
    } catch (e) {
      // Un pedido con el pago rechazado no se rastrea: se ofrece reintentar el pago desde /pedido.
      if (isPaymentFailedError(e)) setFailed(String(e.data?.orderNumber || c.trim()));
      else setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let c = new URLSearchParams(window.location.search).get('codigo') || '';
    if (!c) c = readLastOrder()?.orderNumber || '';
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
          <span className={`status${failed ? ' status--bad' : ''}`}>{failed ? statusLabel('PAYMENT_FAILED') : order ? statusLabel(order.status) : '—'}</span>
          <p className="order-code">{failed || order?.orderNumber || '—'}</p>
          <div className="track__failed" hidden={reveal(Boolean(failed))}>
            <CmsText f="failedText" as="p" className="lede" />
            <a className="plaque" href={`/pedido?orden=${encodeURIComponent(failed)}`}>
              <RotateCcw aria-hidden="true" />
              <CmsText f="failedCtaLabel" />
            </a>
          </div>
          <dl className="spec" hidden={Boolean(failed)}>
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
  const seen = ready
    ? recent
        .filter((s) => !favorites.includes(s))
        .map((s) => all.find((p) => p.slug === s))
        .filter(Boolean)
        .slice(0, 4)
    : [];
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
