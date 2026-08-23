import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowLeft, ArrowRight, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import { ThemeToggle } from '../../components/ThemeToggle';
import { useCompanySettings } from '../../hooks/useCompanySettings';
import { useTheme } from '../../context/ThemeContext';
import { resolveHeaderBrand } from '../../lib/brandAssets';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, user } = useAuth();
  const { settings } = useCompanySettings();
  const { resolved } = useTheme();
  const brand = resolveHeaderBrand(settings, resolved);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (user) {
      const from = (location.state as { from?: string } | null)?.from || '/admin';
      navigate(from, { replace: true });
    }
  }, [user, navigate, location.state]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      await login(formData.email, formData.password);
      const from = (location.state as { from?: string } | null)?.from || '/admin';
      navigate(from, { replace: true });
    } catch {
      setError('Credenciales incorrectas. Verifica tu correo y contraseña.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-sa-canvas flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden">
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-sa-panel border border-sa-border rounded-xl shadow-[0_0_40px_rgba(59,130,246,0.1)] p-8 md:p-10">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              {brand.mode === 'lockup' || brand.mode === 'word' ? (
                <img
                  key={resolved}
                  src={brand.src}
                  alt={settings.commercialName}
                  className="h-16 sm:h-20 w-auto max-w-[min(90%,18rem)] object-contain"
                />
              ) : brand.mode === 'mark-word' ? (
                <span className="inline-flex items-center gap-2">
                  <img key={`${resolved}-m`} src={brand.mark} alt="" className="h-12 w-12 object-contain" />
                  {brand.word ? (
                    <img key={`${resolved}-w`} src={brand.word} alt={settings.commercialName} className="h-10 w-auto object-contain" />
                  ) : (
                    <span className="font-bold text-lg text-sa-text">{settings.commercialName}</span>
                  )}
                </span>
              ) : (
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-sa-text text-2xl shadow-lg shadow-blue-500/20">
                  {(settings.commercialName || 'S').charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <h2 className="text-sa-text font-semibold text-lg mb-1">Acceso al Sistema</h2>
            <p className="text-sa-faint text-sm">Consola de Administración y Control Operativo</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-sa-muted mb-1.5">Correo Electrónico</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-sa-faint" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="tu@correo.com"
                  required
                  className="w-full pl-10 pr-3 py-2.5 bg-sa-input border border-sa-border rounded-xl text-sa-text text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder-sa-faint"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-sa-muted mb-1.5">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-sa-faint" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-10 py-2.5 bg-sa-input border border-sa-border rounded-xl text-sa-text text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder-sa-faint"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sa-faint hover:text-sa-muted focus:outline-none"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-60 transition-colors shadow-lg shadow-blue-900/20"
            >
              {isLoading ? 'Ingresando...' : 'Ingresar al Sistema'}
              {!isLoading && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-sa-faint">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            Acceso protegido con sesión Laravel
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link to="/" className="inline-flex items-center text-sm text-sa-faint hover:text-sa-muted transition-colors gap-1.5">
            <ArrowLeft className="h-4 w-4" />
            Volver al portal
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
