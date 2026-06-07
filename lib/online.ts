'use client';

import type { EstadoPartida, IndiceJugador } from './tipos';

const ALFABETO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CLAVE_SESION = 'risk-murcia:online-sesiones-v1';

export function generarCodigoSala(): string {
  let s = '';
  for (let i = 0; i < 6; i++) {
    s += ALFABETO[Math.floor(Math.random() * ALFABETO.length)];
  }
  return s;
}

interface MapaSesiones {
  [codigo: string]: { miIndice: IndiceJugador };
}

function leerSesiones(): MapaSesiones {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(CLAVE_SESION);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed ? (parsed as MapaSesiones) : {};
  } catch {
    return {};
  }
}

function escribirSesiones(mapa: MapaSesiones): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(CLAVE_SESION, JSON.stringify(mapa));
}

export function guardarSesion(codigo: string, miIndice: IndiceJugador): void {
  const mapa = leerSesiones();
  mapa[codigo] = { miIndice };
  escribirSesiones(mapa);
}

export function obtenerSesion(codigo: string): { miIndice: IndiceJugador } | null {
  const mapa = leerSesiones();
  return mapa[codigo] ?? null;
}

export function olvidarSesion(codigo: string): void {
  const mapa = leerSesiones();
  delete mapa[codigo];
  escribirSesiones(mapa);
}

async function leerError(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as { error?: string };
    return data.error || `Error ${res.status}`;
  } catch {
    return `Error ${res.status}`;
  }
}

export async function crearSala(codigo: string, estado: EstadoPartida): Promise<void> {
  const res = await fetch('/api/salas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ codigo, estado }),
  });
  if (!res.ok) throw new Error(await leerError(res));
}

export async function obtenerEstadoSala(codigo: string): Promise<EstadoPartida | null> {
  const res = await fetch(`/api/salas/${encodeURIComponent(codigo)}`, {
    cache: 'no-store',
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(await leerError(res));
  const data = (await res.json()) as { estado: EstadoPartida };
  return data.estado;
}

export async function actualizarEstadoSala(
  codigo: string,
  estado: EstadoPartida,
): Promise<void> {
  const res = await fetch(`/api/salas/${encodeURIComponent(codigo)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ estado }),
  });
  if (!res.ok) throw new Error(await leerError(res));
}

export interface SuscripcionSala {
  desuscribir: () => void;
}

/**
 * Sincronización en tiempo real vía SSE. El navegador abre un EventSource contra
 * `/api/salas/[codigo]/stream`; el servidor sondea Neon y empuja el estado cuando
 * cambia. EventSource reconecta solo si la conexión se cierra (vida máxima del
 * stream o errores transitorios).
 */
export function suscribirseASala(
  codigo: string,
  onCambio: (estado: EstadoPartida) => void,
): SuscripcionSala {
  if (typeof window === 'undefined' || typeof EventSource === 'undefined') {
    return { desuscribir: () => undefined };
  }

  const fuente = new EventSource(`/api/salas/${encodeURIComponent(codigo)}/stream`);

  fuente.addEventListener('estado', (ev) => {
    try {
      const data = JSON.parse((ev as MessageEvent).data) as { estado: EstadoPartida };
      if (data.estado) onCambio(data.estado);
    } catch {
      /* ignora mensajes malformados */
    }
  });

  return {
    desuscribir: () => {
      fuente.close();
    },
  };
}
