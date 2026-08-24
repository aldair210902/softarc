import React, { useState, useEffect } from 'react';
import { Plus, Search, FileText, CheckCircle2, Clock, MessageCircle, MoreVertical, ChevronDown, Filter, Download } from 'lucide-react';
import { useCompanySettings } from '../../../hooks/useCompanySettings';
import { cn } from '../../../lib/utils';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Can } from '../../../components/Can';
import { apiDownload, apiGet, apiMutate } from '../../../lib/api';
import { Field, FormModal, inputClass } from '../../../components/ui/FormModal';
import { DetailModal, DetailGrid, DetailItem } from '../../../components/ui/DetailModal';
import { ConceptPicker, type ConceptOption } from '../../../components/ui/ConceptPicker';
import { FinancesSubnav } from '../../../components/FinancesSubnav';
import { Client } from '../../../types';
import { useToast } from '../../../components/ui/Toast';

type FilterTab = 'Todos' | 'Pagados' | 'Pendientes' | 'Vencidos';
type PaymentMethodFilter = 'Todos' | 'Yape/Plin' | 'BCP/BBVA' | 'Pasarela Culqi/Stripe';

interface Invoice {
  id: string;
  invoiceNumber: string;
  documentType: 'Recibo' | 'Boleta' | 'Factura';
  emissionMode: 'Prueba' | 'Oficial';
  isPractice?: boolean;
  clientId: string;
  clientName: string;
  clientDocument: string;
  customerName?: string;
  customerDocument?: string;
  customerAddress?: string;
  concept: string;
  amount: number;
  paymentMethod: string;
  operationCode?: string;
  issueDate: string;
  status: 'Pagado' | 'Pendiente' | 'Vencido' | 'Anulado';
  notes?: string;
}

const emptyPayment = {
  clientId: '',
  invoiceNumber: '',
  documentType: 'Recibo' as 'Recibo' | 'Boleta' | 'Factura',
  emissionMode: 'Prueba' as 'Prueba' | 'Oficial',
  customerName: '',
  customerDocument: '',
  customerAddress: '',
  concept: '',
  amount: '',
  paymentMethod: 'Yape',
  operationCode: '',
  issueDate: new Date().toISOString().slice(0, 10),
  status: 'Pagado',
  notes: '',
};

