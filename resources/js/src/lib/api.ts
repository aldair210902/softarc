import axios from 'axios';

const baseURL = window.__APP_BASE__ || '';

export const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
});

let csrfReady: Promise<void> | null = null;

export async function ensureCsrf(): Promise<void> {
  if (!csrfReady) {
    csrfReady = api
      .get('/sanctum/csrf-cookie', {
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
        },
      })
      .then(() => undefined)
      .catch((error) => {
        csrfReady = null;
        throw error;
      });
  }
  return csrfReady;
}

type CacheEntry = {
  at: number;
  data?: unknown;
  promise?: Promise<unknown>;
};

const getCache = new Map<string, CacheEntry>();
/** Datos “frescos” durante este TTL; luego se revalidan en segundo plano. */
const GET_TTL_MS = 180_000;
const PERSIST_TTL_MS = 15 * 60_000;
const STORAGE_KEY = 'softarc_api_cache_v1';

function cacheKey(url: string): string {
  return url;
}

function shouldPersist(url: string): boolean {
  if (url.includes('/reveal')) return false;
  if (url.includes('/login') || url.includes('/logout') || url.includes('/user')) return false;
  // Auditoría es volátil y con query params; no conviene persistirla.
  if (url.includes('/audit-logs')) return false;
  // Catálogo público de planes: no persistir (si no, la web queda con lista vacía tras activar “Visible”).
  if (url === '/api/reseller-plans' || url.endsWith('/api/reseller-plans')) return false;
  return url.startsWith('/api/');
}

function shouldCacheGet(url: string): boolean {
  // Nunca cachear identidad/sesión: si no, un /api/user viejo “deja entrar” sin login.
  if (url.includes('/login') || url.includes('/logout') || url.includes('/user')) return false;
  if (url.includes('/reveal')) return false;
  // Siempre fresco en la web pública de hosting.
  if (url === '/api/reseller-plans' || url.endsWith('/api/reseller-plans')) return false;
  return true;
}

let persistTimer: ReturnType<typeof setTimeout> | null = null;

function persistCacheSoon(): void {
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    try {
      const out: Record<string, { at: number; data: unknown }> = {};
      const now = Date.now();
      for (const [key, val] of getCache.entries()) {
        if (val.data === undefined || !shouldPersist(key)) continue;
        if (now - val.at > PERSIST_TTL_MS) continue;
        out[key] = { at: val.at, data: val.data };
      }
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(out));
    } catch {
      // quota / private mode
    }
  }, 250);
}

function hydrateFromSession(): void {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as Record<string, { at: number; data: unknown }>;
    const now = Date.now();
    for (const [key, val] of Object.entries(parsed)) {
      if (!val || val.data === undefined) continue;
      if (!shouldCacheGet(key) || !shouldPersist(key)) continue;
      if (now - val.at > PERSIST_TTL_MS) continue;
      getCache.set(key, { at: val.at, data: val.data });
    }
  } catch {
    // ignore
  }
}

hydrateFromSession();

export function invalidateApiCache(match?: string): void {
  if (!match) {
    getCache.clear();
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    return;
  }
  for (const key of [...getCache.keys()]) {
    if (key === match || key.startsWith(match) || key.includes(match)) {
      getCache.delete(key);
    }
  }
  persistCacheSoon();
}

/** Lectura síncrona del caché (para hidratar UI al instante). */
export function getCached<T>(url: string): T | undefined {
  const hit = getCache.get(cacheKey(url));
  if (hit && hit.data !== undefined) return hit.data as T;
  return undefined;
}

function storeCache(url: string, data: unknown): void {
  if (!shouldCacheGet(url)) {
    getCache.delete(cacheKey(url));
    return;
  }
  getCache.set(cacheKey(url), { at: Date.now(), data });
  if (shouldPersist(url)) persistCacheSoon();
}

