import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Plus, Search, LifeBuoy, Clock, CheckCircle, MoreVertical, MessageSquare, ExternalLink, AlertCircle, UserPlus, Hand } from 'lucide-react';
import { cn } from '../../lib/utils';
import { EmptyState } from '../../components/ui/EmptyState';
import { Can } from '../../components/Can';
import { apiGet, apiMutate } from '../../lib/api';
import { Field, FormModal, inputClass } from '../../components/ui/FormModal';
import { DetailModal, DetailGrid, DetailItem } from '../../components/ui/DetailModal';
import { Client } from '../../types';
import { useAuth } from '../../context/AuthContext';

type FilterTab = 'Todos' | 'Abiertos' | 'En Proceso' | 'Resueltos' | 'Míos' | 'Sin asignar';

interface Ticket {
  id: string;
  subject: string;
  client: string;
  system: string;
  priority: 'Alta' | 'Media' | 'Baja' | 'Crítica';
  status: 'Pendiente' | 'En Proceso' | 'Resuelto';
  lastActivity: string;
  assigneeId?: string;
  assigneeName?: string;
  description?: string;
  internalNotes?: string;
}

type AssigneeOption = { id: string; name: string };

const SUBJECT_PRESETS = [
  'No carga el sistema',
  'Error al iniciar sesión',
  'Problema con correos / webmail',
  'Sitio web caído',
  'Renovación de dominio/hosting',
  'Solicitud de cambio / ajuste',
  'Capacitación / duda de uso',
  'Facturación / cobranza',
];

const SYSTEM_PRESETS = [
  'Hosting / cPanel',
  'Dominio / DNS',
  'Correo / Webmail',
  'Infraestructura general',
];

const PRIORITIES: Ticket['priority'][] = ['Baja', 'Media', 'Alta', 'Crítica'];
const STATUSES: Ticket['status'][] = ['Pendiente', 'En Proceso', 'Resuelto'];

const emptyTicket = {
  clientId: '',
  client: '',
  subject: '',
  system: '',
  priority: 'Media' as Ticket['priority'],
  status: 'Pendiente' as Ticket['status'],
  assigneeId: '',
  description: '',
  internalNotes: '',
};

