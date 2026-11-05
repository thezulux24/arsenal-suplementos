import type { CartLine } from '@/components/StoreProvider';

/** Último pedido de esta pestaña (sessionStorage): número, total, método, instrucciones y datos para reintentar o crear la cuenta. */
export const LAST_ORDER_KEY = 'tusplatos.lastOrder';
/** Copia del carrito antes de ir a la pasarela (el checkout lo vacía): permite "Recuperar mi carrito" si el pago falla. */
export const CART_SNAPSHOT_KEY = 'tusplatos.cartSnapshot';

export interface LastOrder {
  orderNumber: string;
  total?: number;
  method?: string;
  instructions?: string;
  email?: string;
  name?: string;
  phone?: string;
  /** Checkout de invitado: secreto para vincular la orden al crear la cuenta en este navegador. */
  claimToken?: string;
}
export interface CartSnapshot {
  orderNumber: string;
  lines: CartLine[];
  notes?: string;
  /** Ya se devolvió al carrito (si luego se paga este pedido, el carrito se vacía). */
  recovered?: boolean;
}

function read<T>(key: string): T | null {
  try {
    const raw = window.sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}
function write(key: string, v: unknown) {
  try {
    if (v === null) window.sessionStorage.removeItem(key);
    else window.sessionStorage.setItem(key, JSON.stringify(v));
  } catch {}
}

export const readLastOrder = () => read<LastOrder>(LAST_ORDER_KEY);
export const writeLastOrder = (v: LastOrder | null) => write(LAST_ORDER_KEY, v);
export const readCartSnapshot = () => read<CartSnapshot>(CART_SNAPSHOT_KEY);
export const writeCartSnapshot = (v: CartSnapshot | null) => write(CART_SNAPSHOT_KEY, v);
