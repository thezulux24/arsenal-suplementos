#!/usr/bin/env node
/**
 * Modelo de contenido de TusPlatos como código (proyecto `tusplatos` en WebProAI CMS).
 *
 *   ltn pull tusplatos --out ./cms                       # 1. estado actual (productos incluidos)
 *   node cms/seed-tusplatos/build-manifest.mjs           # 2. reescribe páginas, globales, menú, SEO
 *   ltn push tusplatos --dry-run --file cms/tusplatos.snapshot.json
 *   ltn push tusplatos --overwrite --skip-collections --file cms/tusplatos.snapshot.json
 *
 * Solo toca páginas/secciones, globalData (+ design system v2), globalSchema, navegación, SEO y redirecciones.
 * Los 47 productos de la colección `productos` se conservan tal cual (--skip-collections).
 * Cada sección lleva `schema` para que el inspector del portal muestre todos sus campos.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..', '..');
const snapshotPath = path.join(root, 'cms', 'tusplatos.snapshot.json');
if (!fs.existsSync(snapshotPath)) {
  console.error('Falta cms/tusplatos.snapshot.json. Ejecuta primero: ltn pull tusplatos --out ./cms');
  process.exit(1);
}
const snap = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));

// ───────────── catálogo de bloques (esquemas del portal) ─────────────
const catalogPath = path.resolve(root, '..', 'cms-landings', 'shared', 'blocks.catalog.json');
const catalog = fs.existsSync(catalogPath) ? JSON.parse(fs.readFileSync(catalogPath, 'utf8')) : { blocks: [] };
const blocks = new Map((catalog.blocks || []).map((b) => [b.type, b]));
const catalogFields = (type) => {
  const b = blocks.get(type);
  if (!b) throw new Error(`Bloque ${type} no está en shared/blocks.catalog.json`);
  return JSON.parse(JSON.stringify(b.fields));
};

const t = (key, label, extra = {}) => ({ key, type: 'text', label, ...extra });
const ta = (key, label, extra = {}) => ({ key, type: 'textarea', label, ...extra });
const rt = (key, label) => ({ key, type: 'richtext', label });
const img = (key, label) => ({ key, type: 'image', label });
const link = (key, label) => ({ key, type: 'link', label });
const arr = (key, label, fields) => ({ key, type: 'array', label, fields });
const sel = (key, label, options) => ({ key, type: 'select', label, options: options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o)) });
const num = (key, label) => ({ key, type: 'number', label });
const bool = (key, label) => ({ key, type: 'boolean', label });

/** Sección de un bloque del catálogo + campos propios del sitio. */
const block = (type, key, name, data, extraSchema = []) => ({
  key,
  name,
  description: '',
  isVisible: true,
  schema: [...catalogFields(type), ...extraSchema.filter((f) => !catalogFields(type).some((c) => c.key === f.key))],
  data: { _block: type, ...data },
});
/** Sección propia del sitio (sin bloque del catálogo): el esquema lo define el sitio. */
const custom = (key, name, schema, data) => ({ key, name, description: '', isVisible: true, schema, data });

// ───────────── productos (para elegir fotos reales del catálogo) ─────────────
const items = (snap.collections || []).find((c) => c.slug === 'productos')?.items || [];
const bySlug = new Map(items.map((it) => [it.itemSlug || it.slug, it.data || it]));
const photo = (slug, which = 0) => {
  const p = bySlug.get(slug);
  if (!p) throw new Error(`Producto ${slug} no existe`);
  if (which === 'main') return p.imageUrl;
  const g = Array.isArray(p.gallery) ? p.gallery : String(p.gallery || '').split(',');
  return g[which] || p.imageUrl;
};

const FREE = 200000;
const FLAT = 12000;
const cop = (n) => `$${n.toLocaleString('es-CO').replace(/,/g, '.')}`;
const PAY = 'Paga con tarjeta débito o crédito, PSE, Nequi o Bancolombia';

