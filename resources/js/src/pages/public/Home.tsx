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
  ChevronRight,
  Phone,
  MessageCircle
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

const SERVICE_OPTIONS = [
  {
    value: 'Sistemas web / ERP',
    title: 'Sistema listo para usar',
    subtitle: 'SaaS / ERP',
    hint: 'Software listo para vender, controlar stock o gestionar tu empresa sin armarlo desde cero. Ej.: tienda online, inventario, cobros.',
    Icon: Cloud,
  },
  {
    value: 'Desarrollo a la Medida',
    title: 'Software a tu medida',
    subtitle: 'Proyecto a pedido',
    hint: 'Si tu forma de trabajar es especial y ningún sistema genérico te alcanza. Lo diseñamos y programamos para ti.',
    Icon: Code2,
  },
  {
    value: 'Páginas Web / Landing Pages',
    title: 'Página web o landing',
    subtitle: 'Presencia online',
    hint: 'Web de tu empresa, catálogo o página para captar clientes, llamadas y WhatsApp. Ideal si aún no tienes sitio o el actual no convierte.',
    Icon: Globe,
  },
  {
    value: 'Asesoría Técnica y Hosting',
    title: 'Hosting y soporte',
    subtitle: 'Infraestructura',
    hint: 'Que tu web o sistema esté siempre online, rápido, con respaldos y alguien que lo cuide día a día.',
    Icon: Server,
  },
  {
    value: 'No estoy seguro — quiero asesoría',
    title: 'No estoy seguro aún',
    subtitle: 'Te orientamos',
    hint: 'Cuéntanos el problema de tu negocio (ventas, stock, clientes, web…) y te recomendamos la mejor opción.',
    Icon: HelpCircle,
  },
] as const;

const DEFAULT_SERVICE_OF_INTEREST = SERVICE_OPTIONS[4].value;

const TECH_PILLS = ['React', 'Laravel', 'MySQL', 'Tailwind', 'VPS Linux'] as const;

type HomePillar = {
  key: string;
  title: string;
  description: string;
  bullets: string[];
  ctaLabel: string;
  ctaPath: string;
  icon: string;
};

const PILLAR_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Cloud,
  Code2,
  Globe,
  Server,
};

const DEFAULT_HOME_PILLARS: HomePillar[] = [
  {
    key: 'saas',
    title: '1. Sistemas web',
    description: 'Software para alquilar o comprar: tienda, gestión/ERP, flota y más. Cotizamos según tu necesidad.',
    bullets: ['Alquiler mensual o pago único.', 'Hosting incluido en alquiler.', 'Capacitación para que operes tú.'],
    ctaLabel: 'Ver sistemas',
    ctaPath: '/servicios/saas',
    icon: 'Cloud',
  },
  {
    key: 'medida',
    title: '2. Desarrollo a la Medida',
    description: 'Software Factory exclusivo creado según los flujos únicos de tu organización.',
    bullets: ['Código propio y exclusivo.', 'Arquitectura altamente escalable.', 'Integración API con terceros.'],
    ctaLabel: 'Cotizar Proyecto',
    ctaPath: '/servicios/a-la-medida',
    icon: 'Code2',
  },
  {
    key: 'web',
    title: '3. Páginas Web & Blogs',
    description: 'Sitios de alta conversión, blogs SEO y presencia digital con velocidad extrema.',
    bullets: ['Landing pages de conversión.', 'Webs corporativas administrables.', 'Arquitectura SEO on-page.'],
    ctaLabel: 'Ver servicios web',
    ctaPath: '/servicios/paginas-web-blogs',
    icon: 'Globe',
  },
  {
    key: 'infra',
    title: '4. Hosting & Infra',
    description: 'Dominios, hosting y gestión técnica para tu sistema o web.',
    bullets: ['Reventa con seguimiento SoftArc.', 'Respaldos según el plan.', 'Soporte de puesta en marcha.'],
    ctaLabel: 'Ver infraestructura',
    ctaPath: '/servicios/infraestructura-soporte',
    icon: 'Server',
  },
];

