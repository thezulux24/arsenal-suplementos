'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, MapPin, Package, Pencil, Plus, Star, Trash2, UserRound } from 'lucide-react';
import { editAttrs, mediaUrl } from '@latinovation/cms-client';
import { CmsGlobalText, CmsLink, CmsText, useCms, useCurrentSection, type CmsBlockProps } from '@latinovation/cms-client/react';
import { useAccount } from '../AccountProvider';
import { BlankTiles, Frame, WhatsAppIcon } from '../Ornaments';
import { trackWhatsApp, useWhatsApp } from '../Shell';
import { Wrap } from './common';
import { Check, Errors, Msg, PasswordInput, safeNext, useReveal } from './forms';
import { firstName, shop, ShopError, type AddressInput, type CustomerAddress, type CustomerOrderSummary } from '@/lib/account';
import { DEPARTMENTS, DOC_TYPES } from '@/lib/colombia';
import { fill, formatCop } from '@/lib/format';
import { label as statusLabel, retryPaymentAndGo } from '@/lib/orders';
import { CMS_URL } from '@/lib/site';

const HOME = '/cuenta/pedidos';

/** Enlace a la política de tratamiento de datos: la URL de la tienda (`customerAccounts.privacyPolicyUrl`) o la del campo. */
export function PolicyLink({ f }: { f: string }) {
  const { privacyPolicyUrl } = useAccount();
  const sec = useCurrentSection();
  const href = privacyPolicyUrl || String((sec?.data as any)?.[f]?.href || '');
  return (
    <a className="textlink" href={href || undefined} target="_blank" rel="noopener noreferrer" {...editAttrs({ field: f, type: 'link' })}>
      <CmsText f={`${f}.label`} />
    </a>
  );
}

const errorFor = (e: unknown, map: Record<string, string>) => {
  const err = e as ShopError;
  return map[err?.code] || map[String(err?.status)] || 'errorText';
};

// ───────────── Navegación de la cuenta ─────────────

const NAV = [
  { href: '/cuenta/pedidos', f: 'accountOrdersLabel', Icon: Package },
  { href: '/cuenta/direcciones', f: 'accountAddressesLabel', Icon: MapPin },
  { href: '/cuenta/datos', f: 'accountProfileLabel', Icon: UserRound },
];

function AccountNav() {
  const path = usePathname();
  const { customer, logout } = useAccount();
  const { isBuilder, payload } = useCms();
  return (
    <div className="acct-bar">
      <p className="acct-bar__hello">{customer || isBuilder ? <CmsGlobalText f="accountGreeting" format={(v) => fill(v, { nombre: firstName(customer?.name) || '…' })} /> : null}</p>
      <nav className="acct-nav tiles" aria-label={String(payload.global?.accountLabel || '')}>
        {NAV.map(({ href, f, Icon }) => (
          <Link key={href} href={href} className="acct-nav__link" aria-current={path === href ? 'page' : undefined}>
            <Icon aria-hidden="true" />
            <CmsGlobalText f={f} />
          </Link>
        ))}
      </nav>
      <button
        type="button"
        className="plaque plaque--ghost plaque--small acct-bar__out"
        onClick={() => {
          logout();
          // Navegación completa: ninguna vista con sesión queda montada (ni redirige con ?siguiente=).
          window.location.assign('/cuenta');
        }}
      >
        <LogOut aria-hidden="true" />
        <CmsGlobalText f="accountLogoutLabel" />
      </button>
    </div>
  );
}

/** Páginas con sesión: sin cliente, de vuelta a /cuenta (en el editor del portal no redirige, para poder editar). */
function useRequireSession() {
  const { customer, ready } = useAccount();
  const { isBuilder } = useCms();
  const router = useRouter();
  const path = usePathname();
  useEffect(() => {
    if (ready && !customer && !isBuilder) router.replace(`/cuenta?siguiente=${encodeURIComponent(path)}`);
  }, [ready, customer, isBuilder, router, path]);
  return { customer, busy: !customer };
}

function AccountPage({ data, children, className = '' }: { data: Record<string, any>; children: React.ReactNode; className?: string }) {
  return (
    <>
      <Wrap className={`acct ${className}`}>
        <div className="page-head band__head">
          <CmsText f="heading" as="h1" />
          <CmsText f="intro" as="p" className="lede" />
        </div>
        <AccountNav />
        {children}
      </Wrap>
    </>
  );
}

