'use client';

import { IconoFase } from './IconoFase';
import type { EstadoPartida } from '@/lib/tipos';

interface Props {
  partida: EstadoPartida;
}

const NOMBRE_FASE: Record<EstadoPartida['fase'], string> = {
  'colocacion-inicial': 'Colocación inicial',
  'refuerzos': 'Refuerzos',
  'ataques': 'Ataques',
  'fortificacion': 'Fortificación',
};

export function PanelFase({ partida }: Props) {
  const j = partida.jugadores[partida.turnoActual];
  return (
    <div className="flex min-h-[17rem] flex-col rounded-lg border-2 border-sepia bg-pergamino p-4 shadow-panel">
      <div className="text-xs uppercase tracking-wider text-sepiaOscuro/70">Fase actual</div>
      <div className="font-title text-xl text-sepiaOscuro">{NOMBRE_FASE[partida.fase]}</div>
      <div className="text-sm text-sepiaOscuro/80">Turno de {j.nombre}</div>
      <div className="flex flex-1 items-center justify-center pt-2">
        <IconoFase fase={partida.fase} className="h-24 w-24 text-sepiaOscuro/85" />
      </div>
    </div>
  );
}
