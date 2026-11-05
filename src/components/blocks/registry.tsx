'use client';

import React from 'react';
import { CmsPage, defaultRegistry, type CmsRegistry } from '@latinovation/cms-client/react';
import { AlternatingRows, CategoryWall, CtaBanner, Faq, FeatureTiles, Hero, Newsletter, ProductShelf, Steps, Story } from './home';
import { Catalog, ShopRouteContext, type ShopRoute } from './catalog';
import { ProductDetail, ProductSlugContext } from './product';
import { Checkout, Confirmation, ContactForm, Favorites, SearchPage, StoreConfigContext, Tracking, type StoreConfig } from './pages';
import { Announcement, GalleryTiles, GenericSection, Hours, Locations, Logos, MediaImage, Quotes, RichBlock, StatTiles, Team, Video } from './generic';

/**
 * Registro de bloques. <CmsPage> busca por clave de sección, luego por tipo de bloque y luego por familia.
 * Las claves propias de TusPlatos van primero; los tipos del catálogo permiten que cualquier bloque que
 * el cliente agregue desde el portal se vea en el mundo de azulejos.
 */
export const registry: CmsRegistry = {
  ...defaultRegistry,
  // claves de las páginas de TusPlatos
  categorias: CategoryWall,
  catalogo: Catalog,
  ficha: ProductDetail,
  pago: Checkout,
  confirmacion: Confirmation,
  favoritos: Favorites,
  buscar: SearchPage,
  // tipos del catálogo de bloques
  hero: Hero,
  'products.catalog': ProductShelf,
  'collection.list': ProductShelf,
  'content.split': Story,
  'content.richtext': RichBlock,
  'features.grid': FeatureTiles,
  'features.alternating': AlternatingRows,
  'steps.process': Steps,
  'faq.accordion': Faq,
  'newsletter.signup': Newsletter,
  'cta.banner': CtaBanner,
  'contact.form': ContactForm,
  'tracking.order': Tracking,
  'gallery.grid': GalleryTiles,
  'stats.row': StatTiles,
  'testimonials.grid': Quotes,
  'logos.strip': Logos,
  'media.image': MediaImage,
  'media.video': Video,
  'announcement.bar': Announcement,
  'hours.schedule': Hours,
  'locations.map': Locations,
  'team.grid': Team,
};

export function SitePage({
  pageSlug,
  shop,
  productSlug = '',
  storeConfig = null,
}: {
  pageSlug: string;
  shop?: ShopRoute;
  productSlug?: string;
  storeConfig?: StoreConfig | null;
}) {
  return (
    <ShopRouteContext.Provider value={shop || { params: {} }}>
      <ProductSlugContext.Provider value={productSlug}>
        <StoreConfigContext.Provider value={storeConfig}>
          <CmsPage pageSlug={pageSlug} registry={registry} fallback={GenericSection} sectionClassName={(s) => `sec sec--${s.key}`} />
        </StoreConfigContext.Provider>
      </ProductSlugContext.Provider>
    </ShopRouteContext.Provider>
  );
}
