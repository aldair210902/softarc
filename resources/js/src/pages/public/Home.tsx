import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  CheckCircle2, 
  PlayCircle, 
  Code2, 
  Cloud, 
  Globe, 
  Server, 
  ChevronDown, 
  ChevronUp, 
  Box, 
  ShieldCheck, 
  Mail, 
  Send, 
  Store, 
  Smartphone, 
  Sparkles, 
  Zap, 
  HelpCircle,
  Clock,
  Layers,
  Database,
  Image as ImageIcon,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { apiGet, apiMutate } from '../../lib/api';
import { useCompanySettings } from '../../hooks/useCompanySettings';
import { SaaSProduct } from '../../types';
import { ShoppingCart, LayoutTemplate, Puzzle, FlaskConical } from 'lucide-react';

const iconMap: Record<string, any> = {
  ShoppingCart,
  Box,
  LayoutTemplate,
  Puzzle,
  FlaskConical,
  Store,
  Code2,
  Globe,
  Server
};

export default function Home() {
  const { settings } = useCompanySettings();
  const [activeProducts, setActiveProducts] = useState<SaaSProduct[]>([]);
  
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [selectedProductForGallery, setSelectedProductForGallery] = useState<SaaSProduct | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const [formData, setFormData] = useState({
    contactName: '',
    companyName: '',
    phone: '',
    email: '',
    serviceOfInterest: 'SaaS E-commerce',
    notes: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    apiGet<SaaSProduct[]>('/api/catalog')
      .then((items) => setActiveProducts(items.filter((p) => p.status === 'Activo' || p.status === 'Beta').slice(0, 3)))
      .catch(() => setActiveProducts([]));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiMutate('post', '/api/leads', formData);
      setSubmitted(true);
      setFormData({ contactName: '', companyName: '', phone: '', email: '', serviceOfInterest: 'SaaS E-commerce', notes: '' });
      setTimeout(() => setSubmitted(false), 5000);
    } catch {
      // silent fail in public form; keep UX simple
    }
  };

  const nextImage = () => {
    if (selectedProductForGallery && selectedProductForGallery.imageUrls) {
      setCurrentImageIndex((prev) => (prev + 1) % selectedProductForGallery.imageUrls!.length);
    }
  };

  const prevImage = () => {
    if (selectedProductForGallery && selectedProductForGallery.imageUrls) {
      setCurrentImageIndex((prev) => (prev - 1 + selectedProductForGallery.imageUrls!.length) % selectedProductForGallery.imageUrls!.length);
    }
  };

  const faqs = [
    {
      q: '¿Cuánto tiempo toma implementar VariaShop en mi negocio?',
      a: `Al ser una solución SaaS modular lista para producción, la parametrización inicial de tu catálogo, configuración del módulo "Arma tu Box" con cálculo volumétrico y pasarelas de cobro locales (Yape/Plin/BCP) toma aproximadamente ${settings.defaultDeliveryDays} con capacitación incluida.`
    },
    {
      q: '¿Desarrollan sistemas a la medida y soy dueño del código fuente?',
      a: 'Sí. En nuestros proyectos de Desarrollo a la Medida (Software Factory para ERPs, CRMs y portales) entregamos código 100% propietario documentado, con arquitectura escalable y propiedad intelectual exclusiva para tu compañía.'
    },
    {
      q: '¿Cómo funcionan los modelos de monetización (SaaS vs. Proyectos)?',
      a: 'Para sistemas SaaS como VariaShop trabajamos con una tarifa de configuración inicial (Setup Fee) y una membresía mensual accesible (MRR) que cubre hosting cloud, actualizaciones y soporte continuo. Para software a la medida cotizamos por hitos de entrega con cronograma fijo.'
    },
    {
      q: '¿Qué pasarelas de pago y métodos locales están integrados?',
      a: 'Soportamos cobros directos por QR y transferencias (Yape, Plin, BCP, BBVA, Interbank) con validación de comprobante, además de integración con pasarelas de tarjetas de crédito/débito como Culqi, Izipay, Niubiz, Mercado Pago y Stripe.'
    },
    {
      q: '¿Qué incluye el servicio de Páginas Web y Posicionamiento SEO?',
      a: `Diseño UI/UX de alta conversión adaptado al 100% para celulares, velocidad de carga garantizada (${settings.serverLatency}), optimización SEO on-page, conexión a WhatsApp con mensaje automático y panel autoadministrable fácil de usar.`
    },
    {
      q: '¿Qué garantías de disponibilidad y soporte técnico ofrecen?',
      a: `Garantizamos un Acuerdo de Nivel de Servicio (SLA) del ${settings.slaUptime} de Uptime en servidores VPS Cloud de alto rendimiento con ${settings.storageType}, copias de seguridad diarias cifradas en almacenamiento S3 y canal directo de soporte por WhatsApp.`
    }
  ];

  return (
    <div className="flex flex-col overflow-hidden">
      {/* Hero Section */}
      <section className="relative pt-24 pb-32 overflow-hidden bg-sa-canvas">
        {/* Ambient Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5 }}
              className="text-5xl md:text-6xl lg:text-7xl font-semibold text-sa-text tracking-tighter mb-6 leading-tight"
            >
              Automatización comercial y tecnología modular.
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-lg md:text-xl text-sa-muted mb-10 max-w-2xl mx-auto leading-relaxed font-medium"
            >
              Plataformas SaaS, ERPs a la medida y estrategias digitales para escalar la operatividad de tu empresa sin límites.
            </motion.p>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-col sm:flex-row justify-center gap-4"
            >
              <a href="#contact" className="inline-flex items-center justify-center px-8 py-3.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-all duration-300 shadow-[0_4px_20px_rgba(37,99,235,0.2)] hover:shadow-[0_4px_25px_rgba(37,99,235,0.4)]">
                + Agendar Demostración
              </a>
              <a
                href="#demos"
                className="inline-flex items-center justify-center px-8 py-3.5 text-sm font-semibold text-sa-text bg-sa-panel border border-sa-border hover:border-blue-500/50 rounded-xl transition-all duration-300"
              >
                Explorar Demos
              </a>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Merit Bar / Valor Técnico */}
      <div className="border-b border-sa-border bg-sa-panel/40 backdrop-blur-sm relative z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-12 md:gap-16 text-sm md:text-base font-semibold text-sa-text">
            <div className="flex items-center gap-2 text-sa-muted"><span className="text-xl">🚀</span> Despliegue e Instalación Incluida</div>
            <div className="flex items-center gap-2 text-sa-muted"><span className="text-xl">⚡</span> Arquitectura Modular Scalable</div>
            <div className="flex items-center gap-2 text-sa-muted"><span className="text-xl">🛡️</span> Garantía de Soporte Directo 1 a 1</div>
          </div>
        </div>
      </div>

      {/* Services Section - 4 Pillars */}
      <section id="services" className="py-24 bg-sa-canvas border-t border-sa-border relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-sa-text mb-4">Catálogo de Productos y Servicios</h2>
            <p className="text-lg text-sa-muted">Nuestras líneas de negocio estructuradas para potenciar y digitalizar tu operativa diaria.</p>
          </div>
          
          <div className="grid lg:grid-cols-3 gap-8">
            {/* 1. SaaS */}
            <div id="saas" className="group bg-sa-panel p-8 md:p-10 rounded-2xl border border-sa-border hover:border-blue-500/50 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(59,130,246,0.15)] transition-all duration-300 relative overflow-hidden flex flex-col justify-between">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="w-14 h-14 bg-sa-panel-2 border border-sa-border group-hover:border-blue-500/30 rounded-2xl flex items-center justify-center mb-6 transition-colors duration-300">
                  <Cloud className="h-7 w-7 text-blue-500" />
                </div>
                <h3 className="text-2xl font-bold text-sa-text mb-4">1. Sistemas SaaS</h3>
                <p className="text-sa-muted mb-6 leading-relaxed">Software por suscripción listo para potenciar tu empresa de forma inmediata.</p>
                <ul className="space-y-3 mb-8">
                  {['Pago mensual (MRR).', 'Multi-usuario y escalable.', 'Sin instalación (100% Cloud).'].map((item, i) => (
                    <li key={i} className="flex items-start">
                      <CheckCircle2 className="h-5 w-5 text-blue-500 mr-3 flex-shrink-0 mt-0.5" />
                      <span className="text-sa-text font-medium text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <a
                href="#demos"
                className="group/btn inline-flex items-center justify-center gap-2 mt-2 px-5 py-3 text-sm font-semibold text-blue-500 hover:text-blue-400 transition-colors"
              >
                Ver Demos <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
              </a>
            </div>

            {/* 2. Custom Software */}
            <div id="medida" className="group bg-sa-panel p-8 md:p-10 rounded-2xl border border-sa-border hover:border-blue-500/50 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(59,130,246,0.15)] transition-all duration-300 relative overflow-hidden flex flex-col justify-between">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="w-14 h-14 bg-sa-panel-2 border border-sa-border group-hover:border-blue-500/30 rounded-2xl flex items-center justify-center mb-6 transition-colors duration-300">
                  <Code2 className="h-7 w-7 text-blue-500" />
                </div>
                <h3 className="text-2xl font-bold text-sa-text mb-4">2. Desarrollo a la Medida</h3>
                <p className="text-sa-muted mb-6 leading-relaxed">Software Factory exclusivo creado según los flujos únicos de tu organización.</p>
                <ul className="space-y-3 mb-8">
                  {['Código propio y exclusivo.', 'Arquitectura altamente escalable.', 'Integración API con terceros.'].map((item, i) => (
                    <li key={i} className="flex items-start">
                      <CheckCircle2 className="h-5 w-5 text-blue-500 mr-3 flex-shrink-0 mt-0.5" />
                      <span className="text-sa-text font-medium text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <a
                href="#contact"
                className="group/btn inline-flex items-center justify-center gap-2 mt-2 px-5 py-3 text-sm font-semibold text-blue-500 hover:text-blue-400 transition-colors"
              >
                Cotizar Proyecto <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
              </a>
            </div>

            {/* 3. Hosting & Servers */}
            <div id="infra" className="group bg-sa-panel p-8 md:p-10 rounded-2xl border border-sa-border hover:border-blue-500/50 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(59,130,246,0.15)] transition-all duration-300 relative overflow-hidden flex flex-col justify-between">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="w-14 h-14 bg-sa-panel-2 border border-sa-border group-hover:border-blue-500/30 rounded-2xl flex items-center justify-center mb-6 transition-colors duration-300">
                  <Server className="h-7 w-7 text-blue-500" />
                </div>
                <h3 className="text-2xl font-bold text-sa-text mb-4">3. Hosting & Servidores Administrados</h3>
                <p className="text-sa-muted mb-6 leading-relaxed">Gestión técnica continua e infraestructura Cloud de alto rendimiento.</p>
                <ul className="space-y-3 mb-8">
                  {['Mantenimiento continuo de VPS.', 'Respaldos diarios S3.', 'Monitoreo de Uptime 24/7.'].map((item, i) => (
                    <li key={i} className="flex items-start">
                      <CheckCircle2 className="h-5 w-5 text-blue-500 mr-3 flex-shrink-0 mt-0.5" />
                      <span className="text-sa-text font-medium text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <a
                href="#contact"
                className="group/btn inline-flex items-center justify-center gap-2 mt-2 px-5 py-3 text-sm font-semibold text-blue-500 hover:text-blue-400 transition-colors"
              >
                Ver Planes <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Demos Section */}
      <section id="demos" className="py-24 bg-sa-canvas border-t border-sa-border">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-sa-text mb-4">Showroom Interactivo</h2>
            <p className="text-lg text-sa-muted">Explora nuestras soluciones SaaS y sistemas internos en funcionamiento real.</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {activeProducts.map((product) => {
              const Icon = iconMap[product.iconName] || Box;
              const productWhatsappUrl = `https://wa.me/${settings.salesWhatsapp}?text=${encodeURIComponent('Hola, me interesa solicitar una demo interactiva del producto: ' + product.name)}`;

              return (
                <div key={product.id} className="group flex flex-col border border-sa-border rounded-2xl overflow-hidden hover:border-blue-500/50 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(59,130,246,0.15)] transition-all duration-300 bg-sa-panel">
                  <div className="h-56 bg-sa-canvas relative overflow-hidden p-4 flex items-end justify-center border-b border-sa-border">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-300"></div>
                    
                    {/* Browser/System Frame */}
                    <div className="w-full h-[180px] bg-sa-panel-2 rounded-t-xl border-t border-x border-sa-border shadow-2xl overflow-hidden relative group-hover:scale-105 transition-transform duration-500 flex flex-col z-10">
                      <div className="h-6 bg-sa-canvas border-b border-sa-border flex items-center px-3 gap-1.5 shrink-0">
                        <div className="w-2 h-2 rounded-full bg-sa-faint"></div>
                        <div className="w-2 h-2 rounded-full bg-sa-faint"></div>
                        <div className="w-2 h-2 rounded-full bg-sa-faint"></div>
                      </div>
                      <div className="flex-1 relative bg-sa-canvas">
                        {product.imageUrls && product.imageUrls.length > 0 ? (
                          <img src={product.imageUrls[0]} alt={product.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-300" />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-sa-panel">
                             <Icon className="h-12 w-12 text-[#334155] mb-2" />
                             <span className="text-xs text-sa-faint font-medium">Vista previa de interfaz</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-sa-canvas to-transparent opacity-60 z-0"></div>
                  </div>
                  <div className="p-6 flex flex-col flex-1 relative z-20">
                    <h4 className="text-xl font-bold text-sa-text mb-2 flex items-center gap-2">
                      <Icon className="h-5 w-5 text-blue-500" /> {product.name}
                    </h4>
                    <p className="text-sa-muted text-sm mb-6 flex-1">{product.description}</p>
                    <div className="flex flex-wrap gap-2 mb-6">
                      {product.techStack.map(tech => (
                        <span key={tech} className="px-2 py-1 bg-sa-panel-2 text-[10px] text-sa-muted rounded border border-sa-border-strong">{tech}</span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      {product.imageUrls && product.imageUrls.length > 0 && (
                        <button
                          type="button"
                          onClick={(e) => { e.preventDefault(); setSelectedProductForGallery(product); setGalleryOpen(true); setCurrentImageIndex(0); }}
                          title="Ver Capturas del Sistema"
                          className="p-3 rounded-xl border border-sa-border bg-sa-canvas text-sa-muted hover:text-sa-text hover:border-blue-500/40 transition-colors"
                        >
                          <ImageIcon className="h-4 w-4" />
                        </button>
                      )}
                      <a href={productWhatsappUrl} target="_blank" rel="noreferrer" className="flex-1 py-3 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-all duration-300 shadow-md flex items-center justify-center gap-2">
                        <PlayCircle className="h-4 w-4" /> Solicitar Demo
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-12 text-center">
            <Link
              to="/catalogo"
              className="inline-flex items-center gap-2 text-sm font-semibold text-blue-500 hover:text-blue-400 transition-colors"
            >
              Explorar Catálogo Completo de Demos y Sistemas <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-24 bg-sa-canvas border-t border-sa-border relative overflow-hidden">
        <div className="absolute top-1/2 left-0 w-[600px] h-[600px] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none -translate-y-1/2 -translate-x-1/2"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-sa-text mb-6">Nosotros</h2>
              <p className="text-sa-muted text-lg mb-8 leading-relaxed">
                Somos <strong >Software Architec SAC</strong>, un equipo apasionado por la ingeniería de software y la automatización comercial. Desarrollamos herramientas que resuelven problemas reales con código limpio y arquitecturas escalables.
              </p>
              
              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-bold text-sa-text mb-3 flex items-center">
                    <ShieldCheck className="h-6 w-6 text-blue-500 mr-3" />
                    Propuesta de Valor
                  </h3>
                  <p className="text-sa-muted leading-relaxed">
                    Creemos en el software modular frente a plataformas genéricas lentas. Construimos sistemas donde tú tienes el control absoluto de tus procesos y tus datos, eliminando fricciones operativas.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-xl font-bold text-sa-text mb-3 flex items-center">
                    <Code2 className="h-6 w-6 text-blue-500 mr-3" />
                    Stack Tecnológico
                  </h3>
                  <p className="text-sa-muted leading-relaxed">
                    Nuestra infraestructura se apoya en tecnologías líderes: <strong >React, Tailwind CSS, Laravel, Python, MySQL, y VPS Linux de alto rendimiento</strong>, asegurando velocidad y seguridad.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-sa-text mb-3 flex items-center">
                    <CheckCircle2 className="h-6 w-6 text-blue-500 mr-3" />
                    Garantía de Servicio (SLA)
                  </h3>
                  <p className="text-sa-muted leading-relaxed">
                    Compromiso de disponibilidad del <strong >99.9% (Uptime)</strong>, copias de seguridad automatizadas y soporte técnico especializado local.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/20 to-transparent rounded-2xl transform translate-x-4 translate-y-4 border border-blue-500/20"></div>
              <div className="bg-sa-panel border border-sa-border rounded-2xl p-8 relative z-10">
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center p-6 bg-sa-panel-2 rounded-xl border border-sa-border">
                    <div className="text-4xl font-extrabold text-blue-500 mb-2">99.9%</div>
                    <div className="text-sm text-sa-muted font-medium">Uptime Garantizado</div>
                  </div>
                  <div className="text-center p-6 bg-sa-panel-2 rounded-xl border border-sa-border">
                    <div className="text-4xl font-extrabold text-blue-500 mb-2">24/7</div>
                    <div className="text-sm text-sa-muted font-medium">Monitoreo Servidores</div>
                  </div>
                  <div className="text-center p-6 bg-sa-panel-2 rounded-xl border border-sa-border">
                    <div className="text-4xl font-extrabold text-blue-500 mb-2">&lt;1s</div>
                    <div className="text-sm text-sa-muted font-medium">Latencia Promedio</div>
                  </div>
                  <div className="text-center p-6 bg-sa-panel-2 rounded-xl border border-sa-border">
                    <div className="text-4xl font-extrabold text-blue-500 mb-2">SSD</div>
                    <div className="text-sm text-sa-muted font-medium">Almacenamiento NVMe</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-sa-canvas border-t border-sa-border">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-sa-text mb-4">Preguntas Frecuentes</h2>
            <p className="text-sa-muted">Resolvemos las dudas más comunes sobre nuestra metodología de trabajo.</p>
          </div>
          
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div 
                key={index} 
                className={`border rounded-2xl overflow-hidden transition-colors duration-300 ${openFaq === index ? 'bg-sa-panel border-blue-500/30' : 'bg-sa-panel border-sa-border hover:border-sa-border-strong'}`}>
                <button 
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full px-6 py-5 text-left flex justify-between items-center focus:outline-none"
                >
                  <span className="font-semibold text-sa-text text-base">{faq.q}</span>
                  <div className={`flex-shrink-0 ml-4 p-1 rounded-full transition-colors duration-300 ${openFaq === index ? 'bg-blue-600/20 text-blue-400' : 'text-sa-faint'}`}>
                    {openFaq === index ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </div>
                </button>
                <AnimatePresence>
                  {openFaq === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-5 pt-1 text-sa-muted text-sm leading-relaxed border-t border-sa-border/50 mt-2">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-24 bg-sa-canvas border-t border-sa-border relative">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6 text-sa-text tracking-tight">Impulsa tu negocio hoy</h2>
              <p className="text-sa-muted text-lg mb-10 leading-relaxed max-w-md">
                Completa el formulario para agendar una demostración en vivo o solicitar una cotización. Nuestro equipo experto se contactará contigo a la brevedad.
              </p>
              <div className="space-y-6">
                <div className="flex items-center text-sa-text bg-sa-panel p-4 rounded-xl border border-sa-border max-w-md">
                  <Mail className="h-6 w-6 mr-4 text-blue-500" />
                  <div>
                    <div className="text-xs text-sa-faint mb-0.5">Ventas y Asesoría</div>
                    <div className="font-semibold">{settings.salesEmail}</div>
                  </div>
                </div>
                <div className="flex items-center text-sa-text bg-sa-panel p-4 rounded-xl border border-sa-border max-w-md">
                  <ShieldCheck className="h-6 w-6 mr-4 text-blue-500" />
                  <div>
                    <div className="text-xs text-sa-faint mb-0.5">Soporte Técnico Oficial</div>
                    <div className="font-semibold">{settings.supportEmail} · {settings.supportPhone}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-sa-panel p-8 md:p-10 rounded-2xl border border-sa-border shadow-2xl relative">
              <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent rounded-2xl pointer-events-none"></div>
              {submitted ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="h-full flex flex-col items-center justify-center text-center py-16"
                >
                  <div className="w-20 h-20 bg-green-500/10 border border-green-500/30 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 className="h-10 w-10 text-green-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-sa-text mb-3">¡Solicitud Enviada!</h3>
                  <p className="text-sa-muted">Nos pondremos en contacto contigo muy pronto para brindarte la mejor solución.</p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-semibold text-sa-faint uppercase tracking-wider mb-2">Nombre Completo</label>
                      <input required type="text" value={formData.contactName} onChange={e => setFormData({...formData, contactName: e.target.value})} placeholder="Tu nombre" className="w-full px-3 py-2.5 bg-sa-input border border-sa-border rounded-xl text-sa-text text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder-sa-faint" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-sa-faint uppercase tracking-wider mb-2">Empresa / Tienda</label>
                      <input required type="text" value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} placeholder="Razón social" className="w-full px-3 py-2.5 bg-sa-input border border-sa-border rounded-xl text-sa-text text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder-sa-faint" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-semibold text-sa-faint uppercase tracking-wider mb-2">Teléfono / WhatsApp</label>
                      <input required type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="+51 999..." className="w-full px-3 py-2.5 bg-sa-input border border-sa-border rounded-xl text-sa-text text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder-sa-faint" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-sa-faint uppercase tracking-wider mb-2">Correo Electrónico</label>
                      <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="correo@empresa.com" className="w-full px-3 py-2.5 bg-sa-input border border-sa-border rounded-xl text-sa-text text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder-sa-faint" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-sa-faint uppercase tracking-wider mb-2">Servicio de Interés</label>
                    <select value={formData.serviceOfInterest} onChange={e => setFormData({...formData, serviceOfInterest: e.target.value})} className="w-full px-3 py-2.5 bg-sa-input border border-sa-border rounded-xl text-sa-text text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
                      <option>Sistemas SaaS (VariaShop, ERP)</option>
                      <option>Desarrollo a la Medida</option>
                      <option>Páginas Web / Landing Pages</option>
                      <option>Asesoría Técnica y Hosting</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-sa-faint uppercase tracking-wider mb-2">Mensaje / Requerimientos</label>
                    <textarea rows={3} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="Cuéntanos un poco sobre lo que necesitas..." className="w-full px-3 py-2.5 bg-sa-input border border-sa-border rounded-xl text-sa-text text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder-sa-faint"></textarea>
                  </div>
                  <button type="submit" className="w-full inline-flex items-center justify-center px-6 py-3.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-colors shadow-lg shadow-blue-900/20">
                    Enviar Solicitud Comercial
                    <Send className="ml-2 h-5 w-5" />
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
      {/* Lightbox / Gallery Modal */}
      <AnimatePresence>
        {galleryOpen && selectedProductForGallery && selectedProductForGallery.imageUrls && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
          >
            <div className="absolute inset-0" onClick={() => setGalleryOpen(false)}></div>
            <div className="relative w-full max-w-5xl bg-sa-canvas border border-sa-border rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
              <div className="flex items-center justify-between p-4 border-b border-sa-border bg-sa-panel">
                <h3 className="text-xl font-bold text-sa-text flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-blue-400" />
                  {selectedProductForGallery.name} - Galería
                </h3>
                <button
                  type="button"
                  onClick={() => setGalleryOpen(false)}
                  className="p-2 rounded-lg text-sa-faint hover:text-sa-text hover:bg-sa-border transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="flex-1 overflow-hidden relative bg-black flex items-center justify-center min-h-[400px]">
                <img 
                  src={selectedProductForGallery.imageUrls[currentImageIndex]} 
                  alt={`${selectedProductForGallery.name} preview ${currentImageIndex + 1}`}
                  className="max-w-full max-h-[70vh] object-contain"
                />
                
                {selectedProductForGallery.imageUrls.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={prevImage}
                      className="absolute left-3 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </button>
                    <button
                      type="button"
                      onClick={nextImage}
                      className="absolute right-3 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                    >
                      <ChevronRight className="h-6 w-6" />
                    </button>
                    
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-black/50 px-3 py-2 rounded-full border border-white/10">
                      {selectedProductForGallery.imageUrls.map((_, idx) => (
                        <button 
                          key={idx}
                          type="button"
                          onClick={() => setCurrentImageIndex(idx)}
                          className={`w-2 h-2 rounded-full transition-colors ${idx === currentImageIndex ? 'bg-blue-500' : 'bg-white/30 hover:bg-white/60'}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
              
              <div className="p-4 border-t border-sa-border bg-sa-panel flex justify-center">
                <a 
                  href={`https://wa.me/${settings.salesWhatsapp}?text=${encodeURIComponent('Hola, me interesa solicitar una demo interactiva del producto: ' + selectedProductForGallery.name)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors"
                >
                  <PlayCircle className="h-5 w-5" /> Solicitar Demo de este Sistema
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
