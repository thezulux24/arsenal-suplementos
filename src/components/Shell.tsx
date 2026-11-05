'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Menu, ShoppingBag, X } from 'lucide-react';
import { useCms } from './CmsProvider';
import { useCart } from './CartProvider';
import { Frieze, WhatsAppIcon } from './Ornaments';
import { CMS_SLUG, CMS_URL } from '@/lib/cms';
import { waLink } from '@/lib/format';
import { themeStyle } from '@/lib/theme';

/** Keeps CSS tokens in sync with the CMS design system, including live edits from /portal. */
export function ThemeVars() {
  const { payload } = useCms();
  useEffect(() => {
    const s = themeStyle(payload.global) as Record<string, string>;
    for (const [k, v] of Object.entries(s)) document.documentElement.style.setProperty(k, v);
  }, [payload.global]);
  return null;
}

export function trackWhatsApp() {
  fetch(`${CMS_URL}/api/public/analytics/${CMS_SLUG}/track`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event: 'whatsapp_click' }),
    keepalive: true,
  }).catch(() => {});
}

export function Header() {
  const { payload } = useCms();
  const { count, setOpen, pulse } = useCart();
  const [menu, setMenu] = useState(false);
  const [pulsing, setPulsing] = useState(false);
  const g = payload.global || {};
  const links = (payload.navigation?.headerLinks || []).filter((l) => l.isVisible !== false);

  useEffect(() => {
    if (!pulse) return;
    setPulsing(true);
    const t = setTimeout(() => setPulsing(false), 720);
    return () => clearTimeout(t);
  }, [pulse]);

  useEffect(() => {
    document.body.style.overflow = menu ? 'hidden' : '';
  }, [menu]);

  const brand = String(g.brandName || 'Arsenal Suplementos');
  const [first, ...rest] = brand.split(' ');

  return (
    <>
      {g.announcementText ? <div className="announce">{g.announcementText}</div> : null}
      <header className="header">
        <div className="wrap header__row">
          <Link href="/" className="brand" aria-label={`${brand}, inicio`}>
            <span className="brand__tile" aria-hidden="true">
              {first.charAt(0)}
            </span>
            <span className="brand__name">
              {first}
              {rest.length ? <small>{rest.join(' ')}</small> : null}
            </span>
          </Link>
          <nav className="nav" aria-label="Principal">
            {links.map((l) => (
              <Link key={l.id} href={l.href}>
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="header__actions">
            {g.whatsappNumber ? (
              <a
                className="plaque plaque--ghost plaque--small header__wa"
                href={waLink(g.whatsappNumber, g.whatsappPrefill || 'Hola')}
                target="_blank"
                rel="noopener noreferrer"
                onClick={trackWhatsApp}
              >
                <WhatsAppIcon />
                {payload.navigation?.headerCtaText || 'WhatsApp'}
              </a>
            ) : null}
            <button
              type="button"
              className={`plaque plaque--small cart-btn${pulsing ? ' is-pulsing' : ''}`}
              onClick={() => setOpen(true)}
              aria-label={`Abrir carrito, ${count} productos`}
            >
              <ShoppingBag />
              <span className="cart-btn__label">Carrito</span>
              <span className="cart-btn__count">{count}</span>
            </button>
            <button type="button" className="close-btn menu-btn" onClick={() => setMenu(true)} aria-label="Abrir menú">
              <Menu />
            </button>
          </div>
        </div>
      </header>
      {menu ? (
        <div className="mobile-nav" role="dialog" aria-modal="true" aria-label="Menú">
          <div className="row-between" style={{ marginBottom: 12 }}>
            <span className="brand__name" style={{ color: 'var(--cobalt)' }}>
              {first}
            </span>
            <button type="button" className="close-btn" onClick={() => setMenu(false)} aria-label="Cerrar menú">
              <X />
            </button>
          </div>
          {links.map((l) => (
            <Link key={l.id} href={l.href} className="mobile-nav__link" onClick={() => setMenu(false)}>
              {l.label}
            </Link>
          ))}
          {g.whatsappNumber ? (
            <a
              className="plaque plaque--block"
              style={{ marginTop: 'auto' }}
              href={waLink(g.whatsappNumber, g.whatsappPrefill || 'Hola')}
              target="_blank"
              rel="noopener noreferrer"
              onClick={trackWhatsApp}
            >
              <WhatsAppIcon />
              {payload.navigation?.headerCtaText || 'WhatsApp'}
            </a>
          ) : null}
        </div>
      ) : null}
    </>
  );
}

export function Footer() {
  const { payload } = useCms();
  const g = payload.global || {};
  const cats = payload.collectionDefinitions?.productos?.categories || [];
  return (
    <footer className="footer">
      <Frieze />
      <div className="wrap">
        <div className="footer__grid">
          <div style={{ display: 'grid', gap: 14, alignContent: 'start' }}>
            <span className="brand">
              <span className="brand__tile" aria-hidden="true">
                {String(g.brandName || 'A').charAt(0)}
              </span>
              <span className="brand__name">
                {String(g.brandName || 'Arsenal Suplementos').split(' ')[0]}
                <small>{g.brandMonogram}</small>
              </span>
            </span>
            <p className="agate" style={{ maxWidth: '44ch' }}>
              {g.footerAddress}
              {g.storeHours ? ` · ${g.storeHours}` : ''}
            </p>
          </div>
          <div>
            <h3>Objetivos</h3>
            <ul>
              {cats.map((c) => (
                <li key={c}>
                  <Link href={`/?objetivo=${encodeURIComponent(c)}#catalogo`}>{c}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3>Tu pedido</h3>
            <ul>
              <li>
                <Link href="/checkout">Ir a pagar</Link>
              </li>
              <li>
                <Link href="/rastreo">Rastrear pedido</Link>
              </li>
              <li>
                <Link href="/#preguntas">Preguntas frecuentes</Link>
              </li>
              {g.whatsappNumber ? (
                <li>
                  <a href={waLink(g.whatsappNumber, g.whatsappPrefill || 'Hola')} target="_blank" rel="noopener noreferrer" onClick={trackWhatsApp}>
                    WhatsApp
                  </a>
                </li>
              ) : null}
            </ul>
          </div>
        </div>
        <div className="footer__legal">
          {g.legalNote ? <p className="agate">{g.legalNote}</p> : null}
          <p className="agate">
            © {new Date().getFullYear()} {g.brandName}
            {g.imageCredit ? ` · ${g.imageCredit}` : ''}
          </p>
        </div>
      </div>
    </footer>
  );
}

export function WhatsAppFloat() {
  const { payload } = useCms();
  const g = payload.global || {};
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const on = () => setShown(window.scrollY > window.innerHeight * 0.8);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  if (!g.whatsappNumber) return null;
  return (
    <a
      className={`wa-float${shown ? " is-shown" : ""}`}
      href={waLink(g.whatsappNumber, g.whatsappPrefill || 'Hola')}
      target="_blank"
      rel="noopener noreferrer"
      onClick={trackWhatsApp}
      aria-label="Escribir por WhatsApp"
    >
      <WhatsAppIcon />
      <span>Asesoría</span>
    </a>
  );
}
