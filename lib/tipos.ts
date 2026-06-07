export type TerritorioId =
  | 'moratalla' | 'calasparra' | 'cieza' | 'jumilla' | 'yecla'
  | 'caravaca' | 'cehegin-bullas' | 'valle-ricote' | 'archena'
  | 'molina' | 'vega-media' | 'santomera-beniel'
  | 'mula' | 'alcantarilla' | 'murcia'
  | 'lorca' | 'alhama-librilla' | 'totana' | 'fuente-alamo'
  | 'torre-pacheco' | 'mar-menor'
  | 'puerto-lumbreras' | 'aguilas' | 'mazarron' | 'cartagena' | 'la-union';

export type ComarcaId =
  | 'altiplano'
  | 'noroeste'
  | 'vega-alta'
  | 'rio-mula'
  | 'vega-media'
  | 'huerta'
  | 'guadalentin'
  | 'costa-calida'
  | 'campo-cartagena'
  | 'mar-menor';

export type SimboloCarta = 'soldado' | 'jinete' | 'artilleria' | 'comodin';
export type Nivel = 1 | 2 | 3 | 4 | 5;
export type IndiceJugador = 0 | 1;

export interface Territorio {
  id: TerritorioId;
  nombre: string;
  comarca: ComarcaId;
  simboloCarta: Exclude<SimboloCarta, 'comodin'>;
  poligono: string;
  centro: { x: number; y: number };
}

export interface Comarca {
  id: ComarcaId;
  nombre: string;
  territorios: TerritorioId[];
  bonus: number;
  colorBase: string;
}

export interface Carta {
  id: string;
  territorio: TerritorioId | null;
  simbolo: SimboloCarta;
}

export interface Jugador {
  indice: IndiceJugador;
  nombre: string;
  cartas: Carta[];
}

export interface OcupacionTerritorio {
  jugador: IndiceJugador;
  fichas: number;
}

export type Fase =
  | 'colocacion-inicial'
  | 'refuerzos'
  | 'ataques'
  | 'fortificacion';

export interface PreguntaPendiente {
  preguntaId: number;
  territorioAtacante: TerritorioId;
  territorioDefensor: TerritorioId;
  defensorIndice: IndiceJugador;
  atacantesN: number;
  defensores: number;
  nivel: Nivel;
  tiempoLimiteS: number;
  iniciadoEn: number;
  /**
   * Opción que ha pulsado el defensor (o 'timeout'). Se sincroniza para que el
   * rival vea la respuesta antes de resolver la batalla. null = aún sin responder.
   */
  respuesta?: 0 | 1 | 2 | 3 | 'timeout' | null;
}

export interface ConquistaPendiente {
  territorioOrigen: TerritorioId;
  territorioDestino: TerritorioId;
  atacantesN: number;
  minMover: number;
  maxMover: number;
}

export interface EstadoPartida {
  version: 3;
  jugadores: [Jugador, Jugador];
  /**
   * En partidas online indica si el segundo jugador ya reclamó su asiento.
   * En partidas locales siempre es `true` (ambos jugadores presentes desde el
   * inicio). El anfitrión configura nombres y barajas de los dos jugadores.
   */
  jugador2Unido: boolean;
  turnoActual: IndiceJugador;
  /** Jugador que abrió la primera ronda (para contar rondas completas). */
  jugadorInicial: IndiceJugador;
  /** Nº de rondas completas que durará la partida. null = sin límite (conquista total). */
  limiteRondas: number | null;
  /** Rondas completas ya jugadas (ambos jugadores han jugado). */
  rondasJugadas: number;
  /** La partida terminó por límite de rondas con empate a puntos. */
  empate: boolean;
  fase: Fase;
  ocupacion: Record<TerritorioId, OcupacionTerritorio>;
  refuerzosPendientes: number;
  fichasPorColocarInicial: [number, number];
  mazoCartas: Carta[];
  descarteCartas: Carta[];
  canjesRealizados: number;
  preguntasUsadas: [Record<Nivel, number[]>, Record<Nivel, number[]>];
  conquistaEsteTurno: boolean;
  fortificacionUsada: boolean;
  preguntaActiva: PreguntaPendiente | null;
  conquistaPendiente: ConquistaPendiente | null;
  barajas: [Baraja, Baraja];
  inicioPartida: number;
  finPartida: number | null;
  ganador: IndiceJugador | null;
  ultimoResultadoPregunta:
    | {
        opcionElegida: 0 | 1 | 2 | 3 | 'timeout';
        correcta: 0 | 1 | 2 | 3;
        acierto: boolean;
        explicacion: string;
        territorioAtacante: TerritorioId;
        territorioDefensor: TerritorioId;
      }
    | null;
}

export interface Pregunta {
  id: number;
  nivel: Nivel;
  tema: string;
  enunciado: string;
  opciones: [string, string, string, string];
  correcta: 0 | 1 | 2 | 3;
  explicacion: string;
}

export interface Baraja {
  deck_id: string;
  deck_name: string;
  description: string;
  version: string;
  language: string;
  themes: string[];
  levels: Record<string, string>;
  questions: Pregunta[];
}
