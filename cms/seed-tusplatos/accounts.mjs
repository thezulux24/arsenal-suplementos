/**
 * Contenido de cuentas de cliente y pagos rechazados (docs/SHOP-ACCOUNTS.md del CMS).
 * Lo usan build-manifest.mjs (contenido como código) y, para aplicarlo sin un push completo,
 * los comandos `ltn sections update|create`, `ltn pages create` y `ltn global update`.
 *
 * Cada sección propia del sitio se pinta por su clave (src/components/blocks/registry.tsx):
 * cuenta, mis_pedidos, mis_direcciones, mis_datos, restablecer.
 */

const t = (key, label, extra = {}) => ({ key, type: 'text', label, ...extra });
const ta = (key, label, extra = {}) => ({ key, type: 'textarea', label, ...extra });
const link = (key, label) => ({ key, type: 'link', label });
const custom = (key, name, schema, data) => ({ key, name, description: '', isVisible: true, schema, data });

const TERMS = 'Autorizo el tratamiento de mis datos personales para gestionar mis compras, según la Ley 1581 de 2012.';
// La URL real de la política la pone la tienda en customerAccounts.privacyPolicyUrl (tiene prioridad) o aquí.
const POLICY = { label: 'Política de tratamiento de datos', href: '' };

// ───────────── Campos nuevos en secciones existentes ─────────────

/** /checkout · sección `pago`. */
export const checkoutAdditions = {
  schema: [
    link('accountPrompt', 'Cuentas: enlace para iniciar sesión'),
    t('savedAddressesLabel', 'Cuentas: título de direcciones guardadas'),
    t('otherAddressLabel', 'Cuentas: usar otra dirección'),
    t('saveAddressLabel', 'Cuentas: guardar la dirección en la cuenta'),
  ],
  data: {
    accountPrompt: { label: '¿Ya tienes cuenta? Inicia sesión y tus datos se llenan solos', href: '/cuenta?siguiente=/checkout' },
    savedAddressesLabel: 'Tus direcciones guardadas',
    otherAddressLabel: 'Usar otra dirección',
    saveAddressLabel: 'Guardar esta dirección en mi cuenta',
  },
};

/** /pedido · sección `confirmacion`. */
export const orderAdditions = {
  schema: [
    t('pendingHeading', 'Pago en verificación: título'),
    ta('pendingBody', 'Pago en verificación: texto'),
    t('refreshLabel', 'Pago en verificación: botón actualizar'),
    t('declinedHeading', 'Pago rechazado: título'),
    ta('declinedBody', 'Pago rechazado: texto'),
    t('retryLabel', 'Pago rechazado: botón reintentar'),
    t('retryEmailLabel', 'Pago rechazado: campo correo'),
    ta('retryErrorText', 'Pago rechazado: error al reintentar'),
    ta('outOfStockText', 'Pago rechazado: sin unidades'),
    ta('retryLimitText', 'Pago rechazado: ya no se puede reintentar'),
    t('recoverCartLabel', 'Pago rechazado: recuperar carrito'),
    t('recoveredText', 'Pago rechazado: carrito recuperado'),
    t('helpLabel', 'Ayuda por WhatsApp: texto del enlace'),
    ta('helpMessage', 'Ayuda por WhatsApp: mensaje ({orden} = número de pedido)'),
    t('claimHeading', 'Crear cuenta tras la compra: título'),
    ta('claimBody', 'Crear cuenta tras la compra: texto'),
    t('claimPasswordLabel', 'Crear cuenta tras la compra: campo contraseña'),
    ta('claimTermsLabel', 'Crear cuenta tras la compra: autorización de datos'),
    link('claimTermsLink', 'Crear cuenta tras la compra: política de datos'),
    t('claimButton', 'Crear cuenta tras la compra: botón'),
    ta('claimDoneText', 'Crear cuenta tras la compra: listo'),
    link('claimDoneCta', 'Crear cuenta tras la compra: botón a la cuenta'),
    ta('claimErrorText', 'Crear cuenta tras la compra: error'),
  ],
  data: {
    pendingHeading: 'Estamos confirmando tu pago',
    pendingBody: 'Puede tardar unos minutos, sobre todo con PSE. Esta página se actualiza sola; no hace falta pagar otra vez.',
    refreshLabel: 'Actualizar estado',
    declinedHeading: 'Tu pago no se completó',
    declinedBody: 'El banco o la pasarela rechazó el pago y no se registró ningún cobro. Tu pedido sigue guardado: puedes intentarlo de nuevo, con el mismo medio o con otro.',
    retryLabel: 'Reintentar el pago',
    retryEmailLabel: 'Correo con el que hiciste el pedido',
    retryErrorText: 'No pudimos abrir el pago. Revisa que el correo sea el del pedido e inténtalo de nuevo.',
    outOfStockText: 'Una o más piezas ya no tienen unidades. Recupera tu carrito para ajustar el pedido.',
    retryLimitText: 'Este pedido ya no admite otro intento de pago. Recupera tu carrito para hacer un pedido nuevo o escríbenos.',
    recoverCartLabel: 'Recuperar mi carrito',
    recoveredText: 'Volvimos a poner tus piezas en el carrito.',
    helpLabel: '¿Necesitas ayuda? Escríbenos por WhatsApp',
    helpMessage: 'Hola TusPlatos, necesito ayuda con el pago del pedido {orden}.',
    claimHeading: 'Guarda tus datos para la próxima',
    claimBody: 'Crea una contraseña y tu próxima compra irá más rápido: tus datos y esta dirección quedan guardados, y este pedido aparece en tu cuenta.',
    claimPasswordLabel: 'Crea una contraseña (mínimo 8 caracteres)',
    claimTermsLabel: TERMS,
    claimTermsLink: POLICY,
    claimButton: 'Crear mi cuenta',
    claimDoneText: 'Listo, ya tienes cuenta. Encuentras este pedido en Mis pedidos.',
    claimDoneCta: { label: 'Ir a mi cuenta', href: '/cuenta/pedidos' },
    claimErrorText: 'No pudimos crear la cuenta. Si ya tienes una con este correo, inicia sesión desde Mi cuenta.',
  },
};

