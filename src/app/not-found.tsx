'use client';

import Link from 'next/link';
import { CmsGlobalText, useGlobal } from '@latinovation/cms-client/react';
import { Frame } from '@/components/Ornaments';

/** 404 con los textos de globalData.site.notFound (editables desde el portal). */
export default function NotFound() {
  const href = useGlobal<string>('site.notFound.ctaHref', '/tienda');
  return (
    <div className="wrap notfound">
      <Frame className="status-tile" tone="mustard">
        <p className="order-code" aria-hidden="true">
          404
        </p>
        <CmsGlobalText f="site.notFound.title" as="h1" />
        <CmsGlobalText f="site.notFound.text" as="p" className="lede" />
        <div className="wall__actions">
          <Link href={href || '/tienda'} className="plaque">
            <CmsGlobalText f="site.notFound.ctaLabel" />
          </Link>
        </div>
      </Frame>
    </div>
  );
}
