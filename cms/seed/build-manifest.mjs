// Builds cms/arsenal.snapshot.json, the code-first manifest pushed with:
//   node <cms-landings>/packages/cms-cli/bin/ltn.js push arsenal --overwrite --publish --file cms/arsenal.snapshot.json
// After the first push the CMS is the source of truth: run `ltn pull arsenal` before editing this again.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const products = JSON.parse(fs.readFileSync(path.join(here, 'products.json'), 'utf8'));
const media = JSON.parse(fs.readFileSync(path.join(here, 'media.json'), 'utf8'));
const current = JSON.parse(fs.readFileSync(path.join(here, '..', 'arsenal.snapshot.json'), 'utf8'));

const CMS = 'https://webproai.tech';
const img = (key, i = 0) => (media[key]?.[i] ? `${CMS}${media[key][i]}` : '');

const CATEGORIES = [
  'Fuerza y masa',
  'Energía y rendimiento',
  'Recuperación y sueño',
  'Colágeno y piel',
  'Defensas',
  'Omega y corazón',
  'Digestión y botánicos',
];

const GOAL_COPY = {
  'Fuerza y masa': ['Proteína y creatina para ganar fuerza y sostener el músculo.', 'creatine-healthy-sports-monohydrate-3000mg-x-300g'],
  'Energía y rendimiento': ['Pre-entreno, hidratación y glutamina para rendir en sesiones largas.', 'radical-nutramerican-green-apple-x-360g'],
  'Recuperación y sueño': ['Magnesio en cuatro formas y melatonina para cerrar el día.', 'glicinato-magnesio-fylmut-sabor-vainilla-x-450g'],
  'Colágeno y piel': ['Colágeno hidrolizado para piel, cabello, uñas y articulaciones.', 'colageno-hidrolizado-effekt-sin-sabor-300g'],
  Defensas: ['Vitaminas D3, C y B12 para la rutina de todos los días.', 'vitamin-d3-softgel-2000-iu-x-100und'],
  'Omega y corazón': ['Omega 3 de aceite de pescado en tres concentraciones.', 'fish-omega-3-healthy-america-1360mg-x-60-capsulas'],
  'Digestión y botánicos': ['Probióticos, cúrcuma y espirulina para la digestión.', 'probiotico-prebiotico-botanitas-polvo-x6g-x30-sobres'],
};

const sec = (key, name, order, schema, data) => ({ key, name, order, isVisible: true, schema, data });
const f = (key, label, type = 'text', extra = {}) => ({ key, label, type, ...extra });

const productKeys = products.map((p) => p.key);

