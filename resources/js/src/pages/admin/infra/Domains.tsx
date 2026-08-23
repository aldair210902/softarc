import React, { useEffect, useState } from 'react';
import { Plus, Search, Globe, AlertCircle, CloudLightning, ExternalLink, Pencil, Trash2, Mail, AppWindow } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Can } from '../../../components/Can';
import { apiGet, apiMutate, getCached } from '../../../lib/api';
import { Field, FormModal, inputClass } from '../../../components/ui/FormModal';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { DetailModal, DetailGrid, DetailItem } from '../../../components/ui/DetailModal';
import { HostingProcessNav } from '../../../components/HostingProcessNav';
import { ProviderSelect } from '../../../components/ProviderSelect';
import { Client } from '../../../types';
import { resolveCpanelUrl, resolveSiteUrl, resolveWebmailUrl } from '../../../lib/hostingLinks';

type FilterTab = 'Todos' | 'Propios / SaaS' | 'Clientes' | 'Por Vencer';

interface Domain {
  id: string;
  domainName: string;
  client: string;
  clientId?: string;
  provider: string;
  expiryDate: string;
  autoRenew: boolean;
  dnsZone: string;
  nameserver1: string;
  nameserver1Ip: string;
  nameserver2: string;
  nameserver2Ip: string;
  serverId?: string;
  serverName?: string;
  serverIp?: string;
  panelUrl?: string;
  webmailUrl?: string;
}

function calculateDaysRemaining(expiryDate?: string | null): number {
  if (!expiryDate) return 9999;
  const end = new Date(expiryDate);
  if (Number.isNaN(end.getTime())) return 9999;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  return Math.ceil((end.getTime() - today.getTime()) / 86400000);
}

function isInternalClient(client?: string | null): boolean {
  const value = (client || '').trim().toLowerCase();
  return value === '' || value === 'interno' || value === 'interno / propietario' || value.startsWith('interno');
}

const emptyDomain = {
  domainName: '',
  clientId: '',
  client: '',
  provider: '',
  expiryDate: new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
  autoRenew: true,
  dnsZone: '',
  nameserver1: '',
  nameserver1Ip: '',
  nameserver2: '',
  nameserver2Ip: '',
  serverId: '',
};

