import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Code2, 
  Cpu, 
  Database, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight, 
  Layers, 
  GitBranch, 
  FileText, 
  Terminal, 
  Zap,
  Server,
  Workflow,
  Calculator
} from 'lucide-react';

export default function CustomDevelopment() {
  // Cotizador interactivo de desarrollo a la medida
  const [projectType, setProjectType] = useState<'erp' | 'crm' | 'api' | 'pwa'>('erp');
  const [selectedModules, setSelectedModules] = useState<string[]>(['auth', 'sales', 'reports']);
  const [urgency, setUrgency] = useState<'normal' | 'express'>('normal');

  const moduleOptions = [
    { id: 'auth', name: 'Control de Roles y Permisos Granulares', price: 600 },
    { id: 'sales', name: 'Facturación Electrónica SUNAT (UBL 2.1)', price: 1200 },
    { id: 'inventory', name: 'Gestión de Almacenes Multisede y Kardex', price: 1400 },
    { id: 'reports', name: 'Reportes Financieros y Dashboards BI', price: 900 },
    { id: 'whatsapp', name: 'Integración WhatsApp Cloud API (Notificaciones)', price: 800 },
    { id: 'payments', name: 'Pasarelas de Pago Múltiples (Tarjetas / QR)', price: 950 },
    { id: 'offline', name: 'Modo Offline PWA con sincronización diferida', price: 1100 }
  ];

  const basePrices = {
    erp: 3500,
    crm: 2800,
    api: 1800,
    pwa: 3200
  };

  const toggleModule = (id: string) => {
    setSelectedModules(prev => 
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  const modulesTotal = selectedModules.reduce((acc, modId) => {
    const mod = moduleOptions.find(m => m.id === modId);
    return acc + (mod ? mod.price : 0);
  }, 0);

  const estimatedBase = basePrices[projectType] + modulesTotal;
  const totalEstimate = urgency === 'express' ? estimatedBase * 1.25 : estimatedBase;

  const methodologySteps = [
    {
      step: '01',
      title: 'Discovery y Levantamiento de Reglas',
      desc: 'Mapeamos los cuellos de botella de tu empresa, requerimientos técnicos, roles de usuarios y arquitectura relacional de base de datos.'
    },
    {
      step: '02',
      title: 'Arquitectura y Prototipado UX/UI',
      desc: 'Diseñamos wireframes interactivos y validamos los flujos de navegación antes de escribir una sola línea de código.'
    },
    {
      step: '03',
      title: 'Desarrollo en Sprints Ágiles',
      desc: 'Entregables quincenales en entornos de staging (sandbox) para que pruebes los módulos en tiempo real con feedback continuo.'
    },
    {
      step: '04',
      title: 'QA, Seguridad y Carga',
      desc: 'Pruebas de estrés, auditoría de vulnerabilidades, pruebas de concurrencia y validación con estándares OWASP.'
    },
    {
      step: '05',
      title: 'Despliegue y Garantía Técnica',
      desc: 'Puesta en producción en servidores VPS optimizados, capacitación al personal y garantía de soporte post-lanzamiento.'
    }
  ];

  return (
    <div className="bg-sa-canvas text-sa-text min-h-screen py-12 md:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-600/10 border border-blue-500/30 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-6">
            <Code2 className="h-3.5 w-3.5" />
            Software Factory & Soluciones a la Medida
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-sa-text tracking-tight mb-6 leading-tight">
            Ingeniería de software adaptada a la <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">lógica exacta de tu negocio</span>
          </h1>
          <p className="text-lg text-sa-muted leading-relaxed">
            Cuando las herramientas comerciales genéricas no se ajustan a tus operaciones, construimos ERPs, CRMs y sistemas propietarios con código limpio y máxima escalabilidad.
          </p>
        </div>

        {/* 3 Pilares del Desarrollo a la Medida */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          <div className="bg-sa-panel border border-sa-border rounded-2xl p-8 hover:border-blue-500/50 transition-all duration-300">
            <div className="w-12 h-12 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-6">
              <Database className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-sa-text mb-3">ERPs & CRMs Corporativos</h3>
            <p className="text-sm text-sa-muted leading-relaxed">
              Módulos interconectados de compras, cotizaciones, gestión de inventarios multisede, trazabilidad de cobranzas y reportes ejecutivos.
            </p>
          </div>

          <div className="bg-sa-panel border border-sa-border rounded-2xl p-8 hover:border-blue-500/50 transition-all duration-300">
            <div className="w-12 h-12 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-6">
              <Workflow className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-sa-text mb-3">Integración de APIs y Webhooks</h3>
            <p className="text-sm text-sa-muted leading-relaxed">
              Conexión directa con SUNAT (Facturación electrónica), pasarelas bancarias locales, WhatsApp API y sincronización con sistemas contables existentes.
            </p>
          </div>

          <div className="bg-sa-panel border border-sa-border rounded-2xl p-8 hover:border-blue-500/50 transition-all duration-300">
            <div className="w-12 h-12 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-6">
              <Terminal className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-sa-text mb-3">Portales B2B & PWAs Móviles</h3>
            <p className="text-sm text-sa-muted leading-relaxed">
              Plataformas para distribuidores y fuerza de ventas en campo con soporte offline, generación de pedidos y sincronización en tiempo real.
            </p>
          </div>
        </div>

        {/* Cotizador Interactivo de Alcance */}
        <div className="bg-sa-panel border border-sa-border rounded-3xl p-8 md:p-12 mb-20 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none"></div>

          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-sa-border">
              <div>
                <h2 className="text-2xl md:text-3xl font-extrabold text-sa-text flex items-center gap-3">
                  <Calculator className="h-7 w-7 text-blue-500" />
                  Estimador de Proyectos a la Medida
                </h2>
                <p className="text-sm text-sa-muted mt-1">
                  Selecciona los requerimientos iniciales para calcular un presupuesto referencial y tiempo estimado de desarrollo.
                </p>
              </div>
              <span className="text-xs px-3 py-1.5 rounded-lg bg-blue-600/20 text-blue-400 font-semibold border border-blue-500/30 self-start md:self-auto">
                PRESUPUESTO ESTIMADO
              </span>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Configuración */}
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <label className="block text-xs font-semibold text-sa-muted uppercase tracking-wider mb-3">1. Tipo de Sistema</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { id: 'erp', label: 'ERP Integral' },
                      { id: 'crm', label: 'CRM Comercial' },
                      { id: 'api', label: 'API / Microservicio' },
                      { id: 'pwa', label: 'Portal B2B / PWA' }
                    ].map(type => (
                      <button
                        key={type.id}
                        onClick={() => setProjectType(type.id as any)}
                        className={`p-3 rounded-xl text-xs font-bold border transition-all text-center ${
                          projectType === type.id 
                            ? 'bg-blue-600 text-white border-blue-500 shadow-md' 
                            : 'bg-sa-canvas text-sa-muted border-sa-border hover:border-sa-border-strong'
                        }`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-sa-muted uppercase tracking-wider mb-3">2. Módulos e Integraciones Requeridas</label>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {moduleOptions.map(mod => {
                      const isSelected = selectedModules.includes(mod.id);
                      return (
                        <div 
                          key={mod.id}
                          onClick={() => toggleModule(mod.id)}
                          className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                            isSelected 
                              ? 'bg-blue-600/10 border-blue-500/50 text-sa-text' 
                              : 'bg-sa-canvas border-sa-border text-sa-muted hover:border-sa-border-strong'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className={`w-4 h-4 rounded border flex items-center justify-center ${isSelected ? 'bg-blue-600 border-blue-500' : 'border-sa-border-strong'}`}>
                              {isSelected && <CheckCircle2 className="h-3 w-3 text-white" />}
                            </div>
                            <span className="text-xs font-medium">{mod.name}</span>
                          </div>
                          <span className="text-xs font-semibold text-blue-400 whitespace-nowrap">+S/ {mod.price}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-sa-muted uppercase tracking-wider mb-3">3. Plazo de Entrega</label>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setUrgency('normal')}
                      className={`flex-1 p-3 rounded-xl text-xs font-semibold border transition-all ${
                        urgency === 'normal' 
                          ? 'bg-blue-600 text-white border-blue-500' 
                          : 'bg-sa-canvas text-sa-muted border-sa-border'
                      }`}
                    >
                      Estándar (4 a 8 semanas por fases)
                    </button>
                    <button
                      onClick={() => setUrgency('express')}
                      className={`flex-1 p-3 rounded-xl text-xs font-semibold border transition-all ${
                        urgency === 'express' 
                          ? 'bg-blue-600 text-white border-blue-500' 
                          : 'bg-sa-canvas text-sa-muted border-sa-border'
                      }`}
                    >
                      Fast-Track (Sprint acelerado +25%)
                    </button>
                  </div>
                </div>
              </div>

              {/* Resumen del Presupuesto */}
              <div className="bg-sa-canvas border border-sa-border rounded-2xl p-6 flex flex-col justify-between">
                <div>
                  <h4 className="text-sm font-bold text-sa-text mb-4 pb-3 border-b border-sa-border">Resumen de la Propuesta</h4>
                  
                  <div className="space-y-3 text-xs mb-6">
                    <div className="flex justify-between">
                      <span className="text-sa-muted">Arquitectura Base:</span>
                      <span className="font-semibold text-sa-text">S/ {basePrices[projectType]}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sa-muted">Módulos ({selectedModules.length}):</span>
                      <span className="font-semibold text-sa-text">S/ {modulesTotal}</span>
                    </div>
                    {urgency === 'express' && (
                      <div className="flex justify-between text-amber-400">
                        <span>Recargo Fast-Track:</span>
                        <span className="font-semibold">+25%</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-sa-muted">SLA de Garantía:</span>
                      <span className="text-emerald-400 font-semibold">Incluido (6 meses)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sa-muted">Código Fuente:</span>
                      <span className="text-blue-400 font-semibold">100% Propietario</span>
                    </div>
                  </div>

                  <div className="p-4 bg-sa-panel rounded-xl border border-blue-500/30 mb-6">
                    <div className="text-xs text-sa-muted mb-1">Inversión Estimada:</div>
                    <div >S/ {totalEstimate.toLocaleString()}</div>
                    <div className="text-[11px] text-sa-faint mt-1">*Precio referencial en soles peruanos sin IGV.</div>
                  </div>
                </div>

                <Link
                  to="/#contact" className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-colors">
                  Solicitar Propuesta Formal <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Metodología de Trabajo por Fases */}
        <div className="mb-20">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-extrabold text-sa-text mb-3">Nuestra Metodología de Desarrollo</h2>
            <p className="text-sm text-sa-muted">Garantizamos entregables funcionales en cada etapa sin desviaciones de presupuesto.</p>
          </div>

          <div className="grid md:grid-cols-5 gap-4">
            {methodologySteps.map((step, idx) => (
              <div key={idx} className="bg-sa-panel border border-sa-border rounded-2xl p-6 relative">
                <div className="text-3xl font-black text-blue-500/30 mb-3">{step.step}</div>
                <h4 className="text-sm font-bold text-sa-text mb-2">{step.title}</h4>
                <p className="text-xs text-sa-muted leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Stack Tecnológico */}
        <div className="bg-sa-panel border border-sa-border rounded-2xl p-8 mb-20">
          <h3 className="text-lg font-bold text-sa-text mb-6 text-center">Tecnologías de Alto Rendimiento Utilizadas</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 text-center">
            {['React / Vite', 'TypeScript', 'Tailwind CSS', 'Laravel / PHP', 'Python / FastAPI', 'PostgreSQL / MySQL'].map((tech, i) => (
              <div key={i} className="p-3 bg-sa-canvas rounded-xl border border-sa-border text-xs font-semibold text-sa-text">
                {tech}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