const home = {
  title: 'Inicio',
  slug: '/',
  order: 0,
  isPublished: true,
  seoTitle: 'Arsenal Suplementos · Suplementos deportivos y de bienestar en Cali',
  sections: [
    sec('hero', '1. Muro de entrada', 0, [
      f('headline', 'Titular principal (H1)'),
      f('subheadline', 'Texto bajo el titular', 'textarea'),
      f('factLine', 'Dato clave (envío, registro)'),
      f('featuredProduct', 'Producto destacado (panel grande)', 'select', { options: productKeys }),
      f('sideProducts', 'Productos de la columna (claves separadas por coma)', 'textarea'),
      f('primaryCtaText', 'Botón agregar'),
      f('secondaryCtaText', 'Botón ver catálogo'),
    ], {
      headline: 'Suplementos para entrenar y descansar, despachados desde Cali',
      subheadline: 'Proteína, creatina, magnesio, colágeno y vitaminas de marcas que se venden en Colombia. Pagas con Wompi o pides asesoría por WhatsApp.',
      factLine: 'Envío gratis en Colombia desde $180.000 · Entrega en Cali en 24 horas',
      featuredProduct: 'creatine-healthy-sports-monohydrate-3000mg-x-300g',
      sideProducts: 'glicinato-magnesio-fylmut-sabor-vainilla-x-450g, iso-whey100-healthy-sports-x-908g, colageno-hidrolizado-effekt-sin-sabor-300g',
      primaryCtaText: 'Agregar al carrito',
      secondaryCtaText: 'Ver los 34 productos',
    }),
    sec('objetivos', '2. Paneles por objetivo', 1, [
      f('heading', 'Título de la sección'),
      f('intro', 'Introducción', 'textarea'),
    ], {
      heading: 'Elige por lo que tu cuerpo necesita',
      intro: 'Siete paneles, siete objetivos. Cada uno abre el catálogo filtrado.',
      columnsCount: '4',
      widgets: CATEGORIES.map((c, i) => ({
        id: `goal-${i + 1}`,
        type: 'feature_card',
        title: c,
        body: GOAL_COPY[c][0],
        imageUrl: img(GOAL_COPY[c][1]),
        ctaText: 'Ver productos',
        ctaHref: `/#catalogo?objetivo=${encodeURIComponent(c)}`,
        colSpan: 1,
      })),
    }),
    sec('catalogo', '3. Catálogo', 2, [
      f('heading', 'Título del catálogo'),
      f('intro', 'Introducción', 'textarea'),
      f('allLabel', 'Filtro: todos'),
      f('addLabel', 'Botón agregar'),
      f('soldOutLabel', 'Texto agotado'),
      f('emptyText', 'Texto sin resultados'),
    ], {
      heading: 'El catálogo completo',
      intro: 'Precios en pesos colombianos con IVA incluido. Cada ficha muestra el precio por unidad o por 100 g y el registro sanitario cuando ya está confirmado.',
      allLabel: 'Todos',
      addLabel: 'Agregar',
      soldOutLabel: 'Agotado',
      emptyText: 'Este panel está vacío por ahora. Escríbenos y lo conseguimos.',
    }),
    sec('envios', '4. Cómo compras desde Cali', 3, [
      f('heading', 'Título'),
      f('intro', 'Introducción', 'textarea'),
      f('carriersLine', 'Transportadoras'),
      f('paymentLine', 'Medios de pago'),
    ], {
      heading: 'Así llega tu pedido',
      intro: 'Despachamos desde Cali de lunes a sábado. Los pedidos pagados antes de las 2:00 p. m. salen el mismo día.',
      carriersLine: 'Coordinadora · Servientrega · Interrapidísimo · Envía',
      paymentLine: 'Wompi: tarjeta, PSE, Nequi y Bancolombia',
      columnsCount: '3',
      widgets: [
        { id: 'step-1', type: 'feature_card', badge: 'I', title: 'Arma tu pedido', body: 'Elige por objetivo o por marca. El carrito guarda tus productos aunque cierres la página.', colSpan: 1 },
        { id: 'step-2', type: 'feature_card', badge: 'II', title: 'Paga con Wompi', body: 'Tarjeta, PSE, Nequi o botón Bancolombia, en la pasarela segura de Wompi.', colSpan: 1 },
        { id: 'step-3', type: 'feature_card', badge: 'III', title: 'Recíbelo y rastréalo', body: 'Cali y Yumbo en 24 horas. Resto del país de 2 a 4 días hábiles, con número de guía.', colSpan: 1 },
      ],
    }),
    sec('asesoria', '5. Asesoría por WhatsApp', 4, [
      f('heading', 'Título'),
      f('body', 'Texto', 'textarea'),
      f('whatsappCta', 'Botón WhatsApp'),
      f('formTitle', 'Título del formulario'),
      f('submitText', 'Botón enviar'),
      f('successText', 'Mensaje enviado', 'textarea'),
    ], {
      heading: '¿No sabes cuál tomar? Pregúntanos',
      body: 'Cuéntanos qué entrenas, cómo duermes y qué buscas. Te respondemos por WhatsApp con dos o tres opciones y su precio. No reemplaza una consulta médica.',
      whatsappCta: 'Escribir por WhatsApp',
      formTitle: 'O déjanos tu pregunta',
      submitText: 'Enviar pregunta',
      successText: 'Recibimos tu pregunta. Te escribimos en horario de tienda.',
    }),
    sec('preguntas', '6. Preguntas frecuentes', 5, [
      f('heading', 'Título'),
    ], {
      heading: 'Preguntas frecuentes',
      widgets: [
        { id: 'faq-1', type: 'faq_item', title: '¿Los productos tienen registro INVIMA?', body: 'Vendemos marcas comercializadas en Colombia. Cuando el registro sanitario está publicado lo mostramos en la ficha; si no aparece, pídelo por WhatsApp y te enviamos la foto del empaque.' },
        { id: 'faq-2', type: 'faq_item', title: '¿Cuánto cuesta el envío?', body: '$9.900 a cualquier ciudad de Colombia. Gratis desde $180.000. Cali, Yumbo, Jamundí y Palmira reciben en 24 horas hábiles.' },
        { id: 'faq-3', type: 'faq_item', title: '¿Cómo pago?', body: 'Con Wompi: tarjeta débito o crédito, PSE, Nequi o botón Bancolombia. Al confirmar el pago te llega el número de pedido.' },
        { id: 'faq-4', type: 'faq_item', title: '¿Puedo cambiar un producto?', body: 'Sí, si llega sellado y en su empaque original dentro de los 5 días siguientes a la entrega. Escríbenos por WhatsApp con tu número de pedido.' },
        { id: 'faq-5', type: 'faq_item', title: '¿Los suplementos reemplazan la comida?', body: 'No. Los suplementos dietarios no son medicamentos y no suplen una alimentación equilibrada. Si estás embarazada, lactando o tomas medicamentos, consulta a tu médico.' },
      ],
    }),
  ],
};

