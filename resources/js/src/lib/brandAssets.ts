import { CompanySettings } from '../types';

export type BrandTheme = 'light' | 'dark';
export type BrandKind = 'isotipo' | 'logotipo' | 'imagotipo' | 'isologo';

const BRAND_KEYS: Record<BrandKind, { light: keyof CompanySettings; dark: keyof CompanySettings; legacy: keyof CompanySettings }> = {
  isotipo: { light: 'isotipoLightUrl', dark: 'isotipoDarkUrl', legacy: 'isotipoUrl' },
  logotipo: { light: 'logotipoLightUrl', dark: 'logotipoDarkUrl', legacy: 'logotipoUrl' },
  imagotipo: { light: 'imagotipoLightUrl', dark: 'imagotipoDarkUrl', legacy: 'imagotipoUrl' },
  isologo: { light: 'isologoLightUrl', dark: 'isologoDarkUrl', legacy: 'isologoUrl' },
};

/** Convierte URLs absolutas de storage a ruta relativa con el base path de la app. */
export function normalizeBrandSrc(url: string): string {
  const raw = String(url || '').trim();
  if (!raw) return '';

  const storageMatch = raw.match(/\/storage\/(.+?)(?:\?.*)?$/i);
  if (storageMatch) {
    const base = typeof window !== 'undefined' ? (window.__APP_BASE__ || '') : '';
    return `${base}/storage/${storageMatch[1]}`;
  }

  if (raw.startsWith('/') || raw.startsWith('data:') || /^https?:\/\//i.test(raw)) {
    return raw;
  }

  const base = typeof window !== 'undefined' ? (window.__APP_BASE__ || '') : '';
  return `${base}/${raw.replace(/^\.\//, '')}`;
}

/** URL de una variante según fondo (claro u oscuro), con respaldo legacy. */
export function resolveBrandUrl(
  s: CompanySettings,
  kind: BrandKind,
  theme: BrandTheme,
): string {
  const keys = BRAND_KEYS[kind];
  const light = String(s[keys.light] ?? '').trim();
  const dark = String(s[keys.dark] ?? '').trim();
  const legacy = String(s[keys.legacy] ?? '').trim();

  const picked = theme === 'dark' ? dark || legacy || light : light || legacy || dark;
  return normalizeBrandSrc(picked);
}

/**
 * Favicon = solo isotipo (nunca isologo / logoUrl antiguo).
 * Claro para pestañas claras; oscuro si el sistema prefiere dark.
 */
export function resolveFaviconUrls(s: CompanySettings): { light: string; dark: string } {
  return {
    light: resolveBrandUrl(s, 'isotipo', 'light'),
    dark: resolveBrandUrl(s, 'isotipo', 'dark'),
  };
}

/** @deprecated Preferir resolveFaviconUrls. */
export function resolveFaviconUrl(s: CompanySettings): string {
  const { light, dark } = resolveFaviconUrls(s);
  return light || dark;
}

/** Símbolo compacto (sidebar admin). */
export function resolveIsotipoUrl(s: CompanySettings, theme: BrandTheme = 'dark'): string {
  return resolveBrandUrl(s, 'isotipo', theme);
}

export type HeaderBrand =
  | { mode: 'lockup'; src: string }
  | { mode: 'mark-word'; mark: string; word?: string }
  | { mode: 'word'; src: string }
  | { mode: 'text'; label: string };

function resolveBrandFallback(
  s: CompanySettings,
  theme: BrandTheme,
  primary: 'imagotipo' | 'isologo',
): HeaderBrand {
  const order: BrandKind[] =
    primary === 'imagotipo'
      ? ['imagotipo', 'isologo', 'isotipo', 'logotipo']
      : ['isologo', 'imagotipo', 'isotipo', 'logotipo'];

  const urls = {
    imagotipo: resolveBrandUrl(s, 'imagotipo', theme),
    isologo: resolveBrandUrl(s, 'isologo', theme),
    isotipo: resolveBrandUrl(s, 'isotipo', theme),
    logotipo: resolveBrandUrl(s, 'logotipo', theme),
  };
  const legacy = normalizeBrandSrc(s.logoUrl || '');
  const label = (s.commercialName || 'SoftArc').trim();

  for (const kind of order) {
    if (kind === 'isotipo') {
      if (urls.isotipo && urls.logotipo) {
        return { mode: 'mark-word', mark: urls.isotipo, word: urls.logotipo };
      }
      if (urls.isotipo) return { mode: 'mark-word', mark: urls.isotipo };
      continue;
    }
    if (kind === 'logotipo') {
      if (urls.logotipo) return { mode: 'word', src: urls.logotipo };
      continue;
    }
    if (urls[kind]) return { mode: 'lockup', src: urls[kind] };
  }

  if (legacy) return { mode: 'lockup', src: legacy };
  return { mode: 'text', label };
}

/**
 * Cabecera pública: prioriza imagotipo.
 */
export function resolveHeaderBrand(
  s: CompanySettings,
  theme: BrandTheme = 'dark',
): HeaderBrand {
  return resolveBrandFallback(s, theme, 'imagotipo');
}

/**
 * Footer público: prioriza isologo (lockup completo).
 */
export function resolveFooterBrand(
  s: CompanySettings,
  theme: BrandTheme = 'dark',
): HeaderBrand {
  return resolveBrandFallback(s, theme, 'isologo');
}
