import React from 'react';
import { Field, inputClass } from './FormModal';

export type ConceptOption = {
  label: string;
  amount: number | null;
  source?: string;
};

type Props = {
  concept: string;
  amount: string;
  options: ConceptOption[];
  currencySymbol?: string;
  onConceptChange: (concept: string) => void;
  onAmountChange: (amount: string) => void;
  autofillAmount?: boolean;
};

/** Select de conceptos existentes + opción para escribir otro. */
export function ConceptPicker({
  concept,
  amount,
  options,
  currencySymbol = 'S/',
  onConceptChange,
  onAmountChange,
  autofillAmount = true,
}: Props) {
  const matched = options.some((o) => o.label === concept);
  const useCustom = !matched;

  return (
    <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Field label="Concepto (elige o escribe otro)">
        <select
          className={inputClass}
          value={matched ? concept : '__custom__'}
          onChange={(e) => {
            const v = e.target.value;
            if (v === '__custom__') {
              onConceptChange('');
              return;
            }
            onConceptChange(v);
            if (autofillAmount) {
              const opt = options.find((o) => o.label === v);
              if (opt?.amount != null && opt.amount > 0) {
                onAmountChange(String(opt.amount));
              }
            }
          }}
        >
          <option value="__custom__">+ Otro concepto (escribir)…</option>
          {options.map((o) => (
            <option key={`${o.source || 'x'}-${o.label}`} value={o.label}>
              {o.label}
              {o.amount != null && o.amount > 0
                ? ` — ${currencySymbol} ${Number(o.amount).toFixed(0)}`
                : ''}
            </option>
          ))}
        </select>
      </Field>
      <Field label={`Monto (${currencySymbol})`}>
        <input
          required
          type="number"
          min="0"
          step="0.01"
          className={inputClass}
          value={amount}
          onChange={(e) => onAmountChange(e.target.value)}
          placeholder="0.00"
        />
      </Field>
      {useCustom && (
        <div className="sm:col-span-2">
          <Field label="Escribe el concepto">
            <input
              required
              className={inputClass}
              value={concept}
              onChange={(e) => onConceptChange(e.target.value)}
              placeholder="Ej. Capacitación extra · 2 horas"
            />
          </Field>
        </div>
      )}
    </div>
  );
}
