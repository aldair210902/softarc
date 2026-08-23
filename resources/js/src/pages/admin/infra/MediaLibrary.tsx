import React, { useEffect, useMemo, useState } from 'react';
import { Image as ImageIcon, Trash2, Upload, Search, Link2, Unlink, Info } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Can } from '../../../components/Can';
import { apiGet, apiMutate, apiUpload } from '../../../lib/api';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';

type MediaItem = {
  path: string;
  url: string;
  name: string;
  size: number;
  updatedAt: string;
  used: boolean;
  usedBy: { id: string; name: string; type: string }[];
};

type MediaResponse = {
  items: MediaItem[];
  stats: { total: number; used: number; unused: number };
};

type FilterTab = 'Todas' | 'En uso' | 'Sin usar';

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function usageLabel(item: MediaItem): string {
  if (!item.usedBy.length) return 'No está asignada a ningún producto ni al kit de marca.';
  return item.usedBy.map((u) => u.name).join(' · ');
}

export default function MediaLibrary() {
  const [data, setData] = useState<MediaResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [filter, setFilter] = useState<FilterTab>('Todas');
  const [search, setSearch] = useState('');
  const [pendingDelete, setPendingDelete] = useState<MediaItem | null>(null);
  const [forceDelete, setForceDelete] = useState(false);

  const load = () => {
    setLoading(true);
    apiGet<MediaResponse>('/api/media', { fresh: true })
      .then(setData)
      .catch(() => setData({ items: [], stats: { total: 0, used: 0, unused: 0 } }))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const items = useMemo(() => {
    const list = data?.items || [];
    return list.filter((item) => {
      if (filter === 'En uso' && !item.used) return false;
      if (filter === 'Sin usar' && item.used) return false;
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.path.toLowerCase().includes(q) ||
        item.usedBy.some((u) => u.name.toLowerCase().includes(q) || u.type.toLowerCase().includes(q))
      );
    });
  }, [data, filter, search]);

  const onUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('folder', 'catalog');
        await apiUpload('/api/media/upload', fd);
      }
      load();
    } finally {
      setUploading(false);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    await apiMutate('delete', '/api/media', {
      path: pendingDelete.path,
      force: forceDelete || undefined,
    });
    setPendingDelete(null);
    setForceDelete(false);
    load();
  };

  const stats = data?.stats || { total: 0, used: 0, unused: 0 };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-sa-text tracking-tight">Gestor de imágenes</h1>
          <p className="text-sm text-sa-muted mt-1 max-w-2xl">
            Fotos de catálogo y archivos del kit de marca. Los logos de cabecera, footer, login y pestaña se marcan como
            <span className="text-sa-text font-semibold"> En uso</span> cuando están enlazados en Configuración.
          </p>
        </div>
        <Can ability="catalog.manage">
          <label className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 cursor-pointer transition-colors shadow-lg shadow-blue-900/20">
            <Upload className="h-4 w-4" />
            {uploading ? 'Subiendo…' : 'Subir imágenes'}
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                void onUpload(e.target.files);
                e.target.value = '';
              }}
            />
          </label>
        </Can>
      </div>

      <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 px-4 py-3 flex gap-3 text-sm text-sa-muted">
        <Info className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs sm:text-sm leading-relaxed">
          <p>
            <span className="font-semibold text-sa-text">Isotipo</span> → pestaña del navegador + menú admin.
            {' '}<span className="font-semibold text-sa-text">Imagotipo</span> → cabecera de la web.
            {' '}<span className="font-semibold text-sa-text">Isologo</span> → footer y login.
            {' '}<span className="font-semibold text-sa-text">Logotipo</span> → respaldo (texto) si faltan los otros.
          </p>
          <p className="text-sa-faint">Cada uno tiene versión clara y oscura según el tema del sitio.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: 'Total', value: stats.total },
          { label: 'En uso', value: stats.used },
          { label: 'Sin usar', value: stats.unused },
        ].map((s) => (
          <div key={s.label} className="bg-sa-panel border border-sa-border rounded-2xl p-4">
            <p className="text-[10px] font-bold text-sa-faint uppercase tracking-wider">{s.label}</p>
            <p className="text-2xl font-extrabold text-sa-text mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-sa-panel border border-sa-border rounded-2xl p-3 sm:p-4 flex flex-col lg:flex-row gap-3 lg:items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {(['Todas', 'En uso', 'Sin usar'] as FilterTab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              className={cn(
                'px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors',
                filter === tab
                  ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                  : 'bg-sa-canvas text-sa-muted border-sa-border hover:text-sa-text hover:border-sa-border-strong',
              )}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="relative w-full lg:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-sa-faint pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, carpeta o uso…"
            className="w-full pl-10 pr-3 py-2.5 bg-sa-input border border-sa-border rounded-xl text-sa-text text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder-sa-faint"
          />
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-sa-faint text-center py-16">Cargando medios…</p>
      ) : items.length === 0 ? (
        <EmptyState
          icon={ImageIcon}
          title="Sin imágenes"
          description="Sube capturas de tus sistemas desde aquí o desde el catálogo SaaS."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {items.map((item) => {
            const isBrand = item.path.includes('/branding/') || item.usedBy.some((u) => u.type === 'branding');
            return (
              <div key={item.path} className="bg-sa-panel border border-sa-border rounded-2xl overflow-hidden flex flex-col">
                <div className={cn('aspect-video relative', isBrand ? 'bg-sa-canvas flex items-center justify-center p-4' : 'bg-sa-canvas')}>
                  <img
                    src={item.url}
                    alt={item.name}
                    className={cn('w-full h-full', isBrand ? 'object-contain max-h-full' : 'object-cover')}
                    loading="lazy"
                  />
                  <span
                    className={cn(
                      'absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border',
                      item.used
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                        : 'bg-amber-500/15 text-amber-400 border-amber-500/30',
                    )}
                  >
                    {item.used ? <Link2 className="h-3 w-3" /> : <Unlink className="h-3 w-3" />}
                    {item.used ? 'En uso' : 'Sin usar'}
                  </span>
                </div>
                <div className="p-3 flex-1 flex flex-col gap-2">
                  <p className="text-xs font-semibold text-sa-text truncate" title={item.name}>{item.name}</p>
                  <p className="text-[10px] text-sa-faint">
                    {formatBytes(item.size)}
                    {isBrand ? ' · Kit de marca' : ''}
                  </p>
                  <p className="text-[11px] text-sa-muted line-clamp-3 leading-snug">{usageLabel(item)}</p>
                  <Can ability="catalog.manage">
                    <button
                      type="button"
                      onClick={() => {
                        setForceDelete(item.used);
                        setPendingDelete(item);
                      }}
                      className="mt-auto w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Eliminar
                    </button>
                  </Can>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        isOpen={!!pendingDelete}
        title="Eliminar imagen"
        description={
          pendingDelete?.used
            ? `“${pendingDelete?.name}” está en uso (${pendingDelete.usedBy.map((u) => u.name).join(', ')}). Se desvinculará y se borrará el archivo.`
            : `¿Eliminar “${pendingDelete?.name}”? Esta acción no se puede deshacer.`
        }
        confirmText={pendingDelete?.used ? 'Quitar y eliminar' : 'Eliminar'}
        isDestructive
        onConfirm={() => { void confirmDelete(); }}
        onCancel={() => { setPendingDelete(null); setForceDelete(false); }}
      />
    </div>
  );
}
