import React from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, HardDrive, Globe, Key, FolderKanban, ChevronRight, ArrowRight } from 'lucide-react';
import { cn } from '../lib/utils';

export type HostingProcessStep = 'clients' | 'servers' | 'domains' | 'credentials' | 'projects';

const STEPS: {
  id: HostingProcessStep;
  label: string;
  short: string;
  path: string;
  optional?: boolean;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: 'clients', label: 'Cliente', short: '1. Cliente', path: '/admin/clients', optional: true, icon: Briefcase },
  { id: 'servers', label: 'Servidor', short: '2. Servidor', path: '/admin/infra/servers', icon: HardDrive },
  { id: 'domains', label: 'Dominio', short: '3. Dominio', path: '/admin/infra/domains', icon: Globe },
  { id: 'credentials', label: 'Bóveda', short: '4. Bóveda', path: '/admin/infra/credentials', icon: Key },
  { id: 'projects', label: 'Proyecto', short: '5. Proyecto', path: '/admin/projects', optional: true, icon: FolderKanban },
];

const HINTS: Record<HostingProcessStep, string> = {
  clients: 'Si el dominio/hosting va a nombre del cliente, créalo aquí. Si es tuyo, salta a Servidor.',
  servers: 'Registra la cuenta de hosting (IP, proveedor, plan, URL cPanel). Luego continúa a Dominio.',
  domains: 'Registra el dominio y los nameservers NS1/NS2. Luego guarda accesos en la Bóveda.',
  credentials: 'Guarda cPanel, FTP y webmail. Si vendes un sistema, opcionalmente crea el Proyecto.',
  projects: 'Paso opcional: vincula el trabajo/entrega del sistema al cliente.',
};

const NEXT: Partial<Record<HostingProcessStep, { label: string; path: string }>> = {
  clients: { label: 'Continuar a Servidor', path: '/admin/infra/servers' },
  servers: { label: 'Continuar a Dominio', path: '/admin/infra/domains' },
  domains: { label: 'Continuar a Bóveda', path: '/admin/infra/credentials' },
  credentials: { label: 'Continuar a Proyecto (opcional)', path: '/admin/projects' },
};

export function HostingProcessNav({ current }: { current: HostingProcessStep }) {
  const currentIndex = STEPS.findIndex((s) => s.id === current);
  const next = NEXT[current];

  return (
    <div className="rounded-2xl border border-sa-border bg-sa-panel p-4 md:p-5 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-sa-faint">Proceso: hosting & dominio</p>
          <p className="text-sm text-sa-muted mt-1">{HINTS[current]}</p>
        </div>
        {next && (
          <Link
            to={next.path}>
            {next.label}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Link
          to="/admin/infra/hosting-wizard"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/25 hover:bg-emerald-500/20">
          Registrar hosting (wizard)
        </Link>
        <span className="text-[11px] text-sa-faint">Crea servidor + dominio vinculado + cPanel/FTP de una vez.</span>
      </div>

      <div className="flex items-stretch gap-1 overflow-x-auto custom-scrollbar pb-1">
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          const isCurrent = step.id === current;
          const isDone = index < currentIndex;
          const isUpcoming = index > currentIndex;

          return (
            <React.Fragment key={step.id}>
              {index > 0 && (
                <div className="flex items-center text-[#334155] px-0.5 shrink-0">
                  <ChevronRight className="h-4 w-4" />
                </div>
              )}
              <Link
                to={step.path}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold whitespace-nowrap transition-colors min-w-0',
                  isCurrent && 'bg-blue-500/10 border-blue-500/30 text-blue-300',
                  isDone && 'bg-emerald-500/5 border-emerald-500/20 text-emerald-300 hover:bg-emerald-500/10',
                  isUpcoming && 'bg-sa-canvas/50 border-sa-border text-sa-faint hover:text-sa-muted hover:border-sa-border-strong',
                )}>
                <span
                  className={cn(
                    'w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border',
                    isCurrent && 'bg-blue-500/20 border-blue-500/30 text-blue-300',
                    isDone && 'bg-emerald-500/15 border-emerald-500/25 text-emerald-300',
                    isUpcoming && 'bg-sa-border border-sa-border-strong text-sa-faint',
                  )}>
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <span className="flex flex-col leading-tight">
                  <span>{step.short}</span>
                  {step.optional && <span className="text-[10px] font-medium opacity-70">opcional</span>}
                </span>
              </Link>
            </React.Fragment>
          );
        })}
      </div>

      {current === 'clients' && (
        <div className="flex flex-wrap gap-2 pt-1">
          <Link to="/admin/infra/servers" className="text-[11px] font-semibold text-sa-faint hover:text-blue-400 underline-offset-2 hover:underline">
            Saltar cliente (es hosting propio) → ir a Servidor
          </Link>
        </div>
      )}
    </div>
  );
}
