import React, { useEffect, useMemo, useState } from 'react';
import {
  Plus, Search, Users as UsersIcon, LayoutGrid, List, MessageCircle, Target, Calendar,
  Pencil, Trash2, Mail, Trophy, XCircle, Phone, Building2,
} from 'lucide-react';
import { Lead, LeadStatus } from '../../types';
import { cn } from '../../lib/utils';
import { EmptyState } from '../../components/ui/EmptyState';
import { Can } from '../../components/Can';
import { useAuth } from '../../context/AuthContext';
import { apiGet, apiMutate, getCached } from '../../lib/api';
import { Field, FormModal, inputClass } from '../../components/ui/FormModal';
import { DetailModal, DetailGrid, DetailItem } from '../../components/ui/DetailModal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';

const PIPELINE_STATUSES: LeadStatus[] = [
  'Nuevo Prospecto',
  'Contactado',
  'Demostración Agendada',
  'Propuesta Enviada',
  'Cliente Ganado',
  'Cliente Perdido',
];

const SERVICE_PRESETS = [
  'SaaS E-commerce',
  'SaaS Facturación',
  'Desarrollo a medida',
  'Sitio web / Landing',
  'Hosting / Dominio',
  'Mantenimiento / Soporte',
  'Integración / API',
  'Consultoría',
];

const STATUS_META: Record<LeadStatus, { bar: string; chip: string; soft: string }> = {
  'Nuevo Prospecto': {
    bar: 'bg-sky-500',
    chip: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
    soft: 'border-sky-500/40 bg-sky-500/5',
  },
  Contactado: {
    bar: 'bg-amber-500',
    chip: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    soft: 'border-amber-500/40 bg-amber-500/5',
  },
  'Demostración Agendada': {
    bar: 'bg-violet-500',
    chip: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
    soft: 'border-violet-500/40 bg-violet-500/5',
  },
  'Propuesta Enviada': {
    bar: 'bg-indigo-500',
    chip: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
    soft: 'border-indigo-500/40 bg-indigo-500/5',
  },
  'Cliente Ganado': {
    bar: 'bg-emerald-500',
    chip: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    soft: 'border-emerald-500/40 bg-emerald-500/5',
  },
  'Cliente Perdido': {
    bar: 'bg-rose-500',
    chip: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    soft: 'border-rose-500/40 bg-rose-500/5',
  },
};

