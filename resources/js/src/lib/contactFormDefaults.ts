/** Esquema del formulario público Contáctanos (editable desde SoftArc). */

export type ContactServiceOption = {
  value: string;
  title: string;
  subtitle: string;
  hint: string;
  icon: 'Cloud' | 'Code2' | 'Globe' | 'Server' | 'HelpCircle';
};

export type ContactFieldType = 'text' | 'email' | 'tel' | 'textarea' | 'select' | 'chips';

export type ContactFormField = {
  id: string;
  type: ContactFieldType;
  label: string;
  placeholder?: string;
  hint?: string;
  required?: boolean;
  enabled?: boolean;
  /** Vacío = siempre visible. Si hay valores, solo cuando el servicio elegido coincide. */
  showWhenServices?: string[];
  options?: { value: string; label: string }[];
  sortOrder?: number;
};

export type ContactFormSchema = {
  title: string;
  subtitle: string;
  submitLabel: string;
  successTitle: string;
  successMessage: string;
  serviceSectionLabel: string;
  serviceSectionHint: string;
  serviceOptions: ContactServiceOption[];
  fields: ContactFormField[];
};

export const DEFAULT_CONTACT_FORM: ContactFormSchema = {
  title: 'Cuéntanos tu necesidad',
  subtitle:
    'Completa lo que puedas. Si ya sabes qué sistema quieres, llena rubro y requerimientos; si aún dudas, elige “No estoy seguro”.',
  submitLabel: 'Enviar solicitud',
  successTitle: '¡Solicitud enviada!',
  successMessage: 'Te contactaremos pronto. Si es urgente, escríbenos también por WhatsApp.',
  serviceSectionLabel: '¿Qué necesitas?',
  serviceSectionHint:
    'Elige la opción más cercana. Según tu elección aparecerán preguntas extra para cotizarte mejor.',
  serviceOptions: [
    {
      value: 'Sistemas web / ERP',
      title: 'Sistema listo para usar',
      subtitle: 'SaaS / ERP',
      hint: 'Software listo (tienda, inventario, cobros, flota…). Alquiler o compra.',
      icon: 'Cloud',
    },
    {
      value: 'Desarrollo a la Medida',
      title: 'Software a tu medida',
      subtitle: 'Proyecto a pedido',
      hint: 'Ningún sistema genérico te alcanza: lo diseñamos según tu proceso.',
      icon: 'Code2',
    },
    {
      value: 'Páginas Web / Landing Pages',
      title: 'Página web o landing',
      subtitle: 'Presencia online',
      hint: 'Web de empresa, catálogo o landing para captar clientes y WhatsApp.',
      icon: 'Globe',
    },
    {
      value: 'Asesoría Técnica y Hosting',
      title: 'Hosting y soporte',
      subtitle: 'Infraestructura',
      hint: 'Dominio, hosting y que tu web o sistema esté online.',
      icon: 'Server',
    },
    {
      value: 'No estoy seguro — quiero asesoría',
      title: 'No estoy seguro aún',
      subtitle: 'Te orientamos',
      hint: 'Descríbenos el problema de tu negocio y te recomendamos la mejor opción.',
      icon: 'HelpCircle',
    },
  ],
  fields: [
    {
      id: 'contactName',
      type: 'text',
      label: 'Nombre completo',
      placeholder: 'Tu nombre',
      required: true,
      enabled: true,
      sortOrder: 10,
    },
    {
      id: 'companyName',
      type: 'text',
      label: 'Empresa / negocio',
      placeholder: 'Razón social o nombre comercial',
      required: true,
      enabled: true,
      sortOrder: 20,
    },
    {
      id: 'phone',
      type: 'tel',
      label: 'Teléfono / WhatsApp',
      placeholder: '+51 999…',
      required: true,
      enabled: true,
      sortOrder: 30,
    },
    {
      id: 'email',
      type: 'email',
      label: 'Correo electrónico',
      placeholder: 'correo@empresa.com',
      required: true,
      enabled: true,
      sortOrder: 40,
    },
    {
      id: 'city',
      type: 'text',
      label: 'Ciudad / distrito',
      placeholder: 'Ej: Lima, Arequipa…',
      required: false,
      enabled: true,
      sortOrder: 50,
    },
    {
      id: 'industry',
      type: 'select',
      label: 'Rubro / giro del negocio',
      placeholder: 'Selecciona…',
      required: true,
      enabled: true,
      sortOrder: 60,
      showWhenServices: ['Sistemas web / ERP', 'Desarrollo a la Medida'],
      options: [
        { value: 'Retail / tienda', label: 'Retail / tienda' },
        { value: 'Restaurante / food', label: 'Restaurante / food' },
        { value: 'Servicios profesionales', label: 'Servicios profesionales' },
        { value: 'Salud / clínica', label: 'Salud / clínica' },
        { value: 'Educación', label: 'Educación' },
        { value: 'Logística / flota', label: 'Logística / flota' },
        { value: 'Manufactura', label: 'Manufactura' },
        { value: 'Inmobiliaria', label: 'Inmobiliaria' },
        { value: 'Otro', label: 'Otro' },
      ],
    },
    {
      id: 'modality',
      type: 'chips',
      label: '¿Cómo te gustaría contratarlo?',
      required: true,
      enabled: true,
      sortOrder: 70,
      showWhenServices: ['Sistemas web / ERP', 'Desarrollo a la Medida'],
      options: [
        { value: 'Alquiler mensual', label: 'Alquiler mensual' },
        { value: 'Compra (pago único)', label: 'Compra (pago único)' },
        { value: 'Aún no sé', label: 'Aún no sé' },
      ],
    },
    {
      id: 'usersCount',
      type: 'chips',
      label: '¿Cuántas personas lo usarían?',
      required: false,
      enabled: true,
      sortOrder: 80,
      showWhenServices: ['Sistemas web / ERP', 'Desarrollo a la Medida'],
      options: [
        { value: '1-3', label: '1–3' },
        { value: '4-10', label: '4–10' },
        { value: '11-30', label: '11–30' },
        { value: '30+', label: 'Más de 30' },
      ],
    },
    {
      id: 'hasCurrentSystem',
      type: 'chips',
      label: '¿Hoy cómo gestionas eso?',
      required: false,
      enabled: true,
      sortOrder: 90,
      showWhenServices: ['Sistemas web / ERP', 'Desarrollo a la Medida'],
      options: [
        { value: 'Excel / papel', label: 'Excel / papel' },
        { value: 'Otro software', label: 'Otro software' },
        { value: 'Nada todavía', label: 'Nada todavía' },
      ],
    },
    {
      id: 'urgency',
      type: 'chips',
      label: '¿Para cuándo lo necesitas?',
      required: false,
      enabled: true,
      sortOrder: 100,
      showWhenServices: [
        'Sistemas web / ERP',
        'Desarrollo a la Medida',
        'Páginas Web / Landing Pages',
        'Asesoría Técnica y Hosting',
      ],
      options: [
        { value: 'Lo antes posible', label: 'Lo antes posible' },
        { value: '1-3 meses', label: '1–3 meses' },
        { value: 'Explorando', label: 'Solo explorando' },
      ],
    },
    {
      id: 'webGoal',
      type: 'chips',
      label: 'Objetivo de la web',
      required: false,
      enabled: true,
      sortOrder: 110,
      showWhenServices: ['Páginas Web / Landing Pages'],
      options: [
        { value: 'Landing / captar clientes', label: 'Landing / captar clientes' },
        { value: 'Web corporativa', label: 'Web corporativa' },
        { value: 'Blog / contenido', label: 'Blog / contenido' },
        { value: 'Catálogo online', label: 'Catálogo online' },
      ],
    },
    {
      id: 'hostingNeed',
      type: 'chips',
      label: '¿Qué necesitas de infraestructura?',
      required: false,
      enabled: true,
      sortOrder: 120,
      showWhenServices: ['Asesoría Técnica y Hosting'],
      options: [
        { value: 'Dominio nuevo', label: 'Dominio nuevo' },
        { value: 'Hosting / renovación', label: 'Hosting / renovación' },
        { value: 'Migración', label: 'Migración' },
        { value: 'Todo (dominio + hosting)', label: 'Todo (dominio + hosting)' },
      ],
    },
    {
      id: 'requirements',
      type: 'textarea',
      label: 'Requerimientos / problema a resolver',
      placeholder: 'Ej: quiero controlar stock y ventas por WhatsApp; hoy uso Excel…',
      hint: 'Mientras más concreto, más rápida y exacta será la cotización.',
      required: true,
      enabled: true,
      sortOrder: 200,
      showWhenServices: [
        'Sistemas web / ERP',
        'Desarrollo a la Medida',
        'Páginas Web / Landing Pages',
        'Asesoría Técnica y Hosting',
        'No estoy seguro — quiero asesoría',
      ],
    },
    {
      id: 'notes',
      type: 'textarea',
      label: 'Algo más que debamos saber (opcional)',
      placeholder: 'Horario de contacto, presupuesto aproximado, links, etc.',
      required: false,
      enabled: true,
      sortOrder: 210,
    },
  ],
};

