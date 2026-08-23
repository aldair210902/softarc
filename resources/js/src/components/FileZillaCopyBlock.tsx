import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { buildFtpHosts } from '../lib/ftpConnection';

type Props = {
  name?: string;
  storedHost?: string | null;
  serverIp?: string | null;
  domainName?: string | null;
  ftpHosts?: string[] | null;
  port?: number | null;
  encryption?: string | null;
  username?: string | null;
  password?: string | null;
  passwordMasked?: string | null;
  onNeedPassword?: () => Promise<string | null | void> | string | null | void;
};

function looksLikeIp(value: string): boolean {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(value.trim());
}

function hostLabel(host: string, index: number): string {
  if (looksLikeIp(host)) return 'Host para FTP (IP)';
  if (host.toLowerCase().startsWith('ftp.')) return 'Host para FTP (ftp.dominio)';
  return index === 0 ? 'Host para FTP' : 'Host para FTP (alternativo)';
}

export function FileZillaCopyBlock({
  storedHost,
  serverIp,
  domainName,
  ftpHosts,
  port,
  username,
  password,
  passwordMasked,
  onNeedPassword,
}: Props) {
  const hosts = buildFtpHosts({ storedHost, serverIp, domainName, ftpHosts });
  const displayPassword = password || passwordMasked || '••••••••';
  const portValue = String(port || 21);

  return (
    <div className="mt-2.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 space-y-2">
      <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400/90">
        Datos FileZilla
      </p>

      <div className="space-y-1.5">
        {hosts.length === 0 ? (
          <CopyRow label="Host para FTP" value="—" copyValue="" />
        ) : (
          hosts.map((host, index) => (
            <CopyRow
              key={`${host}-${index}`}
              label={hostLabel(host, index)}
              value={host}
              copyValue={host}
            />
          ))
        )}
        <CopyRow label="Puerto" value={portValue} copyValue={portValue} />
        <CopyRow label="Usuario" value={username || '—'} copyValue={username || ''} />
        <CopyRow
          label="Password"
          value={displayPassword}
          copyValue={password || ''}
          onBeforeCopy={async () => {
            if (password) return password;
            if (!onNeedPassword) return null;
            const got = await onNeedPassword();
            return typeof got === 'string' ? got : null;
          }}
        />
      </div>
    </div>
  );
}

function CopyRow({
  label,
  value,
  copyValue,
  onBeforeCopy,
}: {
  label: string;
  value: string;
  copyValue: string;
  onBeforeCopy?: () => Promise<string | null | void> | string | null | void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    let text = copyValue;
    if (onBeforeCopy) {
      const got = await onBeforeCopy();
      if (typeof got === 'string' && got !== '') text = got;
    }
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // silencioso
    }
  };

  return (
    <div className="flex items-center justify-between gap-2 rounded-lg bg-sa-canvas/50 border border-sa-border/80 px-2.5 py-1.5">
      <div className="min-w-0 flex-1">
        <p className="text-[9px] font-bold uppercase tracking-wider text-sa-faint">{label}</p>
        <p className="text-[12px] font-mono text-sa-text break-all leading-snug mt-0.5">{value}</p>
      </div>
      <button
        type="button"
        onClick={() => void handleCopy()}
        disabled={!copyValue && !onBeforeCopy} title={`Copiar ${label}`}
      >
        {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
        {copied ? 'Copiado' : 'Copiar'}
      </button>
    </div>
  );
}