export default function Domains() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('Todos');
  const [domains, setDomains] = useState<Domain[]>(() => getCached<Domain[]>('/api/domains') ?? []);
  const [clients, setClients] = useState<Client[]>(() => getCached<Client[]>('/api/clients') ?? []);
  const [servers, setServers] = useState<{ id: string; name: string; ip?: string }[]>(
    () => getCached<{ id: string; name: string; ip?: string }[]>('/api/servers') ?? [],
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(emptyDomain);
  const [pendingDelete, setPendingDelete] = useState<Domain | null>(null);
  const [detailDomain, setDetailDomain] = useState<Domain | null>(null);

  const loadDomains = () => {
    apiGet<Domain[]>('/api/domains')
      .then(setDomains)
      .catch(() => setDomains([]));
  };

  useEffect(() => {
    loadDomains();
    apiGet<Client[]>('/api/clients').then(setClients).catch(() => setClients([]));
    apiGet<{ id: string; name: string; ip?: string }[]>('/api/servers').then(setServers).catch(() => setServers([]));
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyDomain);
    setModalOpen(true);
  };

  const openEdit = (domain: Domain) => {
    const matched = clients.find((c) => c.id === domain.clientId || c.businessName === domain.client);
    setEditingId(domain.id);
    setForm({
      domainName: domain.domainName,
      clientId: matched?.id || domain.clientId || '',
      client: domain.client || '',
      provider: domain.provider || '',
      expiryDate: domain.expiryDate?.slice(0, 10) || emptyDomain.expiryDate,
      autoRenew: !!domain.autoRenew,
      dnsZone: domain.dnsZone || '',
      nameserver1: domain.nameserver1 || '',
      nameserver1Ip: domain.nameserver1Ip || '',
      nameserver2: domain.nameserver2 || '',
      nameserver2Ip: domain.nameserver2Ip || '',
      serverId: domain.serverId || '',
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setForm(emptyDomain);
  };

  const saveDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const selected = clients.find((c) => c.id === form.clientId);
      const payload = {
        ...form,
        client: selected?.businessName || form.client || 'Interno / Propietario',
        clientId: form.clientId || null,
        serverId: form.serverId || null,
      };
      if (editingId) {
        await apiMutate('put', `/api/domains/${editingId}`, payload);
      } else {
        await apiMutate('post', '/api/domains', payload);
      }
      closeModal();
      loadDomains();
    } finally {
      setSubmitting(false);
    }
  };

  const deleteDomain = async (domain: Domain) => {
    await apiMutate('delete', `/api/domains/${domain.id}`);
    loadDomains();
  };
  const totalDomains = domains.length;
  const expiringSoonCount = domains.filter((d) => {
    const days = calculateDaysRemaining(d.expiryDate);
    return days < 30 && days >= 0;
  }).length;
  const ownDomainsCount = domains.filter((d) => isInternalClient(d.client)).length;
  const clientDomainsCount = domains.filter((d) => !isInternalClient(d.client)).length;

  const filteredDomains = domains.filter((domain) => {
    const name = (domain.domainName || '').toLowerCase();
    const client = (domain.client || '').toLowerCase();
    const q = searchTerm.toLowerCase();
    const matchesSearch = name.includes(q) || client.includes(q);

    if (!matchesSearch) return false;

    if (activeTab === 'Propios / SaaS' && !isInternalClient(domain.client)) return false;
    if (activeTab === 'Clientes' && isInternalClient(domain.client)) return false;
    if (activeTab === 'Por Vencer') {
      const days = calculateDaysRemaining(domain.expiryDate);
      if (days >= 30 || days < 0) return false;
    }

    return true;
  });

  const getExpiryColor = (daysRemaining: number) => {
    if (daysRemaining < 0) return 'text-red-500 bg-red-500/10 border-red-500/20';
    if (daysRemaining <= 7) return 'text-red-400 bg-red-500/10 border-red-500/20';
    if (daysRemaining <= 30) return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat('es-PE', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
  };

  const actionBtn = 'w-7 h-7 rounded-lg flex items-center justify-center border transition-colors shrink-0';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-extrabold text-sa-text tracking-tight">Dominios & DNS</h1>
        <Can ability="domains.manage">
          <button type="button" onClick={openCreate} className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/20"><Plus className="h-4 w-4 mr-2" />
            Registrar Dominio
          </button>
        </Can>
      </div>

      <HostingProcessNav current="domains" />

      <FormModal open={modalOpen} title={editingId ? 'Editar Dominio' : 'Registrar Dominio'} onClose={closeModal} onSubmit={saveDomain} submitting={submitting} submitLabel="Guardar" wide>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Dominio" hint="Sin https:// ni www">
            <input required className={inputClass} value={form.domainName} onChange={(e) => setForm({ ...form, domainName: e.target.value })} placeholder="ej: variashopfl.com" />
          </Field>
          <Field label="Cliente" hint="Si es tuyo y das subdominios, deja Interno">
            <select className={inputClass} value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })}>
              <option value="">Interno / Propietario</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.businessName}</option>)}
            </select>
          </Field>
          <Field label="Servidor / Hosting" hint="Cuenta donde vive este dominio · cPanel/Webmail salen de este servidor">
            <select className={inputClass} value={form.serverId} onChange={(e) => setForm({ ...form, serverId: e.target.value })}>
              <option value="">Sin vincular</option>
              {servers.map((s) => (
                <option key={s.id} value={s.id}>{s.name}{s.ip ? ` · ${s.ip}` : ''}</option>
              ))}
            </select>
          </Field>
          <Field label="Proveedor / Registrador" hint="Quién te vendió el dominio o hosting">
            <ProviderSelect
              value={form.provider}
              onChange={(name) => setForm({ ...form, provider: name })}
            />
          </Field>
          <Field label="Vencimiento" hint="Fecha de renovación del dominio">
            <input type="date" className={inputClass} value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} />
          </Field>
          <Field label="Panel DNS / Zona" hint="Cloudflare, cPanel Zone Editor, etc. (opcional)">
            <input className={inputClass} value={form.dnsZone} onChange={(e) => setForm({ ...form, dnsZone: e.target.value })} placeholder="ej: cPanel / PlanetaHosting" />
          </Field>
          <div className="flex items-end pb-1">
            <label className="flex items-center gap-2 text-sm text-sa-muted">
              <input type="checkbox" checked={form.autoRenew} onChange={(e) => setForm({ ...form, autoRenew: e.target.checked })} />
              Renovación automática
            </label>
          </div>
        </div>

        <div className="rounded-xl border border-sa-border bg-sa-canvas/40 p-4 space-y-3">
          <div>
            <p className="text-sm font-bold text-sa-text">Nameservers (DNS)</p>
            <p className="text-[11px] text-sa-faint mt-0.5">Los 2 DNS que te envía el proveedor (dns1 / dns2).</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="NS1 (hostname)">
              <input className={inputClass} value={form.nameserver1} onChange={(e) => setForm({ ...form, nameserver1: e.target.value })} placeholder="ej: dns1.planetahosting.pe" />
            </Field>
            <Field label="IP del NS1" hint="Opcional">
              <input className={inputClass} value={form.nameserver1Ip} onChange={(e) => setForm({ ...form, nameserver1Ip: e.target.value })} placeholder="ej: 201.148.107.40" />
            </Field>
            <Field label="NS2 (hostname)">
              <input className={inputClass} value={form.nameserver2} onChange={(e) => setForm({ ...form, nameserver2: e.target.value })} placeholder="ej: dns2.planetahosting.pe" />
            </Field>
            <Field label="IP del NS2" hint="Opcional">
              <input className={inputClass} value={form.nameserver2Ip} onChange={(e) => setForm({ ...form, nameserver2Ip: e.target.value })} placeholder="ej: 199.189.86.195" />
            </Field>
          </div>
        </div>
      </FormModal>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-sa-panel border border-sa-border rounded-2xl p-5 flex items-center gap-4 group hover:border-sa-border-strong transition-colors relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl -mr-6 -mt-6"></div>
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 relative z-10 group-hover:scale-110 transition-transform">
            <Globe className="h-6 w-6" />
          </div>
          <div className="relative z-10">
            <p className="text-[11px] font-bold text-sa-faint uppercase tracking-wider mb-1">Dominios Registrados</p>
            <h3 className="text-2xl font-extrabold text-sa-text">{totalDomains} <span className="text-sm font-medium text-sa-faint normal-case">Activos</span></h3>
          </div>
        </div>

        <div className="bg-sa-panel border border-sa-border rounded-2xl p-5 flex items-center gap-4 group hover:border-sa-border-strong transition-colors relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl -mr-6 -mt-6"></div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 relative z-10 group-hover:scale-110 transition-transform">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div className="relative z-10">
            <p className="text-[11px] font-bold text-sa-faint uppercase tracking-wider mb-1">Próximos Vencimientos</p>
            <h3 className="text-2xl font-extrabold text-sa-text">{expiringSoonCount} <span className="text-sm font-medium text-amber-400 normal-case">vencerán en {'<'}30 días</span></h3>
          </div>
        </div>

        <div className="bg-sa-panel border border-sa-border rounded-2xl p-5 flex items-center gap-4 group hover:border-sa-border-strong transition-colors relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl -mr-6 -mt-6"></div>
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500 relative z-10 group-hover:scale-110 transition-transform">
            <CloudLightning className="h-6 w-6" />
          </div>
          <div className="relative z-10">
            <p className="text-[11px] font-bold text-sa-faint uppercase tracking-wider mb-1">Zona DNS Gestionada</p>
            <h3 className="text-2xl font-extrabold text-sa-text">Cloudflare <span className="text-sm font-medium text-sa-faint normal-case">/ Directo</span></h3>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        {/* Tabs */}
        <div className="flex items-center gap-1 bg-sa-panel border border-sa-border rounded-xl p-1 overflow-x-auto custom-scrollbar w-full xl:w-auto">
          {(['Todos', 'Propios / SaaS', 'Clientes', 'Por Vencer'] as FilterTab[]).map(tab => {
            const count = tab === 'Todos' ? totalDomains 
                        : tab === 'Propios / SaaS' ? ownDomainsCount
                        : tab === 'Clientes' ? clientDomainsCount
                        : expiringSoonCount;
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
            placeholder="Buscar por dominio, TLD (.com/.pe) o cliente..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-3 py-2.5 bg-sa-input border border-sa-border rounded-xl text-sa-text text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder-sa-faint"/>
        </div>
      </div>

      {/* Table */}
      <div className="bg-sa-panel border border-sa-border rounded-2xl shadow-sm overflow-hidden">
        {filteredDomains.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <EmptyState 
              icon={Globe}
              title="No hay dominios"
              description="No se encontraron dominios que coincidan con los filtros actuales."
            />
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-sm min-w-[920px]">
              <thead className="bg-sa-canvas/80 text-sa-faint font-semibold border-b border-sa-border sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-2.5 uppercase tracking-wider text-[10px]">Dominio</th>
                  <th className="px-4 py-2.5 uppercase tracking-wider text-[10px]">Cliente</th>
                  <th className="px-4 py-2.5 uppercase tracking-wider text-[10px]">Proveedor</th>
                  <th className="px-4 py-2.5 uppercase tracking-wider text-[10px]">Vencimiento</th>
                  <th className="px-4 py-2.5 uppercase tracking-wider text-[10px]">Renovación</th>
                  <th className="px-4 py-2.5 uppercase tracking-wider text-[10px] text-right sticky right-0 bg-sa-canvas/95 z-10 min-w-[160px]">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E293B]">
                {filteredDomains.map((domain) => {
                  const daysRemaining = calculateDaysRemaining(domain.expiryDate);
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
                    <tr
                      key={domain.id}
                      onClick={() => setDetailDomain(domain)}
                      className="hover:bg-sa-border/40 transition-colors group cursor-pointer"
                    >
                      <td className="px-4 py-2">
                        <div className="font-semibold text-sa-text text-[13px] leading-tight">{domain.domainName}</div>
                        {domain.serverName && (
                          <div className="text-sa-faint text-[10px] leading-tight truncate max-w-[220px]" title={domain.serverName}>
                            {domain.serverName}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        <div className={cn('text-[12px] font-medium leading-tight', isInternalClient(domain.client) ? 'text-blue-400' : 'text-sa-text')}>
                          {isInternalClient(domain.client) ? 'Interno' : (domain.client || '—')}
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <div className="text-sa-text text-[12px] leading-tight">{domain.provider || '—'}</div>
                      </td>
                      <td className="px-4 py-2">
                        <div className="text-sa-text text-[12px] leading-tight">{formatDate(domain.expiryDate)}</div>
                        <span className={cn('inline-flex items-center px-1.5 py-0 rounded text-[9px] font-bold border whitespace-nowrap mt-0.5', getExpiryColor(daysRemaining))}>
                          {daysRemaining < 0 ? 'Vencido' : `${daysRemaining}d`}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <span className={cn(
                          'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border',
                          domain.autoRenew
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-red-500/10 text-red-400 border-red-500/20',
                        )}>
                          {domain.autoRenew ? 'Auto' : 'Manual'}
                        </span>
                      </td>
                      <td
                        className="px-4 py-2 sticky right-0 bg-sa-panel group-hover:bg-[#151c2c] z-10 border-l border-sa-border/80"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1">
                          {cpanel ? (
                            <a href={cpanel} target="_blank" rel="noopener noreferrer" className={cn(actionBtn, 'bg-orange-500/10 text-orange-300 border-orange-500/25 hover:bg-orange-500/20')} title="Abrir cPanel">
                              <AppWindow className="h-3.5 w-3.5" />
                            </a>
                          ) : (
                            <span className={cn(actionBtn, 'bg-sa-border/40 text-[#475569] border-sa-border cursor-not-allowed')} title="Sin cPanel"><AppWindow className="h-3.5 w-3.5" /></span>
                          )}
                          {webmail ? (
                            <a href={webmail} target="_blank" rel="noopener noreferrer" className={cn(actionBtn, 'bg-sky-500/10 text-sky-300 border-sky-500/25 hover:bg-sky-500/20')} title="Abrir Webmail">
                              <Mail className="h-3.5 w-3.5" />
                            </a>
                          ) : (
                            <span className={cn(actionBtn, 'bg-sa-border/40 text-[#475569] border-sa-border cursor-not-allowed')} title="Sin webmail"><Mail className="h-3.5 w-3.5" /></span>
                          )}
                          <Can ability="domains.manage">
                            <button type="button" onClick={() => openEdit(domain)} className={cn(actionBtn, 'bg-blue-500/10 text-blue-300 border-blue-500/25 hover:bg-blue-500/20')} title="Editar">
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button type="button" onClick={() => setPendingDelete(domain)} className={cn(actionBtn, 'bg-red-500/10 text-red-300 border-red-500/25 hover:bg-red-500/20')} title="Eliminar">
                              <Trash2 className="h-3.5 w-3.5" />
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
        open={!!detailDomain}
        title={detailDomain?.domainName || 'Dominio'}
        subtitle={detailDomain?.serverName ? `Hosting: ${detailDomain.serverName}` : undefined}
        onClose={() => setDetailDomain(null)}
        wide
        footer={detailDomain && (
          <>
            {(() => {
              const site = resolveSiteUrl(detailDomain.domainName);
              const cpanel = resolveCpanelUrl({
                panelUrl: detailDomain.panelUrl,
                domainName: detailDomain.domainName,
                ip: detailDomain.serverIp,
              });
              const webmail = resolveWebmailUrl({
                webmailUrl: detailDomain.webmailUrl,
                panelUrl: detailDomain.panelUrl,
                domainName: detailDomain.domainName,
                ip: detailDomain.serverIp,
              });
              return (
                <>
                  {site && (
                    <a href={site} target="_blank" rel="noopener noreferrer"  className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 hover:bg-emerald-500/25 transition-colors">
                      Sitio <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  {cpanel && (
                    <a href={cpanel} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-orange-500/15 text-orange-300 border border-orange-500/25 hover:bg-orange-500/25 transition-colors">
                      cPanel
                    </a>
                  )}
                  {webmail && (
                    <a href={webmail} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-sky-500/15 text-sky-300 border border-sky-500/25 hover:bg-sky-500/25 transition-colors">
                      Webmail
                    </a>
                  )}
                  <Can ability="domains.manage">
                    <button
                      type="button"
                      onClick={() => { const d = detailDomain; setDetailDomain(null); openEdit(d); }} className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors">
                      Editar
                    </button>
                  </Can>
                  <button type="button" onClick={() => setDetailDomain(null)} className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-semibold text-sa-muted hover:text-sa-text hover:bg-sa-border/60 transition-colors">Cerrar</button>
                </>
              );
            })()}
          </>
        )}
      >
        {detailDomain && (
          <DetailGrid>
            <DetailItem
              label="Cliente"
              value={isInternalClient(detailDomain.client) ? 'Interno / Propietario' : (detailDomain.client || '—')}
            />
            <DetailItem label="Proveedor" value={detailDomain.provider} />
            <DetailItem label="Servidor / Hosting" value={detailDomain.serverName} full />
            <DetailItem label="IP servidor" value={detailDomain.serverIp} mono />
            <DetailItem label="Vencimiento" value={formatDate(detailDomain.expiryDate)} />
            <DetailItem
              label="Días restantes"
              value={(() => {
                const days = calculateDaysRemaining(detailDomain.expiryDate);
                return days < 0 ? 'Vencido' : `${days} días`;
              })()}
            />
            <DetailItem label="Auto-renovación" value={detailDomain.autoRenew ? 'Sí' : 'No (manual)'} />
            <DetailItem label="Zona DNS" value={detailDomain.dnsZone} />
            <DetailItem
              label="NS1"
              value={detailDomain.nameserver1
                ? `${detailDomain.nameserver1}${detailDomain.nameserver1Ip ? ` · ${detailDomain.nameserver1Ip}` : ''}`
                : undefined}
              mono
              full
            />
            <DetailItem
              label="NS2"
              value={detailDomain.nameserver2
                ? `${detailDomain.nameserver2}${detailDomain.nameserver2Ip ? ` · ${detailDomain.nameserver2Ip}` : ''}`
                : undefined}
              mono
              full
            />
            <DetailItem label="URL cPanel" value={detailDomain.panelUrl} mono full />
            <DetailItem label="URL Webmail" value={detailDomain.webmailUrl} mono full />
          </DetailGrid>
        )}
      </DetailModal>

      <ConfirmDialog
        isOpen={!!pendingDelete}
        title="Eliminar dominio"
        description={`¿Eliminar el dominio "${pendingDelete?.domainName}"?`}
        confirmText="Sí, eliminar"
        onConfirm={() => { if (pendingDelete) void deleteDomain(pendingDelete); }}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}

