# TusPlatos · tienda en línea

Storefront headless de **TusPlatos** (vajillas, platos, tazas y mugs, té y café, bowls y servir, decoración; Cali, Colombia), hecho con Next.js 15 sobre el SDK **`@latinovation/cms-client` 4.1** de WebProAI / Latinovation CMS. Todo lo que se ve —textos, fotos, enlaces, productos, menú, pie, colores y tipografías— vive en el proyecto `tusplatos` del CMS y se edita desde `/portal`.

- CMS: `https://webproai.tech`, proyecto `tusplatos` (colección `productos`, 47 piezas).
- Delivery público: `GET https://webproai.tech/api/v1/delivery/tusplatos`.
- Mundo visual: «estación de azulejos» (ver [DESIGN.md](DESIGN.md)).

## Cómo se edita

La tienda usa el SDK de punta a punta:

| Qué | Cómo |
|---|---|
| Páginas | `<CmsPage pageSlug>` pinta las secciones del CMS en su orden; cada una queda en `<CmsSection>` (estilos `_style`, anclas, ocultar por dispositivo, barra mover/duplicar/borrar/agregar/Art en el editor). |
| Bloques | `src/components/blocks/registry.tsx`: claves propias (`categorias`, `catalogo`, `ficha`, `pago`, `confirmacion`, `favoritos`, `buscar`) y **todos los tipos del catálogo** (`hero.*`, `products.catalog`, `content.split`, `features.grid`, `faq.accordion`, `cta.banner`, `gallery.grid`, `testimonials.grid`…). Un bloque que el cliente agregue desde el portal se pinta en azulejo; cualquier otro cae en `GenericSection` (cada campo con su primitivo editable, dentro de una cartela). |
| Textos, imágenes, enlaces, listas | `CmsText`, `CmsRichText`, `CmsImage` (con `next/image` vía `SmartImage`), `CmsLink`, `CmsList`. |
| Productos | `CmsItem`, `CmsItemText`, `CmsItemImage`, `CmsAddItem`: nombre, marca, categoría, color, estilo, material, medidas, precio, fotos y descripción se editan en la propia tarjeta o ficha. |
| Globales y menú | `CmsGlobalText` (marca, anuncio, WhatsApp, horario, textos del carrito, sellos…), `CmsNav` / `CmsNavText` (menú y pie). |
| Design system | `globalData.designSystem` v2 → variables `--cms-*` → tokens del azulejo (`--cobalt`, `--milk`, `--wash`, `--mustard`…). Cambiar la paleta, las fuentes, el radio de los botones o el movimiento en el portal cambia toda la tienda. |
| 404 | `globalData.site.notFound` (título, texto, botón). |

Modo editor: el portal carga la tienda en un iframe con `?preview=1&builder=1&previewToken=…`. `next.config.mjs` envía `Content-Security-Policy: frame-ancestors` con el CMS y `NEXT_PUBLIC_PORTAL_ORIGINS`.

### Contenido como código

El modelo de contenido está en [`cms/seed-tusplatos/build-manifest.mjs`](cms/seed-tusplatos/build-manifest.mjs) (páginas, secciones con `schema` para el inspector, globales, `globalSchema`, design system, menú, SEO, redirecciones). Los productos no se tocan.

```bash
npm run cms:pull      # ltn pull tusplatos --out ./cms  (snapshot actual, incluye productos)
npm run cms:build     # reescribe páginas/globales/menú/SEO en cms/tusplatos.snapshot.json
npm run cms:diff      # ltn push --dry-run --skip-collections
npm run cms:push      # ltn push --overwrite --skip-collections (crea respaldo y queda en vivo)
```

Requiere `CMS_API_TOKEN` en el entorno y el monorepo del CMS en `../cms-landings`.

### Auditoría de editabilidad

```bash
npm run build && npx next start -p 3010
npm run cms:audit     # bin/audit-editability.mjs --slug tusplatos --url http://localhost:3010 --item-route /producto/:slug --min 95
```

Resultado actual: **328/344 = 95,3 %**. Lo que falta son textos que solo aparecen en un estado (pago aprobado/rechazado, sin resultados, pago en línea mientras la pasarela no tenga llave pública).

## Tienda

- `/tienda`: búsqueda al instante, filtros (categoría, estilo, color con muestras, material, marca, rango de precio, piezas, puestos, hecho en Colombia, pintado a mano, microondas, lavavajillas, en oferta, disponible) con conteos por faceta (`queryCollection` del SDK), chips activos, limpiar todo, orden (relevancia, precio ↑↓, novedades, nombre), cuadrícula/lista, «cargar más», estado en la URL (`?categoria=Vajillas&color=Azul&precio=20000-150000…`) y cajón de filtros en móvil. Los filtros se configuran en la sección `catalogo` de `/tienda` (campo `filters`).
- `/categoria/<slug>`: landing estática por categoría.
- `/producto/<slug>`: galería con miniaturas y zoom (cursor o toque), fotos de ambiente, variantes si existen, cantidad, stock, entrega y pagos, detalles, descripción, cuidados, «Completa tu mesa», relacionados, migas y botón fijo en móvil. JSON-LD `Product`/`Offer`/`BreadcrumbList`, OG con las fotos del producto.
- Vista rápida, favoritos (`/favoritos`, localStorage), vistos recientemente, buscador con sugerencias en la cabecera y `/buscar`.
- Carrito en cajón con barra de envío gratis, cantidades, quitar y nota del pedido.
- `/checkout` contra `POST /api/ecommerce/public/tusplatos/checkout` (el servidor recalcula precios y stock). Solo muestra los medios de pago que la tienda tiene activos (`/config`): pago en línea únicamente si la pasarela tiene llave pública. `/pedido` confirma (y lee el resultado de la pasarela), `/rastreo` sigue el pedido.
- `sitemap.xml`, `robots.txt`, JSON-LD `Store`, 404 del CMS, `/api/revalidate` para el webhook de publicación.

## Desarrollo

```bash
npm install
npm run dev          # http://localhost:3010
npm run typecheck
npm run build
```

Variables: ver [`.env.example`](.env.example).

### Actualizar el SDK

El SDK vive en `cms-landings/packages/cms-client` y se instala como tarball versionado en `vendor/` (así la imagen de Docker no necesita el monorepo):

```bash
cd ../cms-landings/packages/cms-client && npm pack          # → latinovation-cms-client-4.1.0.tgz
mv latinovation-cms-client-*.tgz ../../../tienda-bienestar/vendor/
cd ../../../tienda-bienestar && npm install ./vendor/latinovation-cms-client-4.1.0.tgz
git add vendor package.json package-lock.json
```

## Despliegue (Coolify)

Dockerfile multi-etapa (`output: 'standalone'`), copia `vendor/` antes de `npm ci`. Build args: `NEXT_PUBLIC_CMS_URL`, `NEXT_PUBLIC_CMS_SLUG=tusplatos`, `NEXT_PUBLIC_SITE_URL` (dominio público de la tienda), `NEXT_PUBLIC_PORTAL_ORIGINS`. Variable de ejecución: `CMS_WEBHOOK_SECRET`. Puerto 3000.

Después de desplegar:
1. Poner el dominio de la tienda en `productionUrl` del proyecto o agregarlo como dominio (`ltn domains add tusplatos --domain …`), para que el regreso de la pasarela a `/pedido` sea aceptado.
2. Configurar `webhookUrl = https://<tienda>/api/revalidate` y el mismo secreto (SUPERADMIN).
3. Cargar la llave pública e integridad de la pasarela en la tienda (`ltn shop config set tusplatos …`) para activar el pago en línea.
