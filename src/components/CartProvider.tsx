'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Product } from '@/lib/cms';

export type CartLine = {
  productId: string;
  slug: string;
  title: string;
  brand?: string;
  presentation?: string;
  unitPrice: number;
  imageUrl?: string;
  quantity: number;
  stock?: number;
};

type CartCtx = {
  lines: CartLine[];
  count: number;
  subtotal: number;
  open: boolean;
  pulse: number;
  setOpen: (v: boolean) => void;
  add: (p: Product, qty?: number) => void;
  setQty: (productId: string, qty: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
};

const Ctx = createContext<CartCtx | null>(null);
const KEY = 'arsenal.cart.v1';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [open, setOpen] = useState(false);
  const [pulse, setPulse] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) setLines(JSON.parse(raw));
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(KEY, JSON.stringify(lines));
    } catch {}
  }, [lines, ready]);

  const add = useCallback((p: Product, qty = 1) => {
    setLines((prev) => {
      const max = typeof p.stock === 'number' && p.stock > 0 ? p.stock : 99;
      const found = prev.find((l) => l.productId === p.id);
      if (found) {
        return prev.map((l) => (l.productId === p.id ? { ...l, quantity: Math.min(max, l.quantity + qty) } : l));
      }
      return [
        ...prev,
        {
          productId: p.id,
          slug: p.slug,
          title: p.title,
          brand: p.brand,
          presentation: p.presentation,
          unitPrice: p.price,
          imageUrl: p.imageUrl,
          quantity: Math.min(max, qty),
          stock: p.stock,
        },
      ];
    });
    setPulse((n) => n + 1);
  }, []);

  const setQty = useCallback((productId: string, qty: number) => {
    setLines((prev) =>
      prev
        .map((l) => {
          const max = typeof l.stock === 'number' && l.stock > 0 ? l.stock : 99;
          return l.productId === productId ? { ...l, quantity: Math.max(0, Math.min(max, qty)) } : l;
        })
        .filter((l) => l.quantity > 0),
    );
  }, []);

  const remove = useCallback((productId: string) => setLines((prev) => prev.filter((l) => l.productId !== productId)), []);
  const clear = useCallback(() => setLines([]), []);

  const value = useMemo(() => {
    const count = lines.reduce((a, l) => a + l.quantity, 0);
    const subtotal = lines.reduce((a, l) => a + l.quantity * l.unitPrice, 0);
    return { lines, count, subtotal, open, pulse, setOpen, add, setQty, remove, clear };
  }, [lines, open, pulse, add, setQty, remove, clear]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
