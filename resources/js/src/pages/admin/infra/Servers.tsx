import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Server, Activity, Shield, Cpu, Key, Pencil, Trash2, Mail, AppWindow } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Can } from '../../../components/Can';
import { apiGet, apiMutate, getCached } from '../../../lib/api';
import { Field, FormModal, inputClass } from '../../../components/ui/FormModal';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { DetailModal, DetailGrid, DetailItem } from '../../../components/ui/DetailModal';
import { HostingProcessNav } from '../../../components/HostingProcessNav';
import { ProviderSelect } from '../../../components/ProviderSelect';
import { resolveCpanelUrl, resolveWebmailUrl } from '../../../lib/hostingLinks';

type FilterTab = 'Todos' | 'VPS Producción' | 'Servidores cPanel' | 'Bases de Datos' | 'Staging/Dev' | 'Producción';

interface ServerInstance {
  id: string;
  name: string;
  ip: string;
  provider: string;
  location: string;
  category: string;
  ramUsage: number;
  ramLabel: string;
  diskUsage: number;
  diskLabel: string;
  hostedProjects: string;
  sslStatus: string;
  nodeStatus: 'Online' | 'Offline' | 'Mantenimiento' | string;
  panelUrl?: string;
  webmailUrl?: string;
}

const emptyServer = {
  name: '',
  ip: '',
  provider: '',
  location: '',
  category: 'Servidores cPanel',
  ramUsage: '0',
  ramLabel: '',
  diskUsage: '0',
  diskLabel: '',
  hostedProjects: '',
  sslStatus: 'Válido',
  nodeStatus: 'Online',
  panelUrl: '',
  webmailUrl: '',
};

const actionBtn = 'w-7 h-7 rounded-lg flex items-center justify-center border transition-colors shrink-0';

