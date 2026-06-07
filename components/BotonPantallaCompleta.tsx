'use client';

import { useEffect, useState } from 'react';

// Tipos laxos para los prefijos de Safari (webkit) sobre Document/Element.
interface DocConWebkit extends Document {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
}
interface ElConWebkit extends HTMLElement {
  webkitRequestFullscreen?: () => Promise<void> | void;
}

type FsFn = () => Promise<void> | void;

function elementoEnPantallaCompleta(): boolean {
  const d = document as DocConWebkit;
  return !!(d.fullscreenElement || d.webkitFullscreenElement);
}

function metodoEntrar(): FsFn | null {
  const el = document.documentElement as ElConWebkit;
  if (typeof el.requestFullscreen === 'function') return el.requestFullscreen.bind(el);
  if (typeof el.webkitRequestFullscreen === 'function') return el.webkitRequestFullscreen.bind(el);
  return null;
}

function metodoSalir(): FsFn | null {
  const d = document as DocConWebkit;
  if (typeof d.exitFullscreen === 'function') return d.exitFullscreen.bind(d);
  if (typeof d.webkitExitFullscreen === 'function') return d.webkitExitFullscreen.bind(d);
  return null;
}

function soportado(): boolean {
  return metodoEntrar() !== null && metodoSalir() !== null;
}

export function BotonPantallaCompleta() {
  const [montado, setMontado] = useState(false);
  const [disponible, setDisponible] = useState(false);
  const [completa, setCompleta] = useState(false);

  useEffect(() => {
    setMontado(true);
    setDisponible(soportado());
    setCompleta(elementoEnPantallaCompleta());
    const onCambio = () => setCompleta(elementoEnPantallaCompleta());
    document.addEventListener('fullscreenchange', onCambio);
    document.addEventListener('webkitfullscreenchange', onCambio);
    return () => {
      document.removeEventListener('fullscreenchange', onCambio);
      document.removeEventListener('webkitfullscreenchange', onCambio);
    };
  }, []);

  const alternar = async () => {
    try {
      const fn = elementoEnPantallaCompleta() ? metodoSalir() : metodoEntrar();
      if (fn) await fn();
    } catch {
      /* el navegador puede rechazar la petición; lo ignoramos */
    }
  };

  if (!montado || !disponible) return null;

  return (
    <button
      onClick={() => void alternar()}
      aria-label={completa ? 'Salir de pantalla completa' : 'Pantalla completa'}
      title={completa ? 'Salir de pantalla completa' : 'Pantalla completa'}
      className="fixed right-2 top-2 z-40 rounded-md p-1.5 text-sepiaOscuro/35 transition hover:bg-pergaminoOscuro/40 hover:text-sepiaOscuro/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-sepia/40"
    >
      {completa ? (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M9 4v4a1 1 0 0 1-1 1H4M15 4v4a1 1 0 0 0 1 1h4M9 20v-4a1 1 0 0 0-1-1H4M15 20v-4a1 1 0 0 1 1-1h4" />
        </svg>
      ) : (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M4 9V5a1 1 0 0 1 1-1h4M20 9V5a1 1 0 0 0-1-1h-4M4 15v4a1 1 0 0 0 1 1h4M20 15v4a1 1 0 0 1-1 1h-4" />
        </svg>
      )}
    </button>
  );
}
