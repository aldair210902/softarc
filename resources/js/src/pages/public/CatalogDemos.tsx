import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  PlayCircle,
  ArrowRight,
  CheckCircle2,
  Box,
  MessageCircle,
} from 'lucide-react';
import { apiGet } from '../../lib/api';
import { normalizeBrandSrc } from '../../lib/brandAssets';
import { SaaSProduct } from '../../types';
import { useCompanySettings } from '../../hooks/useCompanySettings';

type FilterId = 'all' | 'E-commerce' | 'Gestión & ERP' | 'Módulos Extra' | 'Beta / Desarrollo';

export default function CatalogDemos() {
  const { settings } = useCompanySettings();
  const [filter, setFilter] = useState<FilterId>('all');
  const [products, setProducts] = useState<SaaSProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<SaaSProduct[]>('/api/catalog')
      .then((rows) => setProducts((rows || []).filter((p) => p.status !== 'Inactivo')))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  const filters = useMemo(() => {
    const cats = Array.from(new Set(products.map((p) => p.category)));
    return [
      { id: 'all' as FilterId, label: 'Todos los Sistemas' },
      ...cats.map((c) => ({ id: c as FilterId, label: c })),
    ];
  }, [products]);

  const filtered = filter === 'all' ? products : products.filter((p) => p.category === filter);

  return (
    <div className="bg-sa-canvas text-sa-text min-h-screen py-12 md:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-600/10 border border-blue-500/30 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-6">
            <PlayCircle className="h-3.5 w-3.5" />
            Ejemplos de sistemas
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-sa-text tracking-tight mb-6 leading-tight">
            Capturas y fichas de{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">sistemas web</span>
          </h1>
          <p className="text-lg text-sa-muted leading-relaxed">
            Ejemplos publicados desde el panel SoftArc. Cotiza por WhatsApp — no son demos interactivas.
          </p>
        </div>

        {filters.length > 1 && (
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            {filters.map((btn) => (
              <button
                key={btn.id}
                type="button"
                onClick={() => setFilter(btn.id)}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                  filter === btn.id
                    ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                    : 'bg-sa-panel text-sa-muted border-sa-border hover:text-sa-text hover:border-sa-border-strong'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="text-center text-sa-faint py-20">Cargando catálogo...</div>
        ) : filtered.length === 0 ? (
          <div className="bg-sa-panel border border-dashed border-sa-border rounded-3xl p-12 text-center mb-20">
            <Box className="h-10 w-10 text-sa-faint mx-auto mb-4" />
            <h3 className="text-xl font-bold text-sa-text mb-2">Aún no hay productos publicados</h3>
            <p className="text-sm text-sa-muted max-w-md mx-auto mb-6">
              Cuando el equipo registre productos SaaS en el panel, aparecerán aquí automáticamente.
            </p>
            <Link to="/#contact" className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-colors">
              Solicitar cotización <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-8 mb-20">
            {filtered.map((product) => (
              <div
                key={product.id}
                className="bg-sa-panel border border-sa-border rounded-3xl overflow-hidden hover:border-blue-500/50 transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1">
                {(product.imageUrls?.length || 0) > 0 && (
                  <div className="aspect-video bg-sa-canvas border-b border-sa-border">
                    <img src={normalizeBrandSrc(product.imageUrls![0])} alt={product.name} loading="lazy" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="p-8 flex flex-col flex-1">
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-600/10 border border-blue-500/20 text-blue-400">
                      {product.category}
                    </span>
                    <span className="text-[11px] text-sa-faint font-medium">{product.status}</span>
                  </div>
                  <h3 className="text-2xl font-bold text-sa-text mb-3 group-hover:text-blue-400 transition-colors">
                    {product.name}
                  </h3>
                  <p className="text-sm text-sa-muted leading-relaxed mb-6">
                    {product.description || 'Sin descripción.'}
                  </p>
                  <div className="space-y-2 mb-6">
                    {(product.techStack || []).slice(0, 4).map((tech) => (
                      <div key={tech} className="flex items-center gap-2 text-xs text-sa-text">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                        <span>{tech}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="px-8 pb-8 pt-0">
                  <div className="pt-6 border-t border-sa-border flex flex-col sm:flex-row items-center justify-between gap-4">
                    {(Number(product.setupFee) > 0 || Number(product.monthlyFee) > 0) ? (
                      <div className="text-xs text-sa-muted">
                        {Number(product.setupFee) > 0 && (
                          <span>Setup {settings.currencySymbol}{Number(product.setupFee).toLocaleString()}</span>
                        )}
                        {Number(product.setupFee) > 0 && Number(product.monthlyFee) > 0 && <span> · </span>}
                        {Number(product.monthlyFee) > 0 && (
                          <span>{settings.currencySymbol}{Number(product.monthlyFee).toLocaleString()}/mes</span>
                        )}
                      </div>
                    ) : (
                      <div className="text-xs text-sa-muted">Cotización según alcance</div>
                    )}
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <Link
                        to="/#contact"
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500"
                      >
                        Cotizar
                      </Link>
                      {settings.salesWhatsapp?.trim() && (
                        <a
                          href={`https://wa.me/${settings.salesWhatsapp}?text=${encodeURIComponent('Hola, me interesa información sobre: ' + product.name)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500"
                        >
                          <MessageCircle className="h-4 w-4" /> WhatsApp
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="bg-sa-panel border border-sa-border rounded-3xl p-8 md:p-12 text-center">
          <h3 className="text-2xl md:text-3xl font-bold text-sa-text mb-4">
            ¿Necesitas una demo con tu marca y catálogo?
          </h3>
          <p className="text-sm text-sa-muted max-w-xl mx-auto mb-8">
            Montamos un entorno de prueba con tu logotipo y reglas comerciales.
          </p>
          <Link to="/#contact" className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-colors">
            Contactar <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
