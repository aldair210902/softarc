import React, { useCallback, useEffect, useState } from 'react';
import { FilePen, Plus, Save, Trash2 } from 'lucide-react';
import { Can } from '../../../components/Can';
import { Field, inputClass } from '../../../components/ui/FormModal';
import { useCompanySettings } from '../../../hooks/useCompanySettings';
import { apiGet, apiMutate } from '../../../lib/api';
import { cn } from '../../../lib/utils';
import {
  DEFAULT_SAAS_CONTENT,
  type SaasContent,
  type SaasModule,
  type SaasPlan,
} from '../../../lib/saasWebDefaults';

type Pillar = {
  key: string;
  title: string;
  description: string;
  bullets: string[];
  ctaLabel: string;
  ctaPath: string;
  icon: string;
};

type SimplePageContent = { title: string; subtitle: string };

type WebPageRow = {
  id: number;
  slug: string;
  title: string | null;
  content: Record<string, unknown>;
  isPublished: boolean;
};

type TabId = 'home-pillars' | 'saas' | 'a-medida' | 'web' | 'infra';

const TABS: { id: TabId; label: string }[] = [
  { id: 'home-pillars', label: 'Pilares Home' },
  { id: 'saas', label: 'SaaS' },
  { id: 'a-medida', label: 'A medida' },
  { id: 'web', label: 'Web' },
  { id: 'infra', label: 'Infra' },
];

const ICON_OPTIONS = ['Cloud', 'Code2', 'Globe', 'Server'];

const emptyPillars = (): Pillar[] => [
  { key: 'saas', title: '', description: '', bullets: ['', '', ''], ctaLabel: '', ctaPath: '/servicios/saas', icon: 'Cloud' },
  { key: 'medida', title: '', description: '', bullets: ['', '', ''], ctaLabel: '', ctaPath: '/servicios/a-la-medida', icon: 'Code2' },
  { key: 'web', title: '', description: '', bullets: ['', '', ''], ctaLabel: '', ctaPath: '/servicios/paginas-web-blogs', icon: 'Globe' },
  { key: 'infra', title: '', description: '', bullets: ['', '', ''], ctaLabel: '', ctaPath: '/servicios/infraestructura-soporte', icon: 'Server' },
];

const emptySaas = (): SaasContent => ({
  ...DEFAULT_SAAS_CONTENT,
  featured: {
    ...DEFAULT_SAAS_CONTENT.featured,
    bullets: [...DEFAULT_SAAS_CONTENT.featured.bullets],
  },
  modules: DEFAULT_SAAS_CONTENT.modules.map((m) => ({ ...m })),
  modalities: DEFAULT_SAAS_CONTENT.modalities.map((m) => ({ ...m })),
  extras: DEFAULT_SAAS_CONTENT.extras.map((m) => ({ ...m })),
  comingSoon: DEFAULT_SAAS_CONTENT.comingSoon.map((m) => ({ ...m })),
  plans: [],
});

function asPillars(content: Record<string, unknown> | undefined): Pillar[] {
  const raw = (content?.pillars as Pillar[] | undefined) || [];
  if (!Array.isArray(raw) || raw.length === 0) return emptyPillars();
  return raw.slice(0, 4).map((p, i) => ({
    key: p.key || emptyPillars()[i].key,
    title: p.title || '',
    description: p.description || '',
    bullets: Array.isArray(p.bullets) && p.bullets.length ? [...p.bullets] : ['', '', ''],
    ctaLabel: p.ctaLabel || '',
    ctaPath: p.ctaPath || '',
    icon: p.icon || ICON_OPTIONS[i] || 'Cloud',
  }));
}

