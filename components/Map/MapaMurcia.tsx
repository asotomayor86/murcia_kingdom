'use client';

import { useEffect, useMemo, useState } from 'react';
import { Territorio, EtiquetaTerritorio } from './Territorio';
import { ADYACENCIAS, CENTROS, COMARCAS, TERRITORIO_IDS } from '@/lib/territorios';
import { BORDE_EXTERIOR, FRONTERAS_COMARCA } from '@/lib/fronteras';
import type { ComarcaId, IndiceJugador, OcupacionTerritorio, TerritorioId } from '@/lib/tipos';

export interface NumeroCombate {
  key: number;
  territorio: TerritorioId;
  texto: string;
  tipo: 'perdida' | 'gano';
}

interface Props {
  ocupacion: Record<TerritorioId, OcupacionTerritorio>;
  origenSeleccionado?: TerritorioId | null;
  destinosValidos?: TerritorioId[];
  seleccionables?: TerritorioId[];
  recienConquistados?: Set<TerritorioId>;
  /** Municipios animando el cambio de dueño (mancha de aceite): id -> dueño anterior. */
  conquistasAnim?: Map<TerritorioId, IndiceJugador>;
  numerosCombate?: NumeroCombate[];
  comarcaResaltada?: ComarcaId | null;
  /** Pendones que avanzan del territorio atacante al defensor al declararse un ataque. */
  marcha?: {
    origen: TerritorioId;
    destino: TerritorioId;
    color: string;
    cantidad: number;
    key: number;
  } | null;
  onClickTerritorio?: (id: TerritorioId) => void;
  interactivo?: boolean;
}

// Pendones de batalla (uno por tropa atacante, hasta un máximo) que avanzan en
// formación del territorio atacante al defensor.
const MAX_PENDONES = 9;

function MarchaAtaque({
  origen,
  destino,
  color,
  cantidad,
}: {
  origen: TerritorioId;
  destino: TerritorioId;
  color: string;
  cantidad: number;
}) {
  const a = CENTROS[origen];
  const b = CENTROS[destino];
  const [pos, setPos] = useState({ x: a.x, y: a.y });
  useEffect(() => {
    // Doble rAF: garantiza que el navegador pinta el origen antes de transicionar.
    let id2 = 0;
    const id1 = requestAnimationFrame(() => {
      id2 = requestAnimationFrame(() => setPos({ x: b.x, y: b.y }));
    });
    return () => {
      cancelAnimationFrame(id1);
      cancelAnimationFrame(id2);
    };
  }, [a.x, a.y, b.x, b.y]);

  const n = Math.max(1, Math.min(MAX_PENDONES, cantidad));
  // Vectores dirección y perpendicular para colocar los pendones en formación.
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const px = -uy;
  const py = ux;
  const pendones = Array.from({ length: n }, (_, i) => {
    const fila = Math.floor(i / 3);
    const col = (i % 3) - 1; // -1, 0, 1 (centro)
    const side = col * 10;
    const atras = -fila * 12;
    return {
      ox: px * side + ux * atras,
      oy: py * side + uy * atras,
      delay: fila * 0.08, // las filas traseras arrancan un poco después
    };
  });

  return (
    <g className="marcha-fade" style={{ pointerEvents: 'none' }}>
      <line
        x1={a.x}
        y1={a.y}
        x2={b.x}
        y2={b.y}
        stroke={color}
        strokeWidth={2.5}
        strokeDasharray="5 6"
        opacity={0.55}
      />
      {pendones.map((p, i) => (
        <g
          key={i}
          style={{
            transform: `translate(${pos.x + p.ox}px, ${pos.y + p.oy}px)`,
            transition: `transform 1s ease-in-out ${p.delay}s`,
          }}
        >
          <line x1={0} y1={-15} x2={0} y2={11} stroke="#3d2817" strokeWidth={2.2} strokeLinecap="round" />
          <circle cx={0} cy={-15} r={2.1} fill="#3d2817" />
          <path d="M0,-14 L17,-9.5 L0,-5 Z" fill={color} stroke="#3d2817" strokeWidth={1.1} strokeLinejoin="round" />
        </g>
      ))}
    </g>
  );
}

