import type { EstadoPartida } from './tipos';

const CLAVE = 'risk-murcia:partida-v1';

export function guardar(estado: EstadoPartida): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(CLAVE, JSON.stringify(estado));
  } catch {
    // localStorage lleno / no disponible: silenciamos.
  }
}

export function cargar(): EstadoPartida | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(CLAVE);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!esEstadoValido(parsed)) {
      window.localStorage.removeItem(CLAVE);
      return null;
    }
    return parsed;
  } catch {
    window.localStorage.removeItem(CLAVE);
    return null;
  }
}

export function borrar(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(CLAVE);
}

export function hayPartidaGuardada(): boolean {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(CLAVE) !== null;
}

function esEstadoValido(x: unknown): x is EstadoPartida {
  if (!x || typeof x !== 'object') return false;
  const o = x as Record<string, unknown>;
  if (o.version !== 3) return false;
  if (!Array.isArray(o.jugadores) || o.jugadores.length !== 2) return false;
  if (typeof o.fase !== 'string') return false;
  if (!o.ocupacion || typeof o.ocupacion !== 'object') return false;
  if (!Array.isArray(o.barajas) || o.barajas.length !== 2) return false;
  return true;
}
