import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Cloud, Code2, Globe, HelpCircle, Server } from 'lucide-react';
import { motion } from 'motion/react';
import { apiGet, apiMutate } from '../lib/api';
import {
  DEFAULT_CONTACT_FORM,
  fieldVisible,
  formatMetaForNotes,
  normalizeContactForm,
  type ContactFormSchema,
  type ContactServiceOption,
} from '../lib/contactFormDefaults';
import { cn } from '../lib/utils';

const ICON_MAP: Record<ContactServiceOption['icon'], React.ComponentType<{ className?: string }>> = {
  Cloud,
  Code2,
  Globe,
  Server,
  HelpCircle,
};

const inputClass =
  'w-full px-3 py-2.5 bg-sa-input border border-sa-border rounded-xl text-sa-text text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder-sa-faint';

type Props = {
  className?: string;
};

export function ContactForm({ className }: Props) {
  const [schema, setSchema] = useState<ContactFormSchema>(DEFAULT_CONTACT_FORM);
  const [values, setValues] = useState<Record<string, string>>({});
  const [service, setService] = useState(DEFAULT_CONTACT_FORM.serviceOptions[4]?.value || '');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    apiGet<{ content?: Partial<ContactFormSchema> }>('/api/web-pages/contact-form')
      .then((res) => {
        const next = normalizeContactForm(res?.content);
        setSchema(next);
        setService((prev) => {
          if (next.serviceOptions.some((o) => o.value === prev)) return prev;
          return next.serviceOptions[next.serviceOptions.length - 1]?.value || '';
        });
      })
      .catch(() => setSchema(DEFAULT_CONTACT_FORM));
  }, []);

  const visibleFields = useMemo(
    () => schema.fields.filter((f) => fieldVisible(f, service)),
    [schema.fields, service],
  );

  const setValue = (id: string, value: string) => {
    setValues((prev) => ({ ...prev, [id]: value }));
  };

  const resetForm = (sch: ContactFormSchema) => {
    setValues({});
    setService(sch.serviceOptions[sch.serviceOptions.length - 1]?.value || '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    for (const field of visibleFields) {
      if (!field.required) continue;
      const v = (values[field.id] || '').trim();
      if (!v) {
        setFormError(`Completa: ${field.label}`);
        return;
      }
    }
    if (!service) {
      setFormError('Elige qué necesitas.');
      return;
    }

    const meta: Record<string, string> = {};
    for (const field of visibleFields) {
      if (['contactName', 'companyName', 'phone', 'email'].includes(field.id)) continue;
      const v = (values[field.id] || '').trim();
      if (v) meta[field.id] = v;
    }

    const notes = formatMetaForNotes(schema, { ...values, notes: values.notes || '' }, service);

    setSubmitting(true);
    try {
      await apiMutate('post', '/api/leads', {
        contactName: (values.contactName || '').trim(),
        companyName: (values.companyName || '').trim(),
        phone: (values.phone || '').trim() || null,
        email: (values.email || '').trim() || null,
        serviceOfInterest: service,
        notes,
        meta,
      });
      setSubmitted(true);
      resetForm(schema);
      window.setTimeout(() => setSubmitted(false), 6000);
    } catch {
      setFormError('No se pudo enviar. Inténtalo de nuevo o escríbenos por WhatsApp.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className={cn('bg-sa-panel p-8 md:p-10 rounded-2xl border border-sa-border shadow-2xl', className)}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center text-center py-12"
        >
          <div className="w-20 h-20 bg-green-500/10 border border-green-500/30 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 className="h-10 w-10 text-green-500" />
          </div>
          <h3 className="text-2xl font-bold text-sa-text mb-3">{schema.successTitle}</h3>
          <p className="text-sa-muted max-w-sm">{schema.successMessage}</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={cn('bg-sa-panel p-8 md:p-10 rounded-2xl border border-sa-border shadow-2xl relative', className)}>
      <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent rounded-2xl pointer-events-none" />
      <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
        <div>
          <h3 className="text-xl font-bold text-sa-text mb-1">{schema.title}</h3>
          <p className="text-sm text-sa-muted leading-relaxed">{schema.subtitle}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {visibleFields
            .filter((f) => ['contactName', 'companyName', 'phone', 'email', 'city'].includes(f.id))
            .map((field) => (
              <div key={field.id} className={field.id === 'city' ? 'sm:col-span-2' : undefined}>
                <label className="block text-xs font-semibold text-sa-faint uppercase tracking-wider mb-2">
                  {field.label}
                  {field.required ? ' *' : ''}
                </label>
                <input
                  required={!!field.required}
                  type={field.type === 'email' ? 'email' : field.type === 'tel' ? 'tel' : 'text'}
                  className={inputClass}
                  value={values[field.id] || ''}
                  placeholder={field.placeholder}
                  onChange={(e) => setValue(field.id, e.target.value)}
                />
              </div>
            ))}
        </div>

        <div>
          <label className="block text-xs font-semibold text-sa-faint uppercase tracking-wider mb-2">
            {schema.serviceSectionLabel}
          </label>
          <p className="text-xs text-sa-muted mb-3 leading-relaxed">{schema.serviceSectionHint}</p>
          <div className="grid gap-2.5">
            {schema.serviceOptions.map((opt) => {
              const Icon = ICON_MAP[opt.icon] || HelpCircle;
              const selected = service === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setService(opt.value)}
                  className={cn(
                    'text-left p-3.5 rounded-xl border transition-colors',
                    selected
                      ? 'border-blue-500 bg-blue-600/10'
                      : 'border-sa-border bg-sa-canvas hover:border-blue-500/40',
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        'w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border',
                        selected ? 'bg-blue-600 text-white border-blue-600' : 'bg-sa-panel text-blue-500 border-sa-border',
                      )}
                    >
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-sa-text text-sm">{opt.title}</div>
                      <div className="text-[11px] text-sa-faint font-medium">{opt.subtitle}</div>
                      <p className="text-xs text-sa-muted mt-1 leading-relaxed">{opt.hint}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {visibleFields
          .filter((f) => !['contactName', 'companyName', 'phone', 'email', 'city'].includes(f.id))
          .map((field) => (
            <div key={field.id}>
              <label className="block text-xs font-semibold text-sa-faint uppercase tracking-wider mb-2">
                {field.label}
                {field.required ? ' *' : ''}
              </label>
              {field.hint && <p className="text-xs text-sa-muted mb-2">{field.hint}</p>}

              {field.type === 'textarea' && (
                <textarea
                  required={!!field.required}
                  className={cn(inputClass, 'min-h-[96px] resize-y')}
                  value={values[field.id] || ''}
                  placeholder={field.placeholder}
                  onChange={(e) => setValue(field.id, e.target.value)}
                />
              )}

              {field.type === 'select' && (
                <select
                  required={!!field.required}
                  className={inputClass}
                  value={values[field.id] || ''}
                  onChange={(e) => setValue(field.id, e.target.value)}
                >
                  <option value="">{field.placeholder || 'Selecciona…'}</option>
                  {(field.options || []).map((op) => (
                    <option key={op.value} value={op.value}>
                      {op.label}
                    </option>
                  ))}
                </select>
              )}

              {field.type === 'chips' && (
                <div className="flex flex-wrap gap-2">
                  {(field.options || []).map((op) => {
                    const active = values[field.id] === op.value;
                    return (
                      <button
                        key={op.value}
                        type="button"
                        onClick={() => setValue(field.id, op.value)}
                        className={cn(
                          'px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors',
                          active
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-sa-canvas text-sa-muted border-sa-border hover:text-sa-text hover:border-blue-500/40',
                        )}
                      >
                        {op.label}
                      </button>
                    );
                  })}
                </div>
              )}

              {['text', 'email', 'tel'].includes(field.type) && (
                <input
                  required={!!field.required}
                  type={field.type === 'email' ? 'email' : field.type === 'tel' ? 'tel' : 'text'}
                  className={inputClass}
                  value={values[field.id] || ''}
                  placeholder={field.placeholder}
                  onChange={(e) => setValue(field.id, e.target.value)}
                />
              )}
            </div>
          ))}

        {formError && <p className="text-sm text-red-500">{formError}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-60 transition-colors"
        >
          {submitting ? 'Enviando…' : schema.submitLabel}
        </button>
      </form>
    </div>
  );
}
