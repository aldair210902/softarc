import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useCompanySettings } from '../hooks/useCompanySettings';
import { useTheme } from '../context/ThemeContext';
import { resolveFaviconUrls } from '../lib/brandAssets';

const ROUTE_LABELS: Record<string, string> = {
  '/': 'Inicio',
  '/catalogo': 'Catálogo',
  '/demos': 'Demos',
  '/login': 'Iniciar sesión',
  '/servicios/saas': 'Sistemas SaaS',
  '/servicios/a-la-medida': 'Desarrollo a la medida',
  '/servicios/paginas-web-blogs': 'Páginas web & blogs',
  '/servicios/infraestructura-soporte': 'Infraestructura',
  '/admin': 'Dashboard',
  '/admin/crm': 'CRM',
  '/admin/clients': 'Clientes',
  '/admin/projects': 'Proyectos',
  '/admin/support': 'Soporte',
  '/admin/infra/catalog': 'Catálogo SaaS',
  '/admin/infra/media': 'Imágenes',
  '/admin/infra/providers': 'Proveedores',
  '/admin/infra/servers': 'Servidores',
  '/admin/infra/domains': 'Dominios',
  '/admin/infra/credentials': 'Credenciales',
  '/admin/infra/hosting-wizard': 'Hosting',
  '/admin/finances/billing': 'Cobranzas',
  '/admin/finances/expenses': 'Gastos',
  '/admin/finances/reports': 'Reportes',
  '/admin/team': 'Equipo',
  '/admin/wiki': 'Wiki',
  '/admin/settings': 'Configuración',
  '/admin/audit': 'Auditoría',
  '/admin/profile': 'Perfil',
};

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

/** Actualiza título y favicon de la pestaña según empresa + ruta. */
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

    document.title = label ? `${label} · ${brand}` : brand;
  }, [settings.commercialName, settings.legalName, location.pathname]);

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
