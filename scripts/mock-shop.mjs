#!/usr/bin/env node
/**
 * API de tienda falsa (en memoria) para probar cuentas de cliente y pagos rechazados en local mientras
 * el backend no está desplegado. Implementa el contrato docs/SHOP-ACCOUNTS.md del CMS:
 *   config (con customerAccounts.enabled), checkout, confirm-order, retry-payment, track y /api/shop/:slug/account/*.
 * La "pasarela" es una página local con botones Aprobar / Rechazar / Pendiente.
 *
 *   node scripts/mock-shop.mjs [--port 4319] [--cms https://webproai.tech]
 *   NEXT_PUBLIC_SHOP_API_URL=http://localhost:4319 npm run dev
 *
 * Solo para desarrollo: nada se guarda y las contraseñas no se cifran.
 */
import http from 'node:http';
import crypto from 'node:crypto';

const arg = (k, d) => {
  const i = process.argv.indexOf(k);
  return i > 0 ? process.argv[i + 1] : d;
};
const PORT = Number(arg('--port', process.env.PORT || 4319));
const CMS = arg('--cms', 'https://webproai.tech');
const BASE = `http://localhost:${PORT}`;

let baseConfig = {};
try {
  baseConfig = await fetch(`${CMS}/api/ecommerce/public/tusplatos/config`).then((r) => r.json());
} catch {}

const db = { customers: new Map(), tokens: new Map(), orders: new Map(), seq: 1000 };
const id = (p) => `${p}_${crypto.randomBytes(6).toString('hex')}`;
const pub = (c) => ({
  id: c.id,
  email: c.email,
  name: c.name,
  phone: c.phone || null,
  documentType: c.documentType || null,
  documentId: c.documentId || null,
  addresses: c.addresses,
  acceptsMarketing: Boolean(c.acceptsMarketing),
  createdAt: c.createdAt,
});
const issue = (c) => {
  const t = `mock.${crypto.randomBytes(18).toString('base64url')}`;
  db.tokens.set(t, { id: c.id, v: c.tokenVersion });
  return t;
};
const summary = (o) => ({
  orderNumber: o.orderNumber,
  status: o.status,
  paymentStatus: o.paymentStatus,
  totalAmount: o.totalAmount,
  currency: 'COP',
  destinationCity: o.shippingAddress?.city || '',
  items: o.items.map((it) => ({ title: it.title, quantity: it.quantity, unitPrice: it.unitPrice, imageUrl: it.imageUrl || null, variantLabel: it.variantLabel || null })),
});
const canRetry = (o) => ['PENDING', 'FAILED'].includes(o.paymentStatus) && !['CANCELLED', 'REFUNDED'].includes(o.status) && o.paymentMethod === 'wompi' && o.retries < 5;
const gatewayUrl = (o, redirect) => `${BASE}/gateway?ref=${encodeURIComponent(o.orderNumber)}${redirect ? `&redirect-url=${encodeURIComponent(redirect)}` : ''}`;

class E extends Error {
  constructor(status, code, message, extra = {}) {
    super(message);
    Object.assign(this, { status, code, extra });
  }
}
const need = (cond, status, code, message) => {
  if (!cond) throw new E(status, code, message);
};

function auth(req, required = true) {
  const h = req.headers.authorization || '';
  const t = h.startsWith('Bearer ') ? h.slice(7) : '';
  const s = t && db.tokens.get(t);
  const c = s && db.customers.get(s.id);
  if (c && c.tokenVersion === s.v && c.isActive) return c;
  if (required) throw new E(401, 'INVALID_TOKEN', 'Tu sesión venció. Inicia sesión de nuevo.');
  return null;
}
const byEmail = (email) =>
  [...db.customers.values()].find(
    (c) =>
      c.email ===
      String(email || '')
        .trim()
        .toLowerCase(),
  );

