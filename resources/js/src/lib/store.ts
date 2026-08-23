/**
 * Legacy localStorage helpers (no longer used by the SPA; data comes from Laravel API).
 * Kept empty to avoid accidental seed of demo records in the browser.
 */
import { CompanySettings, Lead, Client, Subscription, Transaction, SaaSProduct } from '../types';
import { DEFAULT_COMPANY_SETTINGS } from './defaults';

function getInitialData<T>(key: string, defaultValue: T): T {
  const stored = localStorage.getItem(key);
  if (!stored) return defaultValue;
  try {
    return JSON.parse(stored) as T;
  } catch {
    return defaultValue;
  }
}

export const store = {
  getCompanySettings: (): CompanySettings =>
    getInitialData<CompanySettings>('company_settings', DEFAULT_COMPANY_SETTINGS),
  saveCompanySettings: (settings: CompanySettings) =>
    localStorage.setItem('company_settings', JSON.stringify(settings)),

  getLeads: () => getInitialData<Lead[]>('crm_leads', []),
  saveLeads: (leads: Lead[]) => localStorage.setItem('crm_leads', JSON.stringify(leads)),

  getClients: () => getInitialData<Client[]>('crm_clients', []),
  saveClients: (clients: Client[]) => localStorage.setItem('crm_clients', JSON.stringify(clients)),

  getSubscriptions: () => getInitialData<Subscription[]>('crm_subs', []),
  saveSubscriptions: (subs: Subscription[]) => localStorage.setItem('crm_subs', JSON.stringify(subs)),

  getTransactions: () => getInitialData<Transaction[]>('crm_trans', []),
  saveTransactions: (trans: Transaction[]) => localStorage.setItem('crm_trans', JSON.stringify(trans)),

  getCatalogItems: () => getInitialData<SaaSProduct[]>('crm_catalog', []),
  saveCatalogItems: (items: SaaSProduct[]) => localStorage.setItem('crm_catalog', JSON.stringify(items)),
};