// ───────────── páginas ─────────────
const home = {
  title: 'Inicio',
  slug: '/',
  description: 'Portada de la tienda',
  seoTitle: 'Vajillas, platos y tazas de cerámica',
  seoImage: photo('vajilla-azura-corona', 0),
  sections: [
    block(
      'hero.split',
      'hero',
      'Portada',
      {
        headline: 'Vajillas para la mesa de todos los días',
        subheadline: 'Vajillas completas, platos, mugs y piezas para servir de Corona, Corelle, Expressions y otras marcas que se consiguen en Colombia. Despachamos desde Cali a todo el país.',
        primaryCta: { label: 'Ver la tienda', href: '/tienda' },
        secondaryCta: { label: 'Vajillas completas', href: '/categoria/vajillas' },
        image: photo('vajilla-azura-corona', 0),
        imageAlt: 'Vajilla Azura de Corona servida sobre una mesa azul, frente a una pared de azulejos',
        imageSide: 'right',
        highlights: [{ text: `Envío gratis desde ${cop(FREE)}` }, { text: 'Tarjeta, PSE, Nequi o Bancolombia' }, { text: 'Despachos desde Cali' }],
        featuredProduct: 'vajilla-azura-corona',
        featuredLabel: 'En la foto',
        tone: 'default',
      },
      [t('featuredProduct', 'Producto de la foto (referencia del producto)'), t('featuredLabel', 'Etiqueta del producto de la foto')],
    ),
    block(
      'features.alternating',
      'categorias',
      'Categorías',
      {
        heading: 'Arma tu mesa',
        items: [
          { title: 'Vajillas', body: 'Juegos completos de 16 a 20 piezas para cuatro puestos.', image: photo('vajilla-congo-corona', 0), imageAlt: 'Vajilla Congo pintada a mano, servida en la mesa', link: { label: 'Ver vajillas', href: '/categoria/vajillas' } },
          { title: 'Platos', body: 'De cena, de postre, hondos y de presentación, por unidad.', image: photo('plato-de-cena-flores-azules-27-cm-siaki', 'main'), imageAlt: 'Plato de cena con flores azules', link: { label: 'Ver platos', href: '/categoria/platos' } },
          { title: 'Tazas y mugs', body: 'Mugs de 260 a 379 ml y sets para el café de la mañana.', image: photo('mug-yaku-260-ml-corona', 'main'), imageAlt: 'Mug Yaku de Corona', link: { label: 'Ver tazas y mugs', href: '/categoria/tazas-y-mugs' } },
          { title: 'Té y café', body: 'Teteras, sets de té, azucareras y cremeras.', image: photo('set-de-te-lia-corona', 1), imageAlt: 'Taza y plato del set de té Lía de Corona', link: { label: 'Ver té y café', href: '/categoria/te-y-cafe' } },
          { title: 'Bowls y servir', body: 'Bowls y sets para servir y compartir.', image: photo('set-de-3-bowls-esmalte-reactivo-expressions', 'main'), imageAlt: 'Set de tres bowls de esmalte reactivo', link: { label: 'Ver bowls', href: '/categoria/bowls-y-servir' } },
          { title: 'Decoración', body: 'Floreros de cerámica para la mesa y la casa.', image: photo('florero-ceramica-azul-28-cm-expressions', 'main'), imageAlt: 'Florero de cerámica azul', link: { label: 'Ver decoración', href: '/categoria/decoracion' } },
        ],
        countLabel: 'productos',
      },
      [t('countLabel', 'Texto después del número de productos')],
    ),
    block('products.catalog', 'destacados', 'Destacados', {
      heading: 'Elegidos para tu mesa',
      intro: 'Una selección de vajillas, platos, mugs y piezas de té de nuestro catálogo.',
      source: 'productos',
      showFilters: false,
      columns: '4',
      featuredOnly: true,
      moreLink: { label: 'Ver todo el catálogo', href: '/tienda' },
      tone: 'default',
    }),
    block('content.split', 'hecho_en_colombia', 'Hecho en Colombia', {
      heading: 'Hecho en Colombia',
      body: 'Las vajillas, platos y mugs de **Corona** que ves con el sello *Hecho en Colombia* se fabrican en el país. Lo marcamos en cada ficha para que sepas qué estás comprando.',
      cta: { label: 'Ver lo hecho en Colombia', href: '/tienda?hecho=1' },
      image: photo('vajilla-antonella-corona', 1),
      imageAlt: 'Vajilla Antonella de Corona, de inspiración azulejo, servida en la mesa',
      imageSide: 'left',
      tone: 'default',
    }),
    block('content.split', 'pintado_a_mano', 'Pintado a mano', {
      heading: 'Pintado a mano',
      body: 'Algunas vajillas llevan la decoración pintada a mano, pieza por pieza, así que cada plato tiene pequeñas diferencias de trazo y de color. Las encuentras con el sello *Pintado a mano*.',
      cta: { label: 'Ver las pintadas a mano', href: '/tienda?pintado=1' },
      image: photo('vajilla-siena-corona', 1),
      imageAlt: 'Vajilla Siena de Corona, pintada a mano, servida con comida',
      imageSide: 'right',
      tone: 'default',
    }),
    block('features.grid', 'beneficios', 'Envíos, pagos y cambios', {
      heading: 'Comprar en TusPlatos',
      intro: 'Lo que necesitas saber antes de pagar.',
      columns: '3',
      items: [
        { icon: 'truck', title: 'Envío a toda Colombia', body: `Despachamos desde Cali con transportadoras nacionales. El envío es gratis desde ${cop(FREE)}; por debajo cuesta ${cop(FLAT)}.` },
        { icon: 'credit-card', title: 'Pagos seguros', body: `${PAY} en una pasarela segura, o por transferencia bancaria.` },
        { icon: 'shield', title: 'Cambios', body: 'Si una pieza llega rota o con un defecto, escríbenos con una foto y lo resolvemos contigo.' },
      ],
      tone: 'primary',
    }),
    block('faq.accordion', 'preguntas', 'Preguntas frecuentes', {
      heading: 'Preguntas frecuentes',
      intro: 'Si tu duda no está aquí, escríbenos por WhatsApp.',
      items: [
        { question: '¿Cuánto cuesta el envío?', answer: `El envío cuesta ${cop(FLAT)} a cualquier ciudad de Colombia y es gratis en compras desde ${cop(FREE)}.` },
        { question: '¿Cuánto tarda en llegar?', answer: 'Normalmente entre 3 y 6 días hábiles después de confirmar el pago, según la ciudad. Al despachar te enviamos el número de guía para que sigas el pedido en [Rastrear pedido](/rastreo).' },
        { question: '¿Cómo puedo pagar?', answer: `${PAY} a través de una pasarela de pago segura, o por transferencia bancaria.` },
        { question: '¿Sirven para microondas y lavavajillas?', answer: 'Depende de la referencia. En cada ficha indicamos si es apta para microondas y lavavajillas; si no aparece, pregúntanos antes de usarla.' },
        { question: '¿Qué pasa si una pieza llega rota?', answer: 'Escríbenos por WhatsApp con una foto del empaque y de la pieza el mismo día que la recibas y lo resolvemos contigo.' },
        { question: '¿Venden piezas sueltas?', answer: 'Sí. En Platos, Tazas y mugs y Bowls y servir encuentras piezas por unidad para completar tu vajilla.' },
      ],
      tone: 'default',
    }),
    block('newsletter.signup', 'boletin', 'Boletín', {
      heading: 'Novedades de la tienda',
      body: 'Te escribimos cuando lleguen vajillas nuevas o haya precios especiales. Nada más.',
      placeholder: 'tu@correo.com',
      submitLabel: 'Suscribirme',
      successMessage: 'Listo. Te escribiremos cuando haya novedades.',
      formName: 'Boletín',
      emailLabel: 'Tu correo',
      tone: 'default',
    }, [t('emailLabel', 'Etiqueta del campo de correo')]),
  ],
};

