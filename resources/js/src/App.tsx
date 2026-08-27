/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './components/ui/Toast';
import { DocumentTitle } from './components/DocumentTitle';
import { ScrollToTop } from './components/ScrollToTop';
import RequireAuth from './components/RequireAuth';
import PublicLayout from './layouts/PublicLayout';
import AdminLayout from './layouts/AdminLayout';
import Home from './pages/public/Home';
import Login from './pages/public/Login';

const SaasSystems = lazy(() => import('./pages/public/services/SaasSystems'));
const CustomDevelopment = lazy(() => import('./pages/public/services/CustomDevelopment'));
const WebAndBlogs = lazy(() => import('./pages/public/services/WebAndBlogs'));
const InfrastructureAndSupport = lazy(() => import('./pages/public/services/InfrastructureAndSupport'));
const CatalogDemos = lazy(() => import('./pages/public/CatalogDemos'));

const Dashboard = lazy(() => import('./pages/admin/Dashboard'));
const CompanySettings = lazy(() => import('./pages/admin/CompanySettings'));
const CRM = lazy(() => import('./pages/admin/CRM'));
const Clients = lazy(() => import('./pages/admin/Clients'));
const Projects = lazy(() => import('./pages/admin/Projects'));
const Support = lazy(() => import('./pages/admin/Support'));
const Billing = lazy(() => import('./pages/admin/finances/Billing'));
const Proformas = lazy(() => import('./pages/admin/finances/Proformas'));
const Expenses = lazy(() => import('./pages/admin/finances/Expenses'));
const Reports = lazy(() => import('./pages/admin/finances/Reports'));
const Catalog = lazy(() => import('./pages/admin/infra/Catalog'));
const WebPages = lazy(() => import('./pages/admin/infra/WebPages'));
const ContactFormAdmin = lazy(() => import('./pages/admin/infra/ContactFormAdmin'));
const MediaLibrary = lazy(() => import('./pages/admin/infra/MediaLibrary'));
const Providers = lazy(() => import('./pages/admin/infra/Providers'));
const ResellerPlans = lazy(() => import('./pages/admin/infra/ResellerPlans'));
const Servers = lazy(() => import('./pages/admin/infra/Servers'));
const HostingWizard = lazy(() => import('./pages/admin/infra/HostingWizard'));
const Domains = lazy(() => import('./pages/admin/infra/Domains'));
const Credentials = lazy(() => import('./pages/admin/infra/Credentials'));
const Team = lazy(() => import('./pages/admin/Team'));
const Wiki = lazy(() => import('./pages/admin/Wiki'));
const Audit = lazy(() => import('./pages/admin/Audit'));
const Profile = lazy(() => import('./pages/admin/Profile'));

function RouteFallback() {
  return (
    <div className="flex items-center justify-center py-16 text-sm text-sa-faint">
      Cargando…
    </div>
  );
}

export default function App() {
  const basename = window.__APP_BASE__ || '';

  return (
    <ToastProvider>
      <BrowserRouter basename={basename}>
        <DocumentTitle />
        <ScrollToTop />
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<PublicLayout />}>
              <Route index element={<Home />} />
              <Route path="servicios/saas" element={<SaasSystems />} />
              <Route path="servicios/a-la-medida" element={<CustomDevelopment />} />
              <Route path="servicios/paginas-web-blogs" element={<WebAndBlogs />} />
              <Route path="servicios/infraestructura-soporte" element={<InfrastructureAndSupport />} />
              <Route path="catalogo" element={<CatalogDemos />} />
              <Route path="demos" element={<CatalogDemos />} />
            </Route>
            <Route path="/login" element={<Login />} />

            <Route path="/admin" element={<RequireAuth><AdminLayout /></RequireAuth>}>
              <Route index element={<Dashboard />} />
              <Route path="settings" element={<CompanySettings />} />
              <Route path="crm" element={<CRM />} />
              <Route path="clients" element={<Clients />} />
              <Route path="projects" element={<Projects />} />
              <Route path="infrastructure" element={<Navigate to="/admin/infra/servers" replace />} />
              <Route path="support" element={<Support />} />
              <Route path="finances/billing" element={<Billing />} />
              <Route path="finances/proformas" element={<Proformas />} />
              <Route path="finances/expenses" element={<Expenses />} />
              <Route path="finances/reports" element={<Reports />} />
              <Route path="infra/catalog" element={<Catalog />} />
              <Route path="infra/web-pages" element={<WebPages />} />
              <Route path="infra/contact-form" element={<ContactFormAdmin />} />
              <Route path="infra/media" element={<MediaLibrary />} />
              <Route path="infra/providers" element={<Providers />} />
              <Route path="infra/reseller-plans" element={<ResellerPlans />} />
              <Route path="infra/hosting-wizard" element={<HostingWizard />} />
              <Route path="infra/servers" element={<Servers />} />
              <Route path="infra/domains" element={<Domains />} />
              <Route path="infra/credentials" element={<Credentials />} />
              <Route path="team" element={<Team />} />
              <Route path="wiki" element={<Wiki />} />
              <Route path="profile" element={<Profile />} />
              <Route path="audit" element={<Audit />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ToastProvider>
  );
}
