'use client';

import { Boton } from './ui/Boton';
import { COLOR_JUGADOR } from '@/lib/territorios';
import type { EstadoPartida } from '@/lib/tipos';

interface Props {
  partida: EstadoPartida;
  onTerminarRefuerzos: () => void;
  onTerminarAtaques: () => void;
  onPasarFortificacion: () => void;
  onAbandonar: () => void;
}

const NOMBRE_FASE: Record<EstadoPartida['fase'], string> = {
  'colocacion-inicial': 'Coloca una ficha en uno de tus territorios.',
  'refuerzos': 'Coloca tus refuerzos y, si quieres, canjea cartas.',
  'ataques': 'Ataca todo lo que quieras o termina la fase.',
  'fortificacion': 'Mueve tropas entre dos territorios propios conectados (opcional).',
};

export function BarraTurno({
  partida,
  onTerminarRefuerzos,
  onTerminarAtaques,
  onPasarFortificacion,
  onAbandonar,
}: Props) {
  const j = partida.jugadores[partida.turnoActual];
  const color = COLOR_JUGADOR[partida.turnoActual];
  const puedeTerminarRefuerzos =
    partida.fase === 'refuerzos' &&
    partida.refuerzosPendientes === 0 &&
    j.cartas.length < 5;

  return (
    <div
      className="flex flex-col gap-3 rounded-lg border-2 bg-pergamino p-3 shadow-panel md:flex-row md:items-center"
      style={{ borderColor: color }}
    >
      <div className="flex items-center gap-3">
        <span
          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-pergamino"
          style={{ background: color }}
          aria-hidden
        >
          ♛
        </span>
        <div>
          <div className="text-xs uppercase tracking-wider text-sepiaOscuro/70">Turno de</div>
          <div className="font-title text-xl text-sepiaOscuro">{j.nombre}</div>
        </div>
        {partida.limiteRondas !== null && (
          <div className="ml-1 rounded border border-sepia/40 bg-pergaminoOscuro/30 px-2 py-1 text-center">
            <div className="text-[10px] uppercase tracking-wider text-sepiaOscuro/70">Ronda</div>
            <div className="font-title text-lg leading-none text-sepiaOscuro">
              {Math.min(partida.rondasJugadas + 1, partida.limiteRondas)}
              <span className="text-sm text-sepiaOscuro/60">/{partida.limiteRondas}</span>
            </div>
          </div>
        )}
      </div>
      <div className="flex-1 text-sm text-sepiaOscuro">{NOMBRE_FASE[partida.fase]}</div>
      <div className="flex flex-wrap items-center gap-2">
        {partida.fase === 'refuerzos' && (
          <Boton variante="primario" onClick={onTerminarRefuerzos} disabled={!puedeTerminarRefuerzos}>
            Terminar refuerzos
          </Boton>
        )}
        {partida.fase === 'ataques' && (
          <Boton variante="primario" onClick={onTerminarAtaques} disabled={partida.preguntaActiva !== null || partida.conquistaPendiente !== null}>
            Terminar ataques
          </Boton>
        )}
        {partida.fase === 'fortificacion' && (
          <Boton variante="secundario" onClick={onPasarFortificacion}>
            Pasar fortificación
          </Boton>
        )}
        <Boton variante="fantasma" onClick={onAbandonar}>
          Abandonar
        </Boton>
      </div>
    </div>
  );
}
