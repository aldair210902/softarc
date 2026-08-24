/** Defaults compartidos: página pública SaaS + editor Contenido web. */

export type SaasModule = { title: string; description: string };

export type SaasPlan = {
  name: string;
  target: string;
  monthlyPrice: number;
  setupFee: string;
  features: string[];
  highlight: boolean;
};

export type SaasContent = {
  badge: string;
  title: string;
  titleHighlight: string;
  subtitle: string;
  featured: { title: string; description: string; bullets: string[] };
  showBoxDemo: boolean;
  /** Casos / giros que ofreces hoy */
  modules: SaasModule[];
  /** Formas de contratar (alquiler, venta, etc.) — no son planes con precio */
  modalities: SaasModule[];
  /** Extras opcionales si el cliente lo pide */
  extras: SaasModule[];
  /** Giros futuros (próximamente) */
  comingSoon: SaasModule[];
  /** Vacío = no mostrar bloque de precios en la web */
  plans: SaasPlan[];
  ctaTitle: string;
  ctaText: string;
};

export const DEFAULT_SAAS_CONTENT: SaasContent = {
  badge: 'Software Architec · Sistemas web',
  title: 'Software web para',
  titleHighlight: 'tu empresa',
  subtitle:
    'Desarrollamos y entregamos sistemas web: alquiler con servicio mensual, compra (pago único) o a la medida. También páginas, plataformas, dominios y hosting. En alquiler, el hosting/dominio va incluido en el servicio porque el sistema necesita dónde vivir.',
  featured: {
    title: 'Cómo puedes contratarnos',
    description:
      'Sin planes fijos en la web: cotizamos según el sistema y el alcance. La diferencia clave es alquiler (servicio continuo) vs compra (entrega única).',
    bullets: [
      'Alquiler / suscripción: pagas mensualmente. Incluye uso del sistema, hosting necesario, actualizaciones, backups y mantenimiento mientras el servicio esté activo.',
      'Cuando un sistema se consolida (ej. un producto para clubes), el alquiler puede ser por subdominio: tuclub.producto.pe — sin comprar dominio aparte.',
      'Compra (pago único): se entrega el software con documentos, capacitación una vez, manual y/o video, y acta de entrega firmada. No incluye soporte ni mantenimiento continuo después de la entrega.',
      'A la medida o páginas web + dominios/hosting propios cuando el proyecto lo requiera.',
    ],
  },
  showBoxDemo: false,
  modules: [
    {
      title: 'Tienda online y pedidos',
      description: 'Catálogo, pedidos, ventas y almacenamiento. Ideal si vendes por web o WhatsApp.',
    },
    {
      title: 'Gestión / ERP ligero',
      description: 'Productos, pedidos, clientes y operación diaria — alineado a sistemas que ya hemos entregado.',
    },
    {
      title: 'Gestión de transporte / flota',
      description: 'Operación de servicios de transporte (ej. mototaxis u operación similar) con control de gestión.',
    },
    {
      title: 'POS en tienda física',
      description: 'Caja y ventas en local, cuando las integraciones/APIs lo permitan de forma viable.',
    },
    {
      title: 'Páginas web y plataformas',
      description: 'Sitios corporativos, blogs o plataformas web a medida de tu marca.',
    },
    {
      title: 'Dominios y hosting',
      description:
        'En alquiler, el sistema vive en nuestra infraestructura (dominio propio o subdominio del producto). En compra o web aparte, te ayudamos con dominio/hosting según el caso.',
    },
  ],
  modalities: [
    {
      title: 'Alquiler del sistema',
      description:
        'Servicio mensual: usas el software mientras pagas. Incluye hosting, mantenimiento, actualizaciones y backups. Capacitación según lo acordado.',
    },
    {
      title: 'Alquiler en subdominio (nube SoftArc)',
      description:
        'Cuando el producto tiene nombre propio y demanda (ej. un sistema de clubes), te damos acceso tipo tuclub.producto.pe. Ideal para arrancar rápido sin comprar dominio. Dominio propio (white-label) se cotiza aparte.',
    },
    {
      title: 'Compra / pago único',
      description:
        'Entrega única: instalación y capacitación una vez, manual y/o video, documentos y acta firmada de conformidad. Después de la entrega no aplica soporte ni mantenimiento continuo.',
    },
    {
      title: 'Proyecto a la medida',
      description: 'Diseñamos y programamos según tus procesos cuando necesitas algo exclusivo. Se cotiza aparte.',
    },
    {
      title: 'Web + dominio + hosting',
      description: 'Presencia online y/o infraestructura dedicada. Precios según proveedor y el servicio SoftArc.',
    },
  ],
  extras: [
    {
      title: 'Marca del cliente (white-label)',
      description: 'El sistema con tu logo y marca, no la de Software Architec.',
    },
    {
      title: 'Multi-sucursal y roles',
      description: 'Varias sedes o puntos, con usuarios y permisos por rol.',
    },
    {
      title: 'Reportes y dashboards',
      description: 'Ventas, stock, cobros u otros indicadores que necesites ver de un vistazo.',
    },
    {
      title: 'App móvil (APK)',
      description: 'Si lo necesitas, podemos limitar el alcance a APK para Android o iPhone según lo acordado.',
    },
    {
      title: 'Automatizaciones WhatsApp / correo',
      description: 'Avisos de pedidos, recordatorios u otros flujos — solo si lo pides en la cotización.',
    },
    {
      title: 'Migración de datos',
      description: 'Pasar información desde Excel u otro sistema — servicio aparte si lo requieres.',
    },
    {
      title: 'Facturación / Sunat',
      description: 'Integraciones de boletas u otras APIs solo cuando existan opciones viables y gratuitas (o acordadas).',
    },
    {
      title: 'Contrato y comprobantes',
      description: 'Plantillas de contrato o facturación cuando el cliente lo solicite y las herramientas/APIs lo permitan.',
    },
  ],
  comingSoon: [
    {
      title: 'Productos con subdominio',
      description:
        'Sistemas con marca propia (ej. academias o clubes) accesibles como tucliente.producto.pe cuando haya demanda real.',
    },
    { title: 'Academias', description: 'Gestión de alumnos, horarios y pagos — candidato a producto con subdominio.' },
    { title: 'Clubes de fútbol', description: 'Planteles, torneos y administración — ej. tuclub.pateadon.pe cuando exista el producto.' },
    { title: 'Barberías', description: 'Citas, caja y fidelización del local.' },
    { title: 'Colegios', description: 'Operación administrativa y académica.' },
    { title: 'Veterinarias', description: 'Pacientes, historial y atención del negocio.' },
  ],
  plans: [],
  ctaTitle: 'Cuéntanos qué necesitas',
  ctaText:
    'Escríbenos por WhatsApp o el formulario. Te orientamos con capturas del tipo de sistema (tienda, flota, ERP, etc.) — sin demos interactivas ni precios fijos por ahora.',
};

