# Arsenal Suplementos · shop.bzuluaga.site

Tienda en línea de suplementos deportivos y de bienestar con despachos desde Cali. Es un storefront **headless** en Next.js 15: todo el contenido, el catálogo, las fotos, los colores, los pagos y el dominio viven en **WebProAI / Latinovation CMS Studio** (`https://webproai.tech`, proyecto `arsenal`). Este repo solo tiene el código que los pinta.

## Qué se edita en el CMS (sin tocar código)

Entra a `https://webproai.tech/portal?project=arsenal`:

| Qué | Dónde en el CMS |
| --- | --- |
| Titular, textos de portada, producto destacado y columna lateral | Página **Inicio** → sección `hero` |
| Paneles por objetivo (texto y foto de cada objetivo) | Inicio → `objetivos` → pestaña Tarjetas |
| Textos del catálogo, botones, texto de agotado | Inicio → `catalogo` |
| Pasos de envío, transportadoras, medios de pago | Inicio → `envios` |
| Bloque de asesoría y formulario (llega a **Leads CRM**) | Inicio → `asesoria` |
| Preguntas frecuentes | Inicio → `preguntas` → Tarjetas |
| Textos de la ficha de producto y advertencia legal | Página **Ficha de producto** → `ficha` |
| Textos del pago y la confirmación | Página **Pago** |
| Textos del rastreo | Página **Rastreo** |
| **Productos**: nombre, marca, objetivo, precio, precio antes, presentación, unidades, registro INVIMA, descripción, modo de uso, puntos clave, fotos, inventario, destacado | Colección **Productos** |
| Objetivos (filtros) | Opciones del campo *Objetivo* de la colección |
| Marca, anuncio, WhatsApp, horario, pie, nota legal, **colores del sistema de diseño** | Configuración global |
| Menú y botón de la cabecera | Navegación |
| Envío plano, envío gratis, transportadoras, Wompi | E-commerce |
| SEO (título, descripción, imagen) | SEO |

Los cambios se ven en la tienda al publicar (caché de 30 s). Los pedidos y su estado se gestionan en la pestaña de pedidos del portal; el inventario baja solo cuando Wompi aprueba el pago.

## Flujo code-first (agentes IA y desarrolladores)

El manifiesto del CMS está versionado en `cms/`:

```bash
npm run cms:pull    # baja el estado vivo del cliente a cms/arsenal.snapshot.json
npm run cms:build   # regenera el manifiesto desde cms/seed/*.json (productos, textos, esquemas)
npm run cms:push    # ltn push arsenal --overwrite --publish
```

Haz siempre `cms:pull` antes de `cms:push`: el push es autoritativo y reemplaza lo que el cliente editó (el CMS guarda un respaldo en Revisiones).

Los scripts asumen el repo del CMS clonado al lado (`../cms-landings`).

## Desarrollo

```bash
cp .env.example .env.local
npm install
npm run dev   # http://localhost:3010
```

## Despliegue

Coolify (VPS del CMS) construye el `Dockerfile` desde `main` y sirve el puerto 3000 en `https://shop.bzuluaga.site`.

DNS: registro **A** `shop` → `179.236.72.201` en la zona de `bzuluaga.site`.

## Vista previa en el editor

La tienda entiende el protocolo del editor del CMS: con `?preview=1` lee borradores, y dentro del iframe del portal recibe `CMS_LIVE_PREVIEW_STATE`, marca las secciones con `data-section-key` y permite editar textos en línea (`INLINE_FIELD_CHANGE`).

## Fuentes

- Productos, precios de referencia (COP, noviembre de 2026), registros sanitarios y fotografías de producto: catálogo público de Locatel Colombia y cada fabricante. Revisa precios e inventario antes de vender.
- Tipografías: Marcellus y Hanken Grotesk (Google Fonts, autoalojadas por Next.js).
