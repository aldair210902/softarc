import React, { useEffect, useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Lock, MessageCircle, Instagram, Linkedin, Video, Menu, X, Facebook, Youtube } from 'lucide-react';
import { useCompanySettings } from '../hooks/useCompanySettings';
import { cn } from '../lib/utils';
import { resolveFooterBrand, resolveHeaderBrand } from '../lib/brandAssets';
import { useTheme } from '../context/ThemeContext';
import { ThemeToggle } from '../components/ThemeToggle';
import { publicSlogan } from '../lib/defaults';

function BrandMark({ className, size = 'header' }: { className?: string; size?: 'header' | 'footer' }) {
  const { settings } = useCompanySettings();
  const { resolved } = useTheme();
  const isFooter = size === 'footer';
  const brand = isFooter
    ? resolveFooterBrand(settings, resolved)
    : resolveHeaderBrand(settings, resolved);
  const initial = (settings.commercialName || 'S').trim().charAt(0).toUpperCase() || 'S';
  const themeKey = resolved;

  if (isFooter) {
    if (brand.mode === 'lockup' || brand.mode === 'word') {
      return (
        <img
          key={themeKey}
          src={brand.src}
          alt={settings.commercialName}
          className={cn('h-12 sm:h-14 w-auto max-w-[min(100%,280px)] object-contain object-left', className)}
        />
      );
    }

    if (brand.mode === 'mark-word') {
      return (
        <div className={cn('flex items-center gap-2 h-14', className)}>
          <img key={`${themeKey}-m`} src={brand.mark} alt="" className="h-12 w-12 object-contain shrink-0" />
          {brand.word ? (
            <img key={`${themeKey}-w`} src={brand.word} alt={settings.commercialName} className="h-10 w-auto max-w-[180px] object-contain" />
          ) : (
            <span className="font-bold text-lg tracking-tight text-sa-text truncate">
              {settings.commercialName.toUpperCase()}
            </span>
          )}
        </div>
      );
    }

    return (
      <div className={cn('flex items-center gap-2 h-14', className)}>
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-white shrink-0">
          {initial}
        </div>
        <span className="font-bold text-lg tracking-tight text-sa-text truncate">
          {brand.label.toUpperCase()}
        </span>
      </div>
    );
  }

  // Header: logo grande sin agrandar la barra.
  if (brand.mode === 'lockup') {
    return (
      <img
        key={themeKey}
        src={brand.src}
        alt={settings.commercialName}
        className={cn(
          'h-16 sm:h-20 w-auto max-w-[min(70vw,20rem)] object-contain object-left',
          className,
        )}
      />
    );
  }

  if (brand.mode === 'word') {
    return (
      <img
        key={themeKey}
        src={brand.src}
        alt={settings.commercialName}
        className={cn(
          'h-12 sm:h-16 w-auto max-w-[min(70vw,18rem)] object-contain object-left',
          className,
        )}
      />
    );
  }

  if (brand.mode === 'mark-word') {
    return (
      <span className={cn('inline-flex items-center gap-2 min-w-0', className)}>
        <img
          key={`${themeKey}-m`}
          src={brand.mark}
          alt=""
          className="rounded-xl object-contain shrink-0 h-11 w-11 sm:h-12 sm:w-12"
        />
        {brand.word ? (
          <img
            key={`${themeKey}-w`}
            src={brand.word}
            alt={settings.commercialName}
            className="w-auto object-contain h-9 sm:h-11 max-w-[min(50vw,12rem)]"
          />
        ) : (
          <span className="font-bold text-lg sm:text-xl tracking-tight text-sa-text truncate">
            {settings.commercialName.toUpperCase()}
          </span>
        )}
      </span>
    );
  }

  return (
    <span className={cn('inline-flex items-center gap-3 min-w-0', className)}>
      <div className="w-11 h-11 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-white shadow-[0_0_15px_rgba(37,99,235,0.5)] shrink-0 text-lg">
        {initial}
      </div>
      <span className="font-bold text-lg sm:text-xl tracking-tight text-sa-text truncate">
        {brand.label.toUpperCase()}
      </span>
    </span>
  );
}

