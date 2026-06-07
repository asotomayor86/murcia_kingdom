'use client';

import { COLOR_JUGADOR, NOMBRES_TERRITORIO } from '@/lib/territorios';
import { calcularPuntuacion, contarFichas, contarTerritorios } from '@/lib/reglas';
import type { EstadoPartida, IndiceJugador } from '@/lib/tipos';

interface Props {
  partida: EstadoPartida;
  jugador: IndiceJugador;
  onAbrirCanje?: () => void;
}

export function PanelJugador({ partida, jugador, onAbrirCanje }: Props) {
  const j = partida.jugadores[jugador];
  const activo = partida.turnoActual === jugador && partida.ganador === null;
  const territorios = contarTerritorios(partida.ocupacion, jugador);
  const fichas = contarFichas(partida.ocupacion, jugador);
  const punt = calcularPuntuacion(partida.ocupacion, jugador);
  const color = COLOR_JUGADOR[jugador];
  const cartas = j.cartas.length;
  const debeCanjearObligatorio = cartas >= 5 && activo && partida.fase === 'refuerzos';

  return (
    <div
      className={`rounded-lg border-2 p-4 shadow-panel transition ${
        activo ? 'border-sepia bg-pergamino' : 'border-sepia/40 bg-pergamino/70'
      }`}
      style={{ boxShadow: activo ? `0 0 0 3px ${color}55 inset` : undefined }}
    >
      <div className="mb-2 flex items-center gap-2">
        <span
          className="inline-block h-4 w-4 rounded-full border border-sepia"
          style={{ background: color }}
          aria-hidden
        />
        <h3 className="font-title text-lg tracking-wide text-sepiaOscuro">{j.nombre}</h3>
        {activo && (
          <span className="ml-auto rounded bg-sepia px-2 py-0.5 text-xs font-medium text-pergamino">
            En turno
          </span>
        )}
      </div>
      <dl className="grid grid-cols-2 gap-2 text-sm text-sepiaOscuro">
        <div>
          <dt className="text-xs uppercase tracking-wider text-sepiaOscuro/70">Territorios</dt>
          <dd className="font-mono text-lg">{territorios}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wider text-sepiaOscuro/70">Ejércitos</dt>
          <dd className="font-mono text-lg">{fichas}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wider text-sepiaOscuro/70">Cartas</dt>
          <dd className="font-mono text-lg">{cartas}</dd>
        </div>
        {partida.fase === 'colocacion-inicial' && (
          <div>
            <dt className="text-xs uppercase tracking-wider text-sepiaOscuro/70">Por colocar</dt>
            <dd className="font-mono text-lg">{partida.fichasPorColocarInicial[jugador]}</dd>
          </div>
        )}
        {partida.fase === 'refuerzos' && activo && (
          <div>
            <dt className="text-xs uppercase tracking-wider text-sepiaOscuro/70">Refuerzos</dt>
            <dd className="font-mono text-lg">{partida.refuerzosPendientes}</dd>
          </div>
        )}
      </dl>
      <div
        className="mt-2 flex items-center justify-between gap-2 rounded border px-2.5 py-1.5"
        style={{ borderColor: `${color}66`, background: `${color}14` }}
        title="Puntos al final de la partida: 1 por territorio, +2 Murcia, +2 Cartagena, +1 Lorca"
      >
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-wider text-sepiaOscuro/70">Puntos</div>
          <div className="truncate text-[10px] text-sepiaOscuro/60">
            {punt.bonus > 0
              ? `${punt.territorios} + ${punt.bonus} (${punt.claves.map((c) => NOMBRES_TERRITORIO[c]).join(', ')})`
              : `${punt.territorios} territorios`}
          </div>
        </div>
        <div className="font-title text-2xl leading-none" style={{ color }}>
          {punt.total}
        </div>
      </div>
      {debeCanjearObligatorio && (
        <button
          onClick={onAbrirCanje}
          className="mt-3 w-full rounded bg-jugador1 px-3 py-2 text-sm font-medium text-pergamino hover:bg-[#a83737]"
        >
          ¡Canje obligatorio! ({cartas} cartas)
        </button>
      )}
      {!debeCanjearObligatorio && activo && partida.fase === 'refuerzos' && cartas >= 3 && (
        <button
          onClick={onAbrirCanje}
          className="mt-3 w-full rounded border border-sepia bg-pergaminoOscuro/50 px-3 py-2 text-sm text-sepiaOscuro hover:bg-pergaminoOscuro"
        >
          Canjear cartas
        </button>
      )}
    </div>
  );
}
