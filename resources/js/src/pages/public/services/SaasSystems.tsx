import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Box,
  CheckCircle2,
  Clock,
  Globe,
  HardDrive,
  Layers,
  MessageCircle,
  Puzzle,
  Receipt,
  ShoppingCart,
  Sparkles,
  Store,
  Truck,
  Zap,
} from 'lucide-react';
import { useCompanySettings } from '../../../hooks/useCompanySettings';
import { apiGet } from '../../../lib/api';
import {
  DEFAULT_SAAS_CONTENT,
  normalizeSaasContent,
  type SaasContent,
} from '../../../lib/saasWebDefaults';
import type { SaaSProduct } from '../../../types';

const MODULE_ICONS = [ShoppingCart, Layers, Truck, Receipt, Globe, HardDrive];
const MODALITY_ICONS = [Store, Globe, Box, Layers, HardDrive];

export default function SaasSystems() {
  const { settings } = useCompanySettings();
  const brand = settings.commercialName || 'Software Architec';
  const currency = settings.currencySymbol || 'S/';
  const [content, setContent] = useState<SaasContent>(DEFAULT_SAAS_CONTENT);
  const [demos, setDemos] = useState<SaaSProduct[]>([]);

  const wa = (settings.salesWhatsapp || '').replace(/\D/g, '');
  const waHref = wa
    ? `https://wa.me/${wa}?text=${encodeURIComponent(settings.whatsappWelcomeMessage || `Hola ${brand}, quiero información sobre un sistema web.`)}`
    : null;

  useEffect(() => {
    apiGet<{ content: Partial<SaasContent> }>('/api/web-pages/saas')
      .then((res) => setContent(normalizeSaasContent(res?.content)))
      .catch(() => setContent(DEFAULT_SAAS_CONTENT));

    apiGet<SaaSProduct[]>('/api/catalog')
      .then((items) =>
        setDemos(
          (items || [])
            .filter((p) => p.status === 'Activo' || p.status === 'Beta')
            .slice(0, 6),
        ),
      )
      .catch(() => setDemos([]));
  }, []);

  const showPlans = content.plans.length > 0;

  return (
    <div className="bg-sa-canvas text-sa-text min-h-screen py-12 md:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-600/10 border border-blue-500/30 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-6">
            <Sparkles className="h-3.5 w-3.5" />
            {content.badge}
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-sa-text tracking-tight mb-6 leading-tight">
            {content.title}{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
              {content.titleHighlight}
            </span>
          </h1>
          <p className="text-lg text-sa-muted leading-relaxed mb-8">{content.subtitle}</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            {waHref && (
              <a
                href={waHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors"
              >
                <MessageCircle className="h-4 w-4" /> Escribir por WhatsApp
              </a>
            )}
            <Link
              to="/#contact"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-sa-text bg-sa-panel border border-sa-border hover:border-blue-500/40 transition-colors"
            >
              Formulario de contacto <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Cómo contratar */}
        <div className="bg-sa-panel border border-sa-border rounded-3xl p-8 md:p-10 mb-16 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[420px] h-[420px] bg-blue-600/10 blur-[100px] rounded-full pointer-events-none" />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-4">
              <Store className="h-4 w-4" /> {brand}
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-sa-text mb-4">{content.featured.title}</h2>
            <p className="text-sa-muted leading-relaxed mb-6 max-w-3xl">{content.featured.description}</p>
            <div className="grid sm:grid-cols-2 gap-4">
              {content.featured.bullets.map((bullet, i) => (
                <div key={i} className="flex items-start gap-3 bg-sa-canvas/60 border border-sa-border rounded-xl p-4">
                  <div className="p-1 rounded bg-blue-600/20 text-blue-400 mt-0.5">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <p className="text-sm text-sa-text font-medium leading-relaxed">{bullet}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modalidades */}
        <div className="mb-16">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-3xl font-extrabold text-sa-text mb-3">Modalidades de servicio</h2>
            <p className="text-sm text-sa-muted">Sin tarifas fijas en la web: cotizamos según el sistema y el alcance.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            {(content.modalities?.length ? content.modalities : DEFAULT_SAAS_CONTENT.modalities).map((mod, i) => {
              const Icon = MODALITY_ICONS[i % MODALITY_ICONS.length];
              return (
                <div key={i} className="bg-sa-panel border border-sa-border rounded-2xl p-6 hover:border-blue-500/40 transition-colors">
                  <div className="w-11 h-11 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-4">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-bold text-sa-text mb-2">{mod.title}</h3>
                  <p className="text-sm text-sa-muted leading-relaxed">{mod.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Qué resolvemos */}
        <div className="mb-16">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-3xl font-extrabold text-sa-text mb-3">Qué podemos resolver hoy</h2>
            <p className="text-sm text-sa-muted">
              Enfocados en lo que ya hemos construido y en lo que Software Architec ofrece ahora.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {content.modules.map((mod, i) => {
              const Icon = MODULE_ICONS[i % MODULE_ICONS.length];
              return (
                <div key={i} className="bg-sa-panel border border-sa-border rounded-2xl p-6 hover:border-blue-500/40 transition-colors">
                  <div className="w-11 h-11 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-4">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-bold text-sa-text mb-2">{mod.title}</h3>
                  <p className="text-sm text-sa-muted leading-relaxed">{mod.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Extras opcionales */}
        {(content.extras?.length ? content.extras : DEFAULT_SAAS_CONTENT.extras).length > 0 && (
          <div className="mb-16">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <h2 className="text-3xl font-extrabold text-sa-text mb-3">Opciones bajo demanda</h2>
              <p className="text-sm text-sa-muted">
                Se agregan a la cotización solo si las pides. No forman parte automática de cada entrega.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {(content.extras?.length ? content.extras : DEFAULT_SAAS_CONTENT.extras).map((item, i) => (
                <div key={i} className="bg-sa-panel border border-sa-border rounded-2xl p-5 hover:border-cyan-500/30 transition-colors">
                  <div className="w-9 h-9 rounded-lg bg-cyan-600/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mb-3">
                    <Puzzle className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm font-bold text-sa-text mb-1.5">{item.title}</h3>
                  <p className="text-xs text-sa-muted leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Próximamente */}
        {(content.comingSoon?.length ? content.comingSoon : DEFAULT_SAAS_CONTENT.comingSoon).length > 0 && (
          <div className="mb-16">
            <div className="text-center max-w-2xl mx-auto mb-8">
              <h2 className="text-3xl font-extrabold text-sa-text mb-3">Próximamente</h2>
              <p className="text-sm text-sa-muted">Giros que queremos desarrollar más adelante.</p>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              {(content.comingSoon?.length ? content.comingSoon : DEFAULT_SAAS_CONTENT.comingSoon).map((item, i) => (
                <div
                  key={i}
                  className="inline-flex items-start gap-3 bg-sa-panel/80 border border-dashed border-sa-border rounded-2xl px-4 py-3 max-w-xs"
                >
                  <Clock className="h-4 w-4 text-sa-faint mt-0.5 shrink-0" />
                  <div>
                    <div className="text-sm font-bold text-sa-text">{item.title}</div>
                    <div className="text-xs text-sa-muted mt-0.5">{item.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ejemplos / capturas del catálogo */}
        <div className="mb-16">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
            <div>
              <h2 className="text-3xl font-extrabold text-sa-text mb-2">Ejemplos de sistemas</h2>
              <p className="text-sm text-sa-muted max-w-xl">
                Capturas o fichas con nombres genéricos (tienda, flota, ERP…). Los nombres de clientes no son el producto SoftArc.
              </p>
            </div>
            <Link to="/catalogo" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-400 hover:text-blue-300">
              Ver listado <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {demos.length === 0 ? (
            <div className="bg-sa-panel border border-dashed border-sa-border rounded-2xl p-10 text-center">
              <Zap className="h-9 w-9 text-sa-faint mx-auto mb-3" />
              <p className="text-sa-text font-semibold mb-1">Aún sin fichas públicas</p>
              <p className="text-sm text-sa-muted mb-5">
                Cuando subas imágenes en Demos de sistemas (admin), aparecerán aquí. Mientras tanto, escríbenos y te mostramos capturas.
              </p>
              {waHref ? (
                <a
                  href={waHref}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500"
                >
                  <MessageCircle className="h-4 w-4" /> WhatsApp
                </a>
              ) : (
                <Link to="/#contact" className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500">
                  Contactar
                </Link>
              )}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {demos.map((demo) => (
                <div
                  key={demo.id}
                  className="bg-sa-panel border border-sa-border rounded-2xl overflow-hidden flex flex-col hover:border-blue-500/40 transition-colors"
                >
                  <div className="h-36 bg-sa-panel-2 border-b border-sa-border flex items-center justify-center relative">
                    {demo.imageUrls?.[0] ? (
                      <img src={demo.imageUrls[0]} alt={demo.name} className="w-full h-full object-cover" />
                    ) : (
                      <Zap className="h-8 w-8 text-blue-500/60" />
                    )}
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <div className="text-[11px] text-sa-faint font-semibold uppercase tracking-wider mb-1">{demo.category}</div>
                    <h3 className="text-lg font-bold text-sa-text mb-2">{demo.name}</h3>
                    <p className="text-sm text-sa-muted line-clamp-3 mb-4 flex-1">{demo.description}</p>
                    {(Number(demo.monthlyFee) > 0 || Number(demo.setupFee) > 0) && (
                      <div className="flex items-center justify-between gap-2 text-xs text-sa-faint mb-4">
                        {Number(demo.monthlyFee) > 0 && (
                          <span>
                            Ref. {currency} {Number(demo.monthlyFee).toFixed(0)}/mes
                          </span>
                        )}
                        {Number(demo.setupFee) > 0 && (
                          <span>
                            Setup {currency} {Number(demo.setupFee).toFixed(0)}
                          </span>
                        )}
                      </div>
                    )}
                    {waHref ? (
                      <a
                        href={waHref}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500"
                      >
                        <MessageCircle className="h-3.5 w-3.5" /> Consultar por WhatsApp
                      </a>
                    ) : (
                      <Link
                        to="/#contact"
                        className="inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500"
                      >
                        Consultar
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Planes solo si hay contenido */}
        {showPlans && (
          <div className="mb-16">
            <div className="text-center max-w-3xl mx-auto mb-10">
              <h2 className="text-3xl font-extrabold text-sa-text mb-3">Planes de referencia</h2>
              <p className="text-sa-muted text-sm">Referencia orientativa; la cotización final se confirma contigo.</p>
            </div>
            <div className="grid lg:grid-cols-3 gap-6">
              {content.plans.map((plan, i) => (
                <div
                  key={i}
                  className={`bg-sa-panel rounded-3xl p-7 border flex flex-col ${
                    plan.highlight ? 'border-blue-500' : 'border-sa-border'
                  }`}
                >
                  <h3 className="text-xl font-bold text-sa-text mb-1">{plan.name}</h3>
                  <p className="text-xs text-sa-muted mb-5">{plan.target}</p>
                  <div className="mb-2 text-3xl font-extrabold text-sa-text">
                    {currency} {plan.monthlyPrice}
                    <span className="text-xs font-medium text-sa-muted"> / mes</span>
                  </div>
                  <div className="text-xs text-blue-400 mb-5">Setup: {plan.setupFee}</div>
                  <ul className="space-y-2 text-xs mb-6 flex-1">
                    {plan.features.map((f, idx) => (
                      <li key={idx} className="flex gap-2">
                        <CheckCircle2 className="h-4 w-4 text-blue-500 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  {waHref ? (
                    <a href={waHref} target="_blank" rel="noreferrer" className="text-center py-3 rounded-xl text-sm font-semibold text-white bg-emerald-600">
                      WhatsApp
                    </a>
                  ) : (
                    <Link to="/#contact" className="text-center py-3 rounded-xl text-sm font-semibold text-white bg-blue-600">
                      Cotizar
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="bg-gradient-to-r from-blue-900/40 via-[#111827] to-cyan-900/40 border border-blue-500/30 rounded-3xl p-8 md:p-12 text-center">
          <h3 className="text-2xl md:text-3xl font-bold text-sa-text mb-4">{content.ctaTitle}</h3>
          <p className="text-sa-muted max-w-xl mx-auto mb-8 text-sm">{content.ctaText}</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            {waHref && (
              <a
                href={waHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500"
              >
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </a>
            )}
            <Link
              to="/#contact"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-sa-text bg-sa-panel/60 border border-sa-border hover:border-blue-500/40"
            >
              Formulario
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
