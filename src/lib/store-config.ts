import { CMS_SLUG, SHOP_API_URL } from './site';

export interface StoreConfig {
  paymentMethods?: Record<string, { enabled?: boolean; publicKey?: string; instructions?: string; bankDetails?: string }>;
  customerAccounts?: { enabled?: boolean; allowGuestCheckout?: boolean; privacyPolicyUrl?: string };
}

/** Configuración pública de la tienda (métodos de pago, cuentas de cliente). ISR 60 s con la etiqueta del webhook. */
export async function getStoreConfig(): Promise<StoreConfig | null> {
  try {
    const res = await fetch(`${SHOP_API_URL}/api/ecommerce/public/${CMS_SLUG}/config`, { next: { revalidate: 60, tags: [`cms:${CMS_SLUG}`] } });
    return res.ok ? ((await res.json()) as StoreConfig) : null;
  } catch {
    return null;
  }
}

/** Las cuentas solo existen si la tienda las activó (`customerAccounts.enabled`); por defecto, apagadas. */
export const accountsEnabled = (cfg: StoreConfig | null) => cfg?.customerAccounts?.enabled === true;
