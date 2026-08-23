import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDestructive?: boolean;
}

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
  isDestructive = true,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
      <button
        type="button"
        aria-label="Cerrar"
        onClick={onCancel}
        className="absolute inset-0 bg-black/70"
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative bg-sa-panel border border-sa-border rounded-2xl w-full max-w-md p-6 shadow-2xl overflow-hidden text-sa-text">
        {isDestructive && <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-rose-500" />}

        <div className="flex gap-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${isDestructive ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}>
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-sa-text mb-2">{title}</h3>
            <p className="text-sm text-sa-muted leading-relaxed">{description}</p>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-8">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-sa-muted hover:text-sa-text hover:bg-sa-border/60 transition-colors"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onCancel();
            }}
            className={`px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-colors ${
              isDestructive
                ? 'bg-red-600 hover:bg-red-500'
                : 'bg-blue-600 hover:bg-blue-500'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