export default function Servers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('Todos');
  const [servers, setServers] = useState<ServerInstance[]>(() => getCached<ServerInstance[]>('/api/servers') ?? []);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(emptyServer);
  const [pendingDelete, setPendingDelete] = useState<ServerInstance | null>(null);
  const [detailServer, setDetailServer] = useState<ServerInstance | null>(null);

  const loadServers = () => {
    apiGet<ServerInstance[]>('/api/servers')
      .then(setServers)
      .catch(() => setServers([]));
  };

  useEffect(() => {
    loadServers();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyServer);
    setModalOpen(true);
  };

  const openEdit = (server: ServerInstance) => {
    setEditingId(server.id);
    setForm({
      name: server.name,
      ip: server.ip || '',
      provider: server.provider || '',
      location: server.location || '',
      category: server.category || 'Servidores cPanel',
      ramUsage: String(server.ramUsage ?? 0),
      ramLabel: server.ramLabel || '',
      diskUsage: String(server.diskUsage ?? 0),
      diskLabel: server.diskLabel || '',
      hostedProjects: server.hostedProjects || '',
      sslStatus: server.sslStatus || 'Válido',
      nodeStatus: server.nodeStatus || 'Online',
      panelUrl: server.panelUrl || '',
      webmailUrl: server.webmailUrl || '',
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setForm(emptyServer);
  };

  const saveServer = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        ramUsage: Number(form.ramUsage),
        diskUsage: Number(form.diskUsage),
      };
      if (editingId) {
        await apiMutate('put', `/api/servers/${editingId}`, payload);
      } else {
        await apiMutate('post', '/api/servers', payload);
      }
      closeModal();
      loadServers();
    } finally {
      setSubmitting(false);
    }
  };

  const deleteServer = async (server: ServerInstance) => {
    await apiMutate('delete', `/api/servers/${server.id}`);
    loadServers();
  };

  const filteredServers = servers.filter((server) => {
    const matchesSearch =
      server.name.toLowerCase().includes(searchTerm.toLowerCase())
      || (server.ip || '').includes(searchTerm)
      || (server.provider || '').toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (activeTab !== 'Todos' && server.category !== activeTab) return false;
    return true;
  });

  const onlineCount = servers.filter((s) => s.nodeStatus === 'Online').length;
  const avgRam = servers.length
    ? Math.round(servers.reduce((sum, s) => sum + (s.ramUsage || 0), 0) / servers.length)
    : 0;
  const sslOk = servers.filter((s) => (s.sslStatus || '').toLowerCase().includes('v')).length;

  const getNodeStatusBadge = (status: ServerInstance['nodeStatus']) => {
    switch (status) {
      case 'Online':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'Offline':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'Mantenimiento':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      default:
        return 'bg-slate-500/10 text-sa-muted border-slate-500/20';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-extrabold text-sa-text tracking-tight">Servidores & Hosting</h1>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Can ability="servers.manage">
            <Link
              to="/admin/infra/hosting-wizard">
              Registrar hosting
            </Link>
          </Can>
          <Can ability="servers.manage">
            <button type="button" onClick={openCreate} className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/20"><Plus className="h-4 w-4 mr-2" />
              Solo servidor
            </button>
          </Can>
        </div>
      </div>

      <HostingProcessNav current="servers" />

      <FormModal open={modalOpen} title={editingId ? 'Editar Servidor' : 'Registrar Servidor'} onClose={closeModal} onSubmit={saveServer} submitting={submitting} submitLabel="Guardar" wide>
        <p className="text-xs text-sa-faint -mt-1 mb-1">
          Las contraseñas van en la Bóveda. cPanel/Webmail se abren desde los botones de la tabla.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Nombre" hint="Cuenta/plan/IP">
            <input required className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="ej: PlanetaHosting · Profesional_CP · 201.x.x.x" />
          </Field>
          <Field label="IP del servidor">
            <input className={inputClass} value={form.ip} onChange={(e) => setForm({ ...form, ip: e.target.value })} placeholder="ej: 201.148.104.76" />
          </Field>
          <Field label="Proveedor" hint="Catálogo reutilizable">
            <ProviderSelect
              value={form.provider}
              onChange={(name) => setForm({ ...form, provider: name })}
            />
          </Field>
          <Field label="Ubicación">
            <input className={inputClass} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="ej: Lima, PE" />
          </Field>
          <Field label="Categoría">
            <select className={inputClass} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              <option>Servidores cPanel</option>
              <option>VPS Producción</option>
              <option>Producción</option>
              <option>Bases de Datos</option>
              <option>Staging/Dev</option>
            </select>
          </Field>
          <Field label="Plan / proyectos alojados">
            <input className={inputClass} value={form.hostedProjects} onChange={(e) => setForm({ ...form, hostedProjects: e.target.value })} placeholder="ej: Profesional_CP" />
          </Field>
        </div>

        <div className="rounded-xl border border-sa-border bg-sa-canvas/40 p-4 space-y-3 mt-2">
          <div>
            <p className="text-sm font-bold text-sa-text">Accesos panel (opcionales)</p>
            <p className="text-[11px] text-sa-faint mt-0.5">
              URLs para los botones cPanel / Webmail de la tabla. Si Webmail queda vacío, se deduce del cPanel o del dominio/IP.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="URL cPanel">
              <input className={inputClass} value={form.panelUrl} onChange={(e) => setForm({ ...form, panelUrl: e.target.value })} placeholder="ej: http://dominio.com/cpanel" />
            </Field>
            <Field label="URL Webmail" hint="Opcional">
              <input className={inputClass} value={form.webmailUrl} onChange={(e) => setForm({ ...form, webmailUrl: e.target.value })} placeholder="ej: http://dominio.com/webmail" />
            </Field>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
          <Field label="Estado nodo">
            <select className={inputClass} value={form.nodeStatus} onChange={(e) => setForm({ ...form, nodeStatus: e.target.value })}>
              <option>Online</option><option>Offline</option><option>Mantenimiento</option>
            </select>
          </Field>
          <Field label="SSL">
            <select className={inputClass} value={form.sslStatus} onChange={(e) => setForm({ ...form, sslStatus: e.target.value })}>
              <option>Válido</option>
              <option>Por renovar</option>
              <option>Sin SSL</option>
            </select>
          </Field>
          <Field label="RAM %">
            <input type="number" min="0" max="100" className={inputClass} value={form.ramUsage} onChange={(e) => setForm({ ...form, ramUsage: e.target.value })} />
          </Field>
          <Field label="Disco %">
            <input type="number" min="0" max="100" className={inputClass} value={form.diskUsage} onChange={(e) => setForm({ ...form, diskUsage: e.target.value })} />
          </Field>
        </div>
      </FormModal>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-sa-panel border border-sa-border rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500"><Activity className="h-6 w-6" /></div>
          <div>
            <p className="text-[11px] font-bold text-sa-faint uppercase tracking-wider mb-1">Online</p>
            <h3 className="text-2xl font-extrabold text-sa-text">{onlineCount} <span className="text-sm font-medium text-sa-faint">/ {servers.length}</span></h3>
          </div>
        </div>
        <div className="bg-sa-panel border border-sa-border rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500"><Server className="h-6 w-6" /></div>
          <div>
            <p className="text-[11px] font-bold text-sa-faint uppercase tracking-wider mb-1">Servidores</p>
            <h3 className="text-2xl font-extrabold text-sa-text">{servers.length}</h3>
          </div>
        </div>
        <div className="bg-sa-panel border border-sa-border rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500"><Cpu className="h-6 w-6" /></div>
          <div>
            <p className="text-[11px] font-bold text-sa-faint uppercase tracking-wider mb-1">RAM promedio</p>
            <h3 className="text-2xl font-extrabold text-sa-text">{avgRam}%</h3>
          </div>
        </div>
        <div className="bg-sa-panel border border-sa-border rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500"><Shield className="h-6 w-6" /></div>
          <div>
            <p className="text-[11px] font-bold text-sa-faint uppercase tracking-wider mb-1">Con SSL</p>
            <h3 className="text-2xl font-extrabold text-sa-text">{sslOk}</h3>
          </div>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="flex items-center gap-1 bg-sa-panel border border-sa-border rounded-xl p-1 overflow-x-auto custom-scrollbar w-full xl:w-auto">
          {(['Todos', 'VPS Producción', 'Servidores cPanel', 'Bases de Datos', 'Staging/Dev'] as FilterTab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap',
                activeTab === tab ? 'bg-sa-border text-sa-text shadow-sm' : 'text-sa-faint hover:text-sa-muted hover:bg-sa-border/50',
              )}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="relative w-full xl:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-sa-faint" />
          <input
            type="text"
            placeholder="Buscar por IP, nombre o proveedor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-3 py-2.5 bg-sa-input border border-sa-border rounded-xl text-sa-text text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder-sa-faint"/>
        </div>
      </div>

      <div className="bg-sa-panel border border-sa-border rounded-2xl shadow-sm overflow-hidden">
        {filteredServers.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <EmptyState icon={Server} title="No hay servidores" description="No se encontraron servidores que coincidan con los filtros actuales." />
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-sm min-w-[960px]">
              <thead className="bg-sa-canvas/80 text-sa-faint font-semibold border-b border-sa-border">
                <tr>
                  <th className="px-4 py-2.5 uppercase tracking-wider text-[10px]">Servidor / IP</th>
                  <th className="px-4 py-2.5 uppercase tracking-wider text-[10px]">Proveedor</th>
                  <th className="px-4 py-2.5 uppercase tracking-wider text-[10px]">Plan</th>
                  <th className="px-4 py-2.5 uppercase tracking-wider text-[10px]">Estado</th>
                  <th className="px-4 py-2.5 uppercase tracking-wider text-[10px] text-right sticky right-0 bg-sa-canvas/95 z-10 min-w-[180px]">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E293B]">
                {filteredServers.map((server) => {
                  const cpanel = resolveCpanelUrl({ panelUrl: server.panelUrl, ip: server.ip });
                  const webmail = resolveWebmailUrl({ webmailUrl: server.webmailUrl, panelUrl: server.panelUrl, ip: server.ip });
                  return (
                    <tr
                      key={server.id}
                      onClick={() => setDetailServer(server)}
                      className="hover:bg-sa-border/40 transition-colors group cursor-pointer"
                    >
                      <td className="px-4 py-2">
                        <div className="font-semibold text-sa-text text-[13px] leading-tight truncate max-w-[280px]" title={server.name}>{server.name}</div>
                        <div className="text-sa-faint text-[11px] leading-tight">{server.ip || 'Sin IP'}</div>
                      </td>
                      <td className="px-4 py-2">
                        <div className="text-sa-text text-[12px] leading-tight">{server.provider || '—'}</div>
                      </td>
                      <td className="px-4 py-2">
                        <div className="text-sa-muted text-[12px] max-w-[200px] truncate leading-tight" title={server.hostedProjects}>{server.hostedProjects || '—'}</div>
                      </td>
                      <td className="px-4 py-2">
                        <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border', getNodeStatusBadge(server.nodeStatus))}>
                          {server.nodeStatus}
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
                            <span className={cn(actionBtn, 'bg-sa-border/40 text-[#475569] border-sa-border cursor-not-allowed')} title="Sin URL cPanel"><AppWindow className="h-3.5 w-3.5" /></span>
                          )}
                          {webmail ? (
                            <a href={webmail} target="_blank" rel="noopener noreferrer" className={cn(actionBtn, 'bg-sky-500/10 text-sky-300 border-sky-500/25 hover:bg-sky-500/20')} title="Abrir Webmail">
                              <Mail className="h-3.5 w-3.5" />
                            </a>
                          ) : (
                            <span className={cn(actionBtn, 'bg-sa-border/40 text-[#475569] border-sa-border cursor-not-allowed')} title="Sin URL webmail"><Mail className="h-3.5 w-3.5" /></span>
                          )}
                          <Link to="/admin/infra/credentials" className={cn(actionBtn, 'bg-sa-border text-sa-muted border-sa-border-strong hover:text-sa-text hover:bg-sa-border-strong')} title="Ir a Bóveda">
                            <Key className="h-3.5 w-3.5" />
                          </Link>
                          <Can ability="servers.manage">
                            <button type="button" onClick={() => openEdit(server)} className={cn(actionBtn, 'bg-blue-500/10 text-blue-300 border-blue-500/25 hover:bg-blue-500/20')} title="Editar">
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button type="button" onClick={() => setPendingDelete(server)} className={cn(actionBtn, 'bg-red-500/10 text-red-300 border-red-500/25 hover:bg-red-500/20')} title="Eliminar">
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
        open={!!detailServer}
        title={detailServer?.name || 'Servidor'}
        subtitle={detailServer?.ip ? `IP ${detailServer.ip}` : undefined}
        onClose={() => setDetailServer(null)}
        wide
        footer={detailServer && (
          <>
            {(() => {
              const cpanel = resolveCpanelUrl({ panelUrl: detailServer.panelUrl, ip: detailServer.ip });
              const webmail = resolveWebmailUrl({ webmailUrl: detailServer.webmailUrl, panelUrl: detailServer.panelUrl, ip: detailServer.ip });
              return (
                <>
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
                  <Link to="/admin/infra/credentials" className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-violet-500/15 text-violet-300 border border-violet-500/25 hover:bg-violet-500/25 transition-colors">
                    Bóveda
                  </Link>
                  <Can ability="servers.manage">
                    <button
                      type="button"
                      onClick={() => { const s = detailServer; setDetailServer(null); openEdit(s); }} className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors">
                      Editar
                    </button>
                  </Can>
                  <button type="button" onClick={() => setDetailServer(null)} className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-semibold text-sa-muted hover:text-sa-text hover:bg-sa-border/60 transition-colors">Cerrar</button>
                </>
              );
            })()}
          </>
        )}
      >
        {detailServer && (
          <DetailGrid>
            <DetailItem label="Proveedor" value={detailServer.provider} />
            <DetailItem label="Ubicación" value={detailServer.location} />
            <DetailItem label="Categoría" value={detailServer.category} />
            <DetailItem label="Estado" value={detailServer.nodeStatus} />
            <DetailItem label="Plan / proyectos" value={detailServer.hostedProjects} full />
            <DetailItem label="RAM" value={`${detailServer.ramUsage}%${detailServer.ramLabel ? ` · ${detailServer.ramLabel}` : ''}`} />
            <DetailItem label="Disco" value={`${detailServer.diskUsage}%${detailServer.diskLabel ? ` · ${detailServer.diskLabel}` : ''}`} />
            <DetailItem label="SSL" value={detailServer.sslStatus} />
            <DetailItem label="IP" value={detailServer.ip} mono />
            <DetailItem label="URL cPanel" value={detailServer.panelUrl} mono full />
            <DetailItem label="URL Webmail" value={detailServer.webmailUrl} mono full />
          </DetailGrid>
        )}
      </DetailModal>

      <ConfirmDialog
        isOpen={!!pendingDelete}
        title="Eliminar servidor"
        description={`¿Eliminar "${pendingDelete?.name}"? Los dominios vinculados quedarán sin servidor.`}
        confirmText="Sí, eliminar"
        onConfirm={() => { if (pendingDelete) void deleteServer(pendingDelete); }}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
