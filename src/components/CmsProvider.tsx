'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { applyLiveState, CMS_SLUG, CMS_URL, fetchDelivery, type DeliveryPayload } from '@/lib/cms';

type CmsCtx = {
  payload: DeliveryPayload;
  isBuilder: boolean;
  isPreview: boolean;
  pageSlug: string;
  /** Tell the /portal editor which section was clicked. */
  selectSection: (sectionKey: string, sectionId?: string) => void;
  /** Push an inline text edit back to the /portal editor (builder mode only). */
  commitField: (sectionKey: string, sectionId: string, fieldKey: string, value: string) => void;
};

const Ctx = createContext<CmsCtx | null>(null);

const CMS_ORIGIN = new URL(CMS_URL).origin;

export function CmsProvider({
  initial,
  children,
}: {
  initial: DeliveryPayload;
  children: React.ReactNode;
}) {
  const pathname = usePathname() || '/';
  const pageSlug = pathToCmsPage(pathname);
  const [payload, setPayload] = useState<DeliveryPayload>(initial);
  const [isBuilder, setIsBuilder] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const liveRef = useRef<any>(null);

  useEffect(() => {
    setPayload(initial);
  }, [initial]);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const preview = q.get('preview') === '1' || q.get('preview') === 'true';
    const builder = q.get('builder') === '1';
    setIsPreview(preview || builder);
    setIsBuilder(builder && window.parent !== window);
    if (preview || builder) {
      fetchDelivery(true).then((draft) => {
        if (!draft) return;
        setPayload(liveRef.current ? applyLiveState(draft, liveRef.current, pageSlug) : draft);
      });
    } else {
      fetch(`${CMS_URL}/api/public/analytics/${CMS_SLUG}/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: 'pageview' }),
        keepalive: true,
      }).catch(() => {});
    }
  }, [pageSlug]);

  useEffect(() => {
    if (window.parent === window) return;
    const onMessage = (event: MessageEvent) => {
      if (event.source !== window.parent || event.origin !== CMS_ORIGIN) return;
      const msg = event.data;
      if (!msg || typeof msg !== 'object') return;
      if (msg.type === 'CMS_LIVE_PREVIEW_STATE') {
        liveRef.current = msg;
        setPayload((prev) => applyLiveState(prev, msg, pageSlug));
        if (msg.selectedSectionKey) {
          const el = document.getElementById(`cms-section-${msg.selectedSectionKey}`);
          if (el) {
            const r = el.getBoundingClientRect();
            if (r.top > window.innerHeight * 0.6 || r.bottom < window.innerHeight * 0.2) {
              el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }
        }
      }
      if (msg.type === 'CMS_SCROLL_TO_SECTION' && msg.sectionKey) {
        document.getElementById(`cms-section-${msg.sectionKey}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [pageSlug]);

  const post = useCallback((data: Record<string, unknown>) => {
    if (window.parent === window) return;
    window.parent.postMessage({ type: 'CMS_CANVAS_ACTION', ...data }, CMS_ORIGIN);
  }, []);

  const selectSection = useCallback(
    (sectionKey: string, sectionId?: string) => post({ action: 'SELECT_SECTION', sectionKey, sectionId }),
    [post],
  );

  const commitField = useCallback(
    (sectionKey: string, sectionId: string, fieldKey: string, value: string) =>
      post({ action: 'INLINE_FIELD_CHANGE', sectionKey, sectionId, fieldKey, value }),
    [post],
  );

  const value = useMemo(
    () => ({ payload, isBuilder, isPreview, pageSlug, selectSection, commitField }),
    [payload, isBuilder, isPreview, pageSlug, selectSection, commitField],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function pathToCmsPage(pathname: string) {
  if (pathname.startsWith('/producto')) return '/producto';
  if (pathname.startsWith('/checkout') || pathname.startsWith('/pedido')) return '/checkout';
  if (pathname.startsWith('/rastreo')) return '/rastreo';
  return '/';
}

export function useCms() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useCms must be used inside CmsProvider');
  return ctx;
}