type FilterTab = 'Todos' | 'Activos' | 'Ganados' | 'Perdidos';

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
  const [leads, setLeads] = useState<Lead[]>(() => getCached<Lead[]>('/api/leads') ?? []);
  const [catalogProducts, setCatalogProducts] = useState<{ id: string; name: string }[]>(
    () => getCached<{ id: string; name: string }[]>('/api/catalog') ?? [],
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTab, setFilterTab] = useState<FilterTab>('Todos');
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<LeadStatus | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [detailLead, setDetailLead] = useState<Lead | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Lead | null>(null);

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

  const updateLeadStatus = async (id: string, newStatus: LeadStatus) => {
    const previous = leads;
    setLeads((curr) => curr.map((l) => (l.id === id ? { ...l, status: newStatus } : l)));
    if (detailLead?.id === id) setDetailLead((prev) => (prev ? { ...prev, status: newStatus } : prev));
    try {
      await apiMutate('put', `/api/leads/${id}`, { status: newStatus });
    } catch {
      setLeads(previous);
    }
  };

  const filteredLeads = leads.filter((l) => {
    const q = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !q ||
      l.contactName.toLowerCase().includes(q) ||
      l.companyName.toLowerCase().includes(q) ||
      (l.email || '').toLowerCase().includes(q) ||
      (l.phone || '').includes(q) ||
      (l.serviceOfInterest || '').toLowerCase().includes(q);

    if (!matchesSearch) return false;
    if (filterTab === 'Activos') return l.status !== 'Cliente Ganado' && l.status !== 'Cliente Perdido';
    if (filterTab === 'Ganados') return l.status === 'Cliente Ganado';
    if (filterTab === 'Perdidos') return l.status === 'Cliente Perdido';
    return true;
  });

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
            <h1 className="text-2xl md:text-3xl font-extrabold text-sa-text tracking-tight">CRM & Prospectos</h1>
            <p className="text-sm text-sa-faint mt-1">Pipeline comercial: registra, mueve y da seguimiento a cada lead.</p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex items-center bg-sa-panel border border-sa-border rounded-lg p-1 self-start">
              <button
                type="button"
                onClick={() => setViewMode('kanban')}
                className={cn('flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors', viewMode === 'kanban' ? 'bg-sa-border text-sa-text' : 'text-sa-faint hover:text-sa-text')}
                title="Vista kanban"
              >
                <LayoutGrid className="h-4 w-4" />
                Tablero
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={cn('flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors', viewMode === 'table' ? 'bg-sa-border text-sa-text' : 'text-sa-faint hover:text-sa-text')}
                title="Vista tabla"
              >
                <List className="h-4 w-4" />
                Lista
              </button>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-sa-faint" />
              <input
                type="text"
                placeholder="Buscar empresa, contacto, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-3 py-2.5 bg-sa-input border border-sa-border rounded-xl text-sa-text text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder-sa-faint"/>
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

        <div className="flex flex-wrap gap-2">
          {(['Todos', 'Activos', 'Ganados', 'Perdidos'] as FilterTab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilterTab(tab)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors',
                filterTab === tab
                  ? 'bg-blue-600/15 text-blue-300 border-blue-500/40'
                  : 'bg-sa-panel text-sa-faint border-sa-border hover:text-sa-text hover:border-sa-border-strong',
              )}
            >
              {tab}
              <span className="ml-1.5 text-[10px] opacity-70">{tabCounts[tab]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Leads activos', value: metrics.active, icon: Target, tone: 'text-sky-400 bg-sky-500/10 border-sky-500/20' },
          { label: 'Demos agendadas', value: metrics.demos, icon: Calendar, tone: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
          { label: 'Propuestas', value: metrics.proposals, icon: UsersIcon, tone: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
          { label: 'Ganados', value: metrics.won, icon: Trophy, tone: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
        ].map((m) => (
          <div key={m.label} className="bg-sa-panel border border-sa-border rounded-2xl p-4 flex items-center gap-3">
            <div className={cn('w-10 h-10 rounded-xl border flex items-center justify-center shrink-0', m.tone)}>
              <m.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-sa-faint uppercase tracking-wider">{m.label}</p>
              <h3 className="text-xl font-extrabold text-sa-text">{m.value}</h3>
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
                    <span >{columnLeads.length}</span>
                  </div>

                  <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar min-h-[150px]">
                    {columnLeads.length === 0 && (
                      <p className="text-[11px] text-[#475569] text-center py-6 border border-dashed border-sa-border rounded-xl">
                        {can('crm.manage') ? 'Suelta aquí un prospecto' : 'Sin prospectos'}
                      </p>
                    )}
                    {columnLeads.map((lead) => (
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
                            <h4 className="font-bold text-sa-text text-sm line-clamp-1">{lead.companyName}</h4>
                            <Can ability="crm.manage">
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button type="button" onClick={(e) => { e.stopPropagation(); openEdit(lead); }} title="Editar">
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                                <button type="button" onClick={(e) => { e.stopPropagation(); setConfirmDelete(lead); }} className="p-1 rounded text-sa-muted hover:text-red-400 hover:bg-sa-border" title="Eliminar">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </Can>
                          </div>
                          <p className="text-[11px] text-sa-muted mb-3">{lead.contactName}</p>
                          <div className="mb-3">
                            <span className="inline-block px-2 py-1 bg-sa-border text-sa-muted text-[10px] font-semibold rounded-md border border-sa-border-strong">
                              {lead.serviceOfInterest || 'Sin servicio'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between pt-3 border-t border-sa-border gap-2">
                            <p className="text-[10px] text-sa-faint line-clamp-1">{lead.notes || 'Sin notas'}</p>
                            <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
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
                                  className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center hover:bg-blue-500/20 border border-blue-500/20"
                                  title="Email"
                                >
                                  <Mail className="h-3.5 w-3.5" />
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-sa-panel border border-sa-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-sm min-w-[780px]">
              <thead className="bg-sa-canvas text-[11px] uppercase tracking-wider text-sa-faint border-b border-sa-border">
                <tr>
                  <th className="px-4 py-3 font-bold">Empresa</th>
                  <th className="px-4 py-3 font-bold">Contacto</th>
                  <th className="px-4 py-3 font-bold">Servicio</th>
                  <th className="px-4 py-3 font-bold">Etapa</th>
                  <th className="px-4 py-3 font-bold">Alta</th>
                  <th className="px-4 py-3 font-bold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    onClick={() => setDetailLead(lead)}
                    className="border-b border-sa-border/80 hover:bg-sa-border/30 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-3.5 w-3.5 text-sa-faint shrink-0" />
                        <span className="font-semibold text-sa-text">{lead.companyName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div >{lead.contactName}</div>
                      <div className="text-[11px] text-sa-faint flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                        {lead.phone && (
                          <span className="inline-flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {lead.phone}
                          </span>
                        )}
                        {lead.email && (
                          <span className="inline-flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {lead.email}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sa-muted">{lead.serviceOfInterest || '—'}</td>
                    <td className="px-4 py-3">
                      {can('crm.manage') ? (
                        <select
                          value={lead.status}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => updateLeadStatus(lead.id, e.target.value as LeadStatus)}
                          className="bg-sa-canvas border border-sa-border-strong rounded-lg text-[11px] font-semibold text-sa-text px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 max-w-[180px]"
                        >
                          {PIPELINE_STATUSES.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      ) : (
                        <span className={cn('inline-flex px-2 py-1 rounded-md text-[10px] font-bold border', STATUS_META[lead.status].chip)}>
                          {lead.status}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sa-faint text-xs whitespace-nowrap">{formatDate(lead.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        {lead.phone && (
                          <a href={`https://wa.me/${digitsOnly(lead.phone)}`} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-lg text-[#25D366] hover:bg-[#25D366]/10 flex items-center justify-center" title="WhatsApp">
                            <MessageCircle className="h-4 w-4" />
                          </a>
                        )}
                        <Can ability="crm.manage">
                          <button type="button" onClick={() => openEdit(lead)} title="Editar" className="p-2 rounded-lg text-sa-faint hover:text-sa-text hover:bg-sa-border/60 transition-colors">
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button type="button" onClick={() => setConfirmDelete(lead)} className="w-8 h-8 rounded-lg text-sa-muted hover:text-red-400 hover:bg-sa-border flex items-center justify-center" title="Eliminar">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </Can>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <DetailModal
        open={!!detailLead}
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
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-500/15 text-blue-300 border border-blue-500/30 hover:bg-blue-500/25"
              >
                Email
              </a>
            )}
            <Can ability="crm.manage">
              <button
                type="button"
                onClick={() => { const l = detailLead; setDetailLead(null); openEdit(l); }} className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors">
                Editar
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(detailLead)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-red-300 hover:bg-red-500/10"
              >
                Eliminar
              </button>
            </Can>
            <button type="button" onClick={() => setDetailLead(null)} className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-semibold text-sa-muted hover:text-sa-text hover:bg-sa-border/60 transition-colors">Cerrar</button>
          </>
        )}
      >
        {detailLead && (
          <div className="space-y-5">
            <DetailGrid>
              <DetailItem label="Empresa" value={detailLead.companyName} />
              <DetailItem label="Contacto" value={detailLead.contactName} />
              <DetailItem label="Teléfono" value={detailLead.phone || '—'} />
              <DetailItem label="Email" value={detailLead.email || '—'} />
              <DetailItem label="Servicio de interés" value={detailLead.serviceOfInterest || '—'} />
              <DetailItem label="Registrado" value={formatDate(detailLead.createdAt)} />
              <DetailItem label="Notas" value={detailLead.notes || '—'} full />
            </DetailGrid>

            <div>
              <p className="text-[11px] font-bold text-sa-faint uppercase tracking-wider mb-2">Etapa</p>
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
            </div>
          </div>
        )}
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
