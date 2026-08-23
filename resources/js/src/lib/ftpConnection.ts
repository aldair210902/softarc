/** Utilidades para mostrar y copiar datos FTP hacia FileZilla. */

export type FtpEncryption = 'plain' | 'explicit' | 'implicit' | string;

export function encryptionLabel(encryption?: string | null): string {
  switch (encryption) {
    case 'explicit':
      return 'FTP explícito sobre TLS (si está disponible)';
    case 'implicit':
      return 'FTP implícito sobre TLS';
    case 'plain':
    default:
      return 'Ninguno o inseguro (FTP plano)';
  }
}

export function buildFtpHosts(opts: {
  storedHost?: string | null;
  serverIp?: string | null;
  domainName?: string | null;
  ftpHosts?: string[] | null;
}): string[] {
  const hosts: string[] = [];
  const push = (value?: string | null) => {
    const v = (value || '').trim().replace(/:\d+\s*$/, '');
    if (v && !hosts.includes(v)) hosts.push(v);
  };

  // Preferir IP y ftp.dominio (como en FileZilla), luego host guardado.
  push(opts.serverIp);
  const domain = (opts.domainName || '').trim().replace(/^https?:\/\//i, '').split('/')[0];
  if (domain) {
    push(domain.startsWith('ftp.') ? domain : `ftp.${domain}`);
  }

  if (opts.ftpHosts && opts.ftpHosts.length > 0) {
    opts.ftpHosts.forEach((h) => push(h));
  } else {
    push(opts.storedHost);
  }

  return hosts;
}

export function formatFileZillaBlock(opts: {
  hosts: string[];
  port?: number | null;
  encryption?: string | null;
  username?: string | null;
  password?: string | null;
}): string {
  const hostLine = opts.hosts.length > 1
    ? `Host para FTP: ${opts.hosts.join(' o ')}`
    : `Host para FTP: ${opts.hosts[0] || '—'}`;
  const password = opts.password && opts.password.trim() !== ''
    ? opts.password
    : '(revela la contraseña para copiarla)';

  return [
    hostLine,
    `Puerto: ${opts.port || 21}`,
    `Cifrado: ${encryptionLabel(opts.encryption)}`,
    `Usuario: ${opts.username || '—'}`,
    `Password: ${password}`,
  ].join('\n');
}
