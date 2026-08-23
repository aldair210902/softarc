import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Store, 
  ShoppingBag, 
  Box, 
  CreditCard, 
  Smartphone, 
  BarChart3, 
  ShieldCheck, 
  Zap, 
  CheckCircle2, 
  ArrowRight, 
  Layers, 
  RefreshCw, 
  Sparkles, 
  Cpu, 
  CalendarCheck,
  Receipt,
  Eye,
  Sliders,
  PlayCircle
} from 'lucide-react';
import { motion } from 'motion/react';

export default function SaasSystems() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'biannual' | 'annual'>('monthly');
  const [boxItems, setBoxItems] = useState([
    { id: 1, name: 'Polera Oversize Minimal', price: 89, volume: 30, count: 1, max: 2, image: '👕' },
    { id: 2, name: 'Gorra Urban Tech', price: 45, volume: 15, count: 1, max: 2, image: '🧢' },
    { id: 3, name: 'Taza Térmica Black Edition', price: 35, volume: 20, count: 0, max: 2, image: '☕' },
    { id: 4, name: 'Calcetines Soft Pack', price: 25, volume: 10, count: 0, max: 3, image: '🧦' }
  ]);

  const maxVolume = 100;
  const currentVolume = boxItems.reduce((acc, item) => acc + item.volume * item.count, 0);
  const rawTotal = boxItems.reduce((acc, item) => acc + item.price * item.count, 0);
  const boxDiscount = currentVolume >= 65 ? 0.15 : 0; // 15% discount if box is well filled
  const finalTotal = rawTotal * (1 - boxDiscount);

  const updateItemCount = (id: number, delta: number) => {
    setBoxItems(items => items.map(item => {
      if (item.id === id) {
        const newCount = Math.max(0, Math.min(item.max, item.count + delta));
        const addedVolume = (newCount - item.count) * item.volume;
        if (currentVolume + addedVolume > maxVolume && delta > 0) return item;
        return { ...item, count: newCount };
      }
      return item;
    }));
  };

  const discountMultiplier = billingCycle === 'annual' ? 0.8 : billingCycle === 'biannual' ? 0.9 : 1;

  const plans = [
    {
      name: 'VariaShop Starter',
      target: 'Emprendedores y marcas en lanzamiento',
      monthlyPrice: 120,
      setupFee: 'S/ 250 (Pago único)',
      features: [
        'Catálogo digital dinámico hasta 250 productos',
        'Checkout transparente con Yape, Plin y BCP',
        'Módulo estándar "Arma tu Box" (1 configuración)',
        'Notificaciones de pedidos automáticas por WhatsApp',
        'Panel administrativo de control de stock básico',
        'Certificado SSL + Subdominio o Dominio propio',
        'Soporte técnico por tickets (Lunes a Viernes)'
      ],
      highlight: false
    },
    {
      name: 'VariaShop Pro (Recomendado)',
      target: 'E-commerce en crecimiento con alta rotación',
      monthlyPrice: 220,
      setupFee: 'S/ 450 (Puesta en marcha y carga inicial)',
      features: [
        'Productos y variantes ilimitadas (tallas/colores)',
        'Personalizador avanzado "Arma tu Box" con cálculo volumétrico',
        'Integración con pasarelas de tarjeta (Culqi / MercadoPago)',
        'Gestión de almacenes multisede e inventario por lotes',
        'Control de clientes, historial de recompras y cupones',
        'Reporte de finanzas, márgenes brutos y auditoría IP',
        'Soporte prioritario 24/7 y copias de seguridad diarias'
      ],
      highlight: true
    },
    {
      name: 'Ecosystem Suite',
      target: 'Cadenas, retail y empresas multicanal',
      monthlyPrice: 390,
      setupFee: 'S/ 750 (Parametrización completa)',
      features: [
        'Todo lo de VariaShop Pro',
        'Módulo POS para sincronizar puntos de venta físicos',
        'Integración con Facturación Electrónica SUNAT (UBL 2.1)',
        'Módulo de Menú QR / Comandas para locales gastronómicos',
        'Acceso a Webhooks y API REST para integraciones ERP',
        'Servidor VPS dedicado optimizado para alto tráfico',
        'SLA 99.95% garantizado con Gerente de Cuenta técnico'
      ],
      highlight: false
    }
  ];

  return (
    <div className="bg-sa-canvas text-sa-text min-h-screen py-12 md:py-20">
      {/* Header & Hero */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-600/10 border border-blue-500/30 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-6">
            <Sparkles className="h-3.5 w-3.5" />
            Software as a Service (SaaS)
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-sa-text tracking-tight mb-6 leading-tight">
            Plataformas SaaS listas para <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">escalar tus ventas</span>
          </h1>
          <p className="text-lg text-sa-muted leading-relaxed">
            Elimina el alto costo de desarrollo inicial. Nuestras plataformas modulares están optimizadas para la conversión de clientes, control de inventario y cobros automatizados.
          </p>
        </div>

        {/* Producto Estrella: VariaShop Showcase */}
        <div className="bg-sa-panel border border-sa-border rounded-3xl p-8 md:p-12 mb-20 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none"></div>
          
          <div className="grid lg:grid-cols-2 gap-12 items-center relative z-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-4">
                <Store className="h-4 w-4" /> Producto Principal
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-sa-text mb-6">
                VariaShop: E-commerce + Control Operativo
              </h2>
              <p className="text-sa-muted leading-relaxed mb-6">
                Diseñado para marcas de moda, regalos, accesorios y productos empaquetados. VariaShop no es un WooCommerce pesado ni un Shopify con comisiones ocultas: es una arquitectura ultraligera con checkout local y herramientas comerciales nativas.
              </p>

              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <div className="p-1 rounded bg-blue-600/20 text-blue-400 mt-1">
                    <Box className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sa-text text-sm">Personalizador "Arma tu Box" con Cálculo Volumétrico</h4>
                    <p className="text-xs text-sa-muted">Permite a tus clientes armar cajas de regalo o packs combinados respetando la capacidad del empaque en tiempo real.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-1 rounded bg-blue-600/20 text-blue-400 mt-1">
                    <CreditCard className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sa-text text-sm">Checkout Nativo Yape, Plin y BCP</h4>
                    <p className="text-xs text-sa-muted">Validación de comprobantes, lectura de códigos QR directos y opción de pasarelas de pago con tarjetas de crédito/débito.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-1 rounded bg-blue-600/20 text-blue-400 mt-1">
                    <BarChart3 className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sa-text text-sm">Auditoría IP y Métricas de Finanzas</h4>
                    <p className="text-xs text-sa-muted">Trazabilidad de compras, detección de pedidos sospechosos y cálculo automático del margen bruto por producto.</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <a href="#demo-box" className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-sa-text bg-sa-panel border border-sa-border hover:border-blue-500/50 transition-colors">
                  <Sliders className="h-4 w-4" /> Probar Simulador de Box
                </a>
                <Link to="/#contact" className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-colors">
                  Agendar Demostración <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Simulador Interactivo "Arma tu Box" */}
            <div id="demo-box" className="bg-sa-canvas border border-sa-border rounded-2xl p-6 md:p-8 shadow-xl">
              <div className="flex items-center justify-between border-b border-sa-border pb-4 mb-6">
                <div>
                  <h3 className="font-bold text-sa-text text-lg flex items-center gap-2">
                    <Box className="h-5 w-5 text-blue-500" /> Simulador: Arma tu Box
                  </h3>
                  <p className="text-xs text-sa-muted">Experimenta la experiencia de compra que tendrán tus clientes</p>
                </div>
                <span className="text-xs px-2.5 py-1 rounded bg-blue-600/20 text-blue-400 font-mono font-bold">
                  EN VIVO
                </span>
              </div>

              {/* Barra de Capacidad de la Caja */}
              <div className="mb-6 bg-sa-panel p-4 rounded-xl border border-sa-border">
                <div className="flex justify-between text-xs font-semibold mb-2">
                  <span className="text-sa-muted">Capacidad del Empaque:</span>
                  <span className={currentVolume >= maxVolume ? 'text-amber-400 font-bold' : 'text-blue-400 font-bold'}>
                    {currentVolume}% / {maxVolume}% {currentVolume >= maxVolume && '(¡Caja Llena!)'}
                  </span>
                </div>
                <div className="w-full bg-sa-border h-3 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 rounded-full ${
                      currentVolume >= 80 ? 'bg-gradient-to-r from-blue-500 to-amber-400' : 'bg-gradient-to-r from-cyan-400 to-blue-600'
                    }`}
                    style={{ width: `${Math.min(100, currentVolume)}%` }}
                  ></div>
                </div>
                {boxDiscount > 0 && (
                  <div className="mt-2 text-xs text-emerald-400 flex items-center gap-1 font-medium">
                    <Sparkles className="h-3.5 w-3.5" /> ¡Genial! Has desbloqueado 15% de descuento por pack completo.
                  </div>
                )}
              </div>

              {/* Lista de productos para agregar */}
              <div className="space-y-3 mb-6">
                {boxItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-sa-panel border border-sa-border hover:border-sa-border-strong transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-sa-border flex items-center justify-center text-xl">
                        {item.image}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-sa-text">{item.name}</div>
                        <div className="text-xs text-sa-muted">S/ {item.price.toFixed(2)} · Ocupa {item.volume}% vol.</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => updateItemCount(item.id, -1)}
                        disabled={item.count === 0}>
                        -
                      </button>
                      <span >{item.count}</span>
                      <button 
                        onClick={() => updateItemCount(item.id, 1)}
                        disabled={currentVolume + item.volume > maxVolume || item.count >= item.max}>
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total y Checkout Preview */}
              <div className="p-4 rounded-xl bg-sa-panel border border-blue-500/30 flex items-center justify-between">
                <div>
                  <div className="text-xs text-sa-muted">Total Estimado Box:</div>
                  <div className="flex items-baseline gap-2">
                    <span >S/ {finalTotal.toFixed(2)}</span>
                    {boxDiscount > 0 && (
                      <span className="text-xs line-through text-sa-faint">S/ {rawTotal.toFixed(2)}</span>
                    )}
                  </div>
                </div>
                <Link to="/#contact" className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-colors">
                  <CreditCard className="h-4 w-4" /> Probar Checkout Yape
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Otros Sistemas SaaS Disponibles */}
        <div className="mb-24">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-extrabold text-sa-text mb-3">Otros Módulos SaaS Especializados</h2>
            <p className="text-sm text-sa-muted">Soluciones listas para implementar bajo esquema de suscripción mensual.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-sa-panel border border-sa-border rounded-2xl p-8 hover:border-blue-500/50 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-6">
                <Receipt className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-sa-text mb-2">POS & Facturación</h3>
              <p className="text-sm text-sa-muted mb-6 leading-relaxed">
                Punto de venta web para tiendas físicas con lector de código de barras, control de caja chica y emisión de comprobantes.
              </p>
              <ul className="space-y-2 text-xs text-sa-text mb-6">
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Cierre de caja X y Z</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Venta rápida en 3 clics</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Sincronización con almacén central</li>
              </ul>
              <div className="text-blue-400 text-xs font-semibold">Desde S/ 99 / mes</div>
            </div>

            <div className="bg-sa-panel border border-sa-border rounded-2xl p-8 hover:border-blue-500/50 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-6">
                <Smartphone className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-sa-text mb-2">Menú QR & Comandas</h3>
              <p className="text-sm text-sa-muted mb-6 leading-relaxed">
                Para cafeterías y restaurantes. Carta interactiva con fotos, pedidos directos a cocina y cálculo de cuentas por mesa.
              </p>
              <ul className="space-y-2 text-xs text-sa-text mb-6">
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Carga ilimitada de platos y bebidas</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Panel para cocineros y mozos</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Cobro con Yape y Plin en mesa</li>
              </ul>
              <div className="text-blue-400 text-xs font-semibold">Desde S/ 80 / mes</div>
            </div>

            <div className="bg-sa-panel border border-sa-border rounded-2xl p-8 hover:border-blue-500/50 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-6">
                <CalendarCheck className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-sa-text mb-2">Citas & Reservas</h3>
              <p className="text-sm text-sa-muted mb-6 leading-relaxed">
                Para consultorios médicos, spas, barberías y asesorías. Agenda inteligente con recordatorios automáticos por WhatsApp.
              </p>
              <ul className="space-y-2 text-xs text-sa-text mb-6">
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Calendario por profesional</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Pago previo de reserva o seña</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Cancelación y reprogramación fácil</li>
              </ul>
              <div className="text-blue-400 text-xs font-semibold">Desde S/ 110 / mes</div>
            </div>
          </div>
        </div>

        {/* Pricing / Esquema de Precios */}
        <div className="mb-20">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <h2 className="text-3xl md:text-4xl font-extrabold text-sa-text mb-4">Planes Transparentes y Sin Sorpresas</h2>
            <p className="text-sa-muted">Todo el poder de nuestras plataformas con soporte garantizado y actualizaciones continuas.</p>

            {/* Selector de Ciclo de Facturación */}
            <div className="inline-flex p-1 bg-sa-panel border border-sa-border rounded-xl mt-6">
              <button 
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${billingCycle === 'monthly' ? 'bg-blue-600 text-white' : 'text-sa-muted hover:text-sa-text'}`}
              >
                Mensual
              </button>
              <button 
                onClick={() => setBillingCycle('biannual')}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${billingCycle === 'biannual' ? 'bg-blue-600 text-white' : 'text-sa-muted hover:text-sa-text'}`}
              >
                Semestral (10% OFF)
              </button>
              <button 
                onClick={() => setBillingCycle('annual')}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${billingCycle === 'annual' ? 'bg-blue-600 text-white' : 'text-sa-muted hover:text-sa-text'}`}
              >
                Anual (20% OFF + Setup Gratis)
              </button>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {plans.map((plan, i) => {
              const finalPrice = Math.round(plan.monthlyPrice * discountMultiplier);
              return (
                <div 
                  key={i} 
                  className={`bg-sa-panel rounded-3xl p-8 border transition-all duration-300 flex flex-col relative ${
                    plan.highlight ? 'border-blue-500 shadow-[0_8px_30px_rgb(59,130,246,0.2)] md:-translate-y-2' : 'border-sa-border hover:border-sa-border-strong'
                  }`}>
                  {plan.highlight && (
                    <div >
                      Más Popular
                    </div>
                  )}
                  <h3 className="text-xl font-bold text-sa-text mb-1">{plan.name}</h3>
                  <p className="text-xs text-sa-muted mb-6 min-h-[32px]">{plan.target}</p>

                  <div className="mb-4">
                    <div className="flex items-baseline gap-1">
                      <span >S/ {finalPrice}</span>
                      <span className="text-xs text-sa-muted">/ mes</span>
                    </div>
                    <div className="text-xs text-blue-400 mt-1 font-medium">
                      {billingCycle === 'annual' ? 'Setup Fee: Bonificado (Gratis)' : `Setup: ${plan.setupFee}`}
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
                    className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-300 text-center ${
                      plan.highlight 
                        ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg' 
                        : 'bg-sa-panel-2 hover:bg-sa-border text-sa-text border border-sa-border'
                    }`}>
                    Elegir Plan {plan.name}
                  </Link>
                </div>
              );
            })}
          </div>
        </div>

        {/* CTA Banner */}
        <div className="bg-gradient-to-r from-blue-900/40 via-[#111827] to-cyan-900/40 border border-blue-500/30 rounded-3xl p-8 md:p-12 text-center relative overflow-hidden">
          <h3 className="text-2xl md:text-3xl font-bold text-sa-text mb-4">¿Necesitas una demostración guiada de VariaShop?</h3>
          <p className="text-sa-muted max-w-xl mx-auto mb-8 text-sm">
            Un especialista de Software Architec te mostrará el panel administrativo en vivo y cómo configurar tus pasarelas locales.
          </p>
          <Link to="/#contact" className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-colors">
            Solicitar Demostración Comercial <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