const productPage = {
  title: 'Ficha de producto',
  slug: '/producto',
  order: 1,
  isPublished: true,
  sections: [
    sec('ficha', 'Ficha de producto', 0, [
      f('addLabel', 'Botón agregar'),
      f('howToUseLabel', 'Título modo de uso'),
      f('registrationLabel', 'Etiqueta registro sanitario'),
      f('noRegistrationText', 'Texto sin registro publicado'),
      f('shippingNote', 'Nota de envío', 'textarea'),
      f('legalNote', 'Advertencia legal', 'textarea'),
      f('relatedHeading', 'Título relacionados'),
      f('whatsappAsk', 'Botón preguntar por WhatsApp'),
    ], {
      addLabel: 'Agregar al carrito',
      howToUseLabel: 'Modo de uso',
      registrationLabel: 'Registro sanitario',
      noRegistrationText: 'Por confirmar',
      shippingNote: 'Sale desde Cali. Cali y Yumbo en 24 horas; resto del país de 2 a 4 días hábiles.',
      legalNote: 'Este producto es un suplemento dietario, no es un medicamento y no suple una alimentación equilibrada.',
      relatedHeading: 'Del mismo panel',
      whatsappAsk: 'Preguntar por este producto',
    }),
  ],
};

const checkoutPage = {
  title: 'Pago',
  slug: '/checkout',
  order: 2,
  isPublished: true,
  sections: [
    sec('pago', 'Formulario de pago', 0, [
      f('heading', 'Título'),
      f('contactHeading', 'Bloque contacto'),
      f('shippingHeading', 'Bloque envío'),
      f('summaryHeading', 'Resumen'),
      f('payButton', 'Botón pagar'),
      f('wompiNote', 'Nota Wompi', 'textarea'),
      f('emptyCart', 'Carrito vacío', 'textarea'),
    ], {
      heading: 'Finaliza tu pedido',
      contactHeading: 'Tus datos',
      shippingHeading: 'Dirección de entrega',
      summaryHeading: 'Tu pedido',
      payButton: 'Pagar con Wompi',
      wompiNote: 'Te llevamos a la pasarela segura de Wompi para pagar con tarjeta, PSE, Nequi o Bancolombia.',
      emptyCart: 'Tu carrito está vacío. Vuelve al catálogo y elige por objetivo.',
    }),
    sec('confirmacion', 'Confirmación de pedido', 1, [
      f('heading', 'Título'),
      f('body', 'Texto', 'textarea'),
      f('trackCta', 'Botón rastrear'),
    ], {
      heading: 'Pedido recibido',
      body: 'Guarda tu número de pedido. Cuando Wompi confirme el pago preparamos el despacho y te enviamos la guía.',
      trackCta: 'Rastrear mi pedido',
    }),
  ],
};

