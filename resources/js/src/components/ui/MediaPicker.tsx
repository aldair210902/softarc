import React, { useEffect, useMemo, useState } from 'react';
import { Check, FolderOpen, Search, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { apiGet } from '../../lib/api';

type MediaItem = {
  path: string;
  url: string;
  name: string;
  used: boolean;
};

type MediaResponse = {
  items: MediaItem[];
};

export function MediaPicker({
  open,
  onClose,
  onPick,
  multiple = true,
  title = 'Elegir de la biblioteca',
}: {
  open: boolean;
  onClose: () => void;
  onPick: (urls: string[]) => void;
  multiple?: boolean;
  title?: string;
}) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    setSelected([]);
    setSearch('');
    setLoading(true);
    apiGet<MediaResponse>('/api/media', { fresh: true })
      .then((res) => setItems(res.items || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [open]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (i) => i.name.toLowerCase().includes(q) || i.path.toLowerCase().includes(q),
    );
  }, [items, search]);

  if (!open) return null;

  const toggle = (url: string) => {
    if (!multiple) {
      onPick([url]);
      onClose();
      return;
    }
    setSelected((prev) => (prev.includes(url) ? prev.filter((u) => u !== url) : [...prev, url]));
  };

  return (
    <div className="fixed inset-0 z-[220] flex items-center justify-center px-4 py-6">
      <button type="button" aria-label="Cerrar" className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-3xl bg-sa-panel border border-sa-border rounded-2xl shadow-2xl overflow-hidden text-sa-text flex flex-col max-h-[85vh]"
      >
        <div className="flex items-start justify-between gap-3 px-5 py-3.5 border-b border-sa-border">
          <div>
            <h3 className="text-base font-bold">{title}</h3>
            <p className="text-xs text-sa-faint mt-0.5">Imágenes ya subidas en el servidor</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-sa-faint hover:text-sa-text hover:bg-sa-border/60"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 py-3 border-b border-sa-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-sa-faint" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre…"
              className="w-full pl-10 pr-3 py-2.5 bg-sa-input border border-sa-border rounded-xl text-sa-text text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {loading ? (
            <p className="text-sm text-sa-faint text-center py-12">Cargando…</p>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-sa-faint text-sm">
              <FolderOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
              No hay imágenes para mostrar.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {filtered.map((item) => {
                const active = selected.includes(item.url);
                return (
                  <button
                    key={item.path}
                    type="button"
                    onClick={() => toggle(item.url)}
                    className={cn(
                      'relative aspect-video rounded-xl overflow-hidden border text-left transition-colors',
                      active ? 'border-blue-500 ring-2 ring-blue-500/30' : 'border-sa-border hover:border-blue-500/40',
                    )}
                  >
                    <img src={item.url} alt={item.name} className="w-full h-full object-cover bg-sa-canvas" loading="lazy" />
                    {active && (
                      <span className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                    )}
                    <span className="absolute inset-x-0 bottom-0 px-2 py-1 text-[10px] font-semibold text-white bg-black/55 truncate">
                      {item.name}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {multiple && (
          <div className="px-5 py-3 border-t border-sa-border flex items-center justify-between gap-3 bg-sa-canvas/40">
            <p className="text-xs text-sa-muted">{selected.length} seleccionada(s)</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-sa-muted hover:text-sa-text hover:bg-sa-border/60"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!selected.length}
                onClick={() => {
                  onPick(selected);
                  onClose();
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50"
              >
                Usar seleccionadas
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
