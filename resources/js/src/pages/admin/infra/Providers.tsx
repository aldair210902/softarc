import React, { useEffect, useState } from 'react';
import { Plus, Search, Building2, Pencil, Trash2, ExternalLink, Globe } from 'lucide-react';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Can } from '../../../components/Can';
import { apiGet, apiMutate } from '../../../lib/api';
import { Field, FormModal, inputClass } from '../../../components/ui/FormModal';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { DetailModal, DetailGrid, DetailItem } from '../../../components/ui/DetailModal';
import { cn } from '../../../lib/utils';
import type { InfraProvider } from '../../../components/ProviderSelect';

const emptyForm = {
  name: '',
  type: 'both',
  websiteUrl: '',
  panelUrl: '',
  notes: '',
  isActive: true,
};

const typeLabel: Record<string, string> = {
  both: 'Hosting y dominios',
  hosting: 'Solo hosting',
  domain: 'Solo dominios',
};

export default function Providers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [providers, setProviders] = useState<InfraProvider[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [pendingDelete, setPendingDelete] = useState<InfraProvider | null>(null);
  const [detail, setDetail] = useState<InfraProvider | null>(null);

  const load = () => {
    apiGet<InfraProvider[]>('/api/providers')
      .then(setProviders)
      .catch(() => setProviders([]));
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (provider: InfraProvider) => {
    setEditingId(provider.id);
    setForm({
      name: provider.name,
      type: provider.type || 'both',
      websiteUrl: provider.websiteUrl || '',
      panelUrl: provider.panelUrl || '',
      notes: provider.notes || '',
      isActive: provider.isActive !== false,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        type: form.type,
        websiteUrl: form.websiteUrl || null,
        panelUrl: form.panelUrl || null,
        notes: form.notes || null,
        isActive: form.isActive,
      };
      if (editingId) {
        await apiMutate('put', `/api/providers/${editingId}`, payload);
      } else {
        await apiMutate('post', '/api/providers', payload);
      }
      closeModal();
      load();
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (provider: InfraProvider) => {
    await apiMutate('delete', `/api/providers/${provider.id}`);
    setPendingDelete(null);
    load();
  };

  const filtered = providers.filter((p) => {
    const q = searchTerm.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.notes || '').toLowerCase().includes(q) ||
      (p.websiteUrl || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-sa-text tracking-tight">Proveedores</h1>
          <p className="text-sm text-sa-faint mt-1">
            Catálogo reutilizable para servidores, dominios y gastos. Evita escribir el mismo nombre cada vez.
          </p>
        </div>
        <Can anyOf={['servers.manage', 'domains.manage']}>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/20"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuevo proveedor
          </button>
        </Can>
      </div>

      <FormModal
        open={modalOpen}
        title={editingId ? 'Editar proveedor' : 'Nuevo proveedor'}
        onClose={closeModal}
        onSubmit={save}
        submitting={submitting}
        submitLabel="Guardar"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Nombre" hint="Ej: PlanetaHosting, GoDaddy, Namecheap">
            <input
              required
              className={inputClass}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="PlanetaHosting"
            />
          </Field>
          <Field label="Uso">
            <select className={inputClass} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="both">Hosting y dominios</option>
              <option value="hosting">Solo hosting</option>
              <option value="domain">Solo dominios / registrador</option>
            </select>
          </Field>
          <Field label="Sitio web" hint="Opcional">
            <input
              className={inputClass}
              value={form.websiteUrl}
              onChange={(e) => setForm({ ...form, websiteUrl: e.target.value })}
              placeholder="https://planetahosting.pe"
            />
          </Field>
          <Field label="URL panel del proveedor" hint="Opcional · login del proveedor">
            <input
              className={inputClass}
              value={form.panelUrl}
              onChange={(e) => setForm({ ...form, panelUrl: e.target.value })}
              placeholder="https://cliente.planetahosting.pe"
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Notas" hint="Opcional">
              <textarea
                className={cn(inputClass, 'min-h-[80px]')}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Datos útiles: soporte, facturación, etc."
              />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm text-sa-muted">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            />
            Activo (aparece en los selectores)
          </label>
        </div>
      </FormModal>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-sa-faint" />
        <input placeholder="Buscar proveedor..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-3 py-2.5 bg-sa-input border border-sa-border rounded-xl text-sa-text text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder-sa-faint"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Sin proveedores"
          description="Crea PlanetaHosting u otros para reutilizarlos en servidores y dominios."
        />
      ) : (
        <div className="bg-sa-panel border border-sa-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[720px]">
              <thead className="bg-sa-border/50 text-sa-faint font-semibold border-b border-sa-border">
                <tr>
                  <th className="px-6 py-4 uppercase tracking-wider text-[11px]">Proveedor</th>
                  <th className="px-6 py-4 uppercase tracking-wider text-[11px]">Uso</th>
                  <th className="px-6 py-4 uppercase tracking-wider text-[11px]">Enlaces</th>
                  <th className="px-6 py-4 uppercase tracking-wider text-[11px]">Estado</th>
                  <th className="px-6 py-4 uppercase tracking-wider text-[11px] text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E293B]">
                {filtered.map((provider) => (
                  <tr
                    key={provider.id}
                    onClick={() => setDetail(provider)}
                    className="hover:bg-sa-border/40 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <div className="font-bold text-sa-text text-[13px]">{provider.name}</div>
                      {provider.notes && (
                        <div className="text-[11px] text-sa-faint mt-0.5 line-clamp-1">{provider.notes}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sa-muted text-[13px]">
                      {typeLabel[provider.type] || provider.type}
                    </td>
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex flex-wrap gap-2">
                        {provider.websiteUrl ? (
                          <a
                            href={provider.websiteUrl.startsWith('http') ? provider.websiteUrl : `https://${provider.websiteUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-400 hover:text-blue-300"
                          >
                            <Globe className="h-3 w-3" /> Web
                          </a>
                        ) : null}
                        {provider.panelUrl ? (
                          <a
                            href={provider.panelUrl.startsWith('http') ? provider.panelUrl : `https://${provider.panelUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-orange-300 hover:text-orange-200"
                          >
                            <ExternalLink className="h-3 w-3" /> Panel
                          </a>
                        ) : null}
                        {!provider.websiteUrl && !provider.panelUrl && (
                          <span className="text-[#475569] text-[12px]">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          'inline-flex px-2 py-0.5 rounded text-[10px] font-bold border',
                          provider.isActive !== false
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-sa-border text-sa-faint border-sa-border-strong',
                        )}>
                        {provider.isActive !== false ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <Can anyOf={['servers.manage', 'domains.manage']}>
                          <button
                            type="button"
                            onClick={() => openEdit(provider)}
                            className="w-9 h-9 rounded-xl flex items-center justify-center border bg-blue-500/10 text-blue-300 border-blue-500/25 hover:bg-blue-500/20"
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setPendingDelete(provider)}
                            className="w-9 h-9 rounded-xl flex items-center justify-center border bg-red-500/10 text-red-300 border-red-500/25 hover:bg-red-500/20"
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </Can>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <DetailModal
        open={!!detail}
        title={detail?.name || 'Proveedor'}
        subtitle={detail ? (typeLabel[detail.type] || detail.type) : undefined}
        onClose={() => setDetail(null)}
        footer={detail && (
          <>
            <Can anyOf={['servers.manage', 'domains.manage']}>
              <button
                type="button"
                onClick={() => { const p = detail; setDetail(null); openEdit(p); }} className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors">
                Editar
              </button>
            </Can>
            <button type="button" onClick={() => setDetail(null)} className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-semibold text-sa-muted hover:text-sa-text hover:bg-sa-border/60 transition-colors">Cerrar</button>
          </>
        )}
      >
        {detail && (
          <DetailGrid>
            <DetailItem label="Estado" value={detail.isActive !== false ? 'Activo' : 'Inactivo'} />
            <DetailItem label="Uso" value={typeLabel[detail.type] || detail.type} />
            <DetailItem label="Sitio web" value={detail.websiteUrl} mono full />
            <DetailItem label="Panel del proveedor" value={detail.panelUrl} mono full />
            <DetailItem label="Notas" value={detail.notes} full />
          </DetailGrid>
        )}
      </DetailModal>

      <ConfirmDialog
        isOpen={!!pendingDelete}
        title="Eliminar proveedor"
        description={`¿Eliminar "${pendingDelete?.name}" del catálogo? Los servidores/dominios que ya lo usan no se modifican.`}
        confirmText="Eliminar"
        isDestructive
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => pendingDelete && remove(pendingDelete)}
      />
    </div>
  );
}
