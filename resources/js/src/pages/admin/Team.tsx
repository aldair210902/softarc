import React, { useEffect, useState } from 'react';
import { Plus, Search, Users, UserCheck, Shield, Edit2, Key, MoreVertical, ShieldAlert, Eye, X, CheckCircle2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { EmptyState } from '../../components/ui/EmptyState';
import { Can } from '../../components/Can';
import { apiGet, apiMutate } from '../../lib/api';
import { Field, FormModal, inputClass } from '../../components/ui/FormModal';
import { DetailModal, DetailGrid, DetailItem } from '../../components/ui/DetailModal';

type FilterTab = 'Todos' | 'Administradores' | 'Soporte Técnico' | 'Comerciales';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  phone?: string;
  jobTitle?: string;
  role: string;
  permissions: string[];
  lastLogin: string;
  status: string;
}

const emptyMember = {
  name: '',
  email: '',
  password: '',
  phone: '',
  jobTitle: '',
  role: 'Soporte',
  status: 'Activo',
};

const MODULE_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  crm: 'CRM',
  clients: 'Clientes',
  projects: 'Proyectos',
  finances: 'Finanzas',
  catalog: 'Catálogo',
  servers: 'Servidores',
  domains: 'Dominios',
  credentials: 'Credenciales',
  tickets: 'Soporte',
  wiki: 'Wiki',
  team: 'Equipo',
  settings: 'Ajustes',
  audit: 'Auditoría',
  profile: 'Perfil',
};

const PERMISSION_DETAILS: Record<string, { title: string; description: string }> = {
  '*': {
    title: 'Acceso total',
    description: 'Puede entrar a todos los módulos del panel, gestionar equipo, ajustes, auditoría y revelar credenciales.',
  },
  all: {
    title: 'Acceso total',
    description: 'Puede entrar a todos los módulos del panel, gestionar equipo, ajustes, auditoría y revelar credenciales.',
  },
  'dashboard.view': {
    title: 'Ver dashboard',
    description: 'Consulta el resumen general y métricas del panel de control.',
  },
  'crm.view': {
    title: 'Ver CRM',
    description: 'Consulta leads y el embudo comercial sin modificarlos.',
  },
  'crm.manage': {
    title: 'Gestionar CRM',
    description: 'Crea, edita y elimina leads; gestiona el embudo de ventas.',
  },
  'clients.view': {
    title: 'Ver clientes',
    description: 'Consulta la ficha y el listado de clientes.',
  },
  'clients.manage': {
    title: 'Gestionar clientes',
    description: 'Crea, edita y elimina clientes y sus datos asociados.',
  },
  'projects.view': {
    title: 'Ver proyectos',
    description: 'Consulta proyectos y su estado.',
  },
  'projects.manage': {
    title: 'Gestionar proyectos',
    description: 'Crea, edita y elimina proyectos del equipo.',
  },
  'finances.view': {
    title: 'Ver finanzas',
    description: 'Consulta facturación, gastos y reportes financieros.',
  },
  'finances.manage': {
    title: 'Gestionar finanzas',
    description: 'Registra y modifica transacciones, suscripciones y gastos.',
  },
  'catalog.view': {
    title: 'Ver catálogo',
    description: 'Consulta demos y productos del catálogo público.',
  },
  'catalog.manage': {
    title: 'Gestionar catálogo',
    description: 'Crea, edita y elimina ítems del catálogo.',
  },
  'servers.view': {
    title: 'Ver servidores',
    description: 'Consulta la infraestructura de servidores.',
  },
  'servers.manage': {
    title: 'Gestionar servidores',
    description: 'Crea, edita y elimina registros de servidores.',
  },
  'domains.view': {
    title: 'Ver dominios',
    description: 'Consulta dominios y fechas de vencimiento.',
  },
  'domains.manage': {
    title: 'Gestionar dominios',
    description: 'Crea, edita y elimina dominios registrados.',
  },
  'credentials.view': {
    title: 'Ver credenciales',
    description: 'Ve el inventario de credenciales (sin revelar secretos).',
  },
  'credentials.manage': {
    title: 'Gestionar credenciales',
    description: 'Crea, edita y elimina entradas del vault de credenciales.',
  },
  'credentials.reveal': {
    title: 'Revelar secretos',
    description: 'Puede ver contraseñas y secretos almacenados.',
  },
  'tickets.view': {
    title: 'Ver tickets',
    description: 'Consulta tickets de soporte sin cambiarlos.',
  },
  'tickets.manage': {
    title: 'Gestionar tickets',
    description: 'Atiende, crea, edita y cierra tickets de soporte.',
  },
  'wiki.view': {
    title: 'Ver wiki',
    description: 'Lee artículos y procedimientos internos.',
  },
  'wiki.manage': {
    title: 'Gestionar wiki',
    description: 'Crea, edita y elimina categorías y artículos de la wiki.',
  },
  'team.manage': {
    title: 'Gestionar equipo',
    description: 'Administra usuarios, roles y estado de cuentas del equipo.',
  },
  'settings.manage': {
    title: 'Gestionar ajustes',
    description: 'Modifica la configuración de la empresa y del sistema.',
  },
  'audit.view': {
    title: 'Ver auditoría',
    description: 'Consulta el historial de acciones registradas en el sistema.',
  },
  'profile.manage': {
    title: 'Gestionar perfil',
    description: 'Actualiza su propio perfil y datos personales.',
  },
};