const FILTERS = [
  { field: 'category', type: 'select', label: 'Categoría' },
  { field: 'style', type: 'select', label: 'Estilo' },
  { field: 'color', type: 'select', label: 'Color' },
  { field: 'material', type: 'select', label: 'Material' },
  { field: 'brand', type: 'select', label: 'Marca' },
  { field: 'price', type: 'range', label: 'Precio' },
  { field: 'pieces', type: 'select', label: 'Piezas' },
  { field: 'places', type: 'select', label: 'Puestos' },
  { field: 'madeInColombia', type: 'boolean', label: 'Hecho en Colombia' },
  { field: 'handPainted', type: 'boolean', label: 'Pintado a mano' },
  { field: 'microwaveSafe', type: 'boolean', label: 'Apto para microondas' },
  { field: 'dishwasherSafe', type: 'boolean', label: 'Apto para lavavajillas' },
  { field: 'onSale', type: 'boolean', label: 'En oferta' },
  { field: 'inStock', type: 'boolean', label: 'Disponible' },
];

const shop = {
  title: 'Tienda',
  slug: '/tienda',
  description: 'Catálogo con filtros',
  seoTitle: 'Tienda',
  seoImage: '',
  sections: [
    block(
      'products.catalog',
      'catalogo',
      'Catálogo',
      {
        heading: 'La tienda',
        intro: 'Vajillas, platos, tazas y piezas para servir. Filtra por categoría, estilo, color o material.',
        source: 'productos',
        showFilters: true,
        columns: '3',
        featuredOnly: false,
        searchLabel: 'Buscar en la tienda',
        searchPlaceholder: 'Platos, mugs, azul, porcelana…',
        filtersLabel: 'Filtros',
        clearLabel: 'Limpiar todo',
        applyLabel: 'Ver resultados',
        resultsLabel: 'productos',
        sortLabel: 'Ordenar',
        sortOptions: [
          { value: 'relevance', label: 'Relevancia' },
          { value: 'price:asc', label: 'Precio: menor a mayor' },
          { value: 'price:desc', label: 'Precio: mayor a menor' },
          { value: 'recent', label: 'Novedades' },
          { value: 'title:asc', label: 'Nombre' },
        ],
        gridLabel: 'Cuadrícula',
        listLabel: 'Lista',
        loadMoreLabel: 'Cargar más',
        emptyText: 'No hay productos con esos filtros. Quita alguno para ver más.',
        priceFromLabel: 'Desde',
        priceToLabel: 'Hasta',
        pageSize: 12,
        filters: FILTERS,
        tone: 'default',
      },
      [
        t('searchLabel', 'Etiqueta del buscador'),
        t('searchPlaceholder', 'Texto de ayuda del buscador'),
        t('filtersLabel', 'Título del panel de filtros'),
        t('clearLabel', 'Botón para limpiar filtros'),
        t('applyLabel', 'Botón para cerrar filtros en móvil'),
        t('resultsLabel', 'Texto después del número de resultados'),
        t('sortLabel', 'Etiqueta de orden'),
        arr('sortOptions', 'Opciones de orden', [t('label', 'Texto'), sel('value', 'Orden', ['relevance', 'price:asc', 'price:desc', 'recent', 'title:asc'])]),
        t('gridLabel', 'Vista en cuadrícula'),
        t('listLabel', 'Vista en lista'),
        t('loadMoreLabel', 'Botón cargar más'),
        ta('emptyText', 'Texto sin resultados'),
        t('priceFromLabel', 'Precio desde'),
        t('priceToLabel', 'Precio hasta'),
        num('pageSize', 'Productos por tanda'),
        arr('filters', 'Filtros de la tienda', [
          t('label', 'Nombre del filtro'),
          sel('field', 'Campo del producto', FILTERS.map((f) => f.field)),
          sel('type', 'Tipo', ['select', 'range', 'boolean']),
        ]),
      ],
    ),
  ],
};