const trackPage = {
  title: 'Rastreo',
  slug: '/rastreo',
  order: 3,
  isPublished: true,
  sections: [
    sec('rastreo', 'Rastreo de pedido', 0, [
      f('heading', 'Título'),
      f('intro', 'Introducción', 'textarea'),
      f('inputLabel', 'Etiqueta del campo'),
      f('submitText', 'Botón buscar'),
      f('notFound', 'Pedido no encontrado', 'textarea'),
    ], {
      heading: 'Rastrea tu pedido',
      intro: 'Escribe tu número de pedido (empieza por ORD) o el número de guía de la transportadora.',
      inputLabel: 'Número de pedido o guía',
      submitText: 'Buscar pedido',
      notFound: 'No encontramos ese número. Revísalo o escríbenos por WhatsApp.',
    }),
  ],
};

const productSchema = [
  f('title', 'Nombre del producto'),
  f('brand', 'Marca'),
  f('category', 'Objetivo (filtro)', 'select', { options: CATEGORIES }),
  f('price', 'Precio COP', 'number'),
  f('compareAtPrice', 'Precio antes (opcional)', 'number'),
  f('presentation', 'Presentación'),
  f('units', 'Unidades por envase (cápsulas, sobres, barras)', 'number'),
  f('unitLabel', 'Nombre de la unidad'),
  f('netGrams', 'Contenido neto en gramos (polvos)', 'number'),
  f('servings', 'Porciones por envase', 'number'),
  f('invima', 'Registro sanitario INVIMA'),
  f('summary', 'Resumen corto'),
  f('description', 'Descripción', 'textarea'),
  f('howToUse', 'Modo de uso', 'textarea'),
  f('highlights', 'Puntos clave (separados por |)'),
  f('imageUrl', 'Foto principal (.webp)', 'image'),
  f('gallery', 'Fotos adicionales (URLs separadas por coma)', 'textarea'),
  f('stock', 'Unidades en inventario', 'number'),
];

const items = products.map((p, i) => {
  const { key, isFeatured, ...rest } = p;
  return {
    title: p.title,
    slug: key,
    status: 'PUBLISHED',
    isFeatured: Boolean(isFeatured),
    order: i,
    data: {
      ...rest,
      imageUrl: img(key),
      gallery: (media[key] || []).slice(1).map((u) => `${CMS}${u}`).join(', '),
      isFeatured: Boolean(isFeatured),
    },
  };
});

