import { shop, ShopError, type PublicOrderSummary } from './account';

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
  PAYMENT_FAILED: 'Pago rechazado',
};

export const label = (s?: string) => (s ? ORDER_STATUS[s] || s.replace(/_/g, ' ').toLowerCase() : '');

/** Rastreo público. Lanza ShopError (409 `PAYMENT_FAILED` si el pago fue rechazado: ese pedido no se rastrea). */
export function trackOrder(code: string) {
  return shop.track(code);
}

export const isPaymentFailedError = (e: unknown): e is ShopError => e instanceof ShopError && (e.code === 'PAYMENT_FAILED' || (e.status === 409 && e.data?.code === 'PAYMENT_FAILED'));

export type PaymentState = 'approved' | 'failed' | 'pending' | 'unknown';

const FAILED_GATEWAY = ['DECLINED', 'VOIDED', 'ERROR'];

/** Estado del pago a partir de lo que diga el backend (o la pasarela, si el backend no respondió). */
export function paymentState(paymentStatus?: string, gatewayStatus?: string): PaymentState {
  const ps = String(paymentStatus || '').toUpperCase();
  const gs = String(gatewayStatus || '').toUpperCase();
  if (ps === 'PAID' || ps === 'APPROVED' || (!ps && gs === 'APPROVED')) return 'approved';
  if (ps === 'FAILED' || FAILED_GATEWAY.includes(gs)) return 'failed';
  if (ps === 'PENDING' || gs === 'PENDING') return 'pending';
  return 'unknown';
}

export interface Settlement {
  state: PaymentState;
  canRetry: boolean;
  order: PublicOrderSummary | null;
  /** true si el estado salió de leer la pasarela porque confirm-order falló. */
  fallback?: boolean;
}

/**
 * Regreso de la pasarela: SIEMPRE avisa al backend (`confirm-order`, aprobado o no) y usa su respuesta;
 * el backend verifica la transacción con la pasarela y registra el estado. Solo si esa llamada falla se lee
 * la transacción directamente para poder mostrar algo al comprador.
 */
export async function settleWompi(transactionId: string, env: string | null, orderNumber: string): Promise<Settlement> {
  try {
    const r = await shop.confirmPayment({ transactionId, orderNumber });
    const state = paymentState(r.paymentStatus || r.order?.paymentStatus, r.gatewayStatus);
    if (state !== 'unknown' || r.order) return { state, canRetry: Boolean(r.canRetry), order: r.order || null };
  } catch {}
  const host = env === 'test' || !env ? 'https://sandbox.wompi.co' : 'https://production.wompi.co';
  const tx = await fetch(`${host}/v1/transactions/${encodeURIComponent(transactionId)}`)
    .then((r) => r.json())
    .then((j) => j?.data)
    .catch(() => null);
  const state = tx ? paymentState(undefined, tx.status) : 'unknown';
  // Sin respuesta del backend no sabemos si admite reintento: se ofrece y el backend decide.
  return { state, canRetry: state === 'failed', order: null, fallback: true };
}

/** Abre un nuevo intento de pago y lleva a la pasarela; vuelve a /pedido?orden=<n>. Lanza ShopError (OUT_OF_STOCK, RETRY_LIMIT, 404…). */
export async function retryPaymentAndGo(orderNumber: string, email?: string) {
  const back = `${window.location.origin}/pedido?orden=${encodeURIComponent(orderNumber)}`;
  const r = await shop.retryPayment(orderNumber, { email: email || undefined, redirectUrl: back });
  if (!r?.checkoutUrl) throw new ShopError(500, 'NO_CHECKOUT_URL', '');
  const u = new URL(r.checkoutUrl);
  if (!u.searchParams.get('redirect-url')) u.searchParams.set('redirect-url', back);
  window.location.href = u.toString();
}
