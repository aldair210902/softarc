import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus, Search, Phone, Building2, DollarSign, Users, AlertCircle, Clock, MessageCircle,
  Pencil, Ban, Trash2, Mail, CircleDot, ExternalLink, HardDrive, Globe, Key, Eye, EyeOff, Copy,
  Wand2, LifeBuoy, Receipt,
} from 'lucide-react';
import { Client, Subscription } from '../../types';
import { EmptyState } from '../../components/ui/EmptyState';
import { Can } from '../../components/Can';
import { useCompanySettings } from '../../hooks/useCompanySettings';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';
import { apiGet, apiMutate, getCached } from '../../lib/api';
import { Field, FormModal, inputClass } from '../../components/ui/FormModal';
import { DetailModal, DetailGrid, DetailItem } from '../../components/ui/DetailModal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { HostingProcessNav } from '../../components/HostingProcessNav';
import { resolveCpanelUrl, resolveSiteUrl, resolveWebmailUrl } from '../../lib/hostingLinks';
import { FileZillaCopyBlock } from '../../components/FileZillaCopyBlock';

type FilterTab = 'Todos' | 'Al Día' | 'Por Vencer' | 'Vencidos';

type ClientHostingDomain = {
  id: string;
  domainName: string;
  provider?: string;
  expiryDate?: string;
  autoRenew?: boolean;
  serverId?: string;
  serverName?: string;
  serverIp?: string;
  serverProvider?: string;
  serverLocation?: string;
  panelUrl?: string;
  webmailUrl?: string;
  sslStatus?: string;
  nodeStatus?: string;
};

type ClientHostingServer = {
  id: string;
  name: string;
  ip?: string;
  provider?: string;
  location?: string;
  panelUrl?: string;
  webmailUrl?: string;
  sslStatus?: string;
  nodeStatus?: string;
  domainsCount?: number;
};

type ClientHostingCredential = {
  id: string;
  name: string;
  clientId?: string;
  clientName?: string;
  domainId?: string;
  domainName?: string;
  serverIp?: string;
  clientOrServer?: string;
  port?: number | null;
  encryption?: string;
  isFtp?: boolean;
  ftpHosts?: string[];
  username?: string;
  category?: string;
  canReveal?: boolean;
  secretMasked?: string;
};

type ClientHosting = {
  domains: ClientHostingDomain[];
  servers: ClientHostingServer[];
  credentials: ClientHostingCredential[];
};

const emptyClientForm = {
  businessName: '',
  documentNumber: '',
  contactName: '',
  phone: '',
  billingEmail: '',
  status: 'Activo',
  serviceName: '',
  amount: '',
  frequency: 'Mensual',
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('') || '?';
}

function digitsOnly(value?: string | null) {
  return (value || '').replace(/\D/g, '');
}