// ───────────── /cuenta: entrar, crear cuenta, recuperar contraseña ─────────────

type AuthView = 'login' | 'register' | 'forgot';

export function AccountAuth({ data }: CmsBlockProps) {
  const router = useRouter();
  const reveal = useReveal();
  const { customer, ready, loading, login, register } = useAccount();
  const { isBuilder } = useCms();
  const [view, setView] = useState<AuthView>('login');
  const [next, setNext] = useState(HOME);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState('');
  const wa = useWhatsApp();

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    setNext(safeNext(q.get('siguiente'), HOME));
    const v = q.get('vista');
    if (v === 'crear') setView('register');
    else if (v === 'recuperar') setView('forgot');
  }, []);
  // Con sesión, /cuenta lleva directo a la cuenta (o a donde iba: ?siguiente=/checkout).
  useEffect(() => {
    if (ready && customer && !isBuilder) router.replace(next);
  }, [ready, customer, isBuilder, next, router]);

  const go = (v: AuthView) => {
    setView(v);
    setErr('');
    setSent(false);
  };
  const tabKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const v = view === 'register' ? 'login' : 'register';
      go(v);
      document.getElementById(`tab-${v}`)?.focus();
    }
  };

  async function run(fn: () => Promise<unknown>, map: Record<string, string>) {
    setBusy(true);
    setErr('');
    try {
      await fn();
    } catch (e) {
      setErr(errorFor(e, map));
    } finally {
      setBusy(false);
    }
  }

  const loginTab = view !== 'register';
  return (
    <>
      <Wrap className="acct acct--entry">
        <div className="page-head band__head">
          <CmsText f="heading" as="h1" />
          <CmsText f="intro" as="p" className="lede" />
        </div>
        <Frame className="acct-entry" aria-busy={loading || undefined} data-state={loading ? 'loading' : 'ready'}>
          <div className="acct-tabs" role="tablist" aria-label={String(data.heading || '')}>
            <button type="button" role="tab" id="tab-login" aria-controls="panel-login" aria-selected={loginTab} tabIndex={loginTab ? 0 : -1} onClick={() => go('login')} onKeyDown={tabKey}>
              <CmsText f="loginTab" editable={false} />
            </button>
            <button type="button" role="tab" id="tab-register" aria-controls="panel-register" aria-selected={!loginTab} tabIndex={loginTab ? -1 : 0} onClick={() => go('register')} onKeyDown={tabKey}>
              <CmsText f="registerTab" editable={false} />
            </button>
          </div>

          <div role="tabpanel" id="panel-login" aria-labelledby="tab-login" hidden={reveal(loginTab)} className="acct-panel">
            <form
              className="acct-form"
              hidden={reveal(view === 'login')}
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                run(() => login(String(fd.get('email')), String(fd.get('password'))), { INVALID_CREDENTIALS: 'loginError', '401': 'loginError' });
              }}
            >
              <fieldset disabled={busy}>
                <div className="field">
                  <label htmlFor="l-email">
                    <CmsText f="emailLabel" />
                  </label>
                  <input id="l-email" name="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="field">
                  <label htmlFor="l-pass">
                    <CmsText f="passwordLabel" />
                  </label>
                  <PasswordInput id="l-pass" autoComplete="current-password" />
                </div>
              </fieldset>
              <Errors keys={['loginError', 'errorText']} active={view === 'login' ? err : ''} />
              <button type="submit" className="plaque plaque--block" disabled={busy}>
                <CmsText f="loginButton" />
              </button>
              <button type="button" className="textlink acct-link" onClick={() => go('forgot')}>
                <CmsText f="forgotLink" />
              </button>
            </form>

            <form
              className="acct-form"
              hidden={reveal(view === 'forgot')}
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                run(async () => {
                  await shop.account.forgotPassword(String(fd.get('email')), `${window.location.origin}/cuenta/restablecer`);
                  setSent(true);
                }, {});
              }}
            >
              <CmsText f="forgotHeading" as="h2" className="fieldset-title" />
              <CmsText f="forgotBody" as="p" />
              <fieldset disabled={busy}>
                <div className="field">
                  <label htmlFor="f-email">
                    <CmsText f="emailLabel" />
                  </label>
                  <input id="f-email" name="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
              </fieldset>
              <Msg f="forgotSent" show={sent} />
              <Errors keys={['errorText']} active={view === 'forgot' ? err : ''} />
              <button type="submit" className="plaque plaque--block" disabled={busy}>
                <CmsText f="forgotButton" />
              </button>
              {wa ? (
                <a className="textlink acct-link" href={wa} target="_blank" rel="noopener noreferrer" onClick={trackWhatsApp}>
                  <WhatsAppIcon className="wa-inline" />
                  <CmsText f="forgotHelpLabel" />
                </a>
              ) : null}
              <button type="button" className="textlink acct-link" onClick={() => go('login')}>
                <CmsText f="backToLogin" />
              </button>
            </form>
          </div>

          <div role="tabpanel" id="panel-register" aria-labelledby="tab-register" hidden={reveal(!loginTab)} className="acct-panel">
            <form
              className="acct-form"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                run(
                  () =>
                    register({
                      name: String(fd.get('name')).trim(),
                      email: String(fd.get('email')).trim(),
                      phone: String(fd.get('phone') || '').trim() || undefined,
                      password: String(fd.get('password')),
                      acceptsTerms: true,
                      acceptsMarketing: fd.get('marketing') === 'on',
                    }),
                  { EMAIL_TAKEN: 'emailTakenError', '409': 'emailTakenError' },
                );
              }}
            >
              <fieldset disabled={busy}>
                <div className="field">
                  <label htmlFor="r-name">
                    <CmsText f="nameLabel" />
                  </label>
                  <input id="r-name" name="name" required autoComplete="name" />
                </div>
                <div className="field">
                  <label htmlFor="r-email">
                    <CmsText f="emailLabel" />
                  </label>
                  <input id="r-email" name="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="field">
                  <label htmlFor="r-phone">
                    <CmsText f="phoneLabel" />
                  </label>
                  <input id="r-phone" name="phone" inputMode="tel" autoComplete="tel" pattern="[0-9 +]{10,15}" />
                </div>
                <div className="field">
                  <label htmlFor="r-pass">
                    <CmsText f="passwordLabel" />
                  </label>
                  <PasswordInput id="r-pass" autoComplete="new-password" minLength={8} describedBy="r-pass-hint" />
                  <CmsText f="passwordHint" as="p" className="agate" id="r-pass-hint" />
                </div>
                <Check name="terms" id="r-terms" required>
                  <CmsText f="termsLabel" /> <PolicyLink f="termsLink" />
                </Check>
                <Check name="marketing" id="r-marketing">
                  <CmsText f="marketingLabel" />
                </Check>
              </fieldset>
              <Errors keys={['emailTakenError', 'errorText']} active={view === 'register' ? err : ''} />
              <button type="submit" className="plaque plaque--block" disabled={busy}>
                <CmsText f="registerButton" />
              </button>
            </form>
          </div>
        </Frame>
      </Wrap>
    </>
  );
}

