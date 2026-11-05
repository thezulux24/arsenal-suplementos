'use client';

import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { CmsGlobalText, CmsText, useCms } from '@latinovation/cms-client/react';

/**
 * Los estados de una vista (mensajes, paneles, pasos) se pintan en el servidor y se muestran u ocultan con
 * `hidden`: así cada texto existe en el lienzo del portal (en el editor se ven todos para editarlos) y las
 * regiones vivas ya están en el DOM cuando cambian.
 */
export function useReveal() {
  const { isBuilder } = useCms();
  return (cond: boolean) => !(isBuilder || cond);
}

/** Mensaje de formulario con texto del CMS. `role="alert"` para errores, `status` para confirmaciones. */
export function Msg({ f, show, tone = 'ok', children, className = '' }: { f: string; show: boolean; tone?: 'ok' | 'error'; children?: React.ReactNode; className?: string }) {
  const hidden = useReveal()(show);
  return (
    <p className={`form-msg${tone === 'error' ? ' form-msg--error' : ''} ${className}`} role={tone === 'error' ? 'alert' : 'status'} hidden={hidden}>
      <CmsText f={f} />
      {children}
    </p>
  );
}

/** Varios errores posibles de un formulario: se muestra el activo (clave del campo del CMS). */
export function Errors({ keys, active }: { keys: string[]; active: string }) {
  return (
    <>
      {keys.map((k) => (
        <Msg key={k} f={k} show={active === k} tone="error" />
      ))}
    </>
  );
}

/** Campo de contraseña con botón mostrar/ocultar (etiqueta accesible desde el global `showPasswordLabel`). */
export function PasswordInput({
  id,
  name = 'password',
  autoComplete = 'current-password',
  minLength,
  required = true,
  describedBy,
}: {
  id: string;
  name?: string;
  autoComplete?: string;
  minLength?: number;
  required?: boolean;
  describedBy?: string;
}) {
  const [shown, setShown] = useState(false);
  return (
    <div className="pw">
      <input
        id={id}
        name={name}
        type={shown ? 'text' : 'password'}
        autoComplete={autoComplete}
        minLength={minLength}
        required={required}
        aria-describedby={describedBy}
        spellCheck={false}
        autoCapitalize="none"
      />
      <button type="button" className="pw__toggle" aria-pressed={shown} aria-controls={id} onClick={() => setShown((v) => !v)}>
        {shown ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
        <CmsGlobalText f="showPasswordLabel" className="sr-only" />
      </button>
    </div>
  );
}

/** Casilla cuadrada del azulejo (mismo dibujo que los filtros). */
export function Check({
  name,
  children,
  required,
  defaultChecked,
  checked,
  onChange,
  id,
}: {
  name: string;
  children: React.ReactNode;
  required?: boolean;
  defaultChecked?: boolean;
  checked?: boolean;
  onChange?: (v: boolean) => void;
  id?: string;
}) {
  return (
    <label className="check" htmlFor={id}>
      <input id={id} type="checkbox" name={name} required={required} defaultChecked={defaultChecked} checked={checked} onChange={onChange ? (e) => onChange(e.target.checked) : undefined} />
      <span className="check__box" aria-hidden="true" />
      <span className="check__text">{children}</span>
    </label>
  );
}

/** Ruta interna segura para `?siguiente=` (nada de dominios externos). */
export function safeNext(v: string | null | undefined, fallback: string) {
  const s = String(v || '');
  return s.startsWith('/') && !s.startsWith('//') && !s.startsWith('/\\') ? s : fallback;
}
