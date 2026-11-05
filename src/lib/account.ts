/**
 * Cliente de la tienda (cuentas de cliente, checkout, pagos y rastreo) según docs/SHOP-ACCOUNTS.md del CMS.
 *
 * Misma superficie que `createShopClient({ apiUrl, slug, storage })` del SDK `@latinovation/cms-client` (v4.2):
 * cuando el SDK la publique, este módulo se reemplaza por la importación sin tocar a quien lo usa.
 */
import { CMS_SLUG, SHOP_API_URL } from './site';

// ───────────── Tipos del contrato ─────────────

export interface CustomerAddress {
  id: string;
  label?: string;
  recipientName?: string;
  phone?: string;
  address: string;
  city: string;
  department?: string;
  country?: string;
  postalCode?: string;
  notes?: string;
  isDefault?: boolean;
}
export type AddressInput = Omit<CustomerAddress, 'id'>;

export interface Customer {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  documentType?: string | null;
  documentId?: string | null;
  addresses: CustomerAddress[];
  acceptsMarketing?: boolean;
  createdAt?: string;
}

export interface CustomerOrderSummary {
  orderNumber: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  currency?: string;
  createdAt: string;
  itemsCount?: number;
  items: Array<{ title: string; quantity: number; imageUrl?: string | null }>;
  carrierName?: string | null;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
  canRetry?: boolean;
}
export interface Paged<T> {
  items: T[];
  total: number;
  page: number;
  totalPages: number;
}

export interface PublicOrderSummary {
  orderNumber: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  currency?: string;
  destinationCity?: string;
  items?: Array<{ title: string; quantity: number; unitPrice?: number; imageUrl?: string | null; variantLabel?: string | null }>;
}

export interface ConfirmPaymentResult {
  orderNumber?: string;
  /** Estado del pago en la orden: PENDING | PAID | FAILED | REFUNDED. */
  paymentStatus?: string;
  /** Estado en la pasarela: APPROVED | DECLINED | VOIDED | ERROR | PENDING. */
  gatewayStatus?: string;
  canRetry?: boolean;
  duplicatePayment?: boolean;
  order?: PublicOrderSummary | null;
}

export interface RetryPaymentResult {
  orderNumber: string;
  reference: string;
  totalAmount: number;
  currency?: string;
  checkoutUrl: string;
  redirectUrl?: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
  phone?: string;
  acceptsMarketing?: boolean;
  acceptsTerms: true;
  claimOrders?: Array<{ orderNumber: string; claimToken: string }>;
}

export interface AuthResult {
  token: string;
  customer: Customer;
  claimedOrders?: string[];
}

/** Error de la API de la tienda: `code` del contrato (EMAIL_TAKEN, INVALID_CREDENTIALS, PAYMENT_FAILED…) y mensaje en español. */
export class ShopError extends Error {
  status: number;
  code: string;
  data: Record<string, any>;
  constructor(status: number, code: string, message: string, data: Record<string, any> = {}) {
    super(message);
    this.name = 'ShopError';
    this.status = status;
    this.code = code;
    this.data = data;
  }
}

export interface TokenStorage {
  get(): string | null;
  set(token: string | null): void;
}

/** Token en localStorage (`ltn_shop_<slug>`); sin navegador o con el almacenamiento bloqueado, en memoria. */
export function localTokenStorage(key: string): TokenStorage {
  let memory: string | null = null;
  return {
    get() {
      try {
        return typeof window === 'undefined' ? memory : window.localStorage.getItem(key);
      } catch {
        return memory;
      }
    },
    set(token) {
      memory = token;
      try {
        if (typeof window === 'undefined') return;
        if (token) window.localStorage.setItem(key, token);
        else window.localStorage.removeItem(key);
      } catch {}
    },
  };
}

export const tokenKey = (slug: string) => `ltn_shop_${slug}`;

// ───────────── Cliente ─────────────

export interface ShopClientOptions {
  apiUrl: string;
  slug: string;
  storage?: TokenStorage;
  fetch?: typeof fetch;
}