export default function Support() {
  const { user, can } = useAuth();
  const location = useLocation();
  const myId = user?.id ? String(user.id) : '';
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('Todos');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [assignees, setAssignees] = useState<AssigneeOption[]>([]);
  const [catalogProducts, setCatalogProducts] = useState<{ id: string; name: string }[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(emptyTicket);
  const [detail, setDetail] = useState<Ticket | null>(null);
  const [customSystem, setCustomSystem] = useState(false);

  const loadTickets = () => {
    apiGet<Ticket[]>('/api/tickets', { fresh: true })
      .then(setTickets)
      .catch(() => setTickets([]));
  };

  useEffect(() => {
    loadTickets();
    apiGet<Client[]>('/api/clients').then(setClients).catch(() => setClients([]));
    apiGet<{ id: string; name: string }[]>('/api/catalog')
      .then((items) => setCatalogProducts(items.map((p) => ({ id: p.id, name: p.name }))))
      .catch(() => setCatalogProducts([]));
    if (can('tickets.manage')) {
      apiGet<AssigneeOption[]>('/api/tickets/assignees')
        .then(setAssignees)
        .catch(() => setAssignees([]));
    }
  }, [user?.id]);

  useEffect(() => {
    const state = location.state as { clientId?: string; clientName?: string } | null;
    if (!state?.clientId || !can('tickets.manage')) return;
    setEditingId(null);
    setForm({
      ...emptyTicket,
      clientId: state.clientId,
      client: state.clientName || '',
    });
    setCustomSystem(false);
    setModalOpen(true);
  }, [location.state]);

  const systemOptions = [
    ...SYSTEM_PRESETS,
    ...catalogProducts.map((p) => p.name),
  ].filter((v, i, arr) => arr.findIndex((x) => x.toLowerCase() === v.toLowerCase()) === i);

  const updateStatus = async (id: string, status: Ticket['status']) => {
    try {
      await apiMutate('put', `/api/tickets/${id}`, { status });
      loadTickets();
    } catch {
      // keep UI quiet
    }
  };

  const claimTicket = async (ticket: Ticket) => {
    try {
      await apiMutate('post', `/api/tickets/${ticket.id}/claim`);
      loadTickets();
      if (detail?.id === ticket.id) {
        setDetail(null);
      }
    } catch {
      // keep UI quiet
    }
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyTicket);
    setCustomSystem(false);
    setModalOpen(true);
  };

  const openEdit = (ticket: Ticket) => {
    setEditingId(ticket.id);
    const matched = clients.find((c) => c.businessName === ticket.client);
    const system = ticket.system || '';
    const isKnown = !system || systemOptions.some((s) => s.toLowerCase() === system.toLowerCase());
    setForm({
      clientId: matched?.id || '',
      client: ticket.client,
      subject: ticket.subject,
      system,
      priority: ticket.priority,
      status: ticket.status,
      assigneeId: ticket.assigneeId || '',
      description: ticket.description || '',
      internalNotes: ticket.internalNotes || '',
    });
    setCustomSystem(!!system && !isKnown);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setForm(emptyTicket);
    setCustomSystem(false);
  };

  const saveTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const selected = clients.find((c) => c.id === form.clientId);
      const payload = {
        ...form,
        clientId: form.clientId || null,
        client: selected?.businessName || form.client || 'Interno / Propietario',
        system: form.system || null,
        assigneeId: form.assigneeId || null,
        description: form.description.trim() || null,
        internalNotes: form.internalNotes.trim() || null,
      };
      if (editingId) {
        await apiMutate('put', `/api/tickets/${editingId}`, payload);
      } else {
        await apiMutate('post', '/api/tickets', payload);
      }
      closeModal();
      loadTickets();
    } finally {
      setSubmitting(false);
    }
  };

  const deleteTicket = async (ticket: Ticket) => {
    if (!window.confirm(`¿Eliminar el ticket "${ticket.subject}"?`)) return;
    await apiMutate('delete', `/api/tickets/${ticket.id}`);
    loadTickets();
  };

  const openTicketsCount = tickets.filter(t => t.status === 'Pendiente').length;
  const resolvedThisMonth = tickets.filter(t => t.status === 'Resuelto').length;
  const mineCount = tickets.filter(t => t.assigneeId && t.assigneeId === myId).length;
  const unassignedCount = tickets.filter(t => !t.assigneeId).length;

  const counts = {
    'Todos': tickets.length,
    'Abiertos': openTicketsCount,
    'En Proceso': tickets.filter(t => t.status === 'En Proceso').length,
    'Resueltos': resolvedThisMonth,
    'Míos': mineCount,
    'Sin asignar': unassignedCount,
  };

  // Filtering
  const filteredTickets = tickets.filter(ticket => {
    // Search filter
    const matchesSearch = 
      ticket.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ticket.assigneeName || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;

    // Tab filter
    if (activeTab === 'Abiertos' && ticket.status !== 'Pendiente') return false;
    if (activeTab === 'En Proceso' && ticket.status !== 'En Proceso') return false;
    if (activeTab === 'Resueltos' && ticket.status !== 'Resuelto') return false;
    if (activeTab === 'Míos' && (!ticket.assigneeId || ticket.assigneeId !== myId)) return false;
    if (activeTab === 'Sin asignar' && ticket.assigneeId) return false;

    return true;
  });

  const getPriorityBadge = (priority: Ticket['priority']) => {
    switch (priority) {
      case 'Crítica':
        return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
      case 'Alta':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'Media':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'Baja':
        return 'bg-slate-500/10 text-sa-muted border-slate-500/20';
      default:
        return 'bg-slate-500/10 text-sa-muted border-slate-500/20';
    }
  };

  const priorityChipClass = (p: Ticket['priority'], active: boolean) => {
    const base = 'px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-colors';
    if (!active) return cn(base, 'bg-sa-canvas text-sa-faint border-sa-border-strong hover:text-sa-text hover:border-sa-muted');
    switch (p) {
      case 'Crítica': return cn(base, 'bg-rose-500/20 text-rose-300 border-rose-500/40');
      case 'Alta': return cn(base, 'bg-red-500/20 text-red-300 border-red-500/40');
      case 'Media': return cn(base, 'bg-amber-500/20 text-amber-300 border-amber-500/40');
      case 'Baja': return cn(base, 'bg-slate-500/20 text-slate-300 border-slate-500/40');
    }
  };

  const statusChipClass = (s: Ticket['status'], active: boolean) => {
    const base = 'px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-colors';
    if (!active) return cn(base, 'bg-sa-canvas text-sa-faint border-sa-border-strong hover:text-sa-text hover:border-sa-muted');
    switch (s) {
      case 'Pendiente': return cn(base, 'bg-amber-500/20 text-amber-300 border-amber-500/40');
      case 'En Proceso': return cn(base, 'bg-blue-500/20 text-blue-300 border-blue-500/40');
      case 'Resuelto': return cn(base, 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40');
    }
  };

  const getStatusBadge = (status: Ticket['status']) => {
    switch (status) {
      case 'Pendiente':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'En Proceso':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'Resuelto':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-extrabold text-sa-text tracking-tight">Tickets</h1>
        <Can ability="tickets.manage">
          <button type="button" onClick={openCreate} className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/20"><Plus className="h-4 w-4 mr-2" />
            Registrar Ticket
          </button>
        </Can>
      </div>

      <FormModal
        open={modalOpen}
        title={editingId ? 'Editar Ticket' : 'Registrar Ticket'}
        description={editingId ? undefined : 'Elige cliente, asunto y prioridad. Los chips aceleran el llenado.'}
        onClose={closeModal}
        onSubmit={saveTicket}
        submitting={submitting}
        submitLabel={editingId ? 'Guardar cambios' : 'Crear Ticket'}
        wide
      >
        <Field label="Cliente" hint="Si es un caso interno tuyo, deja Interno.">
          <select
            className={inputClass}
            value={form.clientId}
            onChange={(e) => setForm({ ...form, clientId: e.target.value })}
          >
            <option value="">Interno / Propietario</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.businessName}</option>
            ))}
          </select>
        </Field>

        <Field label="Asunto" hint="Puedes usar un asunto rápido o escribir el tuyo.">
          <input
            required
            className={inputClass}
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
            placeholder="ej: No carga el panel del cliente ACME"
          />
        </Field>
        <div className="flex flex-wrap gap-1.5 -mt-1">
          {SUBJECT_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setForm({ ...form, subject: preset })}
              className={cn(
                'px-2 py-1 rounded-md text-[10px] font-semibold border transition-colors',
                form.subject === preset
                  ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                  : 'bg-sa-canvas text-sa-muted border-sa-border-strong hover:text-sa-text hover:border-sa-muted',
              )}
            >
              {preset}
            </button>
          ))}
        </div>

        <Field label="Sistema / Producto" hint="Producto SaaS, hosting, dominio, correo…">
          {!customSystem ? (
            <select
              className={inputClass}
              value={form.system && systemOptions.includes(form.system) ? form.system : ''}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '__custom__') {
                  setCustomSystem(true);
                  setForm({ ...form, system: '' });
                  return;
                }
                setForm({ ...form, system: value });
              }}
            >
              <option value="">Seleccionar…</option>
              {systemOptions.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
              <option value="__custom__">Otro (escribir…)</option>
            </select>
          ) : (
            <div className="space-y-1.5">
              <input
                className={inputClass}
                value={form.system}
                onChange={(e) => setForm({ ...form, system: e.target.value })}
                placeholder="ej: SoftArc ERP · módulo ventas"
              />
              <button
                type="button"
                className="text-[11px] font-semibold text-blue-400 hover:text-blue-300"
                onClick={() => {
                  setCustomSystem(false);
                  setForm({ ...form, system: '' });
                }}
              >
                Elegir de la lista
              </button>
            </div>
          )}
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-sa-muted">Prioridad</p>
            <div className="flex flex-wrap gap-1.5">
              {PRIORITIES.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setForm({ ...form, priority: p })}
                  className={priorityChipClass(p, form.priority === p)}
                >
                  {p}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-sa-faint">Crítica = caída total o pérdida de acceso urgente.</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-semibold text-sa-muted">Estado</p>
            <div className="flex flex-wrap gap-1.5">
              {STATUSES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setForm({ ...form, status: s })}
                  className={statusChipClass(s, form.status === s)}
                >
                  {s}
                </button>
              ))}
            </div>
            {!editingId && (
              <p className="text-[11px] text-sa-faint">Al crear suele quedar en Pendiente.</p>
            )}
          </div>
        </div>

        <Field label="Asignar a" hint="Opcional. Si lo dejas vacío, queda en bandeja para que alguien lo tome.">
          <select
            className={inputClass}
            value={form.assigneeId}
            onChange={(e) => setForm({ ...form, assigneeId: e.target.value })}
          >
            <option value="">Sin asignar (bandeja común)</option>
            {assignees.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </Field>

        <Field label="Descripción" hint="Detalle del problema o solicitud (visible en el ticket).">
          <textarea
            className={cn(inputClass, 'min-h-[88px] resize-y')}
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Describe el incidente, pasos para reproducir o lo que pide el cliente…"
          />
        </Field>

        <Field label="Notas internas" hint="Solo para el equipo. No se envían al cliente.">
          <textarea
            className={cn(inputClass, 'min-h-[72px] resize-y')}
            rows={2}
            value={form.internalNotes}
            onChange={(e) => setForm({ ...form, internalNotes: e.target.value })}
            placeholder="Ej: revisar logs de cPanel · pendiente credenciales FTP"
          />
        </Field>
      </FormModal>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-sa-panel border border-sa-border rounded-2xl p-5 flex items-center gap-4 group hover:border-sa-border-strong transition-colors relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl -mr-6 -mt-6"></div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 relative z-10 group-hover:scale-110 transition-transform">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div className="relative z-10">
            <p className="text-[11px] font-bold text-sa-faint uppercase tracking-wider mb-1">Tickets Abiertos</p>
            <h3 className="text-2xl font-extrabold text-sa-text">{openTicketsCount} <span className="text-sm font-medium text-sa-faint normal-case">Pendientes</span></h3>
          </div>
        </div>

        <div className="bg-sa-panel border border-sa-border rounded-2xl p-5 flex items-center gap-4 group hover:border-sa-border-strong transition-colors relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl -mr-6 -mt-6"></div>
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 relative z-10 group-hover:scale-110 transition-transform">
            <Clock className="h-6 w-6" />
          </div>
          <div className="relative z-10">
            <p className="text-[11px] font-bold text-sa-faint uppercase tracking-wider mb-1">Tiempo de Respuesta</p>
            <h3 className="text-2xl font-extrabold text-sa-text">15 <span className="text-sm font-medium text-sa-faint normal-case">minutos prom.</span></h3>
          </div>
        </div>

        <div className="bg-sa-panel border border-sa-border rounded-2xl p-5 flex items-center gap-4 group hover:border-sa-border-strong transition-colors relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl -mr-6 -mt-6"></div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 relative z-10 group-hover:scale-110 transition-transform">
            <CheckCircle className="h-6 w-6" />
          </div>
          <div className="relative z-10">
            <p className="text-[11px] font-bold text-sa-faint uppercase tracking-wider mb-1">Resueltos este Mes</p>
            <h3 className="text-2xl font-extrabold text-sa-text">{resolvedThisMonth} <span className="text-sm font-medium text-sa-faint normal-case">Resueltos</span></h3>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        {/* Tabs */}
        <div className="flex items-center gap-1 bg-sa-panel border border-sa-border rounded-xl p-1 overflow-x-auto custom-scrollbar w-full xl:w-auto">
          {(['Todos', 'Abiertos', 'En Proceso', 'Resueltos', 'Míos', 'Sin asignar'] as FilterTab[]).map(tab => {
            const count = counts[tab];
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap",
                  activeTab === tab 
                    ? "bg-sa-border text-sa-text shadow-sm" 
                    : "text-sa-faint hover:text-sa-muted hover:bg-sa-border/50"
                )}
              >
                {tab} <span className="ml-1 opacity-60">({count})</span>
              </button>
            )
          })}
        </div>

        {/* Search */}
        <div className="relative w-full xl:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-sa-faint" />
          <input 
            type="text" 
            placeholder="Buscar ticket por ID, asunto o cliente..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-3 py-2.5 bg-sa-input border border-sa-border rounded-xl text-sa-text text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder-sa-faint"/>
        </div>
      </div>

      {/* Table */}
      <div className="bg-sa-panel border border-sa-border rounded-2xl shadow-sm overflow-hidden">
        {filteredTickets.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <EmptyState 
              icon={LifeBuoy}
              title="No hay tickets"
              description="No se encontraron tickets que coincidan con los filtros actuales."
            />
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-sm min-w-[1100px]">
              <thead className="bg-sa-border/50 text-sa-faint font-semibold border-b border-sa-border sticky top-0 z-10 backdrop-blur-sm">
                <tr>
                  <th className="px-6 py-4 uppercase tracking-wider text-[11px]">ID / Asunto</th>
                  <th className="px-6 py-4 uppercase tracking-wider text-[11px]">Cliente / Sistema</th>
                  <th className="px-6 py-4 uppercase tracking-wider text-[11px]">Asignado</th>
                  <th className="px-6 py-4 uppercase tracking-wider text-[11px]">Prioridad</th>
                  <th className="px-6 py-4 uppercase tracking-wider text-[11px]">Estado</th>
                  <th className="px-6 py-4 uppercase tracking-wider text-[11px]">Última Actividad / SLA</th>
                  <th className="px-6 py-4 uppercase tracking-wider text-[11px] text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E293B]">
                {filteredTickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    onClick={() => setDetail(ticket)}
                    className="hover:bg-sa-border/50 transition-colors group cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-bold text-sa-text text-[13px]">{ticket.id} - {ticket.subject}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div >{ticket.client}</div>
                        <div className="text-sa-faint text-[11px] mt-0.5">Producto: {ticket.system}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {ticket.assigneeName ? (
                        <span >
                          <UserPlus className="h-3.5 w-3.5 text-blue-400" />
                          {ticket.assigneeName}
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-amber-400/90">Sin asignar</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold border whitespace-nowrap",
                        getPriorityBadge(ticket.priority)
                      )}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold border whitespace-nowrap",
                        getStatusBadge(ticket.status)
                      )}>
                        {ticket.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sa-muted text-[13px] flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-sa-faint" />
                        {ticket.lastActivity}
                      </div>
                    </td>
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <Can ability="tickets.manage">
                          {!ticket.assigneeId && (
                            <button
                              type="button"
                              onClick={() => void claimTicket(ticket)}
                              className="px-3 py-1.5 bg-amber-500/15 text-amber-300 text-xs font-semibold rounded-lg hover:bg-amber-500/25 transition-colors border border-amber-500/30 flex items-center gap-1.5 whitespace-nowrap"
                              title="Tomar este ticket"
                            >
                              <Hand className="h-3.5 w-3.5" /> Tomar
                            </button>
                          )}
                        </Can>
                        <button 
                          className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center hover:bg-emerald-500/20 transition-colors border border-emerald-500/20"
                          title="Responder rápido al cliente (WhatsApp)">
                          <MessageSquare className="h-4 w-4" />
                        </button>
                        <Can ability="tickets.manage">
                          <button 
                            type="button"
                            onClick={() => openEdit(ticket)} title="Editar ticket"
                          >
                            <ExternalLink className="h-3.5 w-3.5 text-sa-muted" /> Editar
                          </button>
                        </Can>
                        <div className="relative group/menu">
                          <button type="button" className="p-2 rounded-lg text-sa-faint hover:text-sa-text hover:bg-sa-border/60 transition-colors"><MoreVertical className="h-4 w-4" />
                          </button>
                          <div className="absolute right-0 top-full mt-1 w-40 bg-sa-border border border-sa-border-strong rounded-lg shadow-xl opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-20">
                            <div className="py-1">
                              <button type="button" onClick={() => updateStatus(ticket.id, 'En Proceso')} className="w-full text-left px-4 py-2 text-xs text-sa-muted hover:text-sa-text hover:bg-sa-border-strong transition-colors">Marcar En Proceso</button>
                              <button type="button" onClick={() => updateStatus(ticket.id, 'Resuelto')} className="w-full text-left px-4 py-2 text-xs text-emerald-400 hover:bg-sa-border-strong transition-colors">Marcar Resuelto</button>
                              <Can ability="tickets.manage">
                                <button type="button" onClick={() => deleteTicket(ticket)} className="w-full text-left px-4 py-2 text-xs text-red-400 hover:bg-sa-border-strong transition-colors">Eliminar</button>
                              </Can>
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <DetailModal
        open={!!detail}
        title={detail?.subject || 'Ticket'}
        subtitle={detail ? `${detail.id} · ${detail.client}` : undefined}
        onClose={() => setDetail(null)}
        footer={detail && (
          <>
            <Can ability="tickets.manage">
              {!detail.assigneeId && (
                <button
                  type="button"
                  onClick={() => void claimTicket(detail)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30"
                >
                  Tomar ticket
                </button>
              )}
              <button
                type="button"
                onClick={() => { const t = detail; setDetail(null); openEdit(t); }} className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors">
                Editar
              </button>
            </Can>
            <button type="button" onClick={() => setDetail(null)} className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-semibold text-sa-muted hover:text-sa-text hover:bg-sa-border/60 transition-colors">Cerrar</button>
          </>
        )}
      >
        {detail && (
          <DetailGrid>
            <DetailItem label="ID" value={detail.id} mono />
            <DetailItem label="Asunto" value={detail.subject} full />
            <DetailItem label="Cliente" value={detail.client} />
            <DetailItem label="Sistema / Producto" value={detail.system} />
            <DetailItem label="Asignado a" value={detail.assigneeName || 'Sin asignar'} />
            <DetailItem label="Prioridad" value={detail.priority} />
            <DetailItem label="Estado" value={detail.status} />
            <DetailItem label="Última actividad" value={detail.lastActivity} full />
            <DetailItem label="Descripción" value={detail.description || '—'} full />
            <DetailItem label="Notas internas" value={detail.internalNotes || '—'} full />
          </DetailGrid>
        )}
      </DetailModal>
    </div>
  );
}

