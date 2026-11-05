'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ExternalLink, Search } from 'lucide-react';
import { useCms } from './CmsProvider';
import { Section, T } from './Editable';
import { Frame } from './Ornaments';
import { getSection } from '@/lib/cms';
import { formatCop } from '@/lib/format';
import { label, settleWompi, trackOrder } from '@/lib/orders';

const WOMPI_STATUS: Record<string, string> = {
  APPROVED: 'Pago aprobado',
  DECLINED: 'Pago rechazado',
  VOIDED: 'Pago anulado',
  ERROR: 'Error en el pago',
  PENDING: 'Pago en verificación',
  UNKNOWN: 'Pago en verificación',
};

export function OrderConfirmation() {
  const { payload } = useCms();
  const s = getSection(payload, '/checkout', 'confirmacion');
  const [orderNumber, setOrderNumber] = useState('');
  const [pay, setPay] = useState<{ status: string; method?: string } | null>(null);
  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    let num = q.get('orden') || '';
    if (!num) {
      try {
        num = JSON.parse(sessionStorage.getItem('arsenal.lastOrder') || '{}').orderNumber || '';
      } catch {}
    }
    setOrderNumber(num);
    const txId = q.get('id');
    (async () => {
      if (txId) setPay(await settleWompi(txId, q.get('env'), num));
      if (num) trackOrder(num).then(setOrder).catch(() => {});
    })();
  }, []);

  const bad = pay && ['DECLINED', 'VOIDED', 'ERROR'].includes(pay.status);

  return (
    <Section s={s} className="wrap" label="Confirmación">
      <div className="page-head">
        <T s={s} f="heading" as="h1" />
      </div>
      <Frame className="status-tile" tone="mustard" style={{ marginBottom: 96 }}>
        {pay ? <span className={`status${bad ? ' status--bad' : ''}`}>{WOMPI_STATUS[pay.status] || pay.status}</span> : null}
        {orderNumber ? (
          <div>
            <p className="agate">Número de pedido</p>
            <p className="order-code">{orderNumber}</p>
          </div>
        ) : null}
        <T s={s} f="body" as="p" className="lede" />
        {order ? (
          <dl className="spec">
            <dt>Estado</dt>
            <dd>{label(order.status)}</dd>
            <dt>Total</dt>
            <dd>{formatCop(order.totalAmount)}</dd>
            <dt>Destino</dt>
            <dd>{order.destinationCity}</dd>
          </dl>
        ) : null}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {orderNumber ? (
            <Link href={`/rastreo?codigo=${encodeURIComponent(orderNumber)}`} className="plaque">
              {s.data.trackCta || 'Rastrear mi pedido'}
            </Link>
          ) : null}
          <Link href="/" className="plaque plaque--ghost">
            Volver a la tienda
          </Link>
        </div>
      </Frame>
    </Section>
  );
}

export function TrackView() {
  const { payload } = useCms();
  const s = getSection(payload, '/rastreo', 'rastreo');
  const d = s.data;
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [order, setOrder] = useState<any>(null);

  async function lookup(c: string) {
    if (!c.trim()) return;
    setLoading(true);
    setError('');
    setOrder(null);
    try {
      setOrder(await trackOrder(c));
    } catch {
      setError(d.notFound || 'No encontramos ese número.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const c = new URLSearchParams(window.location.search).get('codigo');
    if (c) {
      setCode(c);
      lookup(c);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const events: any[] = Array.isArray(order?.trackingEvents) ? [...order.trackingEvents].reverse() : [];

  return (
    <Section s={s} className="wrap" label="Rastreo">
      <div className="page-head" style={{ display: 'grid', gap: 14 }}>
        <T s={s} f="heading" as="h1" />
        <T s={s} f="intro" as="p" className="lede" />
      </div>
      <div style={{ display: 'grid', gap: 24, paddingBottom: 96, maxWidth: 820 }}>
        <Frame
          as="form"
          className="checkout__form"
          onSubmit={(e: React.FormEvent) => {
            e.preventDefault();
            lookup(code);
          }}
        >
          <div className="field">
            <label htmlFor="t-code">{d.inputLabel || 'Número de pedido o guía'}</label>
            <input id="t-code" value={code} onChange={(e) => setCode(e.target.value)} required placeholder="ORD-2026-…" autoCapitalize="characters" />
          </div>
          <button type="submit" className="plaque" disabled={loading} style={{ justifySelf: 'start' }}>
            <Search />
            {loading ? 'Buscando…' : d.submitText || 'Buscar'}
          </button>
          {error ? (
            <p className="form-msg form-msg--error" role="alert">
              {error}
            </p>
          ) : null}
        </Frame>

        {order ? (
          <Frame className="status-tile" tone="mustard" aria-live="polite">
            <span className="status">{label(order.status)}</span>
            <p className="order-code">{order.orderNumber}</p>
            <dl className="spec">
              <dt>Pago</dt>
              <dd>{label(order.paymentStatus)}</dd>
              <dt>Total</dt>
              <dd>{formatCop(order.totalAmount)}</dd>
              <dt>Destino</dt>
              <dd>{order.destinationCity}</dd>
              <dt>Transportadora</dt>
              <dd>{order.carrierName}</dd>
              <dt>Guía</dt>
              <dd>
                {order.trackingNumber ? (
                  order.trackingUrl ? (
                    <a className="textlink" href={order.trackingUrl} target="_blank" rel="noopener noreferrer">
                      {order.trackingNumber} <ExternalLink size={14} style={{ verticalAlign: '-2px' }} />
                    </a>
                  ) : (
                    order.trackingNumber
                  )
                ) : (
                  'Se asigna al despachar'
                )}
              </dd>
            </dl>
            {events.length ? (
              <ol className="tiles" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {events.map((ev, i) => (
                  <li key={ev.id || i} style={{ padding: '14px 16px', display: 'grid', gap: 2 }}>
                    <strong style={{ color: 'var(--cobalt)', fontWeight: 600 }}>{ev.title || label(ev.status)}</strong>
                    <span className="agate">
                      {ev.timestamp ? new Date(ev.timestamp).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' }) : ''}
                      {ev.location ? ` · ${ev.location}` : ''}
                    </span>
                  </li>
                ))}
              </ol>
            ) : null}
          </Frame>
        ) : null}
      </div>
    </Section>
  );
}