const productPage = {
  title: 'Producto',
  slug: '/producto',
  description: 'Plantilla de la ficha de producto (/producto/<referencia>)',
  seoTitle: 'Producto',
  seoImage: '',
  sections: [
    custom(
      'ficha',
      'Ficha de producto',
      [
        t('homeLabel', 'Miga de pan: inicio'),
        t('shopLabel', 'Miga de pan: tienda'),
        t('addLabel', 'Botón agregar'),
        t('soldOutLabel', 'Texto agotado'),
        t('quantityLabel', 'Etiqueta de cantidad'),
        t('inStockLabel', 'Texto disponible'),
        t('stockNote', 'Unidades disponibles ({n} = número)'),
        t('whatsappAsk', 'Enlace a WhatsApp'),
        t('favoriteLabel', 'Botón favoritos'),
        t('zoomHint', 'Ayuda de la galería'),
        t('deliveryHeading', 'Título de entrega'),
        ta('deliveryNote', 'Tiempo de entrega'),
        ta('shippingNote', 'Nota de envío'),
        ta('paymentNote', 'Nota de pagos'),
        ta('returnsNote', 'Nota de cambios'),
        t('detailsHeading', 'Título de detalles'),
        t('descriptionHeading', 'Título de la descripción'),
        t('careHeading', 'Título de cuidados'),
        t('brandLabel', 'Etiqueta marca'),
        t('categoryLabel', 'Etiqueta categoría'),
        t('styleLabel', 'Etiqueta estilo'),
        t('colorLabel', 'Etiqueta color'),
        t('materialLabel', 'Etiqueta material'),
        t('piecesLabel', 'Etiqueta piezas'),
        t('placesLabel', 'Etiqueta puestos'),
        t('sizeLabel', 'Etiqueta medidas'),
        t('skuLabel', 'Etiqueta referencia'),
        t('microwaveLabel', 'Sello microondas'),
        t('dishwasherLabel', 'Sello lavavajillas'),
        t('variantLabel', 'Etiqueta de variantes'),
        t('completeHeading', 'Título "completa tu mesa"'),
        t('relatedHeading', 'Título de relacionados'),
        t('stickyLabel', 'Botón fijo en móvil'),
      ],
      {
        homeLabel: 'Inicio',
        shopLabel: 'Tienda',
        addLabel: 'Agregar al carrito',
        soldOutLabel: 'Agotado',
        quantityLabel: 'Cantidad',
        inStockLabel: 'Disponible',
        stockNote: 'Quedan {n} unidades',
        whatsappAsk: 'Preguntar por WhatsApp',
        favoriteLabel: 'Guardar en favoritos',
        zoomHint: 'Pasa el cursor o toca la foto para ampliarla',
        deliveryHeading: 'Entrega y pagos',
        deliveryNote: 'Despachamos desde Cali. Llega en 3 a 6 días hábiles después de confirmar el pago.',
        shippingNote: `Envío gratis desde ${cop(FREE)}. Por debajo, ${cop(FLAT)} a toda Colombia.`,
        paymentNote: `${PAY}.`,
        returnsNote: 'Si una pieza llega rota, escríbenos con una foto y lo resolvemos.',
        detailsHeading: 'Detalles',
        descriptionHeading: 'Descripción',
        careHeading: 'Cuidados',
        brandLabel: 'Marca',
        categoryLabel: 'Categoría',
        styleLabel: 'Estilo',
        colorLabel: 'Color',
        materialLabel: 'Material',
        piecesLabel: 'Piezas',
        placesLabel: 'Puestos',
        sizeLabel: 'Medidas',
        skuLabel: 'Referencia',
        microwaveLabel: 'Apto para microondas',
        dishwasherLabel: 'Apto para lavavajillas',
        variantLabel: 'Opción',
        completeHeading: 'Completa tu mesa',
        relatedHeading: 'De la misma categoría',
        stickyLabel: 'Agregar',
      },
    ),
  ],
};

const about = {
  title: 'Nosotros',
  slug: '/nosotros',
  description: 'Quiénes somos',
  seoTitle: 'Nosotros',
  seoImage: photo('vajilla-azura-corona', 1),
  sections: [
    block('content.split', 'historia', 'Quiénes somos', {
      heading: 'Somos TusPlatos',
      body: 'TusPlatos es una tienda en línea de Cali dedicada a la mesa: vajillas, platos, tazas, piezas para servir y algunos objetos de decoración en cerámica, porcelana y vidrio templado.\n\nTrabajamos con marcas que se consiguen en Colombia —Corona, Corelle, Expressions, Espiral, Siaki y Qualitier— y elegimos referencias para usar todos los días, no solo en ocasiones especiales.',
      cta: { label: 'Ver la tienda', href: '/tienda' },
      image: photo('vajilla-azura-corona', 1),
      imageAlt: 'Vajilla Azura vista desde arriba sobre una mesa azul',
      imageSide: 'right',
      tone: 'default',
    }),
    block('steps.process', 'pedido', 'Cómo funciona un pedido', {
      heading: 'Cómo funciona un pedido',
      intro: 'De la tienda a tu mesa en tres pasos.',
      items: [
        { title: 'Eliges', body: `Agregas al carrito lo que quieras y pagas en línea con tarjeta, PSE, Nequi o Bancolombia, o por transferencia.` },
        { title: 'Despachamos', body: 'Empacamos las piezas para el viaje y te avisamos cuando el pedido sale de Cali.' },
        { title: 'Recibes', body: 'Sigues el envío con el número de guía desde Rastrear pedido.' },
      ],
      tone: 'default',
    }),
    block('cta.banner', 'ayuda', 'Te ayudamos', {
      headline: '¿Estás armando una mesa?',
      body: 'Cuéntanos cuántos puestos necesitas y qué estilo buscas, y te sugerimos combinaciones del catálogo.',
      primaryCta: { label: 'Escríbenos', href: '/contacto' },
      secondaryCta: { label: 'Ver vajillas', href: '/categoria/vajillas' },
      tone: 'default',
    }),
  ],
};

