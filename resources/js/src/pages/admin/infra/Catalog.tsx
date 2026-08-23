import React, { useState, useEffect } from 'react';
import { Plus, Search, Box, DollarSign, Users, ExternalLink, Edit2, FlaskConical, ShoppingCart, LayoutTemplate, Puzzle, ImagePlus, X, Images } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCompanySettings } from '../../../hooks/useCompanySettings';
import { cn } from '../../../lib/utils';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Can } from '../../../components/Can';
import { SaaSProduct } from '../../../types';
import { apiGet, apiMutate, apiUpload } from '../../../lib/api';
import { Field, FormModal, inputClass } from '../../../components/ui/FormModal';
import { DetailModal, DetailGrid, DetailItem } from '../../../components/ui/DetailModal';

type FilterTab = 'Todos' | 'Gestión & ERP' | 'E-commerce' | 'Módulos Extra' | 'Beta / Desarrollo';

const TECH_PRESETS = [
  'React', 'Vue.js', 'Laravel', 'PHP', 'Node.js', 'MySQL', 'PostgreSQL',
  'Tailwind', 'Vite', 'Meta API', 'WhatsApp API', 'REST API', 'Docker',
];

const iconMap: Record<string, any> = {
  ShoppingCart,
  Box,
  LayoutTemplate,
  Puzzle,
  FlaskConical,
};

const emptyProduct = {
  name: '',
  description: '',
  category: 'Gestión & ERP',
  status: 'Activo',
  setupFee: '',
  monthlyFee: '',
  activeClients: '0',
  techStack: [] as string[],
  customTech: '',
  iconName: 'Box',
  imageUrls: [] as string[],
};

