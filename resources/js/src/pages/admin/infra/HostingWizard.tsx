import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { HardDrive, Globe, Key, Briefcase, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react';
import { Can } from '../../../components/Can';
import { HostingProcessNav } from '../../../components/HostingProcessNav';
import { Field, inputClass } from '../../../components/ui/FormModal';
import { ProviderSelect } from '../../../components/ProviderSelect';
import { apiGet, apiMutate } from '../../../lib/api';
import { cn } from '../../../lib/utils';
import { Client } from '../../../types';

type Step = 1 | 2 | 3 | 4;

const emptyForm = {
  clientId: '',
  serverName: '',
  serverIp: '',
  provider: '',
  plan: '',
  panelUrl: '',
  webmailUrl: '',
  category: 'Servidores cPanel',
  location: '',
  domainName: '',
  expiryDate: new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
  autoRenew: true,
  dnsZone: '',
  nameserver1: '',
  nameserver1Ip: '',
  nameserver2: '',
  nameserver2Ip: '',
  cpanelUsername: '',
  cpanelPassword: '',
  ftpHost: '',
  ftpUsername: '',
  ftpPassword: '',
  webmailUsername: '',
  webmailPassword: '',
};

export default function HostingWizard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState<Step>(1);
  const [clients, setClients] = useState<Client[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const preselected = searchParams.get('clientId') || '';
    apiGet<Client[]>('/api/clients')
      .then((list) => {
        setClients(list);
        if (preselected && list.some((c) => c.id === preselected)) {
          setForm((f) => ({ ...f, clientId: preselected }));
        }
      })
      .catch(() => setClients([]));
  }, [searchParams]);

  const set = (patch: Partial<typeof emptyForm>) => setForm((f) => ({ ...f, ...patch }));

  const suggestServerName = () => {
    const plan = form.plan.trim() || 'Hosting';
    const provider = form.provider.trim() || 'Proveedor';
    const ip = form.serverIp.trim();
    return ip ? `${provider} · ${plan} · ${ip}` : `${provider} · ${plan}`;
  };

  const validateStep = (s: Step): string => {
    if (s === 2) {
      if (!form.serverName.trim()) return 'Indica un nombre de servidor (cuenta/plan/IP).';
    }
    if (s === 3) {
      if (!form.domainName.trim()) return 'Indica el dominio (ej: ejemplo.com).';
    }
    return '';
  };

  const goNext = () => {
    const msg = validateStep(step);
    if (msg) {
      setError(msg);
      return;
    }
    setError('');
    if (step === 2 && !form.serverName.trim()) {
      set({ serverName: suggestServerName() });
    }
    if (step === 2 && form.domainName && !form.panelUrl) {
      set({ panelUrl: `http://${form.domainName.replace(/^https?:\/\//, '').replace(/\/$/, '')}/cpanel` });
    }
    if (step === 2 && form.domainName && !form.webmailUrl) {
      set({ webmailUrl: `http://${form.domainName.replace(/^https?:\/\//, '').replace(/\/$/, '')}/webmail` });
    }
    if (step === 3 && form.domainName && !form.panelUrl) {
      set({ panelUrl: `http://${form.domainName.replace(/^https?:\/\//, '').replace(/\/$/, '')}/cpanel` });
    }
    if (step === 3 && form.domainName && !form.webmailUrl) {
      set({ webmailUrl: `http://${form.domainName.replace(/^https?:\/\//, '').replace(/\/$/, '')}/webmail` });
    }
    if (step === 3 && form.domainName && !form.ftpHost) {
      set({ ftpHost: `ftp.${form.domainName.replace(/^https?:\/\//, '').split('/')[0]}:21` });
    }
    setStep((s) => Math.min(4, (s + 1)) as Step);
  };

  const goBack = () => {
    setError('');
    setStep((s) => Math.max(1, (s - 1)) as Step);
  };

  const submit = async () => {
    const msg = validateStep(3) || validateStep(2);
    if (msg) {
      setError(msg);
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const payload = {
        clientId: form.clientId || null,
        serverName: form.serverName.trim() || suggestServerName(),
        serverIp: form.serverIp || null,
        provider: form.provider || null,
        plan: form.plan || null,
        panelUrl: form.panelUrl || null,
        webmailUrl: form.webmailUrl || null,
        category: form.category || 'Servidores cPanel',
        location: form.location || null,
        domainName: form.domainName.trim(),
        expiryDate: form.expiryDate || null,
        autoRenew: form.autoRenew,
        dnsZone: form.dnsZone || null,
        nameserver1: form.nameserver1 || null,
        nameserver1Ip: form.nameserver1Ip || null,
        nameserver2: form.nameserver2 || null,
        nameserver2Ip: form.nameserver2Ip || null,
        cpanelUsername: form.cpanelUsername || null,
        cpanelPassword: form.cpanelPassword || null,
        ftpHost: form.ftpHost || null,
        ftpUsername: form.ftpUsername || null,
        ftpPassword: form.ftpPassword || null,
        webmailUsername: form.webmailUsername || null,
        webmailPassword: form.webmailPassword || null,
      };
      await apiMutate('post', '/api/hosting-packages', payload);
      navigate('/admin/infra/domains');
    } catch (e: any) {
      const apiMsg = e?.response?.data?.message || e?.response?.data?.errors
        ? 'Revisa los datos: faltan campos o hay un error de validación.'
        : 'No se pudo registrar el hosting.';
      setError(apiMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const steps = [
    { id: 1 as Step, label: 'Cliente', icon: Briefcase },
    { id: 2 as Step, label: 'Servidor', icon: HardDrive },
    { id: 3 as Step, label: 'Dominio', icon: Globe },
    { id: 4 as Step, label: 'Bóveda', icon: Key },
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-sa-text tracking-tight">Alta de hosting</h1>
        <p className="text-sm text-sa-faint mt-1">
          Un solo flujo crea el servidor, el dominio (vinculado) y las credenciales cPanel/FTP.
        </p>
      </div>

      <HostingProcessNav current="servers" />

      <div className="flex flex-wrap gap-2">
        {steps.map((s) => {
          const Icon = s.icon;
          const active = step === s.id;
          const done = step > s.id;
          return (
            <div
              key={s.id}
              className={cn(
                'inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold',
                active && 'bg-blue-500/10 border-blue-500/30 text-blue-300',
                done && 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300',
                !active && !done && 'bg-sa-panel border-sa-border text-sa-faint',
              )}>
              {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
              {s.id}. {s.label}
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-sa-border bg-sa-panel p-5 md:p-6 space-y-4">
        {step === 1 && (
          <>
            <h2 className="text-lg font-bold text-sa-text">1. Cliente (opcional)</h2>
            <p className="text-sm text-sa-faint">Si el dominio/hosting es tuyo, deja Interno.</p>
            <Field label="Cliente">
              <select className={inputClass} value={form.clientId} onChange={(e) => set({ clientId: e.target.value })}>
                <option value="">Interno / Propietario</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.businessName}</option>
                ))}
              </select>
            </Field>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="text-lg font-bold text-sa-text">2. Servidor / cuenta de hosting</h2>
            <p className="text-sm text-sa-faint">Nómbralo por cuenta/plan/IP, no solo por el dominio.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Nombre del servidor" hint="Ej: PlanetaHosting · Profesional_CP · 201.x.x.x">
                <input className={inputClass} value={form.serverName} onChange={(e) => set({ serverName: e.target.value })} placeholder={suggestServerName()} />
              </Field>
              <Field label="IP">
                <input className={inputClass} value={form.serverIp} onChange={(e) => set({ serverIp: e.target.value })} placeholder="201.148.104.76" />
              </Field>
              <Field label="Proveedor">
                <ProviderSelect value={form.provider} onChange={(name) => set({ provider: name })} />
              </Field>
              <Field label="Plan contratado">
                <input className={inputClass} value={form.plan} onChange={(e) => set({ plan: e.target.value })} placeholder="Profesional_CP" />
              </Field>
              <Field label="URL cPanel" hint="Opcional">
                <input className={inputClass} value={form.panelUrl} onChange={(e) => set({ panelUrl: e.target.value })} placeholder="http://dominio.com/cpanel" />
              </Field>
              <Field label="URL Webmail" hint="Opcional · si vacío se sugiere al avanzar">
                <input className={inputClass} value={form.webmailUrl} onChange={(e) => set({ webmailUrl: e.target.value })} placeholder="http://dominio.com/webmail" />
              </Field>
              <Field label="Categoría">
                <select className={inputClass} value={form.category} onChange={(e) => set({ category: e.target.value })}>
                  <option>Servidores cPanel</option>
                  <option>VPS Producción</option>
                  <option>Producción</option>
                  <option>Staging/Dev</option>
                </select>
              </Field>
            </div>
            <button
              type="button"
              onClick={() => set({ serverName: suggestServerName() })}
              className="text-xs font-semibold text-blue-400 hover:text-blue-300"
            >
              Autocompletar nombre sugerido
            </button>
          </>
        )}

        {step === 3 && (
          <>
            <h2 className="text-lg font-bold text-sa-text">3. Dominio & DNS</h2>
            <p className="text-sm text-sa-faint">Quedará vinculado al servidor del paso anterior.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Dominio">
                <input required className={inputClass} value={form.domainName} onChange={(e) => set({ domainName: e.target.value })} placeholder="variashopfl.com" />
              </Field>
              <Field label="Vencimiento">
                <input type="date" className={inputClass} value={form.expiryDate} onChange={(e) => set({ expiryDate: e.target.value })} />
              </Field>
              <Field label="Panel DNS / Zona">
                <input className={inputClass} value={form.dnsZone} onChange={(e) => set({ dnsZone: e.target.value })} placeholder="cPanel / PlanetaHosting" />
              </Field>
              <label className="flex items-center gap-2 text-sm text-sa-muted self-end pb-2">
                <input type="checkbox" checked={form.autoRenew} onChange={(e) => set({ autoRenew: e.target.checked })} />
                Renovación automática
              </label>
              <Field label="NS1">
                <input className={inputClass} value={form.nameserver1} onChange={(e) => set({ nameserver1: e.target.value })} placeholder="dns1.planetahosting.pe" />
              </Field>
              <Field label="IP NS1">
                <input className={inputClass} value={form.nameserver1Ip} onChange={(e) => set({ nameserver1Ip: e.target.value })} />
              </Field>
              <Field label="NS2">
                <input className={inputClass} value={form.nameserver2} onChange={(e) => set({ nameserver2: e.target.value })} placeholder="dns2.planetahosting.pe" />
              </Field>
              <Field label="IP NS2">
                <input className={inputClass} value={form.nameserver2Ip} onChange={(e) => set({ nameserver2Ip: e.target.value })} />
              </Field>
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <h2 className="text-lg font-bold text-sa-text">4. Credenciales (opcional)</h2>
            <p className="text-sm text-sa-faint">Puedes dejarlas vacías y cargarlas después en la Bóveda.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Usuario cPanel">
                <input className={inputClass} value={form.cpanelUsername} onChange={(e) => set({ cpanelUsername: e.target.value })} />
              </Field>
              <Field label="Password cPanel">
                <input type="password" className={inputClass} value={form.cpanelPassword} onChange={(e) => set({ cpanelPassword: e.target.value })} />
              </Field>
              <Field label="Host FTP">
                <input className={inputClass} value={form.ftpHost} onChange={(e) => set({ ftpHost: e.target.value })} placeholder="ftp.dominio.com:21" />
              </Field>
              <Field label="Usuario FTP">
                <input className={inputClass} value={form.ftpUsername} onChange={(e) => set({ ftpUsername: e.target.value })} />
              </Field>
              <Field label="Password FTP">
                <input type="password" className={inputClass} value={form.ftpPassword} onChange={(e) => set({ ftpPassword: e.target.value })} />
              </Field>
            </div>

            <div className="rounded-xl border border-sa-border bg-sa-canvas/40 p-4 space-y-3 mt-2">
              <div>
                <p className="text-sm font-bold text-sa-text">Webmail (opcional)</p>
                <p className="text-[11px] text-sa-faint mt-0.5">
                  URL del botón Webmail + usuario/password del correo si quieres guardarlos en la Bóveda.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="URL Webmail">
                  <input className={inputClass} value={form.webmailUrl} onChange={(e) => set({ webmailUrl: e.target.value })} placeholder="http://dominio.com/webmail" />
                </Field>
                <div className="hidden sm:block" />
                <Field label="Usuario Webmail / correo">
                  <input className={inputClass} value={form.webmailUsername} onChange={(e) => set({ webmailUsername: e.target.value })} placeholder="info@dominio.com" />
                </Field>
                <Field label="Password Webmail">
                  <input type="password" className={inputClass} value={form.webmailPassword} onChange={(e) => set({ webmailPassword: e.target.value })} />
                </Field>
              </div>
            </div>
          </>
        )}

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>
        )}

        <div className="flex flex-col sm:flex-row justify-between gap-3 pt-2 border-t border-sa-border">
          <button
            type="button"
            onClick={goBack}
            disabled={step === 1}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-sa-muted border border-sa-border hover:bg-sa-border/50 hover:text-sa-text disabled:opacity-40 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Atrás
          </button>
          {step < 4 ? (
            <button
              type="button"
              onClick={goNext}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors"
            >
              Siguiente <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <Can ability="servers.manage">
              <button
                type="button"
                disabled={submitting}
                onClick={submit}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-60 transition-colors"
              >
                {submitting ? 'Guardando...' : 'Crear servidor + dominio + bóveda'}
              </button>
            </Can>
          )}
        </div>
      </div>
    </div>
  );
}