/** /rastreo · sección `rastreo`. */
export const trackingAdditions = {
  schema: [ta('failedText', 'Pago rechazado: texto'), t('failedCtaLabel', 'Pago rechazado: botón reintentar')],
  data: {
    failedText: 'Este pedido no se completó porque el pago fue rechazado, así que no tiene envío. Puedes reintentar el pago desde la página del pedido.',
    failedCtaLabel: 'Reintentar el pago',
  },
};

// ───────────── Páginas nuevas ─────────────

const entry = custom(
  'cuenta',
  'Mi cuenta: entrar o crear cuenta',
  [
    t('heading', 'Título'),
    ta('intro', 'Introducción'),
    t('loginTab', 'Pestaña iniciar sesión'),
    t('registerTab', 'Pestaña crear cuenta'),
    t('emailLabel', 'Campo correo'),
    t('passwordLabel', 'Campo contraseña'),
    t('loginButton', 'Botón entrar'),
    t('forgotLink', 'Enlace olvidé mi contraseña'),
    ta('loginError', 'Error: correo o contraseña'),
    t('nameLabel', 'Campo nombre'),
    t('phoneLabel', 'Campo celular'),
    t('passwordHint', 'Ayuda de la contraseña'),
    ta('termsLabel', 'Autorización de tratamiento de datos'),
    link('termsLink', 'Enlace a la política de datos'),
    ta('marketingLabel', 'Casilla de novedades (opcional)'),
    t('registerButton', 'Botón crear cuenta'),
    ta('emailTakenError', 'Error: el correo ya tiene cuenta'),
    t('forgotHeading', 'Recuperar: título'),
    ta('forgotBody', 'Recuperar: texto'),
    t('forgotButton', 'Recuperar: botón'),
    ta('forgotSent', 'Recuperar: enlace enviado'),
    t('forgotHelpLabel', 'Recuperar: ayuda por WhatsApp'),
    t('backToLogin', 'Recuperar: volver'),
    ta('errorText', 'Error general'),
  ],
  {
    heading: 'Mi cuenta',
    intro: 'Guarda tus datos y direcciones para pagar más rápido, y sigue todos tus pedidos en un solo lugar.',
    loginTab: 'Iniciar sesión',
    registerTab: 'Crear cuenta',
    emailLabel: 'Correo',
    passwordLabel: 'Contraseña',
    loginButton: 'Entrar',
    forgotLink: '¿Olvidaste tu contraseña?',
    loginError: 'El correo o la contraseña no coinciden. Revísalos e inténtalo de nuevo.',
    nameLabel: 'Nombre completo',
    phoneLabel: 'Celular (opcional)',
    passwordHint: 'Mínimo 8 caracteres.',
    termsLabel: TERMS,
    termsLink: POLICY,
    marketingLabel: 'Quiero recibir novedades y ofertas de TusPlatos (opcional).',
    registerButton: 'Crear mi cuenta',
    emailTakenError: 'Ya existe una cuenta con ese correo. Inicia sesión o recupera tu contraseña.',
    forgotHeading: 'Recupera tu contraseña',
    forgotBody: 'Escribe el correo de tu cuenta y te enviamos un enlace para crear una contraseña nueva.',
    forgotButton: 'Enviar enlace',
    forgotSent: 'Si hay una cuenta con ese correo, te llegará un enlace en unos minutos. Revisa también la carpeta de spam.',
    forgotHelpLabel: '¿No te llega el correo? Escríbenos por WhatsApp',
    backToLogin: 'Volver a iniciar sesión',
    errorText: 'No pudimos completar la solicitud. Inténtalo de nuevo en un momento.',
  },
);

