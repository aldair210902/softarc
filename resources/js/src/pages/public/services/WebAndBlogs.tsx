import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Globe, 
  Smartphone, 
  Search, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  Gauge, 
  Zap, 
  Share2, 
  LayoutTemplate, 
  PenTool,
  TrendingUp
} from 'lucide-react';

export default function WebAndBlogs() {
  const [activeTab, setActiveTab] = useState<'landings' | 'corporate' | 'catalogs' | 'blogs'>('landings');

  const webPackages = [
    {
      name: 'Landing Page de Alta Conversión',
      bestFor: 'Campañas de anuncios en Meta / Google Ads y lanzamientos de productos',
      price: 'S/ 550',
      timeframe: '3 a 5 días hábiles',
      features: [
        'Estructura persuasiva de ventas (Copywriting B2B/B2C)',
        'Optimización de carga instantánea (<1s)',
        'Formularios de contacto directos a WhatsApp y Email',
        'Integración con Meta Pixel, Google Tag Manager y Analytics',
        'Dominio .com por 1 año + Certificado SSL',
        'Diseño 100% responsivo para celulares'
      ],
      highlight: false
    },
    {
      name: 'Web Corporativa Institucional',
      bestFor: 'Empresas consolidadas, consultoras, estudios y proveedores B2B',
      price: 'S/ 1,200',
      timeframe: '7 a 12 días hábiles',
      features: [
        'Hasta 6 secciones interactivas (Inicio, Nosotros, Servicios, Casos, Contacto)',
        'Arquitectura SEO on-page para posicionamiento en Google',
        'Panel autoadministrable fácil para actualizar textos y fotos',
        'Correos corporativos configurados en tu dominio',
        'Sección de testimonios y clientes destacados',
        'Hosting Cloud ultrarrápido por 1 año incluido',
        'Soporte técnico y mantenimiento por 3 meses'
      ],
      highlight: true
    },
    {
      name: 'Portal Web + Blog SEO Dinámico',
      bestFor: 'Marcas que buscan captar prospectos orgánicos mediante contenido',
      price: 'S/ 1,950',
      timeframe: '12 a 18 días hábiles',
      features: [
        'Todo lo incluido en la Web Corporativa',
        'Motor de Blog dinámico con categorías y etiquetas',
        'Generación automática de Schema Markup y Sitemap XML',
        'Módulo de suscripción a boletín / captura de leads',
        'Plantillas optimizadas para compartir en LinkedIn / Redes',
        'Capacitación en redacción y posicionamiento SEO',
        'Monitoreo de métricas y auditoría Core Web Vitals'
      ],
      highlight: false
    }
  ];

  return (
    <div className="bg-sa-canvas text-sa-text min-h-screen py-12 md:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Hero */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-600/10 border border-blue-500/30 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-6">
            <Globe className="h-3.5 w-3.5" />
            Diseño Web & Marketing de Contenidos
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-sa-text tracking-tight mb-6 leading-tight">
            Páginas web diseñadas para <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">convertir visitas en clientes</span>
          </h1>
          <p className="text-lg text-sa-muted leading-relaxed">
            No creamos sitios web lentos ni plantillas genéricas. Desarrollamos plataformas con velocidad extrema, arquitectura SEO sólida y un enfoque visual impecable.
          </p>
        </div>

        {/* 4 Tipologías de Soluciones Web */}
        <div className="mb-20">
          <div className="flex flex-wrap justify-center gap-3 mb-10">
            {[
              { id: 'landings', label: 'Landing Pages de Conversión', icon: Zap },
              { id: 'corporate', label: 'Webs Corporativas', icon: LayoutTemplate },
              { id: 'catalogs', label: 'Catálogos por WhatsApp', icon: Smartphone },
              { id: 'blogs', label: 'Blogs & Artículos SEO', icon: PenTool }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-5 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white border-blue-500 shadow-[0_4px_15px_rgba(59,130,246,0.3)]'
                      : 'bg-sa-panel text-sa-muted border-sa-border hover:text-sa-text hover:border-sa-border-strong'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="bg-sa-panel border border-sa-border rounded-3xl p-8 md:p-12 shadow-2xl">
            {activeTab === 'landings' && (
              <div className="grid lg:grid-cols-2 gap-10 items-center">
                <div>
                  <h3 className="text-2xl md:text-3xl font-bold text-sa-text mb-4">Landing Pages de Alto Rendimiento Comercial</h3>
                  <p className="text-sm text-sa-muted leading-relaxed mb-6">
                    Optimizadas para tráfico pagado en Facebook Ads, Instagram Ads, TikTok y Google Search. Cada elemento gráfico y bloque de texto está diseñado con copywriting orientado a la acción inmediata.
                  </p>
                  <ul className="space-y-3 text-xs text-sa-text mb-8">
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Carga en menos de 0.8 segundos para evitar fugas de prospectos.</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Botón directo a WhatsApp con mensaje precargado personalizado.</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Pruebas A/B listas para validar titulares y ofertas.</li>
                  </ul>
                  <Link to="/#contact" className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-colors">
                    Cotizar Landing Page <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
                <div className="bg-sa-canvas border border-sa-border rounded-2xl p-6 text-center">
                  <div className="text-4xl font-extrabold text-blue-500 mb-2">&lt; 1 seg</div>
                  <div className="text-xs text-sa-muted font-medium mb-6">Velocidad de Carga Garantizada en Móviles</div>
                  <div className="p-4 bg-sa-panel rounded-xl border border-sa-border text-left text-xs space-y-2">
                    <div className="flex justify-between text-sa-muted"><span>Puntaje Google PageSpeed:</span><span className="text-emerald-400 font-bold">98 / 100</span></div>
                    <div className="flex justify-between text-sa-muted"><span>Conversión Promedio:</span><span className="text-blue-400 font-bold">4.8% - 12.5%</span></div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'corporate' && (
              <div className="grid lg:grid-cols-2 gap-10 items-center">
                <div>
                  <h3 className="text-2xl md:text-3xl font-bold text-sa-text mb-4">Páginas Web Corporativas e Institucionales</h3>
                  <p className="text-sm text-sa-muted leading-relaxed mb-6">
                    Construye autoridad y confianza frente a clientes corporativos y licitaciones. Un diseño profesional que refleja la solidez, experiencia y propuesta de valor de tu compañía.
                  </p>
                  <ul className="space-y-3 text-xs text-sa-text mb-8">
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Módulos de servicios, casos de éxito, equipo y testimonios.</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Correos institucionales con tu dominio (ej. ventas@tuempresa.com).</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Certificado de seguridad SSL y cumplimiento de políticas de privacidad.</li>
                  </ul>
                  <Link to="/#contact" className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-colors">
                    Solicitar Propuesta Web <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
                <div className="bg-sa-canvas border border-sa-border rounded-2xl p-6">
                  <div className="h-40 bg-sa-panel rounded-xl border border-sa-border p-4 flex flex-col justify-between">
                    <div className="flex gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                    </div>
                    <div className="text-center py-4 text-sm font-semibold text-sa-text">
                      Diseño Elegante, Limpio y Corporativo
                    </div>
                    <div className="text-[11px] text-center text-blue-400 font-mono">https://tuempresa.com</div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'catalogs' && (
              <div className="grid lg:grid-cols-2 gap-10 items-center">
                <div>
                  <h3 className="text-2xl md:text-3xl font-bold text-sa-text mb-4">Catálogos Digitales con Pedidos por WhatsApp</h3>
                  <p className="text-sm text-sa-muted leading-relaxed mb-6">
                    Perfecto para negocios que venden por redes sociales. Muestra tus productos categorizados con fotos de alta calidad y permite a tus clientes generar carritos de compra que se envían directamente a tu chat de WhatsApp.
                  </p>
                  <ul className="space-y-3 text-xs text-sa-text mb-8">
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Sin necesidad de comisiones por transacción bancaria.</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Búsqueda rápida por categorías, tallas o precios.</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Fácil actualización de precios y disponibilidad.</li>
                  </ul>
                  <Link to="/#contact" className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-colors">
                    Crear mi Catálogo Digital <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
                <div className="bg-sa-canvas border border-sa-border rounded-2xl p-6 text-center">
                  <Smartphone className="h-16 w-16 text-emerald-400 mx-auto mb-4" />
                  <div className="font-bold text-sa-text text-sm mb-1">Cierre Inmediato por WhatsApp</div>
                  <div className="text-xs text-sa-muted">El cliente arma su pedido y tú recibes el resumen con un clic.</div>
                </div>
              </div>
            )}

            {activeTab === 'blogs' && (
              <div className="grid lg:grid-cols-2 gap-10 items-center">
                <div>
                  <h3 className="text-2xl md:text-3xl font-bold text-sa-text mb-4">Blogs Corporativos y Estrategia de Contenidos SEO</h3>
                  <p className="text-sm text-sa-muted leading-relaxed mb-6">
                    Posiciona a tu empresa en las primeras páginas de Google para las búsquedas clave de tu industria. Redactamos y publicamos artículos con intención de búsqueda comercial.
                  </p>
                  <ul className="space-y-3 text-xs text-sa-text mb-8">
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Optimización de palabras clave (Keyword Research).</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Estructura semántica Schema.org para snippets enriquecidos en Google.</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Redacción técnica y comercial enfocada en tu público objetivo.</li>
                  </ul>
                  <Link to="/#contact" className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-colors">
                    Iniciar Plan de Contenidos <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
                <div className="bg-sa-canvas border border-sa-border rounded-2xl p-6 text-center">
                  <TrendingUp className="h-16 w-16 text-blue-500 mx-auto mb-4" />
                  <div className="font-bold text-sa-text text-sm mb-1">Tráfico Orgánico Sostenible</div>
                  <div className="text-xs text-sa-muted">Atracción de clientes potenciales calificados sin pagar por cada clic.</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Paquetes de Desarrollo Web */}
        <div className="mb-20">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-extrabold text-sa-text mb-3">Paquetes de Desarrollo Web</h2>
            <p className="text-sm text-sa-muted">Inversión clara con todo incluido: diseño, dominio, hosting y puesta en marcha.</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {webPackages.map((pkg, i) => (
              <div 
                key={i} 
                className={`bg-sa-panel rounded-3xl p-8 border transition-all duration-300 flex flex-col ${
                  pkg.highlight ? 'border-blue-500 shadow-[0_8px_30px_rgb(59,130,246,0.2)] md:-translate-y-2' : 'border-sa-border hover:border-sa-border-strong'
                }`}>
                <h3 className="text-xl font-bold text-sa-text mb-2">{pkg.name}</h3>
                <p className="text-xs text-sa-muted mb-6 min-h-[32px]">{pkg.bestFor}</p>

                <div className="mb-4">
                  <div >{pkg.price}</div>
                  <div className="text-xs text-blue-400 mt-1">Tiempo de entrega: {pkg.timeframe}</div>
                </div>

                <div className="h-px bg-sa-border my-6"></div>

                <ul className="space-y-3 text-xs text-sa-text mb-8 flex-1">
                  {pkg.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  to="/#contact"
                  className={`w-full py-3.5 rounded-xl font-semibold text-xs transition-all duration-300 text-center ${
                    pkg.highlight 
                      ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg' 
                      : 'bg-sa-panel-2 hover:bg-sa-border text-sa-text border border-sa-border'
                  }`}>
                  Contratar Paquete
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