function asSaas(content: Record<string, unknown> | undefined): SaasContent {
  const base = emptySaas();
  if (!content || Object.keys(content).length === 0) return base;
  const featured = (content.featured as SaasContent['featured']) || base.featured;
  return {
    badge: String(content.badge ?? base.badge),
    title: String(content.title ?? base.title),
    titleHighlight: String(content.titleHighlight ?? base.titleHighlight),
    subtitle: String(content.subtitle ?? base.subtitle),
    featured: {
      title: featured.title || base.featured.title,
      description: featured.description || base.featured.description,
      bullets: Array.isArray(featured.bullets) && featured.bullets.length ? [...featured.bullets] : [...base.featured.bullets],
    },
    showBoxDemo: Boolean(content.showBoxDemo),
    modules: Array.isArray(content.modules) && content.modules.length
      ? (content.modules as SaasModule[]).map((m) => ({ title: m.title || '', description: m.description || '' }))
      : base.modules,
    modalities: Array.isArray(content.modalities) && content.modalities.length
      ? (content.modalities as SaasModule[]).map((m) => ({ title: m.title || '', description: m.description || '' }))
      : base.modalities,
    extras: Array.isArray(content.extras) && content.extras.length
      ? (content.extras as SaasModule[]).map((m) => ({ title: m.title || '', description: m.description || '' }))
      : base.extras,
    comingSoon: Array.isArray(content.comingSoon) && content.comingSoon.length
      ? (content.comingSoon as SaasModule[]).map((m) => ({ title: m.title || '', description: m.description || '' }))
      : base.comingSoon,
    plans: Array.isArray(content.plans)
      ? (content.plans as SaasPlan[]).map((p) => ({
          name: p.name || '',
          target: p.target || '',
          monthlyPrice: Number(p.monthlyPrice) || 0,
          setupFee: p.setupFee || '',
          features: Array.isArray(p.features) && p.features.length ? [...p.features] : [''],
          highlight: Boolean(p.highlight),
        }))
      : [],
    ctaTitle: String(content.ctaTitle ?? base.ctaTitle),
    ctaText: String(content.ctaText ?? base.ctaText),
  };
}

function asSimple(content: Record<string, unknown> | undefined): SimplePageContent {
  return {
    title: String(content?.title ?? ''),
    subtitle: String(content?.subtitle ?? ''),
  };
}

