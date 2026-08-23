import React, { useEffect, useRef, useState } from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { ThemePreference, useTheme } from '../context/ThemeContext';
import { cn } from '../lib/utils';

const OPTIONS: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Claro', icon: Sun },
  { value: 'dark', label: 'Oscuro', icon: Moon },
  { value: 'system', label: 'Sistema', icon: Monitor },
];

export function ThemeToggle({ className, compact = false }: { className?: string; compact?: boolean }) {
  const { preference, setPreference, resolved } = useTheme();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const ActiveIcon = preference === 'system' ? Monitor : resolved === 'dark' ? Moon : Sun;

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'inline-flex items-center justify-center rounded-lg border transition-colors',
          compact ? 'h-9 w-9' : 'h-9 gap-2 px-2.5',
          'border-sa-border bg-sa-panel text-sa-muted hover:text-sa-text hover:border-sa-border-strong',
        )}
        aria-label="Cambiar tema"
        title="Tema"
      >
        <ActiveIcon className="h-4 w-4" />
        {!compact && (
          <span className="text-xs font-semibold hidden sm:inline">
            {OPTIONS.find((o) => o.value === preference)?.label}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-50 min-w-[10.5rem] rounded-xl border border-sa-border bg-sa-panel shadow-xl p-1">
          {OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const active = preference === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  setPreference(opt.value);
                  setOpen(false);
                }}
                className={cn(
                  'w-full flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition-colors',
                  active
                    ? 'bg-blue-600/15 text-blue-500 font-semibold'
                    : 'text-sa-muted hover:bg-sa-canvas hover:text-sa-text',
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
