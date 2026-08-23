import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { canAccessRoute, ROUTE_PERMISSIONS } from '../lib/permissions';

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-sa-canvas flex items-center justify-center text-sa-muted text-sm">
        Verificando sesión...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!canAccessRoute(user, location.pathname)) {
    const fallback = Object.keys(ROUTE_PERMISSIONS).find((path) => canAccessRoute(user, path)) || '/admin/profile';
    return <Navigate to={fallback} replace />;
  }

  return <>{children}</>;
}
