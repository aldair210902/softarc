import React, { useEffect, useState } from 'react';
import { 
  Plus, Search, Lock, Key, ShieldCheck, Copy, Eye, EyeOff, 
  Database, Terminal, Globe, Code, Edit2, MoreVertical, ShieldAlert, Mail
} from 'lucide-react';
import { useCompanySettings } from '../../../hooks/useCompanySettings';
import { cn } from '../../../lib/utils';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Can } from '../../../components/Can';
import { apiGet, apiMutate, getCached } from '../../../lib/api';
import { Field, FormModal, inputClass } from '../../../components/ui/FormModal';
import { DetailModal, DetailGrid, DetailItem } from '../../../components/ui/DetailModal';
import { HostingProcessNav } from '../../../components/HostingProcessNav';
import { FileZillaCopyBlock } from '../../../components/FileZillaCopyBlock';

type FilterTab = 'Todos' | 'Servidores & SSH' | 'Bases de Datos' | 'APIs & Tokens' | 'cPanel / Hosting' | 'Webmail';

interface Credential {
  id: string;
  name: string;
  clientId?: string;
  clientName?: string;
  domainId?: string;
  domainName?: string;
  serverIp?: string;
  clientOrServer: string;
  port?: number | null;
  encryption?: string;
  isFtp?: boolean;
  ftpHosts?: string[];
  username: string;
  secret: string | null;
  secretMasked?: string | null;
  canReveal?: boolean;
  category: string;
  lastModified: string;
}

type ClientOption = { id: string; businessName: string };
type DomainOption = { id: string; domainName: string; clientId?: string; client?: string };

const emptyCredential = {
  name: '',
  clientId: '',
  domainId: '',
  clientOrServer: '',
  port: '21',
  encryption: 'plain',
  username: '',
  secret: '',
  category: 'cPanel / Hosting',
};

