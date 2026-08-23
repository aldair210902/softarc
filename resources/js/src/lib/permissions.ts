export type AuthUserLike = {
  role?: string;
  permissions?: string[];
};

/** Mapea rutas del admin a permisos aceptados (cualquiera basta). */
export const ROUTE_PERMISSIONS: Record<string, string[]> = {
  '/admin': ['dashboard.view'],
  '/admin/crm': ['crm.manage', 'crm.view'],
  '/admin/clients': ['clients.manage', 'clients.view'],
  '/admin/projects': ['projects.manage', 'projects.view'],
  '/admin/finances/billing': ['finances.manage', 'finances.view'],
  '/admin/finances/expenses': ['finances.manage', 'finances.view'],
  '/admin/finances/reports': ['finances.manage', 'finances.view'],
  '/admin/infra/catalog': ['catalog.manage', 'catalog.view'],
  '/admin/infra/media': ['catalog.manage', 'catalog.view', 'settings.manage'],
  '/admin/infra/providers': ['servers.manage', 'servers.view', 'domains.manage', 'domains.view'],
  '/admin/infra/hosting-wizard': ['servers.manage', 'domains.manage', 'credentials.manage'],
  '/admin/infra/servers': ['servers.manage', 'servers.view'],
  '/admin/infra/domains': ['domains.manage', 'domains.view'],
  '/admin/infra/credentials': ['credentials.manage', 'credentials.view', 'credentials.reveal'],
  '/admin/infrastructure': ['servers.view', 'servers.manage', 'domains.view', 'domains.manage', 'credentials.view', 'credentials.manage', 'credentials.reveal'],
  '/admin/support': ['tickets.manage', 'tickets.view'],
  '/admin/team': ['team.manage'],
  '/admin/wiki': ['wiki.manage', 'wiki.view'],
  '/admin/profile': ['profile.manage'],
  '/admin/settings': ['settings.manage'],
  '/admin/audit': ['audit.view'],
};

export function canAccess(user: AuthUserLike | null | undefined, ability: string): boolean {
  if (!user) return false;
  const perms = user.permissions || [];
  if (perms.includes('*') || perms.includes('all')) return true;
  if (perms.includes(ability)) return true;

  const [module, action] = ability.split('.');
  if (action === 'view' && perms.includes(`${module}.manage`)) return true;

  return false;
}

export function canAccessAny(user: AuthUserLike | null | undefined, abilities: string[]): boolean {
  return abilities.some((a) => canAccess(user, a));
}

export function canAccessRoute(user: AuthUserLike | null | undefined, path: string): boolean {
  const required = ROUTE_PERMISSIONS[path];
  if (!required) return true;
  return canAccessAny(user, required);
}