function fetchAndStore<T>(url: string): Promise<T> {
  const key = cacheKey(url);
  const existing = getCache.get(key);
  if (existing?.promise) {
    return existing.promise as Promise<T>;
  }

  const promise = api
    .get<T>(url)
    .then(({ data }) => {
      storeCache(url, data);
      return data;
    })
    .catch((error) => {
      const status = error?.response?.status;
      // Si la sesión expiró / no hay auth, tirar cualquier dato viejo de inmediato.
      if (status === 401 || status === 403 || !shouldCacheGet(url)) {
        getCache.delete(key);
      } else {
        const hit = getCache.get(key);
        if (!hit || hit.data === undefined) {
          getCache.delete(key);
        } else {
          getCache.set(key, { at: hit.at, data: hit.data });
        }
      }
      throw error;
    });

  if (shouldCacheGet(url)) {
    getCache.set(key, { at: existing?.at ?? 0, data: existing?.data, promise });
  }
  return promise;
}

/**
 * GET con stale-while-revalidate:
 * - Si hay caché (aunque esté viejo), lo devuelve al instante y refresca en background.
 * - Si no hay caché, espera la red.
 */
export async function apiGet<T>(url: string, options?: { fresh?: boolean }): Promise<T> {
  const key = cacheKey(url);
  const now = Date.now();
  const hit = getCache.get(key);
  const allowCache = shouldCacheGet(url);

  if (allowCache && !options?.fresh && hit?.data !== undefined) {
    const isFresh = now - hit.at < GET_TTL_MS;
    if (!isFresh) {
      void fetchAndStore<T>(url).catch(() => undefined);
    }
    return hit.data as T;
  }

  if (allowCache && !options?.fresh && hit?.promise) {
    return hit.promise as Promise<T>;
  }

  // fresh: no reutilizar request en vuelo (evita datos viejos tras editar).
  if (options?.fresh && hit?.promise) {
    getCache.set(key, { at: hit.at, data: allowCache ? hit.data : undefined });
  }

  return fetchAndStore<T>(url);
}

/** Precarga en segundo plano (hover de menú / entrada al admin). */
export function prefetchApi(url: string): void {
  const hit = getCache.get(cacheKey(url));
  if (hit?.data !== undefined && Date.now() - hit.at < GET_TTL_MS) return;
  if (hit?.promise) return;
  void fetchAndStore(url).catch(() => undefined);
}

export function prefetchMany(urls: string[]): void {
  urls.forEach((url) => prefetchApi(url));
}

export async function apiMutate<T>(
  method: 'post' | 'put' | 'patch' | 'delete',
  url: string,
  body?: unknown,
): Promise<T> {
  await ensureCsrf();
  const { data } = await api.request<T>({ method, url, data: body });

  const path = url.split('?')[0];
  const segments = path.split('/').filter(Boolean);
  if (segments.length >= 2) {
    invalidateApiCache(`/${segments[0]}/${segments[1]}`);
  } else {
    invalidateApiCache(path);
  }
  if (path.includes('/reseller-plans')) {
    invalidateApiCache('/api/reseller-plans');
    invalidateApiCache('/api/reseller-plans/manage');
  }
  if (path.includes('/hosting-packages')) {
    invalidateApiCache('/api/servers');
    invalidateApiCache('/api/domains');
    invalidateApiCache('/api/credentials');
  }

  return data;
}

/** Descarga un PDF (u otro blob) autenticado con cookies de sesión. */
export async function apiDownload(url: string, filename?: string): Promise<void> {
  await ensureCsrf();
  const res = await api.get(url, { responseType: 'blob' });
  const blob = new Blob([res.data], { type: res.headers['content-type'] || 'application/pdf' });
  const href = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = href;
  a.download = filename || 'documento.pdf';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(href);
}

/** Subida multipart (imágenes). */
export async function apiUpload<T>(url: string, formData: FormData): Promise<T> {
  await ensureCsrf();
  const { data } = await api.post<T>(url, formData);
  invalidateApiCache('/api/media');
  invalidateApiCache('/api/catalog');
  return data;
}

/** Endpoints frecuentes del admin — precargar al entrar. */
export const ADMIN_PREFETCH_URLS = [
  '/api/dashboard',
  '/api/clients',
  '/api/subscriptions',
  '/api/servers',
  '/api/domains',
  '/api/credentials',
  '/api/providers',
  '/api/providers?activeOnly=1',
  '/api/reseller-plans/manage',
  '/api/client-services',
  '/api/catalog',
  '/api/catalog/manage',
  '/api/leads',
  '/api/tickets',
  '/api/projects',
  '/api/expenses',
  '/api/transactions',
  '/api/proformas',
  '/api/team',
];
