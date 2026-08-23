import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Project, Client } from '../../types';
import {
  Plus, FolderKanban, Calendar, DollarSign, MessageCircle, ExternalLink, MoreVertical,
  CheckCircle2, Github, Copy, Check, Monitor, Laptop, Database, HardDrive, Terminal,
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
    ])
      .then(([p, c]) => {
        setProjects(p);
        setClients(c);
        if (!form.clientId && !editingId && c[0]) {
          setForm((f) => ({ ...f, clientId: c[0].id }));
        }
      })
      .catch(() => {
        setProjects([]);
        setClients([]);
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
    };
  };

  const saveProject = async (e: React.FormEvent) => {
    e.preventDefault();
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
        <h1 className="text-2xl md:text-3xl font-extrabold text-sa-text tracking-tight">Proyectos a la Medida</h1>
        <Can ability="projects.manage">
          <button type="button" onClick={openCreate} className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/20"><Plus className="h-4 w-4 mr-2" />
            Nuevo Proyecto
          </button>
        </Can>
      </div>

      <HostingProcessNav current="projects" />

      <FormModal open={modalOpen} title={editingId ? 'Editar Proyecto' : 'Nuevo Proyecto'} onClose={closeModal} onSubmit={saveProject} submitting={submitting} submitLabel={editingId ? 'Guardar cambios' : 'Crear Proyecto'} wide>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Cliente">
            <select required className={inputClass} value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })}>
              <option value="">Seleccionar...</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.businessName}</option>)}
            </select>
          </Field>
          <Field label="Nombre del proyecto">
            <input required className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Estado">
            <select className={inputClass} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option>Planificación</option>
              <option>En Desarrollo</option>
              <option>Pruebas</option>
              <option>Completado</option>
            </select>
          </Field>
          <Field label="Avance (%)">
            <input type="number" min="0" max="100" className={inputClass} value={form.progress} onChange={(e) => setForm({ ...form, progress: e.target.value })} />
          </Field>
          <Field label={`Monto total (${settings.currencySymbol})`}>
            <input type="number" min="0" className={inputClass} value={form.totalAmount} onChange={(e) => setForm({ ...form, totalAmount: e.target.value })} />
          </Field>
          <Field label={`Pagado (${settings.currencySymbol})`}>
            <input type="number" min="0" className={inputClass} value={form.amountPaid} onChange={(e) => setForm({ ...form, amountPaid: e.target.value })} />
          </Field>
          <Field label="Fecha entrega">
            <input type="date" className={inputClass} value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
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
                rel="noopener noreferrer"title="Abrir repositorio"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Abrir
              </a>
            )}
          </div>
          {formError && <p className="text-[11px] text-red-400 mt-1">{formError}</p>}
        </Field>

        <div className="border-t border-sa-border pt-4 space-y-3">
          <p className="text-xs font-bold text-sa-muted uppercase tracking-wider">Mesa de trabajo (Cursor · GitHub · XAMPP)</p>
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
              <input type="date" className={inputClass} value={form.lastDbTouchAt} onChange={(e) => setForm({ ...form, lastDbTouchAt: e.target.value })} />
            </Field>
          </div>
          <Field label="Nota de sync" hint="Ej: falta pull en laptop · branch main">
            <input className={inputClass} value={form.syncNote} onChange={(e) => setForm({ ...form, syncNote: e.target.value })} placeholder="Pendiente pull en laptop" />
          </Field>
          <Field label="Nota de BD / cPanel" hint="Nombre BD, phpMyAdmin, migraciones pendientes…">
            <textarea className={cn(inputClass, 'min-h-[72px] resize-y')} value={form.dbNote} onChange={(e) => setForm({ ...form, dbNote: e.target.value })} placeholder="BD: cliente_app · migraciones pendientes: users.phone" />
          </Field>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-6">
            {projects.map((p) => {
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
