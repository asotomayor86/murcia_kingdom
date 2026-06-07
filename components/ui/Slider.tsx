'use client';

import { ChangeEvent } from 'react';

export interface SegmentoSlider {
  /** Valor inicial del tramo (incluido). */
  desde: number;
  /** Valor final del tramo (incluido). */
  hasta: number;
  color: string;
  /** Texto corto bajo el tramo (p. ej. el nivel). */
  etiqueta: string;
}

interface Props {
  min: number;
  max: number;
  value: number;
  onChange: (n: number) => void;
  etiqueta?: string;
  /** Tramos de color a lo largo del slider (p. ej. niveles de dificultad). */
  segmentos?: SegmentoSlider[];
}

export function Slider({ min, max, value, onChange, etiqueta, segmentos }: Props) {
  const safeMax = Math.max(min, max);
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(Number(e.target.value));
  };
  // Cada valor entero ocupa una banda igual: el tramo [desde,hasta] mide
  // (hasta-desde+1)/(max-min+1) del ancho total.
  const span = safeMax - min + 1;
  const anchoPct = (s: SegmentoSlider) => `${((s.hasta - s.desde + 1) / span) * 100}%`;

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

      {segmentos && segmentos.length > 0 ? (
        <div className="pr-[68px]">
          {/* Barra de color por nivel */}
          <div className="flex h-2.5 w-full overflow-hidden rounded border border-sepia/40">
            {segmentos.map((s, i) => (
              <div
                key={i}
                style={{ width: anchoPct(s), background: s.color }}
                title={`${s.etiqueta} (atacantes ${s.desde}–${s.hasta})`}
              />
            ))}
          </div>
          {/* Etiquetas de nivel bajo cada tramo */}
          <div className="flex w-full">
            {segmentos.map((s, i) => (
              <div
                key={i}
                style={{ width: anchoPct(s) }}
                className="overflow-hidden text-center text-[10px] leading-tight text-sepiaOscuro/70"
              >
                {s.etiqueta}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex justify-between text-xs text-sepiaOscuro/70">
          <span>{min}</span>
          <span>{safeMax}</span>
        </div>
      )}
    </div>
  );
}
