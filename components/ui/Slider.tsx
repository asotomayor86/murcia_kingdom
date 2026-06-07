'use client';

import { ChangeEvent } from 'react';

interface Props {
  min: number;
  max: number;
  value: number;
  onChange: (n: number) => void;
  etiqueta?: string;
}

export function Slider({ min, max, value, onChange, etiqueta }: Props) {
  const safeMax = Math.max(min, max);
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(Number(e.target.value));
  };
  return (
    <div className="space-y-2">
      {etiqueta && <div className="text-sm text-sepiaOscuro">{etiqueta}</div>}
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={min}
          max={safeMax}
          value={value}
          onChange={handleChange}
          disabled={min === safeMax}
          className="flex-1 accent-sepia"
          aria-label={etiqueta ?? 'Selector'}
        />
        <div className="w-14 rounded border border-sepia bg-pergaminoOscuro/60 px-2 py-1 text-center font-mono text-sepiaOscuro">
          {value}
        </div>
      </div>
      <div className="flex justify-between text-xs text-sepiaOscuro/70">
        <span>{min}</span>
        <span>{safeMax}</span>
      </div>
    </div>
  );
}
