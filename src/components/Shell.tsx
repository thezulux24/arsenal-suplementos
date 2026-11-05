'use client';

import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Heart, Menu, Search, ShoppingBag, UserRound, X } from 'lucide-react';
import { getProducts, mediaUrl } from '@latinovation/cms-client';
import { CmsGlobalImage, CmsGlobalText, CmsNav, CmsNavText, useCms, useGlobal, useNavLinks } from '@latinovation/cms-client/react';
import { useStore } from './StoreProvider';
import { useAccount } from './AccountProvider';
import { firstName } from '@/lib/account';
import { Frieze, WhatsAppIcon } from './Ornaments';
import { CMS_SLUG, CMS_URL } from '@/lib/site';
import { formatCop, waLink } from '@/lib/format';
import { categoryHref, categoryList, productHref } from '@/lib/shop';

export function trackWhatsApp() {
  fetch(`${CMS_URL}/api/public/analytics/${CMS_SLUG}/track`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event: 'whatsapp_click' }),
    keepalive: true,
  }).catch(() => {});
}

export function useWhatsApp(text?: string) {
  const num = useGlobal<string>('whatsappNumber', '');
  const prefill = useGlobal<string>('whatsappPrefill', '');
  return num ? waLink(num, text || prefill || 'Hola') : '';
}

export function Brand({ compact = false }: { compact?: boolean }) {
  const logo = useGlobal<string>('logoUrl', '');
  const name = useGlobal<string>('brandName', '');
  return (
    <span className="brand">
      {logo ? (
        <CmsGlobalImage f="logoUrl" className="brand__logo" height={40} />
      ) : (
        <span className="brand__tile" aria-hidden="true">
          {String(name || 'T').charAt(0)}
        </span>
      )}
      {compact && logo ? null : <CmsGlobalText f="brandName" className="brand__name" />}
    </span>
  );
}

export function AnnouncementBar() {
  return <CmsGlobalText f="announcementText" as="div" className="announce" />;
}

/** Buscador con sugerencias al instante (productos y categorías del payload en vivo). */
export function SearchBox({ id, onDone, autoFocus = false }: { id?: string; onDone?: () => void; autoFocus?: boolean }) {
  const { payload } = useCms();
  const router = useRouter();
  const label = useGlobal<string>('searchLabel', '');
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const listId = useId();
  const products = useMemo(() => getProducts(payload), [payload]);
  const cats = useMemo(() => categoryList(payload), [payload]);
  const norm = (s: unknown) =>
    String(s ?? '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '');
  const words = norm(q).trim().split(/\s+/).filter(Boolean);
  const hits = words.length
    ? products.filter((p) => {
        const hay = norm([p.title, p.brand, p.category, p.color, p.material, p.style].join(' '));
        return words.every((w) => hay.includes(w));
      })
    : [];
  const catHits = words.length ? cats.filter((c) => words.every((w) => norm(c.name).includes(w))) : [];
  const options = [...catHits.map((c) => ({ kind: 'cat' as const, href: categoryHref(c.name), c })), ...hits.slice(0, 6).map((p) => ({ kind: 'prod' as const, href: productHref(p), p }))];

  const go = (href: string) => {
    setOpen(false);
    setQ('');
    onDone?.();
    router.push(href);
  };

  return (
    <form
      className="search"
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        if (active >= 0 && options[active]) return go(options[active].href);
        if (q.trim()) go(`/buscar?q=${encodeURIComponent(q.trim())}`);
      }}
    >
      <label htmlFor={id} className="sr-only">
        <CmsGlobalText f="searchLabel" />
      </label>
      <Search className="search__icon" aria-hidden="true" />
      <input
        id={id}
        type="search"
        value={q}
        autoFocus={autoFocus}
        placeholder={label}
        autoComplete="off"
        role="combobox"
        aria-expanded={open && options.length > 0}
        aria-controls={listId}
        aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
          setActive(-1);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActive((a) => Math.min(options.length - 1, a + 1));
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActive((a) => Math.max(-1, a - 1));
          } else if (e.key === 'Escape') setOpen(false);
        }}
      />
      {open && options.length ? (
        <ul className="search__list" id={listId} role="listbox">
          {options.map((o, i) => (
            <li key={o.href} id={`${listId}-${i}`} role="option" aria-selected={i === active} onMouseDown={(e) => e.preventDefault()} onClick={() => go(o.href)}>
              {o.kind === 'cat' ? (
                <span className="search__cat">
                  <span className="search__name">{o.c.name}</span>
                  <span className="agate">{o.c.count}</span>
                </span>
              ) : (
                <span className="search__prod">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={mediaUrl(o.p.imageUrl || '', CMS_URL)} alt="" width={44} height={44} loading="lazy" />
                  <span className="search__name">{o.p.title}</span>
                  <span className="search__price">{formatCop(o.p.price)}</span>
                </span>
              )}
            </li>
          ))}
        </ul>
      ) : null}
    </form>
  );
}

