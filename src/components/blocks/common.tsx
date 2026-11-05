'use client';

import React from 'react';
import { CmsContainer, CmsText } from '@latinovation/cms-client/react';
import { CMS_SLUG, CMS_URL } from '@/lib/site';

/** Cabecera de banda: título h2 y entrada (alineada a la derecha en escritorio). Nada encima del título. */
export function BandHead({ heading = 'heading', intro = 'intro', as = 'h2', className = '' }: { heading?: string; intro?: string; as?: React.ElementType; className?: string }) {
  return (
    <div className={`band__head ${className}`}>
      <CmsText f={heading} as={as} />
      <CmsText f={intro} as="p" className="lede" />
    </div>
  );
}

export function Wrap({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <CmsContainer className={`wrap ${className}`}>{children}</CmsContainer>;
}

export type LeadState = 'idle' | 'sending' | 'done' | 'error';

/** Envía un formulario a los leads del CMS (POST /api/public/leads/:slug). */
export async function sendLead(body: Record<string, unknown>) {
  const res = await fetch(`${CMS_URL}/api/public/leads/${CMS_SLUG}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sourcePage: typeof window !== 'undefined' ? window.location.href : '', ...body }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(typeof data?.message === 'string' ? data.message : 'error');
  }
}

export const toRoman = (n: number) => ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'][n] || String(n + 1);