const contact = {
  title: 'Contacto',
  slug: '/contacto',
  description: 'Formulario de contacto',
  seoTitle: 'Contacto',
  seoImage: '',
  sections: [
    block(
      'contact.form',
      'contacto',
      'Formulario de contacto',
      {
        heading: 'Escríbenos',
        body: 'Pregúntanos por una referencia, medidas, disponibilidad o un pedido. Te respondemos en el horario de atención.',
        formName: 'Contacto',
        fields: [
          { name: 'nombre', label: 'Nombre', type: 'text', required: true, placeholder: '' },
          { name: 'correo', label: 'Correo', type: 'email', required: true, placeholder: '' },
          { name: 'celular', label: 'Celular', type: 'tel', required: false, placeholder: '' },
          { name: 'tema', label: 'Tema', type: 'select', required: false, options: 'Un producto, Un pedido, Otro tema' },
          { name: 'mensaje', label: 'Mensaje', type: 'textarea', required: true, placeholder: '' },
        ],
        submitLabel: 'Enviar mensaje',
        successMessage: 'Recibimos tu mensaje. Te respondemos pronto.',
        showContactInfo: true,
        contactHeading: 'Otros canales',
        whatsappLabel: 'Escribir por WhatsApp',
        errorText: 'No pudimos enviar tu mensaje. Revisa tu conexión o escríbenos por WhatsApp.',
        tone: 'default',
      },
      [t('contactHeading', 'Título de otros canales'), t('whatsappLabel', 'Botón de WhatsApp'), ta('errorText', 'Mensaje de error')],
    ),
  ],
};

const checkout = {
  title: 'Pago',
  slug: '/checkout',
  description: 'Checkout',
  seoTitle: 'Finalizar compra',
  seoImage: '',
  sections: [
    custom(
      'pago',
      'Finalizar compra',
      [
        t('heading', 'Título'),
        t('contactHeading', 'Título de datos'),
        t('shippingHeading', 'Título de entrega'),
        t('paymentHeading', 'Título de forma de pago'),
        t('summaryHeading', 'Título del resumen'),
        t('nameLabel', 'Campo nombre'),
        t('emailLabel', 'Campo correo'),
        t('phoneLabel', 'Campo celular'),
        t('docTypeLabel', 'Campo tipo de documento'),
        t('docLabel', 'Campo documento'),
        t('addressLabel', 'Campo dirección'),
        t('cityLabel', 'Campo ciudad'),
        t('departmentLabel', 'Campo departamento'),
        t('notesLabel', 'Campo indicaciones'),
        t('onlineLabel', 'Pago en línea'),
        ta('onlineNote', 'Descripción del pago en línea'),
        t('transferLabel', 'Transferencia'),
        ta('transferNote', 'Descripción de la transferencia'),
        t('codLabel', 'Pago asistido'),
        ta('codNote', 'Descripción del pago asistido'),
        t('payButton', 'Botón confirmar'),
        t('sendingLabel', 'Texto mientras conecta'),
        t('subtotalLabel', 'Subtotal'),
        t('shippingLabel', 'Envío'),
        t('freeLabel', 'Envío gratis'),
        t('totalLabel', 'Total'),
        t('taxNote', 'Nota de IVA'),
        ta('securityNote', 'Nota de seguridad'),
        ta('emptyCart', 'Carrito vacío'),
        link('emptyCta', 'Botón del carrito vacío'),
        ta('errorText', 'Mensaje de error'),
      ],
      {
        heading: 'Finalizar compra',
        contactHeading: 'Tus datos',
        shippingHeading: 'Dirección de entrega',
        paymentHeading: 'Forma de pago',
        summaryHeading: 'Tu pedido',
        nameLabel: 'Nombre completo',
        emailLabel: 'Correo',
        phoneLabel: 'Celular',
        docTypeLabel: 'Tipo de documento',
        docLabel: 'Número de documento',
        addressLabel: 'Dirección',
        cityLabel: 'Ciudad',
        departmentLabel: 'Departamento',
        notesLabel: 'Indicaciones para la entrega (opcional)',
        onlineLabel: 'Pago en línea',
        onlineNote: `${PAY} en una pasarela segura. Al confirmar te llevamos a pagar.`,
        transferLabel: 'Transferencia bancaria',
        transferNote: 'Te enviamos los datos para transferir con tu número de pedido.',
        codLabel: 'Pago asistido o contraentrega',
        codNote: 'Un asesor te contacta para confirmar la dirección y la forma de pago.',
        payButton: 'Confirmar pedido',
        sendingLabel: 'Conectando con la pasarela segura…',
        subtotalLabel: 'Subtotal',
        shippingLabel: 'Envío',
        freeLabel: 'Gratis',
        totalLabel: 'Total',
        taxNote: 'IVA incluido en los precios.',
        securityNote: 'Los datos de tu tarjeta los procesa la pasarela de pago; TusPlatos no los ve ni los guarda.',
        emptyCart: 'Tu carrito está vacío. Agrega productos desde la tienda para continuar.',
        emptyCta: { label: 'Ir a la tienda', href: '/tienda' },
        errorText: 'No pudimos crear el pedido. Revisa los datos e inténtalo de nuevo, o escríbenos por WhatsApp.',
      },
    ),
  ],
};