const orders = custom(
  'mis_pedidos',
  'Mi cuenta: pedidos',
  [
    t('heading', 'Título'),
    ta('intro', 'Introducción'),
    t('loadingText', 'Cargando'),
    ta('emptyText', 'Sin pedidos'),
    link('emptyCta', 'Botón sin pedidos'),
    t('trackLabel', 'Botón ver seguimiento'),
    t('retryLabel', 'Botón reintentar pago'),
    t('trackingLabel', 'Etiqueta guía'),
    t('moreLabel', 'Botón ver más'),
    ta('errorText', 'Error al cargar'),
    ta('retryErrorText', 'Error al reintentar'),
    ta('outOfStockText', 'Reintento: sin unidades'),
    ta('retryLimitText', 'Reintento: ya no se puede'),
  ],
  {
    heading: 'Mis pedidos',
    intro: 'El estado de tus compras y el seguimiento del envío. Si un pago no pasó, puedes reintentarlo aquí.',
    loadingText: 'Cargando tus pedidos…',
    emptyText: 'Aún no tienes pedidos en esta cuenta.',
    emptyCta: { label: 'Ir a la tienda', href: '/tienda' },
    trackLabel: 'Ver seguimiento',
    retryLabel: 'Reintentar pago',
    trackingLabel: 'Guía',
    moreLabel: 'Ver más pedidos',
    errorText: 'No pudimos cargar tus pedidos. Recarga la página en un momento.',
    retryErrorText: 'No pudimos abrir el pago. Inténtalo de nuevo o escríbenos por WhatsApp.',
    outOfStockText: 'Una o más piezas de ese pedido ya no tienen unidades. Haz un pedido nuevo desde la tienda.',
    retryLimitText: 'Ese pedido ya no admite otro intento de pago. Haz un pedido nuevo o escríbenos.',
  },
);

