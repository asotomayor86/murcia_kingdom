import type { Baraja, Pregunta } from './tipos';

export interface InfoBaraja {
  deck_id: string;
  deck_name: string;
  archivo: string;
}

interface IndiceBarajas {
  barajas: string[];
}

export async function listarBarajas(): Promise<InfoBaraja[]> {
  const res = await fetch('/api/barajas', { cache: 'no-store' });
  if (!res.ok) throw new Error('No se pudo cargar la lista de barajas.');
  const idx = (await res.json()) as IndiceBarajas;
  if (!idx || !Array.isArray(idx.barajas)) {
    throw new Error('Lista de barajas inválida.');
  }
  const resultado: InfoBaraja[] = [];
  for (const archivo of idx.barajas) {
    try {
      const baraja = await cargarBaraja(archivo);
      resultado.push({
        deck_id: baraja.deck_id,
        deck_name: baraja.deck_name,
        archivo,
      });
    } catch {
      // ignorar barajas con formato inválido
    }
  }
  return resultado;
}

export async function cargarBaraja(archivo: string): Promise<Baraja> {
  const res = await fetch(`/barajas/${archivo}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`No se pudo descargar la baraja: ${archivo}`);
  const raw = (await res.json()) as unknown;
  if (!validarBaraja(raw)) {
    throw new Error(`La baraja "${archivo}" no tiene el formato esperado.`);
  }
  return raw;
}

export function validarBaraja(b: unknown): b is Baraja {
  if (!b || typeof b !== 'object') return false;
  const o = b as Record<string, unknown>;
  if (typeof o.deck_id !== 'string') return false;
  if (typeof o.deck_name !== 'string') return false;
  if (!Array.isArray(o.questions) || o.questions.length === 0) return false;

  const idsVistos = new Set<number>();
  const porNivel = new Set<number>();
  for (const q of o.questions) {
    if (!q || typeof q !== 'object') return false;
    const p = q as Record<string, unknown>;
    if (typeof p.id !== 'number') return false;
    if (idsVistos.has(p.id)) return false;
    idsVistos.add(p.id);
    if (typeof p.nivel !== 'number' || ![1, 2, 3, 4, 5].includes(p.nivel)) return false;
    if (!Array.isArray(p.opciones) || p.opciones.length !== 4) return false;
    for (const op of p.opciones) {
      if (typeof op !== 'string') return false;
    }
    if (typeof p.correcta !== 'number' || ![0, 1, 2, 3].includes(p.correcta)) return false;
    if (typeof p.enunciado !== 'string') return false;
    if (typeof p.tema !== 'string') return false;
    if (typeof p.explicacion !== 'string') return false;
    porNivel.add(p.nivel);
  }
  for (const nivel of [1, 2, 3, 4, 5]) {
    if (!porNivel.has(nivel)) return false;
  }
  return true;
}

export function preguntasPorNivel(baraja: Baraja): Record<1 | 2 | 3 | 4 | 5, Pregunta[]> {
  const acc: Record<1 | 2 | 3 | 4 | 5, Pregunta[]> = {
    1: [], 2: [], 3: [], 4: [], 5: [],
  };
  for (const q of baraja.questions) {
    acc[q.nivel].push(q);
  }
  return acc;
}
