'use client';

import { COMARCAS } from '@/lib/territorios';
import { comarcaCompleta } from '@/lib/reglas';
import type { ComarcaId, EstadoPartida } from '@/lib/tipos';

interface Props {
  partida: EstadoPartida;
  onResaltarComarca?: (id: ComarcaId | null) => void;
}

export function PanelComarcas({ partida, onResaltarComarca }: Props) {
  return (
    <div className="flex min-h-[17rem] flex-col rounded-lg border-2 border-sepia bg-pergamino p-4 shadow-panel">
      <div className="mb-2 font-title text-lg text-sepiaOscuro">Comarcas</div>
      <ul className="grid flex-1 grid-cols-1 content-start gap-0.5 text-xs text-sepiaOscuro">
        {Object.values(COMARCAS).map((c) => {
          const j0 = comarcaCompleta(partida.ocupacion, 0, c);
          const j1 = comarcaCompleta(partida.ocupacion, 1, c);
          return (
            <li
              key={c.id}
              onMouseEnter={() => onResaltarComarca?.(c.id)}
              onMouseLeave={() => onResaltarComarca?.(null)}
              onFocus={() => onResaltarComarca?.(c.id)}
              onBlur={() => onResaltarComarca?.(null)}
              tabIndex={0}
              className="flex cursor-default items-center justify-between gap-2 rounded px-1 transition-colors hover:bg-sepia/15 focus:bg-sepia/15 focus:outline-none"
            >
              <span className="truncate">{c.nombre}</span>
              <span className="flex items-center gap-1">
                <span className="font-mono text-sepiaOscuro/70">+{c.bonus}</span>
                {j0 && <span className="h-2.5 w-2.5 rounded-full bg-jugador0" aria-label={`Completa para ${partida.jugadores[0].nombre}`} />}
                {j1 && <span className="h-2.5 w-2.5 rounded-full bg-jugador1" aria-label={`Completa para ${partida.jugadores[1].nombre}`} />}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