function addAddress(c, a) {
  need(a && a.address && a.city, 400, 'INVALID_ADDRESS', 'La dirección necesita dirección y ciudad.');
  need(c.addresses.length < 10, 409, 'ADDRESS_LIMIT', 'Puedes guardar hasta 10 direcciones.');
  const addr = {
    id: id('addr'),
    label: a.label || '',
    recipientName: a.recipientName || '',
    phone: a.phone || '',
    address: a.address,
    city: a.city,
    department: a.department || '',
    country: a.country || 'Colombia',
    postalCode: a.postalCode || '',
    notes: a.notes || '',
    isDefault: Boolean(a.isDefault) || c.addresses.length === 0,
  };
  if (addr.isDefault) c.addresses.forEach((x) => (x.isDefault = false));
  c.addresses.push(addr);
}

const routes = [];
const on = (method, pattern, fn) => routes.push({ method, re: new RegExp(`^${pattern.replace(/:(\w+)/g, '(?<$1>[^/]+)')}$`), fn });

// ───────────── Tienda ─────────────
on('GET', '/api/ecommerce/public/:slug/config', () => ({ ...baseConfig, customerAccounts: { enabled: true, allowGuestCheckout: true, privacyPolicyUrl: '' } }));

on('POST', '/api/ecommerce/public/:slug/checkout', ({ body, req }) => {
  const c = auth(req, false);
  need(Array.isArray(body.items) && body.items.length, 400, 'EMPTY_CART', 'El carrito está vacío.');
  const orderNumber = `ORD-MOCK-${++db.seq}`;
  const items = body.items.map((it) => ({ ...it, quantity: Number(it.quantity) || 1, unitPrice: Number(it.unitPrice) || 0 }));
  const subtotal = items.reduce((a, it) => a + it.quantity * it.unitPrice, 0);
  const shipping = subtotal >= (baseConfig.freeShippingThreshold || 200000) ? 0 : baseConfig.flatShippingRate || 12000;
  const online = String(body.paymentProvider || '').toUpperCase() === 'WOMPI';
  const claimToken = c ? null : crypto.randomBytes(24).toString('base64url');
  const o = {
    orderNumber,
    customerId: c?.id || null,
    email: String(body.customerEmail || c?.email || '').toLowerCase(),
    name: body.customerName || c?.name,
    items,
    totalAmount: subtotal + shipping,
    shippingAddress: body.shippingAddress || {},
    paymentMethod: online ? 'wompi' : String(body.paymentProvider || '').toLowerCase(),
    status: online ? 'PENDING_PAYMENT' : 'ORDER_CREATED',
    paymentStatus: 'PENDING',
    retries: 0,
    claimTokenHash: claimToken ? crypto.createHash('sha256').update(claimToken).digest('hex') : null,
    createdAt: new Date().toISOString(),
    events: [{ id: id('ev'), status: 'ORDER_CREATED', title: 'Pedido creado', timestamp: new Date().toISOString() }],
  };
  db.orders.set(orderNumber, o);
  if (c && body.saveAddress && body.shippingAddress?.address) {
    const a = body.shippingAddress;
    if (!c.addresses.some((x) => x.address === a.address && x.city === a.city)) addAddress(c, { ...a, recipientName: a.recipientName || o.name, phone: a.phone || body.customerPhone });
  }
  return { orderNumber, totalAmount: o.totalAmount, ...(online ? { checkoutUrl: gatewayUrl(o) } : { paymentSession: { instructions: '' } }), ...(claimToken ? { claimToken } : {}) };
});

