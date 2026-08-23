import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiGet } from '../lib/api';
import { inputClass } from './ui/FormModal';

export type InfraProvider = {
  id: string;
  name: string;
  type: string;
  websiteUrl?: string;
  panelUrl?: string;
  notes?: string;
  isActive?: boolean;
};

type Props = {
  value: string;
  onChange: (name: string, provider?: InfraProvider | null) => void;
  className?: string;
  placeholder?: string;
  allowCustom?: boolean;
  hintLink?: boolean;
};

export function ProviderSelect({
  value,
  onChange,
  className,
  placeholder = 'Selecciona proveedor…',
  allowCustom = true,
  hintLink = true,
}: Props) {
  const [providers, setProviders] = useState<InfraProvider[]>([]);
  const [customMode, setCustomMode] = useState(false);

  useEffect(() => {
    apiGet<InfraProvider[]>('/api/providers?activeOnly=1')
      .then(setProviders)
      .catch(() => setProviders([]));
  }, []);

  const names = useMemo(() => providers.map((p) => p.name), [providers]);
  const known = value && names.includes(value);
  const showCustom = customMode || (allowCustom && value && !known);

  if (showCustom) {
    return (
      <div className="space-y-1.5">
        <input
          className={className || inputClass}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Escribe el nombre del proveedor"
        />
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <button
            type="button"
            className="font-semibold text-blue-400 hover:text-blue-300"
            onClick={() => {
              setCustomMode(false);
              onChange('');
            }}
          >
            Elegir de la lista
          </button>
          {hintLink && (
            <Link to="/admin/infra/providers" className="text-sa-faint hover:text-blue-400">
              Gestionar proveedores
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <select
        className={className || inputClass}
        value={known ? value : ''}
        onChange={(e) => {
          const next = e.target.value;
          if (next === '__custom__') {
            setCustomMode(true);
            onChange(value && !known ? value : '');
            return;
          }
          const match = providers.find((p) => p.name === next) || null;
          onChange(next, match);
        }}
      >
        <option value="">{placeholder}</option>
        {providers.map((p) => (
          <option key={p.id} value={p.name}>
            {p.name}
            {p.type === 'hosting' ? ' (hosting)' : p.type === 'domain' ? ' (dominios)' : ''}
          </option>
        ))}
        {allowCustom && <option value="__custom__">Otro (escribir…)</option>}
      </select>
      {hintLink && (
        <Link to="/admin/infra/providers" className="inline-block text-[11px] text-sa-faint hover:text-blue-400">
          + Añadir / editar proveedores
        </Link>
      )}
    </div>
  );
}
