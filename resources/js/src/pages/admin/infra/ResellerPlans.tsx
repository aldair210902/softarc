import React, { useEffect, useMemo, useState } from 'react';
import {
  Plus,
  Search,
  Tags,
  Pencil,
  Trash2,
  Package,
  Users,
  TrendingUp,
  ArrowUpDown,
  Filter,
} from 'lucide-react';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Can } from '../../../components/Can';
import { apiGet, apiMutate } from '../../../lib/api';
import { Field, FormModal, inputClass } from '../../../components/ui/FormModal';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { DetailModal, DetailGrid, DetailItem } from '../../../components/ui/DetailModal';
import { cn } from '../../../lib/utils';
import { useCompanySettings } from '../../../hooks/useCompanySettings';
import type { InfraProvider } from '../../../components/ProviderSelect';

type Tab = 'planes' | 'servicios';

type PlanSort =
  | 'orden'
  | 'nombre'
  | 'proveedor'
  | 'venta_asc'
  | 'venta_desc'
  | 'margen_desc'
  | 'costo_asc';

type ServiceSort =
  | 'cliente'
  | 'renovacion'
  | 'venta_desc'
  | 'margen_desc'
  | 'estado';

type ResellerPlan = {
  id: string;
  providerId: string | null;
  providerName: string;
  name: string;
  type: string;
  providerPlanName: string;
  costPrice: number | null;
  sellPrice: number;
  margin: number | null;
  billingCycle: string;
  features: string[];
  description: string;
  isPublic: boolean;
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
  notes: string;
};

type ClientServiceRow = {
  id: string;
  clientId: string;
  clientName: string;
  resellerPlanId: string | null;
  planName: string;
  serviceLabel: string;
  type: string;
  domainName: string;
  costPrice: number;
  sellPrice: number;
  margin: number;
  billingCycle: string;
  status: string;
  startDate: string | null;
  renewDate: string | null;
  providerName: string;
  deliveryNotes: string;
  internalNotes: string;
  subscriptionId: string | null;
};

type ClientOption = { id: string; name: string };

const typeLabel: Record<string, string> = {
  hosting: 'Hosting',
  domain: 'Dominio',
  bundle: 'Hosting + Dominio',
};

const emptyPlan = {
  providerId: '',
  name: '',
  type: 'hosting',
  providerPlanName: '',
  costPrice: '',
  sellPrice: '',
  billingCycle: 'Anual',
  featuresText: '',
  description: '',
  isPublic: true,
  isActive: true,
  isFeatured: false,
  sortOrder: '0',
  notes: '',
};

const emptyService = {
  clientId: '',
  resellerPlanId: '',
  serviceLabel: '',
  type: 'hosting',
  domainName: '',
  costPrice: '',
  sellPrice: '',
  billingCycle: 'Anual',
  status: 'Pendiente',
  startDate: new Date().toISOString().slice(0, 10),
  renewDate: '',
  providerName: '',
  deliveryNotes: '',
  internalNotes: '',
  createSubscription: true,
};

function money(symbol: string, n: number | null | undefined) {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return '—';
  return `${symbol} ${Number(n).toFixed(2)}`;
}