export function createShopClient({ apiUrl, slug, storage = localTokenStorage(tokenKey(slug)), fetch: f }: ShopClientOptions) {
  const base = apiUrl.replace(/\/$/, '');
  const doFetch: typeof fetch = f || ((...a) => fetch(...a));
  const s = encodeURIComponent(slug);

  async function request<T>(method: string, path: string, body?: unknown, { auth = false }: { auth?: boolean } = {}): Promise<T> {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    const token = storage.get();
    if (auth && token) headers.Authorization = `Bearer ${token}`;
    let res: Response;
    try {
      res = await doFetch(`${base}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body), cache: 'no-store' });
    } catch {
      throw new ShopError(0, 'NETWORK', 'Sin conexión con la tienda.');
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = Array.isArray(data?.message) ? data.message.join(' ') : typeof data?.message === 'string' ? data.message : '';
      // Un token vencido o revocado (logout-all, cambio de contraseña) deja de servir: se descarta.
      if (auth && res.status === 401 && token) storage.set(null);
      throw new ShopError(res.status, String(data?.code || data?.error || res.status), msg, data);
    }
    return data as T;
  }

  const acct = `/api/shop/${s}/account`;
  const shop = `/api/ecommerce/public/${s}`;
  const keep = (r: AuthResult) => {
    if (r?.token) storage.set(r.token);
    return r;
  };

  const account = {
    getToken: () => storage.get(),
    setToken: (t: string | null) => storage.set(t),
    isLoggedIn: () => Boolean(storage.get()),
    register: (input: RegisterInput) => request<AuthResult>('POST', `${acct}/register`, input).then(keep),
    login: (email: string, password: string) => request<AuthResult>('POST', `${acct}/login`, { email, password }).then(keep),
    /** Cierra la sesión en este navegador (el token deja de enviarse). */
    logout: () => storage.set(null),
    forgotPassword: (email: string, resetUrl: string) => request<{ sent: boolean }>('POST', `${acct}/forgot-password`, { email, resetUrl }),
    resetPassword: (token: string, password: string) => request<AuthResult>('POST', `${acct}/reset-password`, { token, password }).then(keep),
    me: () => request<{ customer: Customer }>('GET', `${acct}/me`, undefined, { auth: true }).then((r) => r.customer),
    update: (patch: Partial<Pick<Customer, 'name' | 'phone' | 'documentType' | 'documentId' | 'acceptsMarketing'>>) =>
      request<{ customer: Customer }>('PATCH', `${acct}/me`, patch, { auth: true }).then((r) => r.customer),
    changePassword: (currentPassword: string, newPassword: string) => request<AuthResult>('POST', `${acct}/me/password`, { currentPassword, newPassword }, { auth: true }).then(keep),
    logoutAll: async () => {
      const r = await request<{ ok: boolean }>('POST', `${acct}/me/logout-all`, undefined, { auth: true });
      storage.set(null);
      return r;
    },
    delete: async (password: string) => {
      const r = await request<{ deleted: boolean }>('DELETE', `${acct}/me`, { password }, { auth: true });
      storage.set(null);
      return r;
    },
    addresses: {
      list: () => request<{ addresses: CustomerAddress[] }>('GET', `${acct}/me/addresses`, undefined, { auth: true }).then((r) => r.addresses),
      create: (a: AddressInput) => request<{ addresses: CustomerAddress[] }>('POST', `${acct}/me/addresses`, a, { auth: true }).then((r) => r.addresses),
      update: (id: string, a: Partial<AddressInput>) =>
        request<{ addresses: CustomerAddress[] }>('PATCH', `${acct}/me/addresses/${encodeURIComponent(id)}`, a, { auth: true }).then((r) => r.addresses),
      remove: (id: string) => request<{ addresses: CustomerAddress[] }>('DELETE', `${acct}/me/addresses/${encodeURIComponent(id)}`, undefined, { auth: true }).then((r) => r.addresses),
    },
    orders: {
      list: (page = 1, limit = 10) => request<Paged<CustomerOrderSummary>>('GET', `${acct}/me/orders?page=${page}&limit=${limit}`, undefined, { auth: true }),
      get: (orderNumber: string) => request<any>('GET', `${acct}/me/orders/${encodeURIComponent(orderNumber)}`, undefined, { auth: true }),
    },
  };

  return {
    account,
    /** Configuración pública de la tienda (métodos de pago, `customerAccounts`). */
    config: () => request<any>('GET', `${shop}/config`),
    /** Checkout: envía el token del cliente si hay sesión (la orden queda en su cuenta). */
    checkout: (body: Record<string, unknown>) => request<any>('POST', `${shop}/checkout`, body, { auth: true }),
    /** Registra el resultado de la pasarela (aprobado o no): el backend lo verifica con la pasarela. */
    confirmPayment: (input: { transactionId: string; orderNumber: string }) => request<ConfirmPaymentResult>('POST', `${shop}/payments/wompi/confirm-order`, input),
    /** Nuevo intento de pago de una orden pendiente o rechazada (correo de la orden o sesión del dueño). */
    retryPayment: (orderNumber: string, input: { email?: string; redirectUrl?: string } = {}) =>
      request<RetryPaymentResult>('POST', `${shop}/orders/${encodeURIComponent(orderNumber)}/retry-payment`, input, { auth: true }),
    /** Rastreo público. Una orden con pago rechazado responde 409 `PAYMENT_FAILED` (ShopError con `data.canRetry`). */
    track: (code: string) => request<any>('GET', `${shop}/track/${encodeURIComponent(code.trim())}`),
  };
}

export type ShopClient = ReturnType<typeof createShopClient>;

/** Cliente de la tienda de este sitio. */
export const shop = createShopClient({ apiUrl: SHOP_API_URL, slug: CMS_SLUG });

/** Primer nombre para saludos ("Ana María López" → "Ana"). */
export const firstName = (name?: string | null) =>
  String(name || '')
    .trim()
    .split(/\s+/)[0] || '';
