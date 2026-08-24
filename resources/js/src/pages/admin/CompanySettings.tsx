import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Phone, 
  CreditCard, 
  Globe, 
  Server, 
  Save, 
  RotateCcw, 
  Download, 
  Upload, 
  CheckCircle2, 
  Copy, 
  ExternalLink, 
  ShieldCheck, 
  AlertCircle,
  Sparkles,
  QrCode,
  Share2
} from 'lucide-react';
import { DEFAULT_COMPANY_SETTINGS } from '../../lib/defaults';
import { CompanySettings } from '../../types';
import { useToast } from '../../components/ui/Toast';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useCompanySettings } from '../../hooks/useCompanySettings';
import { apiUpload } from '../../lib/api';
import { ImagePlus } from 'lucide-react';

export default function CompanySettingsPage() {
  const { toast } = useToast();
  const { settings: remoteSettings, updateSettings, refresh } = useCompanySettings();
  const [settings, setSettings] = useState<CompanySettings>(DEFAULT_COMPANY_SETTINGS);
  const [activeTab, setActiveTab] = useState<'legal' | 'contact' | 'billing' | 'social' | 'tech'>('legal');
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);

  useEffect(() => {
    setSettings(remoteSettings);
  }, [remoteSettings]);

  // Calcular porcentaje de completitud de insumos
  const calculateCompleteness = () => {
    const brandFilled = (kind: 'isotipo' | 'logotipo' | 'imagotipo' | 'isologo') => {
      const light = settings[`${kind}LightUrl` as keyof CompanySettings];
      const dark = settings[`${kind}DarkUrl` as keyof CompanySettings];
      const legacy = settings[`${kind}Url` as keyof CompanySettings];
      return [light, dark, legacy].some((v) => typeof v === 'string' && v.trim().length > 0);
    };

    const checks: boolean[] = [
      !!settings.legalName?.trim(),
      !!settings.commercialName?.trim(),
      brandFilled('isotipo'),
      brandFilled('isologo'),
      brandFilled('imagotipo'),
      brandFilled('logotipo'),
      !!settings.ruc?.trim(),
      !!settings.address?.trim(),
      !!settings.city?.trim(),
      !!settings.legalRepresentative?.trim(),
      !!settings.salesPhone?.trim(),
      !!settings.salesWhatsapp?.trim(),
      !!settings.salesEmail?.trim(),
      !!settings.supportEmail?.trim(),
      !!settings.businessHours?.trim(),
      !!settings.bcpAccount?.trim(),
      !!settings.bcpCci?.trim(),
      !!settings.bankAccountHolder?.trim(),
      !!settings.yapePhone?.trim(),
      !!settings.instagramUrl?.trim(),
      !!settings.linkedinUrl?.trim(),
      !!settings.slaUptime?.trim(),
      !!settings.defaultDeliveryDays?.toString().trim(),
    ];

    const filled = checks.filter(Boolean).length;
    return Math.round((filled / checks.length) * 100);
  };

  const completeness = calculateCompleteness();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateSettings(settings);
      toast('success', 'Insumos Guardados', 'Los cambios se han sincronizado con éxito en todo el portal.');
      await refresh();
    } catch {
      toast('error', 'Error al guardar', 'No se pudieron guardar los insumos.');
    }
  };

  const handleReset = async () => {
    setSettings(DEFAULT_COMPANY_SETTINGS);
    try {
      await updateSettings(DEFAULT_COMPANY_SETTINGS);
      toast('info', 'Insumos Restablecidos', 'Se han restaurado los valores por defecto de la empresa.');
    } catch {
      toast('error', 'Error', 'No se pudieron restablecer los insumos.');
    }
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(settings, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `software_architec_insumos_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast('success', 'Archivo exportado', 'El JSON de insumos se ha descargado correctamente.');
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          const next = { ...DEFAULT_COMPANY_SETTINGS, ...parsed };
          setSettings(next);
          updateSettings(next)
            .then(() => toast('success', 'Archivo Importado', 'Se han actualizado los insumos con el nuevo archivo JSON.'))
            .catch(() => toast('error', 'Error', 'No se pudo guardar el JSON importado.'));
        } catch {
          toast('error', 'Error de Importación', 'El archivo no contiene un formato JSON válido.');
        }
      };
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    toast('success', 'Copiado al portapapeles');
    setTimeout(() => setCopiedText(null), 2500);
  };

  const generatePaymentTemplate = () => {
    return `*DATOS OFICIALES DE COBRO - ${settings.commercialName.toUpperCase()}*
🏢 Razón Social: ${settings.legalName}
📋 RUC: ${settings.ruc}
👤 Titular: ${settings.bankAccountHolder}

💳 *BANCO BCP (Soles):*
• Cta: ${settings.bcpAccount}
• CCI: ${settings.bcpCci}

💳 *BANCO BBVA (Soles):*
• Cta: ${settings.bbvaAccount}
• CCI: ${settings.bbvaCci}

💳 *BANCO INTERBANK (Soles):*
• Cta: ${settings.interbankAccount}
• CCI: ${settings.interbankCci}

📱 *BILLETERAS MÓVILES (Yape / Plin):*
• Celular: ${settings.yapePhone} (${settings.yapeHolder})

✉️ Enviar comprobante con número de operación a: ${settings.salesEmail} o al WhatsApp ${settings.salesPhone}`;
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Header & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-sa-border pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">
            <Building2 className="h-4 w-4" /> Empresa
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-sa-text tracking-tight">
            Ajustes
          </h1>
          <p className="text-sm text-sa-muted mt-1 max-w-2xl">
            Datos oficiales (RUC, bancos, WhatsApp, SLA, redes). Se reflejan en la web pública.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleExportJSON} title="Exportar configuración en formato JSON" className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-sa-muted border border-sa-border bg-sa-panel hover:bg-sa-border/50 hover:text-sa-text transition-colors cursor-pointer">
            <Download className="h-4 w-4" /> Exportar JSON
          </button>

          <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-sa-muted border border-sa-border bg-sa-panel hover:bg-sa-border/50 hover:text-sa-text transition-colors cursor-pointer"><Upload className="h-4 w-4" /> Importar JSON
            <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
          </label>

          <button
            type="button"
            onClick={() => setIsResetDialogOpen(true)}
            className="flex items-center gap-2 px-3 py-2 bg-sa-panel border border-red-500/20 text-red-400 hover:bg-red-500/10 rounded-xl text-xs font-semibold transition-colors"
            title="Restablecer a valores iniciales"
          >
            <RotateCcw className="h-4 w-4" /> Restablecer
          </button>
        </div>
      </div>

      {/* Progress & Quick Actions Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-sa-panel border border-sa-border rounded-2xl p-6 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-xs font-semibold text-sa-faint uppercase tracking-wider">Health Check de Parámetros</span>
              <h3 className="text-lg font-bold text-sa-text flex items-center gap-2 mt-0.5">
                Completitud de Insumos Reales
                {completeness >= 90 ? (
                  <span className="text-xs font-bold text-green-400 bg-green-500/10 border border-green-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Listo para Producción
                  </span>
                ) : (
                  <span className="text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> Faltan datos requeridos
                  </span>
                )}
              </h3>
            </div>
            <div className="text-2xl font-extrabold text-blue-500">{completeness}%</div>
          </div>

          <div className="w-full bg-sa-border h-3 rounded-full overflow-hidden mb-3">
            <div 
              className={`h-full transition-all duration-500 rounded-full ${
                completeness >= 90 ? 'bg-gradient-to-r from-blue-500 to-green-500' : 'bg-gradient-to-r from-amber-500 to-blue-500'
              }`}
              style={{ width: `${completeness}%` }}
            ></div>
          </div>

          <p className="text-xs text-sa-muted">
            Al completar el 100% de los insumos, tu web corporativa proyecta máxima credibilidad institucional ante clientes B2B.
          </p>
        </div>

        {/* Quick Payment Copier */}
        <div className="bg-sa-panel border border-sa-border rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-sa-faint uppercase tracking-wider">Acceso Rápido Comercial</span>
              <Share2 className="h-4 w-4 text-blue-400" />
            </div>
            <h4 className="text-sm font-bold text-sa-text mb-2">Plantilla de Cuentas para Clientes</h4>
            <p className="text-xs text-sa-muted mb-4">
              Copia al instante el formato oficial con BCP, BBVA, Interbank y Yape para enviar por WhatsApp.
            </p>
          </div>
          <button
            type="button"
            onClick={() => copyToClipboard(generatePaymentTemplate(), 'template')} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-sa-muted border border-sa-border bg-sa-panel hover:bg-sa-border/50 hover:text-sa-text transition-colors cursor-pointer">
            {copiedText === 'template' ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-green-400" /> ¡Copiado al Portapapeles!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" /> Copiar Plantilla de Cobro
              </>
            )}
          </button>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex flex-wrap gap-2 border-b border-sa-border pb-4">
        {[
          { id: 'legal', label: '1. Legal & Corporativo', icon: Building2 },
          { id: 'contact', label: '2. Contacto & WhatsApp', icon: Phone },
          { id: 'billing', label: '3. Cuentas Bancarias & Cobro QR', icon: CreditCard },
          { id: 'social', label: '4. Redes Sociales & Demos', icon: Globe },
          { id: 'tech', label: '5. SLA & Parámetros Técnicos', icon: Server }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                isActive 
                  ? 'bg-blue-600 text-white shadow-[0_4px_20px_rgba(37,99,235,0.4)]' 
                  : 'bg-sa-panel text-sa-muted border border-sa-border hover:text-sa-text hover:border-sa-border-strong'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="space-y-8">
        {/* TAB 1: Legal & Corporativo */}
        {activeTab === 'legal' && (
          <div className="bg-sa-panel border border-sa-border rounded-2xl p-6 md:p-8 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-sa-text mb-1">Identidad Legal & Domicilio Fiscal</h3>
              <p className="text-xs text-sa-muted">Estos datos aparecen en los footers, contratos, acuerdos de servicio y facturas electrónicas.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-sa-faint uppercase tracking-wider mb-2">
                  Razón Social Oficial *
                </label>
                <input
                  type="text"
                  required
                  value={settings.legalName}
                  onChange={e => setSettings({ ...settings, legalName: e.target.value })} className="w-full px-3 py-2.5 bg-sa-input border border-sa-border rounded-xl text-sa-text text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder-sa-faint" placeholder="Software Architec SAC"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-sa-faint uppercase tracking-wider mb-2">
                  Nombre Comercial de Marca *
                </label>
                <input
                  type="text"
                  required
                  value={settings.commercialName}
                  onChange={e => setSettings({ ...settings, commercialName: e.target.value })} className="w-full px-3 py-2.5 bg-sa-input border border-sa-border rounded-xl text-sa-text text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder-sa-faint" placeholder="Software Architec"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-sa-faint uppercase tracking-wider mb-2">
                  Kit de marca
                </label>
                <p className="text-[11px] text-sa-faint mb-3">
                  Cada pieza tiene versión <span className="text-sa-muted font-semibold">modo claro</span> (fondos claros)
                  y <span className="text-sa-muted font-semibold">modo oscuro</span> (fondos oscuros).
                  La pestaña del navegador usa solo el <span className="text-sa-muted font-semibold">isotipo</span>.
                  Guarda después de subir o quitar.
                </p>
                <div className="space-y-3">
                  {([
                    {
                      kind: 'isotipo' as const,
                      title: 'Isotipo',
                      hint: 'Solo símbolo · pestaña y menú',
                      lightKey: 'isotipoLightUrl' as const,
                      darkKey: 'isotipoDarkUrl' as const,
                      legacyKey: 'isotipoUrl' as const,
                    },
                    {
                      kind: 'logotipo' as const,
                      title: 'Logotipo',
                      hint: 'Solo texto / wordmark',
                      lightKey: 'logotipoLightUrl' as const,
                      darkKey: 'logotipoDarkUrl' as const,
                      legacyKey: 'logotipoUrl' as const,
                    },
                    {
                      kind: 'imagotipo' as const,
                      title: 'Imagotipo',
                      hint: 'Texto + símbolo separados',
                      lightKey: 'imagotipoLightUrl' as const,
                      darkKey: 'imagotipoDarkUrl' as const,
                      legacyKey: 'imagotipoUrl' as const,
                    },
                    {
                      kind: 'isologo' as const,
                      title: 'Isologo',
                      hint: 'Texto + símbolo unidos',
                      lightKey: 'isologoLightUrl' as const,
                      darkKey: 'isologoDarkUrl' as const,
                      legacyKey: 'isologoUrl' as const,
                    },
                  ]).map((item) => {
                    const slots = [
                      {
                        theme: 'light' as const,
                        label: 'Modo claro',
                        key: item.lightKey,
                        url: settings[item.lightKey] || '',
                        previewBg: 'bg-white',
                      },
                      {
                        theme: 'dark' as const,
                        label: 'Modo oscuro',
                        key: item.darkKey,
                        // Legacy se muestra en oscuro (el sitio actual es oscuro)
                        url: settings[item.darkKey] || settings[item.legacyKey] || '',
                        previewBg: 'bg-sa-canvas',
                      },
                    ];

                    const uploadSlot = async (
                      file: File,
                      key: typeof item.lightKey | typeof item.darkKey,
                      theme: 'light' | 'dark',
                    ) => {
                      const fd = new FormData();
                      fd.append('file', file);
                      fd.append('folder', 'branding');
                      const res = await apiUpload<{ url: string }>('/api/media/upload', fd);
                      if (!res?.url) return;
                      const next = { ...settings, [key]: res.url };
                      if (theme === 'dark') {
                        next[item.legacyKey] = res.url;
                      }
                      setSettings(next);
                      toast('success', `${item.title} (${theme === 'light' ? 'claro' : 'oscuro'})`, 'Guarda la configuración para aplicarlo.');
                    };

                    const clearSlot = (theme: 'light' | 'dark') => {
                      if (theme === 'light') {
                        setSettings({ ...settings, [item.lightKey]: '' });
                        return;
                      }
                      const next = {
                        ...settings,
                        [item.darkKey]: '',
                        [item.legacyKey]: '',
                      };
                      // Si quitan el isotipo oscuro/legacy, limpia logoUrl si apuntaba a él
                      if (item.kind === 'isotipo') {
                        const gone = [settings.isotipoDarkUrl, settings.isotipoUrl].filter(Boolean);
                        if (gone.includes(settings.logoUrl)) next.logoUrl = '';
                      }
                      setSettings(next);
                    };

                    return (
                      <div key={item.kind} className="rounded-xl border border-sa-border bg-sa-canvas/50 p-3">
                        <div className="mb-3">
                          <p className="text-[12px] font-bold text-sa-text">{item.title}</p>
                          <p className="text-[10px] text-sa-faint">{item.hint}</p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {slots.map((slot) => (
                            <div key={slot.key} className="rounded-lg border border-sa-border-strong/60 p-2.5">
                              <p className="text-[10px] font-bold text-sa-muted uppercase tracking-wider mb-2">{slot.label}</p>
                              <div className="flex items-center gap-3">
                                {slot.url ? (
                                  <img
                                    src={slot.url}
                                    alt={`${item.title} ${slot.label}`}
                                    className={`h-14 w-14 rounded-lg object-contain border border-sa-border-strong p-1.5 ${slot.previewBg}`}
                                  />
                                ) : (
                                  <div className={`h-14 w-14 rounded-lg border border-sa-border-strong flex items-center justify-center text-sa-faint ${slot.previewBg}`}>
                                    <ImagePlus className="h-5 w-5" />
                                  </div>
                                )}
                                <div className="flex flex-col gap-1.5">
                                  <label className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-blue-600/15 text-blue-300 border border-blue-500/30 hover:bg-blue-600/25 cursor-pointer w-fit">
                                    Subir
                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        e.target.value = '';
                                        if (!file) return;
                                        try {
                                          await uploadSlot(file, slot.key, slot.theme);
                                        } catch {
                                          toast('error', 'Error', `No se pudo subir el ${item.title.toLowerCase()}`);
                                        }
                                      }}
                                    />
                                  </label>
                                  {slot.url && (
                                    <button
                                      type="button"
                                      onClick={() => clearSlot(slot.theme)}
                                      className="text-[11px] text-red-400 hover:text-red-300 text-left"
                                    >
                                      Quitar
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-sa-faint uppercase tracking-wider mb-2">
                  Número de RUC (11 dígitos) *
                </label>
                <input
                  type="text"
                  maxLength={11}
                  required
                  value={settings.ruc}
                  onChange={e => setSettings({ ...settings, ruc: e.target.value.replace(/\D/g, '') })} className="w-full px-3 py-2.5 bg-sa-input border border-sa-border rounded-xl text-sa-text text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder-sa-faint" placeholder="20610948215"
                />
                <span className="text-[11px] text-sa-faint mt-1 block">Longitud actual: {settings.ruc.length}/11 caracteres</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-sa-faint uppercase tracking-wider mb-2">
                  Representante Legal / Director de Proyectos
                </label>
                <input
                  type="text"
                  value={settings.legalRepresentative}
                  onChange={e => setSettings({ ...settings, legalRepresentative: e.target.value })} className="w-full px-3 py-2.5 bg-sa-input border border-sa-border rounded-xl text-sa-text text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder-sa-faint" placeholder="Ing. Aldair Flores"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-sa-faint uppercase tracking-wider mb-2">
                  Dirección Fiscal Oficial *
                </label>
                <input
                  type="text"
                  required
                  value={settings.address}
                  onChange={e => setSettings({ ...settings, address: e.target.value })} className="w-full px-3 py-2.5 bg-sa-input border border-sa-border rounded-xl text-sa-text text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder-sa-faint" placeholder="Av. Javier Prado Este 4200, Santiago de Surco"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-sa-faint uppercase tracking-wider mb-2">
                  Ciudad
                </label>
                <input
                  type="text"
                  value={settings.city}
                  onChange={e => setSettings({ ...settings, city: e.target.value })} className="w-full px-3 py-2.5 bg-sa-input border border-sa-border rounded-xl text-sa-text text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder-sa-faint" placeholder="Lima"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-sa-faint uppercase tracking-wider mb-2">
                  País
                </label>
                <input
                  type="text"
                  value={settings.country}
                  onChange={e => setSettings({ ...settings, country: e.target.value })} className="w-full px-3 py-2.5 bg-sa-input border border-sa-border rounded-xl text-sa-text text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder-sa-faint" placeholder="Perú"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-sa-faint uppercase tracking-wider mb-2">
                  Slogan Comercial & Propuesta de Valor
                </label>
                <input
                  type="text"
                  value={settings.brandSlogan}
                  onChange={e => setSettings({ ...settings, brandSlogan: e.target.value })} className="w-full px-3 py-2.5 bg-sa-input border border-sa-border rounded-xl text-sa-text text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder-sa-faint" placeholder="Automatización comercial y software modular para empresas de alto rendimiento"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Contacto & WhatsApp */}
        {activeTab === 'contact' && (
          <div className="bg-sa-panel border border-sa-border rounded-2xl p-6 md:p-8 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-sa-text mb-1">Canales Oficiales de Contacto & WhatsApp API</h3>
              <p className="text-xs text-sa-muted">Configura el número al que apuntan los botones de WhatsApp de toda la web y formularios comerciales.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-sa-faint uppercase tracking-wider mb-2">
                  Número de WhatsApp para Ventas (Código internacional sin '+') *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={settings.salesWhatsapp}
                    onChange={e => setSettings({ ...settings, salesWhatsapp: e.target.value.replace(/\D/g, '') })} className="w-full px-3 py-2.5 bg-sa-input border border-sa-border rounded-xl text-sa-text text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder-sa-faint" placeholder="51987654321"
                  />
                  <a
                    href={`https://wa.me/${settings.salesWhatsapp}?text=${encodeURIComponent(settings.whatsappWelcomeMessage)}`}
                    target="_blank"
                    rel="noreferrer">
                    <ExternalLink className="h-3 w-3" /> Probar
                  </a>
                </div>
                <span className="text-[11px] text-sa-faint mt-1 block">Ejemplo para Perú: 51987654321</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-sa-faint uppercase tracking-wider mb-2">
                  Teléfono Visible de Ventas
                </label>
                <input
                  type="text"
                  value={settings.salesPhone}
                  onChange={e => setSettings({ ...settings, salesPhone: e.target.value })} className="w-full px-3 py-2.5 bg-sa-input border border-sa-border rounded-xl text-sa-text text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder-sa-faint" placeholder="+51 987 654 321"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-sa-faint uppercase tracking-wider mb-2">
                  Mensaje Predefinido de WhatsApp (Apertura de conversación)
                </label>
                <textarea
                  rows={2}
                  value={settings.whatsappWelcomeMessage}
                  onChange={e => setSettings({ ...settings, whatsappWelcomeMessage: e.target.value })} className="w-full px-3 py-2.5 bg-sa-input border border-sa-border rounded-xl text-sa-text text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder-sa-faint" placeholder="Hola Software Architec, deseo cotizar una solución tecnológica..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-sa-faint uppercase tracking-wider mb-2">
                  Correo de Ventas / Cotizaciones *
                </label>
                <input
                  type="email"
                  required
                  value={settings.salesEmail}
                  onChange={e => setSettings({ ...settings, salesEmail: e.target.value })} className="w-full px-3 py-2.5 bg-sa-input border border-sa-border rounded-xl text-sa-text text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder-sa-faint" placeholder="contacto@softwarearchitec.com"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-sa-faint uppercase tracking-wider mb-2">
                  Correo de Soporte Técnico 24/7
                </label>
                <input
                  type="email"
                  value={settings.supportEmail}
                  onChange={e => setSettings({ ...settings, supportEmail: e.target.value })} className="w-full px-3 py-2.5 bg-sa-input border border-sa-border rounded-xl text-sa-text text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder-sa-faint" placeholder="soporte@softwarearchitec.com"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-sa-faint uppercase tracking-wider mb-2">
                  Teléfono de Soporte Técnico
                </label>
                <input
                  type="text"
                  value={settings.supportPhone}
                  onChange={e => setSettings({ ...settings, supportPhone: e.target.value })} className="w-full px-3 py-2.5 bg-sa-input border border-sa-border rounded-xl text-sa-text text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder-sa-faint" placeholder="+51 987 654 322"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-sa-faint uppercase tracking-wider mb-2">
                  Horario de Atención Comercial
                </label>
                <input
                  type="text"
                  value={settings.businessHours}
                  onChange={e => setSettings({ ...settings, businessHours: e.target.value })} className="w-full px-3 py-2.5 bg-sa-input border border-sa-border rounded-xl text-sa-text text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder-sa-faint" placeholder="Lunes a Sábado: 8:30 AM - 7:00 PM"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Cuentas Bancarias & Cobro QR */}
        {activeTab === 'billing' && (
          <div className="bg-sa-panel border border-sa-border rounded-2xl p-6 md:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-sa-text mb-1">Cuentas Bancarias y Billeteras Digitales</h3>
                <p className="text-xs text-sa-muted">Cuentas oficiales de recaudación para suscripciones MRR, Setup Fees y desarrollos a medida.</p>
              </div>
              <div className="p-3 bg-blue-600/10 border border-blue-500/20 rounded-xl text-xs text-blue-400 font-semibold flex items-center gap-2">
                <CreditCard className="h-4 w-4" /> Cobros Locales Perú
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-sa-faint uppercase tracking-wider mb-2">
                  Nombre del Titular de las Cuentas Bancarias *
                </label>
                <input
                  type="text"
                  required
                  value={settings.bankAccountHolder}
                  onChange={e => setSettings({ ...settings, bankAccountHolder: e.target.value })} className="w-full px-3 py-2.5 bg-sa-input border border-sa-border rounded-xl text-sa-text text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder-sa-faint" placeholder="Software Architec SAC"
                />
              </div>

              {/* BCP */}
              <div className="p-5 bg-sa-canvas rounded-xl border border-sa-border space-y-4">
                <div className="flex items-center gap-2 font-bold text-sa-text text-sm">
                  <span className="w-3 h-3 rounded-full bg-blue-500"></span> Banco de Crédito (BCP)
                </div>
                <div>
                  <label className="block text-[11px] text-sa-faint uppercase font-semibold mb-1">Número de Cuenta</label>
                  <input
                    type="text"
                    value={settings.bcpAccount}
                    onChange={e => setSettings({ ...settings, bcpAccount: e.target.value })} className="w-full px-3 py-2.5 bg-sa-input border border-sa-border rounded-xl text-sa-text text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder-sa-faint" placeholder="191-98765432-0-12"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-sa-faint uppercase font-semibold mb-1">Código Interbancario (CCI)</label>
                  <input
                    type="text"
                    value={settings.bcpCci}
                    onChange={e => setSettings({ ...settings, bcpCci: e.target.value })} className="w-full px-3 py-2.5 bg-sa-input border border-sa-border rounded-xl text-sa-text text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder-sa-faint" placeholder="002-191-009876543201-55"
                  />
                </div>
              </div>

              {/* BBVA */}
              <div className="p-5 bg-sa-canvas rounded-xl border border-sa-border space-y-4">
                <div className="flex items-center gap-2 font-bold text-sa-text text-sm">
                  <span className="w-3 h-3 rounded-full bg-sky-500"></span> Banco BBVA Perú
                </div>
                <div>
                  <label className="block text-[11px] text-sa-faint uppercase font-semibold mb-1">Número de Cuenta</label>
                  <input
                    type="text"
                    value={settings.bbvaAccount}
                    onChange={e => setSettings({ ...settings, bbvaAccount: e.target.value })} className="w-full px-3 py-2.5 bg-sa-input border border-sa-border rounded-xl text-sa-text text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder-sa-faint" placeholder="0011-0123-4567890123"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-sa-faint uppercase font-semibold mb-1">Código Interbancario (CCI)</label>
                  <input
                    type="text"
                    value={settings.bbvaCci}
                    onChange={e => setSettings({ ...settings, bbvaCci: e.target.value })} className="w-full px-3 py-2.5 bg-sa-input border border-sa-border rounded-xl text-sa-text text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder-sa-faint" placeholder="011-123-000123456789-40"
                  />
                </div>
              </div>

              {/* Interbank */}
              <div className="p-5 bg-sa-canvas rounded-xl border border-sa-border space-y-4">
                <div className="flex items-center gap-2 font-bold text-sa-text text-sm">
                  <span className="w-3 h-3 rounded-full bg-green-500"></span> Interbank
                </div>
                <div>
                  <label className="block text-[11px] text-sa-faint uppercase font-semibold mb-1">Número de Cuenta</label>
                  <input
                    type="text"
                    value={settings.interbankAccount}
                    onChange={e => setSettings({ ...settings, interbankAccount: e.target.value })} className="w-full px-3 py-2.5 bg-sa-input border border-sa-border rounded-xl text-sa-text text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder-sa-faint" placeholder="200-3001234567"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-sa-faint uppercase font-semibold mb-1">Código Interbancario (CCI)</label>
                  <input
                    type="text"
                    value={settings.interbankCci}
                    onChange={e => setSettings({ ...settings, interbankCci: e.target.value })} className="w-full px-3 py-2.5 bg-sa-input border border-sa-border rounded-xl text-sa-text text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder-sa-faint" placeholder="003-200-003001234567-88"
                  />
                </div>
              </div>

              {/* Yape / Plin */}
              <div className="p-5 bg-sa-canvas rounded-xl border border-sa-border space-y-4">
                <div className="flex items-center gap-2 font-bold text-sa-text text-sm">
                  <span className="w-3 h-3 rounded-full bg-purple-500"></span> Billeteras Digitales (Yape / Plin)
                </div>
                <div>
                  <label className="block text-[11px] text-sa-faint uppercase font-semibold mb-1">Número de Celular Yape</label>
                  <input
                    type="text"
                    value={settings.yapePhone}
                    onChange={e => setSettings({ ...settings, yapePhone: e.target.value })} className="w-full px-3 py-2.5 bg-sa-input border border-sa-border rounded-xl text-sa-text text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder-sa-faint" placeholder="987 654 321"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-sa-faint uppercase font-semibold mb-1">Titular en Yape / Plin</label>
                  <input
                    type="text"
                    value={settings.yapeHolder}
                    onChange={e => setSettings({ ...settings, yapeHolder: e.target.value, plinHolder: e.target.value })} className="w-full px-3 py-2.5 bg-sa-input border border-sa-border rounded-xl text-sa-text text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder-sa-faint" placeholder="Software Architec SAC"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Redes Sociales & Demos */}
        {activeTab === 'social' && (
          <div className="bg-sa-panel border border-sa-border rounded-2xl p-6 md:p-8 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-sa-text mb-1">Redes Sociales & Presencia Digital</h3>
              <p className="text-xs text-sa-muted">Enlaces a los canales oficiales y demos públicas de la compañía.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-sa-faint uppercase tracking-wider mb-2">
                  Perfil de Instagram
                </label>
                <input
                  type="url"
                  value={settings.instagramUrl}
                  onChange={e => setSettings({ ...settings, instagramUrl: e.target.value })} className="w-full px-3 py-2.5 bg-sa-input border border-sa-border rounded-xl text-sa-text text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder-sa-faint" placeholder="https://instagram.com/softwarearchitec"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-sa-faint uppercase tracking-wider mb-2">
                  Perfil de TikTok
                </label>
                <input
                  type="url"
                  value={settings.tiktokUrl}
                  onChange={e => setSettings({ ...settings, tiktokUrl: e.target.value })} className="w-full px-3 py-2.5 bg-sa-input border border-sa-border rounded-xl text-sa-text text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder-sa-faint" placeholder="https://tiktok.com/@softwarearchitec"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-sa-faint uppercase tracking-wider mb-2">
                  Página de LinkedIn
                </label>
                <input
                  type="url"
                  value={settings.linkedinUrl}
                  onChange={e => setSettings({ ...settings, linkedinUrl: e.target.value })} className="w-full px-3 py-2.5 bg-sa-input border border-sa-border rounded-xl text-sa-text text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder-sa-faint" placeholder="https://linkedin.com/company/softwarearchitec"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-sa-faint uppercase tracking-wider mb-2">
                  Canal de YouTube / Demos en Video
                </label>
                <input
                  type="url"
                  value={settings.youtubeUrl}
                  onChange={e => setSettings({ ...settings, youtubeUrl: e.target.value })} className="w-full px-3 py-2.5 bg-sa-input border border-sa-border rounded-xl text-sa-text text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder-sa-faint" placeholder="https://youtube.com/@softwarearchitec"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-sa-faint uppercase tracking-wider mb-2">
                  URL de ejemplo / landing de sistemas (opcional)
                </label>
                <input
                  type="text"
                  value={settings.variashopDemoUrl}
                  onChange={e => setSettings({ ...settings, variashopDemoUrl: e.target.value })} className="w-full px-3 py-2.5 bg-sa-input border border-sa-border rounded-xl text-sa-text text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder-sa-faint" placeholder="/servicios/saas"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: SLA & Parámetros Técnicos */}
        {activeTab === 'tech' && (
          <div className="bg-sa-panel border border-sa-border rounded-2xl p-6 md:p-8 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-sa-text mb-1">Métricas de Rendimiento & SLA Garantizado</h3>
              <p className="text-xs text-sa-muted">Estándares de calidad y acuerdos de nivel de servicio mostrados en la página principal y cotizaciones.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-semibold text-sa-faint uppercase tracking-wider mb-2">
                  Uptime Garantizado (SLA)
                </label>
                <input
                  type="text"
                  value={settings.slaUptime}
                  onChange={e => setSettings({ ...settings, slaUptime: e.target.value })} className="w-full px-3 py-2.5 bg-sa-input border border-sa-border rounded-xl text-sa-text text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder-sa-faint" placeholder="99.9%"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-sa-faint uppercase tracking-wider mb-2">
                  Latencia Promedio Servidores
                </label>
                <input
                  type="text"
                  value={settings.serverLatency}
                  onChange={e => setSettings({ ...settings, serverLatency: e.target.value })} className="w-full px-3 py-2.5 bg-sa-input border border-sa-border rounded-xl text-sa-text text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder-sa-faint" placeholder="<1s"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-sa-faint uppercase tracking-wider mb-2">
                  Tecnología de Almacenamiento
                </label>
                <input
                  type="text"
                  value={settings.storageType}
                  onChange={e => setSettings({ ...settings, storageType: e.target.value })} className="w-full px-3 py-2.5 bg-sa-input border border-sa-border rounded-xl text-sa-text text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder-sa-faint" placeholder="Almacenamiento NVMe SSD"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-sa-faint uppercase tracking-wider mb-2">
                  Tiempo de Entrega / Despliegue Promedio
                </label>
                <input
                  type="text"
                  value={settings.defaultDeliveryDays}
                  onChange={e => setSettings({ ...settings, defaultDeliveryDays: e.target.value })} className="w-full px-3 py-2.5 bg-sa-input border border-sa-border rounded-xl text-sa-text text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder-sa-faint" placeholder="3 a 5 días hábiles"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-sa-faint uppercase tracking-wider mb-2">
                  Símbolo de Moneda Principal
                </label>
                <input
                  type="text"
                  value={settings.currencySymbol}
                  onChange={e => setSettings({ ...settings, currencySymbol: e.target.value })} className="w-full px-3 py-2.5 bg-sa-input border border-sa-border rounded-xl text-sa-text text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder-sa-faint" placeholder="S/"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-sa-faint uppercase tracking-wider mb-2">
                  Código ISO de Moneda
                </label>
                <input
                  type="text"
                  value={settings.currencyCode}
                  onChange={e => setSettings({ ...settings, currencyCode: e.target.value })} className="w-full px-3 py-2.5 bg-sa-input border border-sa-border rounded-xl text-sa-text text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder-sa-faint" placeholder="PEN"
                />
              </div>

              <div className="md:col-span-2 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-amber-300/90 uppercase tracking-wider mb-1">
                    Modo de comprobantes (boleta / factura)
                  </label>
                  <p className="text-xs text-sa-muted mb-3">
                    Mientras tu RUC no esté activo para emitir, usa <strong className="text-sa-text">Prueba</strong>:
                    números BPR/FPR solo para practicar el flujo. Cuando actives el RUC, cambia a <strong className="text-sa-text">Oficial</strong>
                    (series B001/F001). La integración SUNAT se podrá conectar después.
                  </p>
                  <select
                    value={settings.billingEmissionMode || 'Prueba'}
                    onChange={e => setSettings({ ...settings, billingEmissionMode: e.target.value as 'Prueba' | 'Oficial' })}
                    className="w-full max-w-md px-3 py-2.5 bg-sa-input border border-sa-border rounded-xl text-sa-text text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Prueba">Prueba (sin valor tributario)</option>
                    <option value="Oficial">Oficial (series reales, aún sin envío SUNAT)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Save Bar */}
        <div className="sticky bottom-4 z-30 bg-sa-panel/95 backdrop-blur-md border border-sa-border p-4 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.5)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs text-sa-muted hidden sm:inline">
              Todos los cambios se guardan localmente y se propagan inmediatamente al sitio web.
            </span>
          </div>

          <button
            type="submit"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/20"
          >
            <Save className="h-4 w-4" /> Guardar Todos los Insumos
          </button>
        </div>
      </form>

      <ConfirmDialog 
        isOpen={isResetDialogOpen}
        title="Restablecer Insumos"
        description="¿Estás seguro de que deseas restablecer todos los insumos a los valores predeterminados de Software Architec? Esta acción no se puede deshacer y los datos de producción serán reemplazados."
        confirmText="Sí, restablecer"
        onConfirm={handleReset}
        onCancel={() => setIsResetDialogOpen(false)}
      />
    </div>
  );
}
