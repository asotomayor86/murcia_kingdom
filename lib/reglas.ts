import type {
  Carta,
  Comarca,
  IndiceJugador,
  Nivel,
  OcupacionTerritorio,
  SimboloCarta,
  TerritorioId,
} from './tipos';

export function calcularNivelPregunta(N: number, defensores: number): Nivel {
  const D = N - defensores;
  if (D <= -3) return 1;
  if (D <= 0) return 2;
  if (D <= 4) return 3;
  if (D <= 9) return 4;
  return 5;
}

export function tiempoLimitePorNivel(nivel: Nivel): number {
  switch (nivel) {
    case 1:
    case 2:
    case 3:
      return 30;
    case 4:
      return 45;
    case 5:
      return 60;
  }
}

export function calcularBajasAtacante(N: number): number {
  return Math.ceil(N / 2);
}

export function rangoMovimientoConquista(N: number): { min: number; max: number } {
  return { min: Math.min(3, N), max: N };
}

export function calcularRefuerzosBase(territoriosPropietario: number): number {
  return Math.max(3, Math.floor(territoriosPropietario / 3));
}

export function comarcaCompleta(
  ocupacion: Record<TerritorioId, OcupacionTerritorio>,
  jugador: IndiceJugador,
  comarca: Comarca,
): boolean {
  return comarca.territorios.every((t) => ocupacion[t].jugador === jugador);
}

export function calcularBonusComarcas(
  ocupacion: Record<TerritorioId, OcupacionTerritorio>,
  jugador: IndiceJugador,
  comarcas: Comarca[],
): number {
  return comarcas.reduce(
    (sum, c) => sum + (comarcaCompleta(ocupacion, jugador, c) ? c.bonus : 0),
    0,
  );
}

export function valorCanje(numeroCanjeGlobal: number): number {
  // numeroCanjeGlobal: 1, 2, 3, ...
  if (numeroCanjeGlobal <= 0) return 0;
  if (numeroCanjeGlobal === 1) return 4;
  if (numeroCanjeGlobal === 2) return 6;
  if (numeroCanjeGlobal === 3) return 8;
  if (numeroCanjeGlobal === 4) return 10;
  if (numeroCanjeGlobal === 5) return 12;
  if (numeroCanjeGlobal === 6) return 15;
  // 7+: +5 each step (20, 25, 30, ...)
  return 15 + 5 * (numeroCanjeGlobal - 6);
}

export function combinacionCanjeValida(cartas: Carta[]): boolean {
  if (cartas.length !== 3) return false;
  const simbolos = cartas.map((c) => c.simbolo);
  const comodines = simbolos.filter((s) => s === 'comodin').length;
  const reales = simbolos.filter((s) => s !== 'comodin') as Exclude<SimboloCarta, 'comodin'>[];

  // Caso 1: tres iguales (con comodines sustituyendo).
  // Para que sean "tres iguales", todos los símbolos reales deben coincidir.
  if (reales.length === 0) return true; // 3 comodines (en este juego solo hay 2, pero por completitud)
  const todosIguales = reales.every((s) => s === reales[0]);
  if (todosIguales) return true;

  // Caso 2: una de cada (con comodines sustituyendo a los que falten).
  const distintos = new Set(reales);
  if (distintos.size + comodines >= 3) {
    // distintos.size === 3 (sin comodines), o ===2 con 1 comodín que cubre el faltante,
    // o ===1 con 2 comodines que cubren los otros dos tipos.
    return true;
  }
  return false;
}

export function puedeAtacar(
  ocupacion: Record<TerritorioId, OcupacionTerritorio>,
  jugador: IndiceJugador,
  origen: TerritorioId,
  destino: TerritorioId,
  adyacencias: Record<TerritorioId, TerritorioId[]>,
): boolean {
  if (origen === destino) return false;
  const o = ocupacion[origen];
  const d = ocupacion[destino];
  if (!o || !d) return false;
  if (o.jugador !== jugador) return false;
  if (d.jugador === jugador) return false;
  if (o.fichas < 2) return false;
  return adyacencias[origen].includes(destino);
}

export function hayCadenaPropia(
  ocupacion: Record<TerritorioId, OcupacionTerritorio>,
  jugador: IndiceJugador,
  origen: TerritorioId,
  destino: TerritorioId,
  adyacencias: Record<TerritorioId, TerritorioId[]>,
): boolean {
  if (origen === destino) return false;
  if (ocupacion[origen].jugador !== jugador) return false;
  if (ocupacion[destino].jugador !== jugador) return false;
  const visitados = new Set<TerritorioId>([origen]);
  const cola: TerritorioId[] = [origen];
  while (cola.length > 0) {
    const actual = cola.shift() as TerritorioId;
    for (const vecino of adyacencias[actual]) {
      if (visitados.has(vecino)) continue;
      if (ocupacion[vecino].jugador !== jugador) continue;
      if (vecino === destino) return true;
      visitados.add(vecino);
      cola.push(vecino);
    }
  }
  return false;
}

export function victoriaTotal(
  ocupacion: Record<TerritorioId, OcupacionTerritorio>,
  jugador: IndiceJugador,
): boolean {
  return Object.values(ocupacion).every((o) => o.jugador === jugador);
}

// Puntos extra por controlar territorios clave al final de la partida.
export const PUNTOS_TERRITORIO_CLAVE: Partial<Record<TerritorioId, number>> = {
  murcia: 2,
  cartagena: 2,
  lorca: 1,
};

export interface Puntuacion {
  territorios: number;
  bonus: number;
  total: number;
  claves: TerritorioId[];
}

// Puntuación de fin de partida: 1 punto por territorio + bonus por territorios clave.
export function calcularPuntuacion(
  ocupacion: Record<TerritorioId, OcupacionTerritorio>,
  jugador: IndiceJugador,
): Puntuacion {
  const territorios = contarTerritorios(ocupacion, jugador);
  let bonus = 0;
  const claves: TerritorioId[] = [];
  for (const id of Object.keys(PUNTOS_TERRITORIO_CLAVE) as TerritorioId[]) {
    if (ocupacion[id]?.jugador === jugador) {
      bonus += PUNTOS_TERRITORIO_CLAVE[id]!;
      claves.push(id);
    }
  }
  return { territorios, bonus, total: territorios + bonus, claves };
}

export function contarTerritorios(
  ocupacion: Record<TerritorioId, OcupacionTerritorio>,
  jugador: IndiceJugador,
): number {
  return Object.values(ocupacion).filter((o) => o.jugador === jugador).length;
}

export function contarFichas(
  ocupacion: Record<TerritorioId, OcupacionTerritorio>,
  jugador: IndiceJugador,
): number {
  return Object.values(ocupacion).reduce(
    (sum, o) => sum + (o.jugador === jugador ? o.fichas : 0),
    0,
  );
}
