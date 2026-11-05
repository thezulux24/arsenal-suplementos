import type { Metadata, Viewport } from 'next';
import { Hanken_Grotesk, Marcellus } from 'next/font/google';
import localFont from 'next/font/local';
import './globals.css';
import { fetchDelivery, SITE_URL, type DeliveryPayload } from '@/lib/cms';
import { CmsProvider } from '@/components/CmsProvider';
import { CartProvider } from '@/components/CartProvider';
import { CartDrawer } from '@/components/CartDrawer';
import { Footer, Header, ThemeVars, WhatsAppFloat } from '@/components/Shell';
import { themeStyle } from '@/lib/theme';

const marcellus = Marcellus({ subsets: ['latin'], weight: '400', variable: '--font-marcellus', display: 'swap' });
// Marcellus draws 1 and 0 like I and O; display digits come from Hanken Grotesk instead.
const figures = localFont({
  src: './fonts/hanken-figures.woff2',
  variable: '--font-figures',
  weight: '400 500',
  display: 'swap',
  fallback: [],
  adjustFontFallback: false,
  declarations: [{ prop: 'unicode-range', value: 'U+0030-0039' }],
});
const hanken = Hanken_Grotesk({ subsets: ['latin'], variable: '--font-hanken', display: 'swap' });

export const revalidate = 30;

export async function generateMetadata(): Promise<Metadata> {
  const p = await fetchDelivery();
  const seo = p?.seo || {};
  const g = p?.global || {};
  const title = seo.metaTitle || g.brandName || 'Arsenal Suplementos';
  const description = seo.metaDescription || g.brandMonogram || '';
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: title, template: `%s · ${g.brandName || 'Arsenal Suplementos'}` },
    description,
    icons: { icon: seo.faviconUrl || '/icon.svg' },
    openGraph: {
      title,
      description,
      siteName: g.brandName,
      locale: 'es_CO',
      type: 'website',
      images: seo.ogImage ? [{ url: seo.ogImage }] : undefined,
    },
    robots: seo.robotsIndex === false ? { index: false, follow: false } : { index: true, follow: true },
  };
}

export const viewport: Viewport = {
  themeColor: '#1B3A8F',
  width: 'device-width',
  initialScale: 1,
};

const EMPTY: DeliveryPayload = {
  project: { id: '', name: 'Arsenal Suplementos', slug: 'arsenal' },
  global: {},
  seo: {},
  navigation: {},
  ecommerce: { enabled: true, currency: 'COP', freeShippingThreshold: 0, flatShippingRate: 0 },
  pages: [],
  collections: {},
  collectionDefinitions: {},
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const payload = (await fetchDelivery()) || EMPTY;
  return (
    <html lang="es-CO" className={`${figures.variable} ${marcellus.variable} ${hanken.variable}`} style={themeStyle(payload.global)}>
      <body>
        <CmsProvider initial={payload}>
          <CartProvider>
            <ThemeVars />
            <Header />
            <main id="contenido">{children}</main>
            <Footer />
            <CartDrawer />
            <WhatsAppFloat />
          </CartProvider>
        </CmsProvider>
      </body>
    </html>
  );
}