function normalizePermissions(perms: unknown): string[] {
  return Array.isArray(perms) ? perms.map(String) : [];
}

function permissionMeta(code: string) {
  if (PERMISSION_DETAILS[code]) return PERMISSION_DETAILS[code];
  const [module, action] = code.split('.');
  const moduleLabel = MODULE_LABELS[module] || module;
  const actionLabel = action === 'manage' ? 'Gestionar' : action === 'view' ? 'Ver' : action || 'Acceso';
  return {
    title: `${actionLabel} ${moduleLabel}`.trim(),
    description: `Permiso ${code} sobre el módulo ${moduleLabel}.`,
  };
}

function PermissionsModal({
  member,
  onClose,
}: {
  member: TeamMember | null;
  onClose: () => void;
}) {
  if (!member) return null;

  const perms = member.permissions;
  const isFullAccess = perms.includes('*') || perms.includes('all');
  const items = isFullAccess ? ['*'] : perms;
  const showManageNote = !isFullAccess && items.some((p) => p.endsWith('.manage'));

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center px-4 py-6">
      <button
        type="button"
        aria-label="Cerrar"
        onClick={onClose}
        className="absolute inset-0 bg-black/70"
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-xl bg-sa-panel border border-sa-border rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-sa-border">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                <Shield className="h-4 w-4" />
              </div>
              <h3 className="text-lg font-bold text-sa-text truncate">Permisos de {member.name}</h3>
            </div>
            <p className="text-sm text-sa-faint">
              Rol <span className="text-sa-muted font-semibold">{member.role}</span>
              {isFullAccess
                ? ' · Acceso completo al sistema'
                : ` · ${items.length} permiso${items.length === 1 ? '' : 's'} efectivo${items.length === 1 ? '' : 's'}`}
            </p>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg text-sa-faint hover:text-sa-text hover:bg-sa-border/60 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 max-h-[65vh] overflow-y-auto custom-scrollbar space-y-3">
          {items.length === 0 ? (
            <div className="rounded-xl border border-sa-border bg-sa-canvas/50 px-4 py-8 text-center">
              <p className="text-sm font-semibold text-sa-text">Sin permisos</p>
              <p className="text-xs text-sa-faint mt-1">Este usuario no tiene capacidades asignadas por su rol.</p>
            </div>
          ) : (
            items.map((code) => {
              const meta = permissionMeta(code);
              return (
                <div
                  key={code}
                  className="flex items-start gap-3 rounded-xl border border-sa-border bg-sa-canvas/40 px-4 py-3">
                  <div className={cn(
                    'mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border',
                    isFullAccess
                      ? 'bg-purple-500/10 border-purple-500/20 text-purple-400'
                      : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
                  )}>
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-sa-text">{meta.title}</p>
                      {!isFullAccess && (
                        <code className="text-[10px] px-1.5 py-0.5 rounded bg-sa-border text-sa-muted border border-sa-border-strong">
                          {code}
                        </code>
                      )}
                    </div>
                    <p className="text-xs text-sa-muted mt-1 leading-relaxed">{meta.description}</p>
                  </div>
                </div>
              );
            })
          )}

          {showManageNote && (
            <p className="text-[11px] text-sa-faint pt-1 px-1">
              Nota: un permiso <span className="text-sa-muted">.manage</span> también incluye la capacidad de <span className="text-sa-muted">.view</span> del mismo módulo.
            </p>
          )}
        </div>

        <div className="px-5 py-4 border-t border-sa-border flex justify-end bg-sa-canvas/40">
          <button
            type="button"
            onClick={onClose} className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-sa-muted border border-sa-border hover:bg-sa-border/50 hover:text-sa-text transition-colors">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Team() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('Todos');
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(emptyMember);
  const [permissionsMember, setPermissionsMember] = useState<TeamMember | null>(null);
  const [detail, setDetail] = useState<TeamMember | null>(null);

  const mapTeam = (rows: any[]): TeamMember[] => rows.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    phone: r.phone || '',
    jobTitle: r.jobTitle || '',
    role: r.role,
    permissions: normalizePermissions(r.permissions),
    lastLogin: r.lastLogin,
    status: r.status,
  }));

  const loadTeam = () => {
    apiGet<any[]>('/api/team')
      .then((rows) => setTeam(mapTeam(rows)))
      .catch(() => setTeam([]));
  };

  useEffect(() => {
    loadTeam();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyMember);
    setModalOpen(true);
  };

  const openEdit = (member: TeamMember) => {
    setEditingId(member.id);
    setForm({
      name: member.name,
      email: member.email,
      password: '',
      phone: member.phone || '',
      jobTitle: member.jobTitle || '',
      role: member.role || 'Soporte',
      status: member.status || 'Activo',
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setForm(emptyMember);
  };

  const saveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        name: form.name,
        email: form.email,
        phone: form.phone || null,
        jobTitle: form.jobTitle || null,
        role: form.role,
        status: form.status,
      };
      if (form.password) payload.password = form.password;
      if (editingId) {
        await apiMutate('put', `/api/team/${editingId}`, payload);
      } else {
        await apiMutate('post', '/api/team', { ...payload, password: form.password });
      }
      closeModal();
      loadTeam();
    } finally {
      setSubmitting(false);
    }
  };

  const suspendMember = async (member: TeamMember) => {
    await apiMutate('put', `/api/team/${member.id}`, { status: 'Inactivo' });
    loadTeam();
  };

  const deleteMember = async (member: TeamMember) => {
    if (!window.confirm(`¿Eliminar al usuario "${member.name}"?`)) return;
    await apiMutate('delete', `/api/team/${member.id}`);
    loadTeam();
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const getRoleBadge = (role: TeamMember['role']) => {
    switch (role) {
      case 'Super Admin':
      case 'Administrador':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'Soporte':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'Ventas':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      default:
        return 'bg-slate-500/10 text-sa-muted border-slate-500/20';
    }
  };

  const getStatusBadge = (status: TeamMember['status']) => {
    switch (status) {
      case 'Activo':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'Inactivo':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      default:
        return 'bg-slate-500/10 text-sa-muted border-slate-500/20';
    }
  };

  // Metrics
  const totalMembers = team.length;
  const activeMembers = team.filter(m => m.status === 'Activo').length;
  const uniqueRoles = new Set(team.map(m => m.role)).size;

  const counts = {
    'Todos': totalMembers,
    'Administradores': team.filter(m => m.role === 'Super Admin').length,
    'Soporte Técnico': team.filter(m => m.role === 'Soporte').length,
    'Comerciales': team.filter(m => m.role === 'Ventas').length,
  };

  // Filtering
  const filteredTeam = team.filter(member => {
    // Search filter
    const matchesSearch = 
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.role.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;

    // Tab filter
    if (activeTab === 'Administradores' && member.role !== 'Super Admin') return false;
    if (activeTab === 'Soporte Técnico' && member.role !== 'Soporte') return false;
    if (activeTab === 'Comerciales' && member.role !== 'Ventas') return false;

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-extrabold text-sa-text tracking-tight">Equipo & Empleados</h1>
        <Can ability="team.manage">
          <button type="button" onClick={openCreate} className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/20"><Plus className="h-4 w-4 mr-2" />
            Nuevo Miembro
          </button>
        </Can>
      </div>

      <FormModal open={modalOpen} title={editingId ? 'Editar Miembro' : 'Nuevo Miembro'} onClose={closeModal} onSubmit={saveMember} submitting={submitting} submitLabel={editingId ? 'Guardar cambios' : 'Crear'}>
        <Field label="Nombre"><input required className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
        <Field label="Email"><input required type="email" className={inputClass} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
        <Field label={editingId ? 'Nueva contraseña (opcional)' : 'Contraseña'}>
          <input required={!editingId} type="password" minLength={8} className={inputClass} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </Field>
        <Field label="Teléfono"><input className={inputClass} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
        <Field label="Cargo"><input className={inputClass} value={form.jobTitle} onChange={(e) => setForm({ ...form, jobTitle: e.target.value })} /></Field>
        <Field label="Rol">
          <select className={inputClass} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option>Super Admin</option>
            <option>Administrador</option>
            <option>Soporte</option>
            <option>Ventas</option>
            <option>Colaborador</option>
          </select>
        </Field>
        <Field label="Estado">
          <select className={inputClass} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option>Activo</option>
            <option>Inactivo</option>
          </select>
        </Field>
      </FormModal>

      <PermissionsModal member={permissionsMember} onClose={() => setPermissionsMember(null)} />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-sa-panel border border-sa-border rounded-2xl p-5 flex items-center gap-4 group hover:border-sa-border-strong transition-colors relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl -mr-6 -mt-6"></div>
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 relative z-10 group-hover:scale-110 transition-transform">
            <Users className="h-6 w-6" />
          </div>
          <div className="relative z-10">
            <p className="text-[11px] font-bold text-sa-faint uppercase tracking-wider mb-1">Total Miembros</p>
            <h3 className="text-2xl font-extrabold text-sa-text">{totalMembers} <span className="text-sm font-medium text-sa-faint normal-case">Colaboradores</span></h3>
          </div>
        </div>

        <div className="bg-sa-panel border border-sa-border rounded-2xl p-5 flex items-center gap-4 group hover:border-sa-border-strong transition-colors relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl -mr-6 -mt-6"></div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 relative z-10 group-hover:scale-110 transition-transform">
            <UserCheck className="h-6 w-6" />
          </div>
          <div className="relative z-10">
            <p className="text-[11px] font-bold text-sa-faint uppercase tracking-wider mb-1">Cuentas Activas</p>
            <h3 className="text-2xl font-extrabold text-sa-text">{activeMembers} <span className="text-sm font-medium text-sa-faint normal-case">Habilitadas</span></h3>
          </div>
        </div>

        <div className="bg-sa-panel border border-sa-border rounded-2xl p-5 flex items-center gap-4 group hover:border-sa-border-strong transition-colors relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl -mr-6 -mt-6"></div>
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500 relative z-10 group-hover:scale-110 transition-transform">
            <Shield className="h-6 w-6" />
          </div>
          <div className="relative z-10">
            <p className="text-[11px] font-bold text-sa-faint uppercase tracking-wider mb-1">Roles de Permisos</p>
            <h3 className="text-2xl font-extrabold text-sa-text">{uniqueRoles} <span className="text-sm font-medium text-sa-faint normal-case">Perfiles creados</span></h3>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        {/* Tabs */}
        <div className="flex items-center gap-1 bg-sa-panel border border-sa-border rounded-xl p-1 overflow-x-auto custom-scrollbar w-full xl:w-auto">
          {(['Todos', 'Administradores', 'Soporte Técnico', 'Comerciales'] as FilterTab[]).map(tab => {
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
            placeholder="Buscar por nombre, correo o rol..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-3 py-2.5 bg-sa-input border border-sa-border rounded-xl text-sa-text text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder-sa-faint"/>
        </div>
      </div>

      {/* Table */}
      <div className="bg-sa-panel border border-sa-border rounded-2xl shadow-sm overflow-hidden">
        {filteredTeam.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <EmptyState 
              icon={Users}
              title="No hay miembros"
              description="No se encontraron colaboradores que coincidan con los filtros actuales."
            />
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-sm min-w-[1000px]">
              <thead className="bg-sa-border/50 text-sa-faint font-semibold border-b border-sa-border sticky top-0 z-10 backdrop-blur-sm">
                <tr>
                  <th className="px-6 py-4 uppercase tracking-wider text-[11px]">Colaborador</th>
                  <th className="px-6 py-4 uppercase tracking-wider text-[11px]">Rol / Perfil</th>
                  <th className="px-6 py-4 uppercase tracking-wider text-[11px]">Permisos Asignados</th>
                  <th className="px-6 py-4 uppercase tracking-wider text-[11px]">Última Conexión</th>
                  <th className="px-6 py-4 uppercase tracking-wider text-[11px]">Estado</th>
                  <th className="px-6 py-4 uppercase tracking-wider text-[11px] text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E293B]">
                {filteredTeam.map((member) => (
                  <tr
                    key={member.id}
                    onClick={() => setDetail(member)}
                    className="hover:bg-sa-border/50 transition-colors group cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div >
                          {getInitials(member.name)}
                        </div>
                        <div>
                          <div className="font-bold text-sa-text text-[13px]">{member.name}</div>
                          <div className="text-sa-faint text-[11px] mt-0.5">{member.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold border whitespace-nowrap",
                        getRoleBadge(member.role)
                      )}>
                        {member.role === 'Super Admin' && <ShieldAlert className="h-3 w-3 mr-1" />}
                        {member.role}
                      </span>
                    </td>
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => setPermissionsMember(member)}>
                        <Eye className="h-3.5 w-3.5 text-blue-400" />
                        Ver permisos
                        <span className="text-sa-faint font-medium">
                          ({member.permissions.includes('*') || member.permissions.includes('all') ? 'total' : member.permissions.length})
                        </span>
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sa-muted text-[13px]">{member.lastLogin}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn("inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold border", getStatusBadge(member.status))}>
                        {member.status}
                      </span>
                    </td>
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <Can ability="team.manage">
                          <button 
                            type="button"
                            onClick={() => openEdit(member)} title="Editar miembro"
                           className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-sa-muted border border-sa-border hover:bg-sa-border/50 hover:text-sa-text transition-colors">
                            <Edit2 className="h-3.5 w-3.5 text-sa-muted" /> Editar
                          </button>
                          <button 
                            type="button"
                            onClick={() => openEdit(member)} title="Cambiar clave"
                           className="p-2 rounded-lg text-sa-faint hover:text-sa-text hover:bg-sa-border/60 transition-colors">
                            <Key className="h-4 w-4" />
                          </button>
                        </Can>
                        <div className="relative group/menu">
                          <button type="button" className="p-2 rounded-lg text-sa-faint hover:text-sa-text hover:bg-sa-border/60 transition-colors"><MoreVertical className="h-4 w-4" />
                          </button>
                          <div className="absolute right-0 top-full mt-1 w-40 bg-sa-border border border-sa-border-strong rounded-lg shadow-xl opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-20">
                            <div className="py-1">
                              <Can ability="team.manage">
                                <button type="button" onClick={() => openEdit(member)} className="w-full text-left px-4 py-2 text-xs text-sa-muted hover:text-sa-text hover:bg-sa-border-strong transition-colors">Editar</button>
                              </Can>
                              <button type="button" onClick={() => suspendMember(member)} className="w-full text-left px-4 py-2 text-xs text-amber-400 hover:bg-sa-border-strong transition-colors">Suspender Cuenta</button>
                              <Can ability="team.manage">
                                <button type="button" onClick={() => deleteMember(member)} className="w-full text-left px-4 py-2 text-xs text-red-400 hover:bg-sa-border-strong transition-colors">Eliminar Usuario</button>
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
        title={detail?.name || 'Miembro'}
        subtitle={detail?.role || undefined}
        onClose={() => setDetail(null)}
        footer={detail && (
          <>
            <button
              type="button"
              onClick={() => { const m = detail; setDetail(null); setPermissionsMember(m); }} className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-sa-muted border border-sa-border hover:bg-sa-border/50 hover:text-sa-text transition-colors">
              Ver permisos
            </button>
            <Can ability="team.manage">
              <button
                type="button"
                onClick={() => { const m = detail; setDetail(null); openEdit(m); }} className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors">
                Editar
              </button>
            </Can>
            <button type="button" onClick={() => setDetail(null)} className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-semibold text-sa-muted hover:text-sa-text hover:bg-sa-border/60 transition-colors">Cerrar</button>
          </>
        )}
      >
        {detail && (() => {
          const perms = detail.permissions;
          const isFullAccess = perms.includes('*') || perms.includes('all');
          const permsLabel = isFullAccess
            ? 'Acceso total'
            : perms.length === 0
              ? 'Sin permisos'
              : `${perms.length} permiso${perms.length === 1 ? '' : 's'}: ${perms.slice(0, 4).join(', ')}${perms.length > 4 ? '…' : ''}`;
          return (
            <DetailGrid>
              <DetailItem label="Nombre" value={detail.name} />
              <DetailItem label="Email" value={detail.email} mono />
              <DetailItem label="Rol" value={detail.role} />
              <DetailItem label="Estado" value={detail.status} />
              <DetailItem label="Teléfono" value={detail.phone} />
              <DetailItem label="Cargo" value={detail.jobTitle} />
              <DetailItem label="Última conexión" value={detail.lastLogin} />
              <DetailItem label="Permisos" value={permsLabel} full />
            </DetailGrid>
          );
        })()}
      </DetailModal>
    </div>
  );
}
