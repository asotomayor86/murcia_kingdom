import { COMARCA_DE_TERRITORIO, POLIGONOS, TERRITORIO_IDS } from './territorios';
import type { TerritorioId } from './tipos';

export interface Segmento {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

type Punto = [number, number];

function parsear(s: string): Punto[] {
  return s
    .trim()
    .split(/\s+/)
    .map((p) => {
      const [x, y] = p.split(',').map(Number);
      return [x, y] as Punto;
    });
}

const POLY: Record<TerritorioId, Punto[]> = TERRITORIO_IDS.reduce(
  (acc, id) => {
    acc[id] = parsear(POLIGONOS[id]);
    return acc;
  },
  {} as Record<TerritorioId, Punto[]>,
);

// Test punto-en-polígono (ray casting).
function dentro(x: number, y: number, ps: Punto[]): boolean {
  let c = false;
  for (let i = 0, j = ps.length - 1; i < ps.length; j = i++) {
    const [xi, yi] = ps[i];
    const [xj, yj] = ps[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      c = !c;
    }
  }
  return c;
}

function territorioEn(x: number, y: number): TerritorioId | null {
  for (const id of TERRITORIO_IDS) {
    if (dentro(x, y, POLY[id])) return id;
  }
  return null;
}

// Para cada arista de cada municipio desplazamos su punto medio ligeramente hacia
// afuera y miramos qué municipio hay al otro lado. Esto clasifica cada arista como
// interna (mismo color de comarca), frontera (comarca distinta) o exterior (mapa),
// y es robusto frente a T-junctions (aristas largas que limitan con varias cortas).
const EPS = 1.5;

function calcular(): { comarca: Segmento[]; exterior: Segmento[] } {
  const comarca: Segmento[] = [];
  const exterior: Segmento[] = [];
  const vistos = new Set<string>();

  for (const id of TERRITORIO_IDS) {
    const ps = POLY[id];
    const comarcaId = COMARCA_DE_TERRITORIO[id];
    for (let i = 0; i < ps.length; i++) {
      const a = ps[i];
      const b = ps[(i + 1) % ps.length];
      const mx = (a[0] + b[0]) / 2;
      const my = (a[1] + b[1]) / 2;
      // Normal a la arista, normalizada.
      let nx = -(b[1] - a[1]);
      let ny = b[0] - a[0];
      const len = Math.hypot(nx, ny) || 1;
      nx /= len;
      ny /= len;
      // Asegurar que apunta hacia afuera del propio municipio.
      if (dentro(mx + nx * EPS, my + ny * EPS, ps)) {
        nx = -nx;
        ny = -ny;
      }
      const vecino = territorioEn(mx + nx * EPS, my + ny * EPS);
      const seg: Segmento = { x1: a[0], y1: a[1], x2: b[0], y2: b[1] };

      if (vecino === null) {
        exterior.push(seg);
      } else if (COMARCA_DE_TERRITORIO[vecino] !== comarcaId) {
        // Deduplicar la arista compartida idéntica (se detecta desde ambos lados).
        const clave =
          a[0] < b[0] || (a[0] === b[0] && a[1] <= b[1])
            ? `${a[0]},${a[1]}-${b[0]},${b[1]}`
            : `${b[0]},${b[1]}-${a[0]},${a[1]}`;
        if (!vistos.has(clave)) {
          vistos.add(clave);
          comarca.push(seg);
        }
      }
    }
  }

  return { comarca, exterior };
}

const fronteras = calcular();

/** Aristas que separan dos comarcas distintas. Se dibujan con trazo grueso. */
export const FRONTERAS_COMARCA: Segmento[] = fronteras.comarca;

/** Aristas del contorno del mapa (costa / límite regional). */
export const BORDE_EXTERIOR: Segmento[] = fronteras.exterior;
