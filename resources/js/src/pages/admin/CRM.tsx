import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus, Search, Users as UsersIcon, LayoutGrid, List, MessageCircle, Target, Calendar,
  Pencil, Trash2, Mail, Trophy, XCircle, Phone, UserPlus,
} from 'lucide-react';
import { Lead, LeadStatus } from '../../types';
import { DEFAULT_CONTACT_FORM } from '../../lib/contactFormDefaults';
import { cn } from '../../lib/utils';
import { EmptyState } from '../../components/ui/EmptyState';
import { Can } from '../../components/Can';
import { useAuth } from '../../context/AuthContext';
import { apiGet, apiMutate, getCached } from '../../lib/api';
import { Field, FormModal, inputClass } from '../../components/ui/FormModal';
import { DetailModal, DetailItem } from '../../components/ui/DetailModal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useToast } from '../../components/ui/Toast';

const PIPELINE_STATUSES: LeadStatus[] = [
  'Nuevo Prospecto',
  'Contactado',
  'Demostración Agendada',
  'Propuesta Enviada',
  'Cliente Ganado',
  'Cliente Perdido',
];

const SERVICE_PRESETS = [
  ...DEFAULT_CONTACT_FORM.serviceOptions.map((o) => o.value),
  'Mantenimiento / Soporte',
  'Integración / API',
  'Consultoría',
];

const STATUS_META: Record<LeadStatus, { bar: string; chip: string; soft: string }> = {
  'Nuevo Prospecto': {
    bar: 'bg-sky-500',
    chip: 'bg-sky-500/15 text-sky-800 dark:text-sky-300 border-sky-500/30',
    soft: 'border-sky-500/40 bg-sky-500/5',
  },
  Contactado: {
    bar: 'bg-amber-500',
    chip: 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30',
    soft: 'border-amber-500/40 bg-amber-500/5',
  },
  'Demostración Agendada': {
    bar: 'bg-violet-500',
    chip: 'bg-violet-500/15 text-violet-800 dark:text-violet-300 border-violet-500/30',
    soft: 'border-violet-500/40 bg-violet-500/5',
  },
  'Propuesta Enviada': {
    bar: 'bg-indigo-500',
    chip: 'bg-indigo-500/15 text-indigo-800 dark:text-indigo-300 border-indigo-500/30',
    soft: 'border-indigo-500/40 bg-indigo-500/5',
  },
  'Cliente Ganado': {
    bar: 'bg-emerald-500',
    chip: 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30',
    soft: 'border-emerald-500/40 bg-emerald-500/5',
  },
  'Cliente Perdido': {
    bar: 'bg-rose-500',
    chip: 'bg-rose-500/15 text-rose-800 dark:text-rose-300 border-rose-500/30',
    soft: 'border-rose-500/40 bg-rose-500/5',
  },
};

type FilterTab = 'Todos' | 'Activos' | 'Ganados' | 'Perdidos';
type LeadSort = 'recientes' | 'antiguos' | 'empresa' | 'estado';

function leadSortTime(lead: Lead): number {
  const t = lead.createdAt ? new Date(lead.createdAt).getTime() : 0;
  return Number.isNaN(t) ? 0 : t;
}

function notesPreview(notes?: string): string {
  const raw = (notes || '').trim();
  if (!raw) return '';
  const first = raw.split(/\n+/).map((l) => l.trim()).find(Boolean) || '';
  return first.length > 72 ? `${first.slice(0, 72)}…` : first;
}

const CORE_LEAD_META_IDS = new Set(['contactName', 'companyName', 'phone', 'email', 'notes']);

function leadMetaEntries(lead: Lead): { id: string; label: string; value: string }[] {
  const meta = lead.meta || {};
  const ordered = [...DEFAULT_CONTACT_FORM.fields]
    .filter((f) => !CORE_LEAD_META_IDS.has(f.id))
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  const rows: { id: string; label: string; value: string }[] = [];
  const seen = new Set<string>();

  for (const field of ordered) {
    const value = String(meta[field.id] ?? '').trim();
    if (!value) continue;
    rows.push({ id: field.id, label: field.label, value });
    seen.add(field.id);
  }

  for (const [id, raw] of Object.entries(meta)) {
    if (seen.has(id) || CORE_LEAD_META_IDS.has(id)) continue;
    const value = String(raw ?? '').trim();
    if (!value) continue;
    rows.push({ id, label: id, value });
  }

  return rows;
}

