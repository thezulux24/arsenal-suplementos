import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import { mediaUrl } from '@latinovation/cms-client';
import { CmsProvider } from '@latinovation/cms-client/react';
import './globals.css';
import { CMS_SLUG, CMS_URL, getSite, PORTAL_ORIGINS, SITE_URL } from '@/lib/site';
import { ldScript, organizationLd } from '@/lib/seo';
import { StoreProvider } from '@/components/StoreProvider';
import { AccountProvider } from '@/components/AccountProvider';
import { accountsEnabled, getStoreConfig } from '@/lib/store-config';
import { CartDrawer } from '@/components/CartDrawer';
import { QuickView } from '@/components/QuickView';
import { Footer, Header, WhatsAppFloat } from '@/components/Shell';

// Marcellus dibuja 1 y 0 como I y O: los dígitos del rótulo salen de un subconjunto de Hanken Grotesk.
const figures = localFont({
  src: './fonts/hanken-figures.woff2',
  variable: '--font-figures',
  weight: '400 500',
  display: 'swap',
  fallback: [],
  adjustFontFallback: false,
  declarations: [{ prop: 'unicode-range', value: 'U+0030-0039' }],
});

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const p = await getSite();
  const seo = p.seo || {};
  const g = p.global || {};
  const brand = g.brandName || p.project.name || 'TusPlatos';
  const title = seo.metaTitle || brand;
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: title, template: `%s · ${brand}` },
    description: seo.metaDescription || g.tagline,
    icons: { icon: g.faviconUrl ? mediaUrl(g.faviconUrl, CMS_URL) : '/icon.svg' },
    openGraph: {
      title,
      description: seo.metaDescription || g.tagline,
      siteName: brand,
      locale: 'es_CO',
      type: 'website',
      images: seo.ogImage ? [{ url: mediaUrl(seo.ogImage, CMS_URL) }] : undefined,
    },
    robots: seo.robotsIndex === false ? { index: false, follow: false } : { index: true, follow: true },
  };
}

export const viewport: Viewport = {
  themeColor: '#1B3A8F',
  width: 'device-width',
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [site, storeConfig] = await Promise.all([getSite(), getStoreConfig()]);
  const accounts = storeConfig?.customerAccounts;
  return (
    <html lang="es-CO" className={figures.variable}>
      <head>
        <link rel="preload" href="/fonts/marcellus.woff2" as="font" type="font/woff2" crossOrigin="" />
        <link rel="preload" href="/fonts/hanken-grotesk.woff2" as="font" type="font/woff2" crossOrigin="" />
        <link rel="preconnect" href={CMS_URL} />
      </head>
      <body>
        <a href="#contenido" className="skip">
          Ir al contenido
        </a>
        {/* El provider detecta ?preview=1&builder=1&previewToken=… del portal; para los visitantes no cambia nada. */}
        <CmsProvider initial={site} slug={CMS_SLUG} cmsUrl={CMS_URL} allowedOrigins={PORTAL_ORIGINS}>
          <AccountProvider enabled={accountsEnabled(storeConfig)} allowGuestCheckout={accounts?.allowGuestCheckout !== false} privacyPolicyUrl={accounts?.privacyPolicyUrl || ''}>
            <StoreProvider>
              <Header />
              <main id="contenido">{children}</main>
              <Footer />
              <CartDrawer />
              <QuickView />
              <WhatsAppFloat />
            </StoreProvider>
          </AccountProvider>
        </CmsProvider>
        <script type="application/ld+json" dangerouslySetInnerHTML={ldScript(organizationLd(site))} />
      </body>
    </html>
  );
}