export function Header() {
  const { count, setCartOpen, pulse, favorites, ready } = useStore();
  const wa = useWhatsApp();
  const [menu, setMenu] = useState(false);
  const [pulsing, setPulsing] = useState(false);
  const cartLabel = useGlobal<string>('cartLabel', '');
  const favLabel = useGlobal<string>('favoritesLabel', '');
  const menuLabel = useGlobal<string>('menuLabel', '');
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!pulse) return;
    setPulsing(true);
    const t = setTimeout(() => setPulsing(false), 720);
    return () => clearTimeout(t);
  }, [pulse]);

  useEffect(() => {
    document.body.style.overflow = menu ? 'hidden' : '';
    if (!menu) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenu(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menu]);

  return (
    <>
      <AnnouncementBar />
      <header className="header">
        <div className="wrap header__row">
          <Link href="/" className="brand-link" aria-label="Inicio">
            <Brand />
          </Link>
          <CmsNav list="header" className="nav" aria-label="Principal" linkClassName="nav__link" />
          <div className="header__search">
            <SearchBox id="header-search" />
          </div>
          <div className="header__actions">
            {wa ? (
              <a className="plaque plaque--ghost plaque--small header__wa" href={wa} target="_blank" rel="noopener noreferrer" onClick={trackWhatsApp}>
                <WhatsAppIcon />
                <CmsNavText f="headerCtaText" />
              </a>
            ) : null}
            <Link href="/buscar" className="icon-btn header__search-btn" aria-label={useGlobal<string>('searchLabel', '')}>
              <Search aria-hidden="true" />
            </Link>
            <Link href="/favoritos" className="icon-btn" title={favLabel}>
              <Heart aria-hidden="true" />
              <CmsGlobalText f="favoritesLabel" className="sr-only" />
              {ready && favorites.length ? <span className="icon-btn__count">{favorites.length}</span> : null}
            </Link>
            <AccountLink />
            <button type="button" className={`plaque plaque--small cart-btn${pulsing ? ' is-pulsing' : ''}`} onClick={() => setCartOpen(true)} aria-label={`${cartLabel}, ${count}`}>
              <ShoppingBag aria-hidden="true" />
              <CmsGlobalText f="cartLabel" className="cart-btn__label" />
              <span className="cart-btn__count">{count}</span>
            </button>
            <button type="button" className="icon-btn menu-btn" onClick={() => setMenu(true)} aria-label={menuLabel} aria-expanded={menu}>
              <Menu aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>
      {menu ? (
        <div className="mobile-nav" role="dialog" aria-modal="true" aria-label={menuLabel}>
          <div className="row-between">
            <Brand compact />
            <button ref={closeRef} type="button" className="icon-btn" onClick={() => setMenu(false)} aria-label="Cerrar">
              <X aria-hidden="true" />
            </button>
          </div>
          <SearchBox id="mobile-search" onDone={() => setMenu(false)} />
          <div onClick={(e) => (e.target as HTMLElement).closest('a') && setMenu(false)}>
            <CmsNav list="header" className="mobile-nav__links" linkClassName="mobile-nav__link" />
          </div>
          {wa ? (
            <a className="plaque plaque--block" style={{ marginTop: 'auto' }} href={wa} target="_blank" rel="noopener noreferrer" onClick={trackWhatsApp}>
              <WhatsAppIcon />
              <CmsNavText f="headerCtaText" />
            </a>
          ) : null}
        </div>
      ) : null}
    </>
  );
}

