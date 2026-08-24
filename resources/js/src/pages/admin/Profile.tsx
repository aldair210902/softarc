import React, { useEffect, useState } from 'react';
import { User, Shield, ShieldCheck, Mail, Phone, Briefcase, Lock, Smartphone, KeyRound } from 'lucide-react';
import { cn } from '../../lib/utils';
import { apiGet, apiMutate } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

type Tab = 'Información Personal' | 'Seguridad & Contraseña' | 'Sesiones & Dispositivos';

interface ProfileData {
  id: string;
  name: string;
  email: string;
  phone: string;
  jobTitle: string;
  role: string;
}

const fieldInputClass =
  'w-full pl-10 pr-3 py-2.5 bg-sa-input border border-sa-border rounded-xl text-sa-text text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder-sa-faint';

const primaryBtnClass =
  'inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/20';

export default function Profile() {
  const { refresh } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('Información Personal');
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', jobTitle: '' });
  const [passwords, setPasswords] = useState({ currentPassword: '', password: '', confirm: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    apiGet<ProfileData>('/api/profile')
      .then((data) => {
        setProfile(data);
        setForm({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          jobTitle: data.jobTitle || '',
        });
      })
      .catch(() => setError('No se pudo cargar el perfil'));
  }, []);

  const initials = (form.name || 'SA')
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const saveProfile = async () => {
    setMessage('');
    setError('');
    try {
      const data = await apiMutate<ProfileData>('put', '/api/profile', form);
      setProfile(data);
      setMessage('Perfil actualizado');
      await refresh();
    } catch {
      setError('No se pudo guardar el perfil');
    }
  };

  const savePassword = async () => {
    setMessage('');
    setError('');
    if (passwords.password.length < 8) {
      setError('La nueva contraseña debe tener al menos 8 caracteres');
      return;
    }
    if (passwords.password !== passwords.confirm) {
      setError('Las contraseñas no coinciden');
      return;
    }
    try {
      await apiMutate('put', '/api/profile', {
        currentPassword: passwords.currentPassword,
        password: passwords.password,
      });
      setPasswords({ currentPassword: '', password: '', confirm: '' });
      setMessage('Contraseña actualizada. Otras sesiones se cerraron.');
    } catch {
      setError('No se pudo actualizar la contraseña');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-sa-panel border border-sa-border rounded-2xl p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-6 relative overflow-hidden shrink-0">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="relative">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 p-0.5">
            <div className="w-full h-full rounded-2xl bg-sa-canvas flex items-center justify-center text-3xl font-bold text-sa-text">
              {initials}
            </div>
          </div>
          <div className="absolute -bottom-2 -right-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full p-1.5">
            <ShieldCheck className="h-4 w-4" />
          </div>
        </div>
        <div className="flex-1 relative z-10 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
            <h1 className="text-2xl md:text-3xl font-extrabold text-sa-text tracking-tight truncate">{form.name || 'Usuario'}</h1>
            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold border bg-blue-500/10 text-blue-400 border-blue-500/20 w-fit">
              {profile?.role || 'Administrador'}
            </span>
          </div>
          <p className="text-sa-muted flex items-center gap-2 text-sm truncate">
            <Mail className="h-4 w-4 shrink-0" /> {form.email}
          </p>
        </div>
      </div>

      {(message || error) && (
        <div className={cn('text-sm rounded-lg px-3 py-2 border', error ? 'text-red-400 bg-red-500/10 border-red-500/20' : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20')}>
          {error || message}
        </div>
      )}

      <div className="flex items-center gap-1 bg-sa-panel border border-sa-border rounded-xl p-1 overflow-x-auto custom-scrollbar shrink-0">
        {(['Información Personal', 'Seguridad & Contraseña', 'Sesiones & Dispositivos'] as Tab[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-4 sm:px-5 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap flex items-center gap-2',
              activeTab === tab
                ? 'bg-sa-border text-sa-text shadow-sm'
                : 'text-sa-faint hover:text-sa-text hover:bg-sa-border/50',
            )}
          >
            {tab === 'Información Personal' && <User className="h-4 w-4" />}
            {tab === 'Seguridad & Contraseña' && <Shield className="h-4 w-4" />}
            {tab === 'Sesiones & Dispositivos' && <Smartphone className="h-4 w-4" />}
            {tab}
          </button>
        ))}
      </div>

      <div className="bg-sa-panel border border-sa-border rounded-2xl p-6 md:p-8">
        {activeTab === 'Información Personal' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-lg font-bold text-sa-text mb-1">Información Básica</h2>
              <p className="text-sm text-sa-faint">Actualiza tus datos personales y de contacto.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { key: 'name' as const, label: 'Nombre Completo', icon: User, type: 'text' },
                { key: 'email' as const, label: 'Correo Electrónico', icon: Mail, type: 'email' },
                { key: 'phone' as const, label: 'Teléfono / WhatsApp', icon: Phone, type: 'tel' },
                { key: 'jobTitle' as const, label: 'Cargo / Título', icon: Briefcase, type: 'text' },
              ].map((field) => (
                <div key={field.key} className="space-y-2">
                  <label className="block text-sm font-semibold text-sa-muted">{field.label}</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <field.icon className="h-4 w-4 text-sa-faint" />
                    </div>
                    <input
                      type={field.type}
                      value={form[field.key]}
                      onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                      className={fieldInputClass}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="pt-4 border-t border-sa-border flex justify-end">
              <button type="button" onClick={() => void saveProfile()} className={primaryBtnClass}>
                Guardar Cambios
              </button>
            </div>
          </div>
        )}

        {activeTab === 'Seguridad & Contraseña' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-lg font-bold text-sa-text mb-1">Cambiar Contraseña</h2>
              <p className="text-sm text-sa-faint">Mínimo 8 caracteres. Al cambiarla se cierran otras sesiones abiertas.</p>
            </div>
            <div className="max-w-md space-y-5">
              {[
                { key: 'currentPassword' as const, label: 'Contraseña Actual', icon: KeyRound },
                { key: 'password' as const, label: 'Nueva Contraseña', icon: Lock },
                { key: 'confirm' as const, label: 'Confirmar Nueva Contraseña', icon: Lock },
              ].map((field) => (
                <div key={field.key} className="space-y-2">
                  <label className="block text-sm font-semibold text-sa-muted">{field.label}</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <field.icon className="h-4 w-4 text-sa-faint" />
                    </div>
                    <input
                      type="password"
                      value={passwords[field.key]}
                      onChange={(e) => setPasswords({ ...passwords, [field.key]: e.target.value })}
                      className={fieldInputClass}
                      autoComplete={field.key === 'currentPassword' ? 'current-password' : 'new-password'}
                    />
                  </div>
                </div>
              ))}
              <button type="button" onClick={() => void savePassword()} className={primaryBtnClass}>
                Actualizar Contraseña
              </button>
            </div>
          </div>
        )}

        {activeTab === 'Sesiones & Dispositivos' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-sa-text mb-1">Sesiones & dispositivos</h2>
              <p className="text-sm text-sa-faint">
                La gestión de sesiones por dispositivo llegará vía lista de tokens Sanctum (revocar dispositivos remotos). Por ahora solo ves que hay una sesión activa; no es una UI simulada de dispositivos.
              </p>
            </div>
            <div className="p-4 rounded-xl border border-sa-border bg-sa-canvas flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="font-semibold text-sa-text">Sesión actual</p>
                <p className="text-sm text-sa-faint">Autenticada con cookie / Sanctum en SoftArc</p>
              </div>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded shrink-0">Activa</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