export default function Clients() {
  const { settings } = useCompanySettings();
  const { can } = useAuth();
  const [clients, setClients] = useState<Client[]>(() => getCached<Client[]>('/api/clients') ?? []);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(() => getCached<Subscription[]>('/api/subscriptions') ?? []);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('Todos');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(emptyClientForm);
  const [confirmAction, setConfirmAction] = useState<null | {
    type: 'delete' | 'suspend' | 'activate';
    client: Client;
    mainSub?: Subscription;
  } | null>(null);
  const [detail, setDetail] = useState<Client | null>(null);
  const [hosting, setHosting] = useState<ClientHosting | null>(null);
  const [hostingLoading, setHostingLoading] = useState(false);
  const [revealedSecrets, setRevealedSecrets] = useState<Record<string, string>>({});
  const [visibleSecrets, setVisibleSecrets] = useState<Record<string, boolean>>({});

  const loadData = () => {
    Promise.all([
      apiGet<Client[]>('/api/clients'),
      apiGet<Subscription[]>('/api/subscriptions'),
    ])
      .then(([c, s]) => {
        setClients(c);
        setSubscriptions(s);
      })
      .catch(() => {
        setClients([]);
        setSubscriptions([]);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!detail) {
      setHosting(null);
      setRevealedSecrets({});
      setVisibleSecrets({});
      return;
    }
    setHostingLoading(true);
    apiGet<ClientHosting>(`/api/clients/${detail.id}/hosting`, { fresh: true })
      .then(setHosting)
      .catch(() => setHosting({ domains: [], servers: [], credentials: [] }))
      .finally(() => setHostingLoading(false));
  }, [detail?.id]);

  const revealCredential = async (id: string): Promise<string | null> => {
    if (revealedSecrets[id]) {
      setVisibleSecrets((prev) => ({ ...prev, [id]: !prev[id] }));
      return revealedSecrets[id];
    }
    try {
      const res = await apiGet<{ secret: string }>(`/api/credentials/${id}/reveal`, { fresh: true });
      setRevealedSecrets((prev) => ({ ...prev, [id]: res.secret }));
      setVisibleSecrets((prev) => ({ ...prev, [id]: true }));
      return res.secret;
    } catch {
      return null;
    }
  };

  const copyText = async (value: string) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // silencioso
    }
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyClientForm);
    setModalOpen(true);
  };

  const openEdit = (client: Client) => {
    setEditingId(client.id);
    setForm({
      ...emptyClientForm,
      businessName: client.businessName,
      documentNumber: client.documentNumber || '',
      contactName: client.contactName,
      phone: client.phone || '',
      billingEmail: client.billingEmail || '',
      status: client.status || 'Activo',
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setForm(emptyClientForm);
  };

  const saveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        businessName: form.businessName,
        documentNumber: form.documentNumber.trim() || null,
        contactName: form.contactName,
        phone: form.phone,
        billingEmail: form.billingEmail,
        status: form.status,
      };
      if (editingId) {
        await apiMutate('put', `/api/clients/${editingId}`, payload);
      } else {
        const client = await apiMutate<Client>('post', '/api/clients', payload);
        if (form.serviceName && form.amount) {
          await apiMutate('post', '/api/subscriptions', {
            clientId: client.id,
            serviceName: form.serviceName,
            amount: Number(form.amount),
            frequency: form.frequency,
            startDate: new Date().toISOString().slice(0, 10),
            nextPaymentDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
            status: 'Al Día',
          });
        }
      }
      closeModal();
      loadData();
    } finally {
      setSubmitting(false);
    }
  };

  const deleteClient = async (client: Client) => {
    await apiMutate('delete', `/api/clients/${client.id}`);
    loadData();
  };

  const suspendClient = async (client: Client, mainSub?: Subscription) => {
    await apiMutate('put', `/api/clients/${client.id}`, { status: 'Inactivo' });
    if (mainSub) {
      await apiMutate('put', `/api/subscriptions/${mainSub.id}`, { status: 'Suspendido' });
    }
    loadData();
  };

  const activateClient = async (client: Client, mainSub?: Subscription) => {
    await apiMutate('put', `/api/clients/${client.id}`, { status: 'Activo' });
    if (mainSub && mainSub.status === 'Suspendido') {
      await apiMutate('put', `/api/subscriptions/${mainSub.id}`, { status: 'Al Día' });
    }
    loadData();
  };

  const runConfirmedAction = async () => {
    if (!confirmAction) return;
    const { type, client, mainSub } = confirmAction;
    if (type === 'delete') await deleteClient(client);
    if (type === 'suspend') await suspendClient(client, mainSub);
    if (type === 'activate') await activateClient(client, mainSub);
  };

  const confirmCopy = (() => {
    if (!confirmAction) {
      return { title: '', description: '', confirmText: 'Confirmar', isDestructive: true };
    }
    const name = confirmAction.client.businessName;
    if (confirmAction.type === 'delete') {
      return {
        title: 'Eliminar cliente',
        description: `¿Seguro que quieres eliminar a "${name}"? Esta acción no se puede deshacer.`,
        confirmText: 'Sí, eliminar',
        isDestructive: true,
      };
    }
    if (confirmAction.type === 'suspend') {
      return {
        title: 'Suspender cliente',
        description: `¿Suspender a "${name}"? Quedará inactivo y su suscripción pasará a Suspendido si aplica.`,
        confirmText: 'Sí, suspender',
        isDestructive: true,
      };
    }
    return {
      title: 'Reactivar cliente',
      description: `¿Reactivar a "${name}"? Volverá a estado Activo.`,
      confirmText: 'Sí, reactivar',
      isDestructive: false,
    };
  })();

  const getClientSubs = (clientId: string) => subscriptions.filter((s) => s.clientId === clientId);

  const activeClientsCount = clients.length;
  const activeMrr = subscriptions
    .filter((s) => s.status === 'Al Día' || s.status === 'Por Vencer')
    .reduce((sum, s) => sum + s.amount, 0);
  const dueSoonCount = subscriptions.filter((s) => s.status === 'Por Vencer').length;
  const overdueCount = subscriptions.filter((s) => s.status === 'Vencido').length;
  const onTimeCount = subscriptions.filter((s) => s.status === 'Al Día').length;

  const filteredClients = clients.filter((c) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      c.businessName.toLowerCase().includes(q)
      || (c.documentNumber || '').toLowerCase().includes(q)
      || (c.contactName || '').toLowerCase().includes(q)
      || (c.phone || '').includes(q)
      || (c.billingEmail || '').toLowerCase().includes(q);

    if (!matchesSearch) return false;
    if (activeTab === 'Todos') return true;

    const mainSubStatus = getClientSubs(c.id)[0]?.status || 'Sin suscripción';
    if (activeTab === 'Al Día' && mainSubStatus === 'Al Día') return true;
    if (activeTab === 'Por Vencer' && mainSubStatus === 'Por Vencer') return true;
    if (activeTab === 'Vencidos' && mainSubStatus === 'Vencido') return true;
    return false;
  });

  const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat('es-PE', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
  };

  const getWhatsAppMessage = (client: Client, sub?: Subscription) => {
    if (!sub) return '';
    return `Hola ${client.contactName}, te escribimos de ${settings.legalName}. Te recordamos amablemente el pago de tu suscripción "${sub.serviceName}" por ${settings.currencySymbol}${sub.amount}.`;
  };

  const paymentBadge = (status?: string) => {
    switch (status) {
      case 'Al Día':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'Por Vencer':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'Vencido':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'Suspendido':
        return 'bg-slate-500/10 text-slate-300 border-slate-500/20';
      default:
        return 'bg-sa-border text-sa-muted border-sa-border-strong';
    }
  };

  const actionBtn =
    'w-9 h-9 rounded-xl flex items-center justify-center border transition-colors shrink-0';

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-sa-text tracking-tight">Clientes</h1>
          <p className="text-sm text-sa-faint mt-1">Empresas a las que facturas y el estado de sus planes.</p>
        </div>
        <Can ability="clients.manage">
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/20"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Cliente
          </button>
        </Can>
      </div>

      <HostingProcessNav current="clients" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-sa-panel border border-sa-border rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-sa-faint uppercase tracking-wider mb-1">Clientes</p>
            <h3 className="text-2xl font-extrabold text-sa-text">{activeClientsCount}</h3>
          </div>
        </div>
        <div className="bg-sa-panel border border-sa-border rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-sa-faint uppercase tracking-wider mb-1">MRR Activo</p>
            <h3 className="text-2xl font-extrabold text-sa-text">{settings.currencySymbol} {activeMrr.toLocaleString()}</h3>
          </div>
        </div>
        <div className="bg-sa-panel border border-sa-border rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-sa-faint uppercase tracking-wider mb-1">Por Vencer</p>
            <h3 className="text-2xl font-extrabold text-sa-text">{dueSoonCount}</h3>
          </div>
        </div>
        <div className="bg-sa-panel border border-sa-border rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-sa-faint uppercase tracking-wider mb-1">En Mora</p>
            <h3 className="text-2xl font-extrabold text-sa-text">{overdueCount}</h3>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-1 bg-sa-panel border border-sa-border rounded-xl p-1 overflow-x-auto custom-scrollbar">
          {(['Todos', 'Al Día', 'Por Vencer', 'Vencidos'] as FilterTab[]).map((tab) => {
            const count = tab === 'Todos' ? activeClientsCount
              : tab === 'Al Día' ? onTimeCount
                : tab === 'Por Vencer' ? dueSoonCount
                  : overdueCount;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap',
                  activeTab === tab
                    ? 'bg-sa-border text-sa-text shadow-sm'
                    : 'text-sa-faint hover:text-sa-muted hover:bg-sa-border/50',
                )}
              >
                {tab} <span className="ml-1 opacity-60">({count})</span>
              </button>
            );
          })}
        </div>

        <div className="relative w-full lg:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-sa-faint" />
          <input
            type="text"
            placeholder="Buscar empresa, RUC, contacto, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-3 py-2.5 bg-sa-input border border-sa-border rounded-xl text-sa-text text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder-sa-faint"/>
        </div>
      </div>

      <FormModal
        open={modalOpen}
        title={editingId ? 'Editar Cliente' : 'Nuevo Cliente'}
        description={editingId ? 'Actualiza los datos del cliente.' : 'Crea el cliente y, opcionalmente, su primera suscripción.'}
        onClose={closeModal}
        onSubmit={saveClient}
        submitting={submitting}
        submitLabel="Guardar Cliente"
        wide
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Razón social">
            <input required className={inputClass} value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} />
          </Field>
          <Field label="RUC / Documento" hint="Opcional si aún no lo tienes">
            <input className={inputClass} value={form.documentNumber} onChange={(e) => setForm({ ...form, documentNumber: e.target.value })} placeholder="Ej: 20123456789" />
          </Field>
          <Field label="Contacto">
            <input required className={inputClass} value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} />
          </Field>
          <Field label="Teléfono">
            <input className={inputClass} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </Field>
          <Field label="Email de facturación">
            <input type="email" className={inputClass} value={form.billingEmail} onChange={(e) => setForm({ ...form, billingEmail: e.target.value })} />
          </Field>
          <Field label="Estado">
            <select className={inputClass} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="Activo">Activo</option>
              <option value="Inactivo">Inactivo</option>
            </select>
          </Field>
        </div>
        {!editingId && (
          <div className="pt-2 border-t border-sa-border">
            <p className="text-xs font-bold text-sa-faint uppercase tracking-wider mb-3">Suscripción inicial (opcional)</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="Plan / Servicio">
                <input className={inputClass} value={form.serviceName} onChange={(e) => setForm({ ...form, serviceName: e.target.value })} />
              </Field>
              <Field label={`Monto (${settings.currencySymbol})`}>
                <input type="number" min="0" step="0.01" className={inputClass} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              </Field>
              <Field label="Frecuencia">
                <select className={inputClass} value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })}>
                  <option>Mensual</option>
                  <option>Trimestral</option>
                  <option>Semestral</option>
                  <option>Anual</option>
                </select>
              </Field>
            </div>
          </div>
        )}
      </FormModal>

      <div className="bg-sa-panel border border-sa-border rounded-2xl shadow-sm overflow-hidden">
        {clients.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="Aún no tienes clientes registrados"
            description="La base de datos de clientes y suscripciones está vacía. Aquí aparecerán las empresas a las que facturas recurrentemente."
            action={
              <Can ability="clients.manage">
                <button type="button" onClick={openCreate} className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/20"><Plus className="h-4 w-4 mr-2" />
                  Registrar Primer Cliente
                </button>
              </Can>
            }
          />
        ) : filteredClients.length === 0 ? (
          <div className="p-12 text-center text-sa-muted text-sm">No se encontraron resultados para tu búsqueda o filtro.</div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-sm min-w-[1100px]">
              <thead className="bg-sa-canvas/80 text-sa-faint font-semibold border-b border-sa-border">
                <tr>
                  <th className="px-5 py-3.5 uppercase tracking-wider text-[11px]">Cliente</th>
                  <th className="px-5 py-3.5 uppercase tracking-wider text-[11px]">Contacto</th>
                  <th className="px-5 py-3.5 uppercase tracking-wider text-[11px]">Plan</th>
                  <th className="px-5 py-3.5 uppercase tracking-wider text-[11px]">Próximo pago</th>
                  <th className="px-5 py-3.5 uppercase tracking-wider text-[11px]">Estado</th>
                  <th className="px-5 py-3.5 uppercase tracking-wider text-[11px] text-right sticky right-0 bg-sa-canvas/95 z-10 min-w-[200px]">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E293B]">
                {filteredClients.map((client) => {
                  const subs = getClientSubs(client.id);
                  const mainSub = subs[0];
                  const phoneDigits = digitsOnly(client.phone);
                  const isInactive = (client.status || '').toLowerCase() === 'inactivo';

                  return (
                    <tr
                      key={client.id}
                      onClick={() => setDetail(client)}
                      className="hover:bg-sa-border/35 transition-colors group cursor-pointer"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 font-bold text-sm flex items-center justify-center shrink-0">
                            {initials(client.businessName)}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-sa-text text-[13px] truncate">{client.businessName}</div>
                            <div className="text-sa-faint text-[11px] mt-0.5 truncate">
                              {client.documentNumber ? `RUC ${client.documentNumber}` : 'Sin documento'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div >{client.contactName || '—'}</div>
                        <div className="mt-1 space-y-0.5">
                          <div className="flex items-center gap-1.5 text-sa-faint text-[11px]">
                            <Phone className="h-3 w-3 shrink-0" />
                            <span className="truncate">{client.phone || 'Sin teléfono'}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-sa-faint text-[11px]">
                            <Mail className="h-3 w-3 shrink-0" />
                            <span className="truncate max-w-[180px]">{client.billingEmail || 'Sin email'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        {mainSub ? (
                          <div>
                            <div >{mainSub.serviceName}</div>
                            <div className="text-sa-faint text-[11px] mt-0.5">
                              {settings.currencySymbol} {Number(mainSub.amount).toLocaleString()} · {mainSub.frequency}
                            </div>
                            {subs.length > 1 && (
                              <div className="text-[10px] text-blue-300/80 mt-1">+{subs.length - 1} plan(es) más</div>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-[11px] font-medium bg-sa-border text-sa-faint border border-sa-border-strong">
                            Sin suscripción
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-sa-text text-[13px] font-medium">{mainSub ? formatDate(mainSub.nextPaymentDate) : '—'}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-1.5 items-start">
                          <span className={cn(
                            'inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold border',
                            isInactive
                              ? 'bg-slate-500/10 text-slate-300 border-slate-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                          )}>
                            <CircleDot className="h-3 w-3" />
                            {client.status || 'Activo'}
                          </span>
                          {mainSub && (
                            <span className={cn('inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold border', paymentBadge(mainSub.status))}>
                              Pago: {mainSub.status}
                            </span>
                          )}
                        </div>
                      </td>
                      <td
                        className="px-5 py-4 sticky right-0 bg-sa-panel group-hover:bg-[#151c2c] z-10 border-l border-sa-border/80"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {mainSub && phoneDigits ? (
                            <a
                              href={`https://wa.me/${phoneDigits}?text=${encodeURIComponent(getWhatsAppMessage(client, mainSub))}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={cn(actionBtn, 'bg-[#25D366]/10 text-[#25D366] border-[#25D366]/25 hover:bg-[#25D366]/20')}
                              title="WhatsApp cobro"
                            >
                              <MessageCircle className="h-4 w-4" />
                            </a>
                          ) : (
                            <span className={cn(actionBtn, 'bg-sa-border/40 text-[#475569] border-sa-border cursor-not-allowed')} title="WhatsApp no disponible">
                              <MessageCircle className="h-4 w-4" />
                            </span>
                          )}

                          {phoneDigits ? (
                            <a
                              href={`tel:${phoneDigits}`}
                              className={cn(actionBtn, 'bg-sa-border text-sa-muted border-sa-border-strong hover:text-sa-text hover:bg-sa-border-strong')}
                              title="Llamar"
                            >
                              <Phone className="h-4 w-4" />
                            </a>
                          ) : null}

                          <Can ability="clients.manage">
                            <button
                              type="button"
                              onClick={() => openEdit(client)}
                              className={cn(actionBtn, 'bg-blue-500/10 text-blue-300 border-blue-500/25 hover:bg-blue-500/20')}
                              title="Editar"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            {isInactive ? (
                              <button
                                type="button"
                                onClick={() => setConfirmAction({ type: 'activate', client, mainSub })}
                                className={cn(actionBtn, 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25 hover:bg-emerald-500/20')}
                                title="Reactivar"
                              >
                                <CircleDot className="h-4 w-4" />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setConfirmAction({ type: 'suspend', client, mainSub })}
                                className={cn(actionBtn, 'bg-amber-500/10 text-amber-300 border-amber-500/25 hover:bg-amber-500/20')}
                                title="Suspender"
                              >
                                <Ban className="h-4 w-4" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setConfirmAction({ type: 'delete', client, mainSub })}
                              className={cn(actionBtn, 'bg-red-500/10 text-red-300 border-red-500/25 hover:bg-red-500/20')}
                              title="Eliminar"
                            >
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
        )}
      </div>

      <DetailModal
        open={!!detail}
        title={detail?.businessName || 'Cliente'}
        subtitle={detail?.contactName || undefined}
        onClose={() => setDetail(null)}
        wide
        footer={detail && (
          <>
            <Can ability="servers.manage">
              <Link
                to={`/admin/infra/hosting-wizard?clientId=${encodeURIComponent(detail.id)}`}
                onClick={() => setDetail(null)}
                className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-sa-border text-sa-text border border-sa-border-strong hover:bg-sa-border-strong transition-colors"
              >
                <Wand2 className="h-3.5 w-3.5" />
                Alta hosting
              </Link>
            </Can>
            <Can ability="tickets.manage">
              <Link
                to="/admin/support"
                state={{ clientId: detail.id, clientName: detail.businessName }}
                onClick={() => setDetail(null)}
                className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-sa-border text-sa-text border border-sa-border-strong hover:bg-sa-border-strong transition-colors"
              >
                <LifeBuoy className="h-3.5 w-3.5" />
                Nuevo ticket
              </Link>
            </Can>
            <Can ability="finances.manage">
              <Link
                to="/admin/finances/billing"
                state={{ clientId: detail.id }}
                onClick={() => setDetail(null)}
                className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-sa-border text-sa-text border border-sa-border-strong hover:bg-sa-border-strong transition-colors"
              >
                <Receipt className="h-3.5 w-3.5" />
                Nuevo cobro
              </Link>
            </Can>
            <Can ability="clients.manage">
              <button
                type="button"
                onClick={() => { const c = detail; setDetail(null); openEdit(c); }} className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors">
                Editar
              </button>
            </Can>
            <button type="button" onClick={() => setDetail(null)} className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-semibold text-sa-muted hover:text-sa-text hover:bg-sa-border/60 transition-colors">Cerrar</button>
          </>
        )}
      >
        {detail && (() => {
          const detailSubs = getClientSubs(detail.id);
          const detailMain = detailSubs[0];
          return (
            <div className="space-y-5">
              <DetailGrid>
                <DetailItem label="Razón social" value={detail.businessName} full />
                <DetailItem label="RUC / Documento" value={detail.documentNumber} mono />
                <DetailItem label="Estado" value={detail.status || 'Activo'} />
                <DetailItem label="Contacto" value={detail.contactName} />
                <DetailItem label="Teléfono" value={detail.phone} />
                <DetailItem label="Email facturación" value={detail.billingEmail} mono full />
                {detailMain ? (
                  <>
                    <DetailItem label="Plan / Servicio" value={detailMain.serviceName} />
                    <DetailItem
                      label="Monto"
                      value={`${settings.currencySymbol} ${Number(detailMain.amount).toLocaleString()} · ${detailMain.frequency}`}
                    />
                    <DetailItem label="Estado de pago" value={detailMain.status} />
                    <DetailItem label="Próximo pago" value={formatDate(detailMain.nextPaymentDate)} />
                    {detailSubs.length > 1 && (
                      <DetailItem label="Otros planes" value={`+${detailSubs.length - 1} plan(es) adicional(es)`} full />
                    )}
                  </>
                ) : (
                  <DetailItem label="Suscripción" value="Sin suscripción" full />
                )}
              </DetailGrid>

              <div className="border-t border-sa-border pt-4 space-y-4">
                <div className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-blue-400" />
                  <h4 className="text-sm font-bold text-sa-text">Hosting e infraestructura</h4>
                </div>

                {hostingLoading && (
                  <p className="text-xs text-sa-faint">Cargando dominios y servidores…</p>
                )}

                {!hostingLoading && hosting && hosting.domains.length === 0 && hosting.servers.length === 0 && (
                  <p className="text-xs text-sa-faint">
                    Este cliente aún no tiene dominios vinculados. Asócialos en Dominios o usa el alta de hosting.
                  </p>
                )}

                {!hostingLoading && hosting && hosting.domains.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-sa-faint flex items-center gap-1.5">
                      <Globe className="h-3.5 w-3.5" /> Dominios ({hosting.domains.length})
                    </p>
                    {hosting.domains.map((domain) => {
                      const site = resolveSiteUrl(domain.domainName);
                      const cpanel = resolveCpanelUrl({
                        panelUrl: domain.panelUrl,
                        domainName: domain.domainName,
                        ip: domain.serverIp,
                      });
                      const webmail = resolveWebmailUrl({
                        webmailUrl: domain.webmailUrl,
                        panelUrl: domain.panelUrl,
                        domainName: domain.domainName,
                        ip: domain.serverIp,
                      });
                      return (
                        <div key={domain.id} className="rounded-xl border border-sa-border bg-sa-canvas/60 p-3.5 space-y-2.5">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-sa-text truncate">{domain.domainName}</p>
                              <p className="text-[11px] text-sa-faint mt-0.5">
                                {domain.serverName || 'Sin servidor'}
                                {domain.serverIp ? ` · ${domain.serverIp}` : ''}
                                {domain.provider ? ` · ${domain.provider}` : ''}
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {site && (
                                <a
                                  href={site}
                                  target="_blank"
                                  rel="noopener noreferrer">
                                  Sitio <ExternalLink className="h-3 w-3" />
                                </a>
                              )}
                              {cpanel && (
                                <a
                                  href={cpanel}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-orange-500/15 text-orange-300 border border-orange-500/25 hover:bg-orange-500/25"
                                >
                                  cPanel
                                </a>
                              )}
                              {webmail && (
                                <a
                                  href={webmail}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-sky-500/15 text-sky-300 border border-sky-500/25 hover:bg-sky-500/25"
                                >
                                  Webmail
                                </a>
                              )}
                            </div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                            <div>
                              <p className="text-sa-faint uppercase tracking-wider text-[9px] font-bold mb-0.5">IP</p>
                              <p className="font-mono text-sa-muted">{domain.serverIp || '—'}</p>
                            </div>
                            <div>
                              <p className="text-sa-faint uppercase tracking-wider text-[9px] font-bold mb-0.5">Ubicación</p>
                              <p className="text-sa-text">{domain.serverLocation || '—'}</p>
                            </div>
                            <div>
                              <p className="text-sa-faint uppercase tracking-wider text-[9px] font-bold mb-0.5">SSL / Nodo</p>
                              <p className="text-sa-text">
                                {[domain.sslStatus, domain.nodeStatus].filter(Boolean).join(' · ') || '—'}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {!hostingLoading && hosting && hosting.servers.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-sa-faint flex items-center gap-1.5">
                      <HardDrive className="h-3.5 w-3.5" /> Servidores ({hosting.servers.length})
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {hosting.servers.map((server) => {
                        const cpanel = resolveCpanelUrl({ panelUrl: server.panelUrl, ip: server.ip });
                        const webmail = resolveWebmailUrl({ webmailUrl: server.webmailUrl, panelUrl: server.panelUrl, ip: server.ip });
                        return (
                          <div key={server.id} className="rounded-xl border border-sa-border bg-sa-canvas/40 p-3 space-y-1.5">
                            <p className="text-[13px] font-bold text-sa-text">{server.name}</p>
                            <p className="text-[11px] font-mono text-sa-muted">{server.ip || 'Sin IP'}</p>
                            <p className="text-[11px] text-sa-faint">
                              {[server.provider, server.location].filter(Boolean).join(' · ') || '—'}
                              {server.domainsCount ? ` · ${server.domainsCount} dominio(s)` : ''}
                            </p>
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {cpanel && (
                                <a href={cpanel} target="_blank" rel="noopener noreferrer" className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-orange-500/15 text-orange-300 border border-orange-500/20">
                                  cPanel
                                </a>
                              )}
                              {webmail && (
                                <a href={webmail} target="_blank" rel="noopener noreferrer" className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-500/15 text-sky-300 border border-sky-500/20">
                                  Webmail
                                </a>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {can('credentials.view') || can('credentials.manage') || can('credentials.reveal') ? (
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-sa-faint flex items-center gap-1.5">
                      <Key className="h-3.5 w-3.5" /> Credenciales relacionadas
                    </p>
                    {!hostingLoading && (!hosting?.credentials || hosting.credentials.length === 0) ? (
                      <p className="text-xs text-sa-faint">
                        No se encontraron credenciales que coincidan con este cliente, dominio o servidor.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {hosting?.credentials.map((cred) => {
                          const secret = revealedSecrets[cred.id];
                          const visible = !!visibleSecrets[cred.id];
                          return (
                            <div key={cred.id} className="rounded-xl border border-sa-border bg-sa-canvas/40 px-3 py-2.5">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="text-[13px] font-semibold text-sa-text truncate">{cred.name}</p>
                                  <p className="text-[11px] text-sa-faint truncate">
                                    {[cred.category, cred.domainName || cred.clientOrServer].filter(Boolean).join(' · ')}
                                  </p>
                                </div>
                                {cred.canReveal && (
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => void revealCredential(cred.id)} title={visible ? 'Ocultar' : 'Revelar'}
                                    >
                                      {visible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => void copyText(secret || '')}
                                      disabled={!secret} title="Copiar secreto"
                                    >
                                      <Copy className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                )}
                              </div>
                              <div className="mt-1.5 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                                <div>
                                  <p className="text-[9px] uppercase tracking-wider text-sa-faint font-bold mb-0.5">Usuario</p>
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-mono text-sa-muted truncate">{cred.username || '—'}</span>
                                    {cred.username && (
                                      <button type="button" onClick={() => void copyText(cred.username || '')} className="p-1.5 rounded-md text-sa-faint hover:text-sa-text hover:bg-sa-border transition-colors" title="Copiar">
                                        <Copy className="h-3 w-3" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                                <div>
                                  <p className="text-[9px] uppercase tracking-wider text-sa-faint font-bold mb-0.5">Secreto</p>
                                  <p className="font-mono text-sa-muted">
                                    {visible && secret ? secret : (cred.secretMasked || '••••••••••••')}
                                  </p>
                                </div>
                              </div>
                              {(cred.isFtp || /ftp/i.test(`${cred.name || ''} ${cred.category || ''} ${cred.clientOrServer || ''}`)) && (
                                <FileZillaCopyBlock
                                  storedHost={cred.clientOrServer}
                                  serverIp={cred.serverIp || hosting?.domains.find((d) => d.id === cred.domainId)?.serverIp}
                                  domainName={cred.domainName}
                                  ftpHosts={cred.ftpHosts}
                                  port={cred.port ?? 21}
                                  encryption={cred.encryption || 'plain'}
                                  username={cred.username}
                                  password={secret || undefined}
                                  passwordMasked={cred.secretMasked}
                                  onNeedPassword={async () => revealCredential(cred.id)}
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          );
        })()}
      </DetailModal>

      <ConfirmDialog
        isOpen={!!confirmAction}
        title={confirmCopy.title}
        description={confirmCopy.description}
        confirmText={confirmCopy.confirmText}
        cancelText="Cancelar"
        isDestructive={confirmCopy.isDestructive}
        onConfirm={() => {
          void runConfirmedAction();
        }}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
}