// ───────────── /cuenta/pedidos ─────────────

export function AccountOrders({ data }: CmsBlockProps) {
  const { customer } = useRequireSession();
  const reveal = useReveal();
  const [orders, setOrders] = useState<CustomerOrderSummary[] | null>(null);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [err, setErr] = useState('');
  const [retrying, setRetrying] = useState('');

  useEffect(() => {
    if (!customer) return;
    let alive = true;
    shop.account.orders
      .list(page, 10)
      .then((r) => {
        if (!alive) return;
        setOrders((prev) => (page > 1 && prev ? [...prev, ...r.items] : r.items));
        setPages(r.totalPages || 1);
      })
      .catch(() => alive && setErr('errorText'));
    return () => {
      alive = false;
    };
  }, [customer, page]);

  const loading = !orders && !err;
  return (
    <AccountPage data={data}>
      <div className="acct-orders" aria-busy={loading || undefined}>
        <CmsText f="loadingText" as="p" className="agate" hidden={reveal(loading)} />
        <Errors keys={['errorText', 'retryErrorText', 'outOfStockText', 'retryLimitText']} active={err} />
        <div className="empty" hidden={reveal(Boolean(orders && !orders.length))}>
          <div className="empty-tiles" aria-hidden="true">
            {Array.from({ length: 6 }).map((_, i) => (
              <span key={i} />
            ))}
          </div>
          <CmsText f="emptyText" as="p" className="lede" />
          <CmsLink f="emptyCta" className="plaque" />
        </div>
        {orders?.length ? (
          <div className="tiles acct-list" role="list">
            {orders.map((o) => {
              const failed = o.paymentStatus === 'FAILED' || o.status === 'PAYMENT_FAILED';
              const more = Math.max(0, (o.items?.length || 0) - 4);
              return (
                <div key={o.orderNumber} className="order-tile" role="listitem">
                  <div className="order-tile__head">
                    <span className="order-tile__code">{o.orderNumber}</span>
                    <span className={`status${failed ? ' status--bad' : ''}`}>{statusLabel(failed ? 'PAYMENT_FAILED' : o.status)}</span>
                  </div>
                  <p className="order-tile__meta">
                    <span className="agate">{o.createdAt ? new Date(o.createdAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}</span>
                    <span className="price">{formatCop(o.totalAmount)}</span>
                  </p>
                  {o.items?.length ? (
                    <ul className="order-thumbs" aria-label={o.items.map((it) => `${it.quantity} × ${it.title}`).join(', ')}>
                      {o.items.slice(0, 4).map((it, i) => (
                        <li key={i}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          {it.imageUrl ? <img src={mediaUrl(it.imageUrl, CMS_URL)} alt="" width={52} height={52} loading="lazy" /> : null}
                        </li>
                      ))}
                      {more ? <li className="order-thumbs__more">+{more}</li> : null}
                    </ul>
                  ) : null}
                  {o.trackingNumber ? (
                    <p className="agate">
                      <CmsText f="trackingLabel" /> {o.carrierName ? `${o.carrierName} · ` : ''}
                      {o.trackingNumber}
                    </p>
                  ) : null}
                  <div className="order-tile__actions">
                    {o.canRetry ? (
                      <button
                        type="button"
                        className="plaque plaque--small"
                        disabled={Boolean(retrying)}
                        onClick={async () => {
                          setRetrying(o.orderNumber);
                          setErr('');
                          try {
                            await retryPaymentAndGo(o.orderNumber, customer?.email);
                          } catch (e) {
                            setRetrying('');
                            const k = errorFor(e, { OUT_OF_STOCK: 'outOfStockText', RETRY_LIMIT: 'retryLimitText', RETRY_NOT_ALLOWED: 'retryLimitText' });
                            setErr(k === 'errorText' ? 'retryErrorText' : k);
                          }
                        }}
                      >
                        <CmsText f="retryLabel" />
                      </button>
                    ) : null}
                    {!failed ? (
                      <Link className="plaque plaque--ghost plaque--small" href={`/rastreo?codigo=${encodeURIComponent(o.orderNumber)}`}>
                        <CmsText f="trackLabel" />
                      </Link>
                    ) : null}
                  </div>
                </div>
              );
            })}
            <BlankTiles n={orders.length} cols={[2, 2, 1]} />
          </div>
        ) : null}
        {orders && page < pages ? (
          <button type="button" className="plaque plaque--ghost" onClick={() => setPage((p) => p + 1)}>
            <CmsText f="moreLabel" />
          </button>
        ) : null}
      </div>
    </AccountPage>
  );
}

// ───────────── /cuenta/direcciones ─────────────

const EMPTY_ADDRESS: AddressInput = { label: '', recipientName: '', phone: '', address: '', city: '', department: 'Valle del Cauca', country: 'Colombia', notes: '', isDefault: false };
const MAX_ADDRESSES = 10;

export function AccountAddresses({ data }: CmsBlockProps) {
  const { customer, busy: noSession } = useRequireSession();
  const { setCustomer } = useAccount();
  const { payload } = useCms();
  const reveal = useReveal();
  const [list, setList] = useState<CustomerAddress[] | null>(null);
  const [editing, setEditing] = useState<CustomerAddress | 'new' | null>(null);
  const [confirmDel, setConfirmDel] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (customer && !list) setList(customer.addresses || []);
  }, [customer, list]);

  const apply = (addresses: CustomerAddress[]) => {
    setList(addresses);
    if (customer) setCustomer({ ...customer, addresses });
  };
  async function act(fn: () => Promise<CustomerAddress[]>) {
    setBusy(true);
    setErr('');
    setSaved(false);
    try {
      apply(await fn());
      return true;
    } catch (e) {
      setErr((e as ShopError)?.code === 'ADDRESS_LIMIT' ? 'maxText' : 'errorText');
      return false;
    } finally {
      setBusy(false);
    }
  }

  const form = editing === 'new' ? EMPTY_ADDRESS : editing || EMPTY_ADDRESS;
  const full = (list?.length || 0) >= MAX_ADDRESSES;
  return (
    <AccountPage data={data}>
      <div className="acct-addresses">
        <div className="acct-toolbar">
          <button
            type="button"
            className="plaque"
            disabled={noSession || full || busy}
            onClick={() => {
              setEditing('new');
              setSaved(false);
              requestAnimationFrame(() => document.getElementById('a-label')?.focus());
            }}
          >
            <Plus aria-hidden="true" />
            <CmsText f="addLabel" />
          </button>
          <CmsText f="maxText" as="p" className="agate" hidden={reveal(full || err === 'maxText')} />
        </div>
        <Msg f="savedText" show={saved} />
        <Errors keys={['errorText']} active={err} />

        <Frame
          as="form"
          key={editing === 'new' ? 'new' : editing ? editing.id : 'none'}
          className="form-frame acct-address-form"
          hidden={reveal(Boolean(editing))}
          onSubmit={async (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const body: AddressInput = {
              label: String(fd.get('label') || '').trim(),
              recipientName: String(fd.get('recipientName') || '').trim(),
              phone: String(fd.get('phone') || '').trim(),
              address: String(fd.get('address') || '').trim(),
              city: String(fd.get('city') || '').trim(),
              department: String(fd.get('department') || ''),
              country: 'Colombia',
              notes: String(fd.get('notes') || '').trim(),
              isDefault: fd.get('isDefault') === 'on',
            };
            const ok = await act(() => (editing && editing !== 'new' ? shop.account.addresses.update(editing.id, body) : shop.account.addresses.create(body)));
            if (ok) {
              setEditing(null);
              setSaved(true);
            }
          }}
        >
          <CmsText f="formHeading" as="h2" className="fieldset-title" hidden={reveal(!editing || editing === 'new')} />
          <CmsText f="editHeading" as="h2" className="fieldset-title" hidden={reveal(Boolean(editing) && editing !== 'new')} />
          <fieldset disabled={busy || noSession}>
            <div className="field">
              <label htmlFor="a-label">
                <CmsText f="labelLabel" />
              </label>
              <input id="a-label" name="label" defaultValue={form.label} autoComplete="off" />
            </div>
            <div className="field__row">
              <div className="field">
                <label htmlFor="a-recipient">
                  <CmsText f="recipientLabel" />
                </label>
                <input id="a-recipient" name="recipientName" required autoComplete="name" defaultValue={form.recipientName || (editing === 'new' ? customer?.name || '' : '')} />
              </div>
              <div className="field">
                <label htmlFor="a-phone">
                  <CmsText f="phoneLabel" />
                </label>
                <input id="a-phone" name="phone" required inputMode="tel" autoComplete="tel" pattern="[0-9 +]{10,15}" defaultValue={form.phone || (editing === 'new' ? customer?.phone || '' : '')} />
              </div>
            </div>
            <div className="field">
              <label htmlFor="a-address">
                <CmsText f="addressLabel" />
              </label>
              <input id="a-address" name="address" required autoComplete="street-address" defaultValue={form.address} />
            </div>
            <div className="field__row">
              <div className="field">
                <label htmlFor="a-city">
                  <CmsText f="cityLabel" />
                </label>
                <input id="a-city" name="city" required autoComplete="address-level2" defaultValue={form.city || (editing === 'new' ? String(payload.global?.city || '') : '')} />
              </div>
              <div className="field">
                <label htmlFor="a-dep">
                  <CmsText f="departmentLabel" />
                </label>
                <select id="a-dep" name="department" defaultValue={form.department || 'Valle del Cauca'}>
                  {DEPARTMENTS.map((dp) => (
                    <option key={dp}>{dp}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="field">
              <label htmlFor="a-notes">
                <CmsText f="notesLabel" />
              </label>
              <textarea id="a-notes" name="notes" rows={2} defaultValue={form.notes} />
            </div>
            <Check name="isDefault" id="a-default" defaultChecked={Boolean(form.isDefault) || !list?.length}>
              <CmsText f="defaultLabel" />
            </Check>
          </fieldset>
          <div className="wall__actions">
            <button type="submit" className="plaque" disabled={busy || noSession}>
              <CmsText f="saveLabel" />
            </button>
            <button type="button" className="plaque plaque--ghost" onClick={() => setEditing(null)}>
              <CmsText f="cancelLabel" />
            </button>
          </div>
        </Frame>

        <CmsText f="loadingText" as="p" className="agate" hidden={reveal(!list)} />
        <div className="empty" hidden={reveal(Boolean(list && !list.length && !editing))}>
          <CmsText f="emptyText" as="p" className="lede" />
        </div>
        {list?.length ? (
          <div className="tiles acct-list acct-list--grid" role="list">
            {list.map((a) => (
              <div role="listitem" key={a.id} className={`address-tile${a.isDefault ? ' is-default' : ''}`}>
                <div className="order-tile__head">
                  <span className="address-tile__name">{a.label || a.recipientName}</span>
                  {a.isDefault ? (
                    <span className="flag">
                      <CmsText f="defaultBadge" />
                    </span>
                  ) : null}
                </div>
                <address className="address-tile__body">
                  {a.recipientName ? <span>{a.recipientName}</span> : null}
                  <span>{a.address}</span>
                  <span>{[a.city, a.department].filter(Boolean).join(', ')}</span>
                  {a.phone ? <span className="agate">{a.phone}</span> : null}
                  {a.notes ? <span className="agate">{a.notes}</span> : null}
                </address>
                {confirmDel === a.id ? (
                  <div className="address-tile__confirm" role="group">
                    <CmsText f="deleteConfirm" as="p" />
                    <div className="order-tile__actions">
                      <button
                        type="button"
                        className="plaque plaque--small plaque--danger"
                        disabled={busy}
                        onClick={() => act(() => shop.account.addresses.remove(a.id)).then(() => setConfirmDel(''))}
                      >
                        <Trash2 aria-hidden="true" />
                        <CmsText f="deleteLabel" />
                      </button>
                      <button type="button" className="plaque plaque--ghost plaque--small" onClick={() => setConfirmDel('')}>
                        <CmsText f="cancelLabel" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="order-tile__actions">
                    <button
                      type="button"
                      className="plaque plaque--ghost plaque--small"
                      disabled={busy}
                      onClick={() => {
                        setEditing(a);
                        setSaved(false);
                        requestAnimationFrame(() => document.getElementById('a-label')?.focus());
                      }}
                    >
                      <Pencil aria-hidden="true" />
                      <CmsText f="editLabel" />
                    </button>
                    {!a.isDefault ? (
                      <button type="button" className="plaque plaque--ghost plaque--small" disabled={busy} onClick={() => act(() => shop.account.addresses.update(a.id, { isDefault: true }))}>
                        <Star aria-hidden="true" />
                        <CmsText f="makeDefaultLabel" />
                      </button>
                    ) : null}
                    <button type="button" className="icon-btn" disabled={busy} onClick={() => setConfirmDel(a.id)} aria-label={`${String(data.deleteLabel || '')} · ${a.label || a.address}`}>
                      <Trash2 aria-hidden="true" />
                    </button>
                  </div>
                )}
              </div>
            ))}
            <BlankTiles n={list.length} cols={[3, 2, 1]} />
          </div>
        ) : null}
      </div>
    </AccountPage>
  );
}

// ───────────── /cuenta/datos ─────────────

export function AccountProfile({ data }: CmsBlockProps) {
  const { customer, busy: noSession } = useRequireSession();
  const { setCustomer, adopt, logout } = useAccount();
  const [busy, setBusy] = useState('');
  const [ok, setOk] = useState('');
  const [err, setErr] = useState<{ form: string; key: string }>({ form: '', key: '' });

  async function run(form: string, fn: () => Promise<void>, map: Record<string, string> = {}) {
    setBusy(form);
    setOk('');
    setErr({ form: '', key: '' });
    try {
      await fn();
      setOk(form);
    } catch (e) {
      setErr({ form, key: errorFor(e, map) });
    } finally {
      setBusy('');
    }
  }
  const errOf = (form: string) => (err.form === form ? err.key : '');

  return (
    <AccountPage data={data} className="acct--profile">
      <div className="acct-grid">
        <Frame
          as="form"
          className="form-frame"
          key={customer?.id || 'anon'}
          onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            run('profile', async () => {
              setCustomer(
                await shop.account.update({
                  name: String(fd.get('name') || '').trim(),
                  phone: String(fd.get('phone') || '').trim(),
                  documentType: String(fd.get('docType') || ''),
                  documentId: String(fd.get('docId') || '').trim(),
                  acceptsMarketing: fd.get('marketing') === 'on',
                }),
              );
            });
          }}
        >
          <CmsText f="profileHeading" as="h2" className="fieldset-title" />
          <fieldset disabled={noSession || busy === 'profile'}>
            <div className="field">
              <label htmlFor="p-email">
                <CmsText f="emailLabel" />
              </label>
              <input id="p-email" type="email" value={customer?.email || ''} readOnly aria-readonly="true" className="is-readonly" />
            </div>
            <div className="field">
              <label htmlFor="p-name">
                <CmsText f="nameLabel" />
              </label>
              <input id="p-name" name="name" required autoComplete="name" defaultValue={customer?.name || ''} />
            </div>
            <div className="field">
              <label htmlFor="p-phone">
                <CmsText f="phoneLabel" />
              </label>
              <input id="p-phone" name="phone" inputMode="tel" autoComplete="tel" pattern="[0-9 +]{10,15}" defaultValue={customer?.phone || ''} />
            </div>
            <div className="field__row">
              <div className="field">
                <label htmlFor="p-doctype">
                  <CmsText f="docTypeLabel" />
                </label>
                <select id="p-doctype" name="docType" defaultValue={customer?.documentType || 'CC'}>
                  {DOC_TYPES.map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="p-docid">
                  <CmsText f="docLabel" />
                </label>
                <input id="p-docid" name="docId" inputMode="numeric" autoComplete="off" defaultValue={customer?.documentId || ''} />
              </div>
            </div>
            <Check name="marketing" id="p-marketing" defaultChecked={Boolean(customer?.acceptsMarketing)}>
              <CmsText f="marketingLabel" />
            </Check>
          </fieldset>
          <Msg f="savedText" show={ok === 'profile'} />
          <Errors keys={['errorText']} active={errOf('profile')} />
          <button type="submit" className="plaque" disabled={noSession || busy === 'profile'}>
            <CmsText f="saveLabel" />
          </button>
        </Frame>

        <div className="acct-stack">
          <Frame
            as="form"
            className="form-frame"
            onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
              e.preventDefault();
              const form = e.currentTarget;
              const fd = new FormData(form);
              run(
                'password',
                async () => {
                  adopt(await shop.account.changePassword(String(fd.get('current')), String(fd.get('next'))));
                  form.reset();
                },
                { INVALID_PASSWORD: 'wrongPassword', INVALID_CREDENTIALS: 'wrongPassword' },
              );
            }}
          >
            <CmsText f="passwordHeading" as="h2" className="fieldset-title" />
            <fieldset disabled={noSession || busy === 'password'}>
              <div className="field">
                <label htmlFor="pw-current">
                  <CmsText f="currentPasswordLabel" />
                </label>
                <PasswordInput id="pw-current" name="current" autoComplete="current-password" />
              </div>
              <div className="field">
                <label htmlFor="pw-next">
                  <CmsText f="newPasswordLabel" />
                </label>
                <PasswordInput id="pw-next" name="next" autoComplete="new-password" minLength={8} describedBy="pw-hint" />
                <CmsText f="passwordHint" as="p" className="agate" id="pw-hint" />
              </div>
            </fieldset>
            <Msg f="passwordChanged" show={ok === 'password'} />
            <Errors keys={['wrongPassword']} active={errOf('password') === 'wrongPassword' ? 'wrongPassword' : ''} />
            <Msg f="errorText" show={errOf('password') === 'errorText'} tone="error" />
            <button type="submit" className="plaque" disabled={noSession || busy === 'password'}>
              <CmsText f="passwordButton" />
            </button>
          </Frame>

          <Frame className="form-frame">
            <CmsText f="sessionsHeading" as="h2" className="fieldset-title" />
            <CmsText f="logoutAllBody" as="p" />
            <Msg f="errorText" show={errOf('sessions') === 'errorText'} tone="error" />
            <button
              type="button"
              className="plaque plaque--ghost"
              disabled={noSession || busy === 'sessions'}
              onClick={() =>
                run('sessions', async () => {
                  await shop.account.logoutAll();
                  logout();
                  window.location.assign('/cuenta');
                })
              }
            >
              <LogOut aria-hidden="true" />
              <CmsText f="logoutAllButton" />
            </button>
          </Frame>

          <Frame
            as="form"
            className="form-frame acct-danger"
            onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              run(
                'delete',
                async () => {
                  await shop.account.delete(String(fd.get('password')));
                  logout();
                  window.location.assign('/');
                },
                { INVALID_PASSWORD: 'wrongPassword', INVALID_CREDENTIALS: 'wrongPassword' },
              );
            }}
          >
            <CmsText f="deleteHeading" as="h2" className="fieldset-title" />
            <CmsText f="deleteBody" as="p" />
            <fieldset disabled={noSession || busy === 'delete'}>
              <div className="field">
                <label htmlFor="d-pass">
                  <CmsText f="deletePasswordLabel" />
                </label>
                <PasswordInput id="d-pass" autoComplete="current-password" />
              </div>
            </fieldset>
            <Msg f="wrongPassword" show={errOf('delete') === 'wrongPassword'} tone="error" />
            <Msg f="errorText" show={errOf('delete') === 'errorText'} tone="error" />
            <button type="submit" className="plaque plaque--danger" disabled={noSession || busy === 'delete'}>
              <Trash2 aria-hidden="true" />
              <CmsText f="deleteButton" />
            </button>
          </Frame>
        </div>
      </div>
    </AccountPage>
  );
}

