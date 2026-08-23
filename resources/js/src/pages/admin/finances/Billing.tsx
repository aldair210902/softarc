import React, { useState, useEffect } from 'react';
import { Plus, Search, FileText, Download, CheckCircle2, AlertCircle, Clock, MessageCircle, MoreVertical, ChevronDown, Filter } from 'lucide-react';
import { useCompanySettings } from '../../../hooks/useCompanySettings';
import { cn } from '../../../lib/utils';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Can } from '../../../components/Can';
import { apiGet, apiMutate } from '../../../lib/api';
import { Field, FormModal, inputClass } from '../../../components/ui/FormModal';
import { DetailModal, DetailGrid, DetailItem } from '../../../components/ui/DetailModal';
import { Client } from '../../../types';

type FilterTab = 'Todos' | 'Pagados' | 'Pendientes' | 'Vencidos';
type PaymentMethodFilter = 'Todos' | 'Yape/Plin' | 'BCP/BBVA' | 'Pasarela Culqi/Stripe';

interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  clientName: string;
  clientDocument: string;
  concept: string;
  amount: number;
  paymentMethod: string;
  issueDate: string;
  status: 'Pagado' | 'Pendiente' | 'Vencido' | 'Anulado';
}

const emptyPayment = {
  clientId: '',
  invoiceNumber: '',
  concept: '',
  amount: '',
  paymentMethod: 'Yape',
  operationCode: '',
  issueDate: new Date().toISOString().slice(0, 10),
  status: 'Pagado',
};

