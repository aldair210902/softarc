import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useCompanySettings } from '../hooks/useCompanySettings';
import { useTheme } from '../context/ThemeContext';
import { resolveFaviconUrls } from '../lib/brandAssets';

const ROUTE_LABELS: Record<string, string> = {
  '/': 'Inicio',
  '/catalogo': 'Ejemplos',
  '/demos': 'Ejemplos',
  '/login': 'Iniciar sesión',
  '/servicios/saas': 'Sistemas web',
  '/servicios/a-la-medida': 'Desarrollo a la medida',
  '/servicios/paginas-web-blogs': 'Páginas web & blogs',
  '/servicios/infraestructura-soporte': 'Dominios & hosting',
  '/admin': 'Dashboard',
  '/admin/crm': 'Prospectos',
  '/admin/clients': 'Clientes',
  '/admin/projects': 'Proyectos',
  '/admin/support': 'Tickets',
  '/admin/infra/catalog': 'Demos de sistemas',
  '/admin/infra/web-pages': 'Contenido web',
  '/admin/infra/media': 'Imágenes',
  '/admin/infra/providers': 'Proveedores',
  '/admin/infra/reseller-plans': 'Planes de reventa',
  '/admin/infra/servers': 'Servidores',
  '/admin/infra/domains': 'Dominios',
  '/admin/infra/credentials': 'Bóveda',
  '/admin/infra/hosting-wizard': 'Alta de hosting',
  '/admin/finances/billing': 'Cobranzas',
  '/admin/finances/proformas': 'Proformas',
  '/admin/finances/expenses': 'Gastos',
  '/admin/finances/reports': 'Reportes',
  '/admin/team': 'Equipo',
  '/admin/wiki': 'Wiki',
  '/admin/settings': 'Ajustes',
  '/admin/audit': 'Auditoría',
  '/admin/profile': 'Mi perfil',
};

const ROUTE_DESCRIPTIONS: Record<string, string> = {
  '/': 'Software web para alquilar o comprar, desarrollo a la medida, páginas web y hosting.',
  '/catalogo': 'Ejemplos y capturas de sistemas SoftArc. Cotiza por WhatsApp.',
  '/demos': 'Ejemplos de sistemas SoftArc. Cotiza según tu necesidad.',
  '/login': 'Acceso al portal de clientes y panel SoftArc.',
  '/servicios/saas': 'Sistemas web: alquiler, compra o a la medida. Tienda, ERP, flota y más. Sin precios fijos.',
  '/servicios/a-la-medida': 'ERPs, CRMs y portales a medida según contrato y alcance.',
  '/servicios/paginas-web-blogs': 'Landing pages, webs corporativas y blogs SEO.',
  '/servicios/infraestructura-soporte': 'Dominios, hosting y puesta en marcha con SoftArc.',
};

function upsertMeta(nameOrProperty: string, content: string, isProperty = false) {
  const attr = isProperty ? 'property' : 'name';
  let el = document.head.querySelector(`meta[${attr}="${nameOrProperty}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, nameOrProperty);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function bust(href: string): string {
  return href.includes('?') ? `${href}&v=${Date.now()}` : `${href}?v=${Date.now()}`;
}

function clearFaviconLinks() {
  document.head
    .querySelectorAll('link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]')
    .forEach((el) => el.remove());
}

function appendIcon(href: string, media?: string) {
  const link = document.createElement('link');
  link.rel = 'icon';
  link.type = href.split('?')[0].endsWith('.svg') ? 'image/svg+xml' : 'image/png';
  link.href = bust(href);
  if (media) link.media = media;
  document.head.appendChild(link);
}

/** Solo isotipo. Sigue el tema resuelto de la app (claro/oscuro/sistema). */
function setFavicon(href: string) {
  clearFaviconLinks();

  if (!href) {
    const blank = document.createElement('link');
    blank.rel = 'icon';
    blank.href = 'data:,';
    document.head.appendChild(blank);
    return;
  }

  appendIcon(href);
  const apple = document.createElement('link');
  apple.rel = 'apple-touch-icon';
  apple.href = bust(href);
  document.head.appendChild(apple);
}

/** Actualiza título, meta description, Open Graph y favicon según empresa + ruta. */
export function DocumentTitle() {
  const { settings } = useCompanySettings();
  const { resolved } = useTheme();
  const location = useLocation();

  useEffect(() => {
    const brand = (settings.commercialName || settings.legalName || 'SoftArc').trim();
    const path = location.pathname.replace(/\/$/, '') || '/';
    const label =
      ROUTE_LABELS[path] ||
      ROUTE_LABELS[location.pathname] ||
      (path.startsWith('/admin') ? 'Admin' : '');

    const title = label ? `${label} · ${brand}` : brand;
    document.title = title;

    const description =
      ROUTE_DESCRIPTIONS[path] ||
      ROUTE_DESCRIPTIONS[location.pathname] ||
      (settings.brandSlogan?.trim() ||
        `${brand}: automatización comercial, SaaS y desarrollo de software.`);

    upsertMeta('description', description);
    upsertMeta('og:title', title, true);
    upsertMeta('og:description', description, true);
  }, [settings.commercialName, settings.legalName, settings.brandSlogan, location.pathname]);

  useEffect(() => {
    const { light, dark } = resolveFaviconUrls(settings);
    setFavicon(resolved === 'dark' ? dark || light : light || dark);
  }, [
    resolved,
    settings.isotipoUrl,
    settings.isotipoLightUrl,
    settings.isotipoDarkUrl,
  ]);

  return null;
}