export default function Credentials() {
  const { settings } = useCompanySettings();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('Todos');
  const [visibleSecrets, setVisibleSecrets] = useState<Record<string, boolean>>({});
  const [credentials, setCredentials] = useState<Credential[]>(() => getCached<Credential[]>('/api/credentials') ?? []);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [domains, setDomains] = useState<DomainOption[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(emptyCredential);
  const [detailCredential, setDetailCredential] = useState<Credential | null>(null);
  const [revealedSecrets, setRevealedSecrets] = useState<Record<string, string>>({});
  const [showFormSecret, setShowFormSecret] = useState(false);

  const loadCredentials = () => {
    apiGet<Credential[]>('/api/credentials', { fresh: true })
      .then(setCredentials)
      .catch(() => setCredentials((prev) => prev));
  };

  useEffect(() => {
    loadCredentials();
    apiGet<ClientOption[]>('/api/clients')
      .then((items) => setClients(items.map((c) => ({ id: c.id, businessName: c.businessName }))))
      .catch(() => setClients([]));
    apiGet<DomainOption[]>('/api/domains')
      .then((items) => setDomains(items.map((d) => ({
        id: d.id,
        domainName: d.domainName,
        clientId: d.clientId || '',
        client: d.client,
      }))))
      .catch(() => setDomains([]));
  }, []);

  const domainsForForm = form.clientId
    ? domains.filter((d) => !d.clientId || d.clientId === form.clientId)
    : domains;

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyCredential);
    setShowFormSecret(false);
    setModalOpen(true);
  };

  const openEdit = (credential: Credential) => {
    setEditingId(credential.id);
    setForm({
      name: credential.name,
      clientId: credential.clientId || '',
      domainId: credential.domainId || '',
      clientOrServer: credential.clientOrServer || '',
      port: credential.port ? String(credential.port) : '21',
      encryption: credential.encryption || 'plain',
      username: credential.username || '',
      secret: '',
      category: credential.category || 'Servidores & SSH',
    });
    setShowFormSecret(false);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setForm(emptyCredential);
    setShowFormSecret(false);
  };

  const saveCredential = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload: Record<string, string | number | null> = {
        name: form.name,
        clientId: form.clientId || null,
        domainId: form.domainId || null,
        clientOrServer: form.clientOrServer,
        port: form.port ? Number(form.port) : null,
        encryption: form.encryption || null,
        username: form.username,
        category: form.category,
      };
      let saved: Credential | null = null;
      if (editingId) {
        if (form.secret) payload.secret = form.secret;
        saved = await apiMutate<Credential>('put', `/api/credentials/${editingId}`, payload);
        // La password revelada anterior ya no vale.
        setRevealedSecrets((prev) => {
          const next = { ...prev };
          delete next[editingId];
          return next;
        });
        setVisibleSecrets((prev) => {
          const next = { ...prev };
          delete next[editingId];
          return next;
        });
      } else {
        saved = await apiMutate<Credential>('post', '/api/credentials', { ...payload, secret: form.secret });
      }

      if (saved?.id) {
        setCredentials((prev) => {
          const idx = prev.findIndex((c) => c.id === saved!.id);
          if (idx === -1) return [saved!, ...prev];
          const next = [...prev];
          next[idx] = { ...prev[idx], ...saved!, secret: null };
          return next;
        });
        setDetailCredential((prev) => (prev?.id === saved!.id ? { ...prev, ...saved!, secret: null } : prev));
      }

      closeModal();
      await apiGet<Credential[]>('/api/credentials', { fresh: true }).then(setCredentials);
    } finally {
      setSubmitting(false);
    }
  };

  const deleteCredential = async (credential: Credential) => {
    if (!window.confirm(`¿Eliminar la credencial "${credential.name}"?`)) return;
    await apiMutate('delete', `/api/credentials/${credential.id}`);
    loadCredentials();
  };

  const toggleSecretVisibility = async (id: string) => {
    if (visibleSecrets[id]) {
      setVisibleSecrets((prev) => ({ ...prev, [id]: false }));
      return;
    }
    if (!revealedSecrets[id]) {
      try {
        const res = await apiGet<{ id: string; secret: string }>(`/api/credentials/${id}/reveal`, { fresh: true });
        setRevealedSecrets((prev) => ({ ...prev, [id]: res.secret }));
      } catch {
        return;
      }
    }
    setVisibleSecrets((prev) => ({ ...prev, [id]: true }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // Metrics
  const totalCredentials = credentials.length;
  const apiTokensCount = credentials.filter(c => c.category === 'APIs & Tokens').length;

  const counts = {
    'Todos': totalCredentials,
    'Servidores & SSH': credentials.filter(c => c.category === 'Servidores & SSH').length,
    'Bases de Datos': credentials.filter(c => c.category === 'Bases de Datos').length,
    'APIs & Tokens': credentials.filter(c => c.category === 'APIs & Tokens').length,
    'cPanel / Hosting': credentials.filter(c => c.category === 'cPanel / Hosting').length,
    'Webmail': credentials.filter(c => c.category === 'Webmail').length,
  };

  // Filtering
  const filteredCredentials = credentials.filter(credential => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      credential.name.toLowerCase().includes(q) ||
      (credential.clientOrServer || '').toLowerCase().includes(q) ||
      (credential.username || '').toLowerCase().includes(q) ||
      (credential.clientName || '').toLowerCase().includes(q) ||
      (credential.domainName || '').toLowerCase().includes(q);
    
    if (!matchesSearch) return false;

    // Tab filter
    if (activeTab !== 'Todos' && credential.category !== activeTab) return false;

    return true;
  });

  const getCategoryBadge = (category: Credential['category']) => {
    switch (category) {
      case 'Bases de Datos':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'Servidores & SSH':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'APIs & Tokens':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'cPanel / Hosting':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'Webmail':
        return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
    }
  };

  const getCategoryIcon = (category: Credential['category']) => {
    switch (category) {
      case 'Bases de Datos': return <Database className="h-3 w-3 mr-1" />;
      case 'Servidores & SSH': return <Terminal className="h-3 w-3 mr-1" />;
      case 'APIs & Tokens': return <Code className="h-3 w-3 mr-1" />;
      case 'cPanel / Hosting': return <Globe className="h-3 w-3 mr-1" />;
      case 'Webmail': return <Mail className="h-3 w-3 mr-1" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Security Alert */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-start sm:items-center gap-3">
        <div className="p-1.5 bg-amber-500/20 rounded-lg text-amber-400 shrink-0">
          <Lock className="h-4 w-4" />
        </div>
        <p className="text-sm text-amber-200/80 font-medium">
          <span className="text-amber-400 font-bold">Bóveda Segura:</span> Los datos se almacenan cifrados de extremo a extremo usando AES-256. Solo los administradores autorizados pueden descifrar esta información.
        </p>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-extrabold text-sa-text tracking-tight">Bóveda de Credenciales</h1>
        <Can ability="credentials.manage">
          <button type="button" onClick={openCreate} className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/20"><Plus className="h-4 w-4 mr-2" />
            Nueva Credencial
          </button>
        </Can>
      </div>

      <HostingProcessNav current="credentials" />

      <FormModal open={modalOpen} title={editingId ? 'Editar Credencial' : 'Nueva Credencial'} onClose={closeModal} onSubmit={saveCredential} submitting={submitting} submitLabel="Guardar">
        <p className="text-xs text-sa-faint -mt-1">
          Vincula la credencial a un cliente y dominio para verla en el detalle del cliente. El host/URL sigue siendo el enlace de acceso.
        </p>
        <Field label="Categoría">
          <select className={inputClass} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            <option>cPanel / Hosting</option>
            <option>Webmail</option>
            <option>Servidores & SSH</option>
            <option>Bases de Datos</option>
            <option>APIs & Tokens</option>
          </select>
        </Field>
        <Field
          label="Nombre"
          hint={
            form.category === 'cPanel / Hosting' || form.category === 'Webmail'
              ? 'Qué acceso es: cPanel, FTP, Webmail…'
              : 'Nombre corto para identificarla'
          }
        >
          <input
            required
            className={inputClass}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder={
              form.category === 'Webmail'
                ? 'ej: Webmail info@dominio.com'
                : form.category === 'cPanel / Hosting'
                  ? 'ej: cPanel variashopfl.com'
                  : form.category === 'Bases de Datos'
                    ? 'ej: MySQL producción'
                    : 'ej: SSH VPS principal'
            }
          />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Cliente" hint="Opcional, para el hub del cliente">
            <select
              className={inputClass}
              value={form.clientId}
              onChange={(e) => {
                const clientId = e.target.value;
                const domainStillValid = !form.domainId || domains.some((d) => d.id === form.domainId && (!clientId || !d.clientId || d.clientId === clientId));
                setForm({
                  ...form,
                  clientId,
                  domainId: domainStillValid ? form.domainId : '',
                });
              }}
            >
              <option value="">Sin cliente</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.businessName}</option>
              ))}
            </select>
          </Field>
          <Field label="Dominio" hint="Al elegir dominio se hereda el cliente">
            <select
              className={inputClass}
              value={form.domainId}
              onChange={(e) => {
                const domainId = e.target.value;
                const selected = domains.find((d) => d.id === domainId);
                setForm({
                  ...form,
                  domainId,
                  clientId: selected?.clientId || form.clientId,
                  clientOrServer: form.clientOrServer || selected?.domainName || '',
                });
              }}
            >
              <option value="">Sin dominio</option>
              {domainsForForm.map((d) => (
                <option key={d.id} value={d.id}>{d.domainName}</option>
              ))}
            </select>
          </Field>
        </div>
        <Field
          label="Host / URL de acceso"
          hint={
            form.category === 'Webmail'
              ? 'URL webmail o dominio del correo'
              : form.name.toLowerCase().includes('ftp') || form.clientOrServer.toLowerCase().includes('ftp')
                ? 'IP del servidor o ftp.dominio.com (sin puerto)'
                : form.category === 'cPanel / Hosting'
                  ? 'URL del panel, host FTP o IP'
                  : 'Host, IP o URL del acceso'
          }
        >
          <input
            className={inputClass}
            value={form.clientOrServer}
            onChange={(e) => setForm({ ...form, clientOrServer: e.target.value })}
            placeholder={
              form.category === 'Webmail'
                ? 'ej: http://dominio.com/webmail'
                : form.name.toLowerCase().includes('ftp')
                  ? 'ej: 201.148.104.76 o ftp.variashopfl.com'
                  : form.category === 'cPanel / Hosting'
                    ? 'ej: http://dominio.com/cpanel · IP · ftp.dominio.com'
                    : 'ej: 190.12.x.x · ssh.ejemplo.com'
            }
          />
        </Field>
        {(form.name.toLowerCase().includes('ftp') || form.clientOrServer.toLowerCase().includes('ftp') || form.category === 'cPanel / Hosting') && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Puerto" hint="FTP suele ser 21">
              <input
                className={inputClass}
                value={form.port}
                onChange={(e) => setForm({ ...form, port: e.target.value })}
                placeholder="21"
                inputMode="numeric"
              />
            </Field>
            <Field label="Cifrado (FileZilla)" hint="Para hosting compartido suele ser inseguro/plano">
              <select
                className={inputClass}
                value={form.encryption}
                onChange={(e) => setForm({ ...form, encryption: e.target.value })}
              >
                <option value="plain">Ninguno o inseguro (FTP plano)</option>
                <option value="explicit">FTP explícito sobre TLS</option>
                <option value="implicit">FTP implícito sobre TLS</option>
              </select>
            </Field>
          </div>
        )}
        <Field label="Usuario" hint={form.category === 'Webmail' ? 'Correo completo o usuario' : 'Usuario del panel, FTP o sistema'}>
          <input
            className={inputClass}
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            placeholder={form.category === 'Webmail' ? 'ej: info@dominio.com' : 'ej: variasho'}
          />
        </Field>
        <Field label={editingId ? 'Nuevo secreto (opcional)' : 'Secreto / Contraseña'} hint={form.category === 'Webmail' ? 'Password del correo' : 'La password del acceso'}>
          <div className="relative">
            <input
              required={!editingId}
              type={showFormSecret ? 'text' : 'password'}
              className={cn(inputClass, 'pr-11')}
              value={form.secret}
              onChange={(e) => setForm({ ...form, secret: e.target.value })}
              placeholder="••••••••"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowFormSecret((v) => !v)} title={showFormSecret ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showFormSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </Field>
      </FormModal>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-sa-panel border border-sa-border rounded-2xl p-5 flex items-center gap-4 group hover:border-sa-border-strong transition-colors relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl -mr-6 -mt-6"></div>
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 relative z-10 group-hover:scale-110 transition-transform">
            <Key className="h-6 w-6" />
          </div>
          <div className="relative z-10">
            <p className="text-[11px] font-bold text-sa-faint uppercase tracking-wider mb-1">Accesos Almacenados</p>
            <h3 className="text-2xl font-extrabold text-sa-text">{totalCredentials} <span className="text-sm font-medium text-sa-faint normal-case">Credenciales</span></h3>
          </div>
        </div>

        <div className="bg-sa-panel border border-sa-border rounded-2xl p-5 flex items-center gap-4 group hover:border-sa-border-strong transition-colors relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl -mr-6 -mt-6"></div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 relative z-10 group-hover:scale-110 transition-transform">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div className="relative z-10">
            <p className="text-[11px] font-bold text-sa-faint uppercase tracking-wider mb-1">Estado de Cifrado</p>
            <div className="mt-1">
              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                <Lock className="h-3 w-3 mr-1" /> Cifrado AES-256
              </span>
            </div>
          </div>
        </div>

        <div className="bg-sa-panel border border-sa-border rounded-2xl p-5 flex items-center gap-4 group hover:border-sa-border-strong transition-colors relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl -mr-6 -mt-6"></div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 relative z-10 group-hover:scale-110 transition-transform">
            <Code className="h-6 w-6" />
          </div>
          <div className="relative z-10">
            <p className="text-[11px] font-bold text-sa-faint uppercase tracking-wider mb-1">Llaves API / Integraciones</p>
            <h3 className="text-2xl font-extrabold text-sa-text">{apiTokensCount} <span className="text-sm font-medium text-sa-faint normal-case">Tokens Activos</span></h3>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        {/* Tabs */}
        <div className="flex items-center gap-1 bg-sa-panel border border-sa-border rounded-xl p-1 overflow-x-auto custom-scrollbar w-full xl:w-auto">
          {(['Todos', 'Servidores & SSH', 'Bases de Datos', 'APIs & Tokens', 'cPanel / Hosting', 'Webmail'] as FilterTab[]).map(tab => {
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
            placeholder="Buscar credencial por cliente, servidor o servicio..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-3 py-2.5 bg-sa-input border border-sa-border rounded-xl text-sa-text text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder-sa-faint"/>
        </div>
      </div>

      {/* Table */}
      <div className="bg-sa-panel border border-sa-border rounded-2xl shadow-sm overflow-hidden">
        {filteredCredentials.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <EmptyState 
              icon={Key}
              title="No hay credenciales"
              description="No se encontraron credenciales que coincidan con los filtros actuales."
            />
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-sm min-w-[1000px]">
              <thead className="bg-sa-border/50 text-sa-faint font-semibold border-b border-sa-border sticky top-0 z-10 backdrop-blur-sm">
                <tr>
                  <th className="px-6 py-4 uppercase tracking-wider text-[11px]">Servicio / Nombre</th>
                  <th className="px-6 py-4 uppercase tracking-wider text-[11px]">Cliente / Dominio</th>
                  <th className="px-6 py-4 uppercase tracking-wider text-[11px]">Usuario</th>
                  <th className="px-6 py-4 uppercase tracking-wider text-[11px]">Contraseña / Secret</th>
                  <th className="px-6 py-4 uppercase tracking-wider text-[11px]">Categoría</th>
                  <th className="px-6 py-4 uppercase tracking-wider text-[11px]">Última Modificación</th>
                  <th className="px-6 py-4 uppercase tracking-wider text-[11px] text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E293B]">
                {filteredCredentials.map((cred) => {
                  const isVisible = visibleSecrets[cred.id];
                  const secretValue = revealedSecrets[cred.id] || '';

                  return (
                    <tr
                      key={cred.id}
                      onClick={() => setDetailCredential(cred)}
                      className="hover:bg-sa-border/50 transition-colors group cursor-pointer"
                    >
                      <td className="px-6 py-4">
                        <div className="font-bold text-sa-text text-[13px]">{cred.name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sa-muted text-[13px] max-w-[220px]">
                          <div >
                            {cred.clientName || 'Sin cliente'}
                          </div>
                          <div className="truncate text-[11px] text-sa-faint mt-0.5">
                            {cred.domainName || cred.clientOrServer || '—'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div title={cred.username}>
                          {cred.username}
                        </div>
                      </td>
                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          <div className="bg-sa-border px-2 py-1.5 rounded-lg flex items-center gap-3 border border-sa-border-strong min-w-[140px] max-w-[200px]">
                            <span className={cn("font-mono text-[13px] flex-1 truncate", isVisible && secretValue ? "text-sa-text" : "text-sa-faint tracking-widest")}>
                              {isVisible && secretValue ? secretValue : (cred.secretMasked || '••••••••••••')}
                            </span>
                            {cred.canReveal && (
                              <>
                                <button 
                                  type="button"
                                  onClick={() => void toggleSecretVisibility(cred.id)} title={isVisible ? "Ocultar" : "Mostrar"}
                                >
                                  {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                                <button 
                                  type="button"
                                  onClick={() => {
                                    void (async () => {
                                      let value = revealedSecrets[cred.id];
                                      if (!value) {
                                        try {
                                          const res = await apiGet<{ secret: string }>(`/api/credentials/${cred.id}/reveal`, { fresh: true });
                                          value = res.secret;
                                          setRevealedSecrets((prev) => ({ ...prev, [cred.id]: value }));
                                        } catch {
                                          return;
                                        }
                                      }
                                      copyToClipboard(value);
                                    })();
                                  }} title="Copiar al portapapeles"
                                >
                                  <Copy className="h-4 w-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "inline-flex items-center px-2 py-1 rounded text-[10px] font-bold border whitespace-nowrap",
                          getCategoryBadge(cred.category)
                        )}>
                          {getCategoryIcon(cred.category)}
                          {cred.category.replace(' & SSH', '').replace(' / Hosting', '')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sa-muted text-[12px]">{cred.lastModified}</div>
                      </td>
                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          {cred.canReveal && (
                            <button 
                              type="button"
                              onClick={() => {
                                void (async () => {
                                  let value = revealedSecrets[cred.id];
                                  if (!value) {
                                    try {
                                      const res = await apiGet<{ secret: string }>(`/api/credentials/${cred.id}/reveal`, { fresh: true });
                                      value = res.secret;
                                      setRevealedSecrets((prev) => ({ ...prev, [cred.id]: value }));
                                    } catch {
                                      return;
                                    }
                                  }
                                  copyToClipboard(value);
                                })();
                              }}
                              className="px-3 py-1.5 bg-blue-500/10 text-blue-400 text-xs font-semibold rounded-lg hover:bg-blue-500/20 transition-colors border border-blue-500/20 flex items-center gap-1.5 whitespace-nowrap"
                            >
                              <Copy className="h-3.5 w-3.5" /> Copiar Credencial
                            </button>
                          )}
                          <Can ability="credentials.manage">
                            <button 
                              type="button"
                              onClick={() => openEdit(cred)} title="Editar Credencial"
                             className="p-2 rounded-lg text-sa-faint hover:text-sa-text hover:bg-sa-border/60 transition-colors">
                              <Edit2 className="h-4 w-4" />
                            </button>
                          </Can>
                          <Can ability="credentials.manage">
                            <div className="relative group/menu">
                              <button type="button" className="p-2 rounded-lg text-sa-faint hover:text-sa-text hover:bg-sa-border/60 transition-colors"><MoreVertical className="h-4 w-4" />
                              </button>
                              <div className="absolute right-0 top-full mt-1 w-40 bg-sa-border border border-sa-border-strong rounded-lg shadow-xl opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-20">
                                <div className="py-1">
                                  <button type="button" onClick={() => openEdit(cred)} className="w-full text-left px-4 py-2 text-xs text-sa-muted hover:text-sa-text hover:bg-sa-border-strong transition-colors">Editar</button>
                                  <button type="button" onClick={() => deleteCredential(cred)} className="w-full text-left px-4 py-2 text-xs text-red-400 hover:bg-sa-border-strong transition-colors">Eliminar Credencial</button>
                                </div>
                              </div>
                            </div>
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
        open={!!detailCredential}
        title={detailCredential?.name || 'Credencial'}
        subtitle={detailCredential?.clientName || detailCredential?.domainName || detailCredential?.clientOrServer || undefined}
        onClose={() => setDetailCredential(null)}
        footer={detailCredential && (
          <>
            <Can ability="credentials.manage">
              <button
                type="button"
                onClick={() => { const c = detailCredential; setDetailCredential(null); openEdit(c); }} className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors">
                Editar
              </button>
            </Can>
            <button type="button" onClick={() => setDetailCredential(null)} className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-semibold text-sa-muted hover:text-sa-text hover:bg-sa-border/60 transition-colors">Cerrar</button>
          </>
        )}
      >
        {detailCredential && (
          <div className="space-y-3">
            <DetailGrid>
              <DetailItem label="Nombre" value={detailCredential.name} />
              <DetailItem label="Cliente" value={detailCredential.clientName || 'Sin cliente'} />
              <DetailItem label="Dominio" value={detailCredential.domainName || 'Sin dominio'} />
              <DetailItem label="Host / URL" value={detailCredential.clientOrServer} mono full />
              <DetailItem label="Usuario" value={detailCredential.username} mono />
              <DetailItem label="Categoría" value={detailCredential.category} />
              <DetailItem label="Última modificación" value={detailCredential.lastModified} />
              <DetailItem label="Secreto" value={detailCredential.secretMasked || '••••'} mono />
            </DetailGrid>
            {(detailCredential.isFtp || /ftp/i.test(`${detailCredential.name || ''} ${detailCredential.category || ''} ${detailCredential.clientOrServer || ''}`)) && (
              <FileZillaCopyBlock
                storedHost={detailCredential.clientOrServer}
                serverIp={detailCredential.serverIp}
                domainName={detailCredential.domainName}
                ftpHosts={detailCredential.ftpHosts}
                port={detailCredential.port ?? 21}
                encryption={detailCredential.encryption || 'plain'}
                username={detailCredential.username}
                password={revealedSecrets[detailCredential.id]}
                passwordMasked={detailCredential.secretMasked}
                onNeedPassword={async () => {
                  const id = detailCredential.id;
                  if (revealedSecrets[id]) return revealedSecrets[id];
                  try {
                    const res = await apiGet<{ secret: string }>(`/api/credentials/${id}/reveal`, { fresh: true });
                    setRevealedSecrets((prev) => ({ ...prev, [id]: res.secret }));
                    setVisibleSecrets((prev) => ({ ...prev, [id]: true }));
                    return res.secret;
                  } catch {
                    return null;
                  }
                }}
              />
            )}
          </div>
        )}
      </DetailModal>
    </div>
  );
}