export default function WebPages() {
  const { settings } = useCompanySettings();
  const currency = settings.currencySymbol || 'S/';
  const [tab, setTab] = useState<TabId>('home-pillars');
  const [pages, setPages] = useState<WebPageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [pillars, setPillars] = useState<Pillar[]>(emptyPillars());
  const [saas, setSaas] = useState<SaasContent>(emptySaas());
  const [simple, setSimple] = useState<SimplePageContent>({ title: '', subtitle: '' });
  const [published, setPublished] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    apiGet<WebPageRow[]>('/api/web-pages', { fresh: true })
      .then((rows) => {
        setPages(rows);
        const current = rows.find((r) => r.slug === tab);
        if (tab === 'home-pillars') {
          setPillars(asPillars(current?.content));
        } else if (tab === 'saas') {
          setSaas(asSaas(current?.content));
        } else {
          setSimple(asSimple(current?.content));
        }
        setPublished(current?.isPublished ?? true);
      })
      .catch(() => setError('No se pudo cargar el contenido web.'))
      .finally(() => setLoading(false));
  }, [tab]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const current = pages.find((r) => r.slug === tab);
    if (!pages.length) return;
    if (tab === 'home-pillars') setPillars(asPillars(current?.content));
    else if (tab === 'saas') setSaas(asSaas(current?.content));
    else setSimple(asSimple(current?.content));
    setPublished(current?.isPublished ?? true);
    setMessage(null);
    setError(null);
  }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

  const pageTitle = pages.find((p) => p.slug === tab)?.title || TABS.find((t) => t.id === tab)?.label || tab;

  const save = async () => {
    setSaving(true);
    setMessage(null);
    setError(null);
    let content: Record<string, unknown>;
    if (tab === 'home-pillars') {
      content = {
        pillars: pillars.map((p) => ({
          ...p,
          bullets: p.bullets.map((b) => b.trim()).filter(Boolean),
        })),
      };
    } else if (tab === 'saas') {
      content = {
        ...saas,
        featured: {
          ...saas.featured,
          bullets: saas.featured.bullets.map((b) => b.trim()).filter(Boolean),
        },
        modules: saas.modules.filter((m) => m.title.trim() || m.description.trim()),
        modalities: (saas.modalities || []).filter((m) => m.title.trim() || m.description.trim()),
        extras: (saas.extras || []).filter((m) => m.title.trim() || m.description.trim()),
        comingSoon: (saas.comingSoon || []).filter((m) => m.title.trim() || m.description.trim()),
        plans: saas.plans.map((p) => ({
          ...p,
          monthlyPrice: Number(p.monthlyPrice) || 0,
          features: p.features.map((f) => f.trim()).filter(Boolean),
        })),
      };
    } else {
      content = { ...simple };
    }

    try {
      await apiMutate('put', `/api/web-pages/${tab}`, {
        title: pageTitle,
        content,
        isPublished: published,
      });
      setMessage('Contenido guardado correctamente.');
      load();
    } catch {
      setError('Error al guardar. Revisa los campos e intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  const isStub = tab === 'a-medida' || tab === 'web' || tab === 'infra';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-sa-text flex items-center gap-2">
            <FilePen className="h-5 w-5 text-blue-500" />
            Contenido web
          </h1>
          <p className="text-sm text-sa-muted mt-1">
            Textos de la web pública: “Nuestros servicios” (4 pilares), página SaaS y más. No confundir con Demos de sistemas.
          </p>
        </div>
        <Can anyOf={['catalog.manage', 'settings.manage']}>
          <div className="flex flex-wrap gap-2">
            {tab === 'saas' && (
              <button
                type="button"
                onClick={() => {
                  setSaas(emptySaas());
                  setMessage('Textos SoftArc cargados en el formulario. Pulsa Guardar para publicar.');
                  setError(null);
                }}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-sa-text bg-sa-panel border border-sa-border hover:border-sa-border-strong"
              >
                Restablecer textos SoftArc
              </button>
            )}
            <button
              type="button"
              onClick={save}
              disabled={saving || loading}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </div>
        </Can>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-sa-border pb-3">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors',
              tab === t.id
                ? 'bg-blue-600 text-white'
                : 'bg-sa-panel-2 text-sa-muted hover:text-sa-text border border-sa-border',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {message && (
        <div className="text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-2">{message}</div>
      )}
      {error && (
        <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-2">{error}</div>
      )}

      {loading ? (
        <div className="text-sm text-sa-faint py-12 text-center">Cargando contenido…</div>
      ) : (
        <Can
          anyOf={['catalog.manage', 'settings.manage']}
          fallback={<div className="text-sm text-sa-muted">No tienes permiso para editar el contenido web.</div>}
        >
          <label className="inline-flex items-center gap-2 text-sm text-sa-text mb-4">
            <input
              type="checkbox"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
              className="rounded border-sa-border"
            />
            Publicado (visible en el sitio público)
          </label>

          {tab === 'home-pillars' && (
            <div className="space-y-8">
              {pillars.map((pillar, idx) => (
                <div key={pillar.key} className="bg-sa-panel border border-sa-border rounded-2xl p-5 space-y-4">
                  <h3 className="text-sm font-bold text-sa-text">Pilar {idx + 1}</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <Field label="Título">
                      <input
                        className={inputClass}
                        value={pillar.title}
                        onChange={(e) => {
                          const next = [...pillars];
                          next[idx] = { ...pillar, title: e.target.value };
                          setPillars(next);
                        }}
                      />
                    </Field>
                    <Field label="Icono">
                      <select
                        className={inputClass}
                        value={pillar.icon}
                        onChange={(e) => {
                          const next = [...pillars];
                          next[idx] = { ...pillar, icon: e.target.value };
                          setPillars(next);
                        }}
                      >
                        {ICON_OPTIONS.map((icon) => (
                          <option key={icon} value={icon}>{icon}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="CTA etiqueta">
                      <input
                        className={inputClass}
                        value={pillar.ctaLabel}
                        onChange={(e) => {
                          const next = [...pillars];
                          next[idx] = { ...pillar, ctaLabel: e.target.value };
                          setPillars(next);
                        }}
                      />
                    </Field>
                    <Field label="CTA ruta">
                      <input
                        className={inputClass}
                        value={pillar.ctaPath}
                        onChange={(e) => {
                          const next = [...pillars];
                          next[idx] = { ...pillar, ctaPath: e.target.value };
                          setPillars(next);
                        }}
                      />
                    </Field>
                  </div>
                  <Field label="Descripción">
                    <textarea
                      className={cn(inputClass, 'min-h-[70px]')}
                      value={pillar.description}
                      onChange={(e) => {
                        const next = [...pillars];
                        next[idx] = { ...pillar, description: e.target.value };
                        setPillars(next);
                      }}
                    />
                  </Field>
                  <Field label="Bullets (uno por línea)">
                    <textarea
                      className={cn(inputClass, 'min-h-[90px]')}
                      value={pillar.bullets.join('\n')}
                      onChange={(e) => {
                        const next = [...pillars];
                        next[idx] = { ...pillar, bullets: e.target.value.split('\n') };
                        setPillars(next);
                      }}
                    />
                  </Field>
                </div>
              ))}
            </div>
          )}

          {tab === 'saas' && (
            <div className="space-y-8">
              <div className="bg-sa-panel border border-sa-border rounded-2xl p-5 space-y-4">
                <h3 className="text-sm font-bold text-sa-text">Cabecera</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <Field label="Badge">
                    <input className={inputClass} value={saas.badge} onChange={(e) => setSaas({ ...saas, badge: e.target.value })} />
                  </Field>
                  <Field label="Título (resaltado)">
                    <input className={inputClass} value={saas.titleHighlight} onChange={(e) => setSaas({ ...saas, titleHighlight: e.target.value })} />
                  </Field>
                </div>
                <Field label="Título">
                  <input className={inputClass} value={saas.title} onChange={(e) => setSaas({ ...saas, title: e.target.value })} />
                </Field>
                <Field label="Subtítulo">
                  <textarea className={cn(inputClass, 'min-h-[70px]')} value={saas.subtitle} onChange={(e) => setSaas({ ...saas, subtitle: e.target.value })} />
                </Field>
                <label className="inline-flex items-center gap-2 text-sm text-sa-text">
                  <input
                    type="checkbox"
                    checked={saas.showBoxDemo}
                    onChange={(e) => setSaas({ ...saas, showBoxDemo: e.target.checked })}
                    className="rounded border-sa-border"
                  />
                  Mostrar simulador de box (demo interactiva)
                </label>
              </div>

              <div className="bg-sa-panel border border-sa-border rounded-2xl p-5 space-y-4">
                <h3 className="text-sm font-bold text-sa-text">Cómo contratarnos</h3>
                <Field label="Título">
                  <input
                    className={inputClass}
                    value={saas.featured.title}
                    onChange={(e) => setSaas({ ...saas, featured: { ...saas.featured, title: e.target.value } })}
                  />
                </Field>
                <Field label="Descripción">
                  <textarea
                    className={cn(inputClass, 'min-h-[90px]')}
                    value={saas.featured.description}
                    onChange={(e) => setSaas({ ...saas, featured: { ...saas.featured, description: e.target.value } })}
                  />
                </Field>
                <Field label="Bullets (uno por línea)">
                  <textarea
                    className={cn(inputClass, 'min-h-[90px]')}
                    value={saas.featured.bullets.join('\n')}
                    onChange={(e) => setSaas({ ...saas, featured: { ...saas.featured, bullets: e.target.value.split('\n') } })}
                  />
                </Field>
              </div>

              <div className="bg-sa-panel border border-sa-border rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-sa-text">Modalidades (alquiler, venta…)</h3>
                  <button
                    type="button"
                    onClick={() => setSaas({ ...saas, modalities: [...(saas.modalities || []), { title: '', description: '' }] })}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-400 hover:text-blue-300"
                  >
                    <Plus className="h-3.5 w-3.5" /> Añadir
                  </button>
                </div>
                {(saas.modalities || []).map((mod, idx) => (
                  <div key={idx} className="grid md:grid-cols-[1fr_2fr_auto] gap-3 items-start border-t border-sa-border pt-3">
                    <Field label="Título">
                      <input
                        className={inputClass}
                        value={mod.title}
                        onChange={(e) => {
                          const modalities = [...(saas.modalities || [])];
                          modalities[idx] = { ...mod, title: e.target.value };
                          setSaas({ ...saas, modalities });
                        }}
                      />
                    </Field>
                    <Field label="Descripción">
                      <textarea
                        className={cn(inputClass, 'min-h-[60px]')}
                        value={mod.description}
                        onChange={(e) => {
                          const modalities = [...(saas.modalities || [])];
                          modalities[idx] = { ...mod, description: e.target.value };
                          setSaas({ ...saas, modalities });
                        }}
                      />
                    </Field>
                    <button
                      type="button"
                      onClick={() => setSaas({ ...saas, modalities: (saas.modalities || []).filter((_, i) => i !== idx) })}
                      className="mt-6 p-2 text-sa-muted hover:text-red-400"
                      title="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="bg-sa-panel border border-sa-border rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-sa-text">Qué resolvemos (giros)</h3>
                  <button
                    type="button"
                    onClick={() => setSaas({ ...saas, modules: [...saas.modules, { title: '', description: '' }] })}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-400 hover:text-blue-300"
                  >
                    <Plus className="h-3.5 w-3.5" /> Añadir
                  </button>
                </div>
                {saas.modules.map((mod, idx) => (
                  <div key={idx} className="grid md:grid-cols-[1fr_2fr_auto] gap-3 items-start border-t border-sa-border pt-3">
                    <Field label="Título">
                      <input
                        className={inputClass}
                        value={mod.title}
                        onChange={(e) => {
                          const modules = [...saas.modules];
                          modules[idx] = { ...mod, title: e.target.value };
                          setSaas({ ...saas, modules });
                        }}
                      />
                    </Field>
                    <Field label="Descripción">
                      <textarea
                        className={cn(inputClass, 'min-h-[60px]')}
                        value={mod.description}
                        onChange={(e) => {
                          const modules = [...saas.modules];
                          modules[idx] = { ...mod, description: e.target.value };
                          setSaas({ ...saas, modules });
                        }}
                      />
                    </Field>
                    <button
                      type="button"
                      onClick={() => setSaas({ ...saas, modules: saas.modules.filter((_, i) => i !== idx) })}
                      className="mt-6 p-2 text-sa-muted hover:text-red-400"
                      title="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="bg-sa-panel border border-sa-border rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-sa-text">Opciones bajo demanda</h3>
                  <button
                    type="button"
                    onClick={() => setSaas({ ...saas, extras: [...(saas.extras || []), { title: '', description: '' }] })}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-400 hover:text-blue-300"
                  >
                    <Plus className="h-3.5 w-3.5" /> Añadir
                  </button>
                </div>
                {(saas.extras || []).map((mod, idx) => (
                  <div key={idx} className="grid md:grid-cols-[1fr_2fr_auto] gap-3 items-start border-t border-sa-border pt-3">
                    <Field label="Título">
                      <input
                        className={inputClass}
                        value={mod.title}
                        onChange={(e) => {
                          const extras = [...(saas.extras || [])];
                          extras[idx] = { ...mod, title: e.target.value };
                          setSaas({ ...saas, extras });
                        }}
                      />
                    </Field>
                    <Field label="Descripción">
                      <textarea
                        className={cn(inputClass, 'min-h-[60px]')}
                        value={mod.description}
                        onChange={(e) => {
                          const extras = [...(saas.extras || [])];
                          extras[idx] = { ...mod, description: e.target.value };
                          setSaas({ ...saas, extras });
                        }}
                      />
                    </Field>
                    <button
                      type="button"
                      onClick={() => setSaas({ ...saas, extras: (saas.extras || []).filter((_, i) => i !== idx) })}
                      className="mt-6 p-2 text-sa-muted hover:text-red-400"
                      title="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="bg-sa-panel border border-sa-border rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-sa-text">Próximamente</h3>
                  <button
                    type="button"
                    onClick={() => setSaas({ ...saas, comingSoon: [...(saas.comingSoon || []), { title: '', description: '' }] })}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-400 hover:text-blue-300"
                  >
                    <Plus className="h-3.5 w-3.5" /> Añadir
                  </button>
                </div>
                {(saas.comingSoon || []).map((mod, idx) => (
                  <div key={idx} className="grid md:grid-cols-[1fr_2fr_auto] gap-3 items-start border-t border-sa-border pt-3">
                    <Field label="Título">
                      <input
                        className={inputClass}
                        value={mod.title}
                        onChange={(e) => {
                          const comingSoon = [...(saas.comingSoon || [])];
                          comingSoon[idx] = { ...mod, title: e.target.value };
                          setSaas({ ...saas, comingSoon });
                        }}
                      />
                    </Field>
                    <Field label="Descripción">
                      <textarea
                        className={cn(inputClass, 'min-h-[60px]')}
                        value={mod.description}
                        onChange={(e) => {
                          const comingSoon = [...(saas.comingSoon || [])];
                          comingSoon[idx] = { ...mod, description: e.target.value };
                          setSaas({ ...saas, comingSoon });
                        }}
                      />
                    </Field>
                    <button
                      type="button"
                      onClick={() => setSaas({ ...saas, comingSoon: (saas.comingSoon || []).filter((_, i) => i !== idx) })}
                      className="mt-6 p-2 text-sa-muted hover:text-red-400"
                      title="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="bg-sa-panel border border-sa-border rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-sa-text">Planes con precio (opcional)</h3>
                    <p className="text-xs text-sa-muted mt-0.5">
                      Si está vacío, la web no muestra precios. Ahora mismo SoftArc cotiza sin planes fijos.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSaas({
                      ...saas,
                      plans: [...saas.plans, { name: '', target: '', monthlyPrice: 0, setupFee: '', features: [''], highlight: false }],
                    })}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-400 hover:text-blue-300"
                  >
                    <Plus className="h-3.5 w-3.5" /> Añadir plan
                  </button>
                </div>
                {saas.plans.length === 0 && (
                  <p className="text-xs text-sa-faint border border-dashed border-sa-border rounded-xl px-3 py-3">
                    Sin planes publicados (recomendado por ahora).
                  </p>
                )}
                {saas.plans.map((plan, idx) => (
                  <div key={idx} className="border border-sa-border rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-sa-muted">Plan {idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => setSaas({ ...saas, plans: saas.plans.filter((_, i) => i !== idx) })}
                        className="p-1 text-sa-muted hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="grid md:grid-cols-2 gap-3">
                      <Field label="Nombre">
                        <input
                          className={inputClass}
                          value={plan.name}
                          onChange={(e) => {
                            const plans = [...saas.plans];
                            plans[idx] = { ...plan, name: e.target.value };
                            setSaas({ ...saas, plans });
                          }}
                        />
                      </Field>
                      <Field label="Público objetivo">
                        <input
                          className={inputClass}
                          value={plan.target}
                          onChange={(e) => {
                            const plans = [...saas.plans];
                            plans[idx] = { ...plan, target: e.target.value };
                            setSaas({ ...saas, plans });
                          }}
                        />
                      </Field>
                      <Field label={`Precio mensual (${currency})`}>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          className={inputClass}
                          value={plan.monthlyPrice}
                          onChange={(e) => {
                            const plans = [...saas.plans];
                            plans[idx] = { ...plan, monthlyPrice: Number(e.target.value) || 0 };
                            setSaas({ ...saas, plans });
                          }}
                        />
                      </Field>
                      <Field label="Setup fee (texto)">
                        <input
                          className={inputClass}
                          value={plan.setupFee}
                          onChange={(e) => {
                            const plans = [...saas.plans];
                            plans[idx] = { ...plan, setupFee: e.target.value };
                            setSaas({ ...saas, plans });
                          }}
                          placeholder={`${currency} 250 (Pago único)`}
                        />
                      </Field>
                    </div>
                    <Field label="Features (uno por línea)">
                      <textarea
                        className={cn(inputClass, 'min-h-[100px]')}
                        value={plan.features.join('\n')}
                        onChange={(e) => {
                          const plans = [...saas.plans];
                          plans[idx] = { ...plan, features: e.target.value.split('\n') };
                          setSaas({ ...saas, plans });
                        }}
                      />
                    </Field>
                    <label className="inline-flex items-center gap-2 text-sm text-sa-text">
                      <input
                        type="checkbox"
                        checked={plan.highlight}
                        onChange={(e) => {
                          const plans = [...saas.plans];
                          plans[idx] = { ...plan, highlight: e.target.checked };
                          setSaas({ ...saas, plans });
                        }}
                        className="rounded border-sa-border"
                      />
                      Destacar como plan recomendado
                    </label>
                  </div>
                ))}
              </div>

              <div className="bg-sa-panel border border-sa-border rounded-2xl p-5 space-y-4">
                <h3 className="text-sm font-bold text-sa-text">CTA final</h3>
                <Field label="Título CTA">
                  <input className={inputClass} value={saas.ctaTitle} onChange={(e) => setSaas({ ...saas, ctaTitle: e.target.value })} />
                </Field>
                <Field label="Texto CTA">
                  <textarea className={cn(inputClass, 'min-h-[70px]')} value={saas.ctaText} onChange={(e) => setSaas({ ...saas, ctaText: e.target.value })} />
                </Field>
              </div>
            </div>
          )}

          {isStub && (
            <div className="bg-sa-panel border border-sa-border rounded-2xl p-5 space-y-4">
              <p className="text-sm text-sa-muted">
                Editor básico. La página pública completa de este servicio llegará próximamente; puedes dejar título y subtítulo listos.
              </p>
              <Field label="Título">
                <input className={inputClass} value={simple.title} onChange={(e) => setSimple({ ...simple, title: e.target.value })} />
              </Field>
              <Field label="Subtítulo">
                <textarea className={cn(inputClass, 'min-h-[80px]')} value={simple.subtitle} onChange={(e) => setSimple({ ...simple, subtitle: e.target.value })} />
              </Field>
            </div>
          )}
        </Can>
      )}
    </div>
  );
}
