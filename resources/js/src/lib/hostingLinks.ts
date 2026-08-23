/** Construye URLs típicas de cPanel / Webmail a partir de panel, dominio o IP. */

function stripProtocol(host: string): string {
  return host.replace(/^https?:\/\//i, '').replace(/\/$/, '');
}

export function normalizeHttpUrl(url?: string | null): string {
  const value = (url || '').trim();
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  return `http://${value}`;
}

export function resolveCpanelUrl(opts: {
  panelUrl?: string | null;
  domainName?: string | null;
  ip?: string | null;
}): string {
  if (opts.panelUrl?.trim()) return normalizeHttpUrl(opts.panelUrl);
  if (opts.domainName?.trim()) return `http://${stripProtocol(opts.domainName)}/cpanel`;
  if (opts.ip?.trim()) return `http://${opts.ip.trim()}/cpanel`;
  return '';
}

export function resolveWebmailUrl(opts: {
  webmailUrl?: string | null;
  panelUrl?: string | null;
  domainName?: string | null;
  ip?: string | null;
}): string {
  if (opts.webmailUrl?.trim()) return normalizeHttpUrl(opts.webmailUrl);

  if (opts.panelUrl?.trim()) {
    const panel = normalizeHttpUrl(opts.panelUrl);
    if (/cpanel/i.test(panel)) return panel.replace(/cpanel/gi, 'webmail');
  }

  if (opts.domainName?.trim()) return `http://${stripProtocol(opts.domainName)}/webmail`;
  if (opts.ip?.trim()) return `http://${opts.ip.trim()}/webmail`;
  return '';
}

export function resolveSiteUrl(domainName?: string | null): string {
  if (!domainName?.trim()) return '';
  return `https://${stripProtocol(domainName)}`;
}
