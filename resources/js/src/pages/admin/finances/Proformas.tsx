import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  ClipboardList,
  Download,
  FileText,
  MessageCircle,
  PenLine,
  Plus,
  Search,
  Send,
  Trash2,
} from 'lucide-react';
import { useCompanySettings } from '../../../hooks/useCompanySettings';
import { apiDownload, apiGet, apiMutate } from '../../../lib/api';
import { Can } from '../../../components/Can';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Field, FormModal, inputClass } from '../../../components/ui/FormModal';
import { DetailModal, DetailGrid, DetailItem } from '../../../components/ui/DetailModal';
import { ConceptPicker, type ConceptOption } from '../../../components/ui/ConceptPicker';
import { FinancesSubnav } from '../../../components/FinancesSubnav';
import { useToast } from '../../../components/ui/Toast';
import { Client } from '../../../types';
import { cn } from '../../../lib/utils';

type StatusTab = 'Todos' | 'Borrador' | 'Enviada' | 'Aceptada' | 'Anulada';

type Proforma = {
  id: string;
  number: string;
  clientId: string;
  clientName: string;
  customerName: string;
  customerDocument: string;
  customerAddress: string;
  concept: string;
  amount: number;
  currencySymbol: string;
  issueDate: string;
  validUntil: string;
  status: string;
  notes: string;
};

const empty = {
  clientId: '',
  number: '',
  customerName: '',
  customerDocument: '',
  customerAddress: '',
  concept: '',
  amount: '',
  issueDate: new Date().toISOString().slice(0, 10),
  validUntil: '',
  status: 'Borrador',
  notes: '',
};

function statusBadge(status: string) {
  switch (status) {
    case 'Aceptada':
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25';
    case 'Enviada':
      return 'bg-blue-500/10 text-blue-400 border-blue-500/25';
    case 'Anulada':
      return 'bg-sa-border text-sa-faint border-sa-border-strong';
    default:
      return 'bg-amber-500/10 text-amber-300 border-amber-500/25';
  }
}