export default function ResellerPlans() {
  const { settings } = useCompanySettings();
  const symbol = settings.currencySymbol || 'S/';

  const [tab, setTab] = useState<Tab>('planes');
  const [searchTerm, setSearchTerm] = useState('');
  const [planProviderFilter, setPlanProviderFilter] = useState('todos');
  const [planTypeFilter, setPlanTypeFilter] = useState('todos');
  const [planVisibilityFilter, setPlanVisibilityFilter] = useState<'todos' | 'web' | 'oculto' | 'activos' | 'inactivos'>('todos');
  const [planSort, setPlanSort] = useState<PlanSort>('orden');
  const [serviceStatusFilter, setServiceStatusFilter] = useState('todos');
  const [serviceTypeFilter, setServiceTypeFilter] = useState('todos');
  const [serviceSort, setServiceSort] = useState<ServiceSort>('cliente');
  const [plans, setPlans] = useState<ResellerPlan[]>([]);
  const [services, setServices] = useState<ClientServiceRow[]>([]);
  const [providers, setProviders] = useState<InfraProvider[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);

  const [planModal, setPlanModal] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [planForm, setPlanForm] = useState(emptyPlan);
  const [planSubmitting, setPlanSubmitting] = useState(false);
  const [planDetail, setPlanDetail] = useState<ResellerPlan | null>(null);
  const [pendingPlanDelete, setPendingPlanDelete] = useState<ResellerPlan | null>(null);

  const [serviceModal, setServiceModal] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [serviceForm, setServiceForm] = useState(emptyService);
  const [serviceSubmitting, setServiceSubmitting] = useState(false);
  const [serviceDetail, setServiceDetail] = useState<ClientServiceRow | null>(null);
  const [pendingServiceDelete, setPendingServiceDelete] = useState<ClientServiceRow | null>(null);

  const loadPlans = () => {
    apiGet<ResellerPlan[]>('/api/reseller-plans/manage', { fresh: true })
      .then(setPlans)
      .catch(() => setPlans([]));
  };

  const loadServices = () => {
    apiGet<ClientServiceRow[]>('/api/client-services', { fresh: true })
      .then(setServices)
      .catch(() => setServices([]));
  };

  useEffect(() => {
    loadPlans();
    loadServices();
    apiGet<InfraProvider[]>('/api/providers?activeOnly=1')
      .then(setProviders)
      .catch(() => setProviders([]));
    apiGet<ClientOption[]>('/api/clients')
      .then((rows) => setClients(rows.map((c) => ({ id: String(c.id), name: c.name }))))
      .catch(() => setClients([]));
  }, []);

  const filteredPlans = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    let rows = plans.filter((p) => {
      if (planProviderFilter !== 'todos' && String(p.providerId || '') !== planProviderFilter) return false;
      if (planTypeFilter !== 'todos' && p.type !== planTypeFilter) return false;
      if (planVisibilityFilter === 'web' && !p.isPublic) return false;
      if (planVisibilityFilter === 'oculto' && p.isPublic) return false;
      if (planVisibilityFilter === 'activos' && !p.isActive) return false;
      if (planVisibilityFilter === 'inactivos' && p.isActive) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        (p.providerName || '').toLowerCase().includes(q) ||
        (p.providerPlanName || '').toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q) ||
        (typeLabel[p.type] || p.type).toLowerCase().includes(q)
      );
    });

    const byText = (a: string, b: string) => a.localeCompare(b, 'es', { sensitivity: 'base' });
    rows = [...rows].sort((a, b) => {
      switch (planSort) {
        case 'nombre':
          return byText(a.name, b.name);
        case 'proveedor':
          return byText(a.providerName || '', b.providerName || '') || byText(a.name, b.name);
        case 'venta_asc':
          return (a.sellPrice || 0) - (b.sellPrice || 0);
        case 'venta_desc':
          return (b.sellPrice || 0) - (a.sellPrice || 0);
        case 'margen_desc':
          return (b.margin || 0) - (a.margin || 0);
        case 'costo_asc':
          return (a.costPrice || 0) - (b.costPrice || 0);
        case 'orden':
        default:
          return (a.sortOrder || 0) - (b.sortOrder || 0) || byText(a.name, b.name);
      }
    });
    return rows;
  }, [plans, searchTerm, planProviderFilter, planTypeFilter, planVisibilityFilter, planSort]);

  const filteredServices = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    let rows = services.filter((s) => {
      if (serviceStatusFilter !== 'todos' && s.status !== serviceStatusFilter) return false;
      if (serviceTypeFilter !== 'todos' && s.type !== serviceTypeFilter) return false;
      if (!q) return true;
      return (
        s.clientName.toLowerCase().includes(q) ||
        s.serviceLabel.toLowerCase().includes(q) ||
        (s.domainName || '').toLowerCase().includes(q) ||
        (s.providerName || '').toLowerCase().includes(q) ||
        s.status.toLowerCase().includes(q)
      );
    });

    const byText = (a: string, b: string) => a.localeCompare(b, 'es', { sensitivity: 'base' });
    rows = [...rows].sort((a, b) => {
      switch (serviceSort) {
        case 'renovacion':
          return (a.renewDate || '9999').localeCompare(b.renewDate || '9999');
        case 'venta_desc':
          return (b.sellPrice || 0) - (a.sellPrice || 0);
        case 'margen_desc':
          return (b.margin || 0) - (a.margin || 0);
        case 'estado':
          return byText(a.status, b.status) || byText(a.clientName, b.clientName);
        case 'cliente':
        default:
          return byText(a.clientName, b.clientName) || byText(a.serviceLabel, b.serviceLabel);
      }
    });
    return rows;
  }, [services, searchTerm, serviceStatusFilter, serviceTypeFilter, serviceSort]);

  const serviceStatuses = useMemo(
    () => Array.from(new Set(services.map((s) => s.status).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'es')),
    [services],
  );

  const resetListControls = () => {
    setSearchTerm('');
    setPlanProviderFilter('todos');
    setPlanTypeFilter('todos');
    setPlanVisibilityFilter('todos');
    setPlanSort('orden');
    setServiceStatusFilter('todos');
    setServiceTypeFilter('todos');
    setServiceSort('cliente');
  };

  const openCreatePlan = () => {
    setEditingPlanId(null);
    setPlanForm(emptyPlan);
    setPlanModal(true);
  };

  const openEditPlan = (plan: ResellerPlan) => {
    setEditingPlanId(plan.id);
    setPlanForm({
      providerId: plan.providerId || '',
      name: plan.name,
      type: plan.type || 'hosting',
      providerPlanName: plan.providerPlanName || '',
      costPrice: String(plan.costPrice ?? ''),
      sellPrice: String(plan.sellPrice ?? ''),
      billingCycle: plan.billingCycle || 'Anual',
      featuresText: (plan.features || []).join('\n'),
      description: plan.description || '',
      isPublic: plan.isPublic !== false,
      isActive: plan.isActive !== false,
      isFeatured: !!plan.isFeatured,
      sortOrder: String(plan.sortOrder ?? 0),
      notes: plan.notes || '',
    });
    setPlanModal(true);
  };

  const savePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setPlanSubmitting(true);
    try {
      const payload = {
        providerId: planForm.providerId || null,
        name: planForm.name.trim(),
        type: planForm.type,
        providerPlanName: planForm.providerPlanName.trim() || null,
        costPrice: Number(planForm.costPrice || 0),
        sellPrice: Number(planForm.sellPrice || 0),
        billingCycle: planForm.billingCycle,
        features: planForm.featuresText
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean),
        description: planForm.description.trim() || null,
        isPublic: planForm.isPublic,
        isActive: planForm.isActive,
        isFeatured: planForm.isFeatured,
        sortOrder: Number(planForm.sortOrder || 0),
        notes: planForm.notes.trim() || null,
      };
      if (editingPlanId) {
        await apiMutate('put', `/api/reseller-plans/${editingPlanId}`, payload);
      } else {
        await apiMutate('post', '/api/reseller-plans', payload);
      }
      setPlanModal(false);
      loadPlans();
    } finally {
      setPlanSubmitting(false);
    }
  };

  const openCreateService = (fromPlan?: ResellerPlan) => {
    setEditingServiceId(null);
    setServiceForm({
      ...emptyService,
      resellerPlanId: fromPlan?.id || '',
      serviceLabel: fromPlan?.name || '',
      type: fromPlan?.type || 'hosting',
      costPrice: fromPlan ? String(fromPlan.costPrice ?? 0) : '',
      sellPrice: fromPlan ? String(fromPlan.sellPrice ?? 0) : '',
      billingCycle: fromPlan?.billingCycle || 'Anual',
      providerName: fromPlan?.providerName || '',
    });
    setServiceModal(true);
  };

  const openEditService = (row: ClientServiceRow) => {
    setEditingServiceId(row.id);
    setServiceForm({
      clientId: row.clientId,
      resellerPlanId: row.resellerPlanId || '',
      serviceLabel: row.serviceLabel,
      type: row.type || 'hosting',
      domainName: row.domainName || '',
      costPrice: String(row.costPrice ?? ''),
      sellPrice: String(row.sellPrice ?? ''),
      billingCycle: row.billingCycle || 'Anual',
      status: row.status || 'Pendiente',
      startDate: row.startDate || '',
      renewDate: row.renewDate || '',
      providerName: row.providerName || '',
      deliveryNotes: row.deliveryNotes || '',
      internalNotes: row.internalNotes || '',
      createSubscription: false,
    });
    setServiceModal(true);
  };

  const onPlanPick = (planId: string) => {
    const plan = plans.find((p) => p.id === planId);
    setServiceForm((prev) => ({
      ...prev,
      resellerPlanId: planId,
      serviceLabel: plan?.name || prev.serviceLabel,
      type: plan?.type || prev.type,
      costPrice: plan ? String(plan.costPrice ?? 0) : prev.costPrice,
      sellPrice: plan ? String(plan.sellPrice ?? 0) : prev.sellPrice,
      billingCycle: plan?.billingCycle || prev.billingCycle,
      providerName: plan?.providerName || prev.providerName,
    }));
  };

  const saveService = async (e: React.FormEvent) => {
    e.preventDefault();
    setServiceSubmitting(true);
    try {
      const payload = {
        clientId: serviceForm.clientId,
        resellerPlanId: serviceForm.resellerPlanId || null,
        serviceLabel: serviceForm.serviceLabel.trim() || undefined,
        type: serviceForm.type,
        domainName: serviceForm.domainName.trim() || null,
        costPrice: Number(serviceForm.costPrice || 0),
        sellPrice: Number(serviceForm.sellPrice || 0),
        billingCycle: serviceForm.billingCycle,
        status: serviceForm.status,
        startDate: serviceForm.startDate || null,
        renewDate: serviceForm.renewDate || null,
        providerName: serviceForm.providerName.trim() || null,
        deliveryNotes: serviceForm.deliveryNotes.trim() || null,
        internalNotes: serviceForm.internalNotes.trim() || null,
        createSubscription: !editingServiceId && serviceForm.createSubscription,
      };
      if (editingServiceId) {
        await apiMutate('put', `/api/client-services/${editingServiceId}`, payload);
      } else {
        await apiMutate('post', '/api/client-services', payload);
      }
      setServiceModal(false);
      loadServices();
    } finally {
      setServiceSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-sa-text tracking-tight">Planes de reventa</h1>
          <p className="text-sm text-sa-faint mt-1">
            Define planes según tus proveedores (costo → precio cliente) y registra lo que vendes. Los datos del proveedor los anotas aquí y se los reenvías al cliente.
          </p>
        </div>
        <Can anyOf={['servers.manage', 'domains.manage']}>
          <div className="flex flex-wrap gap-2">
            {tab === 'planes' ? (
              <button
                type="button"
                onClick={openCreatePlan}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/20"
              >
                <Plus className="h-4 w-4" /> Nuevo plan
              </button>
            ) : (
              <button
                type="button"
                onClick={() => openCreateService()}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/20"
              >
                <Plus className="h-4 w-4" /> Asignar a cliente
              </button>
            )}
          </div>
        </Can>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => { setTab('planes'); resetListControls(); }}
          className={cn(
            'inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-colors',
            tab === 'planes'
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-sa-panel text-sa-muted border-sa-border hover:border-sa-border-strong hover:text-sa-text',
          )}
        >
          <Package className="h-4 w-4" /> Catálogo de planes
          <span className="text-[11px] opacity-80">({plans.length})</span>
        </button>
        <button
          type="button"
          onClick={() => { setTab('servicios'); resetListControls(); }}
          className={cn(
            'inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-colors',
            tab === 'servicios'
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-sa-panel text-sa-muted border-sa-border hover:border-sa-border-strong hover:text-sa-text',
          )}
        >
          <Users className="h-4 w-4" /> Servicios vendidos
          <span className="text-[11px] opacity-80">({services.length})</span>
        </button>
      </div>

      <div className="bg-sa-panel border border-sa-border rounded-2xl p-3 md:p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-sa-faint" />
          <input
            placeholder={tab === 'planes' ? 'Buscar plan, proveedor o descripción…' : 'Buscar cliente, dominio, proveedor o estado…'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3 py-2.5 bg-sa-input border border-sa-border rounded-xl text-sa-text text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder-sa-faint"
          />
        </div>

        {tab === 'planes' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            <label className="flex flex-col gap-1 text-[11px] font-semibold text-sa-faint uppercase tracking-wide">
              <span className="inline-flex items-center gap-1"><Filter className="h-3.5 w-3.5" /> Proveedor</span>
              <select
                className={cn(inputClass, 'py-2 text-sm font-medium normal-case')}
                value={planProviderFilter}
                onChange={(e) => setPlanProviderFilter(e.target.value)}
              >
                <option value="todos">Todos</option>
                {providers.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-[11px] font-semibold text-sa-faint uppercase tracking-wide">
              Tipo
              <select
                className={cn(inputClass, 'py-2 text-sm font-medium normal-case')}
                value={planTypeFilter}
                onChange={(e) => setPlanTypeFilter(e.target.value)}
              >
                <option value="todos">Todos</option>
                <option value="hosting">Hosting</option>
                <option value="domain">Dominio</option>
                <option value="bundle">Hosting + Dominio</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-[11px] font-semibold text-sa-faint uppercase tracking-wide">
              Visibilidad
              <select
                className={cn(inputClass, 'py-2 text-sm font-medium normal-case')}
                value={planVisibilityFilter}
                onChange={(e) => setPlanVisibilityFilter(e.target.value as typeof planVisibilityFilter)}
              >
                <option value="todos">Todos</option>
                <option value="web">Visible en web</option>
                <option value="oculto">Ocultos</option>
                <option value="activos">Solo activos</option>
                <option value="inactivos">Solo inactivos</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-[11px] font-semibold text-sa-faint uppercase tracking-wide">
              <span className="inline-flex items-center gap-1"><ArrowUpDown className="h-3.5 w-3.5" /> Ordenar</span>
              <select
                className={cn(inputClass, 'py-2 text-sm font-medium normal-case')}
                value={planSort}
                onChange={(e) => setPlanSort(e.target.value as PlanSort)}
              >
                <option value="orden">Orden manual</option>
                <option value="nombre">Nombre A–Z</option>
                <option value="proveedor">Proveedor A–Z</option>
                <option value="venta_asc">Precio venta ↑</option>
                <option value="venta_desc">Precio venta ↓</option>
                <option value="costo_asc">Costo ↑</option>
                <option value="margen_desc">Mayor margen</option>
              </select>
            </label>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            <label className="flex flex-col gap-1 text-[11px] font-semibold text-sa-faint uppercase tracking-wide">
              <span className="inline-flex items-center gap-1"><Filter className="h-3.5 w-3.5" /> Estado</span>
              <select
                className={cn(inputClass, 'py-2 text-sm font-medium normal-case')}
                value={serviceStatusFilter}
                onChange={(e) => setServiceStatusFilter(e.target.value)}
              >
                <option value="todos">Todos</option>
                {serviceStatuses.map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-[11px] font-semibold text-sa-faint uppercase tracking-wide">
              Tipo
              <select
                className={cn(inputClass, 'py-2 text-sm font-medium normal-case')}
                value={serviceTypeFilter}
                onChange={(e) => setServiceTypeFilter(e.target.value)}
              >
                <option value="todos">Todos</option>
                <option value="hosting">Hosting</option>
                <option value="domain">Dominio</option>
                <option value="bundle">Hosting + Dominio</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-[11px] font-semibold text-sa-faint uppercase tracking-wide">
              <span className="inline-flex items-center gap-1"><ArrowUpDown className="h-3.5 w-3.5" /> Ordenar</span>
              <select
                className={cn(inputClass, 'py-2 text-sm font-medium normal-case')}
                value={serviceSort}
                onChange={(e) => setServiceSort(e.target.value as ServiceSort)}
              >
                <option value="cliente">Cliente A–Z</option>
                <option value="renovacion">Renovación próxima</option>
                <option value="venta_desc">Mayor venta</option>
                <option value="margen_desc">Mayor margen</option>
                <option value="estado">Estado</option>
              </select>
            </label>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-sa-muted">
          <span>
            Mostrando{' '}
            <strong className="text-sa-text">
              {tab === 'planes' ? filteredPlans.length : filteredServices.length}
            </strong>
            {' '}de{' '}
            {tab === 'planes' ? plans.length : services.length}
          </span>
          <button
            type="button"
            onClick={resetListControls}
            className="px-2.5 py-1 rounded-lg border border-sa-border hover:bg-sa-border/60 hover:text-sa-text transition-colors"
          >
            Limpiar filtros
          </button>
        </div>
      </div>

      {tab === 'planes' && (
        filteredPlans.length === 0 ? (
          <EmptyState
            icon={Tags}
            title="Sin planes de reventa"
            description="Crea planes basados en lo que te ofrece tu proveedor (ej. Hosting Business) y pon tu precio de venta."
          />
        ) : (
          <div className="bg-sa-panel border border-sa-border rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm min-w-[900px]">
                <thead className="bg-sa-border/50 text-sa-faint font-semibold border-b border-sa-border">
                  <tr>
                    <th className="px-5 py-4 uppercase tracking-wider text-[11px]">Plan SoftArc</th>
                    <th className="px-5 py-4 uppercase tracking-wider text-[11px]">Proveedor</th>
                    <th className="px-5 py-4 uppercase tracking-wider text-[11px]">Tipo</th>
                    <th className="px-5 py-4 uppercase tracking-wider text-[11px]">Costo</th>
                    <th className="px-5 py-4 uppercase tracking-wider text-[11px]">Venta</th>
                    <th className="px-5 py-4 uppercase tracking-wider text-[11px]">Margen</th>
                    <th className="px-5 py-4 uppercase tracking-wider text-[11px]">Ciclo</th>
                    <th className="px-5 py-4 uppercase tracking-wider text-[11px]">Visibilidad</th>
                    <th className="px-5 py-4 uppercase tracking-wider text-[11px] text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sa-border">
                  {filteredPlans.map((plan) => (
                    <tr
                      key={plan.id}
                      onClick={() => setPlanDetail(plan)}
                      className="hover:bg-sa-border/40 transition-colors cursor-pointer"
                    >
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-sa-text text-[13px]">{plan.name}</div>
                        {plan.providerPlanName && (
                          <div className="text-[11px] text-sa-faint mt-0.5">En proveedor: {plan.providerPlanName}</div>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-sa-muted text-[13px]">{plan.providerName || '—'}</td>
                      <td className="px-5 py-3.5 text-sa-muted text-[13px]">{typeLabel[plan.type] || plan.type}</td>
                      <td className="px-5 py-3.5 text-sa-muted text-[13px] tabular-nums">{money(symbol, plan.costPrice)}</td>
                      <td className="px-5 py-3.5 text-sa-text text-[13px] font-semibold tabular-nums">{money(symbol, plan.sellPrice)}</td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-emerald-400 tabular-nums">
                          <TrendingUp className="h-3.5 w-3.5" />
                          {money(symbol, plan.margin)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-sa-muted text-[13px]">{plan.billingCycle}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex flex-wrap gap-1">
                          <span className={cn(
                            'inline-flex px-2 py-0.5 rounded text-[10px] font-bold border',
                            plan.isActive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-sa-border text-sa-faint border-sa-border-strong',
                          )}>
                            {plan.isActive ? 'Activo' : 'Inactivo'}
                          </span>
                          {plan.isPublic && (
                            <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold border bg-blue-500/10 text-blue-300 border-blue-500/20">
                              Web
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <Can anyOf={['servers.manage', 'domains.manage']}>
                            <button
                              type="button"
                              onClick={() => openCreateService(plan)}
                              className="px-2.5 h-9 rounded-xl text-[11px] font-bold border bg-emerald-500/10 text-emerald-300 border-emerald-500/25 hover:bg-emerald-500/20"
                              title="Asignar a cliente"
                            >
                              Vender
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditPlan(plan)}
                              className="w-9 h-9 rounded-xl flex items-center justify-center border bg-blue-500/10 text-blue-300 border-blue-500/25 hover:bg-blue-500/20"
                              title="Editar"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setPendingPlanDelete(plan)}
                              className="w-9 h-9 rounded-xl flex items-center justify-center border bg-red-500/10 text-red-300 border-red-500/25 hover:bg-red-500/20"
                              title="Eliminar"
                            >
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
        )
      )}

      {tab === 'servicios' && (
        filteredServices.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Sin servicios vendidos"
            description="Cuando un cliente contrate hosting o dominio, asígnalo aquí. Anota en «Datos entregados» lo que le reenviaste (panel, usuario, NS, etc.)."
          />
        ) : (
          <div className="bg-sa-panel border border-sa-border rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm min-w-[960px]">
                <thead className="bg-sa-border/50 text-sa-faint font-semibold border-b border-sa-border">
                  <tr>
                    <th className="px-5 py-4 uppercase tracking-wider text-[11px]">Cliente</th>
                    <th className="px-5 py-4 uppercase tracking-wider text-[11px]">Servicio</th>
                    <th className="px-5 py-4 uppercase tracking-wider text-[11px]">Dominio</th>
                    <th className="px-5 py-4 uppercase tracking-wider text-[11px]">Venta</th>
                    <th className="px-5 py-4 uppercase tracking-wider text-[11px]">Margen</th>
                    <th className="px-5 py-4 uppercase tracking-wider text-[11px]">Renovación</th>
                    <th className="px-5 py-4 uppercase tracking-wider text-[11px]">Estado</th>
                    <th className="px-5 py-4 uppercase tracking-wider text-[11px] text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sa-border">
                  {filteredServices.map((row) => (
                    <tr
                      key={row.id}
                      onClick={() => setServiceDetail(row)}
                      className="hover:bg-sa-border/40 transition-colors cursor-pointer"
                    >
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-sa-text text-[13px]">{row.clientName}</div>
                        <div className="text-[11px] text-sa-faint">{row.providerName || '—'}</div>
                      </td>
                      <td className="px-5 py-3.5 text-sa-muted text-[13px]">
                        <div>{row.serviceLabel}</div>
                        <div className="text-[11px] text-sa-faint">{typeLabel[row.type] || row.type} · {row.billingCycle}</div>
                      </td>
                      <td className="px-5 py-3.5 text-sa-text text-[13px] font-mono">{row.domainName || '—'}</td>
                      <td className="px-5 py-3.5 text-sa-text text-[13px] font-semibold tabular-nums">{money(symbol, row.sellPrice)}</td>
                      <td className="px-5 py-3.5 text-emerald-400 text-[13px] font-semibold tabular-nums">{money(symbol, row.margin)}</td>
                      <td className="px-5 py-3.5 text-sa-muted text-[13px]">{row.renewDate || '—'}</td>
                      <td className="px-5 py-3.5">
                        <span className={cn(
                          'inline-flex px-2 py-0.5 rounded text-[10px] font-bold border',
                          row.status === 'Activo' && 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                          row.status === 'Pendiente' && 'bg-amber-500/10 text-amber-300 border-amber-500/20',
                          row.status === 'Suspendido' && 'bg-orange-500/10 text-orange-300 border-orange-500/20',
                          row.status === 'Cancelado' && 'bg-sa-border text-sa-faint border-sa-border-strong',
                          row.status === 'Vencido' && 'bg-red-500/10 text-red-300 border-red-500/20',
                        )}>
                          {row.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <Can anyOf={['servers.manage', 'domains.manage', 'clients.manage']}>
                            <button
                              type="button"
                              onClick={() => openEditService(row)}
                              className="w-9 h-9 rounded-xl flex items-center justify-center border bg-blue-500/10 text-blue-300 border-blue-500/25 hover:bg-blue-500/20"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setPendingServiceDelete(row)}
                              className="w-9 h-9 rounded-xl flex items-center justify-center border bg-red-500/10 text-red-300 border-red-500/25 hover:bg-red-500/20"
                            >
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
        )
      )}

      <FormModal
        open={planModal}
        title={editingPlanId ? 'Editar plan' : 'Nuevo plan de reventa'}
        onClose={() => setPlanModal(false)}
        onSubmit={savePlan}
        submitting={planSubmitting}
        submitLabel="Guardar"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Nombre comercial (SoftArc)">
            <input required className={inputClass} value={planForm.name} onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })} placeholder="Hosting Business SoftArc" />
          </Field>
          <Field label="Proveedor">
            <select className={inputClass} value={planForm.providerId} onChange={(e) => setPlanForm({ ...planForm, providerId: e.target.value })}>
              <option value="">— Sin proveedor —</option>
              {providers.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Nombre en el proveedor" hint="Como aparece en su panel">
            <input className={inputClass} value={planForm.providerPlanName} onChange={(e) => setPlanForm({ ...planForm, providerPlanName: e.target.value })} placeholder="Plan Business 10GB" />
          </Field>
          <Field label="Tipo">
            <select className={inputClass} value={planForm.type} onChange={(e) => setPlanForm({ ...planForm, type: e.target.value })}>
              <option value="hosting">Hosting</option>
              <option value="domain">Dominio</option>
              <option value="bundle">Hosting + Dominio</option>
            </select>
          </Field>
          <Field label={`Costo proveedor (${symbol})`}>
            <input required type="number" min="0" step="0.01" className={inputClass} value={planForm.costPrice} onChange={(e) => setPlanForm({ ...planForm, costPrice: e.target.value })} />
          </Field>
          <Field label={`Precio venta cliente (${symbol})`}>
            <input required type="number" min="0" step="0.01" className={inputClass} value={planForm.sellPrice} onChange={(e) => setPlanForm({ ...planForm, sellPrice: e.target.value })} />
          </Field>
          <Field label="Ciclo de cobro">
            <select className={inputClass} value={planForm.billingCycle} onChange={(e) => setPlanForm({ ...planForm, billingCycle: e.target.value })}>
              <option>Mensual</option>
              <option>Anual</option>
              <option>Bienal</option>
              <option>Único</option>
            </select>
          </Field>
          <Field label="Orden en web">
            <input type="number" min="0" className={inputClass} value={planForm.sortOrder} onChange={(e) => setPlanForm({ ...planForm, sortOrder: e.target.value })} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Descripción corta (web)">
              <input className={inputClass} value={planForm.description} onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })} placeholder="Ideal para tiendas y sitios con tráfico medio" />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Características" hint="Una por línea · se muestran en la web">
              <textarea className={cn(inputClass, 'min-h-[100px]')} value={planForm.featuresText} onChange={(e) => setPlanForm({ ...planForm, featuresText: e.target.value })} placeholder={'SSL incluido\n5 correos\nBackup semanal'} />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Notas internas" hint="No se muestran en la web">
              <textarea className={cn(inputClass, 'min-h-[70px]')} value={planForm.notes} onChange={(e) => setPlanForm({ ...planForm, notes: e.target.value })} />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm text-sa-muted">
            <input type="checkbox" checked={planForm.isActive} onChange={(e) => setPlanForm({ ...planForm, isActive: e.target.checked })} />
            Activo
          </label>
          <label className="flex items-center gap-2 text-sm text-sa-muted">
            <input type="checkbox" checked={planForm.isPublic} onChange={(e) => setPlanForm({ ...planForm, isPublic: e.target.checked })} />
            Visible en la web
          </label>
          <label className="flex items-center gap-2 text-sm text-sa-muted sm:col-span-2">
            <input type="checkbox" checked={planForm.isFeatured} onChange={(e) => setPlanForm({ ...planForm, isFeatured: e.target.checked })} />
            Destacado (recomendado)
          </label>
        </div>
      </FormModal>

      <FormModal
        open={serviceModal}
        title={editingServiceId ? 'Editar servicio vendido' : 'Asignar plan a cliente'}
        onClose={() => setServiceModal(false)}
        onSubmit={saveService}
        submitting={serviceSubmitting}
        submitLabel="Guardar"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Cliente">
            <select required className={inputClass} value={serviceForm.clientId} onChange={(e) => setServiceForm({ ...serviceForm, clientId: e.target.value })} disabled={!!editingServiceId}>
              <option value="">Seleccionar...</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Plan del catálogo">
            <select className={inputClass} value={serviceForm.resellerPlanId} onChange={(e) => onPlanPick(e.target.value)}>
              <option value="">— Personalizado —</option>
              {plans.filter((p) => p.isActive).map((p) => (
                <option key={p.id} value={p.id}>{p.name} ({money(symbol, p.sellPrice)})</option>
              ))}
            </select>
          </Field>
          <Field label="Etiqueta / nombre del servicio">
            <input required className={inputClass} value={serviceForm.serviceLabel} onChange={(e) => setServiceForm({ ...serviceForm, serviceLabel: e.target.value })} />
          </Field>
          <Field label="Dominio asociado" hint="Opcional">
            <input className={inputClass} value={serviceForm.domainName} onChange={(e) => setServiceForm({ ...serviceForm, domainName: e.target.value })} placeholder="cliente.com" />
          </Field>
          <Field label={`Costo (${symbol})`}>
            <input type="number" min="0" step="0.01" className={inputClass} value={serviceForm.costPrice} onChange={(e) => setServiceForm({ ...serviceForm, costPrice: e.target.value })} />
          </Field>
          <Field label={`Venta (${symbol})`}>
            <input type="number" min="0" step="0.01" className={inputClass} value={serviceForm.sellPrice} onChange={(e) => setServiceForm({ ...serviceForm, sellPrice: e.target.value })} />
          </Field>
          <Field label="Ciclo">
            <select className={inputClass} value={serviceForm.billingCycle} onChange={(e) => setServiceForm({ ...serviceForm, billingCycle: e.target.value })}>
              <option>Mensual</option>
              <option>Anual</option>
              <option>Bienal</option>
              <option>Único</option>
            </select>
          </Field>
          <Field label="Estado">
            <select className={inputClass} value={serviceForm.status} onChange={(e) => setServiceForm({ ...serviceForm, status: e.target.value })}>
              <option>Pendiente</option>
              <option>Activo</option>
              <option>Suspendido</option>
              <option>Cancelado</option>
              <option>Vencido</option>
            </select>
          </Field>
          <Field label="Inicio">
            <input type="date" className={inputClass} value={serviceForm.startDate} onChange={(e) => setServiceForm({ ...serviceForm, startDate: e.target.value })} />
          </Field>
          <Field label="Renovación" hint="Vacío = se calcula según ciclo">
            <input type="date" className={inputClass} value={serviceForm.renewDate} onChange={(e) => setServiceForm({ ...serviceForm, renewDate: e.target.value })} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Datos entregados al cliente" hint="Panel, usuario, nameservers, lo que te mandó el proveedor y tú reenviaste">
              <textarea className={cn(inputClass, 'min-h-[90px]')} value={serviceForm.deliveryNotes} onChange={(e) => setServiceForm({ ...serviceForm, deliveryNotes: e.target.value })} placeholder={'Panel: https://...\nUsuario: ...\nNS1 / NS2: ...'} />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Notas internas">
              <textarea className={cn(inputClass, 'min-h-[70px]')} value={serviceForm.internalNotes} onChange={(e) => setServiceForm({ ...serviceForm, internalNotes: e.target.value })} />
            </Field>
          </div>
          {!editingServiceId && (
            <label className="flex items-center gap-2 text-sm text-sa-muted sm:col-span-2">
              <input type="checkbox" checked={serviceForm.createSubscription} onChange={(e) => setServiceForm({ ...serviceForm, createSubscription: e.target.checked })} />
              Crear también cobro recurrente en Cobranzas
            </label>
          )}
        </div>
      </FormModal>

      <DetailModal
        open={!!planDetail}
        title={planDetail?.name || 'Plan'}
        subtitle={planDetail ? `${typeLabel[planDetail.type] || planDetail.type} · ${planDetail.billingCycle}` : undefined}
        onClose={() => setPlanDetail(null)}
        footer={planDetail && (
          <>
            <Can anyOf={['servers.manage', 'domains.manage']}>
              <button type="button" onClick={() => { const p = planDetail; setPlanDetail(null); openCreateService(p); }} className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500">
                Vender a cliente
              </button>
              <button type="button" onClick={() => { const p = planDetail; setPlanDetail(null); openEditPlan(p); }} className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500">
                Editar
              </button>
            </Can>
            <button type="button" onClick={() => setPlanDetail(null)} className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-semibold text-sa-muted hover:text-sa-text hover:bg-sa-border/60">Cerrar</button>
          </>
        )}
      >
        {planDetail && (
          <DetailGrid>
            <DetailItem label="Proveedor" value={planDetail.providerName || '—'} />
            <DetailItem label="Plan proveedor" value={planDetail.providerPlanName || '—'} />
            <DetailItem label="Costo" value={money(symbol, planDetail.costPrice)} />
            <DetailItem label="Venta" value={money(symbol, planDetail.sellPrice)} />
            <DetailItem label="Margen" value={money(symbol, planDetail.margin)} />
            <DetailItem label="Web" value={planDetail.isPublic ? 'Visible' : 'Oculto'} />
            <DetailItem label="Descripción" value={planDetail.description} full />
            <DetailItem label="Características" value={(planDetail.features || []).join(' · ')} full />
            <DetailItem label="Notas" value={planDetail.notes} full />
          </DetailGrid>
        )}
      </DetailModal>

      <DetailModal
        open={!!serviceDetail}
        title={serviceDetail?.serviceLabel || 'Servicio'}
        subtitle={serviceDetail?.clientName}
        onClose={() => setServiceDetail(null)}
        footer={serviceDetail && (
          <>
            <Can anyOf={['servers.manage', 'domains.manage', 'clients.manage']}>
              <button type="button" onClick={() => { const s = serviceDetail; setServiceDetail(null); openEditService(s); }} className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500">
                Editar
              </button>
            </Can>
            <button type="button" onClick={() => setServiceDetail(null)} className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-semibold text-sa-muted hover:text-sa-text hover:bg-sa-border/60">Cerrar</button>
          </>
        )}
      >
        {serviceDetail && (
          <DetailGrid>
            <DetailItem label="Estado" value={serviceDetail.status} />
            <DetailItem label="Dominio" value={serviceDetail.domainName || '—'} mono />
            <DetailItem label="Proveedor" value={serviceDetail.providerName || '—'} />
            <DetailItem label="Ciclo" value={serviceDetail.billingCycle} />
            <DetailItem label="Costo" value={money(symbol, serviceDetail.costPrice)} />
            <DetailItem label="Venta" value={money(symbol, serviceDetail.sellPrice)} />
            <DetailItem label="Inicio" value={serviceDetail.startDate || '—'} />
            <DetailItem label="Renovación" value={serviceDetail.renewDate || '—'} />
            <DetailItem label="Cobro vinculado" value={serviceDetail.subscriptionId ? `#${serviceDetail.subscriptionId}` : 'No'} />
            <DetailItem label="Datos entregados al cliente" value={serviceDetail.deliveryNotes} full />
            <DetailItem label="Notas internas" value={serviceDetail.internalNotes} full />
          </DetailGrid>
        )}
      </DetailModal>

      <ConfirmDialog
        isOpen={!!pendingPlanDelete}
        title="Eliminar plan"
        description={`¿Eliminar "${pendingPlanDelete?.name}"? Los servicios ya vendidos se conservan.`}
        confirmText="Eliminar"
        isDestructive
        onCancel={() => setPendingPlanDelete(null)}
        onConfirm={async () => {
          if (!pendingPlanDelete) return;
          await apiMutate('delete', `/api/reseller-plans/${pendingPlanDelete.id}`);
          setPendingPlanDelete(null);
          loadPlans();
        }}
      />

      <ConfirmDialog
        isOpen={!!pendingServiceDelete}
        title="Eliminar servicio"
        description={`¿Quitar el servicio de "${pendingServiceDelete?.clientName}"? El cobro en Cobranzas no se elimina automáticamente.`}
        confirmText="Eliminar"
        isDestructive
        onCancel={() => setPendingServiceDelete(null)}
        onConfirm={async () => {
          if (!pendingServiceDelete) return;
          await apiMutate('delete', `/api/client-services/${pendingServiceDelete.id}`);
          setPendingServiceDelete(null);
          loadServices();
        }}
      />
    </div>
  );
}
