import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Server, 
  ShieldCheck, 
  HardDrive, 
  Headphones, 
  PenTool, 
  CheckCircle2, 
  ArrowRight, 
  Activity, 
  Lock, 
  RefreshCw, 
  Cpu, 
  Clock,
  Zap,
  Radio
} from 'lucide-react';

export default function InfrastructureAndSupport() {
  const [selectedPlan, setSelectedPlan] = useState<'essential' | 'business' | 'enterprise'>('business');

  const infraPlans = [
    {
      id: 'essential',
      name: 'Plan Esencial',
      price: 'S/ 90',
      period: '/ mes',
      target: 'Sitios web institucionales y blogs con tráfico moderado',
      features: [
        'Hosting Cloud VPS compartido optimizado (LiteSpeed / Nginx)',
        'Certificado SSL Let’s Encrypt con renovación automática',
        'Copias de seguridad semanales automáticas',
        'Hasta 5 correos corporativos configurados',
        'Monitoreo de Uptime 24/7 con alertas de caída',
        'Mesa de ayuda por tickets (Respuesta < 24h)'
      ]
    },
    {
      id: 'business',
      name: 'Plan Empresarial (Recomendado)',
      price: 'S/ 180',
      period: '/ mes',
      target: 'E-commerce, plataformas SaaS y tiendas activas',
      features: [
        'Instancia VPS con recursos garantizados (CPU & RAM dedicada)',
        'Firewall Cloudflare WAF y protección Anti-DDoS activa',
        'Copias de seguridad diarias cifradas en almacenamiento S3',
        'Correos corporativos ilimitados con antispam premium',
        'Actualizaciones mensuales de seguridad y parches de software',
        'Soporte técnico prioritario por WhatsApp y Tickets (Respuesta < 4h)',
        'Optimización periódica de base de datos MySQL/Postgres'
      ],
      highlight: true
    },
    {
      id: 'enterprise',
      name: 'SLA Dedicated & Contenidos',
      price: 'S/ 380',
      period: '/ mes',
      target: 'Empresas con operaciones críticas y estrategia SEO continua',
      features: [
        'Servidor VPS dedicado exclusivo con balanceo de carga',
        'Auditoría y pentesting semestral de seguridad',
        'Copias de seguridad en tiempo real con recuperación en 15 min',
        'Redacción y publicación de 2 artículos SEO mensuales para tu blog',
        'Optimización continua de Core Web Vitals (< 0.8s)',
        'SLA 99.95% de disponibilidad con soporte 24/7 de emergencia',
        'Asignación de Ingeniero DevOps dedicado'
      ]
    }
  ];

  return (
    <div className="bg-sa-canvas text-sa-text min-h-screen py-12 md:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Hero */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-600/10 border border-blue-500/30 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-6">
            <Server className="h-3.5 w-3.5" />
            Infraestructura Cloud, Seguridad & Mantenimiento
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-sa-text tracking-tight mb-6 leading-tight">
            Estabilidad 24/7 y seguridad para la <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">continuidad de tus operaciones</span>
          </h1>
          <p className="text-lg text-sa-muted leading-relaxed">
            Delega la gestión de servidores, actualizaciones de seguridad y copias de respaldo en ingenieros especializados. Tu software siempre rápido y protegido.
          </p>
        </div>

        {/* Live Status Widget */}
        <div className="bg-sa-panel border border-sa-border rounded-3xl p-6 md:p-8 mb-20 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-sa-border mb-6">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></div>
              <span className="font-bold text-sa-text text-sm">Estado de Infraestructura en Tiempo Real</span>
            </div>
            <div className="text-xs text-sa-muted font-mono">
              Todos los clústeres operativos · Uptime Global: 99.98%
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-sa-canvas rounded-xl border border-sa-border">
              <div className="text-xs text-sa-muted mb-1">Servidores Web / API</div>
              <div className="text-xl font-bold text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" /> 100% Operativo
              </div>
              <div className="text-[11px] text-sa-faint mt-1">Latencia: 18ms (Lima / Región)</div>
            </div>

            <div className="p-4 bg-sa-canvas rounded-xl border border-sa-border">
              <div className="text-xs text-sa-muted mb-1">Bases de Datos MySQL/PG</div>
              <div className="text-xl font-bold text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" /> 100% Operativo
              </div>
              <div className="text-[11px] text-sa-faint mt-1">Pool de conexiones óptimo</div>
            </div>

            <div className="p-4 bg-sa-canvas rounded-xl border border-sa-border">
              <div className="text-xs text-sa-muted mb-1">Backups Automáticos S3</div>
              <div className="text-xl font-bold text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" /> Al día (04:00 AM)
              </div>
              <div className="text-[11px] text-sa-faint mt-1">Cifrado AES-256</div>
            </div>

            <div className="p-4 bg-sa-canvas rounded-xl border border-sa-border">
              <div className="text-xs text-sa-muted mb-1">Certificados SSL & WAF</div>
              <div className="text-xl font-bold text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" /> Protegido
              </div>
              <div className="text-[11px] text-sa-faint mt-1">Reglas Anti-DDoS activas</div>
            </div>
          </div>
        </div>

        {/* 4 Pilares de la Infraestructura */}
        <div className="grid md:grid-cols-2 gap-8 mb-20">
          <div className="bg-sa-panel border border-sa-border rounded-2xl p-8 hover:border-blue-500/50 transition-all duration-300">
            <div className="w-12 h-12 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-6">
              <Cpu className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-sa-text mb-3">Servidores VPS Cloud de Alto Rendimiento</h3>
            <p className="text-sm text-sa-muted leading-relaxed mb-4">
              Configuraciones afinadas con Nginx, PHP-FPM / Node.js y compresión Brotli sobre discos de estado sólido NVMe ultrarrápidos para que tu aplicación responda al instante.
            </p>
            <ul className="space-y-2 text-xs text-sa-text">
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Aislamiento seguro en contenedores.</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Escalado vertical de memoria y procesador bajo demanda.</li>
            </ul>
          </div>

          <div className="bg-sa-panel border border-sa-border rounded-2xl p-8 hover:border-blue-500/50 transition-all duration-300">
            <div className="w-12 h-12 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-6">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-sa-text mb-3">Seguridad y Backups Diarios Cifrados</h3>
            <p className="text-sm text-sa-muted leading-relaxed mb-4">
              Protegemos tu información contra ataques de inyección, fuerza bruta o ransomware. Generamos réplicas diarias fuera de servidor con restauración inmediata garantizada.
            </p>
            <ul className="space-y-2 text-xs text-sa-text">
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Respaldo integral de archivos y base de datos relacional.</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Almacenamiento redundante en nube S3.</li>
            </ul>
          </div>

          <div className="bg-sa-panel border border-sa-border rounded-2xl p-8 hover:border-blue-500/50 transition-all duration-300">
            <div className="w-12 h-12 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-6">
              <Headphones className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-sa-text mb-3">Mesa de Ayuda y Soporte Técnico Nivel 2 y 3</h3>
            <p className="text-sm text-sa-muted leading-relaxed mb-4">
              Atención directa por ingenieros de software, no por bots ni operadores sin conocimiento técnico. Resolvemos incidencias operativas y optimizamos consultas lentas.
            </p>
            <ul className="space-y-2 text-xs text-sa-text">
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Canal prioritario de emergencias vía WhatsApp.</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Tiempo de respuesta medio menor a 30 minutos en planes Pro.</li>
            </ul>
          </div>

          <div className="bg-sa-panel border border-sa-border rounded-2xl p-8 hover:border-blue-500/50 transition-all duration-300">
            <div className="w-12 h-12 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-6">
              <PenTool className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-sa-text mb-3">Redacción & Generación de Contenidos SEO</h3>
            <p className="text-sm text-sa-muted leading-relaxed mb-4">
              Mantenemos tu plataforma activa y con autoridad ante Google creando artículos técnicos y comerciales que atraen clientes con intención de compra.
            </p>
            <ul className="space-y-2 text-xs text-sa-text">
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Artículos con estructura SEO probada y enlaces internos.</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Documentación técnica para clientes y onboarding.</li>
            </ul>
          </div>
        </div>

        {/* Planes de Mantenimiento e Infraestructura */}
        <div className="mb-20">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-extrabold text-sa-text mb-3">Planes de Infraestructura & Soporte Continuo</h2>
            <p className="text-sm text-sa-muted">Asegura el rendimiento de tu plataforma con tarifas mensuales transparentes.</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {infraPlans.map((plan, i) => (
              <div 
                key={i} 
                className={`bg-sa-panel rounded-3xl p-8 border transition-all duration-300 flex flex-col ${
                  plan.highlight ? 'border-blue-500 shadow-[0_8px_30px_rgb(59,130,246,0.2)] md:-translate-y-2' : 'border-sa-border hover:border-sa-border-strong'
                }`}>
                <h3 className="text-xl font-bold text-sa-text mb-2">{plan.name}</h3>
                <p className="text-xs text-sa-muted mb-6 min-h-[32px]">{plan.target}</p>

                <div className="mb-4">
                  <div className="flex items-baseline gap-1">
                    <span >{plan.price}</span>
                    <span className="text-xs text-sa-muted">{plan.period}</span>
                  </div>
                </div>

                <div className="h-px bg-sa-border my-6"></div>

                <ul className="space-y-3 text-xs text-sa-text mb-8 flex-1">
                  {plan.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  to="/#contact"
                  className={`w-full py-3.5 rounded-xl font-semibold text-xs transition-all duration-300 text-center ${
                    plan.highlight 
                      ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg' 
                      : 'bg-sa-panel-2 hover:bg-sa-border text-sa-text border border-sa-border'
                  }`}>
                  Contratar Plan
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
