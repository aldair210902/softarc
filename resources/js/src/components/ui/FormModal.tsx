import React from 'react';
import { X } from 'lucide-react';

interface FormModalProps {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  submitting?: boolean;
  submitLabel?: string;
  children: React.ReactNode;
  wide?: boolean;
}

export function FormModal({
  open,
  title,
  description,
  onClose,
  onSubmit,
  submitting = false,
  submitLabel = 'Guardar',
  children,
  wide = false,
}: FormModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center px-4 py-6">
      <button
        type="button"
        aria-label="Cerrar"
        onClick={onClose}
        className="absolute inset-0 bg-sa-overlay"
      />
      <form
        onSubmit={onSubmit}
        className={`sa-modal relative w-full ${wide ? 'max-w-2xl' : 'max-w-lg'} bg-sa-panel border border-sa-border rounded-2xl shadow-2xl overflow-hidden text-sa-text`}
      >
        <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-sa-border">
          <div>
            <h3 className="text-lg font-bold text-sa-text">{title}</h3>
            {description && <p className="text-sm text-sa-faint mt-1">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-sa-muted hover:text-sa-text hover:bg-sa-canvas transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">{children}</div>
        <div className="px-5 py-4 border-t border-sa-border flex justify-end gap-2 bg-sa-canvas/40">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-sa-muted hover:text-sa-text hover:bg-sa-canvas border border-sa-border transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-60 transition-colors"
          >
            {submitting ? 'Guardando...' : submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
}

export const inputClass =
  'w-full px-3 py-2.5 bg-sa-input border border-sa-border rounded-xl text-sa-text text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder-sa-faint';

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-sa-muted uppercase tracking-wider">{label}</label>
      {children}
      {hint ? <p className="text-[11px] text-sa-faint">{hint}</p> : null}
    </div>
  );
}