export default function Catalog() {
  const { settings } = useCompanySettings();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('Todos');
  const [products, setProducts] = useState<SaaSProduct[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [form, setForm] = useState(emptyProduct);
  const [detailProduct, setDetailProduct] = useState<SaaSProduct | null>(null);

  const loadProducts = () => {
    apiGet<SaaSProduct[]>('/api/catalog', { fresh: true })
      .then(setProducts)
      .catch(() => setProducts([]));
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyProduct);
    setModalOpen(true);
  };

  const openEdit = (product: SaaSProduct) => {
    setEditingId(product.id);
    setForm({
      name: product.name,
      description: product.description || '',
      category: product.category,
      status: product.status,
      setupFee: String(product.setupFee ?? 0),
      monthlyFee: String(product.monthlyFee ?? 0),
      activeClients: String(product.activeClients ?? 0),
      techStack: [...(product.techStack || [])],
      customTech: '',
      iconName: product.iconName || 'Box',
      imageUrls: [...(product.imageUrls || [])],
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setForm(emptyProduct);
  };

  const toggleTech = (tech: string) => {
    setForm((prev) => {
      const exists = prev.techStack.some((t) => t.toLowerCase() === tech.toLowerCase());
      return {
        ...prev,
        techStack: exists
          ? prev.techStack.filter((t) => t.toLowerCase() !== tech.toLowerCase())
          : [...prev.techStack, tech],
      };
    });
  };

  const addCustomTech = () => {
    const value = form.customTech.trim();
    if (!value) return;
    toggleTech(value);
    setForm((prev) => ({ ...prev, customTech: '' }));
  };

  const uploadImages = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploadingImages(true);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('folder', 'catalog');
        const res = await apiUpload<{ url: string }>('/api/media/upload', fd);
        if (res?.url) urls.push(res.url);
      }
      if (urls.length) {
        setForm((prev) => ({ ...prev, imageUrls: [...prev.imageUrls, ...urls] }));
      }
    } finally {
      setUploadingImages(false);
    }
  };

  const removeImage = (url: string) => {
    setForm((prev) => ({ ...prev, imageUrls: prev.imageUrls.filter((u) => u !== url) }));
  };

  const saveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        name: form.name,
        description: form.description,
        category: form.category,
        status: form.status,
        setupFee: Number(form.setupFee || 0),
        monthlyFee: Number(form.monthlyFee || 0),
        activeClients: Number(form.activeClients || 0),
        techStack: form.techStack,
        iconName: form.iconName,
        imageUrls: form.imageUrls,
      };
      if (editingId) {
        await apiMutate('put', `/api/catalog/${editingId}`, payload);
      } else {
        await apiMutate('post', '/api/catalog', payload);
      }
      closeModal();
      loadProducts();
    } finally {
      setSubmitting(false);
    }
  };

  const deleteProduct = async (product: SaaSProduct) => {
    if (!window.confirm(`¿Eliminar el producto "${product.name}"?`)) return;
    await apiMutate('delete', `/api/catalog/${product.id}`);
    loadProducts();
  };

  const activeProducts = products.filter((p) => p.status === 'Activo' || p.status === 'Beta').length;
  const totalMRR = products.reduce((sum, p) => sum + (p.monthlyFee * p.activeClients), 0);
  const totalInstances = products.reduce((sum, p) => sum + p.activeClients, 0);

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.techStack.some((tech) => tech.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;
    if (activeTab !== 'Todos' && product.category !== activeTab) return false;
    return true;
  });

  const getStatusBadge = (status: SaaSProduct['status']) => {
    switch (status) {
      case 'Activo':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'Beta':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'En Desarrollo':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      default:
        return 'bg-slate-500/10 text-sa-muted border-slate-500/20';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-extrabold text-sa-text tracking-tight">Catálogo de Productos SaaS</h1>
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <Can ability="catalog.manage">
            <Link
              to="/admin/infra/media">
              <Images className="h-4 w-4 mr-2" />
              Gestor de imágenes
            </Link>
          </Can>
          <Can ability="catalog.manage">
            <button type="button" onClick={openCreate} className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/20"><Plus className="h-4 w-4 mr-2" />
              Nuevo Producto SaaS
            </button>
          </Can>
        </div>
      </div>

      <FormModal open={modalOpen} title={editingId ? 'Editar Producto SaaS' : 'Nuevo Producto SaaS'} onClose={closeModal} onSubmit={saveProduct} submitting={submitting} submitLabel={editingId ? 'Guardar cambios' : 'Crear Producto'} wide>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Nombre">
            <input required className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="ej: SoftArc ERP" />
          </Field>
          <Field label="Categoría">
            <select className={inputClass} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              <option>Gestión & ERP</option>
              <option>E-commerce</option>
              <option>Módulos Extra</option>
              <option>Beta / Desarrollo</option>
            </select>
          </Field>
          <Field label="Estado">
            <select className={inputClass} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option>Activo</option>
              <option>Beta</option>
              <option>En Desarrollo</option>
              <option>Inactivo</option>
            </select>
          </Field>
          <Field label="Icono">
            <select className={inputClass} value={form.iconName} onChange={(e) => setForm({ ...form, iconName: e.target.value })}>
              <option value="Box">Caja / genérico</option>
              <option value="ShoppingCart">E-commerce</option>
              <option value="LayoutTemplate">Plantilla / web</option>
              <option value="Puzzle">Módulo</option>
              <option value="FlaskConical">Beta / laboratorio</option>
            </select>
          </Field>
          <Field label={`Setup / puesta en marcha (${settings.currencySymbol})`} hint="Pago único al contratar. Pon 0 si no cobras setup.">
            <input type="number" min="0" className={inputClass} value={form.setupFee} onChange={(e) => setForm({ ...form, setupFee: e.target.value })} placeholder="0" />
          </Field>
          <Field label={`Mensualidad (${settings.currencySymbol})`} hint="Cuota recurrente por mes del SaaS.">
            <input type="number" min="0" className={inputClass} value={form.monthlyFee} onChange={(e) => setForm({ ...form, monthlyFee: e.target.value })} placeholder="0" />
          </Field>
          <Field label="Clientes activos">
            <input type="number" min="0" className={inputClass} value={form.activeClients} onChange={(e) => setForm({ ...form, activeClients: e.target.value })} />
          </Field>
        </div>

        <div className="rounded-xl border border-sa-border bg-sa-canvas/40 p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-sa-text">Imágenes / capturas (opcional)</p>
              <p className="text-[11px] text-sa-faint mt-0.5">Se muestran en la web pública. JPG, PNG o WebP hasta 5 MB.</p>
            </div>
            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600/15 text-blue-300 border border-blue-500/30 hover:bg-blue-600/25 cursor-pointer shrink-0">
              <ImagePlus className="h-3.5 w-3.5" />
              {uploadingImages ? 'Subiendo…' : 'Añadir'}
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                disabled={uploadingImages}
                onChange={(e) => {
                  void uploadImages(e.target.files);
                  e.target.value = '';
                }}
              />
            </label>
          </div>
          {form.imageUrls.length === 0 ? (
            <p className="text-[11px] text-sa-faint">Sin imágenes aún.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {form.imageUrls.map((url) => (
                <div key={url} className="relative aspect-video rounded-lg overflow-hidden border border-sa-border-strong bg-sa-panel group">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(url)} title="Quitar de este producto"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-sa-border bg-sa-canvas/40 p-4 space-y-3">
          <div>
            <p className="text-sm font-bold text-sa-text">Tech stack</p>
            <p className="text-[11px] text-sa-faint mt-0.5">Haz clic para marcar o añade una tecnología propia.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {[...new Set([...TECH_PRESETS, ...form.techStack])].map((tech) => {
              const selected = form.techStack.some((t) => t.toLowerCase() === tech.toLowerCase());
              return (
                <button
                  key={tech}
                  type="button"
                  onClick={() => toggleTech(tech)}
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors',
                    selected
                      ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                      : 'bg-sa-panel text-sa-muted border-sa-border-strong hover:border-sa-muted hover:text-sa-text',
                  )}
                >
                  {tech}
                </button>
              );
            })}
          </div>
          <div className="flex gap-2">
            <input
              className={cn(inputClass, 'flex-1')}
              value={form.customTech}
              onChange={(e) => setForm({ ...form, customTech: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addCustomTech();
                }
              }}
              placeholder="Otra tecnología… (Enter para añadir)"
            />
            <button type="button" onClick={addCustomTech} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors">
              Añadir
            </button>
          </div>
        </div>

        <Field label="Descripción">
          <textarea required className={inputClass} rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Qué resuelve el producto…" />
        </Field>
      </FormModal>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-sa-panel border border-sa-border rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
            <Box className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-sa-faint uppercase tracking-wider mb-1">Productos activos</p>
            <h3 className="text-2xl font-extrabold text-sa-text">{activeProducts}</h3>
          </div>
        </div>
        <div className="bg-sa-panel border border-sa-border rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-sa-faint uppercase tracking-wider mb-1">MRR del catálogo</p>
            <h3 className="text-2xl font-extrabold text-sa-text">{settings.currencySymbol} {totalMRR.toLocaleString()}</h3>
          </div>
        </div>
        <div className="bg-sa-panel border border-sa-border rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-sa-faint uppercase tracking-wider mb-1">Instancias</p>
            <h3 className="text-2xl font-extrabold text-sa-text">{totalInstances}</h3>
          </div>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="flex items-center gap-1 bg-sa-panel border border-sa-border rounded-xl p-1 overflow-x-auto custom-scrollbar w-full xl:w-auto">
          {(['Todos', 'Gestión & ERP', 'E-commerce', 'Módulos Extra', 'Beta / Desarrollo'] as FilterTab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap',
                activeTab === tab ? 'bg-sa-border text-sa-text shadow-sm' : 'text-sa-faint hover:text-sa-muted hover:bg-sa-border/50',
              )}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="relative w-full xl:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-sa-faint" />
          <input
            type="text"
            placeholder="Buscar producto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-3 py-2.5 bg-sa-input border border-sa-border rounded-xl text-sa-text text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder-sa-faint"/>
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <EmptyState icon={Box} title="No hay productos SaaS" description="No se encontraron productos con esos filtros." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => {
            const Icon = iconMap[product.iconName] || Box;
            const cover = product.imageUrls?.[0];
            return (
              <div
                key={product.id}
                onClick={() => setDetailProduct(product)}
                className="bg-sa-panel rounded-2xl border border-sa-border overflow-hidden group hover:border-sa-border-strong transition-all flex flex-col cursor-pointer"
              >
                {cover && (
                  <div className="aspect-video bg-sa-canvas overflow-hidden border-b border-sa-border">
                    <img src={cover} alt={product.name} className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300" />
                  </div>
                )}
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex gap-3 mb-4">
                    <div >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sa-text text-lg leading-tight mb-1">{product.name}</h4>
                      <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border', getStatusBadge(product.status))}>
                        {product.status}
                      </span>
                    </div>
                  </div>
                  <p className="text-sa-muted text-sm mb-5 flex-1 leading-relaxed">{product.description}</p>
                  <div className="bg-sa-canvas rounded-xl p-4 border border-sa-border mb-4">
                    <div className="flex justify-between items-center mb-2 pb-2 border-b border-sa-border">
                      <span className="text-[11px] text-sa-faint">Setup</span>
                      <span className="text-sm font-semibold text-sa-text">{settings.currencySymbol} {product.setupFee.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] text-sa-faint">Mensualidad</span>
                      <span className="text-base font-extrabold text-blue-400">{settings.currencySymbol} {product.monthlyFee.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {product.techStack.map((tech) => (
                      <span key={tech} className="px-2 py-1 bg-sa-border border border-sa-border-strong rounded-md text-[10px] font-medium text-sa-muted">{tech}</span>
                    ))}
                  </div>
                </div>
                <div className="p-4 border-t border-sa-border bg-sa-canvas/50 flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
                  <Link to="/catalogo" >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Ver en web
                  </Link>
                  <Can ability="catalog.manage">
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => openEdit(product)} title="Editar" className="p-2 rounded-lg text-sa-faint hover:text-sa-text hover:bg-sa-border/60 transition-colors">
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button type="button" onClick={() => deleteProduct(product)} className="px-3 py-2 bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-bold rounded-lg hover:bg-red-500/20">
                        Eliminar
                      </button>
                    </div>
                  </Can>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <DetailModal
        open={!!detailProduct}
        title={detailProduct?.name || 'Producto'}
        subtitle={detailProduct?.category || undefined}
        onClose={() => setDetailProduct(null)}
        wide
        footer={detailProduct && (
          <>
            <Can ability="catalog.manage">
              <button type="button" onClick={() => { const prod = detailProduct; setDetailProduct(null); openEdit(prod); }} className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors">
                Editar
              </button>
            </Can>
            <button type="button" onClick={() => setDetailProduct(null)} className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-semibold text-sa-muted hover:text-sa-text hover:bg-sa-border/60 transition-colors">Cerrar</button>
          </>
        )}
      >
        {detailProduct && (
          <div className="space-y-4">
            {(detailProduct.imageUrls?.length || 0) > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {detailProduct.imageUrls!.map((url) => (
                  <img key={url} src={url} alt="" className="rounded-lg border border-sa-border aspect-video object-cover w-full" />
                ))}
              </div>
            )}
            <DetailGrid>
              <DetailItem label="Nombre" value={detailProduct.name} />
              <DetailItem label="Categoría" value={detailProduct.category} />
              <DetailItem label="Estado" value={detailProduct.status} />
              <DetailItem label="Clientes activos" value={detailProduct.activeClients} />
              <DetailItem label="Setup" value={`${settings.currencySymbol} ${detailProduct.setupFee.toLocaleString()}`} />
              <DetailItem label="Mensualidad" value={`${settings.currencySymbol} ${detailProduct.monthlyFee.toLocaleString()}`} />
              <DetailItem label="Descripción" value={detailProduct.description} full />
              <DetailItem label="Tech stack" value={(detailProduct.techStack || []).join(', ')} full />
            </DetailGrid>
          </div>
        )}
      </DetailModal>
    </div>
  );
}
