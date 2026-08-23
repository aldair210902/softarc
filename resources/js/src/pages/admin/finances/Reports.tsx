import React, { useEffect, useMemo, useState } from 'react';
import {
  DollarSign, TrendingUp, TrendingDown, Building2, Crown, Activity,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { useCompanySettings } from '../../../hooks/useCompanySettings';
import { cn } from '../../../lib/utils';
import { apiGet } from '../../../lib/api';
import { Client, Subscription } from '../../../types';

interface Invoice {
  id: string;
  clientId: string;
  clientName: string;
  clientDocument: string;
  concept: string;
  amount: number;
  issueDate: string;
  status: string;
}

interface Expense {
  id: string;
  amount: number;
  date: string;
  status: string;
  category: string;
}

const COLORS = ['#3B82F6', '#6366F1', '#10B981', '#F59E0B', '#F43F5E'];

export default function Reports() {
  const { settings } = useCompanySettings();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [clients, setClients] = useState<Client[]>([]);

  useEffect(() => {
    Promise.all([
      apiGet<Invoice[]>('/api/transactions'),
      apiGet<Expense[]>('/api/expenses'),
      apiGet<Subscription[]>('/api/subscriptions'),
      apiGet<Client[]>('/api/clients'),
    ])
      .then(([t, e, s, c]) => {
        setInvoices(t || []);
        setExpenses(e || []);
        setSubscriptions(s || []);
        setClients(c || []);
      })
      .catch(() => {
        setInvoices([]);
        setExpenses([]);
        setSubscriptions([]);
        setClients([]);
      });
  }, []);

  const paidInvoices = invoices.filter((i) => i.status === 'Pagado');
  const paidExpenses = expenses.filter((e) => e.status === 'Pagado');

  const ingresos = paidInvoices.reduce((sum, i) => sum + (i.amount || 0), 0);
  const gastos = paidExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const neto = ingresos - gastos;
  const margen = ingresos > 0 ? (neto / ingresos) * 100 : 0;
  const mrr = subscriptions
    .filter((s) => s.status === 'Al Día' || s.status === 'Por Vencer')
    .reduce((sum, s) => sum + (s.amount || 0), 0);

  const evolutionData = useMemo(() => {
    const months: { key: string; name: string; ingresos: number; gastos: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      months.push({
        key,
        name: d.toLocaleDateString('es-PE', { month: 'short' }),
        ingresos: 0,
        gastos: 0,
      });
    }
    paidInvoices.forEach((inv) => {
      const d = new Date(inv.issueDate);
      if (Number.isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const row = months.find((m) => m.key === key);
      if (row) row.ingresos += inv.amount || 0;
    });
    paidExpenses.forEach((exp) => {
      const d = new Date(exp.date);
      if (Number.isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const row = months.find((m) => m.key === key);
      if (row) row.gastos += exp.amount || 0;
    });
    return months.map(({ name, ingresos: ing, gastos: gas }) => ({ name, ingresos: ing, gastos: gas }));
  }, [paidInvoices, paidExpenses]);

  const distributionData = useMemo(() => {
    const byConcept: Record<string, number> = {};
    paidInvoices.forEach((inv) => {
      const label = inv.concept?.trim() || 'Otros';
      byConcept[label] = (byConcept[label] || 0) + (inv.amount || 0);
    });
    return Object.entries(byConcept)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [paidInvoices]);

  const topClients = useMemo(() => {
    const totals: Record<string, { id: string; name: string; ruc: string; amount: number; service: string }> = {};
    paidInvoices.forEach((inv) => {
      const key = inv.clientId || inv.clientName || inv.id;
      if (!totals[key]) {
        const client = clients.find((c) => c.id === inv.clientId);
        const sub = subscriptions.find((s) => s.clientId === inv.clientId);
        totals[key] = {
          id: key,
          name: inv.clientName || client?.businessName || 'Cliente',
          ruc: inv.clientDocument || client?.documentNumber || '-',
          amount: 0,
          service: sub?.serviceName || inv.concept || '—',
        };
      }
      totals[key].amount += inv.amount || 0;
    });
    return Object.values(totals).sort((a, b) => b.amount - a.amount).slice(0, 8);
  }, [paidInvoices, clients, subscriptions]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-sa-border border border-sa-border-strong p-3 rounded-lg shadow-xl">
          <p >{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-sa-muted capitalize">{entry.name}:</span>
              <span >
                {settings.currencySymbol} {Number(entry.value).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-extrabold text-sa-text tracking-tight">
          Reportes Financieros & Métricas
        </h1>
        <p className="text-sm text-sa-faint">Datos reales de cobranzas, gastos y suscripciones</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-sa-panel border border-sa-border rounded-2xl p-5">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 mb-4">
            <DollarSign className="h-5 w-5" />
          </div>
          <p className="text-[11px] font-bold text-sa-faint uppercase tracking-wider mb-1">Ingresos cobrados</p>
          <h3 className="text-2xl font-extrabold text-sa-text">{settings.currencySymbol} {ingresos.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
        </div>
        <div className="bg-sa-panel border border-sa-border rounded-2xl p-5">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 mb-4">
            <TrendingDown className="h-5 w-5" />
          </div>
          <p className="text-[11px] font-bold text-sa-faint uppercase tracking-wider mb-1">Gastos pagados</p>
          <h3 className="text-2xl font-extrabold text-sa-text">{settings.currencySymbol} {gastos.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
        </div>
        <div className="bg-sa-panel border border-sa-border rounded-2xl p-5">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div className="text-[10px] font-bold text-sa-faint bg-sa-border px-2 py-1 rounded-md border border-sa-border-strong">
              Margen: {margen.toFixed(1)}%
            </div>
          </div>
          <p className="text-[11px] font-bold text-sa-faint uppercase tracking-wider mb-1">Ganancia neta</p>
          <h3 className="text-2xl font-extrabold text-sa-text">{settings.currencySymbol} {neto.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
        </div>
        <div className="bg-sa-panel border border-sa-border rounded-2xl p-5">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500 mb-4">
            <Activity className="h-5 w-5" />
          </div>
          <p className="text-[11px] font-bold text-sa-faint uppercase tracking-wider mb-1">MRR Activo</p>
          <h3 className="text-2xl font-extrabold text-sa-text">
            {settings.currencySymbol} {mrr.toLocaleString(undefined, { minimumFractionDigits: 2 })}{' '}
            <span className="text-sm font-medium text-sa-faint normal-case">/mes</span>
          </h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-sa-panel border border-sa-border rounded-2xl p-6">
          <h3 className="text-sm font-bold text-sa-text mb-6">Evolución (Ingresos vs Gastos)</h3>
          <div className="h-72 w-full">
            {evolutionData.some((d) => d.ingresos > 0 || d.gastos > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={evolutionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${settings.currencySymbol}${v}`} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: '#1E293B', opacity: 0.4 }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#94A3B8', paddingTop: '20px' }} />
                  <Bar dataKey="ingresos" name="Ingresos" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="gastos" name="Gastos" fill="#F43F5E" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-sa-faint border border-dashed border-sa-border rounded-xl">
                Sin datos suficientes para graficar.
              </div>
            )}
          </div>
        </div>

        <div className="bg-sa-panel border border-sa-border rounded-2xl p-6 flex flex-col">
          <h3 className="text-sm font-bold text-sa-text mb-6">Distribución de Ingresos</h3>
          {distributionData.length > 0 ? (
            <>
              <div className="flex-1 min-h-[200px] w-full relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={distributionData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                      {distributionData.map((_, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[10px] font-bold text-sa-faint uppercase tracking-wider mb-0.5">Total</span>
                  <span className="text-lg font-extrabold text-sa-text">{settings.currencySymbol} {ingresos.toLocaleString()}</span>
                </div>
              </div>
              <div className="mt-4 space-y-3">
                {distributionData.map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span className="text-sa-muted truncate">{item.name}</span>
                    </div>
                    <span className="font-semibold text-sa-text shrink-0 ml-2">
                      {ingresos > 0 ? Math.round((item.value / ingresos) * 100) : 0}%
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-sm text-sa-faint border border-dashed border-sa-border rounded-xl">
              Sin cobranzas registradas.
            </div>
          )}
        </div>
      </div>

      <div className="bg-sa-panel border border-sa-border rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-sa-border flex items-center gap-2">
          <Building2 className="h-4 w-4 text-sa-faint" />
          <h3 className="text-sm font-bold text-sa-text">Top Clientes por Facturación</h3>
        </div>
        {topClients.length === 0 ? (
          <div className="p-12 text-center text-sa-faint text-sm">Aún no hay clientes con cobranzas pagadas.</div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-sm min-w-[800px]">
              <thead className="bg-sa-border/50 text-sa-faint font-semibold border-b border-sa-border">
                <tr>
                  <th className="px-6 py-4 uppercase tracking-wider text-[11px]">Cliente / RUC</th>
                  <th className="px-6 py-4 uppercase tracking-wider text-[11px]">Servicio / Concepto</th>
                  <th className="px-6 py-4 uppercase tracking-wider text-[11px]">Total Facturado</th>
                  <th className="px-6 py-4 uppercase tracking-wider text-[11px]">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E293B]">
                {topClients.map((client, idx) => (
                  <tr key={client.id} className="hover:bg-sa-border/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-sa-text text-[13px]">{client.name}</div>
                      <div className="text-sa-faint text-[11px] mt-0.5">RUC: {client.ruc}</div>
                    </td>
                    <td className="px-6 py-4 text-sa-muted text-[13px]">{client.service}</td>
                    <td className="px-6 py-4 font-bold text-sa-text text-[13px]">
                      {settings.currencySymbol} {client.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        'inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold border',
                        idx === 0
                          ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                      )}>
                        {idx === 0 && <Crown className="h-3 w-3 mr-1" />}
                        {idx === 0 ? 'Mayor facturación' : 'Cliente activo'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
