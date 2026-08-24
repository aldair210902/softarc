import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  Globe,
  LayoutTemplate,
  MessageCircle,
  PenTool,
  Search,
  Smartphone,
} from 'lucide-react';
import { useCompanySettings } from '../../../hooks/useCompanySettings';

export default function WebAndBlogs() {
  const { settings } = useCompanySettings();
  const brand = settings.commercialName || 'Software Architec';
  const wa = (settings.salesWhatsapp || '').replace(/\D/g, '');
  const waHref = wa
    ? `https://wa.me/${wa}?text=${encodeURIComponent(`Hola ${brand}, quiero cotizar una página web o blog.`)}`
    : null;

  const types = [
    {
      icon: LayoutTemplate,
      title: 'Landing / página de campaña',
      desc: 'Una página clara para captar contactos o vender un servicio, con enlace a WhatsApp.',
    },
    {
      icon: Globe,
      title: 'Web corporativa',
      desc: 'Sitio de tu empresa: quiénes somos, servicios, contacto. Diseño adaptable a celular.',
    },
    {
      icon: PenTool,
      title: 'Blog o plataforma de contenidos',
      desc: 'Publicar artículos o novedades para atraer visitas. SEO básico según el alcance.',
    },
    {
      icon: Smartphone,
      title: 'Sitio + sistema',
      desc: 'Si además necesitas un panel o tienda, lo cotizamos junto (ver también Sistemas web).',
    },
  ];

  const includes = [
    'Diseño responsive (celular y PC)',
    'Puesta en marcha según lo acordado',
    'Orientación SEO on-page básica',
    'Conexión a WhatsApp de contacto',
    'Dominio y hosting se cotizan aparte (o con el paquete si lo pides)',
  ];

  return (
    <div className="bg-sa-canvas text-sa-text min-h-screen py-12 md:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-600/10 border border-blue-500/30 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-6">
            <Globe className="h-3.5 w-3.5" /> Páginas web & blogs · {brand}
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-sa-text tracking-tight mb-6 leading-tight">
            Presencia online{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">clara y usable</span>
          </h1>
          <p className="text-lg text-sa-muted leading-relaxed mb-8">
            Landing, web de empresa, blog o plataforma. Sin paquetes con precio fijo en la web: te cotizamos según secciones, contenido y si incluye dominio/hosting.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            {waHref && (
              <a href={waHref} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500">
                <MessageCircle className="h-4 w-4" /> Cotizar por WhatsApp
              </a>
            )}
            <Link to="/#contact" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-sa-text bg-sa-panel border border-sa-border hover:border-blue-500/40">
              Formulario <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-5 mb-16">
          {types.map((t) => (
            <div key={t.title} className="bg-sa-panel border border-sa-border rounded-2xl p-6 hover:border-blue-500/40 transition-colors">
              <div className="w-11 h-11 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-4">
                <t.icon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-sa-text mb-2">{t.title}</h3>
              <p className="text-sm text-sa-muted leading-relaxed">{t.desc}</p>
            </div>
          ))}
        </div>

        <div className="bg-sa-panel border border-sa-border rounded-3xl p-8 md:p-10 mb-16">
          <div className="flex items-center gap-2 mb-4">
            <Search className="h-5 w-5 text-blue-400" />
            <h2 className="text-2xl font-extrabold text-sa-text">Qué suele incluirse</h2>
          </div>
          <p className="text-sm text-sa-muted mb-6">El detalle exacto lo cerramos en la cotización.</p>
          <ul className="grid sm:grid-cols-2 gap-3">
            {includes.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-sa-text">
                <CheckCircle2 className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-gradient-to-r from-blue-900/40 via-[#111827] to-cyan-900/40 border border-blue-500/30 rounded-3xl p-8 md:p-10 text-center">
          <h3 className="text-2xl font-bold text-sa-text mb-3">¿Necesitas web, blog o ambas?</h3>
          <p className="text-sm text-sa-muted max-w-xl mx-auto mb-6">
            Escríbenos: te orientamos sin comprometer precios fijos en la página.
          </p>
          {waHref ? (
            <a href={waHref} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500">
              <MessageCircle className="h-4 w-4" /> WhatsApp
            </a>
          ) : (
            <Link to="/#contact" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white bg-blue-600">
              Contactar
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