export function MapaMurcia({
  ocupacion,
  origenSeleccionado,
  destinosValidos,
  seleccionables,
  recienConquistados,
  conquistasAnim,
  numerosCombate,
  comarcaResaltada,
  marcha,
  onClickTerritorio,
  interactivo = true,
}: Props) {
  // Territorio bajo el cursor: ilumina los destinos válidos al pasar por encima.
  const [hover, setHover] = useState<TerritorioId | null>(null);
  const destinosSet = useMemo(() => new Set(destinosValidos ?? []), [destinosValidos]);
  const seleccionablesSet = useMemo(() => new Set(seleccionables ?? []), [seleccionables]);
  const comarcaSet = useMemo(
    () => new Set(comarcaResaltada ? COMARCAS[comarcaResaltada].territorios : []),
    [comarcaResaltada],
  );
  // Insignias que rebotan: las conquistadas + las que cambiaron de tropas en batalla.
  const pulsoSet = useMemo(() => {
    const s = new Set<TerritorioId>(recienConquistados ?? []);
    for (const n of numerosCombate ?? []) s.add(n.territorio);
    return s;
  }, [recienConquistados, numerosCombate]);

  return (
    <svg
      viewBox="0 0 720 640"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Mapa de la Región de Murcia"
      className="w-full h-auto select-none"
    >
      <defs>
        <pattern id="pergaminoTextura" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
          <rect width="120" height="120" fill="#ead9a8" />
          <circle cx="20" cy="30" r="2" fill="#d6c089" opacity="0.55" />
          <circle cx="80" cy="60" r="1.5" fill="#d6c089" opacity="0.45" />
          <circle cx="40" cy="100" r="2" fill="#d6c089" opacity="0.55" />
        </pattern>
      </defs>
      <rect width="720" height="640" fill="url(#pergaminoTextura)" />
      <g opacity="0.13">
        <ellipse cx="100" cy="110" rx="90" ry="35" fill="#8a6438" />
        <ellipse cx="620" cy="220" rx="60" ry="45" fill="#8a6438" />
        <ellipse cx="40" cy="450" rx="35" ry="80" fill="#8a6438" />
        <ellipse cx="380" cy="330" rx="50" ry="25" fill="#8a6438" />
      </g>

      <rect x="14" y="14" width="692" height="612" fill="none" stroke="#5a3818" strokeWidth={2.5} />
      <rect x="22" y="22" width="676" height="596" fill="none" stroke="#5a3818" strokeWidth={0.6} />

      <text x="360" y="62" className="map-title">REINO DE MVRCIA</text>
      <text x="360" y="86" className="map-subtitle">— Mapa de Conquista en XXVI Territorios —</text>

      {/* Mar (parte sur) */}
      <path
        d="M22,552 Q60,560 90,554 Q130,562 168,560 Q210,566 268,564 Q330,570 420,566 Q500,572 555,566 Q620,572 678,560 L678,612 L22,612 Z"
        fill="#a4c3cc"
        opacity="0.8"
      />
      <text x="380" y="592" className="map-sea">MARE NOSTRVM</text>

      {/* Conexión marítima Águilas-Cartagena */}
      <path
        d="M213,510 Q330,580 475,510"
        stroke="#5a3818"
        strokeDasharray="6 4"
        strokeWidth={2.2}
        fill="none"
        opacity="0.7"
      />

      {/* Capa 1: rellenos de los municipios */}
      {TERRITORIO_IDS.map((id) => (
        <Territorio
          key={id}
          id={id}
          ocupacion={ocupacion[id]}
          destacadoOrigen={origenSeleccionado === id}
          destacadoObjetivo={destinosSet.has(id)}
          destacadoSeleccionable={seleccionablesSet.has(id)}
          destacadoComarca={comarcaSet.has(id)}
          luminoso={origenSeleccionado === id || (hover === id && destinosSet.has(id))}
          conquistaDesde={conquistasAnim?.get(id)}
          onClick={interactivo ? onClickTerritorio : undefined}
          onHover={interactivo ? setHover : undefined}
          deshabilitado={!interactivo}
        />
      ))}

      {/* Capa 2: contorno del mapa y fronteras gruesas entre comarcas */}
      <g pointerEvents="none" fill="none" strokeLinecap="round" strokeLinejoin="round">
        {BORDE_EXTERIOR.map((s, i) => (
          <line key={`ext-${i}`} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke="#4a2e12" strokeWidth={3.6} />
        ))}
        {FRONTERAS_COMARCA.map((s, i) => (
          <line key={`com-${i}`} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke="#4a2e12" strokeWidth={2.8} />
        ))}
      </g>

      {/* Capa 3: nombres e insignias de fichas (por encima de las fronteras) */}
      {TERRITORIO_IDS.map((id) => (
        <EtiquetaTerritorio
          key={`et-${id}`}
          id={id}
          ocupacion={ocupacion[id]}
          ripple={recienConquistados?.has(id)}
          pulso={pulsoSet.has(id)}
        />
      ))}

      {/* Capa 4: números de combate flotantes (bajas/refuerzos de la batalla) */}
      {(numerosCombate ?? []).map((n) => {
        const c = CENTROS[n.territorio];
        return (
          <g key={n.key} className="numero-combate">
            <text x={c.x} y={c.y - 6} fill="#ffffff">
              {n.texto}
            </text>
          </g>
        );
      })}

      {/* Capa 5: marcha de tropas (pendón) al declararse un ataque */}
      {marcha && (
        <MarchaAtaque
          key={marcha.key}
          origen={marcha.origen}
          destino={marcha.destino}
          color={marcha.color}
          cantidad={marcha.cantidad}
        />
      )}
    </svg>
  );
}

export function vecinosDe(id: TerritorioId): TerritorioId[] {
  return ADYACENCIAS[id];
}
