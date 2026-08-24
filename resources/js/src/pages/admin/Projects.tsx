import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Project, Client } from '../../types';
import {
  Plus, FolderKanban, Calendar, DollarSign, MessageCircle, ExternalLink, MoreVertical,
  CheckCircle2, Github, Copy, Check, Monitor, Laptop, Database, HardDrive, Terminal, Search, BookText, Globe,
} from 'lucide-react';
import { useCompanySettings } from '../../hooks/useCompanySettings';
import { cn } from '../../lib/utils';
import { EmptyState } from '../../components/ui/EmptyState';
import { Can } from '../../components/Can';
import { apiGet, apiMutate } from '../../lib/api';
import { Field, FormModal, inputClass } from '../../components/ui/FormModal';
import { DetailModal, DetailGrid, DetailItem } from '../../components/ui/DetailModal';
import { HostingProcessNav } from '../../components/HostingProcessNav';
import { resolveCpanelUrl, resolveSiteUrl, resolveWebmailUrl } from '../../lib/hostingLinks';

const PROJECT_STATUSES = ['Planificación', 'En Desarrollo', 'Pruebas', 'Completado'] as const;

const PROJECT_NAME_SUGGESTIONS = [
  'Sistema web a medida',
  'Tienda / e-commerce',
  'Web corporativa / landing',
  'Blog / CMS',
  'Panel admin / backoffice',
  'App web + API',
  'Migración de sistema',
  'Mantenimiento / mejoras',
  'Integración (pagos / WhatsApp / APIs)',
];

const PROGRESS_PRESETS = [0, 25, 50, 75, 100] as const;

const AMOUNT_PRESETS = [500, 800, 1200, 1500, 2000, 2500, 3500, 5000] as const;

const SYNC_NOTE_PRESETS = [
  'Pendiente pull en laptop',
  'Pendiente push desde PC',
  'Branch main al día',
  'Trabajando en branch feature',
  'Conflictos resueltos',
  'Listo para desplegar',
];

const DB_NOTE_PRESETS = [
  'BD local OK · sin migraciones pendientes',
  'Migraciones pendientes en producción',
  'Exportar backup antes de tocar',
  'phpMyAdmin / cPanel revisado',
  'Esquema sincronizado local ↔ remoto',
];

const emptyProject = {
  clientId: '',
  name: '',
  progress: '0',
  status: 'Planificación',
  totalAmount: '',
  amountPaid: '0',
  dueDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
  repoUrl: '',
  localPathPc: '',
  localPathLaptop: '',
  lastSyncDevice: '',
  syncNote: '',
  dbNote: '',
  lastDbTouchAt: '',
  milestonesTotal: '4',
  milestonesDone: '0',
  domainId: '',
};

function slugifyPath(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40) || 'proyecto';
}

function addDaysIso(days: number): string {
  return new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
}

function Chip({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors',
        active
          ? 'bg-blue-600 text-white border-blue-600'
          : 'bg-sa-panel text-sa-muted border-sa-border hover:text-sa-text hover:border-blue-500/40',
      )}
    >
      {children}
    </button>
  );
}

type DomainOption = {
  id: string;
  domainName: string;
  clientId?: string;
  client?: string;
};

type ClientHostingDomain = {
  id: string;
  domainName: string;
  serverIp?: string;
  panelUrl?: string;
  webmailUrl?: string;
};

type ClientHosting = {
  domains: ClientHostingDomain[];
};

/** Normaliza URLs de repo (acepta github.com/... o org/proyecto). */
function normalizeRepoUrl(raw?: string | null): string {
  const value = (raw || '').trim();
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  if (/^(github\.com|gitlab\.com|bitbucket\.org)\//i.test(value)) return `https://${value}`;
  if (/^[\w.-]+\/[\w.-]+(\.git)?$/i.test(value)) return `https://github.com/${value.replace(/\.git$/i, '')}`;
  return value;
}

function isValidRepoUrl(raw?: string | null): boolean {
  const url = normalizeRepoUrl(raw);
  if (!url) return true;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function repoLabel(raw?: string | null): string {
  const url = normalizeRepoUrl(raw);
  if (!url) return '';
  try {
    const parsed = new URL(url);
    return `${parsed.hostname}${parsed.pathname}`.replace(/\/$/, '');
  } catch {
    return url;
  }
}

function gitCommands(repo?: string | null) {
  const url = normalizeRepoUrl(repo);
  if (!url) return [] as { label: string; cmd: string }[];
  return [
    { label: 'Clonar', cmd: `git clone ${url}` },
    { label: 'Bajar cambios', cmd: 'git pull' },
    { label: 'Ver estado', cmd: 'git status' },
    { label: 'Subir cambios', cmd: 'git add .\ngit commit -m "Describe el cambio"\ngit push' },
  ];
}

function CopyBtn({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  if (!text) return null;
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1400);
        } catch {
          // silencioso
        }
      }} title={label || 'Copiar'}
    >
      {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
      {copied ? 'Copiado' : (label || 'Copiar')}
    </button>
  );
}

