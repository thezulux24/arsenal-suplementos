const cop = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

export function formatCop(n: unknown): string {
  const v = typeof n === 'number' ? n : Number(n);
  if (!Number.isFinite(v)) return '';
  return cop.format(Math.round(v)).replace(/\s/g, ' ');
}

/** Rellena plantillas del CMS: "Quedan {n} unidades", "Te faltan {monto}…". */
export function fill(template: unknown, vars: Record<string, string | number>): string {
  return String(template ?? '').replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
}

export function waLink(number: unknown, text: string): string {
  const digits = String(number || '').replace(/\D/g, '');
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export function slugify(s: unknown): string {
  return String(s ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function plural(n: number, one: string, many: string) {
  return n === 1 ? one : many;
}
