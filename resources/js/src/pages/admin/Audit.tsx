import React, { useEffect, useMemo, useState } from 'react';
import {
  Search, Activity, ShieldCheck, ShieldAlert, FileJson, AlertTriangle, Info, Clock, User, Globe, Code, ChevronLeft, ChevronRight, Settings2, Trash2,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { EmptyState } from '../../components/ui/EmptyState';
import { Can } from '../../components/Can';
import { apiGet, apiMutate } from '../../lib/api';
import { inputClass } from '../../components/ui/FormModal';

type FilterTab = 'Todos' | 'Informativos' | 'Modificaciones' | 'Acciones Críticas / Eliminaciones';

interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  ip: string;
  action: string;
  module: string;
  level: string;
  details: string;
}

interface AuditStats {
  total: number;
  month: number;
  critical: number;
  warning: number;
  retentionDays: number;
  maxRows: number;
  keepCritical: boolean;
}

interface AuditPageResponse {
  data: AuditLog[];
  meta?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  stats?: AuditStats;
}

const emptyStats: AuditStats = {
  total: 0,
  month: 0,
  critical: 0,
  warning: 0,
  retentionDays: 90,
  maxRows: 50000,
  keepCritical: true,
};

function tabToLevel(tab: FilterTab): string | undefined {
  if (tab === 'Informativos') return 'info';
  if (tab === 'Modificaciones') return 'warning';
  if (tab === 'Acciones Críticas / Eliminaciones') return 'critical';
  return undefined;
}

