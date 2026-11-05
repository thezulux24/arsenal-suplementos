import type { Product } from './cms';

const cop = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

export function formatCop(n: number) {
  return cop.format(Math.round(n || 0)).replace(/ /g, ' ');
}

/** The one comparative figure every product carries: price per unit, or per 100 g for powders. */
export function unitPrice(p: Product): string | null {
  if (!p.price) return null;
  if (p.units && p.units > 0) {
    const label = p.unitLabel || 'unidad';
    return `${formatCop(p.price / p.units)} por ${label}`;
  }
  if (p.netGrams && p.netGrams > 0) {
    return `${formatCop((p.price / p.netGrams) * 100)} por 100 g`;
  }
  return null;
}

export function waLink(number: string | undefined, text: string) {
  const digits = String(number || '').replace(/\D/g, '');
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}
