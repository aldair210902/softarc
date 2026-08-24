import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  HardDrive,
  Headphones,
  MessageCircle,
  Server,
  ShieldCheck,
} from 'lucide-react';
import { apiGet } from '../../../lib/api';
import { useCompanySettings } from '../../../hooks/useCompanySettings';

type PublicResellerPlan = {
  id: string;
  name: string;
  type: string;
  sellPrice: number;
  billingCycle: string;
  features: string[];
  description: string;
  isFeatured: boolean;
};

function cyclePeriod(cycle: string) {
  switch (cycle) {
    case 'Mensual':
      return '/ mes';
    case 'Bienal':
      return '/ 2 años';
    case 'Único':
      return ' pago único';
    default:
      return '/ año';
  }
}

export default function InfrastructureAndSupport() {
  const { settings } = useCompanySettings();
  const brand = settings.commercialName || 'Software Architec';
  const symbol = settings.currencySymbol || 'S/';
  const wa = (settings.salesWhatsapp || '').replace(/\D/g, '');
  const waHref = wa
    ? `https://wa.me/${wa}?text=${encodeURIComponent(`Hola ${brand}, quiero información de dominio o hosting.`)}`
    : null;

  const [apiPlans, setApiPlans] = useState<PublicResellerPlan[]>([]);

  useEffect(() => {
    apiGet<PublicResellerPlan[] | { data?: PublicResellerPlan[] }>('/api/reseller-plans', { fresh: true })
      .then((res) => {
        const list = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
        setApiPlans(list);
      })
      .catch(() => setApiPlans([]));
  }, []);

  const infraPlans = useMemo(
    () =>
      (Array.isArray(apiPlans) ? apiPlans : []).map((p) => ({
        id: p.id,
        name: p.isFeatured ? `${p.name} (Destacado)` : p.name,
        price: `${symbol} ${Number(p.sellPrice).toFixed(0)}`,
        period: cyclePeriod(p.billingCycle),
        target: p.description || (p.type === 'domain' ? 'Dominio' : 'Hosting / infraestructura'),
        features: Array.isArray(p.features) && p.features.length ? p.features : ['Gestión SoftArc según lo acordado'],
        highlight: !!p.isFeatured,
      })),
    [apiPlans, symbol],
  );

  const pillars = [
    {
      icon: Server,
      title: 'Hosting para tu web o sistema',
      desc: 'Revendemos y gestionamos el alta con proveedores. En alquiler de software SoftArc, el hosting forma parte del servicio.',
    },
    {
      icon: HardDrive,
      title: 'Dominios',
      desc: 'Registro y renovación a través de SoftArc, con precio según proveedor + nuestro servicio.',
    },
    {
      icon: ShieldCheck,
      title: 'SSL y puesta en marcha',
      desc: 'Certificado y configuración básica para que el sitio o sistema quede accesible de forma segura.',
    },
    {
      icon: Headphones,
      title: 'Contacto contigo (no con tus clientes)',
      desc: 'Te ayudamos a ti con la infraestructura. No atendemos a los clientes finales de tu negocio.',
    },
  ];

  return (
    <div className="bg-sa-canvas text-sa-text min-h-screen py-12 md:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-600/10 border border-blue-500/30 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-6">
            <Server className="h-3.5 w-3.5" /> Dominios & hosting · {brand}
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-sa-text tracking-tight mb-6 leading-tight">
            Infraestructura para{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">tu web o sistema</span>
          </h1>
          <p className="text-lg text-sa-muted leading-relaxed mb-8">
            Dominio y hosting con seguimiento SoftArc. Si no hay planes publicados aquí, cotizamos por WhatsApp según el proveedor.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            {waHref && (
              <a href={waHref} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500">
                <MessageCircle className="h-4 w-4" /> Consultar por WhatsApp
              </a>
            )}
            <Link to="/#contact" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-sa-text bg-sa-panel border border-sa-border hover:border-blue-500/40">
              Formulario <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-5 mb-16">
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
            <h2 className="text-3xl font-extrabold text-sa-text mb-3">Planes publicados</h2>
            <p className="text-sm text-sa-muted">
              {infraPlans.length > 0
                ? 'Estos planes vienen de tu catálogo de reventa en SoftArc (costo proveedor → precio cliente).'
                : 'Aún no hay planes de reventa públicos. Créalos en Admin → Planes de reventa, o cotiza por WhatsApp.'}
            </p>
          </div>

          {infraPlans.length === 0 ? (
            <div className="bg-sa-panel border border-dashed border-sa-border rounded-2xl p-10 text-center">
              <p className="text-sa-text font-semibold mb-2">Sin precios fijos inventados</p>
              <p className="text-sm text-sa-muted mb-5 max-w-md mx-auto">
                Preferimos cotizar dominio/hosting según el caso (y según lo que te ofrece tu proveedor).
              </p>
              {waHref ? (
                <a href={waHref} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-600">
                  <MessageCircle className="h-4 w-4" /> WhatsApp
                </a>
              ) : (
                <Link to="/#contact" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600">
                  Contactar
                </Link>
              )}
            </div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-6">
              {infraPlans.map((plan) => (
                <div
                  key={plan.id}
                  className={`bg-sa-panel rounded-3xl p-7 border flex flex-col ${
                    plan.highlight ? 'border-blue-500' : 'border-sa-border'
                  }`}
                >
                  <h3 className="text-xl font-bold text-sa-text mb-1">{plan.name}</h3>
                  <p className="text-xs text-sa-muted mb-4">{plan.target}</p>
                  <div className="mb-4 text-3xl font-extrabold text-sa-text">
                    {plan.price}
                    <span className="text-xs font-medium text-sa-muted">{plan.period}</span>
                  </div>
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
          )}
        </div>
      </div>
    </div>
  );
}