export function normalizeSaasContent(raw: Partial<SaasContent> | null | undefined): SaasContent {
  const base = DEFAULT_SAAS_CONTENT;
  if (!raw) return base;
  return {
    badge: raw.badge || base.badge,
    title: raw.title || base.title,
    titleHighlight: raw.titleHighlight || base.titleHighlight,
    subtitle: raw.subtitle || base.subtitle,
    featured: {
      title: raw.featured?.title || base.featured.title,
      description: raw.featured?.description || base.featured.description,
      bullets: raw.featured?.bullets?.length ? raw.featured.bullets : base.featured.bullets,
    },
    showBoxDemo: Boolean(raw.showBoxDemo),
    modules: raw.modules?.length ? raw.modules : base.modules,
    modalities: Array.isArray(raw.modalities) && raw.modalities.length ? raw.modalities : base.modalities,
    extras: Array.isArray(raw.extras) && raw.extras.length ? raw.extras : base.extras,
    comingSoon: Array.isArray(raw.comingSoon) && raw.comingSoon.length ? raw.comingSoon : base.comingSoon,
    plans: Array.isArray(raw.plans)
      ? raw.plans.map((p) => ({
          name: p.name || '',
          target: p.target || '',
          monthlyPrice: Number(p.monthlyPrice) || 0,
          setupFee: p.setupFee || '',
          features: Array.isArray(p.features) ? p.features : [],
          highlight: Boolean(p.highlight),
        }))
      : base.plans,
    ctaTitle: raw.ctaTitle || base.ctaTitle,
    ctaText: raw.ctaText || base.ctaText,
  };
}
