'use client';

import React from 'react';
import { useCms } from './CmsProvider';

/**
 * Text that comes from a CMS section field. In the /portal builder it becomes
 * contentEditable and sends the edit back to the editor on blur.
 */
export function T({
  s,
  f,
  as: Tag = 'span',
  className,
  fallback = '',
}: {
  s: { id: string; key: string; data: Record<string, any> };
  f: string;
  as?: any;
  className?: string;
  fallback?: string;
}) {
  const { isBuilder, commitField } = useCms();
  const value = (s.data?.[f] ?? fallback) as string;
  if (!value && !isBuilder) return null;
  if (!isBuilder) return <Tag className={className}>{value}</Tag>;
  return (
    <Tag
      className={className}
      contentEditable
      suppressContentEditableWarning
      data-cms-field={f}
      onBlur={(e: React.FocusEvent<HTMLElement>) => {
        const next = e.currentTarget.innerText.trim();
        if (next !== value) commitField(s.key, s.id, f, next);
      }}
      onKeyDown={(e: React.KeyboardEvent<HTMLElement>) => {
        if (e.key === 'Enter' && Tag !== 'p') {
          e.preventDefault();
          (e.currentTarget as HTMLElement).blur();
        }
      }}
    >
      {value}
    </Tag>
  );
}

/** Wraps a CMS section so the /portal editor can find, highlight and select it. */
export function Section({
  s,
  id,
  className,
  children,
  as: Tag = 'section',
  label,
}: {
  s: { id: string; key: string };
  id?: string;
  className?: string;
  children: React.ReactNode;
  as?: any;
  label?: string;
}) {
  const { isBuilder, selectSection } = useCms();
  return (
    <Tag
      id={id}
      className={className}
      data-section-key={s.key}
      aria-label={label}
      onClickCapture={isBuilder ? () => selectSection(s.key, s.id) : undefined}
    >
      <span id={`cms-section-${s.key}`} className="section-anchor" aria-hidden="true" />
      {children}
    </Tag>
  );
}