export default function Projects() {
  const { settings } = useCompanySettings();
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [domains, setDomains] = useState<DomainOption[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(emptyProject);
  const [formError, setFormError] = useState('');
  const [detailProject, setDetailProject] = useState<Project | null>(null);
  const [hosting, setHosting] = useState<ClientHosting | null>(null);

  const loadData = () => {
    Promise.all([
      apiGet<Project[]>('/api/projects', { fresh: true }),
      apiGet<Client[]>('/api/clients'),
      apiGet<DomainOption[]>('/api/domains'),
    ])
      .then(([p, c, d]) => {
        setProjects(p);
        setClients(c);
        setDomains(d);
        if (!form.clientId && !editingId && c[0]) {
          setForm((f) => ({ ...f, clientId: c[0].id }));
        }
      })
      .catch(() => {
        setProjects([]);
        setClients([]);
        setDomains([]);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!detailProject?.clientId) {
      setHosting(null);
      return;
    }
    apiGet<ClientHosting>(`/api/clients/${detailProject.clientId}/hosting`, { fresh: true })
      .then(setHosting)
      .catch(() => setHosting({ domains: [] }));
  }, [detailProject?.id, detailProject?.clientId]);

  const openCreate = () => {
    setEditingId(null);
    setFormError('');
    setForm({ ...emptyProject, clientId: clients[0]?.id || '' });
    setModalOpen(true);
  };

  const openEdit = (project: Project) => {
    setEditingId(project.id);
    setFormError('');
    setForm({
      clientId: project.clientId,
      name: project.name,
      progress: String(project.progress ?? 0),
      status: project.status,
      totalAmount: String(project.totalAmount ?? 0),
      amountPaid: String(project.amountPaid ?? 0),
      dueDate: project.dueDate?.slice(0, 10) || emptyProject.dueDate,
      repoUrl: project.repoUrl || '',
      localPathPc: project.localPathPc || '',
      localPathLaptop: project.localPathLaptop || '',
      lastSyncDevice: project.lastSyncDevice || '',
      syncNote: project.syncNote || '',
      dbNote: project.dbNote || '',
      lastDbTouchAt: project.lastDbTouchAt?.slice(0, 10) || '',
      milestonesTotal: String(project.milestonesTotal ?? 0),
      milestonesDone: String(project.milestonesDone ?? 0),
      domainId: project.domainId || '',
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setFormError('');
    setForm({ ...emptyProject, clientId: clients[0]?.id || '' });
  };

  const buildPayload = () => {
    const repoUrl = normalizeRepoUrl(form.repoUrl);
    return {
      clientId: form.clientId,
      name: form.name,
      progress: Number(form.progress),
      status: form.status,
      totalAmount: Number(form.totalAmount || 0),
      amountPaid: Number(form.amountPaid || 0),
      dueDate: form.dueDate,
      repoUrl: repoUrl || null,
      localPathPc: form.localPathPc || null,
      localPathLaptop: form.localPathLaptop || null,
      lastSyncDevice: form.lastSyncDevice || null,
      syncNote: form.syncNote || null,
      dbNote: form.dbNote || null,
      lastDbTouchAt: form.lastDbTouchAt || null,
      milestonesTotal: Number(form.milestonesTotal || 0),
      milestonesDone: Number(form.milestonesDone || 0),
      domainId: form.domainId || null,
    };
  };

  const saveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setFormError('Indica el nombre del proyecto.');
      return;
    }
    const repoUrl = normalizeRepoUrl(form.repoUrl);
    if (!isValidRepoUrl(repoUrl)) {
      setFormError('La URL del repositorio no es válida. Ej: https://github.com/org/proyecto');
      return;
    }
    setFormError('');
    setSubmitting(true);
    try {
      const payload = buildPayload();
      if (editingId) {
        await apiMutate('put', `/api/projects/${editingId}`, payload);
      } else {
        await apiMutate('post', '/api/projects', payload);
      }
      closeModal();
      loadData();
    } finally {
      setSubmitting(false);
    }
  };

  const markSync = async (project: Project, device: 'PC' | 'Laptop') => {
    const updated = await apiMutate<Project>('put', `/api/projects/${project.id}`, {
      lastSyncDevice: device,
      lastSyncAt: new Date().toISOString(),
    });
    setProjects((prev) => prev.map((p) => (p.id === project.id ? { ...p, ...updated } : p)));
    setDetailProject((prev) => (prev?.id === project.id ? { ...prev, ...updated } : prev));
  };

  const deleteProject = async (project: Project) => {
    if (!window.confirm(`¿Eliminar el proyecto "${project.name}"?`)) return;
    await apiMutate('delete', `/api/projects/${project.id}`);
    loadData();
  };

  const getClient = (clientId: string) => clients.find((c) => c.id === clientId);

  const clientDomains = useMemo(
    () => domains.filter((d) => !form.clientId || d.clientId === form.clientId),
    [domains, form.clientId],
  );

  const filteredProjects = projects.filter((p) => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return true;
    const clientName = getClient(p.clientId)?.businessName || p.client?.businessName || '';
    return (
      p.name.toLowerCase().includes(q)
      || clientName.toLowerCase().includes(q)
      || (p.repoUrl || '').toLowerCase().includes(q)
      || (p.status || '').toLowerCase().includes(q)
      || (p.domainName || '').toLowerCase().includes(q)
    );
  });

  const getProjectDetails = (p: Project) => {
    const totalAmount = p.totalAmount ?? 0;
    const amountPaid = p.amountPaid ?? 0;
    const remainingAmount = p.remainingAmount ?? Math.max(0, totalAmount - amountPaid);
    const totalMilestones = p.milestonesTotal ?? 0;
    const completedMilestones = p.milestonesDone ?? 0;
    const dueDate = p.dueDate ? new Date(p.dueDate) : new Date();

    return { totalAmount, amountPaid, remainingAmount, totalMilestones, completedMilestones, dueDate };
  };

  const activeProjects = projects.filter((p) => p.status !== 'Completado');

  const deliveriesThisMonth = activeProjects.filter((p) => {
    const details = getProjectDetails(p);
    const today = new Date();
    return details.dueDate.getMonth() === today.getMonth() && details.dueDate.getFullYear() === today.getFullYear();
  }).length;

  const totalToCollect = activeProjects.reduce((sum, p) => sum + getProjectDetails(p).remainingAmount, 0);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-PE', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-extrabold text-sa-text tracking-tight">Proyectos</h1>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-sa-faint" />
            <input
              type="text"
              placeholder="Buscar proyecto, cliente, repo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2.5 bg-sa-input border border-sa-border rounded-xl text-sa-text text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder-sa-faint"
            />
          </div>
          <Can ability="projects.manage">
            <button type="button" onClick={openCreate} className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/20"><Plus className="h-4 w-4 mr-2" />
              Nuevo Proyecto
            </button>
          </Can>
        </div>
      </div>

      <HostingProcessNav current="projects" />

      <FormModal open={modalOpen} title={editingId ? 'Editar Proyecto' : 'Nuevo Proyecto'} onClose={closeModal} onSubmit={saveProject} submitting={submitting} submitLabel={editingId ? 'Guardar cambios' : 'Crear Proyecto'} wide>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Cliente">
            <select
              required
              className={inputClass}
              value={form.clientId}
              onChange={(e) => setForm({ ...form, clientId: e.target.value, domainId: '' })}
            >
              <option value="">Seleccionar...</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.businessName}</option>)}
            </select>
          </Field>

          <Field label="Nombre del proyecto" hint="Elige un tipo o escribe el tuyo.">
            <select
              className={inputClass}
              value={PROJECT_NAME_SUGGESTIONS.includes(form.name) ? form.name : '__custom__'}
              onChange={(e) => {
                const v = e.target.value;
                if (v === '__custom__') {
                  setForm({ ...form, name: form.name && !PROJECT_NAME_SUGGESTIONS.includes(form.name) ? form.name : '' });
                  return;
                }
                setForm({ ...form, name: v });
              }}
            >
              <option value="__custom__">+ Otro nombre (escribir)…</option>
              {PROJECT_NAME_SUGGESTIONS.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </Field>

          {!PROJECT_NAME_SUGGESTIONS.includes(form.name) && (
            <div className="sm:col-span-2">
              <Field label="Escribe el nombre">
                <input
                  required
                  className={inputClass}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ej: Sistema de reservas — Cliente X"
                />
              </Field>
            </div>
          )}

          <Field label="Dominio (opcional)" hint="Solo dominios del cliente seleccionado.">
            <select
              className={inputClass}
              value={form.domainId}
              onChange={(e) => setForm({ ...form, domainId: e.target.value })}
              disabled={!form.clientId}
            >
              <option value="">Sin dominio vinculado</option>
              {clientDomains.map((d) => (
                <option key={d.id} value={d.id}>{d.domainName}</option>
              ))}
            </select>
          </Field>

          <Field label="Estado">
            <select className={inputClass} value={form.status} onChange={(e) => {
              const status = e.target.value;
              const next = { ...form, status };
              if (status === 'Completado') {
                next.progress = '100';
                const total = Number(form.milestonesTotal || 0);
                if (total > 0) next.milestonesDone = String(total);
              } else if (status === 'Planificación' && form.progress === '100') {
                next.progress = '10';
              } else if (status === 'En Desarrollo' && ['0', '100'].includes(form.progress)) {
                next.progress = '40';
              } else if (status === 'Pruebas' && form.progress !== '100') {
                next.progress = '85';
              }
              setForm(next);
            }}>
              {PROJECT_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </Field>

          <Field label="Avance (%)">
            <div className="space-y-2">
              <div className="flex flex-wrap gap-1.5">
                {PROGRESS_PRESETS.map((p) => (
                  <Chip
                    key={p}
                    active={form.progress === String(p)}
                    onClick={() => {
                      const next = { ...form, progress: String(p) };
                      if (p === 0) next.status = 'Planificación';
                      else if (p === 100) next.status = 'Completado';
                      else if (p >= 75) next.status = 'Pruebas';
                      else next.status = 'En Desarrollo';
                      setForm(next);
                    }}
                  >
                    {p}%
                  </Chip>
                ))}
              </div>
              <input
                type="number"
                min="0"
                max="100"
                className={inputClass}
                value={form.progress}
                onChange={(e) => setForm({ ...form, progress: e.target.value })}
              />
            </div>
          </Field>

          <Field label={`Monto total (${settings.currencySymbol})`}>
            <div className="space-y-2">
              <div className="flex flex-wrap gap-1.5">
                {AMOUNT_PRESETS.map((a) => (
                  <Chip
                    key={a}
                    active={form.totalAmount === String(a)}
                    onClick={() => setForm({ ...form, totalAmount: String(a) })}
                  >
                    {settings.currencySymbol} {a}
                  </Chip>
                ))}
              </div>
              <input
                type="number"
                min="0"
                step="0.01"
                className={inputClass}
                value={form.totalAmount}
                onChange={(e) => setForm({ ...form, totalAmount: e.target.value })}
                placeholder="0.00"
              />
            </div>
          </Field>

          <Field label={`Pagado (${settings.currencySymbol})`}>
            <div className="space-y-2">
              <div className="flex flex-wrap gap-1.5">
                {[0, 50, 100].map((pct) => {
                  const total = Number(form.totalAmount || 0);
                  const paid = total > 0 ? String(Math.round((total * pct) / 100)) : String(pct === 0 ? 0 : '');
                  return (
                    <Chip
                      key={pct}
                      active={total > 0 && form.amountPaid === paid}
                      onClick={() => {
                        if (total <= 0 && pct > 0) return;
                        setForm({ ...form, amountPaid: pct === 0 ? '0' : paid });
                      }}
                    >
                      {pct}% adelanto
                    </Chip>
                  );
                })}
              </div>
              <input
                type="number"
                min="0"
                step="0.01"
                className={inputClass}
                value={form.amountPaid}
                onChange={(e) => setForm({ ...form, amountPaid: e.target.value })}
              />
            </div>
          </Field>

          <Field label="Fecha entrega">
            <div className="space-y-2">
              <div className="flex flex-wrap gap-1.5">
                {[15, 30, 45, 60, 90].map((d) => {
                  const iso = addDaysIso(d);
                  return (
                    <Chip key={d} active={form.dueDate === iso} onClick={() => setForm({ ...form, dueDate: iso })}>
                      +{d} días
                    </Chip>
                  );
                })}
              </div>
              <input type="date" className={inputClass} value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
            </div>
          </Field>

          <Field label="Hitos">
            <div className="grid grid-cols-2 gap-2">
              <select
                className={inputClass}
                value={form.milestonesTotal}
                onChange={(e) => {
                  const total = e.target.value;
                  const done = Math.min(Number(form.milestonesDone || 0), Number(total || 0));
                  setForm({ ...form, milestonesTotal: total, milestonesDone: String(done) });
                }}
              >
                {[3, 4, 5, 6, 8].map((n) => (
                  <option key={n} value={n}>{n} hitos totales</option>
                ))}
              </select>
              <select
                className={inputClass}
                value={form.milestonesDone}
                onChange={(e) => setForm({ ...form, milestonesDone: e.target.value })}
              >
                {Array.from({ length: Number(form.milestonesTotal || 0) + 1 }, (_, i) => (
                  <option key={i} value={i}>{i} completados</option>
                ))}
              </select>
            </div>
          </Field>
        </div>

        <Field
          label="Repositorio GitHub (opcional)"
          hint="Pega la URL del repo. También acepta org/proyecto. Los tokens van en la bóveda, no aquí."
        >
          <div className="flex gap-2">
            <input
              className={cn(inputClass, 'flex-1', formError && 'border-red-500/50 focus:ring-red-500')}
              value={form.repoUrl}
              placeholder="https://github.com/org/proyecto"
              onChange={(e) => {
                setFormError('');
                setForm({ ...form, repoUrl: e.target.value });
              }}
              onBlur={() => setForm((f) => ({ ...f, repoUrl: normalizeRepoUrl(f.repoUrl) }))}
            />
            {normalizeRepoUrl(form.repoUrl) && isValidRepoUrl(form.repoUrl) && (
              <a
                href={normalizeRepoUrl(form.repoUrl)}
                target="_blank"
                rel="noopener noreferrer"
                title="Abrir repositorio"
                className="inline-flex items-center gap-1.5 px-3 rounded-xl border border-sa-border text-sa-muted hover:text-sa-text text-xs font-semibold"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Abrir
              </a>
            )}
          </div>
          {formError && <p className="text-[11px] text-red-400 mt-1">{formError}</p>}
        </Field>

        <div className="border-t border-sa-border pt-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-bold text-sa-muted uppercase tracking-wider">Mesa de trabajo (Cursor · GitHub · XAMPP)</p>
            <button
              type="button"
              className="text-[11px] font-semibold text-blue-700 dark:text-blue-400 hover:underline"
              onClick={() => {
                const client = clients.find((c) => c.id === form.clientId);
                const base = slugifyPath(form.name || client?.businessName || 'proyecto');
                setForm({
                  ...form,
                  localPathPc: form.localPathPc || `C:\\xampp\\htdocs\\${base}`,
                  localPathLaptop: form.localPathLaptop || `D:\\dev\\${base}`,
                });
              }}
            >
              Sugerir rutas locales
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Ruta en PC" hint="Ej: C:\\xampp\\htdocs\\cliente">
              <input className={inputClass} value={form.localPathPc} onChange={(e) => setForm({ ...form, localPathPc: e.target.value })} placeholder="C:\xampp\htdocs\proyecto" />
            </Field>
            <Field label="Ruta en Laptop" hint="Ej: D:\\dev\\cliente">
              <input className={inputClass} value={form.localPathLaptop} onChange={(e) => setForm({ ...form, localPathLaptop: e.target.value })} placeholder="D:\dev\proyecto" />
            </Field>
            <Field label="Último sync desde">
              <select className={inputClass} value={form.lastSyncDevice} onChange={(e) => setForm({ ...form, lastSyncDevice: e.target.value })}>
                <option value="">Sin registrar</option>
                <option value="PC">PC</option>
                <option value="Laptop">Laptop</option>
                <option value="Otro">Otro</option>
              </select>
            </Field>
            <Field label="Último toque a BD" hint="Cuando exportaste/importaste esquema">
              <div className="space-y-2">
                <div className="flex flex-wrap gap-1.5">
                  <Chip active={form.lastDbTouchAt === addDaysIso(0)} onClick={() => setForm({ ...form, lastDbTouchAt: addDaysIso(0) })}>
                    Hoy
                  </Chip>
                  <Chip onClick={() => setForm({ ...form, lastDbTouchAt: '' })}>
                    Limpiar
                  </Chip>
                </div>
                <input type="date" className={inputClass} value={form.lastDbTouchAt} onChange={(e) => setForm({ ...form, lastDbTouchAt: e.target.value })} />
              </div>
            </Field>
          </div>

          <Field label="Nota de sync" hint="Elige una frase o escribe la tuya.">
            <select
              className={inputClass}
              value={SYNC_NOTE_PRESETS.includes(form.syncNote) ? form.syncNote : (form.syncNote ? '__custom__' : '')}
              onChange={(e) => {
                const v = e.target.value;
                if (v === '__custom__') {
                  setForm({ ...form, syncNote: form.syncNote && !SYNC_NOTE_PRESETS.includes(form.syncNote) ? form.syncNote : '' });
                  return;
                }
                setForm({ ...form, syncNote: v });
              }}
            >
              <option value="">Sin nota</option>
              <option value="__custom__">+ Otra nota…</option>
              {SYNC_NOTE_PRESETS.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </Field>
          {form.syncNote !== '' && !SYNC_NOTE_PRESETS.includes(form.syncNote) && (
            <Field label="Escribe la nota de sync">
              <input className={inputClass} value={form.syncNote} onChange={(e) => setForm({ ...form, syncNote: e.target.value })} placeholder="Pendiente pull en laptop" />
            </Field>
          )}

          <Field label="Nota de BD / cPanel" hint="Elige una frase o escribe la tuya.">
            <select
              className={inputClass}
              value={DB_NOTE_PRESETS.includes(form.dbNote) ? form.dbNote : (form.dbNote ? '__custom__' : '')}
              onChange={(e) => {
                const v = e.target.value;
                if (v === '__custom__') {
                  setForm({ ...form, dbNote: form.dbNote && !DB_NOTE_PRESETS.includes(form.dbNote) ? form.dbNote : '' });
                  return;
                }
                setForm({ ...form, dbNote: v });
              }}
            >
              <option value="">Sin nota</option>
              <option value="__custom__">+ Otra nota…</option>
              {DB_NOTE_PRESETS.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </Field>
          {form.dbNote !== '' && !DB_NOTE_PRESETS.includes(form.dbNote) && (
            <Field label="Escribe la nota de BD">
              <textarea
                className={cn(inputClass, 'min-h-[72px] resize-y')}
                value={form.dbNote}
                onChange={(e) => setForm({ ...form, dbNote: e.target.value })}
                placeholder="BD: cliente_app · migraciones pendientes: users.phone"
              />
            </Field>
          )}
        </div>
      </FormModal>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-sa-panel border border-sa-border rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
            <FolderKanban className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-sa-faint uppercase tracking-wider mb-1">Proyectos Activos</p>
            <h3 className="text-2xl font-extrabold text-sa-text">{activeProjects.length}</h3>
          </div>
        </div>
        <div className="bg-sa-panel border border-sa-border rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
            <Calendar className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-sa-faint uppercase tracking-wider mb-1">Próximas Entregas</p>
            <h3 className="text-2xl font-extrabold text-sa-text">{deliveriesThisMonth} <span className="text-sm font-medium text-sa-faint normal-case">este mes</span></h3>
          </div>
        </div>
        <div className="bg-sa-panel border border-sa-border rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-sa-faint uppercase tracking-wider mb-1">Por Cobrar en Hitos</p>
            <h3 className="text-2xl font-extrabold text-sa-text">{settings.currencySymbol} {totalToCollect.toLocaleString()}</h3>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {projects.length > 0 ? (
          filteredProjects.length === 0 ? (
            <div className="bg-sa-panel border border-sa-border rounded-2xl p-10 text-center text-sm text-sa-faint">
              No hay proyectos con esa búsqueda.
            </div>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-6">
            {filteredProjects.map((p) => {
              const client = getClient(p.clientId);
              const details = getProjectDetails(p);
              const repo = normalizeRepoUrl(p.repoUrl);
              const isCompleted = p.status === 'Completado';
              const badgeColor =
                p.status === 'Planificación' ? 'bg-sa-border text-sa-muted border-sa-border-strong' :
                p.status === 'En Desarrollo' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                p.status === 'Pruebas' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';

              return (
                <div
                  key={p.id}
                  onClick={() => setDetailProject(p)}
                  className="bg-sa-panel rounded-2xl border border-sa-border p-5 flex flex-col group hover:border-blue-500/30 transition-all relative overflow-hidden cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="min-w-0">
                      <h4 className="font-bold text-sa-text text-base leading-tight mb-1">{p.name}</h4>
                      <p className="text-xs text-sa-muted">Cliente: <span className="font-semibold text-sa-text">{client?.businessName || 'Desconocido'}</span></p>
                      {p.domainName && (
                        <p className="text-[11px] text-sa-faint mt-1 flex items-center gap-1">
                          <Globe className="h-3 w-3" /> {p.domainName}
                        </p>
                      )}
                    </div>
                    <span className={cn('text-[10px] px-2.5 py-1 font-bold border rounded-md whitespace-nowrap ml-2', badgeColor)}>
                      {p.status}
                    </span>
                  </div>

                  <div className="mb-5">
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-[10px] font-bold text-sa-faint uppercase tracking-wider">Avance del Proyecto</span>
                      <span className="text-xs font-bold text-sa-text">{p.progress}%</span>
                    </div>
                    <div className="w-full bg-sa-border rounded-full h-1.5 overflow-hidden">
                      <div className={cn('h-1.5 rounded-full transition-all', isCompleted ? 'bg-emerald-500' : 'bg-blue-500')} style={{ width: `${p.progress}%` }} />
                    </div>
                  </div>

                  <div className="bg-sa-canvas rounded-xl p-3 border border-sa-border mb-4">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[11px] text-sa-faint">Monto Total</span>
                      <span className="text-sm font-bold text-sa-text">{settings.currencySymbol} {details.totalAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] text-sa-faint">Adelanto / Hitos</span>
                      <span className="text-[11px] font-semibold text-emerald-400">
                        {isCompleted ? 'Pagado al 100%' : `Recibido: ${settings.currencySymbol} ${details.amountPaid.toLocaleString()}`}
                      </span>
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col justify-end space-y-3 mb-4">
                    <div className="flex items-center gap-1.5 text-xs text-sa-muted">
                      <CheckCircle2 className={cn('h-4 w-4', details.completedMilestones === details.totalMilestones ? 'text-emerald-500' : 'text-blue-500')} />
                      <span className="font-medium">{details.completedMilestones} de {details.totalMilestones} hitos entregados</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-sa-muted pt-3 border-t border-sa-border">
                      <Calendar className="h-4 w-4 text-sa-faint" />
                      <span>{isCompleted ? 'Entregado:' : 'Entrega:'} <span className="font-bold text-sa-text">{formatDate(details.dueDate)}</span></span>
                    </div>
                    {p.lastSyncDevice && (
                      <p className="text-[11px] text-sa-faint">
                        Sync: <span className="text-sa-muted font-semibold">{p.lastSyncDevice}</span>
                        {p.lastSyncAtHuman ? ` · ${p.lastSyncAtHuman}` : ''}
                      </p>
                    )}
                    {repo ? (
                      <a
                        href={repo}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-2 text-[11px] text-sa-muted hover:text-sa-text truncate"
                        title={repo}
                      >
                        <Github className="h-3.5 w-3.5 shrink-0 text-sa-faint" />
                        <span className="truncate">{repoLabel(repo)}</span>
                      </a>
                    ) : (
                      <p className="text-[11px] text-[#475569]">Sin repositorio vinculado</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-sa-border mt-auto" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      {client?.phone && (
                        <a
                          href={`https://wa.me/${client.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola ${client.contactName}, te escribimos sobre el proyecto "${p.name}".`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-8 h-8 rounded-lg bg-[#25D366]/10 text-[#25D366] flex items-center justify-center hover:bg-[#25D366]/20 border border-[#25D366]/20"
                          title="WhatsApp"
                        >
                          <MessageCircle className="h-4 w-4" />
                        </a>
                      )}
                      {repo ? (
                        <a
                          href={repo}
                          target="_blank"
                          rel="noopener noreferrer"title="Abrir GitHub"
                        >
                          <Github className="h-4 w-4" />
                        </a>
                      ) : (
                        <span className="w-8 h-8 rounded-lg bg-sa-canvas text-[#334155] flex items-center justify-center border border-sa-border" title="Sin repositorio">
                          <Github className="h-4 w-4" />
                        </span>
                      )}
                    </div>

                    <Can ability="projects.manage">
                      <div className="relative group/menu">
                        <button type="button" >
                          Opciones <MoreVertical className="h-3 w-3" />
                        </button>
                        <div className="absolute right-0 bottom-full mb-1 w-36 bg-sa-border border border-sa-border-strong rounded-lg shadow-xl opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-20">
                          <div className="py-1">
                            <button type="button" onClick={() => openEdit(p)} className="w-full text-left px-4 py-2 text-xs text-sa-muted hover:text-sa-text hover:bg-sa-border-strong transition-colors">Editar Proyecto</button>
                            <button type="button" onClick={() => openEdit(p)} className="w-full text-left px-4 py-2 text-xs text-sa-muted hover:text-sa-text hover:bg-sa-border-strong transition-colors">Actualizar Avance</button>
                            <button type="button" onClick={() => deleteProject(p)} className="w-full text-left px-4 py-2 text-xs text-red-400 hover:bg-sa-border-strong transition-colors">Eliminar</button>
                          </div>
                        </div>
                      </div>
                    </Can>
                  </div>
                </div>
              );
            })}
          </div>
          )
        ) : (
          <div className="h-full flex items-center justify-center pt-10">
            <EmptyState
              icon={FolderKanban}
              title="No hay proyectos registrados"
              description="Registra tu primer proyecto para hacer seguimiento de avance, cobros y repositorio."
              action={
                <Can ability="projects.manage">
                  <button type="button" onClick={openCreate} className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/20"><Plus className="h-4 w-4 mr-2" />
                    Crear Primer Proyecto
                  </button>
                </Can>
              }
            />
          </div>
        )}
      </div>

      <DetailModal
        open={!!detailProject}
        title={detailProject?.name || 'Proyecto'}
        subtitle={detailProject ? (getClient(detailProject.clientId)?.businessName || undefined) : undefined}
        onClose={() => setDetailProject(null)}
        wide
        footer={detailProject && (
          <>
            <Link
              to="/admin/wiki"
              className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-sa-border text-sa-text border border-sa-border-strong hover:bg-sa-border-strong transition-colors"
              onClick={() => setDetailProject(null)}
            >
              <BookText className="h-3.5 w-3.5" />
              Guía deploy / pasos de trabajo
            </Link>
            {normalizeRepoUrl(detailProject.repoUrl) && (
              <a
                href={normalizeRepoUrl(detailProject.repoUrl)}
                target="_blank"
                rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-sa-border text-sa-text border border-sa-border-strong hover:bg-sa-border-strong transition-colors">
                <Github className="h-3.5 w-3.5" />
                Abrir GitHub
              </a>
            )}
            <Can ability="projects.manage">
              <button
                type="button"
                onClick={() => { const proj = detailProject; setDetailProject(null); openEdit(proj); }} className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors">
                Editar
              </button>
            </Can>
            <button type="button" onClick={() => setDetailProject(null)} className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-semibold text-sa-muted hover:text-sa-text hover:bg-sa-border/60 transition-colors">Cerrar</button>
          </>
        )}
      >
        {detailProject && (() => {
          const d = getProjectDetails(detailProject);
          const client = getClient(detailProject.clientId);
          const repo = normalizeRepoUrl(detailProject.repoUrl);
          const cmds = gitCommands(repo);
          const domain = hosting?.domains?.[0];
          const site = domain ? resolveSiteUrl(domain.domainName) : '';
          const cpanel = domain ? resolveCpanelUrl({ panelUrl: domain.panelUrl, domainName: domain.domainName, ip: domain.serverIp }) : '';
          const webmail = domain ? resolveWebmailUrl({ webmailUrl: domain.webmailUrl, panelUrl: domain.panelUrl, domainName: domain.domainName, ip: domain.serverIp }) : '';

          return (
            <div className="space-y-5">
              <DetailGrid>
                <DetailItem label="Nombre" value={detailProject.name} />
                <DetailItem label="Cliente" value={client?.businessName} />
                <DetailItem label="Estado" value={detailProject.status} />
                <DetailItem label="Avance" value={`${detailProject.progress}%`} />
                <DetailItem label="Dominio" value={detailProject.domainName || 'Sin dominio vinculado'} />
                <DetailItem label="Monto total" value={`${settings.currencySymbol} ${d.totalAmount.toLocaleString()}`} />
                <DetailItem label="Pagado" value={`${settings.currencySymbol} ${d.amountPaid.toLocaleString()}`} />
                <DetailItem label="Pendiente" value={`${settings.currencySymbol} ${d.remainingAmount.toLocaleString()}`} />
                <DetailItem label="Fecha entrega" value={formatDate(d.dueDate)} />
                <DetailItem label="Hitos" value={`${d.completedMilestones} de ${d.totalMilestones}`} />
                <DetailItem
                  label="Repositorio"
                  value={repo ? repoLabel(repo) : 'Sin repositorio vinculado'}
                  mono={!!repo}
                  full
                />
              </DetailGrid>

              <div className="border-t border-sa-border pt-4 space-y-3">
                <div className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-blue-400" />
                  <h4 className="text-sm font-bold text-sa-text">Mesa de trabajo</h4>
                </div>
                <p className="text-[11px] text-sa-faint">
                  Cursor → GitHub (PC ↔ laptop) → XAMPP local → FileZilla / cPanel al hosting.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="rounded-xl border border-sa-border bg-sa-canvas/60 p-3">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-sa-faint flex items-center gap-1">
                        <Monitor className="h-3 w-3" /> Ruta PC
                      </p>
                      <CopyBtn text={detailProject.localPathPc || ''} />
                    </div>
                    <p className="text-[12px] font-mono text-sa-text break-all">{detailProject.localPathPc || '—'}</p>
                  </div>
                  <div className="rounded-xl border border-sa-border bg-sa-canvas/60 p-3">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-sa-faint flex items-center gap-1">
                        <Laptop className="h-3 w-3" /> Ruta Laptop
                      </p>
                      <CopyBtn text={detailProject.localPathLaptop || ''} />
                    </div>
                    <p className="text-[12px] font-mono text-sa-text break-all">{detailProject.localPathLaptop || '—'}</p>
                  </div>
                </div>

                <div className="rounded-xl border border-sa-border bg-sa-canvas/60 p-3 space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-sa-faint">
                    Último sync: {detailProject.lastSyncDevice || 'Sin registrar'}
                    {detailProject.lastSyncAtHuman ? ` · ${detailProject.lastSyncAtHuman}` : ''}
                  </p>
                  {detailProject.syncNote && <p className="text-[12px] text-sa-muted">{detailProject.syncNote}</p>}
                  <Can ability="projects.manage">
                    <div className="flex flex-wrap gap-1.5">
                      <button type="button" onClick={() => void markSync(detailProject, 'PC')} className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-blue-500/15 text-blue-300 border border-blue-500/25 hover:bg-blue-500/25">
                        Marqué sync desde PC
                      </button>
                      <button type="button" onClick={() => void markSync(detailProject, 'Laptop')} className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-violet-500/15 text-violet-300 border border-violet-500/25 hover:bg-violet-500/25">
                        Marqué sync desde Laptop
                      </button>
                    </div>
                  </Can>
                </div>

                {cmds.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-sa-faint flex items-center gap-1">
                      <Terminal className="h-3.5 w-3.5" /> Comandos Git
                    </p>
                    {cmds.map((c) => (
                      <div key={c.label} className="flex items-start justify-between gap-2 rounded-lg border border-sa-border bg-sa-canvas/40 px-2.5 py-1.5">
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold text-sa-faint uppercase">{c.label}</p>
                          <pre className="text-[11px] font-mono text-sa-text whitespace-pre-wrap break-all mt-0.5">{c.cmd}</pre>
                        </div>
                        <CopyBtn text={c.cmd} />
                      </div>
                    ))}
                  </div>
                )}

                <div className="rounded-xl border border-sa-border bg-sa-canvas/60 p-3 space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-sa-faint flex items-center gap-1">
                    <Database className="h-3.5 w-3.5" /> Base de datos
                  </p>
                  <p className="text-[12px] text-sa-muted">
                    Último toque: {detailProject.lastDbTouchAt || 'Sin registrar'}
                  </p>
                  <p className="text-[12px] text-sa-text whitespace-pre-wrap">{detailProject.dbNote || 'Sin notas de BD.'}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="rounded-xl border border-sa-border bg-sa-canvas/40 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-sa-faint mb-2">Al cambiar de máquina</p>
                    <ul className="text-[11px] text-sa-muted space-y-1 list-disc pl-4">
                      <li>En la máquina actual: commit + push</li>
                      <li>En la otra: git pull antes de abrir Cursor</li>
                      <li>Marca sync arriba (PC o Laptop)</li>
                    </ul>
                  </div>
                  <div className="rounded-xl border border-sa-border bg-sa-canvas/40 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-sa-faint mb-2">Antes de subir a hosting</p>
                    <ul className="text-[11px] text-sa-muted space-y-1 list-disc pl-4">
                      <li>Push a GitHub primero</li>
                      <li>FileZilla: no subir .env ni node_modules</li>
                      <li>Si cambió BD: export local → import cPanel</li>
                      <li>npm run build si cambió el front</li>
                    </ul>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {site && (
                    <a href={site} target="_blank" rel="noopener noreferrer"  className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 hover:bg-emerald-500/25 transition-colors">
                      Sitio
                    </a>
                  )}
                  {cpanel && (
                    <a href={cpanel} target="_blank" rel="noopener noreferrer" className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-orange-500/15 text-orange-300 border border-orange-500/25">
                      cPanel
                    </a>
                  )}
                  {webmail && (
                    <a href={webmail} target="_blank" rel="noopener noreferrer" className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-sky-500/15 text-sky-300 border border-sky-500/25">
                      Webmail
                    </a>
                  )}
                  <Link
                    to="/admin/clients"
                    className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/25"
                    onClick={() => setDetailProject(null)}
                  >
                    Cliente / FileZilla
                  </Link>
                </div>
              </div>
            </div>
          );
        })()}
      </DetailModal>
    </div>
  );
}
