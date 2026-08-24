import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  Code2,
  Database,
  FileText,
  MessageCircle,
  Workflow,
} from 'lucide-react';
import { useCompanySettings } from '../../../hooks/useCompanySettings';

export default function CustomDevelopment() {
  const { settings } = useCompanySettings();
  const brand = settings.commercialName || 'Software Architec';
  const wa = (settings.salesWhatsapp || '').replace(/\D/g, '');
  const waHref = wa
    ? `https://wa.me/${wa}?text=${encodeURIComponent(`Hola ${brand}, quiero cotizar un desarrollo a la medida.`)}`
    : null;

  const pillars = [
    {
      icon: Database,
      title: 'Sistemas según tu proceso',
      desc: 'ERP, CRM, gestión interna o portales: partimos de cómo trabajas hoy, no de un paquete genérico.',
    },
    {
      icon: Workflow,
      title: 'Integraciones si hacen falta',
      desc: 'WhatsApp, pagos, reportes u otras APIs — solo si las pides y son viables (preferimos opciones gratuitas o acordadas).',
    },
    {
      icon: FileText,
      title: 'Entrega con documentos',
      desc: 'Capacitación, manual y/o video, y acta de conformidad. El alcance y la propiedad se definen en el contrato.',
    },
  ];

  const steps = [
    { n: '01', t: 'Entendemos tu necesidad', d: 'Qué quieres lograr, quiénes usarán el sistema y qué datos manejan.' },
    { n: '02', t: 'Propuesta y alcance', d: 'Te cotizamos sin precios inventados en la web: módulos, plazos y modalidad (compra o proyecto).' },
    { n: '03', t: 'Desarrollo por etapas', d: 'Avances revisables para que valides antes de cerrar.' },
    { n: '04', t: 'Entrega y capacitación', d: 'Puesta en marcha una vez, documentos y cierre firmado. Soporte continuo solo si contratas servicio mensual.' },
  ];

  const extras = [
    'White-label (tu marca en el sistema)',
    'Multi-sucursal y roles de usuario',
    'Reportes / dashboards',
    'APK móvil (Android o iPhone) si lo necesitas',
    'Migración desde Excel u otro sistema',
    'Automatizaciones WhatsApp / correo',
  ];

  return (
    <div className="bg-sa-canvas text-sa-text min-h-screen py-12 md:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-600/10 border border-blue-500/30 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-6">
            <Code2 className="h-3.5 w-3.5" /> Desarrollo a la medida · {brand}
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-sa-text tracking-tight mb-6 leading-tight">
            Software hecho para{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">tu forma de trabajar</span>
          </h1>
          <p className="text-lg text-sa-muted leading-relaxed mb-8">
            Cuando un sistema estándar no te alcanza, lo diseñamos y programamos a medida. Cotizamos por WhatsApp o formulario — sin estimador de precios fijos en la web.
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

        <div className="grid md:grid-cols-3 gap-5 mb-16">
          {pillars.map((p) => (
            <div key={p.title} className="bg-sa-panel border border-sa-border rounded-2xl p-6">
              <div className="w-11 h-11 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-4">
                <p.icon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-sa-text mb-2">{p.title}</h3>
              <p className="text-sm text-sa-muted leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>

        <div className="mb-16">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-3xl font-extrabold text-sa-text mb-3">Cómo trabajamos</h2>
            <p className="text-sm text-sa-muted">Proceso claro. Sin promesas de “garantía 6 meses” ni precios inventados.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {steps.map((s) => (
              <div key={s.n} className="bg-sa-panel border border-sa-border rounded-2xl p-5">
                <div className="text-2xl font-black text-blue-500/40 mb-2">{s.n}</div>
                <h4 className="text-sm font-bold text-sa-text mb-1.5">{s.t}</h4>
                <p className="text-xs text-sa-muted leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-sa-panel border border-sa-border rounded-3xl p-8 md:p-10 mb-16">
          <h2 className="text-2xl font-extrabold text-sa-text mb-2">Extras bajo demanda</h2>
          <p className="text-sm text-sa-muted mb-6">Se agregan a la cotización solo si los pides.</p>
          <div className="grid sm:grid-cols-2 gap-3">
            {extras.map((x) => (
              <div key={x} className="flex items-start gap-2 text-sm text-sa-text">
                <CheckCircle2 className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                {x}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-900/40 via-[#111827] to-cyan-900/40 border border-blue-500/30 rounded-3xl p-8 md:p-10 text-center">
          <h3 className="text-2xl font-bold text-sa-text mb-3">¿Tienes un proceso que automatizar?</h3>
          <p className="text-sm text-sa-muted max-w-xl mx-auto mb-6">
            Cuéntanos qué hace tu empresa hoy (aunque sea en Excel). Te respondemos con una orientación realista.
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
