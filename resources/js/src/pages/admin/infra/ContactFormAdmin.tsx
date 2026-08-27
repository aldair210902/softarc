import React, { useEffect, useState } from 'react';
import { Plus, Save, Trash2, ClipboardList } from 'lucide-react';
import { Can } from '../../../components/Can';
import { Field, inputClass } from '../../../components/ui/FormModal';
import { apiGet, apiMutate } from '../../../lib/api';
import {
  DEFAULT_CONTACT_FORM,
  normalizeContactForm,
  type ContactFieldType,
  type ContactFormField,
  type ContactFormSchema,
  type ContactServiceOption,
} from '../../../lib/contactFormDefaults';
import { cn } from '../../../lib/utils';
import { useToast } from '../../../components/ui/Toast';

const FIELD_TYPES: { value: ContactFieldType; label: string }[] = [
  { value: 'text', label: 'Texto' },
  { value: 'email', label: 'Email' },
  { value: 'tel', label: 'Teléfono' },
  { value: 'textarea', label: 'Texto largo' },
  { value: 'select', label: 'Lista (select)' },
  { value: 'chips', label: 'Chips / botones' },
];

const ICONS: ContactServiceOption['icon'][] = ['Cloud', 'Code2', 'Globe', 'Server', 'HelpCircle'];

const CORE_LOCKED = new Set(['contactName', 'companyName', 'phone', 'email']);

function newFieldId(): string {
  return `campo_${Date.now().toString(36)}`;
}