export default function Billing() {
  const { settings } = useCompanySettings();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('Todos');
  const [methodFilter, setMethodFilter] = useState<PaymentMethodFilter>('Todos');
  const [showMethodDropdown, setShowMethodDropdown] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(emptyPayment);
  const [detail, setDetail] = useState<Invoice | null>(null);
  const [concepts, setConcepts] = useState<ConceptOption[]>([]);

  const loadInvoices = () => {
    apiGet<Invoice[]>('/api/transactions')
      .then(setInvoices)
      .catch(() => setInvoices([]));
  };

  useEffect(() => {
    loadInvoices();
    apiGet<Client[]>('/api/clients').then(setClients).catch(() => setClients([]));
    apiGet<ConceptOption[]>('/api/billing-concepts').then(setConcepts).catch(() => setConcepts([]));
  }, []);

  const openCreate = async (preferredType: 'Recibo' | 'Boleta' | 'Factura' = 'Recibo') => {
    setEditingId(null);
    const mode = (settings.billingEmissionMode || 'Prueba') as 'Prueba' | 'Oficial';
    let nextNumber = '';
    try {
      const res = await apiGet<{ invoiceNumber: string; emissionMode: 'Prueba' | 'Oficial' }>(
        `/api/transactions/next-number?documentType=${encodeURIComponent(preferredType)}&emissionMode=${encodeURIComponent(mode)}`,
      );
      nextNumber = res.invoiceNumber || '';
    } catch {
      nextNumber = '';
    }
    const first = clients[0];
    setForm({
      ...emptyPayment,
      clientId: first?.id || '',
      documentType: preferredType,
      emissionMode: mode,
      invoiceNumber: nextNumber,
      customerName: first?.businessName || '',
      customerDocument: first?.documentNumber || '',
      status: preferredType === 'Recibo' ? 'Pagado' : 'Pendiente',
    });
    setModalOpen(true);
  };

  const openEdit = (invoice: Invoice) => {
    setEditingId(invoice.id);
    setForm({
      clientId: invoice.clientId || '',
      invoiceNumber: invoice.invoiceNumber || '',
      documentType: invoice.documentType || 'Recibo',
      emissionMode: invoice.emissionMode || 'Prueba',
      customerName: invoice.customerName || invoice.clientName || '',
      customerDocument: invoice.customerDocument || invoice.clientDocument || '',
      customerAddress: invoice.customerAddress || '',
      concept: invoice.concept || '',
      amount: String(invoice.amount ?? ''),
      paymentMethod: invoice.paymentMethod || 'Yape',
      operationCode: invoice.operationCode || '',
      issueDate: invoice.issueDate?.slice(0, 10) || new Date().toISOString().slice(0, 10),
      status: invoice.status || 'Pagado',
      notes: invoice.notes || '',
    });
    setModalOpen(true);
  };

  const onClientChange = (clientId: string) => {
    const c = clients.find((x) => x.id === clientId);
    setForm((prev) => ({
      ...prev,
      clientId,
      customerName: c?.businessName || '',
      customerDocument: c?.documentNumber || '',
    }));
  };

  const refreshNumber = async (documentType: 'Recibo' | 'Boleta' | 'Factura', emissionMode: 'Prueba' | 'Oficial') => {
    try {
      const res = await apiGet<{ invoiceNumber: string }>(
        `/api/transactions/next-number?documentType=${encodeURIComponent(documentType)}&emissionMode=${encodeURIComponent(emissionMode)}`,
      );
      setForm((prev) => ({ ...prev, invoiceNumber: res.invoiceNumber || prev.invoiceNumber }));
    } catch {
      /* keep current */
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setForm(emptyPayment);
  };

  const savePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        clientId: form.clientId || null,
        invoiceNumber: form.invoiceNumber || null,
        documentType: form.documentType,
        emissionMode: form.emissionMode,
        customerName: form.customerName || null,
        customerDocument: form.customerDocument || null,
        customerAddress: form.customerAddress || null,
        concept: form.concept,
        amount: Number(form.amount),
        paymentMethod: form.paymentMethod,
        operationCode: form.operationCode,
        issueDate: form.issueDate,
        status: form.status,
        notes: form.notes || null,
      };
      if (editingId) {
        await apiMutate('put', `/api/transactions/${editingId}`, payload);
      } else {
        await apiMutate('post', '/api/transactions', payload);
      }
      closeModal();
      loadInvoices();
      toast('success', 'Guardado', form.invoiceNumber || 'Comprobante registrado');
    } catch {
      toast('error', 'Error', 'No se pudo guardar el comprobante.');
    } finally {
      setSubmitting(false);
    }
  };

  const annulInvoice = async (invoice: Invoice) => {
    if (!window.confirm(`¿Anular la factura ${invoice.invoiceNumber}?`)) return;
    await apiMutate('put', `/api/transactions/${invoice.id}`, { status: 'Anulado' });
    loadInvoices();
  };

  const markPaid = async (invoice: Invoice) => {
    try {
      await apiMutate('put', `/api/transactions/${invoice.id}`, { status: 'Pagado' });
      if (detail?.id === invoice.id) {
        setDetail({ ...invoice, status: 'Pagado' });
      }
      loadInvoices();
      toast('success', 'Marcado como pagado', invoice.invoiceNumber);
    } catch {
      toast('error', 'Error', 'No se pudo marcar como pagado.');
    }
  };

  const deleteInvoice = async (invoice: Invoice) => {
    if (!window.confirm(`¿Eliminar la factura ${invoice.invoiceNumber}?`)) return;
    await apiMutate('delete', `/api/transactions/${invoice.id}`);
    loadInvoices();
  };

  const downloadPdf = async (invoice: Invoice) => {
    try {
      await apiDownload(`/api/transactions/${invoice.id}/pdf`, `${invoice.invoiceNumber || 'comprobante'}.pdf`);
      toast('success', 'PDF listo', invoice.invoiceNumber);
    } catch {
      toast('error', 'Error', 'No se pudo generar el PDF.');
    }
  };

  // Metrics
  const totalCollected = invoices.filter(i => i.status === 'Pagado').reduce((sum, i) => sum + i.amount, 0);
  const pendingAmount = invoices.filter(i => i.status === 'Pendiente' || i.status === 'Vencido').reduce((sum, i) => sum + i.amount, 0);
  const issuedCount = invoices.filter(i => i.status !== 'Anulado').length;

  // Filtering
  const filteredInvoices = invoices.filter(invoice => {
    // Search filter
    const matchesSearch = 
      invoice.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.clientDocument.includes(searchTerm) ||
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;

    // Tab filter
    if (activeTab === 'Pagados' && invoice.status !== 'Pagado') return false;
    if (activeTab === 'Pendientes' && invoice.status !== 'Pendiente') return false;
    if (activeTab === 'Vencidos' && invoice.status !== 'Vencido') return false;

    // Method filter
    if (methodFilter !== 'Todos') {
      if (methodFilter === 'Yape/Plin' && !['Yape', 'Plin'].includes(invoice.paymentMethod)) return false;
      if (methodFilter === 'BCP/BBVA' && !['Transferencia BCP', 'Transferencia BBVA'].includes(invoice.paymentMethod)) return false;
      if (methodFilter === 'Pasarela Culqi/Stripe' && !['Tarjeta', 'Stripe', 'Culqi'].includes(invoice.paymentMethod)) return false;
    }

    return true;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
  };

  const getStatusBadge = (status: Invoice['status']) => {
    switch (status) {
      case 'Pagado':
        return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25';
      case 'Pendiente':
        return 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/25';
      case 'Vencido':
        return 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/25';
      case 'Anulado':
        return 'bg-sa-border text-sa-muted border-sa-border-strong';
    }
  };

  const getMethodBadge = (method: string) => {
    if (['Yape', 'Plin'].includes(method)) return 'bg-[#7E3AF2]/10 text-[#6D28D9] dark:text-[#A78BFA] border-[#7E3AF2]/25';
    if (['Transferencia BCP', 'Transferencia BBVA'].includes(method)) return 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/25';
    return 'bg-sa-border text-sa-muted border-sa-border-strong';
  };

  const getWhatsAppMessage = (invoice: Invoice) => {
    if (invoice.status === 'Pagado') {
      return `Hola, te enviamos la constancia de pago de tu comprobante ${invoice.invoiceNumber} por el monto de ${settings.currencySymbol} ${invoice.amount.toFixed(2)}. ¡Gracias por tu preferencia!`;
    }
    return `Hola, te recordamos amablemente que tienes pendiente el pago del comprobante ${invoice.invoiceNumber} por el monto de ${settings.currencySymbol} ${invoice.amount.toFixed(2)}.`;
  };

  return (
    <div className="space-y-6">
      <FinancesSubnav />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-extrabold text-sa-text tracking-tight">Cobranzas</h1>
        <div className="flex items-center gap-3 flex-wrap">
          <Can ability="finances.manage">
            <button
              type="button"
              onClick={() => void openCreate('Recibo')}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/20"
            >
              <Plus className="h-4 w-4 mr-2" />
              Registrar pago
            </button>
            <button
              type="button"
              onClick={() => void openCreate('Boleta')}
              className="inline-flex items-center px-3 py-2.5 rounded-xl text-xs font-semibold text-sa-muted border border-sa-border bg-sa-panel hover:text-sa-text transition-colors"
              title="Solo para practicar el formato. Sin valor tributario en modo Prueba."
            >
              Boleta (práctica)
            </button>
            <button
              type="button"
              onClick={() => void openCreate('Factura')}
              className="inline-flex items-center px-3 py-2.5 rounded-xl text-xs font-semibold text-sa-muted border border-sa-border bg-sa-panel hover:text-sa-text transition-colors"
              title="Solo para practicar el formato. Sin valor tributario en modo Prueba."
            >
              Factura (práctica)
            </button>
          </Can>
        </div>
      </div>

      <div className="rounded-xl border border-emerald-600/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-900 dark:text-emerald-100/90">
        <strong>Sin RUC activo:</strong> usa <strong>Registrar pago</strong> (recibo interno). Queda registrado lo que te pagan,
        con PDF. Las boletas/facturas son opcionales para practicar y también exportan PDF, pero <strong>no son SUNAT</strong>.
      </div>

      {(settings.billingEmissionMode || 'Prueba') === 'Prueba' && (
        <div className="rounded-xl border border-amber-600/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-100/90">
          Modo comprobantes: <strong>Prueba</strong> (series BPR/FPR). Cuando actives el RUC, cámbialo a Oficial en Ajustes.
        </div>
      )}

      <FormModal
        open={modalOpen}
        title={editingId ? 'Editar registro' : form.documentType === 'Recibo' ? 'Registrar pago (recibo interno)' : `Práctica: ${form.documentType}`}
        onClose={closeModal}
        onSubmit={savePayment}
        submitting={submitting}
        submitLabel="Guardar"
        wide
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Cliente">
            <select className={inputClass} value={form.clientId} onChange={(e) => onClientChange(e.target.value)}>
              <option value="">Elegir cliente</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.businessName}</option>
              ))}
            </select>
          </Field>
          <Field label="Método de pago">
            <select className={inputClass} value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}>
              <option>Yape</option>
              <option>Plin</option>
              <option>Transferencia BCP</option>
              <option>Transferencia BBVA</option>
              <option>Tarjeta</option>
            </select>
          </Field>

          {form.clientId ? (
            <div className="sm:col-span-2 rounded-xl border border-sa-border bg-sa-canvas/50 px-3 py-2.5 text-xs text-sa-muted">
              <span className="font-semibold text-sa-text">{form.customerName || 'Cliente'}</span>
              {form.customerDocument ? ` · ${form.customerDocument}` : ''}
            </div>
          ) : (
            <>
              <Field label="Nombre">
                <input className={inputClass} value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} />
              </Field>
              <Field label="RUC / DNI">
                <input className={inputClass} value={form.customerDocument} onChange={(e) => setForm({ ...form, customerDocument: e.target.value })} />
              </Field>
            </>
          )}

          <ConceptPicker
            concept={form.concept}
            amount={form.amount}
            options={concepts}
            currencySymbol={settings.currencySymbol || 'S/'}
            onConceptChange={(concept) => setForm((prev) => ({ ...prev, concept }))}
            onAmountChange={(amount) => setForm((prev) => ({ ...prev, amount }))}
          />

          <Field label="Código operación">
            <input className={inputClass} value={form.operationCode} onChange={(e) => setForm({ ...form, operationCode: e.target.value })} placeholder="De Yape/banco (cuando confirmes)" />
          </Field>
          <Field label="Estado">
            <select className={inputClass} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option>Pagado</option>
              <option>Pendiente</option>
              <option>Vencido</option>
              <option>Anulado</option>
            </select>
          </Field>
          <Field label="Fecha">
            <input type="date" className={inputClass} value={form.issueDate} onChange={(e) => setForm({ ...form, issueDate: e.target.value })} />
          </Field>
          <Field label="Tipo">
            <select
              className={inputClass}
              value={form.documentType}
              onChange={(e) => {
                const documentType = e.target.value as 'Recibo' | 'Boleta' | 'Factura';
                setForm((prev) => ({ ...prev, documentType }));
                if (!editingId) void refreshNumber(documentType, form.emissionMode);
              }}
            >
              <option value="Recibo">Recibo interno</option>
              <option value="Boleta">Boleta (práctica)</option>
              <option value="Factura">Factura (práctica)</option>
            </select>
          </Field>
        </div>
        {form.emissionMode === 'Prueba' && form.documentType !== 'Recibo' && (
          <p className="mt-3 text-xs text-amber-300/90">
            Documento de práctica. No envía nada a SUNAT.
          </p>
        )}
      </FormModal>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-sa-panel border border-sa-border rounded-2xl p-5 flex items-center gap-4 group hover:border-sa-border-strong transition-colors relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl -mr-6 -mt-6"></div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 relative z-10 group-hover:scale-110 transition-transform">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div className="relative z-10">
            <p className="text-[11px] font-bold text-sa-faint uppercase tracking-wider mb-1">Total Recaudado este Mes</p>
            <h3 className="text-2xl font-extrabold text-sa-text">{settings.currencySymbol} {totalCollected.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
          </div>
        </div>

        <div className="bg-sa-panel border border-sa-border rounded-2xl p-5 flex items-center gap-4 group hover:border-sa-border-strong transition-colors relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl -mr-6 -mt-6"></div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 relative z-10 group-hover:scale-110 transition-transform">
            <Clock className="h-6 w-6" />
          </div>
          <div className="relative z-10">
            <p className="text-[11px] font-bold text-sa-faint uppercase tracking-wider mb-1">Pendiente por Cobrar</p>
            <h3 className="text-2xl font-extrabold text-sa-text">{settings.currencySymbol} {pendingAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
          </div>
        </div>

        <div className="bg-sa-panel border border-sa-border rounded-2xl p-5 flex items-center gap-4 group hover:border-sa-border-strong transition-colors relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl -mr-6 -mt-6"></div>
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 relative z-10 group-hover:scale-110 transition-transform">
            <FileText className="h-6 w-6" />
          </div>
          <div className="relative z-10">
            <p className="text-[11px] font-bold text-sa-faint uppercase tracking-wider mb-1">Comprobantes Emitidos</p>
            <h3 className="text-2xl font-extrabold text-sa-text">{issuedCount} <span className="text-sm font-medium text-sa-faint normal-case">Facturas / Boletas</span></h3>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Tabs */}
          <div className="flex items-center gap-1 bg-sa-panel border border-sa-border rounded-xl p-1 overflow-x-auto custom-scrollbar w-full sm:w-auto">
            {(['Todos', 'Pagados', 'Pendientes', 'Vencidos'] as FilterTab[]).map(tab => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap',
                  activeTab === tab
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-sa-muted hover:text-sa-text hover:bg-sa-border/70',
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Method Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMethodDropdown(!showMethodDropdown)}
              className="flex items-center justify-between gap-3 w-full sm:w-auto min-w-[160px] px-3.5 py-2.5 rounded-xl text-sm font-semibold text-sa-text bg-sa-panel border border-sa-border hover:border-sa-border-strong transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Filter className="h-4 w-4 text-sa-muted shrink-0" />
                <span className="truncate">{methodFilter}</span>
              </div>
              <ChevronDown className="h-4 w-4 text-sa-muted shrink-0" />
            </button>

            {showMethodDropdown && (
              <div className="absolute top-full left-0 mt-1 w-full sm:w-56 bg-sa-panel border border-sa-border rounded-xl shadow-xl z-20 py-1 overflow-hidden">
                {(['Todos', 'Yape/Plin', 'BCP/BBVA', 'Pasarela Culqi/Stripe'] as PaymentMethodFilter[]).map(method => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => {
                      setMethodFilter(method);
                      setShowMethodDropdown(false);
                    }}
                    className={cn(
                      'w-full text-left px-4 py-2 text-sm transition-colors',
                      methodFilter === method
                        ? 'bg-blue-600/10 text-blue-700 dark:text-blue-400 font-semibold'
                        : 'text-sa-muted hover:bg-sa-border/70 hover:text-sa-text',
                    )}
                  >
                    {method}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full lg:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-sa-faint" />
          <input 
            type="text" 
            placeholder="Buscar por cliente, RUC o comprobante..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-3 py-2.5 bg-sa-input border border-sa-border rounded-xl text-sa-text text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder-sa-faint"/>
        </div>
      </div>

      {/* Table */}
      <div className="bg-sa-panel border border-sa-border rounded-2xl shadow-sm overflow-hidden">
        {filteredInvoices.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <EmptyState 
              icon={FileText}
              title="No hay comprobantes"
              description="No se encontraron facturas o boletas con los filtros actuales."
            />
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-sm min-w-[1000px]">
              <thead className="bg-sa-border/50 text-sa-faint font-semibold border-b border-sa-border sticky top-0 z-10 backdrop-blur-sm">
                <tr>
                  <th className="px-6 py-4 uppercase tracking-wider text-[11px]">N° Comprobante</th>
                  <th className="px-6 py-4 uppercase tracking-wider text-[11px]">Cliente / RUC</th>
                  <th className="px-6 py-4 uppercase tracking-wider text-[11px]">Concepto</th>
                  <th className="px-6 py-4 uppercase tracking-wider text-[11px]">Monto</th>
                  <th className="px-6 py-4 uppercase tracking-wider text-[11px]">Método</th>
                  <th className="px-6 py-4 uppercase tracking-wider text-[11px]">Emisión</th>
                  <th className="px-6 py-4 uppercase tracking-wider text-[11px]">Estado</th>
                  <th className="px-6 py-4 uppercase tracking-wider text-[11px] text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sa-border">
                {filteredInvoices.map((invoice) => (
                  <tr
                    key={invoice.id}
                    onClick={() => setDetail(invoice)}
                    className="hover:bg-sa-border/50 transition-colors group cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <div className="font-bold text-sa-text text-[13px]">{invoice.invoiceNumber}</div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        <span className="text-[10px] font-semibold text-sa-faint uppercase">{invoice.documentType || 'Recibo'}</span>
                        {(invoice.emissionMode === 'Prueba' || invoice.isPractice) && (
                          <span className="inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                            PRUEBA
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-sa-text text-[13px]">{invoice.clientName}</div>
                      <div className="text-sa-faint text-[11px] mt-0.5">RUC: {invoice.clientDocument}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sa-muted text-[13px] line-clamp-2 max-w-[200px]">{invoice.concept}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-sa-text text-[13px] whitespace-nowrap">
                        {settings.currencySymbol} {invoice.amount.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn("inline-flex items-center px-2 py-1 rounded text-[10px] font-semibold border whitespace-nowrap", getMethodBadge(invoice.paymentMethod))}>
                        {invoice.paymentMethod}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sa-muted text-[13px] whitespace-nowrap">
                      {formatDate(invoice.issueDate)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn("inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold border", getStatusBadge(invoice.status))}>
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => void downloadPdf(invoice)}
                          className="w-8 h-8 rounded-lg bg-sa-canvas border border-sa-border text-sa-muted flex items-center justify-center hover:text-sa-text hover:border-blue-500/40"
                          title="Descargar PDF"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        <a 
                          href={`https://wa.me/?text=${encodeURIComponent(getWhatsAppMessage(invoice))}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-8 h-8 rounded-lg bg-[#25D366]/10 text-[#25D366] flex items-center justify-center hover:bg-[#25D366]/20 transition-all border border-[#25D366]/20 hover:shadow-[0_0_10px_rgba(37,211,102,0.2)]"
                          title="Contactar por WhatsApp"
                        >
                          <MessageCircle className="h-4 w-4" />
                        </a>
                        <div className="relative group/menu">
                          <button
                            type="button"
                            className="w-8 h-8 rounded-lg bg-sa-canvas border border-sa-border text-sa-muted flex items-center justify-center hover:text-sa-text hover:border-blue-500/40"
                            title="Más acciones"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                          <div className="absolute right-0 top-full mt-1 w-44 bg-sa-panel border border-sa-border rounded-lg shadow-xl opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-20">
                            <div className="py-1">
                              <Can ability="finances.manage">
                                {(invoice.status === 'Pendiente' || invoice.status === 'Vencido') && (
                                  <button type="button" onClick={() => void markPaid(invoice)} className="w-full text-left px-4 py-2 text-xs text-emerald-700 dark:text-emerald-400 hover:bg-sa-border transition-colors">Marcar pagado</button>
                                )}
                                <button type="button" onClick={() => openEdit(invoice)} className="w-full text-left px-4 py-2 text-xs text-sa-muted hover:text-sa-text hover:bg-sa-border transition-colors">Editar</button>
                              </Can>
                              <button type="button" onClick={() => annulInvoice(invoice)} className="w-full text-left px-4 py-2 text-xs text-amber-700 dark:text-amber-400 hover:bg-sa-border transition-colors">Anular Factura</button>
                              <Can ability="finances.manage">
                                <button type="button" onClick={() => deleteInvoice(invoice)} className="w-full text-left px-4 py-2 text-xs text-red-700 dark:text-red-400 hover:bg-sa-border transition-colors">Eliminar</button>
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
        title={detail?.invoiceNumber || 'Factura'}
        subtitle={detail?.clientName}
        onClose={() => setDetail(null)}
        wide
        footer={detail && (
          <>
            <Can ability="finances.manage">
              {detail.status !== 'Pagado' && detail.status !== 'Anulado' && (
                <button
                  type="button"
                  onClick={() => void markPaid(detail)}
                  className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 transition-colors"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Marcar pagado
                </button>
              )}
              <button
                type="button"
                onClick={() => void downloadPdf(detail)}
                className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-sa-text bg-sa-panel border border-sa-border hover:border-blue-500/40 transition-colors"
              >
                <Download className="h-3.5 w-3.5" />
                PDF
              </button>
              <button
                type="button"
                onClick={() => { const inv = detail; setDetail(null); openEdit(inv); }} className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors">
                Editar
              </button>
            </Can>
            <button type="button" onClick={() => setDetail(null)} className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-semibold text-sa-muted hover:text-sa-text hover:bg-sa-border/60 transition-colors">Cerrar</button>
          </>
        )}
      >
        {detail && (
          <DetailGrid>
            <DetailItem label="N° Comprobante" value={detail.invoiceNumber} />
            <DetailItem label="Tipo" value={detail.documentType || 'Recibo'} />
            <DetailItem label="Modo" value={detail.emissionMode === 'Prueba' || detail.isPractice ? 'Prueba (sin valor tributario)' : 'Oficial'} />
            <DetailItem label="Cliente" value={detail.clientName} />
            <DetailItem label="Documento" value={detail.clientDocument} />
            <DetailItem label="Dirección" value={detail.customerAddress || '—'} />
            <DetailItem label="Concepto" value={detail.concept} full />
            <DetailItem label="Monto" value={`${settings.currencySymbol} ${detail.amount.toFixed(2)}`} />
            <DetailItem label="Método de pago" value={detail.paymentMethod} />
            <DetailItem label="Código operación" value={detail.operationCode || '—'} />
            <DetailItem label="Fecha de emisión" value={formatDate(detail.issueDate)} />
            <DetailItem label="Estado" value={detail.status} />
            {detail.notes ? <DetailItem label="Notas" value={detail.notes} full /> : null}
          </DetailGrid>
        )}
      </DetailModal>
    </div>
  );
}