const manifest = {
  ...current,
  commitMessage: 'Arsenal Suplementos: estructura, catálogo y diseño desde código (Claude Code)',
  project: { ...current.project, name: 'Arsenal Suplementos', framework: 'NEXTJS', type: 'MULTI_PAGE', productionUrl: 'https://shop.bzuluaga.site' },
  globalSchema: [
    f('brandName', 'Nombre de la marca'),
    f('brandMonogram', 'Línea de la marca'),
    f('announcementText', 'Barra de anuncio'),
    f('whatsappNumber', 'WhatsApp (solo números, con 57)'),
    f('whatsappPrefill', 'Mensaje inicial de WhatsApp', 'textarea'),
    f('storeHours', 'Horario de atención'),
    f('footerAddress', 'Ubicación en el pie'),
    f('legalNote', 'Nota legal del pie', 'textarea'),
    f('imageCredit', 'Créditos de imágenes'),
    f('primaryColor', 'Cobalto profundo', 'color'),
    f('secondaryColor', 'Cobalto medio', 'color'),
    f('surfaceColor', 'Cobalto lavado', 'color'),
    f('backgroundColor', 'Blanco loza', 'color'),
    f('accentColor', 'Mostaza de marcos', 'color'),
    f('textColor', 'Tinta', 'color'),
  ],
  globalData: {
    brandName: 'Arsenal Suplementos',
    brandMonogram: 'Suplementos deportivos y de bienestar · Cali',
    announcementText: 'Envío gratis en Colombia desde $180.000 · Cali y Yumbo en 24 horas',
    whatsappNumber: '573000000000',
    whatsappPrefill: 'Hola Arsenal, quiero asesoría para elegir un suplemento.',
    storeHours: 'Lunes a sábado · 8:00 a. m. a 7:00 p. m.',
    footerAddress: 'Despachos desde Cali, Valle del Cauca',
    legalNote: 'Los suplementos dietarios no son medicamentos y no suplen una alimentación equilibrada. Consulta a tu médico si estás en embarazo, lactancia o bajo tratamiento.',
    imageCredit: 'Fotografías de producto: cortesía de cada fabricante.',
    primaryColor: '#1B3A8F',
    secondaryColor: '#3B63C4',
    surfaceColor: '#DCE5F6',
    backgroundColor: '#F7F6F1',
    accentColor: '#D9A21B',
    textColor: '#13265C',
    mutedTextColor: '#4A5B8A',
    headingFont: 'Marcellus',
    bodyFont: 'Hanken Grotesk',
    borderRadius: '2px',
    themeMode: 'light',
    designSystem: {
      name: 'Estación de azulejos',
      primaryColor: '#1B3A8F',
      secondaryColor: '#3B63C4',
      accentColor: '#D9A21B',
      backgroundColor: '#F7F6F1',
      altBackgroundColor: '#DCE5F6',
      textColor: '#13265C',
      mutedTextColor: '#4A5B8A',
      cardBg: '#FFFFFF',
      cardText: '#13265C',
      headingFont: 'serif',
      bodyFont: 'sans',
      borderRadius: '2px',
      themeMode: 'light',
    },
  },
  seoConfig: {
    metaTitle: 'Arsenal Suplementos · Suplementos deportivos y de bienestar en Cali',
    metaDescription: 'Proteína, creatina, magnesio, colágeno, omega 3 y vitaminas de marcas que se venden en Colombia. Despachos desde Cali a todo el país. Paga con Wompi.',
    ogImage: img('creatine-healthy-sports-monohydrate-3000mg-x-300g'),
    faviconUrl: '',
    robotsIndex: true,
  },
  navigationConfig: {
    headerLinks: [
      { id: 'n1', label: 'Objetivos', href: '/#objetivos', isVisible: true },
      { id: 'n2', label: 'Catálogo', href: '/#catalogo', isVisible: true },
      { id: 'n3', label: 'Envíos', href: '/#envios', isVisible: true },
      { id: 'n4', label: 'Rastrear pedido', href: '/rastreo', isVisible: true },
    ],
    headerCtaText: 'Asesoría por WhatsApp',
    promoBanner: { enabled: true },
  },
  pages: [home, productPage, checkoutPage, trackPage],
  collections: [
    {
      name: 'Productos',
      singularName: 'Producto',
      slug: 'productos',
      description: 'Catálogo de Arsenal Suplementos. La categoría es el objetivo que filtra la tienda.',
      order: 0,
      schema: productSchema,
      items,
    },
  ],
};

fs.writeFileSync(path.join(here, '..', 'arsenal.snapshot.json'), JSON.stringify(manifest, null, 2));
console.log(`manifest: ${manifest.pages.length} pages, ${items.length} products, ${CATEGORIES.length} categories`);