export default function ContactFormAdmin() {
  const { toast } = useToast();
  const [schema, setSchema] = useState<ContactFormSchema>(DEFAULT_CONTACT_FORM);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    apiGet<{ content?: Partial<ContactFormSchema> }>('/api/web-pages/contact-form', { fresh: true })
      .then((res) => {
        setSchema(normalizeContactForm(res?.content));
        setLoaded(true);
      })
      .catch(() => {
        setSchema(DEFAULT_CONTACT_FORM);
        setLoaded(true);
      });
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const payload = normalizeContactForm(schema);
      await apiMutate('put', '/api/web-pages/contact-form', {
        title: 'Formulario de contacto',
        content: payload,
        isPublished: true,
      });
      setSchema(payload);
      toast('success', 'Formulario guardado', 'Ya se refleja en la web pública.');
    } catch {
      toast('error', 'Error', 'No se pudo guardar el formulario.');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (idx: number, patch: Partial<ContactFormField>) => {
    setSchema((s) => {
      const fields = [...s.fields];
      fields[idx] = { ...fields[idx], ...patch };
      return { ...s, fields };
    });
  };

  const removeField = (idx: number) => {
    const field = schema.fields[idx];
    if (CORE_LOCKED.has(field.id)) {
      toast('error', 'Campo protegido', 'Ese campo base no se puede eliminar (sí puedes desactivarlo o renombrarlo).');
      return;
    }
    setSchema((s) => ({ ...s, fields: s.fields.filter((_, i) => i !== idx) }));
  };

  const addField = () => {
    setSchema((s) => ({
      ...s,
      fields: [
        ...s.fields,
        {
          id: newFieldId(),
          type: 'text',
          label: 'Nuevo campo',
          placeholder: '',
          required: false,
          enabled: true,
          showWhenServices: [],
          options: [],
          sortOrder: (s.fields.length + 1) * 10,
        },
      ],
    }));
  };

  const updateService = (idx: number, patch: Partial<ContactServiceOption>) => {
    setSchema((s) => {
      const serviceOptions = [...s.serviceOptions];
      serviceOptions[idx] = { ...serviceOptions[idx], ...patch };
      return { ...s, serviceOptions };
    });
  };

  const addService = () => {
    setSchema((s) => ({
      ...s,
      serviceOptions: [
        ...s.serviceOptions,
        {
          value: `Opción ${s.serviceOptions.length + 1}`,
          title: 'Nueva opción',
          subtitle: '',
          hint: '',
          icon: 'HelpCircle',
        },
      ],
    }));
  };

  const removeService = (idx: number) => {
    if (schema.serviceOptions.length <= 1) {
      toast('error', 'No permitido', 'Debe quedar al menos una opción de servicio.');
      return;
    }
    setSchema((s) => ({
      ...s,
      serviceOptions: s.serviceOptions.filter((_, i) => i !== idx),
    }));
  };

  const resetDefaults = () => {
    if (!window.confirm('¿Restaurar el formulario a la plantilla SoftArc por defecto?')) return;
    setSchema(structuredClone(DEFAULT_CONTACT_FORM));
  };

  if (!loaded) {
    return <div className="text-sm text-sa-faint py-10">Cargando formulario…</div>;
  }

  const serviceValues = schema.serviceOptions.map((o) => o.value);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-sa-text tracking-tight flex items-center gap-2">
            <ClipboardList className="h-7 w-7 text-blue-500" />
            Formulario de contacto
          </h1>
          <p className="text-sm text-sa-muted mt-1 max-w-2xl">
            Define textos, opciones de servicio y campos extra (rubro, modalidad, requisitos…).
            Los campos pueden mostrarse solo para ciertos servicios.
          </p>
        </div>
        <Can anyOf={['catalog.manage', 'settings.manage']}>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={resetDefaults}
              className="px-3.5 py-2.5 rounded-xl text-xs font-semibold border border-sa-border text-sa-muted hover:text-sa-text"
            >
              Restaurar plantilla
            </button>
            <button
              type="button"
              onClick={() => void save()}
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </Can>
      </div>

      <div className="bg-sa-panel border border-sa-border rounded-2xl p-5 space-y-4">
        <h2 className="text-sm font-bold text-sa-text uppercase tracking-wider">Textos del bloque</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Título del formulario">
            <input className={inputClass} value={schema.title} onChange={(e) => setSchema({ ...schema, title: e.target.value })} />
          </Field>
          <Field label="Texto del botón enviar">
            <input className={inputClass} value={schema.submitLabel} onChange={(e) => setSchema({ ...schema, submitLabel: e.target.value })} />
          </Field>
          <div className="md:col-span-2">
            <Field label="Subtítulo">
              <textarea className={cn(inputClass, 'min-h-[70px]')} value={schema.subtitle} onChange={(e) => setSchema({ ...schema, subtitle: e.target.value })} />
            </Field>
          </div>
          <Field label="Éxito · título">
            <input className={inputClass} value={schema.successTitle} onChange={(e) => setSchema({ ...schema, successTitle: e.target.value })} />
          </Field>
          <Field label="Éxito · mensaje">
            <input className={inputClass} value={schema.successMessage} onChange={(e) => setSchema({ ...schema, successMessage: e.target.value })} />
          </Field>
          <Field label="Sección servicio · título">
            <input className={inputClass} value={schema.serviceSectionLabel} onChange={(e) => setSchema({ ...schema, serviceSectionLabel: e.target.value })} />
          </Field>
          <Field label="Sección servicio · ayuda">
            <input className={inputClass} value={schema.serviceSectionHint} onChange={(e) => setSchema({ ...schema, serviceSectionHint: e.target.value })} />
          </Field>
        </div>
      </div>

      <div className="bg-sa-panel border border-sa-border rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-bold text-sa-text uppercase tracking-wider">Opciones de servicio</h2>
          <button type="button" onClick={addService} className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
            <Plus className="h-3.5 w-3.5" /> Añadir opción
          </button>
        </div>
        <div className="space-y-3">
          {schema.serviceOptions.map((opt, idx) => (
            <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 rounded-xl border border-sa-border bg-sa-canvas">
              <Field label="Valor interno (se guarda en el lead)">
                <input className={inputClass} value={opt.value} onChange={(e) => updateService(idx, { value: e.target.value })} />
              </Field>
              <Field label="Icono">
                <select className={inputClass} value={opt.icon} onChange={(e) => updateService(idx, { icon: e.target.value as ContactServiceOption['icon'] })}>
                  {ICONS.map((ic) => (
                    <option key={ic} value={ic}>{ic}</option>
                  ))}
                </select>
              </Field>
              <Field label="Título visible">
                <input className={inputClass} value={opt.title} onChange={(e) => updateService(idx, { title: e.target.value })} />
              </Field>
              <Field label="Subtítulo">
                <input className={inputClass} value={opt.subtitle} onChange={(e) => updateService(idx, { subtitle: e.target.value })} />
              </Field>
              <div className="md:col-span-2">
                <Field label="Descripción / hint">
                  <input className={inputClass} value={opt.hint} onChange={(e) => updateService(idx, { hint: e.target.value })} />
                </Field>
              </div>
              <div className="md:col-span-2 flex justify-end">
                <button type="button" onClick={() => removeService(idx)} className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 dark:text-red-400">
                  <Trash2 className="h-3.5 w-3.5" /> Quitar opción
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-sa-panel border border-sa-border rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-bold text-sa-text uppercase tracking-wider">Campos del formulario</h2>
          <button type="button" onClick={addField} className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
            <Plus className="h-3.5 w-3.5" /> Añadir campo
          </button>
        </div>

        <div className="space-y-4">
          {schema.fields.map((field, idx) => (
            <div key={field.id} className="p-4 rounded-xl border border-sa-border bg-sa-canvas space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs font-mono text-sa-faint">id: {field.id}</div>
                <label className="inline-flex items-center gap-2 text-xs font-semibold text-sa-muted">
                  <input
                    type="checkbox"
                    checked={field.enabled !== false}
                    onChange={(e) => updateField(idx, { enabled: e.target.checked })}
                  />
                  Visible en la web
                </label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Field label="Etiqueta">
                  <input className={inputClass} value={field.label} onChange={(e) => updateField(idx, { label: e.target.value })} />
                </Field>
                <Field label="Tipo">
                  <select
                    className={inputClass}
                    value={field.type}
                    disabled={CORE_LOCKED.has(field.id)}
                    onChange={(e) => updateField(idx, { type: e.target.value as ContactFieldType })}
                  >
                    {FIELD_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Orden">
                  <input
                    type="number"
                    className={inputClass}
                    value={field.sortOrder ?? 0}
                    onChange={(e) => updateField(idx, { sortOrder: Number(e.target.value || 0) })}
                  />
                </Field>
                <Field label="Placeholder">
                  <input className={inputClass} value={field.placeholder || ''} onChange={(e) => updateField(idx, { placeholder: e.target.value })} />
                </Field>
                <Field label="Ayuda (hint)">
                  <input className={inputClass} value={field.hint || ''} onChange={(e) => updateField(idx, { hint: e.target.value })} />
                </Field>
                <label className="flex items-end gap-2 text-sm text-sa-muted pb-2">
                  <input
                    type="checkbox"
                    checked={!!field.required}
                    onChange={(e) => updateField(idx, { required: e.target.checked })}
                  />
                  Obligatorio
                </label>
              </div>

              <Field label="Mostrar solo si el servicio es…" hint="Vacío = siempre. Marca uno o más.">
                <div className="flex flex-wrap gap-2">
                  {serviceValues.map((sv) => {
                    const active = (field.showWhenServices || []).includes(sv);
                    return (
                      <button
                        key={sv}
                        type="button"
                        onClick={() => {
                          const current = field.showWhenServices || [];
                          const next = active ? current.filter((x) => x !== sv) : [...current, sv];
                          updateField(idx, { showWhenServices: next });
                        }}
                        className={cn(
                          'px-2.5 py-1 rounded-lg text-[11px] font-semibold border',
                          active
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-sa-panel text-sa-muted border-sa-border',
                        )}
                      >
                        {sv}
                      </button>
                    );
                  })}
                </div>
              </Field>

              {['select', 'chips'].includes(field.type) && (
                <Field label="Opciones (una por línea: valor|etiqueta o solo texto)">
                  <textarea
                    className={cn(inputClass, 'min-h-[90px] font-mono text-xs')}
                    value={(field.options || []).map((o) => (o.value === o.label ? o.value : `${o.value}|${o.label}`)).join('\n')}
                    onChange={(e) => {
                      const options = e.target.value
                        .split('\n')
                        .map((line) => line.trim())
                        .filter(Boolean)
                        .map((line) => {
                          const [value, label] = line.split('|').map((p) => p.trim());
                          return { value: value || label || '', label: label || value || '' };
                        });
                      updateField(idx, { options });
                    }}
                  />
                </Field>
              )}

              {!CORE_LOCKED.has(field.id) && (
                <div className="flex justify-end">
                  <button type="button" onClick={() => removeField(idx)} className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 dark:text-red-400">
                    <Trash2 className="h-3.5 w-3.5" /> Eliminar campo
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
