'use client';

import type { IndiceJugador, OcupacionTerritorio, TerritorioId } from '@/lib/tipos';
import { COLOR_BASE_TERRITORIO, NOMBRES_TERRITORIO, POLIGONOS, CENTROS, COLOR_JUGADOR } from '@/lib/territorios';

interface Props {
  id: TerritorioId;
  ocupacion: OcupacionTerritorio;
  destacadoOrigen?: boolean;
  destacadoSeleccionable?: boolean;
  destacadoObjetivo?: boolean;
  destacadoComarca?: boolean;
  /** Barniz luminoso (mismo efecto que el resaltado de comarca) para el origen
   *  seleccionado y los destinos válidos bajo el cursor. */
  luminoso?: boolean;
  /** Si está definido, el municipio acaba de cambiar de dueño: se anima la mancha
   *  de aceite desde el color de este jugador (el anterior) hacia el actual. */
  conquistaDesde?: IndiceJugador;
  onClick?: (id: TerritorioId) => void;
  onHover?: (id: TerritorioId | null) => void;
  deshabilitado?: boolean;
}

function colorJugadorTransparente(jugador: IndiceJugador): string {
  // Capa semitransparente para superponer al color base de la comarca.
  if (jugador === 0) return 'rgba(44, 74, 107, 0.58)';
  return 'rgba(139, 44, 44, 0.58)';
}

export function Territorio({
  id,
  ocupacion,
  destacadoOrigen,
  destacadoSeleccionable,
  destacadoObjetivo,
  destacadoComarca,
  luminoso,
  conquistaDesde,
  onClick,
  onHover,
  deshabilitado,
}: Props) {
  const colorBase = COLOR_BASE_TERRITORIO[id];
  const overlay = colorJugadorTransparente(ocupacion.jugador);
  const centro = CENTROS[id];

  // Trazo del municipio. Por defecto una línea interna fina y clara: las fronteras
  // gruesas entre comarcas se dibujan en una capa aparte (ver MapaMurcia).
  const stroke = destacadoOrigen
    ? '#e6b800'
    : destacadoObjetivo
      ? '#c13b1a'
      : destacadoComarca
        ? '#1f6f5c'
        : '#8a6a40';
  const strokeWidth = destacadoOrigen || destacadoObjetivo
    ? 3.4
    : destacadoComarca
      ? 2.8
      : destacadoSeleccionable
        ? 2
        : 0.8;

  const cursor = onClick && !deshabilitado ? 'pointer' : 'default';

  const handleClick = () => {
    if (deshabilitado) return;
    onClick?.(id);
  };

  return (
    <g
      onClick={handleClick}
      onMouseEnter={() => onHover?.(id)}
      onMouseLeave={() => onHover?.(null)}
      style={{ cursor }}
      role="button"
      aria-label={`${NOMBRES_TERRITORIO[id]}: ${ocupacion.fichas} fichas`}
    >
      <polygon
        points={POLIGONOS[id]}
        fill={colorBase}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
      {conquistaDesde !== undefined ? (
        <>
          {/* color del dueño anterior como base */}
          <polygon
            points={POLIGONOS[id]}
            fill={colorJugadorTransparente(conquistaDesde)}
            stroke="none"
            pointerEvents="none"
          />
          {/* nuevo color expandiéndose como mancha de aceite, recortado al municipio */}
          <clipPath id={`mancha-${id}`}>
            <polygon points={POLIGONOS[id]} />
          </clipPath>
          <circle
            cx={centro.x}
            cy={centro.y}
            r={0}
            fill={overlay}
            clipPath={`url(#mancha-${id})`}
            className="mancha-aceite"
          />
        </>
      ) : (
        <polygon
          points={POLIGONOS[id]}
          fill={overlay}
          stroke="none"
          pointerEvents="none"
        />
      )}
      {(destacadoComarca || luminoso) && (
        <polygon
          points={POLIGONOS[id]}
          fill="rgba(255, 248, 200, 0.35)"
          stroke="none"
          pointerEvents="none"
        />
      )}
    </g>
  );
}

interface EtiquetaProps {
  id: TerritorioId;
  ocupacion: OcupacionTerritorio;
  /** Anillos expansivos (al conquistar el municipio). */
  ripple?: boolean;
  /** Rebote de la insignia (cambió el nº de tropas en una batalla). */
  pulso?: boolean;
}

// Nombre + insignia de fichas. Se renderiza en una capa superior para quedar por
// encima de las líneas gruesas de frontera.
export function EtiquetaTerritorio({ id, ocupacion, ripple, pulso }: EtiquetaProps) {
  const centro = CENTROS[id];
  const nombre = NOMBRES_TERRITORIO[id].toUpperCase();
  const palabras = nombre.split(' ');

  const renderTexto = () => {
    if (nombre.length <= 11 || palabras.length === 1) {
      return (
        <text x={centro.x} y={centro.y - 14} textAnchor="middle" className="map-label">
          {nombre}
        </text>
      );
    }
    const mitad = Math.ceil(palabras.length / 2);
    const l1 = palabras.slice(0, mitad).join(' ');
    const l2 = palabras.slice(mitad).join(' ');
    return (
      <>
        <text x={centro.x} y={centro.y - 22} textAnchor="middle" className="map-label">
          {l1}
        </text>
        <text x={centro.x} y={centro.y - 8} textAnchor="middle" className="map-label">
          {l2}
        </text>
      </>
    );
  };

  return (
    <g pointerEvents="none">
      {renderTexto()}
      {ripple && (
        <>
          <circle
            cx={centro.x}
            cy={centro.y + 12}
            r={14}
            fill="none"
            stroke={COLOR_JUGADOR[ocupacion.jugador]}
            strokeWidth={3}
            className="ripple-conquista"
          />
          <circle
            cx={centro.x}
            cy={centro.y + 12}
            r={14}
            fill="none"
            stroke={COLOR_JUGADOR[ocupacion.jugador]}
            strokeWidth={3}
            className="ripple-conquista ripple-delay"
          />
        </>
      )}
      <g className={pulso ? 'badge-pulso' : undefined}>
        <circle
          cx={centro.x}
          cy={centro.y + 12}
          r={13}
          fill={COLOR_JUGADOR[ocupacion.jugador]}
          stroke={COLOR_JUGADOR[ocupacion.jugador]}
          strokeWidth={2.4}
        />
        <text
          x={centro.x}
          y={centro.y + 17}
          textAnchor="middle"
          className="map-badge"
          fill="#fff8e8"
        >
          {ocupacion.fichas}
        </text>
      </g>
    </g>
  );
}
