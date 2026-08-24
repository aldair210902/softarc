/**
 * Prefetch de chunks JS + APIs por ruta del admin.
 * Al pasar el mouse / al entrar al panel, la primera visita no espera el JS.
 */

import { prefetchApi, prefetchMany, ADMIN_PREFETCH_URLS } from './api';

export const ROUTE_API_PREFETCH: Record<string, string[]> = {
  '/admin': ['/api/dashboard'],
  '/admin/crm': ['/api/leads'],
  '/admin/clients': ['/api/clients', '/api/subscriptions'],
  '/admin/projects': ['/api/projects', '/api/clients'],
  '/admin/finances/billing': ['/api/transactions', '/api/clients'],
  '/admin/finances/expenses': ['/api/expenses'],
  '/admin/finances/reports': ['/api/transactions', '/api/expenses', '/api/subscriptions', '/api/clients'],
  '/admin/infra/catalog': ['/api/catalog/manage'],
  '/admin/infra/web-pages': ['/api/web-pages'],
  '/admin/infra/media': ['/api/media'],
  '/admin/infra/providers': ['/api/providers'],
  '/admin/infra/reseller-plans': ['/api/reseller-plans/manage', '/api/client-services', '/api/providers?activeOnly=1', '/api/clients'],
  '/admin/infra/hosting-wizard': ['/api/clients', '/api/providers?activeOnly=1'],
  '/admin/infra/servers': ['/api/servers'],
  '/admin/infra/domains': ['/api/domains', '/api/clients', '/api/servers'],
  '/admin/infra/credentials': ['/api/credentials'],
  '/admin/support': ['/api/tickets', '/api/clients', '/api/catalog'],
  '/admin/team': ['/api/team'],
  '/admin/wiki': ['/api/wiki/categories'],
  '/admin/audit': [],
  '/admin/profile': ['/api/profile'],
  '/admin/settings': ['/api/company-settings'],
};

const ROUTE_CHUNK_LOADERS: Record<string, () => Promise<unknown>> = {
  '/admin': () => import('../pages/admin/Dashboard'),
  '/admin/crm': () => import('../pages/admin/CRM'),
  '/admin/clients': () => import('../pages/admin/Clients'),
  '/admin/projects': () => import('../pages/admin/Projects'),
  '/admin/finances/billing': () => import('../pages/admin/finances/Billing'),
  '/admin/finances/expenses': () => import('../pages/admin/finances/Expenses'),
  '/admin/finances/reports': () => import('../pages/admin/finances/Reports'),
  '/admin/infra/catalog': () => import('../pages/admin/infra/Catalog'),
  '/admin/infra/web-pages': () => import('../pages/admin/infra/WebPages'),
  '/admin/infra/media': () => import('../pages/admin/infra/MediaLibrary'),
  '/admin/infra/providers': () => import('../pages/admin/infra/Providers'),
  '/admin/infra/reseller-plans': () => import('../pages/admin/infra/ResellerPlans'),
  '/admin/infra/hosting-wizard': () => import('../pages/admin/infra/HostingWizard'),
  '/admin/infra/servers': () => import('../pages/admin/infra/Servers'),
  '/admin/infra/domains': () => import('../pages/admin/infra/Domains'),
  '/admin/infra/credentials': () => import('../pages/admin/infra/Credentials'),
  '/admin/support': () => import('../pages/admin/Support'),
  '/admin/team': () => import('../pages/admin/Team'),
  '/admin/wiki': () => import('../pages/admin/Wiki'),
  '/admin/audit': () => import('../pages/admin/Audit'),
  '/admin/profile': () => import('../pages/admin/Profile'),
  '/admin/settings': () => import('../pages/admin/CompanySettings'),
};

const warmedChunks = new Set<string>();

export function prefetchRouteAssets(path: string): void {
  (ROUTE_API_PREFETCH[path] || []).forEach((url) => prefetchApi(url));
  if (warmedChunks.has(path)) return;
  const loader = ROUTE_CHUNK_LOADERS[path];
  if (!loader) return;
  warmedChunks.add(path);
  void loader().catch(() => {
    warmedChunks.delete(path);
  });
}

/** Al entrar al admin: APIs + chunks de menús frecuentes de inmediato. */
export function warmAdminShell(): void {
  prefetchMany(ADMIN_PREFETCH_URLS);
  [
    '/admin',
    '/admin/clients',
    '/admin/crm',
    '/admin/infra/servers',
    '/admin/infra/domains',
    '/admin/infra/credentials',
    '/admin/support',
    '/admin/finances/billing',
  ].forEach((path) => prefetchRouteAssets(path));
}
