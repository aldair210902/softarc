import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DollarSign, Users, Target, Building2, ShieldCheck, ArrowRight, Server, Globe, Activity, Clock, AlertTriangle, MessageCircle, Wallet } from 'lucide-react';
import { useCompanySettings } from '../../hooks/useCompanySettings';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Client, Subscription } from '../../types';
import { apiGet } from '../../lib/api';

interface AuditItem {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  module: string;
  level: string;
}

interface DashboardData {
  mrr: number;
  activeClients: number;
  newLeads: number;
  collected: number;
  expensesMonth: number;
  serversOnline: number;
  serversTotal: number;
  domainsExpiring: number;
  chartData: { name: string; ingresos: number; gastos: number }[];
  upcomingCollections: (Subscription & { client?: Client })[];
  recentActivity: AuditItem[];
}

export default function Dashboard() {
  const { settings } = useCompanySettings();
  const [stats, setStats] = useState({
    mrr: 0,
    activeClients: 0,
    newLeads: 0,
    collected: 0,
    expensesMonth: 0,
    serversOnline: 0,
    serversTotal: 0,
    domainsExpiring: 0,
  });
  const [chartData, setChartData] = useState<{ name: string; ingresos: number; gastos: number }[]>([]);
  const [upcomingCollections, setUpcomingCollections] = useState<(Subscription & { client: Client })[]>([]);
  const [recentActivity, setRecentActivity] = useState<AuditItem[]>([]);

  useEffect(() => {
    apiGet<DashboardData>('/api/dashboard')
      .then((data) => {
        setStats({
          mrr: data.mrr || 0,
          activeClients: data.activeClients || 0,
          newLeads: data.newLeads || 0,
          collected: data.collected || 0,
          expensesMonth: data.expensesMonth || 0,
          serversOnline: data.serversOnline || 0,
          serversTotal: data.serversTotal || 0,
          domainsExpiring: data.domainsExpiring || 0,
        });
        setChartData(data.chartData || []);
        setUpcomingCollections(
          (data.upcomingCollections || [])
            .filter((s) => s.client)
            .map((s) => ({ ...s, client: s.client as Client }))
            .slice(0, 4),
        );
        setRecentActivity(data.recentActivity || []);
      })
      .catch(() => {
        setStats({
          mrr: 0,
          activeClients: 0,
          newLeads: 0,
          collected: 0,
          expensesMonth: 0,
          serversOnline: 0,
          serversTotal: 0,
          domainsExpiring: 0,
        });
        setChartData([]);
        setUpcomingCollections([]);
        setRecentActivity([]);
      });
  }, []);

  const totalIncome = stats.collected;
  const incomeBase = Math.max(totalIncome + stats.expensesMonth, 1);
  const mrrPct = Math.min(100, Math.round((stats.mrr / incomeBase) * 100));
  const collectedPct = Math.min(100, Math.round((stats.collected / incomeBase) * 100));

  const formatRelative = (timestamp: string) => {
    const date = new Date(timestamp.replace(' ', 'T'));
    if (Number.isNaN(date.getTime())) return timestamp;
    const diffMs = Date.now() - date.getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 60) return `Hace ${Math.max(1, mins)} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `Hace ${hours} h`;
    const days = Math.floor(hours / 24);
    return `Hace ${days} d`;
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-900/40 via-[#111827] to-[#111827] border border-blue-500/20 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 flex-shrink-0 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-base font-bold text-sa-text">{settings.legalName}</h2>
              {settings.ruc && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 border border-blue-500/20 text-blue-400">
                  RUC: {settings.ruc}
                </span>
              )}
            </div>
            <p className="text-xs text-sa-muted mt-1 flex items-center flex-wrap gap-2">
              {settings.salesWhatsapp && <span>WhatsApp: +{settings.salesWhatsapp}</span>}
              {settings.slaUptime && (
                <>
                  <span className="text-[#334155]">|</span>
                  <span>SLA {settings.slaUptime}</span>
                </>
              )}
            </p>
          </div>
        </div>

        <Link
          to="/admin/settings">
          Editar configuración <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="flex justify-between items-center mt-2">
        <h1 className="text-3xl font-extrabold text-sa-text tracking-tight">Consola de Control Operativo</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-sa-panel p-6 rounded-2xl border border-sa-border">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] font-bold text-sa-faint uppercase tracking-wider mb-2">Ingresos Recurrentes (MRR)</p>
              <h3 className="text-3xl font-extrabold text-sa-text tracking-tight">{settings.currencySymbol}{stats.mrr.toLocaleString()}</h3>
            </div>
            <div className="p-3 bg-green-500/10 rounded-xl border border-green-500/20">
              <DollarSign className="h-6 w-6 text-green-500" />
            </div>
          </div>
          <p className="mt-5 text-xs text-sa-faint">Suscripciones al día / por vencer</p>
        </div>

        <div className="bg-sa-panel p-6 rounded-2xl border border-sa-border">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] font-bold text-sa-faint uppercase tracking-wider mb-2">Clientes Activos</p>
              <h3 className="text-3xl font-extrabold text-sa-text tracking-tight">{stats.activeClients}</h3>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
              <Users className="h-6 w-6 text-blue-500" />
            </div>
          </div>
          <p className="mt-5 text-xs text-sa-faint">Registrados con estado Activo</p>
        </div>

        <div className="bg-sa-panel p-6 rounded-2xl border border-sa-border">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] font-bold text-sa-faint uppercase tracking-wider mb-2">Nuevos Prospectos</p>
              <h3 className="text-3xl font-extrabold text-sa-text tracking-tight">{stats.newLeads}</h3>
            </div>
            <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20">
              <Target className="h-6 w-6 text-amber-500" />
            </div>
          </div>
          <p className="mt-5 text-xs text-sa-faint">Estado: Nuevo Prospecto</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-sa-panel p-6 rounded-2xl border border-sa-border lg:col-span-2 flex flex-col">
          <h3 className="text-xl font-bold text-sa-text mb-6">Ingresos vs Gastos (6 meses)</h3>
          <div className="flex-1 w-full min-h-[300px]">
            {chartData.some((d) => d.ingresos > 0 || d.gastos > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1E293B" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} dx={-10} tickFormatter={(val) => `${settings.currencySymbol}${val}`} />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: '1px solid #1E293B', backgroundColor: '#111827', color: '#E2E8F0' }}
                    formatter={(value: number, name: string) => [`${settings.currencySymbol}${value}`, name === 'ingresos' ? 'Ingresos' : 'Gastos']}
                  />
                  <Area type="monotone" dataKey="ingresos" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorIngresos)" />
                  <Area type="monotone" dataKey="gastos" stroke="#f43f5e" strokeWidth={2} fillOpacity={0} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full min-h-[300px] flex items-center justify-center text-sm text-sa-faint border border-dashed border-sa-border rounded-xl">
                Sin movimientos registrados aún. Los gráficos se llenarán con pagos y gastos reales.
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-sa-panel p-6 rounded-2xl border border-sa-border">
            <h3 className="text-[11px] font-bold text-sa-faint uppercase tracking-wider mb-5">Resumen del Mes</h3>
            <div className="space-y-5">
              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-sa-muted">MRR (Suscripciones)</span>
                  <span className="font-semibold text-sa-text">{settings.currencySymbol}{stats.mrr.toLocaleString()}</span>
                </div>
                <div className="w-full bg-sa-border rounded-full h-1.5 overflow-hidden">
                  <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${mrrPct}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-sa-muted">Cobranzas (Pagado)</span>
                  <span className="font-semibold text-sa-text">{settings.currencySymbol}{stats.collected.toLocaleString()}</span>
                </div>
                <div className="w-full bg-sa-border rounded-full h-1.5 overflow-hidden">
                  <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${collectedPct}%` }}></div>
                </div>
              </div>
              <div className="pt-5 border-t border-sa-border">
                <div className="flex justify-between items-center">
                  <span >Ingresos cobrados</span>
                  <span className="text-2xl font-extrabold text-sa-text">{settings.currencySymbol}{totalIncome.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center mt-2 text-sm">
                  <span className="text-xs text-sa-faint">Gastos del mes</span>
                  <span className="text-xs font-semibold text-red-400">-{settings.currencySymbol}{stats.expensesMonth.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-sa-panel p-6 rounded-2xl border border-sa-border">
            <h3 className="text-[11px] font-bold text-sa-faint uppercase tracking-wider mb-5 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-500" /> Health Check
            </h3>
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                    <Server className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-sa-text">Servidores (VPS)</div>
                    <div className="text-[11px] text-sa-faint font-medium mt-0.5">
                      {stats.serversTotal === 0
                        ? 'Sin servidores registrados'
                        : `${stats.serversOnline}/${stats.serversTotal} Online`}
                    </div>
                  </div>
                </div>
                {stats.serversTotal > 0 && stats.serversOnline === stats.serversTotal ? (
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                ) : (
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                    <Globe className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-sa-text">Dominios</div>
                    <div className="text-[11px] text-sa-faint font-medium mt-0.5">
                      {stats.domainsExpiring === 0
                        ? 'Ninguno por vencer (30 días)'
                        : `${stats.domainsExpiring} por vencer (30 días)`}
                    </div>
                  </div>
                </div>
                {stats.domainsExpiring > 0 && <AlertTriangle className="h-4 w-4 text-amber-500" />}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-sa-panel p-6 rounded-2xl border border-sa-border">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-sa-text flex items-center gap-2">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Wallet className="h-4 w-4 text-blue-500" />
              </div>
              Próximos Vencimientos
            </h3>
            <Link to="/admin/clients" className="text-xs font-semibold text-blue-500 hover:text-blue-400">
              Ver todos
            </Link>
          </div>
          <div className="space-y-3">
            {upcomingCollections.length > 0 ? upcomingCollections.map((sub) => (
              <div key={sub.id} className="flex items-center justify-between p-4 bg-sa-canvas rounded-xl border border-sa-border">
                <div>
                  <div className="font-semibold text-sa-text text-sm">{sub.client.businessName}</div>
                  <div className="text-xs text-sa-muted mt-1">{sub.serviceName} · {settings.currencySymbol}{sub.amount}</div>
                  <span className={`inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-bold ${
                    sub.status === 'Vencido' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}>
                    {sub.status}
                  </span>
                </div>
                {sub.client.phone && (
                  <a
                    href={`https://wa.me/${sub.client.phone.replace(/\D/g, '')}?text=Hola ${sub.client.contactName}, te escribimos de ${settings.legalName} para recordarte el pago de ${sub.serviceName} por ${settings.currencySymbol}${sub.amount}.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-2 bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/20 rounded-lg text-xs font-bold"
                  >
                    <MessageCircle className="h-4 w-4" /> Recordar
                  </a>
                )}
              </div>
            )) : (
              <div className="text-center py-8 text-sa-faint text-sm bg-sa-canvas rounded-xl border border-sa-border border-dashed">
                No hay pagos pendientes ni vencidos próximos.
              </div>
            )}
          </div>
        </div>

        <div className="bg-sa-panel p-6 rounded-2xl border border-sa-border">
          <h3 className="text-lg font-bold text-sa-text mb-6 flex items-center gap-2">
            <div className="p-2 bg-indigo-500/10 rounded-lg">
              <Activity className="h-4 w-4 text-indigo-500" />
            </div>
            Actividad Reciente
          </h3>
          <div className="space-y-5">
            {recentActivity.length > 0 ? recentActivity.map((activity, idx) => (
              <div key={activity.id} className="flex gap-4">
                <div className="relative">
                  {idx !== recentActivity.length - 1 && (
                    <div className="absolute top-10 bottom-[-20px] left-1/2 -translate-x-1/2 w-px bg-sa-border"></div>
                  )}
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-sa-border text-sa-muted border border-white/5 relative z-10">
                    <Activity className="h-5 w-5" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-sa-text">{activity.action}</h4>
                    <span className="text-[10px] text-sa-faint flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {formatRelative(activity.timestamp)}
                    </span>
                  </div>
                  <p className="text-xs text-sa-muted mt-1">{activity.module} · {activity.user}</p>
                </div>
              </div>
            )) : (
              <div className="text-center py-8 text-sa-faint text-sm bg-sa-canvas rounded-xl border border-sa-border border-dashed">
                Sin actividad registrada todavía.
              </div>
            )}
          </div>
          <div className="mt-6 pt-4 border-t border-sa-border text-center">
            <Link to="/admin/audit" >
              Ver todo el historial
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

