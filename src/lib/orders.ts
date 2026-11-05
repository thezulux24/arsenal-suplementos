import { CMS_SLUG, CMS_URL } from './cms';

export const ORDER_STATUS: Record<string, string> = {
  PENDING_PAYMENT: 'Esperando pago',
  PENDING: 'Esperando pago',
  ORDER_CREATED: 'Pedido creado',
  PROCESSING: 'En preparación',
  PAID: 'Pagado',
  PAID_PROCESSING: 'Pago confirmado',
  SHIPPED: 'Despachado',
  IN_TRANSIT: 'En camino',
  OUT_FOR_DELIVERY: 'En reparto',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
  REFUNDED: 'Reembolsado',
  FAILED: 'Pago rechazado',
};

export const label = (s?: string) => (s ? ORDER_STATUS[s] || s.replace(/_/g, ' ').toLowerCase() : '');

export async function trackOrder(code: string) {
  const res = await fetch(`${CMS_URL}/api/ecommerce/public/${CMS_SLUG}/track/${encodeURIComponent(code.trim())}`, { cache: 'no-store' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || 'No encontramos ese pedido.');
  return data;
}

/** Reads the Wompi transaction the checkout redirected back with, and records an approved payment in the CMS. */
export async function settleWompi(transactionId: string, env: string | null, orderNumber: string) {
  const host = env === 'test' || !env ? 'https://sandbox.wompi.co' : 'https://production.wompi.co';
  const tx = await fetch(`${host}/v1/transactions/${encodeURIComponent(transactionId)}`)
    .then((r) => r.json())
    .then((j) => j?.data)
    .catch(() => null);
  if (!tx) return { status: 'UNKNOWN' as const };
  if (tx.status === 'APPROVED') {
    await fetch(`${CMS_URL}/api/ecommerce/public/${CMS_SLUG}/payments/wompi/confirm-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transactionId: tx.id, reference: tx.reference, orderNumber }),
    }).catch(() => {});
  }
  return { status: tx.status as string, method: tx.payment_method_type as string, reference: tx.reference as string };
}
