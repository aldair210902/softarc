import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { CompanySettings } from '../types';
import { DEFAULT_COMPANY_SETTINGS } from '../lib/defaults';
import { apiGet, apiMutate, invalidateApiCache } from '../lib/api';

interface CompanySettingsContextValue {
  settings: CompanySettings;
  loading: boolean;
  refresh: () => Promise<void>;
  updateSettings: (newSettings: CompanySettings) => Promise<void>;
}

const CompanySettingsContext = createContext<CompanySettingsContextValue | undefined>(undefined);

export function CompanySettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<CompanySettings>(DEFAULT_COMPANY_SETTINGS);
  const [loading, setLoading] = useState(true);
  const loadedRef = useRef(false);

  const refresh = useCallback(async (fresh = false) => {
    try {
      const data = await apiGet<Partial<CompanySettings>>('/api/company-settings', { fresh });
      setSettings({ ...DEFAULT_COMPANY_SETTINGS, ...data });
      loadedRef.current = true;
    } catch {
      if (!loadedRef.current) {
        setSettings(DEFAULT_COMPANY_SETTINGS);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh(false);
  }, [refresh]);

  useEffect(() => {
    const onChanged = () => {
      invalidateApiCache('/api/company-settings');
      void refresh(true);
    };
    window.addEventListener('company_settings_changed', onChanged);
    return () => window.removeEventListener('company_settings_changed', onChanged);
  }, [refresh]);

  const updateSettings = useCallback(async (newSettings: CompanySettings) => {
    const saved = await apiMutate<CompanySettings>('put', '/api/company-settings', newSettings);
    setSettings({ ...DEFAULT_COMPANY_SETTINGS, ...saved });
    loadedRef.current = true;
    invalidateApiCache('/api/company-settings');
  }, []);

  const value = useMemo(
    () => ({ settings, loading, refresh: () => refresh(true), updateSettings }),
    [settings, loading, refresh, updateSettings],
  );

  return (
    <CompanySettingsContext.Provider value={value}>
      {children}
    </CompanySettingsContext.Provider>
  );
}

export function useCompanySettings() {
  const ctx = useContext(CompanySettingsContext);
  if (!ctx) {
    throw new Error('useCompanySettings debe usarse dentro de CompanySettingsProvider');
  }
  return ctx;
}
