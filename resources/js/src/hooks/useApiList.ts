import { useCallback, useEffect, useState } from 'react';
import { apiGet, getCached } from '../lib/api';

/**
 * Lista API hidratada desde caché: al volver a un menú los datos aparecen al instante
 * y se revalidan en segundo plano.
 */
export function useApiList<T>(url: string, fallback: T[] = []): {
  data: T[];
  setData: React.Dispatch<React.SetStateAction<T[]>>;
  loading: boolean;
  reload: (fresh?: boolean) => Promise<void>;
} {
  const [data, setData] = useState<T[]>(() => getCached<T[]>(url) ?? fallback);
  const [loading, setLoading] = useState(() => getCached<T[]>(url) === undefined);

  const reload = useCallback(async (fresh = false) => {
    const hadCache = getCached<T[]>(url) !== undefined;
    if (!hadCache) setLoading(true);
    try {
      const next = await apiGet<T[]>(url, { fresh });
      setData(Array.isArray(next) ? next : fallback);
    } catch {
      if (!hadCache) setData(fallback);
    } finally {
      setLoading(false);
    }
  }, [url, fallback]);

  useEffect(() => {
    void reload(false);
  }, [reload]);

  return { data, setData, loading, reload };
}
