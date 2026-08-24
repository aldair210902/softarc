import React, { useEffect, useState } from 'react';
import { Plus, Search, DollarSign, Calendar, AlertCircle, FileText, MoreVertical, Edit2, Download } from 'lucide-react';
import { useCompanySettings } from '../../../hooks/useCompanySettings';
import { cn } from '../../../lib/utils';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Can } from '../../../components/Can';
import { apiGet, apiMutate } from '../../../lib/api';
import { Field, FormModal, inputClass } from '../../../components/ui/FormModal';
import { DetailModal, DetailGrid, DetailItem } from '../../../components/ui/DetailModal';
import { ProviderSelect } from '../../../components/ProviderSelect';
import { FinancesSubnav } from '../../../components/FinancesSubnav';

type FilterTab = 'Todos' | 'Infraestructura & VPS' | 'Licencias & Software' | 'Dominios' | 'Servicios Terceros';

interface Expense {
  id: string;
  provider: string;
  concept: string;
  category: string;
  frequency: 'Mensual' | 'Anual' | 'Pago Único';
  amount: number;
  date: string;
  status: 'Pagado' | 'Pendiente';
}

const emptyExpense = {
  provider: '',
  concept: '',
  category: 'Infraestructura & VPS',
  frequency: 'Mensual' as const,
  amount: '',
  date: new Date().toISOString().slice(0, 10),
  status: 'Pendiente' as const,
};

