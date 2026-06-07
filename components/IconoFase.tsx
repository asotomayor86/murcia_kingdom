'use client';

import type { EstadoPartida } from '@/lib/tipos';

interface IconoProps {
  className?: string;
}

// Refuerzos: llegada de nuevas tropas (flecha de despliegue + soldados).
function IconoRefuerzos({ className }: IconoProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {/* flecha de llegada */}
      <line x1="32" y1="6" x2="32" y2="24" />
      <path d="M24 18 L32 26 L40 18" />
      {/* tres soldados que llegan */}
      {[16, 32, 48].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy="40" r="5" fill="currentColor" stroke="none" />
          <path d={`M${cx - 8} 58 Q ${cx} 43 ${cx + 8} 58 Z`} fill="currentColor" stroke="none" />
        </g>
      ))}
    </svg>
  );
}

// Ataque: dos espadas cruzadas.
function IconoAtaque({ className }: IconoProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {[45, -45].map((ang) => (
        <g key={ang} transform={`rotate(${ang} 32 32)`}>
          <line x1="32" y1="46" x2="32" y2="15" />
          <path d="M32 9 L28.5 17 L35.5 17 Z" fill="currentColor" stroke="none" />
          <line x1="25" y1="44" x2="39" y2="44" />
          <line x1="32" y1="46" x2="32" y2="52" />
          <circle cx="32" cy="53.5" r="2.4" fill="currentColor" stroke="none" />
        </g>
      ))}
    </svg>
  );
}

// Fortificación: arreglos en una fortaleza (torre almenada + martillo).
function IconoFortificacion({ className }: IconoProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {/* torre almenada */}
      <path
        d="M8 58 V30 H13 V25 H18 V30 H22 V25 H27 V30 H31 V25 H36 V30 H40 V58 Z"
        fill="currentColor"
        fillOpacity={0.16}
      />
      {/* puerta */}
      <path d="M17 58 V45 Q24 39.5 31 45 V58 Z" fill="currentColor" fillOpacity={0.55} stroke="none" />
      {/* martillo de reparación */}
      <g transform="rotate(40 45 28)">
        <rect x="42.5" y="22" width="5" height="26" rx="2" fill="currentColor" stroke="none" />
        <rect x="34" y="14" width="22" height="9" rx="2" fill="currentColor" stroke="none" />
      </g>
    </svg>
  );
}

export function IconoFase({
  fase,
  className,
}: {
  fase: EstadoPartida['fase'];
  className?: string;
}) {
  switch (fase) {
    case 'ataques':
      return <IconoAtaque className={className} />;
    case 'fortificacion':
      return <IconoFortificacion className={className} />;
    // 'refuerzos' y 'colocacion-inicial' comparten el icono de despliegue de tropas.
    default:
      return <IconoRefuerzos className={className} />;
  }
}