export default function Audit() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('Todos');
  const [page, setPage] = useState(1);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AuditStats>(emptyStats);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, per_page: 50, total: 0 });
  const [loading, setLoading] = useState(true);
  const [detailLog, setDetailLog] = useState<AuditLog | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [pruning, setPruning] = useState(false);
  const [settingsForm, setSettingsForm] = useState({
    retentionDays: 90,
    keepCritical: true,
    maxRows: 50000,
  });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(searchTerm.trim()), 300);
    return () => window.clearTimeout(t);
  }, [searchTerm]);

  useEffect(() => {
    setPage(1);
  }, [activeTab, debouncedSearch]);

  useEffect(() => {
    const params = new URLSearchParams({
      page: String(page),
      per_page: '50',
    });
    const level = tabToLevel(activeTab);
    if (level) params.set('level', level);
    if (debouncedSearch) params.set('q', debouncedSearch);

    setLoading(true);
    apiGet<AuditPageResponse | AuditLog[]>(`/api/audit-logs?${params.toString()}`, { fresh: true })
      .then((res) => {
        if (Array.isArray(res)) {
          setLogs(res.map(normalizeLevel));
          setMeta({ current_page: 1, last_page: 1, per_page: res.length, total: res.length });
          return;
        }
        setLogs((res.data || []).map(normalizeLevel));
        if (res.meta) setMeta(res.meta);
        if (res.stats) {
          setStats(res.stats);
          setSettingsForm({
            retentionDays: res.stats.retentionDays,
            keepCritical: res.stats.keepCritical,
            maxRows: res.stats.maxRows,
          });
        }
      })
      .catch(() => {
        setLogs([]);
        setMeta({ current_page: 1, last_page: 1, per_page: 50, total: 0 });
      })
      .finally(() => setLoading(false));
  }, [page, activeTab, debouncedSearch, reloadKey]);

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const res = await apiMutate<{ stats: AuditStats }>('put', '/api/audit-logs/settings', settingsForm);
      if (res.stats) setStats(res.stats);
      setSettingsOpen(false);
      setReloadKey((k) => k + 1);
    } finally {
      setSavingSettings(false);
    }
  };

  const runPrune = async () => {
    if (!window.confirm(
      '¿Aplicar la política de retención?\n\nSe borran logs antiguos (fuera de los días configurados) y el exceso del tope.\n'
      + (stats.keepCritical ? 'Los eventos críticos se conservan.\n' : '')
      + 'Los registros recientes seguirán visibles.\n\nEsta acción no se puede deshacer.',
    )) return;
    setPruning(true);
    try {
      const res = await apiMutate<{ result: { deletedByAge: number; deletedByCap: number; remaining: number; mode?: string }; stats: AuditStats }>(
        'post',
        '/api/audit-logs/prune',
        { mode: 'policy' },
      );
      if (res.stats) setStats(res.stats);
      window.alert(
        `Limpieza por política lista.\nPor antigüedad: ${res.result.deletedByAge}\nPor tope: ${res.result.deletedByCap}\nRestantes: ${res.result.remaining}`,
      );
      setReloadKey((k) => k + 1);
    } finally {
      setPruning(false);
    }
  };

  const runPurgeAll = async () => {
    if (!window.confirm(
      '¿VACIAR TODA la auditoría?\n\nSe eliminarán TODOS los registros (incluidos críticos).\nEsta acción no se puede deshacer.',
    )) return;
    const confirmText = window.prompt('Escribe VACIAR para confirmar:');
    if ((confirmText || '').trim().toUpperCase() !== 'VACIAR') {
      window.alert('Cancelado: debes escribir VACIAR.');
      return;
    }
    setPruning(true);
    try {
      const res = await apiMutate<{ result: { deletedByAge: number; remaining: number }; stats: AuditStats }>(
        'post',
        '/api/audit-logs/prune',
        { mode: 'all' },
      );
      if (res.stats) setStats(res.stats);
      setLogs([]);
      setMeta({ current_page: 1, last_page: 1, per_page: 50, total: 0 });
      window.alert(`Auditoría vaciada.\nEliminados: ${res.result.deletedByAge}`);
      setReloadKey((k) => k + 1);
    } finally {
      setPruning(false);
    }
  };

  const normalizeLevel = (r: AuditLog): AuditLog => {
    const raw = (r.level || 'info').toLowerCase();
    const level = raw === 'critical' ? 'Critical' : raw === 'warning' ? 'Warning' : 'Info';
    return { ...r, level };
  };

  const usagePct = useMemo(() => {
    if (!stats.maxRows) return 0;
    return Math.min(100, Math.round((stats.total / stats.maxRows) * 100));
  }, [stats.total, stats.maxRows]);

  const getLevelBadge = (level: AuditLog['level']) => {
    switch (level) {
      case 'Info':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'Warning':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'Critical':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      default:
        return 'bg-slate-500/10 text-sa-muted border-slate-500/20';
    }
  };

  const getLevelIcon = (level: AuditLog['level']) => {
    switch (level) {
      case 'Info': return <Info className="h-3 w-3 mr-1" />;
      case 'Warning': return <AlertTriangle className="h-3 w-3 mr-1" />;
      case 'Critical': return <ShieldAlert className="h-3 w-3 mr-1" />;
      default: return <Info className="h-3 w-3 mr-1" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-extrabold text-sa-text tracking-tight">Registro de Auditoría & Logs del Sistema</h1>
        <Can ability="settings.manage">
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <button
              type="button"
              onClick={() => setSettingsOpen((v) => !v)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-sa-muted border border-sa-border bg-sa-panel hover:bg-sa-border/50 hover:text-sa-text transition-colors"
            >
              <Settings2 className="h-4 w-4 text-sa-muted" />
              Política de retención
            </button>
            <button
              type="button"
              onClick={runPrune}
              disabled={pruning}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 disabled:opacity-50"
              title="Borra solo lo que excede la política (días/tope)">
              <Trash2 className="h-4 w-4" />
              {pruning ? 'Limpiando...' : 'Limpiar por política'}
            </button>
            <button
              type="button"
              onClick={runPurgeAll}
              disabled={pruning}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-red-500/10 border border-red-500/30 text-red-300 hover:bg-red-500/20 disabled:opacity-50"
              title="Elimina absolutamente todos los logs">
              <Trash2 className="h-4 w-4" />
              Vaciar todo
            </button>
          </div>
        </Can>
      </div>

      <div className="rounded-2xl border border-sa-border bg-sa-panel px-4 py-3 text-sm text-sa-muted">
        Se conservan los últimos <span >{stats.retentionDays} días</span>
        {stats.keepCritical ? ' (los críticos no se borran por antigüedad)' : ''}.
        Tope: <span >{stats.maxRows.toLocaleString()}</span> filas
        ({usagePct}% usado).
        {' '}
        <span className="text-sa-faint">
          “Limpiar por política” solo quita lo viejo/excedente · “Vaciar todo” elimina absolutamente todo.
        </span>
      </div>

      {settingsOpen && (
        <Can ability="settings.manage">
          <form onSubmit={saveSettings} className="rounded-2xl border border-sa-border bg-sa-panel p-4 md:p-5 space-y-4">
            <div>
              <h2 className="text-base font-bold text-sa-text">Política de retención</h2>
              <p className="text-xs text-sa-faint mt-1">
                Ajusta cuánto tiempo y cuántos registros se guardan. No necesitas tocar el servidor ni archivos .env.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <label className="block space-y-1.5">
                <span className="text-sm font-semibold text-sa-muted">Días a conservar</span>
                <input
                  type="number"
                  min={7}
                  max={3650}
                  required
                  className={inputClass}
                  value={settingsForm.retentionDays}
                  onChange={(e) => setSettingsForm({ ...settingsForm, retentionDays: Number(e.target.value) })}
                />
                <span className="block text-[11px] text-sa-faint">Mínimo 7 · recomendado 90</span>
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm font-semibold text-sa-muted">Tope máximo de filas</span>
                <input
                  type="number"
                  min={1000}
                  max={1000000}
                  required
                  className={inputClass}
                  value={settingsForm.maxRows}
                  onChange={(e) => setSettingsForm({ ...settingsForm, maxRows: Number(e.target.value) })}
                />
                <span className="block text-[11px] text-sa-faint">Si se supera, se borran los más antiguos</span>
              </label>
              <label className="flex items-start gap-3 rounded-xl border border-sa-border bg-sa-canvas/40 px-4 py-3">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={settingsForm.keepCritical}
                  onChange={(e) => setSettingsForm({ ...settingsForm, keepCritical: e.target.checked })}
                />
                <span>
                  <span className="block text-sm font-semibold text-sa-text">Conservar críticos</span>
                  <span className="block text-[11px] text-sa-faint mt-1">
                    Las eliminaciones y eventos critical no se borran solo por antigüedad.
                  </span>
                </span>
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSettingsOpen(false)}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-sa-muted hover:text-sa-text hover:bg-sa-border/60 border border-sa-border transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={savingSettings}
                className="px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-60 transition-colors"
              >
                {savingSettings ? 'Guardando...' : 'Guardar política'}
              </button>
            </div>
          </form>
        </Can>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-sa-panel border border-sa-border rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sa-border rounded-lg text-blue-400">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-sa-faint uppercase tracking-wider">Eventos este mes</p>
              <h3 className="text-xl font-extrabold text-sa-text">
                {stats.month.toLocaleString()}{' '}
                <span className="text-xs font-medium text-sa-faint normal-case">/ {stats.total.toLocaleString()} total</span>
              </h3>
            </div>
          </div>
        </div>

        <div className="bg-sa-panel border border-sa-border rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sa-border rounded-lg text-emerald-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-sa-faint uppercase tracking-wider">Retención activa</p>
              <div className="mt-0.5">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                  {stats.retentionDays} días · max {stats.maxRows.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-sa-panel border border-sa-border rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sa-border rounded-lg text-amber-400">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-sa-faint uppercase tracking-wider">Críticos / avisos</p>
              <h3 className="text-xl font-extrabold text-sa-text">
                {stats.critical.toLocaleString()}{' '}
                <span className="text-xs font-medium text-sa-faint normal-case">/ {stats.warning.toLocaleString()} warning</span>
              </h3>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="flex items-center gap-1 bg-sa-panel border border-sa-border rounded-xl p-1 overflow-x-auto custom-scrollbar w-full xl:w-auto">
          {(['Todos', 'Informativos', 'Modificaciones', 'Acciones Críticas / Eliminaciones'] as FilterTab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap',
                activeTab === tab
                  ? 'bg-sa-border text-sa-text shadow-sm'
                  : 'text-sa-faint hover:text-sa-muted hover:bg-sa-border/50',
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="relative w-full xl:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-sa-faint" />
          <input
            type="text"
            placeholder="Buscar por usuario, IP, módulo o acción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-3 py-2.5 bg-sa-input border border-sa-border rounded-xl text-sa-text text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder-sa-faint"/>
        </div>
      </div>

      <div className="bg-sa-panel border border-sa-border rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex-1 flex items-center justify-center p-8 text-sm text-sa-faint">Cargando auditoría...</div>
        ) : logs.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <EmptyState
              icon={Activity}
              title="No hay registros"
              description="No se encontraron eventos que coincidan con los filtros actuales."
            />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left text-sm min-w-[1000px]">
                <thead className="bg-sa-border/50 text-sa-faint font-semibold border-b border-sa-border sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-4 uppercase tracking-wider text-[11px]">Fecha / Hora</th>
                    <th className="px-6 py-4 uppercase tracking-wider text-[11px]">Usuario / IP</th>
                    <th className="px-6 py-4 uppercase tracking-wider text-[11px]">Acción Realizada</th>
                    <th className="px-6 py-4 uppercase tracking-wider text-[11px]">Módulo Afectado</th>
                    <th className="px-6 py-4 uppercase tracking-wider text-[11px]">Nivel</th>
                    <th className="px-6 py-4 uppercase tracking-wider text-[11px] text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E293B]">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-sa-border/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="font-mono text-sa-muted text-[12px] flex items-center gap-1.5">
                          <Clock className="h-3 w-3 text-sa-faint" />
                          {log.timestamp}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div >
                          <User className="h-3.5 w-3.5 text-sa-faint" /> {log.user}
                        </div>
                        <div className="font-mono text-sa-faint text-[11px] flex items-center gap-1.5">
                          <Globe className="h-3 w-3" /> {log.ip}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div >{log.action}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-1 rounded text-[10px] font-semibold bg-sa-border text-sa-muted border border-sa-border-strong whitespace-nowrap">
                          <Code className="h-3 w-3 mr-1 text-sa-faint" />
                          {log.module}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          'inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold border whitespace-nowrap',
                          getLevelBadge(log.level),
                        )}>
                          {getLevelIcon(log.level)}
                          {log.level}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end">
                          <button
                            type="button"
                            onClick={() => setDetailLog(log)}>
                            <FileJson className="h-3.5 w-3.5 text-sa-muted" /> Ver detalle
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-4 py-3 border-t border-sa-border flex items-center justify-between gap-3">
              <p className="text-xs text-sa-faint">
                Página {meta.current_page} de {meta.last_page} · {meta.total.toLocaleString()} resultado(s)
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}>
                  <ChevronLeft className="h-3.5 w-3.5" /> Anterior
                </button>
                <button
                  type="button"
                  disabled={page >= meta.last_page}
                  onClick={() => setPage((p) => p + 1)}>
                  Siguiente <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {detailLog && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center px-4 py-6">
          <button type="button" aria-label="Cerrar" className="absolute inset-0 bg-black/70" onClick={() => setDetailLog(null)} />
          <div className="relative w-full max-w-lg bg-sa-panel border border-sa-border rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-sa-border">
              <h3 className="text-lg font-bold text-sa-text">Detalle del evento</h3>
              <p className="text-sm text-sa-faint mt-1">{detailLog.action} · {detailLog.module}</p>
            </div>
            <pre className="p-5 text-xs text-sa-muted overflow-auto max-h-[50vh] custom-scrollbar whitespace-pre-wrap break-words">
              {(() => {
                try {
                  return JSON.stringify(JSON.parse(detailLog.details || '{}'), null, 2);
                } catch {
                  return detailLog.details || '{}';
                }
              })()}
            </pre>
            <div className="px-5 py-4 border-t border-sa-border flex justify-end">
              <button type="button" onClick={() => setDetailLog(null)} className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-semibold text-sa-muted hover:text-sa-text hover:bg-sa-border/60 transition-colors">Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
