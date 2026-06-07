'use client';

export interface Anuncio {
  key: number;
  titulo: string;
  subtitulo?: string;
  color: string;
  /** Cambios de fase: fundido más rápido que el cambio de turno. */
  rapido?: boolean;
}

// Cartel a tablero completo que avisa del cambio de turno o de fase, con un
// fundido elegante. No bloquea la interacción (pointer-events: none).
export function AnuncioFase({ anuncio }: { anuncio: Anuncio | null }) {
  if (!anuncio) return null;
  return (
    <div
      className={`anuncio-fase pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center text-center ${
        anuncio.rapido ? 'anuncio-fase-rapido' : ''
      }`}
    >
      <div className="anuncio-fase-velo absolute inset-0" />
      <div className="relative px-6">
        <div
          className="anuncio-titulo whitespace-pre-line font-title text-4xl leading-tight tracking-wider sm:text-5xl md:text-6xl"
          style={{ color: anuncio.color }}
        >
          {anuncio.titulo}
        </div>
        {anuncio.subtitulo && (
          <div className="anuncio-sub mt-3 font-title text-lg tracking-widest text-sepiaOscuro sm:text-2xl md:text-3xl">
            {anuncio.subtitulo}
          </div>
        )}
      </div>
    </div>
  );
}