/** Notas libres: meta.notes o texto de notes que no sea el dump del formulario. */
function leadFreeNotes(lead: Lead): string {
  const fromMeta = String(lead.meta?.notes ?? '').trim();
  if (fromMeta) return fromMeta;
  const notes = (lead.notes || '').trim();
  if (!notes) return '';
  // Si notes es el dump "Label: valor" (formateado al enviar), no lo repetimos aquí.
  if (lead.meta && Object.keys(lead.meta).length > 0) {
    const lines = notes.split('\n').map((l) => l.trim()).filter(Boolean);
    const looksLikeDump = lines.length > 0 && lines.every((l) => /^[^:]+:\s+.+/.test(l));
    if (looksLikeDump) return '';
  }
  return notes;
}

type LeadFormState = {
  contactName: string;
  companyName: string;
  phone: string;
  email: string;
  serviceOfInterest: string;
  status: LeadStatus;
  notes: string;
};

const emptyLeadForm: LeadFormState = {
  contactName: '',
  companyName: '',
  phone: '',
  email: '',
  serviceOfInterest: '',
  status: 'Nuevo Prospecto',
  notes: '',
};

function digitsOnly(value?: string | null) {
  return (value || '').replace(/\D/g, '');
}

function formatDate(value?: string) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
}

function LeadFormModal({
  open,
  lead,
  serviceOptions,
  onClose,
  onSaved,
}: {
  open: boolean;
  lead: Lead | null;
  serviceOptions: string[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<LeadFormState>(emptyLeadForm);
  const [customService, setCustomService] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (lead) {
      const service = lead.serviceOfInterest || '';
      const isKnown = !service || serviceOptions.some((s) => s.toLowerCase() === service.toLowerCase());
      setForm({
        contactName: lead.contactName,
        companyName: lead.companyName,
        phone: lead.phone || '',
        email: lead.email || '',
        serviceOfInterest: service,
        status: lead.status,
        notes: lead.notes || '',
      });
      setCustomService(!!service && !isKnown);
    } else {
      setForm(emptyLeadForm);
      setCustomService(false);
    }
    setSubmitting(false);
    // Inicializar solo al abrir / cambiar lead (no al llegar el catálogo).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, lead]);

  if (!open) return null;

  const saveLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        contactName: form.contactName.trim(),
        companyName: form.companyName.trim(),
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        serviceOfInterest: form.serviceOfInterest.trim() || null,
        status: form.status,
        notes: form.notes.trim() || null,
      };
      if (lead) {
        await apiMutate('put', `/api/leads/${lead.id}`, payload);
      } else {
        await apiMutate('post', '/api/leads', payload);
      }
      onSaved();
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const chipClass = (active: boolean) =>
    cn(
      'px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-colors',
      active
        ? 'bg-blue-600/20 text-blue-300 border-blue-500/40'
        : 'bg-sa-canvas text-sa-faint border-sa-border-strong hover:text-sa-text hover:border-sa-muted',
    );

  return (
    <FormModal
      open
      wide
      title={lead ? 'Editar Prospecto' : 'Registrar Prospecto'}
      description={lead ? 'Actualiza datos y etapa del pipeline.' : 'Completa contacto, servicio de interés y etapa inicial.'}
      onClose={onClose}
      onSubmit={saveLead}
      submitting={submitting}
      submitLabel={lead ? 'Guardar cambios' : 'Crear Prospecto'}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Empresa / Razón social">
          <input
            required
            className={inputClass}
            placeholder="Ej. Comercial Andina SAC"
            value={form.companyName}
            onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))}
          />
        </Field>
        <Field label="Nombre de contacto">
          <input
            required
            className={inputClass}
            placeholder="Ej. María López"
            value={form.contactName}
            onChange={(e) => setForm((f) => ({ ...f, contactName: e.target.value }))}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Teléfono / WhatsApp" hint="Incluye código de país si es posible (ej. 51999...)">
          <input
            className={inputClass}
            placeholder="51999888777"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          />
        </Field>
        <Field label="Email">
          <input
            type="email"
            className={inputClass}
            placeholder="contacto@empresa.com"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />
        </Field>
      </div>

      <Field label="Servicio de interés">
        <div className="flex flex-wrap gap-2 mb-2">
          {serviceOptions.map((service) => {
            const active = !customService && form.serviceOfInterest === service;
            return (
              <button
                key={service}
                type="button"
                onClick={() => {
                  setCustomService(false);
                  setForm((f) => ({ ...f, serviceOfInterest: service }));
                }}
                className={chipClass(active)}
              >
                {service}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => {
              setCustomService(true);
              setForm((f) => (customService ? f : { ...f, serviceOfInterest: '' }));
            }}
            className={chipClass(customService)}
          >
            Otro...
          </button>
        </div>
        {customService ? (
          <input
            className={inputClass}
            placeholder="Describe el servicio o necesidad"
            value={form.serviceOfInterest}
            onChange={(e) => setForm((f) => ({ ...f, serviceOfInterest: e.target.value }))}
          />
        ) : (
          <p className="text-[11px] text-sa-faint">
            {form.serviceOfInterest ? `Seleccionado: ${form.serviceOfInterest}` : 'Elige un chip o pulsa “Otro...”'}
          </p>
        )}
      </Field>

      <Field label="Etapa del pipeline">
        <div className="flex flex-wrap gap-2">
          {PIPELINE_STATUSES.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setForm((f) => ({ ...f, status }))}
              className={cn(
                'px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-colors',
                form.status === status
                  ? STATUS_META[status].chip
                  : 'bg-sa-canvas text-sa-faint border-sa-border-strong hover:text-sa-text hover:border-sa-muted',
              )}
            >
              {status}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Notas / próximo paso">
        <textarea
          className={inputClass}
          rows={3}
          placeholder="Ej. Pidió demo la próxima semana. Enviar propuesta de hosting."
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
        />
      </Field>
    </FormModal>
  );
}

export default function CRM() {
  const { can } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>(() => getCached<Lead[]>('/api/leads') ?? []);
  const [catalogProducts, setCatalogProducts] = useState<{ id: string; name: string }[]>(
    () => getCached<{ id: string; name: string }[]>('/api/catalog') ?? [],
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTab, setFilterTab] = useState<FilterTab>('Todos');
  const [leadSort, setLeadSort] = useState<LeadSort>('recientes');
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('table');
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<LeadStatus | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [detailLead, setDetailLead] = useState<Lead | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Lead | null>(null);
  const [converting, setConverting] = useState(false);

  const loadLeads = () => {
    apiGet<Lead[]>('/api/leads')
      .then(setLeads)
      .catch(() => setLeads([]));
  };

  useEffect(() => {
    loadLeads();
    apiGet<{ id: string; name: string }[]>('/api/catalog')
      .then((items) => setCatalogProducts(items.map((p) => ({ id: p.id, name: p.name }))))
      .catch(() => setCatalogProducts([]));
  }, []);

  const serviceOptions = useMemo(
    () =>
      [...SERVICE_PRESETS, ...catalogProducts.map((p) => p.name)].filter(
        (v, i, arr) => arr.findIndex((x) => x.toLowerCase() === v.toLowerCase()) === i,
      ),
    [catalogProducts],
  );

  const openCreate = () => {
    setEditingLead(null);
    setFormOpen(true);
  };

  const openEdit = (lead: Lead) => {
    setEditingLead(lead);
    setFormOpen(true);
  };

  const closeModal = () => {
    setFormOpen(false);
    setEditingLead(null);
  };

  const deleteLead = async () => {
    if (!confirmDelete) return;
    await apiMutate('delete', `/api/leads/${confirmDelete.id}`);
    if (detailLead?.id === confirmDelete.id) setDetailLead(null);
    setConfirmDelete(null);
    loadLeads();
  };

  const applyLeadUpdate = (updated: Lead) => {
    setLeads((curr) => curr.map((l) => (l.id === updated.id ? { ...l, ...updated } : l)));
    if (detailLead?.id === updated.id) setDetailLead((prev) => (prev ? { ...prev, ...updated } : prev));
  };

  const convertLead = async (lead: Lead) => {
    if (lead.convertedClientId) {
      navigate(`/admin/clients`);
      return;
    }
    setConverting(true);
    try {
      const res = await apiMutate<{
        lead?: Lead;
        client?: { id: string; businessName?: string };
        clientId?: string;
      }>('post', `/api/leads/${lead.id}/convert`);
      const clientId = res.clientId || res.client?.id || res.lead?.convertedClientId;
      if (res.lead) applyLeadUpdate(res.lead);
      else if (clientId) applyLeadUpdate({ ...lead, status: 'Cliente Ganado', convertedClientId: clientId });
      loadLeads();
      toast('success', 'Cliente creado', `${lead.companyName} ya está en tu cartera.`);
      const goHosting = window.confirm(
        'Cliente listo. ¿Abrir el asistente de alta de hosting?\n\nAceptar = Hosting · Cancelar = ver clientes',
      );
      if (goHosting && clientId) {
        navigate(`/admin/infra/hosting-wizard?clientId=${encodeURIComponent(clientId)}`);
      } else {
        navigate('/admin/clients');
      }
    } catch {
      toast('error', 'No se pudo convertir', 'Revisa el lead e inténtalo de nuevo.');
    } finally {
      setConverting(false);
    }
  };

  const updateLeadStatus = async (id: string, newStatus: LeadStatus) => {
    const previous = leads;
    const current = leads.find((l) => l.id === id);
    setLeads((curr) => curr.map((l) => (l.id === id ? { ...l, status: newStatus } : l)));
    if (detailLead?.id === id) setDetailLead((prev) => (prev ? { ...prev, status: newStatus } : prev));
    try {
      const updated = await apiMutate<Lead>('put', `/api/leads/${id}`, { status: newStatus });
      const merged: Lead = {
        ...(current || { id } as Lead),
        ...updated,
        status: updated?.status || newStatus,
      };
      applyLeadUpdate(merged);
      if (newStatus === 'Cliente Ganado') {
        if (merged.convertedClientId) {
          loadLeads();
          toast('success', 'Cliente listo', 'El prospecto ya tiene cliente vinculado.');
        } else if (current) {
          await convertLead({ ...merged, status: 'Cliente Ganado' });
        }
      }
    } catch {
      setLeads(previous);
    }
  };

  const filteredLeads = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    let rows = leads.filter((l) => {
      const matchesSearch =
        !q ||
        l.contactName.toLowerCase().includes(q) ||
        l.companyName.toLowerCase().includes(q) ||
        (l.email || '').toLowerCase().includes(q) ||
        (l.phone || '').includes(q) ||
        (l.serviceOfInterest || '').toLowerCase().includes(q) ||
        (l.notes || '').toLowerCase().includes(q);

      if (!matchesSearch) return false;
      if (filterTab === 'Activos') return l.status !== 'Cliente Ganado' && l.status !== 'Cliente Perdido';
      if (filterTab === 'Ganados') return l.status === 'Cliente Ganado';
      if (filterTab === 'Perdidos') return l.status === 'Cliente Perdido';
      return true;
    });

    const byText = (a: string, b: string) => a.localeCompare(b, 'es', { sensitivity: 'base' });
    rows = [...rows].sort((a, b) => {
      switch (leadSort) {
        case 'antiguos':
          return leadSortTime(a) - leadSortTime(b);
        case 'empresa':
          return byText(a.companyName || '', b.companyName || '') || leadSortTime(b) - leadSortTime(a);
        case 'estado': {
          const ai = PIPELINE_STATUSES.indexOf(a.status);
          const bi = PIPELINE_STATUSES.indexOf(b.status);
          return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi) || leadSortTime(b) - leadSortTime(a);
        }
        case 'recientes':
        default:
          return leadSortTime(b) - leadSortTime(a);
      }
    });
    return rows;
  }, [leads, searchTerm, filterTab, leadSort]);

  const metrics = {
    active: leads.filter((l) => l.status !== 'Cliente Ganado' && l.status !== 'Cliente Perdido').length,
    demos: leads.filter((l) => l.status === 'Demostración Agendada').length,
    proposals: leads.filter((l) => l.status === 'Propuesta Enviada').length,
    won: leads.filter((l) => l.status === 'Cliente Ganado').length,
  };

  const tabCounts: Record<FilterTab, number> = {
    Todos: leads.length,
    Activos: metrics.active,
    Ganados: metrics.won,
    Perdidos: leads.filter((l) => l.status === 'Cliente Perdido').length,
  };

  const kanbanColumns = filterTab === 'Ganados'
    ? (['Cliente Ganado'] as LeadStatus[])
    : filterTab === 'Perdidos'
      ? (['Cliente Perdido'] as LeadStatus[])
      : filterTab === 'Activos'
        ? PIPELINE_STATUSES.filter((s) => s !== 'Cliente Ganado' && s !== 'Cliente Perdido')
        : PIPELINE_STATUSES;

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedLeadId(id);
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedLeadId(null);
    setDropTarget(null);
  };

  const handleDrop = (e: React.DragEvent, status: LeadStatus) => {
    e.preventDefault();
    const id = draggedLeadId || e.dataTransfer.getData('text/plain');
    setDropTarget(null);
    setDraggedLeadId(null);
    if (id) updateLeadStatus(id, status);
  };

  return (
    <div className="space-y-6">
      <LeadFormModal
        open={formOpen}
        lead={editingLead}
        serviceOptions={serviceOptions}
        onClose={closeModal}
        onSaved={loadLeads}
      />

      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-sa-text tracking-tight">Prospectos</h1>
            <p className="text-sm text-sa-faint mt-1">
              CRM: leads de la web o los que cargas a mano. Al llegar uno nuevo: campanita del admin + email a Ventas / usuarios con permiso CRM.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex items-center bg-sa-panel border border-sa-border rounded-xl p-1 self-start">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors',
                  viewMode === 'table' ? 'bg-blue-600 text-white' : 'text-sa-muted hover:text-sa-text',
                )}
                title="Vista lista"
              >
                <List className="h-4 w-4" />
                Lista
              </button>
              <button
                type="button"
                onClick={() => setViewMode('kanban')}
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors',
                  viewMode === 'kanban' ? 'bg-blue-600 text-white' : 'text-sa-muted hover:text-sa-text',
                )}
                title="Vista kanban"
              >
                <LayoutGrid className="h-4 w-4" />
                Tablero
              </button>
            </div>
            <select
              className="px-3 py-2.5 bg-sa-input border border-sa-border rounded-xl text-sa-text text-sm font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={leadSort}
              onChange={(e) => setLeadSort(e.target.value as LeadSort)}
              title="Ordenar"
            >
              <option value="recientes">Más recientes</option>
              <option value="antiguos">Más antiguos</option>
              <option value="empresa">Empresa A–Z</option>
              <option value="estado">Por etapa</option>
            </select>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-sa-faint" />
              <input
                type="text"
                placeholder="Buscar empresa, contacto, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 bg-sa-input border border-sa-border rounded-xl text-sa-text text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder-sa-faint"
              />
            </div>
            <Can ability="crm.manage">
              <button
                type="button"
                onClick={openCreate}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/20"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Prospecto
              </button>
            </Can>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            {(['Todos', 'Activos', 'Ganados', 'Perdidos'] as FilterTab[]).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setFilterTab(tab)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors',
                  filterTab === tab
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-sa-panel text-sa-muted border-sa-border hover:text-sa-text hover:border-sa-border-strong',
                )}
              >
                {tab}
                <span className="ml-1.5 text-[10px] opacity-80">{tabCounts[tab]}</span>
              </button>
            ))}
          </div>
          <p className="text-xs text-sa-muted">
            Mostrando <strong className="text-sa-text">{filteredLeads.length}</strong> de {leads.length}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Leads activos', value: metrics.active, icon: Target, tone: 'text-sky-700 dark:text-sky-400 bg-sky-500/10 border-sky-500/25' },
          { label: 'Demos agendadas', value: metrics.demos, icon: Calendar, tone: 'text-amber-700 dark:text-amber-400 bg-amber-500/10 border-amber-500/25' },
          { label: 'Propuestas', value: metrics.proposals, icon: UsersIcon, tone: 'text-indigo-700 dark:text-indigo-400 bg-indigo-500/10 border-indigo-500/25' },
          { label: 'Ganados', value: metrics.won, icon: Trophy, tone: 'text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/25' },
        ].map((m) => (
          <div key={m.label} className="bg-sa-panel border border-sa-border rounded-2xl p-4 flex items-center gap-3">
            <div className={cn('w-10 h-10 rounded-xl border flex items-center justify-center shrink-0', m.tone)}>
              <m.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-sa-faint uppercase tracking-wider">{m.label}</p>
              <h3 className="text-xl font-extrabold text-sa-text tabular-nums">{m.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {leads.length === 0 ? (
        <div className="flex items-center justify-center pt-10">
          <EmptyState
            icon={UsersIcon}
            title="No hay prospectos en tu pipeline"
            description="Registra el primer lead o espera a que lleguen desde el formulario de contacto."
            action={
              <Can ability="crm.manage">
                <button
                  type="button"
                  onClick={openCreate}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/20"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Crear primer prospecto
                </button>
              </Can>
            }
          />
        </div>
      ) : filteredLeads.length === 0 ? (
        <div className="bg-sa-panel border border-sa-border rounded-2xl p-10 text-center text-sm text-sa-faint">
          No hay prospectos con ese filtro o búsqueda.
        </div>
      ) : viewMode === 'kanban' ? (
        <div className="overflow-x-auto pb-4 custom-scrollbar">
          <div className="flex gap-4 min-w-max items-start">
            {kanbanColumns.map((status) => {
              const columnLeads = filteredLeads.filter((l) => l.status === status);
              const isDrop = dropTarget === status;
              return (
                <div
                  key={status}
                  className={cn(
                    'w-80 flex flex-col rounded-xl border max-h-full transition-colors',
                    isDrop ? STATUS_META[status].soft : 'bg-sa-canvas border-sa-border',
                  )}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDropTarget(status);
                  }}
                  onDragLeave={() => setDropTarget((curr) => (curr === status ? null : curr))}
                  onDrop={(e) => handleDrop(e, status)}
                >
                  <div className="p-4 flex items-center justify-between border-b border-sa-border sticky top-0 bg-inherit rounded-t-xl z-10">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={cn('w-2 h-2 rounded-full shrink-0', STATUS_META[status].bar)} />
                      <h3 className="text-[11px] font-bold text-sa-muted uppercase tracking-widest truncate">{status}</h3>
                    </div>
                    <span className="inline-flex min-w-[1.5rem] h-6 items-center justify-center rounded-md bg-sa-panel border border-sa-border text-[11px] font-bold text-sa-text">
                      {columnLeads.length}
                    </span>
                  </div>

                  <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar min-h-[150px]">
                    {columnLeads.length === 0 && (
                      <p className="text-[11px] text-sa-faint text-center py-6 border border-dashed border-sa-border rounded-xl">
                        {can('crm.manage') ? 'Suelta aquí un prospecto' : 'Sin prospectos'}
                      </p>
                    )}
                    {columnLeads.map((lead) => {
                      const preview = notesPreview(lead.notes);
                      return (
                      <div
                        key={lead.id}
                        draggable={can('crm.manage')}
                        onDragStart={(e) => handleDragStart(e, lead.id)}
                        onDragEnd={handleDragEnd}
                        onClick={() => setDetailLead(lead)}
                        className={cn(
                          'bg-sa-panel p-4 rounded-xl border border-sa-border shadow-sm hover:border-blue-500/40 transition-colors group relative cursor-pointer',
                          can('crm.manage') && 'cursor-grab active:cursor-grabbing',
                          draggedLeadId === lead.id && 'opacity-50',
                        )}
                      >
                        <div className={cn('absolute left-0 top-3 bottom-3 w-1 rounded-r', STATUS_META[status].bar)} />
                        <div className="pl-2">
                          <div className="flex justify-between items-start mb-1 gap-2">
                            <h4 className="font-bold text-sa-text text-sm line-clamp-2 leading-snug">{lead.companyName}</h4>
                            <Can ability="crm.manage">
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                <button type="button" onClick={(e) => { e.stopPropagation(); openEdit(lead); }} className="p-1 rounded-lg text-sa-muted hover:text-sa-text hover:bg-sa-border" title="Editar">
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                                <button type="button" onClick={(e) => { e.stopPropagation(); setConfirmDelete(lead); }} className="p-1 rounded-lg text-sa-muted hover:text-red-500 hover:bg-sa-border" title="Eliminar">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </Can>
                          </div>
                          <p className="text-[12px] text-sa-muted mb-2">{lead.contactName}</p>
                          <div className="mb-2 flex flex-wrap gap-1.5">
                            <span className="inline-block max-w-full px-2 py-1 bg-sa-canvas text-sa-muted text-[10px] font-semibold rounded-md border border-sa-border truncate" title={lead.serviceOfInterest || undefined}>
                              {lead.serviceOfInterest || 'Sin servicio'}
                            </span>
                            <span className="inline-block px-2 py-1 text-sa-faint text-[10px] font-medium rounded-md">
                              {formatDate(lead.createdAt)}
                            </span>
                          </div>
                          {preview && (
                            <p className="text-[11px] text-sa-faint mb-3 line-clamp-2 leading-relaxed">{preview}</p>
                          )}
                          <div className="flex items-center justify-end pt-3 border-t border-sa-border gap-1" onClick={(e) => e.stopPropagation()}>
                              {lead.phone && (
                                <a
                                  href={`https://wa.me/${digitsOnly(lead.phone)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="w-7 h-7 rounded-lg bg-[#25D366]/10 text-[#25D366] flex items-center justify-center hover:bg-[#25D366]/20 border border-[#25D366]/20"
                                  title="WhatsApp"
                                >
                                  <MessageCircle className="h-3.5 w-3.5" />
                                </a>
                              )}
                              {lead.email && (
                                <a
                                  href={`mailto:${lead.email}`}
                                  className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-700 dark:text-blue-400 flex items-center justify-center hover:bg-blue-500/20 border border-blue-500/20"
                                  title="Email"
                                >
                                  <Mail className="h-3.5 w-3.5" />
                                </a>
                              )}
                          </div>
                        </div>
                      </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-sa-panel border border-sa-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-sm min-w-[900px]">
              <thead className="bg-sa-border/40 text-[11px] uppercase tracking-wider text-sa-faint border-b border-sa-border">
                <tr>
                  <th className="px-4 py-3.5 font-bold">Empresa / contacto</th>
                  <th className="px-4 py-3.5 font-bold">Servicio</th>
                  <th className="px-4 py-3.5 font-bold">Etapa</th>
                  <th className="px-4 py-3.5 font-bold">Resumen</th>
                  <th className="px-4 py-3.5 font-bold">Alta</th>
                  <th className="px-4 py-3.5 font-bold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sa-border">
                {filteredLeads.map((lead) => {
                  const preview = notesPreview(lead.notes);
                  return (
                  <tr
                    key={lead.id}
                    onClick={() => setDetailLead(lead)}
                    className="hover:bg-sa-border/40 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-sa-text">{lead.companyName}</div>
                      <div className="text-[12px] text-sa-muted mt-0.5">{lead.contactName}</div>
                      <div className="text-[11px] text-sa-faint flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                        {lead.phone && (
                          <span className="inline-flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {lead.phone}
                          </span>
                        )}
                        {lead.email && (
                          <span className="inline-flex items-center gap-1 truncate max-w-[180px]">
                            <Mail className="h-3 w-3" />
                            {lead.email}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex max-w-[200px] px-2 py-1 rounded-md text-[11px] font-semibold bg-sa-canvas border border-sa-border text-sa-muted truncate" title={lead.serviceOfInterest || undefined}>
                        {lead.serviceOfInterest || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      {can('crm.manage') ? (
                        <select
                          value={lead.status}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => updateLeadStatus(lead.id, e.target.value as LeadStatus)}
                          className="bg-sa-input border border-sa-border rounded-lg text-[11px] font-semibold text-sa-text px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 max-w-[180px]"
                        >
                          {PIPELINE_STATUSES.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      ) : (
                        <span className={cn('inline-flex px-2 py-1 rounded-md text-[10px] font-bold border', STATUS_META[lead.status]?.chip || '')}>
                          {lead.status}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-[12px] text-sa-faint max-w-[220px]">
                      <span className="line-clamp-2">{preview || '—'}</span>
                    </td>
                    <td className="px-4 py-3.5 text-sa-muted text-xs whitespace-nowrap">{formatDate(lead.createdAt)}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        {lead.phone && (
                          <a href={`https://wa.me/${digitsOnly(lead.phone)}`} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-lg text-[#25D366] hover:bg-[#25D366]/10 flex items-center justify-center border border-transparent hover:border-[#25D366]/20" title="WhatsApp">
                            <MessageCircle className="h-4 w-4" />
                          </a>
                        )}
                        <Can ability="crm.manage">
                          <button type="button" onClick={() => openEdit(lead)} title="Editar" className="w-8 h-8 rounded-lg text-sa-muted hover:text-sa-text hover:bg-sa-border/60 flex items-center justify-center transition-colors">
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button type="button" onClick={() => setConfirmDelete(lead)} className="w-8 h-8 rounded-lg text-sa-muted hover:text-red-500 hover:bg-sa-border flex items-center justify-center" title="Eliminar">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </Can>
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <DetailModal
        open={!!detailLead}
        wide
        title={detailLead?.companyName || 'Prospecto'}
        subtitle={detailLead?.contactName || undefined}
        onClose={() => setDetailLead(null)}
        footer={detailLead && (
          <>
            {detailLead.phone && (
              <a
                href={`https://wa.me/${digitsOnly(detailLead.phone)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#25D366]/15 text-[#25D366] border border-[#25D366]/30 hover:bg-[#25D366]/25"
              >
                WhatsApp
              </a>
            )}
            {detailLead.email && (
              <a
                href={`mailto:${detailLead.email}`}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30 hover:bg-blue-500/25"
              >
                Email
              </a>
            )}
            <Can ability="crm.manage">
              {detailLead.convertedClientId ? (
                <Link
                  to="/admin/clients"
                  className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 transition-colors"
                  onClick={() => setDetailLead(null)}
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  Abrir cliente
                </Link>
              ) : (
                <button
                  type="button"
                  disabled={converting}
                  onClick={() => void convertLead(detailLead)}
                  className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 disabled:opacity-60 transition-colors"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  {converting ? 'Creando…' : 'Crear / abrir cliente'}
                </button>
              )}
              <button
                type="button"
                onClick={() => { const l = detailLead; setDetailLead(null); openEdit(l); }}
                className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors"
              >
                Editar
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(detailLead)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-red-700 dark:text-red-300 hover:bg-red-500/10"
              >
                Eliminar
              </button>
            </Can>
            <button type="button" onClick={() => setDetailLead(null)} className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-semibold text-sa-muted hover:text-sa-text hover:bg-sa-border/60 transition-colors">Cerrar</button>
          </>
        )}
      >
        {detailLead && (() => {
          const metaRows = leadMetaEntries(detailLead);
          const freeNotes = leadFreeNotes(detailLead);
          return (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className={cn('inline-flex px-2.5 py-1 rounded-lg text-[11px] font-bold border', STATUS_META[detailLead.status]?.chip || '')}>
                  {detailLead.status}
                </span>
                <span className="text-[11px] text-sa-faint">Alta {formatDate(detailLead.createdAt)}</span>
              </div>

              <section className="rounded-xl border border-sa-border bg-sa-canvas/50 p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-sa-faint mb-3">Contacto</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <DetailItem label="Empresa" value={detailLead.companyName} />
                  <DetailItem label="Persona" value={detailLead.contactName} />
                  <DetailItem
                    label="Teléfono"
                    value={detailLead.phone ? (
                      <a href={`tel:${digitsOnly(detailLead.phone)}`} className="text-sa-text hover:text-blue-600 dark:hover:text-blue-400">
                        {detailLead.phone}
                      </a>
                    ) : '—'}
                  />
                  <DetailItem
                    label="Email"
                    value={detailLead.email ? (
                      <a href={`mailto:${detailLead.email}`} className="text-sa-text hover:text-blue-600 dark:hover:text-blue-400 break-all">
                        {detailLead.email}
                      </a>
                    ) : '—'}
                  />
                  <DetailItem
                    label="Servicio de interés"
                    value={detailLead.serviceOfInterest || '—'}
                    full
                  />
                </div>
              </section>

              {metaRows.length > 0 && (
                <section className="rounded-xl border border-sa-border bg-sa-canvas/50 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-sa-faint mb-3">
                    Respuestas del formulario
                  </p>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                    {metaRows.map((row) => (
                      <div
                        key={row.id}
                        className={cn(
                          'min-w-0',
                          row.value.length > 80 || row.id === 'requirements' || row.id === 'message' ? 'sm:col-span-2' : '',
                        )}
                      >
                        <dt className="text-[10px] font-bold uppercase tracking-wider text-sa-faint mb-0.5">{row.label}</dt>
                        <dd className="text-[13px] text-sa-text whitespace-pre-wrap break-words leading-relaxed">{row.value}</dd>
                      </div>
                    ))}
                  </dl>
                </section>
              )}

              {freeNotes && (
                <section className="rounded-xl border border-sa-border bg-sa-canvas/50 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-sa-faint mb-2">Notas</p>
                  <p className="text-[13px] text-sa-text whitespace-pre-wrap break-words leading-relaxed">{freeNotes}</p>
                </section>
              )}

              {!metaRows.length && !freeNotes && detailLead.notes && (
                <section className="rounded-xl border border-sa-border bg-sa-canvas/50 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-sa-faint mb-2">Detalle</p>
                  <p className="text-[13px] text-sa-text whitespace-pre-wrap break-words leading-relaxed">{detailLead.notes}</p>
                </section>
              )}

              <section>
                <p className="text-[10px] font-bold uppercase tracking-wider text-sa-faint mb-2">Etapa del pipeline</p>
                {can('crm.manage') ? (
                  <div className="flex flex-wrap gap-2">
                    {PIPELINE_STATUSES.map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => updateLeadStatus(detailLead.id, status)}
                        className={cn(
                          'px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-colors',
                          detailLead.status === status
                            ? STATUS_META[status].chip
                            : 'bg-sa-canvas text-sa-faint border-sa-border-strong hover:text-sa-text hover:border-sa-muted',
                        )}
                      >
                        {status === 'Cliente Perdido' ? (
                          <span className="inline-flex items-center gap-1"><XCircle className="h-3 w-3" />{status}</span>
                        ) : status === 'Cliente Ganado' ? (
                          <span className="inline-flex items-center gap-1"><Trophy className="h-3 w-3" />{status}</span>
                        ) : (
                          status
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <span className={cn('inline-flex px-2.5 py-1 rounded-lg text-[11px] font-bold border', STATUS_META[detailLead.status].chip)}>
                    {detailLead.status}
                  </span>
                )}
              </section>
            </div>
          );
        })()}
      </DetailModal>

      <ConfirmDialog
        isOpen={!!confirmDelete}
        title="Eliminar prospecto"
        description={confirmDelete ? `¿Eliminar a “${confirmDelete.companyName}” del CRM? Esta acción no se puede deshacer.` : ''}
        confirmText="Eliminar"
        isDestructive
        onConfirm={deleteLead}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
