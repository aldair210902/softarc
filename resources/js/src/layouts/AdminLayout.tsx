import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Target, Briefcase, FolderKanban, HardDrive, LifeBuoy, 
  ArrowLeft, Menu, X, Receipt, Banknote, LineChart, FileText,
  LayoutGrid, Globe, Key, Users, BookText, User, Settings, ClipboardList,
  LogOut, Wand2, Building2, Images, Tags, FilePen
} from 'lucide-react';
import { cn } from '../lib/utils';
import { AnimatePresence, motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { canAccessRoute } from '../lib/permissions';
import { prefetchRouteAssets, warmAdminShell } from '../lib/adminPrefetch';
import { useCompanySettings } from '../hooks/useCompanySettings';
import { resolveIsotipoUrl } from '../lib/brandAssets';
import { NotificationBell } from '../components/NotificationBell';
import { ThemeToggle } from '../components/ThemeToggle';
import { useTheme } from '../context/ThemeContext';

const PAGE_TITLES: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/crm': 'Prospectos',
  '/admin/clients': 'Clientes',
  '/admin/projects': 'Proyectos',
  '/admin/support': 'Tickets',
  '/admin/infra/catalog': 'Demos de sistemas',
  '/admin/infra/web-pages': 'Contenido web',
  '/admin/infra/contact-form': 'Formulario contacto',
  '/admin/infra/media': 'Imágenes',
  '/admin/infra/providers': 'Proveedores',
  '/admin/infra/reseller-plans': 'Planes de reventa',
  '/admin/infra/hosting-wizard': 'Alta de hosting',
  '/admin/infra/servers': 'Servidores',
  '/admin/infra/domains': 'Dominios',
  '/admin/infra/credentials': 'Bóveda',
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

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { settings } = useCompanySettings();
  const { resolved } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const desktopNavRef = useRef<HTMLElement | null>(null);
  const pageTitle = PAGE_TITLES[location.pathname] || 'Admin';
  const brand = settings.commercialName || 'SoftArc';
  const brandInitial = brand.trim().charAt(0).toUpperCase() || 'S';
  const brandMarkUrl = resolveIsotipoUrl(settings, resolved);

  useEffect(() => {
    const nav = desktopNavRef.current;
    if (!nav) return;
    const active = nav.querySelector<HTMLElement>('[data-active-nav="true"]');
    active?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [location.pathname]);

  useEffect(() => {
    // Inmediato: no esperar idle (F5 / primera visita)
    warmAdminShell();
  }, []);

  useEffect(() => {
    prefetchRouteAssets(location.pathname);
  }, [location.pathname]);

  const prefetchRoute = (path: string) => {
    prefetchRouteAssets(path);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const initials = (user?.name || 'SA')
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  
  const navGroups = [
    {
      title: 'Inicio',
      items: [
        { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
      ],
    },
    {
      title: 'Comercial',
      items: [
        { name: 'Prospectos', path: '/admin/crm', icon: Target },
        { name: 'Clientes', path: '/admin/clients', icon: Briefcase },
        { name: 'Proyectos', path: '/admin/projects', icon: FolderKanban },
      ],
    },
    {
      title: 'Sitio web',
      items: [
        { name: 'Demos de sistemas', path: '/admin/infra/catalog', icon: LayoutGrid },
        { name: 'Contenido web', path: '/admin/infra/web-pages', icon: FilePen },
        { name: 'Formulario contacto', path: '/admin/infra/contact-form', icon: ClipboardList },
        { name: 'Imágenes', path: '/admin/infra/media', icon: Images },
      ],
    },
    {
      title: 'Finanzas',
      items: [
        { name: 'Cobranzas', path: '/admin/finances/billing', icon: Receipt },
        { name: 'Proformas', path: '/admin/finances/proformas', icon: FileText },
        { name: 'Gastos', path: '/admin/finances/expenses', icon: Banknote },
        { name: 'Reportes', path: '/admin/finances/reports', icon: LineChart },
      ],
    },
    {
      title: 'Infraestructura',
      items: [
        { name: 'Planes de reventa', path: '/admin/infra/reseller-plans', icon: Tags },
        { name: 'Proveedores', path: '/admin/infra/providers', icon: Building2 },
        { name: 'Alta de hosting', path: '/admin/infra/hosting-wizard', icon: Wand2 },
        { name: 'Servidores', path: '/admin/infra/servers', icon: HardDrive },
        { name: 'Dominios', path: '/admin/infra/domains', icon: Globe },
        { name: 'Bóveda', path: '/admin/infra/credentials', icon: Key },
      ],
    },
    {
      title: 'Soporte',
      items: [
        { name: 'Tickets', path: '/admin/support', icon: LifeBuoy },
        { name: 'Wiki', path: '/admin/wiki', icon: BookText },
      ],
    },
    {
      title: 'Sistema',
      items: [
        { name: 'Equipo', path: '/admin/team', icon: Users },
        { name: 'Ajustes', path: '/admin/settings', icon: Settings },
        { name: 'Auditoría', path: '/admin/audit', icon: ClipboardList },
        { name: 'Mi perfil', path: '/admin/profile', icon: User },
      ],
    },
  ].map((group) => ({
    ...group,
    items: group.items.filter((item) => canAccessRoute(user, item.path)),
  })).filter((group) => group.items.length > 0);

  const renderNavGroups = () => (
    <div className="space-y-5 pb-6">
      {navGroups.map((group) => (
        <div key={group.title}>
          <h3 className="px-3 mb-2 text-[10px] font-bold text-sa-faint tracking-[0.14em] uppercase">
            {group.title}
          </h3>
          <div className="space-y-0.5">
            {group.items.map((item) => {
              const isActive = location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path));
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  data-active-nav={isActive ? 'true' : undefined}
                  onClick={() => setIsMobileMenuOpen(false)}
                  onMouseEnter={() => prefetchRoute(item.path)}
                  onFocus={() => prefetchRoute(item.path)}
                  onMouseDown={() => prefetchRoute(item.path)}
                  onTouchStart={() => prefetchRoute(item.path)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-blue-600/15 text-blue-700 dark:text-blue-400'
                      : 'text-sa-muted hover:bg-sa-border hover:text-sa-text',
                  )}
                >
                  <item.icon className={cn('h-4.5 w-4.5 shrink-0', isActive ? 'text-blue-700 dark:text-blue-400' : 'text-sa-faint')} style={{ width: 18, height: 18 }} />
                  <span className="truncate">{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="fixed inset-0 flex bg-sa-canvas font-sans text-sa-text overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
              className="fixed inset-y-0 left-0 w-64 bg-sa-panel border-r border-sa-border flex flex-col z-50 md:hidden"
            >
              <div className="h-16 flex items-center justify-between px-6 border-b border-sa-border">
                <div className="flex items-center gap-3 min-w-0">
                  {brandMarkUrl ? (
                    <img key={resolved} src={brandMarkUrl} alt={brand} className="w-8 h-8 object-contain shrink-0" />
                  ) : (
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-sa-text">S</div>
                  )}
                  <span className="font-semibold text-lg tracking-tight text-sa-text truncate">{brand}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-sa-faint hover:text-sa-text hover:bg-sa-hover"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <nav className="flex-1 overflow-y-auto py-4 px-3">
                {renderNavGroups()}
              </nav>
              <div className="p-4 border-t border-sa-border bg-sa-panel-2">
                <Link to="/" className="flex items-center gap-2 text-sm text-sa-muted hover:text-sa-text transition-colors">
                  <ArrowLeft className="h-4 w-4" />
                  Volver al Portal
                </Link>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <aside className="w-64 h-full shrink-0 bg-sa-panel border-r border-sa-border flex-col hidden md:flex z-30">
        <div className="h-16 flex items-center px-6 border-b border-sa-border gap-3 shrink-0 min-w-0">
          {brandMarkUrl ? (
            <img key={resolved} src={brandMarkUrl} alt={brand} className="w-10 h-10 object-contain shrink-0 bg-transparent" />
          ) : (
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-sa-text shrink-0">{brandInitial}</div>
          )}
          <span className="font-bold text-base sm:text-lg tracking-tight text-sa-text truncate">{brand}</span>
        </div>
        <nav ref={desktopNavRef} className="flex-1 min-h-0 overflow-y-auto py-4 px-3 custom-scrollbar">
          {renderNavGroups()}
        </nav>
        <div className="p-4 border-t border-sa-border bg-sa-panel-2 shrink-0">
          <Link to="/" className="flex items-center gap-2 text-sm text-sa-muted hover:text-sa-text transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Volver al Portal Web
          </Link>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 min-h-0 h-full overflow-hidden">
        <header className="h-16 bg-sa-panel border-b border-sa-border flex items-center justify-between px-4 md:px-6 z-30 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 text-sa-muted hover:text-sa-text bg-sa-border hover:bg-sa-border-strong rounded-lg transition-colors md:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-sa-faint uppercase tracking-wider truncate">{brand}</p>
              <h2 className="text-sm md:text-base font-extrabold text-sa-text truncate">{pageTitle}</h2>
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-4">
            <ThemeToggle compact />
            <NotificationBell />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-blue-500/20">
                {initials}
              </div>
              <div className="hidden sm:block">
                <div className="text-sm font-extrabold text-sa-text leading-none mb-1">{user?.name || 'Admin'}</div>
                <div className="text-[10px] text-sa-faint leading-none uppercase tracking-widest font-medium">{user?.role || 'Usuario'}</div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                title="Cerrar sesión"
                className="p-2 text-sa-muted hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4 md:p-6 pb-20 md:pb-6 relative custom-scrollbar">
          <Outlet />
        </main>

        <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-sa-border bg-sa-panel/95 backdrop-blur-md safe-area-pb">
          <div className="grid grid-cols-4 gap-0.5 px-1 py-1.5">
            {[
              { name: 'Inicio', path: '/admin', icon: LayoutDashboard },
              { name: 'Clientes', path: '/admin/clients', icon: Briefcase },
              { name: 'Tickets', path: '/admin/support', icon: LifeBuoy },
              { name: 'Dominios', path: '/admin/infra/domains', icon: Globe },
            ]
              .filter((item) => canAccessRoute(user, item.path))
              .map((item) => {
                const isActive = location.pathname === item.path
                  || (item.path !== '/admin' && location.pathname.startsWith(item.path));
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    onMouseEnter={() => prefetchRoute(item.path)}
                    onTouchStart={() => prefetchRoute(item.path)}
                    className={cn(
                      'flex flex-col items-center justify-center gap-0.5 py-2 px-1 rounded-xl text-[10px] font-bold transition-colors',
                      isActive ? 'text-blue-700 dark:text-blue-400 bg-blue-600/15' : 'text-sa-faint hover:text-sa-text',
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="truncate max-w-full">{item.name}</span>
                  </Link>
                );
              })}
          </div>
        </nav>
      </div>
    </div>
  );
}
