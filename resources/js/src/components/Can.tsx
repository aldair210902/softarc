import React from 'react';
import { useAuth } from '../context/AuthContext';

/** Renderiza children solo si el usuario tiene el permiso indicado. */
export function Can({
  ability,
  anyOf,
  children,
  fallback = null,
}: {
  ability?: string;
  anyOf?: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { can, canAny } = useAuth();
  const allowed = ability ? can(ability) : anyOf ? canAny(anyOf) : false;
  return allowed ? <>{children}</> : <>{fallback}</>;
}
