'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { shop, tokenKey, type AuthResult, type Customer, type RegisterInput } from '@/lib/account';
import { CMS_SLUG } from '@/lib/site';

type AccountCtx = {
  /** La tienda tiene cuentas activas (`customerAccounts.enabled`). Si es false no se muestra nada de cuentas. */
  enabled: boolean;
  allowGuestCheckout: boolean;
  privacyPolicyUrl: string;
  customer: Customer | null;
  /** Comprobando la sesión guardada. */
  loading: boolean;
  /** Ya se sabe si hay sesión o no. */
  ready: boolean;
  login: (email: string, password: string) => Promise<AuthResult>;
  register: (input: RegisterInput) => Promise<AuthResult>;
  /** Guarda el resultado de una operación que entrega token (restablecer o cambiar contraseña). */
  adopt: (r: AuthResult) => void;
  setCustomer: (c: Customer) => void;
  logout: () => void;
  refresh: () => Promise<Customer | null>;
};

const Ctx = createContext<AccountCtx | null>(null);

export function AccountProvider({
  enabled,
  allowGuestCheckout = true,
  privacyPolicyUrl = '',
  children,
}: {
  enabled: boolean;
  allowGuestCheckout?: boolean;
  privacyPolicyUrl?: string;
  children: React.ReactNode;
}) {
  const [customer, setCustomerState] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [ready, setReady] = useState(!enabled);

  const refresh = useCallback(async () => {
    if (!enabled || !shop.account.getToken()) {
      setCustomerState(null);
      return null;
    }
    try {
      const c = await shop.account.me();
      setCustomerState(c);
      return c;
    } catch (e: any) {
      // 401: el cliente ya descartó el token. Sin red se conserva la sesión para el próximo intento.
      if (e?.status === 401 || e?.status === 404) setCustomerState(null);
      return null;
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    refresh().finally(() => {
      if (!alive) return;
      setLoading(false);
      setReady(true);
    });
    // Cerrar sesión en otra pestaña cierra también esta.
    const onStorage = (e: StorageEvent) => {
      if (e.key === tokenKey(CMS_SLUG)) refresh();
    };
    window.addEventListener('storage', onStorage);
    return () => {
      alive = false;
      window.removeEventListener('storage', onStorage);
    };
  }, [enabled, refresh]);

  const adopt = useCallback((r: AuthResult) => {
    if (r?.token) shop.account.setToken(r.token);
    if (r?.customer) setCustomerState(r.customer);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const r = await shop.account.login(email, password);
    setCustomerState(r.customer);
    return r;
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const r = await shop.account.register(input);
    setCustomerState(r.customer);
    return r;
  }, []);

  const logout = useCallback(() => {
    shop.account.logout();
    setCustomerState(null);
  }, []);

  const value = useMemo<AccountCtx>(
    () => ({ enabled, allowGuestCheckout, privacyPolicyUrl, customer, loading, ready, login, register, adopt, setCustomer: setCustomerState, logout, refresh }),
    [enabled, allowGuestCheckout, privacyPolicyUrl, customer, loading, ready, login, register, adopt, logout, refresh],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAccount() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAccount debe usarse dentro de <AccountProvider>');
  return ctx;
}