export default function Home() {
  const { settings } = useCompanySettings();
  const [activeProducts, setActiveProducts] = useState<SaaSProduct[]>([]);
  const [pillars, setPillars] = useState<HomePillar[]>(DEFAULT_HOME_PILLARS);
  
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [selectedProductForGallery, setSelectedProductForGallery] = useState<SaaSProduct | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const [formData, setFormData] = useState({
    contactName: '',
    companyName: '',
    phone: '',
    email: '',
    serviceOfInterest: DEFAULT_SERVICE_OF_INTEREST,
    notes: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    apiGet<SaaSProduct[]>('/api/catalog')
      .then((items) => setActiveProducts(items.filter((p) => p.status === 'Activo' || p.status === 'Beta').slice(0, 3)))
      .catch(() => setActiveProducts([]));

    apiGet<{ content?: { pillars?: HomePillar[] } }>('/api/web-pages/home-pillars')
      .then((res) => {
        const list = res?.content?.pillars;
        if (Array.isArray(list) && list.length > 0) {
          setPillars(
            list.map((p, i) => ({
              key: p.key || DEFAULT_HOME_PILLARS[i]?.key || `pillar-${i}`,
              title: p.title || DEFAULT_HOME_PILLARS[i]?.title || '',
              description: p.description || '',
              bullets: Array.isArray(p.bullets) ? p.bullets : DEFAULT_HOME_PILLARS[i]?.bullets || [],
              ctaLabel: p.ctaLabel || 'Ver más',
              ctaPath: p.ctaPath || '/',
              icon: p.icon || DEFAULT_HOME_PILLARS[i]?.icon || 'Cloud',
            })),
          );
        }
      })
      .catch(() => setPillars(DEFAULT_HOME_PILLARS));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    try {
      await apiMutate('post', '/api/leads', formData);
      setSubmitted(true);
      setFormData({ contactName: '', companyName: '', phone: '', email: '', serviceOfInterest: DEFAULT_SERVICE_OF_INTEREST, notes: '' });
      setTimeout(() => setSubmitted(false), 5000);
    } catch {
      setFormError('No se pudo enviar la solicitud. Inténtalo de nuevo o escríbenos por WhatsApp.');
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
      q: '¿Alquilo el sistema o lo compro?',
      a: 'Puedes alquilarlo (pago mensual con hosting, mantenimiento y backups mientras el servicio esté activo) o comprarlo (pago único con entrega, capacitación una vez, manual/video y acta firmada; después de la entrega no incluye soporte continuo). También hacemos proyectos a la medida.'
    },
    {
      q: '¿Desarrollan sistemas a la medida y soy dueño del código fuente?',
      a: 'Sí. En desarrollo a la medida entregamos el software según el contrato, con documentación y acuerdo de entrega. La propiedad intelectual se define en el contrato de cada proyecto.'
    },
    {
      q: '¿Tienen demos en vivo o precios fijos en la web?',
      a: 'Por ahora no publicamos demos interactivas ni planes con precio fijo. Te mostramos capturas o ejemplos del tipo de sistema (tienda, flota, ERP, etc.) y cotizamos según lo que necesitas. El contacto principal es WhatsApp.'
    },
    {
      q: '¿Puedo tener el sistema en un subdominio?',
      a: 'Cuando un producto se consolida (varios clientes del mismo giro), el alquiler puede ser por subdominio tipo tucliente.producto.pe, sin comprar dominio aparte. Dominio propio (white-label) se cotiza aparte.'
    },
    {
      q: '¿Qué incluye Páginas Web y SEO?',
      a: `Diseño adaptable a celular, foco en velocidad (${settings.serverLatency}), SEO on-page básico, conexión a WhatsApp y, si aplica, panel administrable. Se cotiza según el alcance.`
    },
    {
      q: '¿Qué garantías de disponibilidad y soporte ofrecen?',
      a: `En servicios de alquiler/hosting trabajamos con disponibilidad orientativa del ${settings.slaUptime} según la infraestructura, respaldos según lo acordado y canal de contacto por WhatsApp para ti (no atendemos a los clientes finales de tu negocio).`
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
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.45 }}
              className="text-sm md:text-base font-bold tracking-[0.2em] uppercase text-blue-500 mb-4"
            >
              {settings.commercialName || 'SoftArc'}
            </motion.p>
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
              {settings.brandSlogan?.trim() ||
                'Software web para alquilar o comprar, a la medida, páginas y hosting — cotizamos según tu negocio.'}
            </motion.p>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-col sm:flex-row justify-center gap-4"
            >
              <a href="#contact" className="inline-flex items-center justify-center px-8 py-3.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-all duration-300 shadow-[0_4px_20px_rgba(37,99,235,0.2)] hover:shadow-[0_4px_25px_rgba(37,99,235,0.4)]">
                Contactar por WhatsApp / formulario
              </a>
              <a
                href="#demos"
                className="inline-flex items-center justify-center px-8 py-3.5 text-sm font-semibold text-sa-text bg-sa-panel border border-sa-border hover:border-blue-500/50 rounded-xl transition-all duration-300"
              >
                Ver ejemplos
              </a>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Merit Bar / Valor Técnico */}
      <div className="border-b border-sa-border bg-sa-panel/40 backdrop-blur-sm relative z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-12 md:gap-16 text-sm md:text-base font-semibold text-sa-text">
            <div className="flex items-center gap-2 text-sa-muted"><span className="text-xl">🚀</span> Puesta en marcha y capacitación</div>
            <div className="flex items-center gap-2 text-sa-muted"><span className="text-xl">⚡</span> Alquiler o compra según tu caso</div>
            <div className="flex items-center gap-2 text-sa-muted"><span className="text-xl">🛡️</span> Contacto directo por WhatsApp</div>
          </div>
        </div>
      </div>

      {/* Services Section - 4 Pillars */}
      <section id="services" className="py-24 bg-sa-canvas border-t border-sa-border relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-sa-text mb-4">Nuestros servicios</h2>
            <p className="text-lg text-sa-muted">Elige el tipo de solución que necesitas. Te guiamos según el objetivo de tu negocio.</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {pillars.map((pillar) => {
              const Icon = PILLAR_ICON_MAP[pillar.icon] || Cloud;
              return (
                <div
                  key={pillar.key}
                  id={pillar.key}
                  className="group bg-sa-panel p-8 md:p-10 rounded-2xl border border-sa-border hover:border-blue-500/50 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(59,130,246,0.15)] transition-all duration-300 relative overflow-hidden flex flex-col justify-between"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" aria-hidden />
                  <div className="relative z-10 flex flex-col flex-1 justify-between">
                    <div>
                      <div className="w-14 h-14 bg-sa-panel-2 border border-sa-border group-hover:border-blue-500/30 rounded-2xl flex items-center justify-center mb-6 transition-colors duration-300">
                        <Icon className="h-7 w-7 text-blue-500" />
                      </div>
                      <h3 className="text-2xl font-bold text-sa-text mb-4">{pillar.title}</h3>
                      <p className="text-sa-muted mb-6 leading-relaxed">{pillar.description}</p>
                      <ul className="space-y-3 mb-8">
                        {pillar.bullets.map((item, i) => (
                          <li key={i} className="flex items-start">
                            <CheckCircle2 className="h-5 w-5 text-blue-500 mr-3 flex-shrink-0 mt-0.5" />
                            <span className="text-sa-text font-medium text-sm">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <Link
                      to={pillar.ctaPath}
                      className="group/btn inline-flex items-center justify-center gap-2 mt-2 px-5 py-3 text-sm font-semibold text-blue-500 hover:text-blue-400 transition-colors"
                    >
                      {pillar.ctaLabel} <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Demos Section */}
      <section id="demos" className="py-24 bg-sa-canvas border-t border-sa-border">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-sa-text mb-4">Ejemplos de sistemas</h2>
            <p className="text-lg text-sa-muted">Capturas y fichas de sistemas. Cotiza por WhatsApp; no son demos interactivas.</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {activeProducts.length === 0 ? (
              <div className="lg:col-span-3 bg-sa-panel border border-dashed border-sa-border rounded-2xl p-12 text-center">
                <Box className="h-10 w-10 text-sa-faint mx-auto mb-4" />
                <h3 className="text-xl font-bold text-sa-text mb-2">Pronto publicaremos capturas</h3>
                <p className="text-sm text-sa-muted max-w-md mx-auto mb-6">
                  Mientras tanto, escríbenos y te mostramos ejemplos del tipo de sistema que necesitas (tienda, flota, ERP, etc.).
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Link
                    to="/#contact"
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-colors"
                  >
                    Contactar <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    to="/servicios/saas"
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-sa-text bg-sa-canvas border border-sa-border hover:border-blue-500/50 transition-colors"
                  >
                    Ver sistemas web
                  </Link>
                </div>
              </div>
            ) : (
              activeProducts.map((product) => {
              const Icon = iconMap[product.iconName] || Box;
              const productWhatsappUrl = `https://wa.me/${settings.salesWhatsapp}?text=${encodeURIComponent('Hola, me interesa información sobre el sistema: ' + product.name)}`;

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
                        <MessageCircle className="h-4 w-4" /> Consultar por WhatsApp
                      </a>
                    </div>
                  </div>
                </div>
              );
            })
            )}
          </div>

          <div className="mt-12 text-center">
            <Link
              to="/catalogo"
              className="inline-flex items-center gap-2 text-sm font-semibold text-blue-500 hover:text-blue-400 transition-colors"
            >
              Ver todos los ejemplos <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-24 bg-sa-canvas border-t border-sa-border relative overflow-hidden">
        <div className="absolute top-1/2 left-0 w-[600px] h-[600px] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none -translate-y-1/2 -translate-x-1/2"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl mb-14">
            <p className="text-sm font-bold tracking-[0.18em] uppercase text-blue-500 mb-3">Quiénes somos</p>
            <h2 className="text-3xl md:text-4xl font-bold text-sa-text tracking-tight mb-4">
              {settings.commercialName || 'SoftArc'}
            </h2>
            <p className="text-sa-muted text-lg leading-relaxed">
              Somos <strong className="text-sa-text">{settings.legalName || settings.commercialName}</strong>:
              ayudamos a empresas a digitalizar ventas, operaciones y presencia online con software claro,
              soporte cercano y sin jerga innecesaria.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5 mb-12">
            <div className="bg-sa-panel border border-sa-border rounded-2xl p-6 hover:border-blue-500/40 transition-colors">
              <div className="w-11 h-11 rounded-xl bg-sa-panel-2 border border-sa-border flex items-center justify-center mb-4">
                <Layers className="h-5 w-5 text-blue-500" />
              </div>
              <h3 className="text-base font-bold text-sa-text mb-2">Software que se adapta a ti</h3>
              <p className="text-sm text-sa-muted leading-relaxed">
                Sistemas modulares listos o a medida: tú eliges según tu ritmo y presupuesto, no al revés.
              </p>
            </div>
            <div className="bg-sa-panel border border-sa-border rounded-2xl p-6 hover:border-blue-500/40 transition-colors">
              <div className="w-11 h-11 rounded-xl bg-sa-panel-2 border border-sa-border flex items-center justify-center mb-4">
                <ShieldCheck className="h-5 w-5 text-blue-500" />
              </div>
              <h3 className="text-base font-bold text-sa-text mb-2">Disponibilidad {settings.slaUptime || '99.9%'}</h3>
              <p className="text-sm text-sa-muted leading-relaxed">
                Respaldos automáticos, monitoreo continuo y soporte técnico local cuando lo necesitas.
              </p>
            </div>
            <div className="bg-sa-panel border border-sa-border rounded-2xl p-6 hover:border-blue-500/40 transition-colors">
              <div className="w-11 h-11 rounded-xl bg-sa-panel-2 border border-sa-border flex items-center justify-center mb-4">
                <Zap className="h-5 w-5 text-blue-500" />
              </div>
              <h3 className="text-base font-bold text-sa-text mb-2">Enfoque práctico</h3>
              <p className="text-sm text-sa-muted leading-relaxed">
                Partimos de tu problema de negocio (ventas, stock, clientes, web) y te proponemos la solución adecuada.
              </p>
            </div>
          </div>

          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-8 items-stretch">
            <div className="bg-sa-panel border border-sa-border rounded-2xl p-7 md:p-8 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-sa-text mb-3 flex items-center gap-2">
                  <Code2 className="h-5 w-5 text-blue-500" />
                  Tecnología con la que trabajamos
                </h3>
                <p className="text-sm text-sa-muted leading-relaxed mb-5">
                  Usamos herramientas modernas y estables para que tu sistema sea rápido, seguro y fácil de mantener.
                </p>
                <div className="flex flex-wrap gap-2">
                  {TECH_PILLS.map((tech) => (
                    <span
                      key={tech}
                      className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold text-sa-text bg-sa-panel-2 border border-sa-border"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
              <p className="mt-8 text-xs text-sa-faint leading-relaxed border-t border-sa-border pt-5">
                {settings.brandSlogan || 'Automatización comercial y software modular para empresas de alto rendimiento.'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-sa-panel border border-sa-border rounded-2xl p-5 flex flex-col justify-center">
                <div className="text-3xl font-extrabold text-blue-500 tracking-tight">{settings.slaUptime || '99.9%'}</div>
                <div className="text-xs text-sa-muted font-medium mt-2">Disponibilidad garantizada</div>
              </div>
              <div className="bg-sa-panel border border-sa-border rounded-2xl p-5 flex flex-col justify-center">
                <div className="text-3xl font-extrabold text-blue-500 tracking-tight">24/7</div>
                <div className="text-xs text-sa-muted font-medium mt-2">Monitoreo de servidores</div>
              </div>
              <div className="bg-sa-panel border border-sa-border rounded-2xl p-5 flex flex-col justify-center">
                <div className="text-3xl font-extrabold text-blue-500 tracking-tight">{settings.serverLatency || '<1s'}</div>
                <div className="text-xs text-sa-muted font-medium mt-2">Respuesta promedio</div>
              </div>
              <div className="bg-sa-panel border border-sa-border rounded-2xl p-5 flex flex-col justify-center">
                <div className="text-base md:text-lg font-extrabold text-blue-500 leading-snug">
                  {settings.storageType || 'SSD NVMe'}
                </div>
                <div className="text-xs text-sa-muted font-medium mt-2">Almacenamiento</div>
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
              <h2 className="text-4xl font-bold mb-6 text-sa-text tracking-tight">Contáctanos</h2>
              <p className="text-sa-muted text-lg mb-10 leading-relaxed max-w-md">
                Cuéntanos qué necesitas — aunque no sepas el nombre técnico. Te orientamos y te respondemos a la brevedad.
              </p>
              <div className="space-y-6">
                {settings.salesWhatsapp?.trim() && (
                  <a
                    href={`https://wa.me/${String(settings.salesWhatsapp).replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center text-sa-text bg-sa-panel p-4 rounded-xl border border-emerald-500/30 max-w-md hover:border-emerald-500/50 transition-colors"
                  >
                    <MessageCircle className="h-6 w-6 mr-4 text-emerald-500" />
                    <div>
                      <div className="text-xs text-sa-faint mb-0.5">Canal principal</div>
                      <div className="font-semibold">WhatsApp · {settings.salesPhone || settings.salesWhatsapp}</div>
                    </div>
                  </a>
                )}
                {settings.salesPhone?.trim() && !settings.salesWhatsapp?.trim() && (
                  <div className="flex items-center text-sa-text bg-sa-panel p-4 rounded-xl border border-sa-border max-w-md">
                    <Phone className="h-6 w-6 mr-4 text-blue-500" />
                    <div>
                      <div className="text-xs text-sa-faint mb-0.5">Teléfono</div>
                      <div className="font-semibold">{settings.salesPhone}</div>
                    </div>
                  </div>
                )}
                {settings.businessHours?.trim() && (
                  <div className="flex items-center text-sa-text bg-sa-panel p-4 rounded-xl border border-sa-border max-w-md">
                    <Clock className="h-6 w-6 mr-4 text-blue-500" />
                    <div>
                      <div className="text-xs text-sa-faint mb-0.5">Horario de Atención</div>
                      <div className="font-semibold">{settings.businessHours}</div>
                    </div>
                  </div>
                )}
                {settings.salesWhatsapp?.trim() && (
                  <div className="flex items-center text-sa-text bg-sa-panel p-4 rounded-xl border border-sa-border max-w-md">
                    <ShieldCheck className="h-6 w-6 mr-4 text-blue-500" />
                    <div>
                      <div className="text-xs text-sa-faint mb-0.5">Soporte</div>
                      <div className="font-semibold">Por WhatsApp (para ti, no para tus clientes finales)</div>
                    </div>
                  </div>
                )}
                {settings.salesWhatsapp?.trim() && (
                  <a
                    href={`https://wa.me/${String(settings.salesWhatsapp).replace(/\D/g, '')}?text=${encodeURIComponent(settings.whatsappWelcomeMessage || 'Hola, me gustaría más información.')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors max-w-md"
                  >
                    <MessageCircle className="h-5 w-5" />
                    Escribir por WhatsApp
                  </a>
                )}
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
                    <label className="block text-xs font-semibold text-sa-faint uppercase tracking-wider mb-2">
                      ¿Qué necesitas?
                    </label>
                    <p className="text-xs text-sa-muted mb-3 leading-relaxed">
                      Elige la opción que más se acerque. Si no estás seguro, deja marcada la última y descríbenos tu situación.
                    </p>
                    <div className="grid gap-2.5">
                      {SERVICE_OPTIONS.map(({ value, title, subtitle, hint, Icon }) => {
                        const selected = formData.serviceOfInterest === value;
                        return (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setFormData({ ...formData, serviceOfInterest: value })}
                            className={`w-full text-left rounded-xl border px-3.5 py-3 transition-colors ${
                              selected
                                ? 'border-blue-500 bg-blue-500/10 ring-1 ring-blue-500/40'
                                : 'border-sa-border bg-sa-input hover:border-sa-border-strong'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div
                                className={`mt-0.5 w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 border ${
                                  selected ? 'border-blue-500/40 bg-blue-500/15 text-blue-400' : 'border-sa-border bg-sa-panel-2 text-sa-faint'
                                }`}
                              >
                                <Icon className="h-4 w-4" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                                  <span className="text-sm font-semibold text-sa-text">{title}</span>
                                  <span className="text-[11px] text-sa-faint">{subtitle}</span>
                                </div>
                                <p className="text-xs text-sa-muted mt-1 leading-relaxed">{hint}</p>
                              </div>
                              <span
                                className={`mt-1 w-4 h-4 rounded-full border flex-shrink-0 ${
                                  selected ? 'border-blue-500 bg-blue-500' : 'border-sa-border-strong'
                                }`}
                                aria-hidden
                              />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-sa-faint uppercase tracking-wider mb-2">Mensaje / Requerimientos</label>
                    <textarea
                      rows={3}
                      value={formData.notes}
                      onChange={e => setFormData({...formData, notes: e.target.value})}
                      placeholder="Ej.: Vendo por WhatsApp y quiero ordenar pedidos e inventario… / Necesito una web para mi negocio…"
                      className="w-full px-3 py-2.5 bg-sa-input border border-sa-border rounded-xl text-sa-text text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder-sa-faint"
                    />
                  </div>
                  {formError && (
                    <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">{formError}</p>
                  )}
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
                  href={`https://wa.me/${settings.salesWhatsapp}?text=${encodeURIComponent('Hola, me interesa información sobre el sistema: ' + selectedProductForGallery.name)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors"
                >
                  <MessageCircle className="h-5 w-5" /> Consultar por WhatsApp
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