export default function Billing() {
  const { settings } = useCompanySettings();
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

  const loadInvoices = () => {
    apiGet<Invoice[]>('/api/transactions')
      .then(setInvoices)
      .catch(() => setInvoices([]));
  };

  useEffect(() => {
    loadInvoices();
    apiGet<Client[]>('/api/clients').then(setClients).catch(() => setClients([]));
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...emptyPayment, clientId: clients[0]?.id || '' });
    setModalOpen(true);
  };

  const openEdit = (invoice: Invoice) => {
    setEditingId(invoice.id);
    setForm({
      clientId: invoice.clientId || '',
      invoiceNumber: invoice.invoiceNumber || '',
      concept: invoice.concept || '',
      amount: String(invoice.amount ?? ''),
      paymentMethod: invoice.paymentMethod || 'Yape',
      operationCode: '',
      issueDate: invoice.issueDate?.slice(0, 10) || new Date().toISOString().slice(0, 10),
      status: invoice.status || 'Pagado',
    });
    setModalOpen(true);
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
        invoiceNumber: form.invoiceNumber,
        concept: form.concept,
        amount: Number(form.amount),
        paymentMethod: form.paymentMethod,
        operationCode: form.operationCode,
        issueDate: form.issueDate,
        status: form.status,
      };
      if (editingId) {
        await apiMutate('put', `/api/transactions/${editingId}`, payload);
      } else {
        await apiMutate('post', '/api/transactions', payload);
      }
      closeModal();
      loadInvoices();
    } finally {
      setSubmitting(false);
    }
  };

  const annulInvoice = async (invoice: Invoice) => {
    if (!window.confirm(`¿Anular la factura ${invoice.invoiceNumber}?`)) return;
    await apiMutate('put', `/api/transactions/${invoice.id}`, { status: 'Anulado' });
    loadInvoices();
  };

  const deleteInvoice = async (invoice: Invoice) => {
    if (!window.confirm(`¿Eliminar la factura ${invoice.invoiceNumber}?`)) return;
    await apiMutate('delete', `/api/transactions/${invoice.id}`);
    loadInvoices();
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
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'Pendiente':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'Vencido':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'Anulado':
        return 'bg-sa-border text-sa-muted border-sa-border-strong';
    }
  };

  const getMethodBadge = (method: string) => {
    if (['Yape', 'Plin'].includes(method)) return 'bg-[#7E3AF2]/10 text-[#7E3AF2] border-[#7E3AF2]/20';
    if (['Transferencia BCP', 'Transferencia BBVA'].includes(method)) return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
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
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-extrabold text-sa-text tracking-tight">Cobranzas & Facturas</h1>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="inline-flex items-center px-4 py-2.5 rounded-xl text-sm font-semibold text-sa-muted border border-sa-border bg-sa-panel hover:bg-sa-border/50 hover:text-sa-text transition-colors"
          >
            <FileText className="h-4 w-4 mr-2 text-sa-muted" />
            Emitir Factura
          </button>
          <Can ability="finances.manage">
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/20"
            >
              <Plus className="h-4 w-4 mr-2" />
              Registrar Pago
            </button>
          </Can>
        </div>
      </div>

      <FormModal open={modalOpen} title={editingId ? 'Editar Pago' : 'Registrar Pago'} onClose={closeModal} onSubmit={savePayment} submitting={submitting} submitLabel="Guardar Pago" wide>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Cliente">
            <select className={inputClass} value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })}>
              <option value="">Sin cliente</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.businessName}</option>)}
            </select>
          </Field>
          <Field label="N° Comprobante">
            <input className={inputClass} value={form.invoiceNumber} onChange={(e) => setForm({ ...form, invoiceNumber: e.target.value })} placeholder="F001-00132" />
          </Field>
          <Field label="Concepto">
            <input required className={inputClass} value={form.concept} onChange={(e) => setForm({ ...form, concept: e.target.value })} />
          </Field>
          <Field label={`Monto (${settings.currencySymbol})`}>
            <input required type="number" min="0" step="0.01" className={inputClass} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
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
          <Field label="Código operación">
            <input className={inputClass} value={form.operationCode} onChange={(e) => setForm({ ...form, operationCode: e.target.value })} />
          </Field>
          <Field label="Fecha">
            <input type="date" className={inputClass} value={form.issueDate} onChange={(e) => setForm({ ...form, issueDate: e.target.value })} />
          </Field>
          <Field label="Estado">
            <select className={inputClass} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option>Pagado</option>
              <option>Pendiente</option>
              <option>Vencido</option>
              <option>Anulado</option>
            </select>
          </Field>
        </div>
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

          {/* Method Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setShowMethodDropdown(!showMethodDropdown)}>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <span className="truncate">{methodFilter}</span>
              </div>
              <ChevronDown className="h-4 w-4" />
            </button>

            {showMethodDropdown && (
              <div className="absolute top-full left-0 mt-1 w-full sm:w-56 bg-sa-panel border border-sa-border rounded-xl shadow-xl z-20 py-1 overflow-hidden">
                {(['Todos', 'Yape/Plin', 'BCP/BBVA', 'Pasarela Culqi/Stripe'] as PaymentMethodFilter[]).map(method => (
                  <button
                    key={method}
                    onClick={() => {
                      setMethodFilter(method);
                      setShowMethodDropdown(false);
                    }}
                    className={cn(
                      "w-full text-left px-4 py-2 text-sm transition-colors",
                      methodFilter === method ? "bg-sa-border text-sa-text font-medium" : "text-sa-muted hover:bg-sa-border/50 hover:text-sa-text"
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
              <tbody className="divide-y divide-[#1E293B]">
                {filteredInvoices.map((invoice) => (
                  <tr
                    key={invoice.id}
                    onClick={() => setDetail(invoice)}
                    className="hover:bg-sa-border/50 transition-colors group cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <div className="font-bold text-sa-text text-[13px]">{invoice.invoiceNumber}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div >{invoice.clientName}</div>
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
                        <button title="Ver PDF">
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
                          <button >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                          <div className="absolute right-0 top-full mt-1 w-32 bg-sa-border border border-sa-border-strong rounded-lg shadow-xl opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-20">
                            <div className="py-1">
                              <Can ability="finances.manage">
                                <button type="button" onClick={() => openEdit(invoice)} className="w-full text-left px-4 py-2 text-xs text-sa-muted hover:text-sa-text hover:bg-sa-border-strong transition-colors">Editar</button>
                              </Can>
                              <button type="button" onClick={() => annulInvoice(invoice)} className="w-full text-left px-4 py-2 text-xs text-amber-400 hover:bg-sa-border-strong transition-colors">Anular Factura</button>
                              <Can ability="finances.manage">
                                <button type="button" onClick={() => deleteInvoice(invoice)} className="w-full text-left px-4 py-2 text-xs text-red-400 hover:bg-sa-border-strong transition-colors">Eliminar</button>
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
            <DetailItem label="Cliente" value={detail.clientName} />
            <DetailItem label="Documento" value={detail.clientDocument} />
            <DetailItem label="Concepto" value={detail.concept} full />
            <DetailItem label="Monto" value={`${settings.currencySymbol} ${detail.amount.toFixed(2)}`} />
            <DetailItem label="Método de pago" value={detail.paymentMethod} />
            <DetailItem label="Fecha de emisión" value={formatDate(detail.issueDate)} />
            <DetailItem label="Estado" value={detail.status} />
          </DetailGrid>
        )}
      </DetailModal>
    </div>
  );
}