const addresses = custom(
  'mis_direcciones',
  'Mi cuenta: direcciones',
  [
    t('heading', 'Título'),
    ta('intro', 'Introducción'),
    t('addLabel', 'Botón agregar'),
    t('maxText', 'Límite de direcciones'),
    t('loadingText', 'Cargando'),
    ta('emptyText', 'Sin direcciones'),
    t('formHeading', 'Formulario: título nueva'),
    t('editHeading', 'Formulario: título editar'),
    t('labelLabel', 'Campo nombre de la dirección'),
    t('recipientLabel', 'Campo quién recibe'),
    t('phoneLabel', 'Campo celular'),
    t('addressLabel', 'Campo dirección'),
    t('cityLabel', 'Campo ciudad'),
    t('departmentLabel', 'Campo departamento'),
    t('notesLabel', 'Campo indicaciones'),
    t('defaultLabel', 'Casilla dirección principal'),
    t('saveLabel', 'Botón guardar'),
    t('cancelLabel', 'Botón cancelar'),
    t('savedText', 'Dirección guardada'),
    t('defaultBadge', 'Sello principal'),
    t('editLabel', 'Botón editar'),
    t('makeDefaultLabel', 'Botón usar como principal'),
    t('deleteLabel', 'Botón eliminar'),
    t('deleteConfirm', 'Confirmación de eliminar'),
    ta('errorText', 'Error'),
  ],
  {
    heading: 'Mis direcciones',
    intro: 'Guárdalas una vez y elígelas al pagar.',
    addLabel: 'Agregar dirección',
    maxText: 'Puedes guardar hasta 10 direcciones.',
    loadingText: 'Cargando tus direcciones…',
    emptyText: 'Aún no guardas direcciones. Agrega la de tu casa o la de tu oficina.',
    formHeading: 'Nueva dirección',
    editHeading: 'Editar dirección',
    labelLabel: 'Nombre de la dirección (casa, oficina…)',
    recipientLabel: 'Quién recibe',
    phoneLabel: 'Celular de quien recibe',
    addressLabel: 'Dirección',
    cityLabel: 'Ciudad',
    departmentLabel: 'Departamento',
    notesLabel: 'Indicaciones para la entrega (opcional)',
    defaultLabel: 'Usar como dirección principal',
    saveLabel: 'Guardar dirección',
    cancelLabel: 'Cancelar',
    savedText: 'Dirección guardada.',
    defaultBadge: 'Principal',
    editLabel: 'Editar',
    makeDefaultLabel: 'Usar como principal',
    deleteLabel: 'Eliminar',
    deleteConfirm: '¿Eliminar esta dirección?',
    errorText: 'No pudimos guardar el cambio. Revisa los datos e inténtalo de nuevo.',
  },
);

const profile = custom(
  'mis_datos',
  'Mi cuenta: datos y seguridad',
  [
    t('heading', 'Título'),
    ta('intro', 'Introducción'),
    t('profileHeading', 'Datos: título'),
    t('emailLabel', 'Campo correo'),
    t('nameLabel', 'Campo nombre'),
    t('phoneLabel', 'Campo celular'),
    t('docTypeLabel', 'Campo tipo de documento'),
    t('docLabel', 'Campo número de documento'),
    ta('marketingLabel', 'Casilla de novedades'),
    t('saveLabel', 'Botón guardar'),
    t('savedText', 'Datos guardados'),
    t('passwordHeading', 'Contraseña: título'),
    t('currentPasswordLabel', 'Campo contraseña actual'),
    t('newPasswordLabel', 'Campo contraseña nueva'),
    t('passwordHint', 'Ayuda de la contraseña'),
    t('passwordButton', 'Botón cambiar contraseña'),
    ta('passwordChanged', 'Contraseña cambiada'),
    t('wrongPassword', 'Error: contraseña incorrecta'),
    t('sessionsHeading', 'Sesiones: título'),
    ta('logoutAllBody', 'Sesiones: texto'),
    t('logoutAllButton', 'Sesiones: botón'),
    t('deleteHeading', 'Eliminar cuenta: título'),
    ta('deleteBody', 'Eliminar cuenta: texto'),
    t('deletePasswordLabel', 'Eliminar cuenta: campo contraseña'),
    t('deleteButton', 'Eliminar cuenta: botón'),
    ta('errorText', 'Error general'),
  ],
  {
    heading: 'Mis datos',
    intro: 'Con estos datos llenamos el pago por ti.',
    profileHeading: 'Datos personales',
    emailLabel: 'Correo (no se puede cambiar)',
    nameLabel: 'Nombre completo',
    phoneLabel: 'Celular',
    docTypeLabel: 'Tipo de documento',
    docLabel: 'Número de documento',
    marketingLabel: 'Quiero recibir novedades y ofertas de TusPlatos.',
    saveLabel: 'Guardar cambios',
    savedText: 'Guardamos tus datos.',
    passwordHeading: 'Cambiar contraseña',
    currentPasswordLabel: 'Contraseña actual',
    newPasswordLabel: 'Contraseña nueva',
    passwordHint: 'Mínimo 8 caracteres.',
    passwordButton: 'Cambiar contraseña',
    passwordChanged: 'Listo: cambiamos tu contraseña y cerramos la sesión en los demás dispositivos.',
    wrongPassword: 'La contraseña no es correcta.',
    sessionsHeading: 'Sesiones abiertas',
    logoutAllBody: 'Si entraste desde un equipo que no es tuyo, cierra la sesión en todos los dispositivos.',
    logoutAllButton: 'Cerrar sesión en todos los dispositivos',
    deleteHeading: 'Eliminar mi cuenta',
    deleteBody: 'Borramos tu cuenta, tus direcciones y tus datos guardados. Tus pedidos se conservan para garantías y facturación, sin vínculo con la cuenta.',
    deletePasswordLabel: 'Escribe tu contraseña para confirmar',
    deleteButton: 'Eliminar mi cuenta',
    errorText: 'No pudimos completar el cambio. Inténtalo de nuevo en un momento.',
  },
);