const order = {
  title: 'Pedido',
  slug: '/pedido',
  description: 'Confirmación del pedido (regreso de la pasarela)',
  seoTitle: 'Tu pedido',
  seoImage: '',
  sections: [
    custom(
      'confirmacion',
      'Confirmación',
      [
        t('heading', 'Título'),
        ta('body', 'Texto'),
        t('orderLabel', 'Etiqueta número de pedido'),
        t('statusLabel', 'Etiqueta estado'),
        t('totalLabel', 'Etiqueta total'),
        t('destinationLabel', 'Etiqueta destino'),
        t('approvedText', 'Pago aprobado'),
        t('declinedText', 'Pago rechazado'),
        t('pendingText', 'Pago en verificación'),
        link('trackCta', 'Botón rastrear'),
        link('backCta', 'Botón volver'),
      ],
      {
        heading: 'Gracias por tu pedido',
        body: 'Guarda tu número de pedido: con él puedes seguir el envío en cualquier momento.',
        orderLabel: 'Número de pedido',
        statusLabel: 'Estado',
        totalLabel: 'Total',
        destinationLabel: 'Destino',
        approvedText: 'Pago aprobado',
        declinedText: 'Pago rechazado',
        pendingText: 'Pago en verificación',
        trackCta: { label: 'Rastrear mi pedido', href: '/rastreo' },
        backCta: { label: 'Volver a la tienda', href: '/tienda' },
      },
    ),
  ],
};

const tracking = {
  title: 'Rastreo',
  slug: '/rastreo',
  description: 'Rastreo de pedidos',
  seoTitle: 'Rastrear pedido',
  seoImage: '',
  sections: [
    block(
      'tracking.order',
      'rastreo',
      'Rastreo de pedido',
      {
        heading: 'Rastrea tu pedido',
        intro: 'Escribe el número de pedido (ORD-…) o la guía de la transportadora.',
        inputLabel: 'Número de pedido o guía',
        submitText: 'Buscar',
        notFound: 'No encontramos ese número. Revisa que esté completo.',
        paymentLabel: 'Pago',
        totalLabel: 'Total',
        destinationLabel: 'Destino',
        carrierLabel: 'Transportadora',
        trackingLabel: 'Guía',
        pendingTracking: 'Se asigna al despachar',
        tone: 'default',
      },
      [
        t('inputLabel', 'Etiqueta del campo'),
        t('submitText', 'Botón buscar'),
        t('notFound', 'Texto si no existe'),
        t('paymentLabel', 'Etiqueta pago'),
        t('totalLabel', 'Etiqueta total'),
        t('destinationLabel', 'Etiqueta destino'),
        t('carrierLabel', 'Etiqueta transportadora'),
        t('trackingLabel', 'Etiqueta guía'),
        t('pendingTracking', 'Guía pendiente'),
      ],
    ),
  ],
};

const favorites = {
  title: 'Favoritos',
  slug: '/favoritos',
  description: 'Productos guardados en este dispositivo',
  seoTitle: 'Favoritos',
  seoImage: '',
  sections: [
    custom(
      'favoritos',
      'Favoritos',
      [t('heading', 'Título'), ta('intro', 'Introducción'), ta('emptyText', 'Sin favoritos'), link('cta', 'Botón'), t('recentHeading', 'Título de vistos recientemente')],
      {
        heading: 'Tus favoritos',
        intro: 'Las piezas que guardaste en este dispositivo.',
        emptyText: 'Aún no guardas nada. Toca el corazón en cualquier producto para tenerlo aquí.',
        cta: { label: 'Ir a la tienda', href: '/tienda' },
        recentHeading: 'Vistos recientemente',
      },
    ),
  ],
};

const search = {
  title: 'Buscar',
  slug: '/buscar',
  description: 'Búsqueda',
  seoTitle: 'Buscar',
  seoImage: '',
  sections: [
    custom(
      'buscar',
      'Buscar',
      [
        t('heading', 'Título'),
        ta('intro', 'Introducción'),
        t('placeholder', 'Texto de ayuda'),
        t('resultsLabel', 'Texto después del número de resultados'),
        ta('emptyText', 'Sin resultados'),
        t('suggestionsHeading', 'Título de sugerencias'),
        arr('suggestions', 'Búsquedas sugeridas', [t('text', 'Búsqueda')]),
      ],
      {
        heading: 'Buscar',
        intro: 'Busca por nombre, marca, color o material.',
        placeholder: 'Vajilla azul, mug, porcelana…',
        resultsLabel: 'resultados',
        emptyText: 'No encontramos productos para esa búsqueda. Prueba con otra palabra.',
        suggestionsHeading: 'Prueba con',
        suggestions: [{ text: 'vajilla azul' }, { text: 'mug' }, { text: 'porcelana' }, { text: 'pintada a mano' }, { text: 'plato hondo' }, { text: 'tetera' }],
      },
    ),
  ],
};