export default function Expenses() {
  const { settings } = useCompanySettings();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('Todos');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(emptyExpense);
  const [detail, setDetail] = useState<Expense | null>(null);

  const loadExpenses = () => {
    apiGet<Expense[]>('/api/expenses')
      .then(setExpenses)
      .catch(() => setExpenses([]));
  };

  useEffect(() => {
    loadExpenses();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyExpense);
    setModalOpen(true);
  };

  const openEdit = (expense: Expense) => {
    setEditingId(expense.id);
    setForm({
      provider: expense.provider,
      concept: expense.concept,
      category: expense.category,
      frequency: expense.frequency,
      amount: String(expense.amount),
      date: expense.date?.slice(0, 10) || new Date().toISOString().slice(0, 10),
      status: expense.status,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setForm(emptyExpense);
  };

  const saveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { ...form, amount: Number(form.amount) };
      if (editingId) {
        await apiMutate('put', `/api/expenses/${editingId}`, payload);
      } else {
        await apiMutate('post', '/api/expenses', payload);
      }
      closeModal();
      loadExpenses();
    } finally {
      setSubmitting(false);
    }
  };

  const deleteExpense = async (expense: Expense) => {
    if (!window.confirm(`¿Eliminar el gasto "${expense.concept}"?`)) return;
    await apiMutate('delete', `/api/expenses/${expense.id}`);
    loadExpenses();
  };

  // Metrics
  const totalExpensesThisMonth = expenses
    .filter(e => e.status === 'Pagado')
    .reduce((sum, e) => sum + e.amount, 0);
  
  const recurringCosts = expenses
    .filter(e => e.frequency === 'Mensual' || e.frequency === 'Anual')
    .reduce((sum, e) => {
      return sum + (e.frequency === 'Anual' ? e.amount / 12 : e.amount);
    }, 0);

  const upcomingPayments = expenses.filter(e => e.status === 'Pendiente').length;

  // Filtering
  const filteredExpenses = expenses.filter(expense => {
    // Search filter
    const matchesSearch = 
      expense.provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.concept.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;

    // Tab filter
    if (activeTab !== 'Todos' && expense.category !== activeTab) return false;

    return true;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
  };

  const getStatusBadge = (status: Expense['status']) => {
    switch (status) {
      case 'Pagado':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'Pendiente':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    }
  };

  const getCategoryBadge = (category: string) => {
    switch(category) {
      case 'Infraestructura & VPS': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'Licencias & Software': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'Dominios': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      case 'Servicios Terceros': return 'bg-slate-500/10 text-sa-muted border-slate-500/20';
      default: return 'bg-slate-500/10 text-sa-muted border-slate-500/20';
    }
  };

  return (
    <div className="space-y-6">
      <FinancesSubnav />
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-extrabold text-sa-text tracking-tight">Gastos & Egresos</h1>
        <Can ability="finances.manage">
          <button type="button" onClick={openCreate} className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/20"><Plus className="h-4 w-4 mr-2" />
            Registrar Gasto
          </button>
        </Can>
      </div>

      <FormModal open={modalOpen} title={editingId ? 'Editar Gasto' : 'Registrar Gasto'} onClose={closeModal} onSubmit={saveExpense} submitting={submitting} submitLabel="Guardar Gasto" wide>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Proveedor">
            <ProviderSelect
              value={form.provider}
              onChange={(name) => setForm({ ...form, provider: name })}
              placeholder="Selecciona o escribe proveedor…"
            />
          </Field>
          <Field label="Concepto">
            <input required className={inputClass} value={form.concept} onChange={(e) => setForm({ ...form, concept: e.target.value })} />
          </Field>
          <Field label="Categoría">
            <select className={inputClass} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              <option>Infraestructura & VPS</option>
              <option>Licencias & Software</option>
              <option>Dominios</option>
              <option>Servicios Terceros</option>
            </select>
          </Field>
          <Field label="Frecuencia">
            <select className={inputClass} value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value as Expense['frequency'] })}>
              <option>Mensual</option>
              <option>Anual</option>
              <option>Pago Único</option>
            </select>
          </Field>
          <Field label={`Monto (${settings.currencySymbol})`}>
            <input required type="number" min="0" step="0.01" className={inputClass} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          </Field>
          <Field label="Fecha">
            <input type="date" className={inputClass} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </Field>
          <Field label="Estado">
            <select className={inputClass} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Expense['status'] })}>
              <option>Pendiente</option>
              <option>Pagado</option>
            </select>
          </Field>
        </div>
      </FormModal>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-sa-panel border border-sa-border rounded-2xl p-5 flex items-center gap-4 group hover:border-sa-border-strong transition-colors relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-2xl -mr-6 -mt-6"></div>
          <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 relative z-10 group-hover:scale-110 transition-transform">
            <DollarSign className="h-6 w-6" />
          </div>
          <div className="relative z-10">
            <p className="text-[11px] font-bold text-sa-faint uppercase tracking-wider mb-1">Gastos Totales este Mes</p>
            <h3 className="text-2xl font-extrabold text-sa-text">{settings.currencySymbol} {totalExpensesThisMonth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
          </div>
        </div>

        <div className="bg-sa-panel border border-sa-border rounded-2xl p-5 flex items-center gap-4 group hover:border-sa-border-strong transition-colors relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl -mr-6 -mt-6"></div>
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500 relative z-10 group-hover:scale-110 transition-transform">
            <Calendar className="h-6 w-6" />
          </div>
          <div className="relative z-10">
            <p className="text-[11px] font-bold text-sa-faint uppercase tracking-wider mb-1">Costos Fijos Recurrentes</p>
            <h3 className="text-2xl font-extrabold text-sa-text">{settings.currencySymbol} {recurringCosts.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-sm font-medium text-sa-faint normal-case">/mes aprox.</span></h3>
          </div>
        </div>

        <div className="bg-sa-panel border border-sa-border rounded-2xl p-5 flex items-center gap-4 group hover:border-sa-border-strong transition-colors relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl -mr-6 -mt-6"></div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 relative z-10 group-hover:scale-110 transition-transform">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div className="relative z-10">
            <p className="text-[11px] font-bold text-sa-faint uppercase tracking-wider mb-1">Próximos Vencimientos</p>
            <h3 className="text-2xl font-extrabold text-sa-text">{upcomingPayments} <span className="text-sm font-medium text-sa-faint normal-case">pagos pendientes</span></h3>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        {/* Tabs */}
        <div className="flex items-center gap-1 bg-sa-panel border border-sa-border rounded-xl p-1 overflow-x-auto custom-scrollbar w-full xl:w-auto">
          {(['Todos', 'Infraestructura & VPS', 'Licencias & Software', 'Dominios', 'Servicios Terceros'] as FilterTab[]).map(tab => (
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
              {tab}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full xl:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-sa-faint" />
          <input 
            type="text" 
            placeholder="Buscar por proveedor o concepto..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-3 py-2.5 bg-sa-input border border-sa-border rounded-xl text-sa-text text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder-sa-faint"/>
        </div>
      </div>

      {/* Table */}
      <div className="bg-sa-panel border border-sa-border rounded-2xl shadow-sm overflow-hidden">
        {filteredExpenses.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <EmptyState 
              icon={FileText}
              title="No hay egresos"
              description="No se encontraron registros de gastos con los filtros actuales."
            />
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-sm min-w-[1000px]">
              <thead className="bg-sa-border/50 text-sa-faint font-semibold border-b border-sa-border sticky top-0 z-10 backdrop-blur-sm">
                <tr>
                  <th className="px-6 py-4 uppercase tracking-wider text-[11px]">Proveedor / Concepto</th>
                  <th className="px-6 py-4 uppercase tracking-wider text-[11px]">Categoría</th>
                  <th className="px-6 py-4 uppercase tracking-wider text-[11px]">Frecuencia</th>
                  <th className="px-6 py-4 uppercase tracking-wider text-[11px]">Monto</th>
                  <th className="px-6 py-4 uppercase tracking-wider text-[11px]">Fecha de Pago</th>
                  <th className="px-6 py-4 uppercase tracking-wider text-[11px]">Estado</th>
                  <th className="px-6 py-4 uppercase tracking-wider text-[11px] text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E293B]">
                {filteredExpenses.map((expense) => (
                  <tr
                    key={expense.id}
                    onClick={() => setDetail(expense)}
                    className="hover:bg-sa-border/50 transition-colors group cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <div className="font-bold text-sa-text text-[13px]">{expense.provider}</div>
                      <div className="text-sa-faint text-[11px] mt-0.5">{expense.concept}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn("inline-flex items-center px-2 py-1 rounded text-[10px] font-semibold border whitespace-nowrap", getCategoryBadge(expense.category))}>
                        {expense.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sa-muted text-[13px] whitespace-nowrap">{expense.frequency}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-red-400 text-[13px] whitespace-nowrap">
                        -{settings.currencySymbol} {expense.amount.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sa-muted text-[13px] whitespace-nowrap">
                      {formatDate(expense.date)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn("inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold border", getStatusBadge(expense.status))}>
                        {expense.status}
                      </span>
                    </td>
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <button title="Ver Comprobante">
                          <Download className="h-4 w-4" />
                        </button>
                        <Can ability="finances.manage">
                          <button 
                            type="button"
                            onClick={() => openEdit(expense)} title="Editar Registro"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                        </Can>
                        <Can ability="finances.manage">
                          <div className="relative group/menu">
                            <button type="button" className="p-2 rounded-lg text-sa-faint hover:text-sa-text hover:bg-sa-border/60 transition-colors"><MoreVertical className="h-4 w-4" />
                            </button>
                            <div className="absolute right-0 top-full mt-1 w-32 bg-sa-border border border-sa-border-strong rounded-lg shadow-xl opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-20">
                              <div className="py-1">
                                <button type="button" onClick={() => openEdit(expense)} className="w-full text-left px-4 py-2 text-xs text-sa-muted hover:text-sa-text hover:bg-sa-border-strong transition-colors">Editar</button>
                                <button type="button" onClick={() => deleteExpense(expense)} className="w-full text-left px-4 py-2 text-xs text-red-400 hover:bg-sa-border-strong transition-colors">Eliminar</button>
                              </div>
                            </div>
                          </div>
                        </Can>
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
        title={detail?.concept || 'Gasto'}
        subtitle={detail?.provider}
        onClose={() => setDetail(null)}
        wide
        footer={detail && (
          <>
            <Can ability="finances.manage">
              <button
                type="button"
                onClick={() => { const e = detail; setDetail(null); openEdit(e); }} className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors">
                Editar
              </button>
            </Can>
            <button type="button" onClick={() => setDetail(null)} className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-semibold text-sa-muted hover:text-sa-text hover:bg-sa-border/60 transition-colors">Cerrar</button>
          </>
        )}
      >
        {detail && (
          <DetailGrid>
            <DetailItem label="Proveedor" value={detail.provider} />
            <DetailItem label="Concepto" value={detail.concept} />
            <DetailItem label="Categoría" value={detail.category} />
            <DetailItem label="Frecuencia" value={detail.frequency} />
            <DetailItem label="Monto" value={`${settings.currencySymbol} ${detail.amount.toFixed(2)}`} />
            <DetailItem label="Fecha" value={formatDate(detail.date)} />
            <DetailItem label="Estado" value={detail.status} />
          </DetailGrid>
        )}
      </DetailModal>
    </div>
  );
}