const reset = custom(
  'restablecer',
  'Mi cuenta: nueva contraseña',
  [
    t('heading', 'Título'),
    ta('intro', 'Introducción'),
    t('passwordLabel', 'Campo contraseña nueva'),
    t('passwordHint', 'Ayuda de la contraseña'),
    t('submitLabel', 'Botón guardar'),
    ta('doneText', 'Contraseña restablecida'),
    link('doneCta', 'Botón después de restablecer'),
    ta('invalidText', 'Enlace vencido o inválido'),
    link('invalidCta', 'Botón pedir otro enlace'),
    ta('errorText', 'Error general'),
  ],
  {
    heading: 'Crea una contraseña nueva',
    intro: 'Elige una contraseña que no uses en otros sitios.',
    passwordLabel: 'Contraseña nueva',
    passwordHint: 'Mínimo 8 caracteres.',
    submitLabel: 'Guardar y entrar',
    doneText: 'Listo, ya entraste con tu contraseña nueva.',
    doneCta: { label: 'Ver mis pedidos', href: '/cuenta/pedidos' },
    invalidText: 'Este enlace venció o ya se usó. Pide uno nuevo desde Mi cuenta.',
    invalidCta: { label: 'Pedir otro enlace', href: '/cuenta?vista=recuperar' },
    errorText: 'No pudimos guardar la contraseña. Inténtalo de nuevo en un momento.',
  },
);

const page = (title, slug, description, section) => ({ title, slug, description, seoTitle: title, seoImage: '', sections: [section] });

/** Páginas de la cuenta (no van al sitemap ni al menú; la tienda las muestra solo con `customerAccounts.enabled`). */
export const accountPages = [
  page('Mi cuenta', '/cuenta', 'Cuenta de cliente: entrar, crear cuenta, recuperar contraseña', entry),
  page('Mis pedidos', '/cuenta/pedidos', 'Cuenta de cliente: pedidos', orders),
  page('Mis direcciones', '/cuenta/direcciones', 'Cuenta de cliente: direcciones', addresses),
  page('Mis datos', '/cuenta/datos', 'Cuenta de cliente: datos y seguridad', profile),
  page('Nueva contraseña', '/cuenta/restablecer', 'Cuenta de cliente: restablecer contraseña', reset),
];

// ───────────── Globales (cabecera y navegación de la cuenta) ─────────────

export const accountGlobals = {
  data: {
    accountLabel: 'Mi cuenta',
    accountGreeting: 'Hola, {nombre}',
    accountOrdersLabel: 'Mis pedidos',
    accountAddressesLabel: 'Mis direcciones',
    accountProfileLabel: 'Mis datos',
    accountLogoutLabel: 'Cerrar sesión',
    showPasswordLabel: 'Mostrar contraseña',
  },
  schema: [
    { key: 'accountLabel', type: 'text', label: 'Cabecera: mi cuenta' },
    { key: 'accountGreeting', type: 'text', label: 'Cuenta: saludo ({nombre})' },
    { key: 'accountOrdersLabel', type: 'text', label: 'Cuenta: menú pedidos' },
    { key: 'accountAddressesLabel', type: 'text', label: 'Cuenta: menú direcciones' },
    { key: 'accountProfileLabel', type: 'text', label: 'Cuenta: menú mis datos' },
    { key: 'accountLogoutLabel', type: 'text', label: 'Cuenta: cerrar sesión' },
    { key: 'showPasswordLabel', type: 'text', label: 'Formularios: mostrar contraseña' },
  ],
};
