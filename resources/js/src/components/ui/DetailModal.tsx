import React from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

export function DetailModal({
  open,
  title,
  subtitle,
  onClose,
  children,
  footer,
  wide = false,
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  wide?: boolean;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center px-4 py-6">
      <button type="button" aria-label="Cerrar" onClick={onClose} className="absolute inset-0 bg-black/70" />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'relative w-full bg-sa-panel border border-sa-border rounded-2xl shadow-2xl overflow-hidden text-sa-text',
          wide ? 'max-w-3xl' : 'max-w-lg',
        )}>
        <div className="flex items-start justify-between gap-4 px-5 py-3.5 border-b border-sa-border">
          <div className="min-w-0">
            <h3 className="text-base font-bold text-sa-text truncate">{title}</h3>
            {subtitle && <p className="text-xs text-sa-faint mt-0.5 truncate">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-sa-faint hover:text-sa-text hover:bg-sa-border/60 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">{children}</div>
        {footer && (
          <div className="px-5 py-3 border-t border-sa-border flex flex-wrap items-center justify-end gap-2 bg-sa-canvas/40">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export function DetailGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{children}</div>;
}

export function DetailItem({ label, value, mono = false, full = false }: {
  label: string;
  value?: React.ReactNode;
  mono?: boolean;
  full?: boolean;
}) {
  const display = value === null || value === undefined || value === '' ? '—' : value;
  return (
    <div className={cn(full && 'sm:col-span-2')}>
      <p className="text-[10px] font-bold uppercase tracking-wider text-sa-faint mb-0.5">{label}</p>
      <div className={cn('text-[13px] text-sa-text break-words', mono && 'font-mono text-[12px] text-sa-muted')}>
        {display}
      </div>
    </div>
  );
}