const CORE_IDS = new Set(['contactName', 'companyName', 'phone', 'email', 'notes']);

export function normalizeContactForm(raw?: Partial<ContactFormSchema> | null): ContactFormSchema {
  const base = DEFAULT_CONTACT_FORM;
  if (!raw || typeof raw !== 'object') return structuredClone(base);

  const serviceOptions =
    Array.isArray(raw.serviceOptions) && raw.serviceOptions.length > 0
      ? raw.serviceOptions.map((o) => ({
          value: String(o.value || '').trim() || 'Otro',
          title: String(o.title || o.value || ''),
          subtitle: String(o.subtitle || ''),
          hint: String(o.hint || ''),
          icon: (['Cloud', 'Code2', 'Globe', 'Server', 'HelpCircle'].includes(String(o.icon))
            ? o.icon
            : 'HelpCircle') as ContactServiceOption['icon'],
        }))
      : structuredClone(base.serviceOptions);

  const fieldsRaw = Array.isArray(raw.fields) ? raw.fields : base.fields;
  const fields = fieldsRaw
    .filter((f) => f && f.id)
    .map((f, i) => ({
      id: String(f.id).trim(),
      type: (['text', 'email', 'tel', 'textarea', 'select', 'chips'].includes(String(f.type))
        ? f.type
        : 'text') as ContactFieldType,
      label: String(f.label || f.id),
      placeholder: f.placeholder ? String(f.placeholder) : '',
      hint: f.hint ? String(f.hint) : '',
      required: !!f.required,
      enabled: f.enabled !== false,
      showWhenServices: Array.isArray(f.showWhenServices)
        ? f.showWhenServices.map(String).filter(Boolean)
        : [],
      options: Array.isArray(f.options)
        ? f.options.map((op) => ({
            value: String(op.value || op.label || ''),
            label: String(op.label || op.value || ''),
          }))
        : [],
      sortOrder: typeof f.sortOrder === 'number' ? f.sortOrder : (i + 1) * 10,
    }))
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  // Asegurar campos core mínimos
  for (const core of base.fields.filter((f) => CORE_IDS.has(f.id))) {
    if (!fields.some((f) => f.id === core.id)) {
      fields.push({ ...core, enabled: true });
    }
  }
  fields.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  return {
    title: String(raw.title || base.title),
    subtitle: String(raw.subtitle || base.subtitle),
    submitLabel: String(raw.submitLabel || base.submitLabel),
    successTitle: String(raw.successTitle || base.successTitle),
    successMessage: String(raw.successMessage || base.successMessage),
    serviceSectionLabel: String(raw.serviceSectionLabel || base.serviceSectionLabel),
    serviceSectionHint: String(raw.serviceSectionHint || base.serviceSectionHint),
    serviceOptions,
    fields,
  };
}

export function fieldVisible(field: ContactFormField, service: string): boolean {
  if (field.enabled === false) return false;
  const when = field.showWhenServices || [];
  if (when.length === 0) return true;
  return when.includes(service);
}

export function formatMetaForNotes(
  schema: ContactFormSchema,
  meta: Record<string, string>,
  service: string,
): string {
  const lines: string[] = [];
  if (service) lines.push(`Servicio: ${service}`);
  for (const field of schema.fields) {
    if (CORE_IDS.has(field.id) && field.id !== 'notes') continue;
    if (field.id === 'notes') continue;
    const val = (meta[field.id] || '').trim();
    if (!val) continue;
    lines.push(`${field.label}: ${val}`);
  }
  const extraNotes = (meta.notes || '').trim();
  if (extraNotes) lines.push(`Notas: ${extraNotes}`);
  return lines.join('\n');
}