/** Cuenta del cliente junto a favoritos y carrito; con sesión muestra el primer nombre. Sin cuentas activas, nada. */
function AccountLink() {
  const { enabled, customer } = useAccount();
  const label = useGlobal<string>('accountLabel', '');
  if (!enabled) return null;
  const name = firstName(customer?.name);
  return (
    <Link href={customer ? '/cuenta/pedidos' : '/cuenta'} className={`icon-btn account-btn${name ? ' is-in' : ''}`} title={label} aria-label={name ? `${label}: ${name}` : label}>
      <UserRound aria-hidden="true" />
      {name ? (
        <span className="account-btn__name" aria-hidden="true">
          {name}
        </span>
      ) : (
        <CmsGlobalText f="accountLabel" className="sr-only" />
      )}
    </Link>
  );
}

export function Footer() {
  const { payload } = useCms();
  const cats = useMemo(() => categoryList(payload), [payload]);
  const wa = useWhatsApp();
  const g = payload.global || {};
  const footerLinks = useNavLinks('footer');
  const social: Array<{ network?: string; url?: string }> = Array.isArray(g.social) ? g.social.filter((s: any) => s?.url) : [];
  return (
    <footer className="footer">
      <Frieze />
      <div className="wrap">
        <div className="footer__grid">
          <div className="footer__brand">
            <Brand />
            <CmsGlobalText f="tagline" as="p" className="lede" />
            <p className="agate">
              <CmsGlobalText f="city" />
              {g.city && g.address ? ' · ' : null}
              <CmsGlobalText f="address" />
            </p>
          </div>
          {footerLinks.length ? (
            <div>
              <CmsGlobalText f="footerLinksHeading" as="h2" className="footer__h" />
              <CmsNav list="footer" as="div" className="footer__links" linkClassName="footer__link" />
            </div>
          ) : null}
          <div>
            <CmsGlobalText f="footerCategoriesHeading" as="h2" className="footer__h" />
            <ul className="footer__links">
              {cats.map((c) => (
                <li key={c.slug}>
                  <Link className="footer__link" href={categoryHref(c.name)}>
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <CmsGlobalText f="footerContactHeading" as="h2" className="footer__h" />
            <ul className="footer__links">
              {wa ? (
                <li>
                  <a className="footer__link footer__wa" href={wa} target="_blank" rel="noopener noreferrer" onClick={trackWhatsApp}>
                    <WhatsAppIcon className="wa-inline" />
                    <CmsGlobalText f="whatsappFloatLabel" />
                  </a>
                </li>
              ) : null}
              {g.phone ? (
                <li>
                  <a className="footer__link" href={`tel:${String(g.phone).replace(/[^\d+]/g, '')}`}>
                    <CmsGlobalText f="phone" />
                  </a>
                </li>
              ) : null}
              {g.email ? (
                <li>
                  <a className="footer__link" href={`mailto:${g.email}`}>
                    <CmsGlobalText f="email" />
                  </a>
                </li>
              ) : null}
              <li>
                <CmsGlobalText f="hours" className="agate" />
              </li>
              {social.map((s) => (
                <li key={s.url}>
                  <a className="footer__link" href={s.url} target="_blank" rel="noopener noreferrer">
                    {s.network ? s.network.charAt(0).toUpperCase() + s.network.slice(1) : s.url}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="footer__legal">
          <CmsGlobalText f="legalNote" as="p" className="agate" />
          <p className="agate">
            © {new Date().getFullYear()} <CmsGlobalText f="brandName" />
          </p>
        </div>
      </div>
    </footer>
  );
}

export function WhatsAppFloat() {
  const wa = useWhatsApp();
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const on = () => setShown(window.scrollY > window.innerHeight * 0.8);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  if (!wa) return null;
  return (
    <a className={`wa-float${shown ? ' is-shown' : ''}`} href={wa} target="_blank" rel="noopener noreferrer" onClick={trackWhatsApp} aria-label="WhatsApp">
      <WhatsAppIcon />
      <CmsGlobalText f="whatsappFloatLabel" />
    </a>
  );
}