export default function Proformas() {
  const { settings } = useCompanySettings();
  const { toast } = useToast();
  const symbol = settings.currencySymbol || 'S/';
  const [items, setItems] = useState<Proforma[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusTab, setStatusTab] = useState<StatusTab>('Todos');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(empty);
  const [detail, setDetail] = useState<Proforma | null>(null);
  const [concepts, setConcepts] = useState<ConceptOption[]>([]);
  const [showExtra, setShowExtra] = useState(false);

  const load = () => {
    apiGet<Proforma[]>('/api/proformas').then(setItems).catch(() => setItems([]));
  };

  useEffect(() => {
    load();
    apiGet<Client[]>('/api/clients').then(setClients).catch(() => setClients([]));
    apiGet<ConceptOption[]>('/api/billing-concepts').then(setConcepts).catch(() => setConcepts([]));
  }, []);

  const openCreate = async () => {
    setEditingId(null);
    setShowExtra(false);
    let number = '';
    try {
      const res = await apiGet<{ number: string }>('/api/proformas/next-number');
      number = res.number || '';
    } catch {
      number = '';
    }
    setForm({
      ...empty,
      number,
      clientId: '',
      customerName: '',
      customerDocument: '',
      validUntil: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    });
    setModalOpen(true);
  };

  const openEdit = (p: Proforma) => {
    setEditingId(p.id);
    setShowExtra(Boolean(p.customerAddress || p.notes));
    setForm({
      clientId: p.clientId || '',
      number: p.number,
      customerName: p.customerName || p.clientName || '',
      customerDocument: p.customerDocument || '',
      customerAddress: p.customerAddress || '',
      concept: p.concept,
      amount: String(p.amount),
      issueDate: p.issueDate?.slice(0, 10) || '',
      validUntil: p.validUntil?.slice(0, 10) || '',
      status: p.status || 'Borrador',
      notes: p.notes || '',
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

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        clientId: form.clientId || null,
        number: form.number || null,
        customerName: form.customerName || null,
        customerDocument: form.customerDocument || null,
        customerAddress: form.customerAddress || null,
        concept: form.concept,
        amount: Number(form.amount),
        currencySymbol: symbol,
        issueDate: form.issueDate,
        validUntil: form.validUntil || null,
        status: form.status,
        notes: form.notes || null,
      };
      if (editingId) {
        await apiMutate('put', `/api/proformas/${editingId}`, payload);
      } else {
        await apiMutate('post', '/api/proformas', payload);
      }
      setModalOpen(false);
      load();
      toast('success', 'Proforma guardada', form.number);
    } catch {
      toast('error', 'Error', 'No se pudo guardar la proforma.');
    } finally {
      setSubmitting(false);
    }
  };

  const downloadPdf = async (p: Proforma) => {
    try {
      await apiDownload(`/api/proformas/${p.id}/pdf`, `${p.number}.pdf`);
      toast('success', 'PDF listo', p.number);
    } catch {
      toast('error', 'Error', 'No se pudo generar el PDF.');
    }
  };

  const markStatus = async (p: Proforma, status: string) => {
    try {
      await apiMutate('put', `/api/proformas/${p.id}`, { status });
      if (detail?.id === p.id) setDetail({ ...p, status });
      load();
      toast('success', 'Estado actualizado', status);
    } catch {
      toast('error', 'Error', 'No se pudo actualizar el estado.');
    }
  };

  const remove = async (p: Proforma) => {
    if (!window.confirm(`¿Eliminar la proforma ${p.number}?`)) return;
    await apiMutate('delete', `/api/proformas/${p.id}`);
    if (detail?.id === p.id) setDetail(null);
    load();
  };

  const filtered = useMemo(() => {
    return items.filter((p) => {
      if (statusTab !== 'Todos' && p.status !== statusTab) return false;
      const q = searchTerm.toLowerCase().trim();
      if (!q) return true;
      return (
        p.number.toLowerCase().includes(q) ||
        (p.customerName || p.clientName || '').toLowerCase().includes(q) ||
        (p.customerDocument || '').toLowerCase().includes(q) ||
        (p.concept || '').toLowerCase().includes(q)
      );
    });
  }, [items, searchTerm, statusTab]);

  const kpis = useMemo(() => {
    const active = items.filter((p) => p.status !== 'Anulada');
    return {
      total: items.length,
      drafts: items.filter((p) => p.status === 'Borrador').length,
      sent: items.filter((p) => p.status === 'Enviada').length,
      accepted: items.filter((p) => p.status === 'Aceptada').length,
      amount: active.reduce((sum, p) => sum + Number(p.amount || 0), 0),
    };
  }, [items]);

  const formatDate = (value?: string) => {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }).format(d);
  };

  const whatsappHref = (p: Proforma) => {
    const wa = (settings.salesWhatsapp || '').replace(/\D/g, '');
    const text = `Hola, te envío la proforma ${p.number} por ${p.currencySymbol || symbol} ${Number(p.amount).toFixed(2)} — ${p.concept}.`;
    return wa ? `https://wa.me/${wa}?text=${encodeURIComponent(text)}` : `https://wa.me/?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="space-y-6">
      <FinancesSubnav />

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-sa-text tracking-tight">Proformas</h1>
          <p className="text-sm text-sa-muted mt-1 max-w-xl">
            Cotizaciones en PDF para enviar al cliente. Cuando acepten y te paguen, registra el cobro en{' '}
            <Link to="/admin/finances/billing" className="text-blue-700 dark:text-blue-400 hover:underline font-semibold">
              Cobranzas
            </Link>
            .
          </p>
        </div>
        <Can ability="finances.manage">
          <button
            type="button"
            onClick={() => void openCreate()}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-900/20"
          >
            <Plus className="h-4 w-4" /> Nueva proforma
          </button>
        </Can>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-sa-panel border border-sa-border rounded-2xl p-4">
          <div className="flex items-center gap-2 text-sa-faint text-[11px] font-bold uppercase tracking-wider mb-2">
            <ClipboardList className="h-3.5 w-3.5" /> Total
          </div>
          <div className="text-2xl font-extrabold text-sa-text">{kpis.total}</div>
        </div>
        <div className="bg-sa-panel border border-sa-border rounded-2xl p-4">
          <div className="flex items-center gap-2 text-amber-400/80 text-[11px] font-bold uppercase tracking-wider mb-2">
            <PenLine className="h-3.5 w-3.5" /> Borradores
          </div>
          <div className="text-2xl font-extrabold text-sa-text">{kpis.drafts}</div>
        </div>
        <div className="bg-sa-panel border border-sa-border rounded-2xl p-4">
          <div className="flex items-center gap-2 text-blue-400/80 text-[11px] font-bold uppercase tracking-wider mb-2">
            <Send className="h-3.5 w-3.5" /> Enviadas
          </div>
          <div className="text-2xl font-extrabold text-sa-text">{kpis.sent}</div>
        </div>
        <div className="bg-sa-panel border border-sa-border rounded-2xl p-4">
          <div className="flex items-center gap-2 text-emerald-400/80 text-[11px] font-bold uppercase tracking-wider mb-2">
            <CheckCircle2 className="h-3.5 w-3.5" /> Monto activo
          </div>
          <div className="text-xl font-extrabold text-sa-text">
            {symbol} {kpis.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-sa-faint mt-0.5">{kpis.accepted} aceptada(s)</div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-1 bg-sa-panel border border-sa-border rounded-xl p-1 overflow-x-auto">
          {(['Todos', 'Borrador', 'Enviada', 'Aceptada', 'Anulada'] as StatusTab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setStatusTab(tab)}
              className={cn(
                'px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all',
                statusTab === tab ? 'bg-sa-border text-sa-text shadow-sm' : 'text-sa-faint hover:text-sa-muted',
              )}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="relative w-full lg:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-sa-faint" />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por N°, cliente, RUC o concepto..."
            className="w-full pl-10 pr-3 py-2.5 bg-sa-input border border-sa-border rounded-xl text-sa-text text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      <FormModal
        open={modalOpen}
        title={editingId ? 'Editar proforma' : 'Nueva proforma'}
        onClose={() => setModalOpen(false)}
        onSubmit={save}
        submitting={submitting}
        submitLabel="Guardar"
        wide
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Cliente">
            <select className={inputClass} value={form.clientId} onChange={(e) => onClientChange(e.target.value)}>
              <option value="">Elegir cliente (rellena nombre y RUC)</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.businessName}</option>
              ))}
            </select>
          </Field>
          <Field label="Estado">
            <select className={inputClass} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option>Borrador</option>
              <option>Enviada</option>
              <option>Aceptada</option>
              <option>Anulada</option>
            </select>
          </Field>

          {!form.clientId && (
            <>
              <Field label="Nombre del cliente">
                <input
                  className={inputClass}
                  value={form.customerName}
                  onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                  placeholder="Si aún no está en Clientes"
                />
              </Field>
              <Field label="RUC / DNI">
                <input
                  className={inputClass}
                  value={form.customerDocument}
                  onChange={(e) => setForm({ ...form, customerDocument: e.target.value })}
                />
              </Field>
            </>
          )}

          {form.clientId && (
            <div className="sm:col-span-2 rounded-xl border border-sa-border bg-sa-canvas/50 px-3 py-2.5 text-xs text-sa-muted">
              <span className="font-semibold text-sa-text">{form.customerName || 'Cliente'}</span>
              {form.customerDocument ? ` · ${form.customerDocument}` : ''}
              <span className="text-sa-faint"> (se completa solo al elegir cliente)</span>
            </div>
          )}

          <ConceptPicker
            concept={form.concept}
            amount={form.amount}
            options={concepts}
            currencySymbol={symbol}
            onConceptChange={(concept) => setForm((prev) => ({ ...prev, concept }))}
            onAmountChange={(amount) => setForm((prev) => ({ ...prev, amount }))}
          />

          <Field label="Fecha emisión">
            <input type="date" className={inputClass} value={form.issueDate} onChange={(e) => setForm({ ...form, issueDate: e.target.value })} />
          </Field>
          <div>
            <Field label="Válida hasta">
              <input type="date" className={inputClass} value={form.validUntil} onChange={(e) => setForm({ ...form, validUntil: e.target.value })} />
            </Field>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {[7, 15, 30].map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      validUntil: new Date(Date.now() + days * 86400000).toISOString().slice(0, 10),
                    }))
                  }
                  className="px-2.5 py-1 rounded-lg text-[11px] font-semibold border border-sa-border text-sa-muted hover:text-sa-text hover:border-blue-500/40"
                >
                  +{days} días
                </button>
              ))}
            </div>
          </div>

          <div className="sm:col-span-2">
            <button
              type="button"
              onClick={() => setShowExtra((v) => !v)}
              className="text-xs font-semibold text-blue-400 hover:text-blue-300"
            >
              {showExtra ? 'Ocultar' : 'Mostrar'} dirección y notas (opcional)
            </button>
          </div>

          {showExtra && (
            <>
              <Field label="Dirección">
                <input className={inputClass} value={form.customerAddress} onChange={(e) => setForm({ ...form, customerAddress: e.target.value })} />
              </Field>
              <Field label="N° proforma">
                <input className={inputClass} value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Notas / condiciones">
                  <textarea
                    className={cn(inputClass, 'min-h-[70px]')}
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    placeholder="Forma de pago, qué incluye…"
                  />
                </Field>
              </div>
            </>
          )}
        </div>
      </FormModal>

      <div className="bg-sa-panel border border-sa-border rounded-2xl overflow-hidden shadow-sm">
        {filtered.length === 0 ? (
          <div className="p-10">
            <EmptyState
              icon={FileText}
              title={items.length === 0 ? 'Aún no hay proformas' : 'Sin resultados'}
              description={
                items.length === 0
                  ? 'Crea una cotización, descárgala en PDF y envíala por WhatsApp.'
                  : 'Prueba otro filtro o búsqueda.'
              }
            />
            {items.length === 0 && (
              <div className="flex justify-center mt-4">
                <Can ability="finances.manage">
                  <button
                    type="button"
                    onClick={() => void openCreate()}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-500"
                  >
                    <Plus className="h-4 w-4" /> Crear primera proforma
                  </button>
                </Can>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-sm min-w-[980px]">
              <thead className="bg-sa-border/50 text-sa-faint text-[11px] uppercase tracking-wider sticky top-0">
                <tr>
                  <th className="px-5 py-3.5">N°</th>
                  <th className="px-5 py-3.5">Cliente</th>
                  <th className="px-5 py-3.5">Concepto</th>
                  <th className="px-5 py-3.5">Monto</th>
                  <th className="px-5 py-3.5">Emisión</th>
                  <th className="px-5 py-3.5">Vence</th>
                  <th className="px-5 py-3.5">Estado</th>
                  <th className="px-5 py-3.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sa-border">
                {filtered.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => setDetail(p)}
                    className="hover:bg-sa-border/40 transition-colors cursor-pointer"
                  >
                    <td className="px-5 py-3.5 font-bold text-sa-text">{p.number}</td>
                    <td className="px-5 py-3.5">
                      <div className="text-sa-text font-medium">{p.customerName || p.clientName || '—'}</div>
                      <div className="text-[11px] text-sa-faint mt-0.5">{p.customerDocument || 'Sin documento'}</div>
                    </td>
                    <td className="px-5 py-3.5 text-sa-muted max-w-[240px]">
                      <span className="line-clamp-2">{p.concept}</span>
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-sa-text whitespace-nowrap">
                      {p.currencySymbol || symbol} {Number(p.amount).toFixed(2)}
                    </td>
                    <td className="px-5 py-3.5 text-sa-muted whitespace-nowrap">{formatDate(p.issueDate)}</td>
                    <td className="px-5 py-3.5 text-sa-muted whitespace-nowrap">{formatDate(p.validUntil)}</td>
                    <td className="px-5 py-3.5">
                      <span className={cn('inline-flex px-2 py-1 rounded-md text-[11px] font-bold border', statusBadge(p.status))}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => void downloadPdf(p)}
                          className="p-2 rounded-lg border border-sa-border text-sa-muted hover:text-sa-text hover:border-blue-500/40"
                          title="Descargar PDF"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        <a
                          href={whatsappHref(p)}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 rounded-lg border border-[#25D366]/25 text-[#25D366] hover:bg-[#25D366]/10"
                          title="WhatsApp"
                        >
                          <MessageCircle className="h-4 w-4" />
                        </a>
                        <Can ability="finances.manage">
                          <button
                            type="button"
                            onClick={() => openEdit(p)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-sa-border text-sa-muted hover:text-sa-text"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => void remove(p)}
                            className="p-2 rounded-lg border border-sa-border text-red-400 hover:bg-red-500/10"
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
        )}
      </div>

      <DetailModal
        open={!!detail}
        title={detail?.number || 'Proforma'}
        subtitle={detail?.customerName || detail?.clientName}
        onClose={() => setDetail(null)}
        wide
        footer={detail && (
          <>
            <button
              type="button"
              onClick={() => void downloadPdf(detail)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-sa-text bg-sa-panel border border-sa-border hover:border-blue-500/40"
            >
              <Download className="h-3.5 w-3.5" /> PDF
            </button>
            <a
              href={whatsappHref(detail)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500"
            >
              <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
            </a>
            <Can ability="finances.manage">
              {detail.status === 'Borrador' && (
                <button
                  type="button"
                  onClick={() => void markStatus(detail, 'Enviada')}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-500/15 text-blue-300 border border-blue-500/30"
                >
                  Marcar enviada
                </button>
              )}
              {(detail.status === 'Enviada' || detail.status === 'Borrador') && (
                <button
                  type="button"
                  onClick={() => void markStatus(detail, 'Aceptada')}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                >
                  Marcar aceptada
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  const p = detail;
                  setDetail(null);
                  openEdit(p);
                }}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500"
              >
                Editar
              </button>
            </Can>
            <button type="button" onClick={() => setDetail(null)} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-sa-muted hover:text-sa-text">
              Cerrar
            </button>
          </>
        )}
      >
        {detail && (
          <DetailGrid>
            <DetailItem label="N°" value={detail.number} />
            <DetailItem label="Estado" value={detail.status} />
            <DetailItem label="Cliente" value={detail.customerName || detail.clientName || '—'} />
            <DetailItem label="Documento" value={detail.customerDocument || '—'} />
            <DetailItem label="Dirección" value={detail.customerAddress || '—'} full />
            <DetailItem label="Concepto" value={detail.concept} full />
            <DetailItem label="Monto" value={`${detail.currencySymbol || symbol} ${Number(detail.amount).toFixed(2)}`} />
            <DetailItem label="Emisión" value={formatDate(detail.issueDate)} />
            <DetailItem label="Válida hasta" value={formatDate(detail.validUntil)} />
            {detail.notes ? <DetailItem label="Notas" value={detail.notes} full /> : null}
          </DetailGrid>
        )}
      </DetailModal>
    </div>
  );
}