const pages = [home, shop, productPage, about, contact, checkout, order, tracking, favorites, search].map((p, i) => ({
  isPublished: true,
  order: i,
  ...p,
  sections: p.sections.map((s, j) => ({ order: j, ...s })),
}));

// ───────────── globales ─────────────
const prevGlobal = snap.globalData || {};
const globalData = {
  brandName: 'TusPlatos',
  tagline: 'Vajillas, platos y tazas de cerámica. Desde Cali para toda Colombia.',
  announcementText: `Envío gratis desde ${cop(FREE)} · Paga con tarjeta, PSE, Nequi o Bancolombia`,
  // PENDIENTE: número real de WhatsApp del negocio (placeholder 573000000000).
  whatsappNumber: '573000000000',
  whatsappPrefill: 'Hola TusPlatos, tengo una pregunta sobre un producto.',
  phone: '',
  email: '',
  address: '',
  city: 'Cali',
  hours: 'Lunes a sábado · 9:00 a. m. – 6:00 p. m.',
  social: [],
  legalNote: 'Precios en pesos colombianos con IVA incluido.',
  logoUrl: prevGlobal.logoUrl || '',
  faviconUrl: prevGlobal.faviconUrl || '',
  // Textos de la interfaz común (cabecera, carrito, tarjetas)
  searchLabel: 'Buscar',
  favoritesLabel: 'Favoritos',
  cartLabel: 'Carrito',
  menuLabel: 'Menú',
  addLabel: 'Agregar',
  quickViewLabel: 'Vista rápida',
  viewProductLabel: 'Ver ficha completa',
  saleBadge: 'Oferta',
  soldOutBadge: 'Agotado',
  madeInColombiaBadge: 'Hecho en Colombia',
  handPaintedBadge: 'Pintado a mano',
  piecesSuffix: 'piezas',
  placesSuffix: 'puestos',
  cartTitle: 'Tu carrito',
  cartEmpty: 'Tu carrito está vacío. Empieza por las vajillas o los mugs.',
  cartContinue: 'Seguir comprando',
  cartCheckout: 'Ir a pagar',
  cartSubtotal: 'Subtotal',
  cartNotesLabel: 'Nota para el pedido (opcional)',
  cartFreeMissing: 'Te faltan {monto} para el envío gratis',
  cartFreeDone: 'Tu envío es gratis',
  cartAdded: 'Agregado al carrito',
  footerLinksHeading: 'Tienda y ayuda',
  footerCategoriesHeading: 'Categorías',
  footerContactHeading: 'Atención',
  whatsappFloatLabel: 'Escríbenos',
  site: {
    notFound: {
      title: 'No encontramos esta página',
      text: 'Puede que el enlace haya cambiado. Busca en la tienda o vuelve al inicio.',
      ctaLabel: 'Ir a la tienda',
      ctaHref: '/tienda',
    },
  },
  designSystem: {
    version: 2,
    name: 'Estación de azulejos',
    themeMode: 'light',
    colors: {
      background: '#F7F6F1',
      surface: '#FFFFFF',
      surfaceAlt: '#DCE5F6',
      text: '#13265C',
      muted: '#4A5B8A',
      border: '#D4D8E1',
      primary: '#1B3A8F',
      primaryText: '#F7F6F1',
      secondary: '#3B63C4',
      secondaryText: '#FFFFFF',
      accent: '#D9A21B',
      success: '#1E7A4C',
      danger: '#A3261B',
      custom: [],
    },
    typography: {
      headingFont: { family: 'Marcellus', source: 'custom', weights: [400], url: '/fonts/marcellus.woff2' },
      bodyFont: { family: 'Hanken Grotesk', source: 'custom', weights: [400], url: '/fonts/hanken-grotesk.woff2' },
      customFonts: [500, 600, 700].map((weight) => ({ family: 'Hanken Grotesk', url: '/fonts/hanken-grotesk.woff2', weight, style: 'normal' })),
      baseSize: 16,
      scaleRatio: 1.25,
      headingWeight: 400,
      bodyWeight: 400,
      headingCase: 'uppercase',
      headingTracking: 0.035,
      bodyLineHeight: 1.55,
    },
    shape: { radiusSm: 2, radiusMd: 2, radiusLg: 0, radiusFull: 999, borderWidth: 1 },
    shadow: { sm: '0 1px 2px rgb(19 38 92 / .08)', md: '0 8px 24px -10px rgb(19 38 92 / .35)', lg: '0 10px 30px -12px rgb(19 38 92 / .5)' },
    spacing: { sectionY: 128, sectionYMobile: 64, gutter: 32, maxWidth: 1440 },
    buttons: { style: 'solid', shape: 'rounded', case: 'uppercase', weight: 400, paddingY: 14, paddingX: 22 },
    motion: { level: 'subtle', durationMs: 220 },
    header: { variant: 'simple', sticky: true, transparentOnHero: false, showSearch: true, showCart: true },
    footer: { variant: 'columns', showNewsletter: false },
    globalCss: '',
  },
};