// ───────────── /cuenta/restablecer ─────────────

export function AccountReset({ data }: CmsBlockProps) {
  const { adopt } = useAccount();
  const reveal = useReveal();
  const [token, setToken] = useState<string | null>(null);
  const [state, setState] = useState<'form' | 'done' | 'invalid'>('form');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get('token') || '';
    setToken(t);
    if (!t) setState('invalid');
  }, []);

  return (
    <>
      <Wrap className="acct acct--entry">
        <div className="page-head band__head">
          <CmsText f="heading" as="h1" />
          <CmsText f="intro" as="p" className="lede" />
        </div>
        <Frame className="acct-entry">
          <form
            className="acct-form"
            hidden={reveal(state === 'form')}
            onSubmit={async (e) => {
              e.preventDefault();
              if (!token) return;
              const fd = new FormData(e.currentTarget);
              setBusy(true);
              setErr('');
              try {
                adopt(await shop.account.resetPassword(token, String(fd.get('password'))));
                setState('done');
              } catch (ex) {
                const k = errorFor(ex, { INVALID_RESET_TOKEN: 'invalid', INVALID_TOKEN: 'invalid' });
                if (k === 'invalid') setState('invalid');
                else setErr(k);
              } finally {
                setBusy(false);
              }
            }}
          >
            <fieldset disabled={busy || token === null}>
              <div className="field">
                <label htmlFor="rs-pass">
                  <CmsText f="passwordLabel" />
                </label>
                <PasswordInput id="rs-pass" autoComplete="new-password" minLength={8} describedBy="rs-hint" />
                <CmsText f="passwordHint" as="p" className="agate" id="rs-hint" />
              </div>
            </fieldset>
            <Errors keys={['errorText']} active={err} />
            <button type="submit" className="plaque plaque--block" disabled={busy}>
              <CmsText f="submitLabel" />
            </button>
          </form>
          <div className="acct-form" hidden={reveal(state === 'done')} role="status">
            <CmsText f="doneText" as="p" className="form-msg" />
            <CmsLink f="doneCta" className="plaque" />
          </div>
          <div className="acct-form" hidden={reveal(state === 'invalid')} role="alert">
            <CmsText f="invalidText" as="p" className="form-msg form-msg--error" />
            <CmsLink f="invalidCta" className="plaque plaque--ghost" />
          </div>
        </Frame>
      </Wrap>
    </>
  );
}