on('POST', '/api/ecommerce/public/:slug/payments/wompi/confirm-order', ({ body }) => {
  const o = db.orders.get(body.orderNumber);
  need(o, 404, 'ORDER_NOT_FOUND', 'No encontramos ese pedido.');
  const tx = String(body.transactionId || '');
  const gatewayStatus = tx.includes('approve') ? 'APPROVED' : tx.includes('decline') ? 'DECLINED' : 'PENDING';
  if (gatewayStatus === 'APPROVED' && o.paymentStatus !== 'PAID') {
    Object.assign(o, { paymentStatus: 'PAID', status: 'PROCESSING' });
    o.events.push({ id: id('ev'), status: 'PROCESSING', title: 'Pago aprobado', timestamp: new Date().toISOString() });
  } else if (gatewayStatus === 'DECLINED' && o.paymentStatus !== 'PAID') {
    Object.assign(o, { paymentStatus: 'FAILED', status: 'PAYMENT_FAILED' });
  }
  return { orderNumber: o.orderNumber, paymentStatus: o.paymentStatus, gatewayStatus, canRetry: canRetry(o), order: summary(o) };
});

on('POST', '/api/ecommerce/public/:slug/orders/:num/retry-payment', ({ body, req, params }) => {
  const o = db.orders.get(decodeURIComponent(params.num));
  const c = auth(req, false);
  const ok = o && ((c && o.customerId === c.id) || (body.email && String(body.email).trim().toLowerCase() === o.email));
  need(ok, 404, 'ORDER_NOT_FOUND', 'No encontramos ese pedido con ese correo.');
  need(o.retries < 5, 409, 'RETRY_LIMIT', 'Este pedido llegó al límite de intentos.');
  need(canRetry(o), 409, 'RETRY_NOT_ALLOWED', 'Este pedido no admite otro intento de pago.');
  if (o.items.some((it) => /agotad/i.test(it.title))) throw new E(409, 'OUT_OF_STOCK', 'Sin unidades.', { items: [] });
  o.retries += 1;
  Object.assign(o, { status: 'PENDING_PAYMENT', paymentStatus: 'PENDING' });
  return {
    orderNumber: o.orderNumber,
    reference: `TX-${o.orderNumber}-${crypto.randomBytes(3).toString('hex')}`,
    totalAmount: o.totalAmount,
    currency: 'COP',
    checkoutUrl: gatewayUrl(o, body.redirectUrl),
    redirectUrl: body.redirectUrl,
    retriesLeft: 5 - o.retries,
  };
});

on('GET', '/api/ecommerce/public/:slug/track/:code', ({ params }) => {
  const o = db.orders.get(decodeURIComponent(params.code).trim());
  need(o, 404, 'ORDER_NOT_FOUND', 'No encontramos ese pedido.');
  if (o.paymentStatus === 'FAILED' && ['PAYMENT_FAILED', 'CANCELLED'].includes(o.status))
    throw new E(409, 'PAYMENT_FAILED', 'Este pedido no se completó porque el pago fue rechazado.', { orderNumber: o.orderNumber, canRetry: canRetry(o) });
  return { ...summary(o), carrierName: null, trackingNumber: null, trackingUrl: null, trackingEvents: o.events };
});

