'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Product } from '@latinovation/cms-client';
import { useGlobal } from '@latinovation/cms-client/react';

export type CartLine = {
  key: string;
  productId: string;
  slug: string;
  title: string;
  brand?: string;
  variantLabel?: string;
  unitPrice: number;
  imageUrl?: string;
  quantity: number;
  stock?: number;
};

type StoreCtx = {
  lines: CartLine[];
  count: number;
  subtotal: number;
  notes: string;
  setNotes: (v: string) => void;
  cartOpen: boolean;
  setCartOpen: (v: boolean) => void;
  pulse: number;
  add: (p: Product, qty?: number, variant?: { label: string; price?: number; stock?: number }) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  favorites: string[];
  isFavorite: (slug: string) => boolean;
  toggleFavorite: (slug: string) => void;
  recent: string[];
  markViewed: (slug: string) => void;
  quickView: string | null;
  openQuickView: (slug: string | null) => void;
  ready: boolean;
};

const Ctx = createContext<StoreCtx | null>(null);
const KEYS = { cart: 'tusplatos.cart.v1', notes: 'tusplatos.notes.v1', fav: 'tusplatos.favorites.v1', recent: 'tusplatos.recent.v1' };

function read<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, v: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(v));
  } catch {}
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [notes, setNotes] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [quickView, setQuickView] = useState<string | null>(null);
  const [pulse, setPulse] = useState(0);
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState('');
  const added = useGlobal<string>('cartAdded', '');
  const viewCart = useGlobal<string>('cartTitle', '');

  useEffect(() => {
    setLines(read(KEYS.cart, []));
    setNotes(read(KEYS.notes, ''));
    setFavorites(read(KEYS.fav, []));
    setRecent(read(KEYS.recent, []));
    setReady(true);
  }, []);
  useEffect(() => void (ready && write(KEYS.cart, lines)), [lines, ready]);
  useEffect(() => void (ready && write(KEYS.notes, notes)), [notes, ready]);
  useEffect(() => void (ready && write(KEYS.fav, favorites)), [favorites, ready]);
  useEffect(() => void (ready && write(KEYS.recent, recent)), [recent, ready]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const add = useCallback<StoreCtx['add']>(
    (p, qty = 1, variant) => {
      const key = variant ? `${p.id}::${variant.label}` : p.id;
      const stock = variant?.stock ?? p.stock;
      const max = typeof stock === 'number' && stock > 0 ? stock : 99;
      setLines((prev) => {
        const found = prev.find((l) => l.key === key);
        if (found) return prev.map((l) => (l.key === key ? { ...l, quantity: Math.min(max, l.quantity + qty) } : l));
        return [
          ...prev,
          {
            key,
            productId: p.id,
            slug: p.slug,
            title: p.title,
            brand: p.brand,
            variantLabel: variant?.label,
            unitPrice: variant?.price ?? p.price,
            imageUrl: p.imageUrl,
            quantity: Math.min(max, qty),
            stock,
          },
        ];
      });
      setPulse((n) => n + 1);
      setToast(`${added || '✓'} · ${p.title}`);
    },
    [added],
  );

  const setQty = useCallback((key: string, qty: number) => {
    setLines((prev) =>
      prev
        .map((l) => {
          const max = typeof l.stock === 'number' && l.stock > 0 ? l.stock : 99;
          return l.key === key ? { ...l, quantity: Math.max(0, Math.min(max, qty)) } : l;
        })
        .filter((l) => l.quantity > 0),
    );
  }, []);
  const remove = useCallback((key: string) => setLines((prev) => prev.filter((l) => l.key !== key)), []);
  const clear = useCallback(() => {
    setLines([]);
    setNotes('');
  }, []);
  const toggleFavorite = useCallback((slug: string) => setFavorites((f) => (f.includes(slug) ? f.filter((x) => x !== slug) : [slug, ...f])), []);
  const markViewed = useCallback((slug: string) => setRecent((r) => [slug, ...r.filter((x) => x !== slug)].slice(0, 12)), []);

  const value = useMemo<StoreCtx>(() => {
    const count = lines.reduce((a, l) => a + l.quantity, 0);
    const subtotal = lines.reduce((a, l) => a + l.quantity * l.unitPrice, 0);
    return {
      lines,
      count,
      subtotal,
      notes,
      setNotes,
      cartOpen,
      setCartOpen,
      pulse,
      add,
      setQty,
      remove,
      clear,
      favorites,
      isFavorite: (slug: string) => favorites.includes(slug),
      toggleFavorite,
      recent,
      markViewed,
      quickView,
      openQuickView: setQuickView,
      ready,
    };
  }, [lines, notes, cartOpen, pulse, add, setQty, remove, clear, favorites, toggleFavorite, recent, markViewed, quickView, ready]);

  return (
    <Ctx.Provider value={value}>
      {children}
      <div className={`toast${toast && !cartOpen ? ' is-on' : ''}`} role="status" aria-live="polite">
        <span>{toast}</span>
        {toast ? (
          <button
            type="button"
            className="toast__link"
            onClick={() => {
              setCartOpen(true);
              setToast('');
            }}
          >
            {viewCart}
          </button>
        ) : null}
      </div>
    </Ctx.Provider>
  );
}

export function useStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useStore debe usarse dentro de <StoreProvider>');
  return ctx;
}