const g = (key, type, label) => ({ key, type, label });
const globalSchema = [
  g('brandName', 'text', 'Nombre de la marca'),
  g('tagline', 'text', 'Frase corta de la marca'),
  g('announcementText', 'text', 'Barra de anuncio'),
  g('logoUrl', 'image', 'Logo'),
  g('faviconUrl', 'image', 'Ícono de la pestaña (favicon)'),
  g('whatsappNumber', 'text', 'WhatsApp (solo números con indicativo, ej. 573001234567)'),
  g('whatsappPrefill', 'text', 'Mensaje inicial de WhatsApp'),
  g('phone', 'text', 'Teléfono'),
  g('email', 'text', 'Correo de contacto'),
  g('address', 'text', 'Dirección'),
  g('city', 'text', 'Ciudad'),
  g('hours', 'text', 'Horario de atención'),
  {
    key: 'social',
    type: 'array',
    label: 'Redes sociales',
    fields: [
      { key: 'network', type: 'select', label: 'Red', options: ['instagram', 'facebook', 'tiktok', 'youtube', 'pinterest', 'x'].map((v) => ({ value: v, label: v })) },
      { key: 'url', type: 'text', label: 'Enlace' },
    ],
  },
  g('legalNote', 'text', 'Nota legal del pie de página'),
  g('searchLabel', 'text', 'Cabecera: buscar'),
  g('favoritesLabel', 'text', 'Cabecera: favoritos'),
  g('cartLabel', 'text', 'Cabecera: carrito'),
  g('menuLabel', 'text', 'Cabecera: menú (móvil)'),
  g('addLabel', 'text', 'Tarjeta: botón agregar'),
  g('quickViewLabel', 'text', 'Tarjeta: vista rápida'),
  g('viewProductLabel', 'text', 'Vista rápida: ver ficha'),
  g('saleBadge', 'text', 'Sello de oferta'),
  g('soldOutBadge', 'text', 'Sello de agotado'),
  g('madeInColombiaBadge', 'text', 'Sello Hecho en Colombia'),
  g('handPaintedBadge', 'text', 'Sello Pintado a mano'),
  g('piecesSuffix', 'text', 'Texto después del número de piezas'),
  g('placesSuffix', 'text', 'Texto después del número de puestos'),
  g('cartTitle', 'text', 'Carrito: título'),
  g('cartEmpty', 'textarea', 'Carrito: vacío'),
  g('cartContinue', 'text', 'Carrito: seguir comprando'),
  g('cartCheckout', 'text', 'Carrito: ir a pagar'),
  g('cartSubtotal', 'text', 'Carrito: subtotal'),
  g('cartNotesLabel', 'text', 'Carrito: nota del pedido'),
  g('cartFreeMissing', 'text', 'Carrito: falta para envío gratis ({monto})'),
  g('cartFreeDone', 'text', 'Carrito: envío gratis logrado'),
  g('cartAdded', 'text', 'Aviso al agregar'),
  g('footerLinksHeading', 'text', 'Pie: título de enlaces'),
  g('footerCategoriesHeading', 'text', 'Pie: título de categorías'),
  g('footerContactHeading', 'text', 'Pie: título de atención'),
  g('whatsappFloatLabel', 'text', 'Botón flotante de WhatsApp'),
];

const navigationConfig = {
  headerLinks: [
    { id: 'nav-tienda', label: 'Tienda', href: '/tienda', isVisible: true },
    { id: 'nav-vajillas', label: 'Vajillas', href: '/categoria/vajillas', isVisible: true },
    { id: 'nav-platos', label: 'Platos', href: '/categoria/platos', isVisible: true },
    { id: 'nav-mugs', label: 'Tazas y mugs', href: '/categoria/tazas-y-mugs', isVisible: true },
    { id: 'nav-nosotros', label: 'Nosotros', href: '/nosotros', isVisible: true },
    { id: 'nav-contacto', label: 'Contacto', href: '/contacto', isVisible: true },
  ],
  headerCtaText: 'Escríbenos',
  footerLinks: [
    { id: 'ft-tienda', label: 'Toda la tienda', href: '/tienda', isVisible: true },
    { id: 'ft-buscar', label: 'Buscar', href: '/buscar', isVisible: true },
    { id: 'ft-favoritos', label: 'Favoritos', href: '/favoritos', isVisible: true },
    { id: 'ft-rastreo', label: 'Rastrear pedido', href: '/rastreo', isVisible: true },
    { id: 'ft-preguntas', label: 'Preguntas frecuentes', href: '/#cms-section-preguntas', isVisible: true },
    { id: 'ft-nosotros', label: 'Nosotros', href: '/nosotros', isVisible: true },
    { id: 'ft-contacto', label: 'Contacto', href: '/contacto', isVisible: true },
  ],
};

const seoConfig = {
  metaTitle: 'TusPlatos · Vajillas, platos y tazas en Cali',
  metaDescription: 'Tienda en línea de vajillas, platos, tazas y piezas de cerámica y porcelana en Cali. Envío a toda Colombia y pago con tarjeta, PSE, Nequi o Bancolombia.',
  ogImage: photo('vajilla-azura-corona', 0),
  robotsIndex: true,
};

const out = {
  ...snap,
  globalSchema,
  globalData,
  seoConfig,
  navigationConfig,
  redirects: [{ from: '/catalogo', to: '/tienda', permanent: true }],
  pages,
};
fs.writeFileSync(snapshotPath, JSON.stringify(out, null, 2) + '\n');
console.log(`Manifiesto escrito en ${path.relative(root, snapshotPath)}: ${pages.length} páginas, ${pages.reduce((n, p) => n + p.sections.length, 0)} secciones.`);