// ───────────── Cuentas ─────────────
const A = '/api/shop/:slug/account';
on('POST', `${A}/register`, ({ body }) => {
  const email = String(body.email || '')
    .trim()
    .toLowerCase();
  need(/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email), 400, 'INVALID_EMAIL', 'Correo no válido.');
  need(String(body.password || '').length >= 8, 400, 'WEAK_PASSWORD', 'La contraseña debe tener al menos 8 caracteres.');
  need(body.acceptsTerms === true, 400, 'TERMS_REQUIRED', 'Debes aceptar la política de datos.');
  need(String(body.name || '').trim(), 400, 'NAME_REQUIRED', 'Escribe tu nombre.');
  need(!byEmail(email), 409, 'EMAIL_TAKEN', 'Ya existe una cuenta con ese correo.');
  const c = {
    id: id('cus'),
    email,
    password: body.password,
    name: body.name.trim(),
    phone: body.phone || '',
    addresses: [],
    acceptsMarketing: Boolean(body.acceptsMarketing),
    isActive: true,
    tokenVersion: 1,
    createdAt: new Date().toISOString(),
  };
  db.customers.set(c.id, c);
  const claimedOrders = [];
  for (const cl of body.claimOrders || []) {
    const o = db.orders.get(cl.orderNumber);
    if (o && !o.customerId && o.claimTokenHash === crypto.createHash('sha256').update(String(cl.claimToken)).digest('hex')) {
      o.customerId = c.id;
      claimedOrders.push(o.orderNumber);
      if (o.shippingAddress?.address) addAddress(c, { ...o.shippingAddress, recipientName: o.name });
    }
  }
  return { status: 201, body: { token: issue(c), customer: pub(c), claimedOrders } };
});
on('POST', `${A}/login`, ({ body }) => {
  const c = byEmail(body.email);
  need(c && c.password === body.password && c.isActive, 401, 'INVALID_CREDENTIALS', 'Correo o contraseña incorrectos.');
  return { token: issue(c), customer: pub(c) };
});
on('POST', `${A}/forgot-password`, ({ body }) => {
  const c = byEmail(body.email);
  if (c) {
    c.reset = crypto.randomBytes(16).toString('hex');
    console.log(`[mock] enlace de restablecimiento: ${body.resetUrl}?token=${c.reset}`);
  }
  return { sent: true };
});
on('POST', `${A}/reset-password`, ({ body }) => {
  const c = [...db.customers.values()].find((x) => x.reset && x.reset === body.token);
  need(c, 400, 'INVALID_RESET_TOKEN', 'El enlace venció o ya se usó.');
  need(String(body.password || '').length >= 8, 400, 'WEAK_PASSWORD', 'La contraseña debe tener al menos 8 caracteres.');
  Object.assign(c, { password: body.password, reset: null, tokenVersion: c.tokenVersion + 1 });
  return { token: issue(c), customer: pub(c) };
});
on('GET', `${A}/me`, ({ req }) => ({ customer: pub(auth(req)) }));
on('PATCH', `${A}/me`, ({ req, body }) => {
  const c = auth(req);
  for (const k of ['name', 'phone', 'documentType', 'documentId', 'acceptsMarketing']) if (k in body) c[k] = body[k];
  return { customer: pub(c) };
});
on('POST', `${A}/me/password`, ({ req, body }) => {
  const c = auth(req);
  need(c.password === body.currentPassword, 400, 'INVALID_PASSWORD', 'La contraseña actual no es correcta.');
  need(String(body.newPassword || '').length >= 8, 400, 'WEAK_PASSWORD', 'La contraseña debe tener al menos 8 caracteres.');
  Object.assign(c, { password: body.newPassword, tokenVersion: c.tokenVersion + 1 });
  return { token: issue(c), customer: pub(c) };
});
on('POST', `${A}/me/logout-all`, ({ req }) => {
  const c = auth(req);
  c.tokenVersion += 1;
  return { ok: true };
});
on('GET', `${A}/me/addresses`, ({ req }) => ({ addresses: auth(req).addresses }));
on('POST', `${A}/me/addresses`, ({ req, body }) => {
  const c = auth(req);
  addAddress(c, body);
  return { status: 201, body: { addresses: c.addresses } };
});
on('PATCH', `${A}/me/addresses/:aid`, ({ req, body, params }) => {
  const c = auth(req);
  const a = c.addresses.find((x) => x.id === params.aid);
  need(a, 404, 'ADDRESS_NOT_FOUND', 'No encontramos esa dirección.');
  if (body.isDefault) c.addresses.forEach((x) => (x.isDefault = false));
  Object.assign(a, body, { id: a.id });
  return { addresses: c.addresses };
});
on('DELETE', `${A}/me/addresses/:aid`, ({ req, params }) => {
  const c = auth(req);
  const was = c.addresses.find((x) => x.id === params.aid)?.isDefault;
  c.addresses = c.addresses.filter((x) => x.id !== params.aid);
  if (was && c.addresses[0]) c.addresses[0].isDefault = true;
  return { addresses: c.addresses };
});
on('GET', `${A}/me/orders`, ({ req, url }) => {
  const c = auth(req);
  const page = Number(url.searchParams.get('page')) || 1;
  const limit = Math.min(50, Number(url.searchParams.get('limit')) || 10);
  const mine = [...db.orders.values()].filter((o) => o.customerId === c.id).reverse();
  const items = mine.slice((page - 1) * limit, page * limit).map((o) => ({
    orderNumber: o.orderNumber,
    status: o.status,
    paymentStatus: o.paymentStatus,
    totalAmount: o.totalAmount,
    currency: 'COP',
    createdAt: o.createdAt,
    itemsCount: o.items.reduce((a, it) => a + it.quantity, 0),
    items: o.items.map((it) => ({ title: it.title, quantity: it.quantity, imageUrl: it.imageUrl })),
    carrierName: null,
    trackingNumber: null,
    trackingUrl: null,
    canRetry: canRetry(o),
  }));
  return { items, total: mine.length, page, totalPages: Math.max(1, Math.ceil(mine.length / limit)) };
});
on('DELETE', `${A}/me`, ({ req, body }) => {
  const c = auth(req);
  need(c.password === body.password, 400, 'INVALID_PASSWORD', 'La contraseña no es correcta.');
  db.customers.delete(c.id);
  for (const o of db.orders.values()) if (o.customerId === c.id) o.customerId = null;
  return { deleted: true };
});

