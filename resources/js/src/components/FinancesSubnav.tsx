import { Link, useLocation } from 'react-router-dom';
import { cn } from '../lib/utils';

const items = [
  { label: 'Cobranzas', path: '/admin/finances/billing' },
  { label: 'Proformas', path: '/admin/finances/proformas' },
  { label: 'Gastos', path: '/admin/finances/expenses' },
  { label: 'Reportes', path: '/admin/finances/reports' },
] as const;

export function FinancesSubnav() {
  const { pathname } = useLocation();

  return (
    <div className="flex flex-wrap items-center gap-1 p-1 rounded-xl bg-sa-panel border border-sa-border w-fit max-w-full">
      {items.map((item) => {
        const active = pathname === item.path || pathname.startsWith(`${item.path}/`);
        return (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              'px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors',
              active
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-sa-muted hover:text-sa-text hover:bg-sa-border/70',
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