export default function PublicLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { settings } = useCompanySettings();
  const navigate = useNavigate();
  const location = useLocation();

  const scrollToId = (id: string) => {
    const element = document.getElementById(id);
    if (!element) return false;
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return true;
  };

  useEffect(() => {
    if (location.pathname !== '/') return;
    const hash = location.hash.replace(/^#/, '');
    if (!hash) return;
    const t = window.setTimeout(() => {
      scrollToId(hash);
    }, 60);
    return () => window.clearTimeout(t);
  }, [location.pathname, location.hash]);

  const handleSectionNav = (e: React.MouseEvent, sectionId: string) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);
    if (location.pathname === '/') {
      scrollToId(sectionId);
      navigate({ pathname: '/', hash: sectionId }, { replace: true });
      return;
    }
    navigate({ pathname: '/', hash: sectionId });
  };

  const whatsappUrl = `https://wa.me/${settings.salesWhatsapp}?text=${encodeURIComponent(settings.whatsappWelcomeMessage)}`;
  const navLinkClass = (active: boolean) =>
    cn(
      'text-sm font-medium transition-colors',
      active ? 'text-blue-400' : 'text-sa-muted hover:text-blue-400',
    );

  const sectionActive = (id: string) => location.pathname === '/' && location.hash === `#${id}`;

  return (
    <div className="min-h-screen flex flex-col font-sans bg-sa-canvas text-sa-text">
      <header className="sticky top-0 z-50 h-14 bg-sa-canvas/95 border-b border-sa-border overflow-visible">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full overflow-visible">
          <div className="relative flex justify-between items-center h-full overflow-visible">
            <Link
              to="/"
              className="relative z-20 flex items-center min-w-0 py-2 pr-3"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <BrandMark size="header" />
            </Link>

            <nav className="hidden md:flex items-center gap-7 relative z-10">
              <button type="button" onClick={(e) => handleSectionNav(e, 'services')} className={navLinkClass(sectionActive('services'))}>
                Servicios
              </button>
              <Link to="/catalogo" className={navLinkClass(location.pathname.startsWith('/catalogo') || location.pathname.startsWith('/demos'))}>
                Ejemplos
              </Link>
              <button type="button" onClick={(e) => handleSectionNav(e, 'about')} className={navLinkClass(sectionActive('about'))}>
                Nosotros
              </button>
              <button type="button" onClick={(e) => handleSectionNav(e, 'contact')} className={navLinkClass(sectionActive('contact'))}>
                Contacto
              </button>
            </nav>

            <div className="flex items-center gap-3 relative z-10">
              <ThemeToggle compact />
              <Link
                to="/login"
                className="flex items-center gap-2 px-4 py-2 bg-transparent hover:bg-blue-600 border border-blue-500 text-blue-400 hover:text-white rounded-xl text-sm font-semibold transition-all duration-300"
              >
                <Lock className="h-4 w-4" />
                <span className="hidden sm:inline">Iniciar Sesión</span>
              </Link>

              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-lg bg-sa-panel border border-sa-border text-sa-muted hover:text-sa-text md:hidden"
                aria-label="Abrir menú"
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-sa-border bg-sa-canvas px-4 py-6 space-y-2">
            <button type="button" onClick={(e) => handleSectionNav(e, 'services')} className="block w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-sa-text hover:bg-sa-panel">
              Servicios
            </button>
            <Link to="/catalogo" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sm font-semibold text-sa-text hover:bg-sa-panel">
              Ejemplos
            </Link>
            <button type="button" onClick={(e) => handleSectionNav(e, 'about')} className="block w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-sa-text hover:bg-sa-panel">
              Nosotros
            </button>
            <button type="button" onClick={(e) => handleSectionNav(e, 'contact')} className="block w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-sa-text hover:bg-sa-panel">
              Contacto
            </button>
            <div className="pt-4 mt-2 border-t border-sa-border">
              <Link
                to="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600/10 text-blue-400 rounded-lg text-sm font-semibold"
              >
                <Lock className="h-4 w-4" /> Iniciar Sesión
              </Link>
            </div>
          </div>
        )}
      </header>

      <main className="flex-grow">
        <Outlet />
      </main>

      <footer className="bg-sa-panel text-sa-muted py-5 border-t border-sa-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-5 md:gap-6">
          <div className="col-span-1 md:col-span-2 min-w-0">
            <div className="mb-2 leading-none">
              <BrandMark size="footer" />
            </div>
            <p className="text-xs max-w-sm text-sa-faint mb-1.5 leading-snug">{publicSlogan(settings.brandSlogan)}</p>
            <p className="text-[11px] text-sa-muted mb-2.5 leading-snug">
              📍 {settings.address}, {settings.city} · {settings.country}
            </p>
            <div className="flex flex-wrap gap-2">
              {settings.instagramUrl && (
                <a
                  href={settings.instagramUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Instagram"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-sa-border bg-sa-canvas text-sa-muted hover:text-sa-text hover:border-blue-500/40 transition-colors"
                >
                  <Instagram className="h-4 w-4" />
                </a>
              )}
              {settings.tiktokUrl && (
                <a
                  href={settings.tiktokUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="TikTok"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-sa-border bg-sa-canvas text-sa-muted hover:text-sa-text hover:border-blue-500/40 transition-colors"
                >
                  <Video className="h-4 w-4" />
                </a>
              )}
              {settings.linkedinUrl && (
                <a
                  href={settings.linkedinUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="LinkedIn"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-sa-border bg-sa-canvas text-sa-muted hover:text-sa-text hover:border-blue-500/40 transition-colors"
                >
                  <Linkedin className="h-4 w-4" />
                </a>
              )}
              {settings.facebookUrl && (
                <a
                  href={settings.facebookUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Facebook"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-sa-border bg-sa-canvas text-sa-muted hover:text-sa-text hover:border-blue-500/40 transition-colors"
                >
                  <Facebook className="h-4 w-4" />
                </a>
              )}
              {settings.youtubeUrl && (
                <a
                  href={settings.youtubeUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="YouTube"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-sa-border bg-sa-canvas text-sa-muted hover:text-sa-text hover:border-blue-500/40 transition-colors"
                >
                  <Youtube className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>
          <div>
            <h3 className="text-sa-text font-semibold text-sm mb-2">Líneas de Servicio</h3>
            <ul className="space-y-1.5 text-xs text-sa-muted">
              <li><Link to="/servicios/saas" className="hover:text-blue-500 transition-colors">Sistemas web</Link></li>
              <li><Link to="/servicios/a-la-medida" className="hover:text-blue-500 transition-colors">Desarrollo a la medida</Link></li>
              <li><Link to="/servicios/paginas-web-blogs" className="hover:text-blue-500 transition-colors">Páginas web & blogs</Link></li>
              <li><Link to="/servicios/infraestructura-soporte" className="hover:text-blue-500 transition-colors">Dominios & hosting</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sa-text font-semibold text-sm mb-2">Accesos & Legal</h3>
            <ul className="space-y-1.5 text-xs text-sa-muted">
              <li><Link to="/catalogo" className="hover:text-blue-500 transition-colors">Ejemplos de sistemas</Link></li>
              <li><Link to="/login" className="hover:text-blue-500 transition-colors">Portal de Clientes</Link></li>
              <li>
                <button type="button" onClick={(e) => handleSectionNav(e, 'contact')} className="hover:text-blue-500 transition-colors">
                  Solicitar cotización
                </button>
              </li>
              <li className="pt-1 text-sa-faint">RUC: {settings.ruc}</li>
              <li className="text-sa-faint">{settings.legalName}</li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 pt-3 border-t border-sa-border text-xs text-center text-sa-faint">
          &copy; {new Date().getFullYear()} {settings.legalName}. Todos los derechos reservados.
        </div>
      </footer>

      <a
        href={whatsappUrl}
        target="_blank"
        rel="noreferrer"
        aria-label="Contactar por WhatsApp"
        className="fixed bottom-5 right-5 z-50 group inline-flex items-center gap-0 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white p-3.5 shadow-lg shadow-emerald-900/30 transition-all"
      >
        <MessageCircle className="h-6 w-6 shrink-0" />
        <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-300 ease-in-out text-xs font-bold px-0 group-hover:pl-2 group-hover:pr-1">
          ¿En qué podemos ayudarte?
        </span>
      </a>
    </div>
  );
}