// ───────────── Pasarela falsa ─────────────
function gatewayPage(url) {
  const back = url.searchParams.get('redirect-url') || '';
  const go = (kind) => {
    if (!back) return '#';
    const u = new URL(back);
    u.searchParams.set('id', `${kind}-${crypto.randomBytes(4).toString('hex')}`);
    u.searchParams.set('env', 'test');
    return u.toString();
  };
  return `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Pasarela de prueba</title>
<body style="font-family:system-ui;max-width:420px;margin:40px auto;padding:0 16px"><h1>Pasarela de prueba</h1><p>Pedido ${url.searchParams.get('ref') || ''}</p>
<p><a id="approve" href="${go('approve')}">Aprobar</a></p><p><a id="decline" href="${go('decline')}">Rechazar</a></p><p><a id="pending" href="${go('pending')}">Dejar pendiente</a></p></body>`;
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Headers', 'authorization,content-type');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  res.setHeader('Vary', 'Origin');
  if (req.method === 'OPTIONS') return res.writeHead(204).end();
  const url = new URL(req.url, BASE);
  if (url.pathname === '/gateway') return res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }).end(gatewayPage(url));
  let raw = '';
  for await (const chunk of req) raw += chunk;
  let body = {};
  try {
    body = raw ? JSON.parse(raw) : {};
  } catch {}
  for (const r of routes) {
    const m = r.method === req.method && url.pathname.match(r.re);
    if (!m) continue;
    try {
      const out = await r.fn({ req, body, url, params: m.groups || {} });
      const status = out && out.status && out.body ? out.status : 200;
      const payload = out && out.status && out.body ? out.body : out;
      console.log(`[mock] ${req.method} ${url.pathname} → ${status}`);
      return res.writeHead(status, { 'Content-Type': 'application/json' }).end(JSON.stringify(payload));
    } catch (e) {
      const status = e instanceof E ? e.status : 500;
      console.log(`[mock] ${req.method} ${url.pathname} → ${status} ${e.code || e.message}`);
      return res.writeHead(status, { 'Content-Type': 'application/json' }).end(JSON.stringify({ statusCode: status, code: e.code || 'INTERNAL', message: e.message, ...(e.extra || {}) }));
    }
  }
  res.writeHead(404, { 'Content-Type': 'application/json' }).end(JSON.stringify({ statusCode: 404, code: 'NOT_FOUND', message: 'Ruta no simulada' }));
});
server.listen(PORT, () => console.log(`[mock] API de tienda en ${BASE} (cuentas activas)`));
