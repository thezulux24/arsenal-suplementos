'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Lock } from 'lucide-react';
import { useCart } from './CartProvider';
import { useCms } from './CmsProvider';
import { Section, T } from './Editable';
import { Frame } from './Ornaments';
import { absMedia, CMS_SLUG, CMS_URL, getSection } from '@/lib/cms';
import { formatCop } from '@/lib/format';

const DEPARTMENTS = [
  'Valle del Cauca', 'Amazonas', 'Antioquia', 'Arauca', 'Atlántico', 'Bogotá D.C.', 'Bolívar', 'Boyacá', 'Caldas',
  'Caquetá', 'Casanare', 'Cauca', 'Cesar', 'Chocó', 'Córdoba', 'Cundinamarca', 'Guainía', 'Guaviare', 'Huila',
  'La Guajira', 'Magdalena', 'Meta', 'Nariño', 'Norte de Santander', 'Putumayo', 'Quindío', 'Risaralda',
  'San Andrés y Providencia', 'Santander', 'Sucre', 'Tolima', 'Vaupés', 'Vichada',
];

export function CheckoutView() {
  const { payload } = useCms();
  const { lines, subtotal, clear } = useCart();
  const s = getSection(payload, '/checkout', 'pago');
  const d = s.data;
  const free = payload.ecommerce?.freeShippingThreshold || 0;
  const flat = payload.ecommerce?.flatShippingRate || 0;
  const shipping = lines.length === 0 ? 0 : free > 0 && subtotal >= free ? 0 : flat;
  const total = subtotal + shipping;
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const count = useMemo(() => lines.reduce((a, l) => a + l.quantity, 0), [lines]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setSending(true);
    setError('');
    try {
      const res = await fetch(`${CMS_URL}/api/ecommerce/public/${CMS_SLUG}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: fd.get('name'),
          customerEmail: fd.get('email'),
          customerPhone: fd.get('phone'),
          documentType: fd.get('docType'),
          documentId: fd.get('docId'),
          shippingAddress: {
            address: fd.get('address'),
            city: fd.get('city'),
            department: fd.get('department'),
            country: 'Colombia',
            notes: fd.get('notes'),
          },
          items: lines.map((l) => ({
            productId: l.productId,
            title: l.title,
            variantLabel: l.presentation,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            imageUrl: absMedia(l.imageUrl),
          })),
          paymentProvider: 'WOMPI',
          redirectUrl: `${window.location.origin}/pedido`,
          notes: fd.get('notes'),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || 'No pudimos crear el pedido.');
      const orderNumber = data.orderNumber || data.order?.orderNumber || '';
      const back = `${window.location.origin}/pedido?orden=${encodeURIComponent(orderNumber)}`;
      try {
        sessionStorage.setItem('arsenal.lastOrder', JSON.stringify({ orderNumber, reference: data.reference, total: data.totalAmount ?? total }));
      } catch {}
      const url = data.checkoutUrl || data.paymentSession?.checkoutUrl;
      clear();
      if (url) {
        const u = new URL(url);
        u.searchParams.set('redirect-url', back);
        window.location.href = u.toString();
      } else {
        window.location.href = back;
      }
    } catch (err: any) {
      setSending(false);
      setError(
        typeof err?.message === 'string' && err.message
          ? `${err.message} Revisa los datos e inténtalo de nuevo, o escríbenos por WhatsApp.`
          : 'No pudimos conectar con la pasarela. Inténtalo de nuevo en un minuto.',
      );
    }
  }

  return (
    <Section s={s} className="wrap" label="Pago">
      <div className="page-head">
        <T s={s} f="heading" as="h1" />
      </div>
      {lines.length === 0 ? (
        <div style={{ display: 'grid', gap: 18, paddingBottom: 96, maxWidth: 560 }}>
          <div className="empty-tiles" aria-hidden="true">
            {Array.from({ length: 6 }).map((_, i) => (
              <span key={i} />
            ))}
          </div>
          <T s={s} f="emptyCart" as="p" className="lede" />
          <Link href="/#objetivos" className="plaque" style={{ justifySelf: 'start' }}>
            Volver al catálogo
          </Link>
        </div>
      ) : (
        <div className="checkout">
          <Frame as="form" className="checkout__form" onSubmit={submit}>
            <T s={s} f="contactHeading" as="h2" className="fieldset-title" />
            <div className="field">
              <label htmlFor="c-name">Nombre completo</label>
              <input id="c-name" name="name" required autoComplete="name" />
            </div>
            <div className="field__row">
              <div className="field">
                <label htmlFor="c-email">Correo</label>
                <input id="c-email" name="email" type="email" required autoComplete="email" />
              </div>
              <div className="field">
                <label htmlFor="c-phone">Celular</label>
                <input id="c-phone" name="phone" required inputMode="tel" autoComplete="tel" pattern="[0-9 +]{10,15}" title="Escribe tu celular de 10 dígitos" />
              </div>
            </div>
            <div className="field__row">
              <div className="field">
                <label htmlFor="c-doctype">Tipo de documento</label>
                <select id="c-doctype" name="docType" defaultValue="CC">
                  <option value="CC">Cédula de ciudadanía</option>
                  <option value="CE">Cédula de extranjería</option>
                  <option value="NIT">NIT</option>
                  <option value="PP">Pasaporte</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="c-docid">Número de documento</label>
                <input id="c-docid" name="docId" required inputMode="numeric" />
              </div>
            </div>
            <T s={s} f="shippingHeading" as="h2" className="fieldset-title" />
            <div className="field">
              <label htmlFor="c-address">Dirección</label>
              <input id="c-address" name="address" required autoComplete="street-address" placeholder="Calle, número, apartamento" />
            </div>
            <div className="field__row">
              <div className="field">
                <label htmlFor="c-city">Ciudad</label>
                <input id="c-city" name="city" required defaultValue="Cali" autoComplete="address-level2" />
              </div>
              <div className="field">
                <label htmlFor="c-dep">Departamento</label>
                <select id="c-dep" name="department" defaultValue="Valle del Cauca">
                  {DEPARTMENTS.map((dp) => (
                    <option key={dp}>{dp}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="field">
              <label htmlFor="c-notes">Indicaciones para la entrega (opcional)</label>
              <textarea id="c-notes" name="notes" placeholder="Barrio, portería, horario" />
            </div>
            {error ? (
              <p className="form-msg form-msg--error" role="alert">
                {error}
              </p>
            ) : null}
            <button type="submit" className="plaque plaque--block" disabled={sending}>
              <Lock />
              {sending ? 'Conectando con Wompi…' : `${d.payButton || 'Pagar'} · ${formatCop(total)}`}
            </button>
            <T s={s} f="wompiNote" as="p" className="agate" />
          </Frame>

          <Frame as="aside" className="checkout__summary" aria-label="Resumen del pedido">
            <T s={s} f="summaryHeading" as="h2" className="fieldset-title" />
            {lines.map((l) => (
              <div className="line" key={l.productId} style={{ gridTemplateColumns: '60px 1fr auto' }}>
                <img className="line__img" style={{ width: 60, height: 60 }} src={absMedia(l.imageUrl)} alt="" width={60} height={60} />
                <div style={{ minWidth: 0 }}>
                  <span className="line__title">{l.title}</span>
                  <p className="agate">
                    {l.quantity} × {formatCop(l.unitPrice)}
                  </p>
                </div>
                <span className="price" style={{ fontSize: '0.98rem' }}>
                  {formatCop(l.unitPrice * l.quantity)}
                </span>
              </div>
            ))}
            <div className="row-between">
              <span>Subtotal ({count})</span>
              <span>{formatCop(subtotal)}</span>
            </div>
            <div className="row-between">
              <span>Envío</span>
              <span>{shipping === 0 ? 'Gratis' : formatCop(shipping)}</span>
            </div>
            <div className="row-between" style={{ borderTop: '1px solid var(--grout)', paddingTop: 12 }}>
              <strong>Total</strong>
              <span className="price price--big">{formatCop(total)}</span>
            </div>
            <p className="agate">IVA incluido en los precios.</p>
          </Frame>
        </div>
      )}
    </Section>
  );
}
