'use client';

import { create } from 'zustand';
import {
  ADYACENCIAS,
  COMARCAS,
  SIMBOLO_TERRITORIO,
  TERRITORIO_IDS,
} from './territorios';
import {
  calcularBajasAtacante,
  calcularBonusComarcas,
  calcularNivelPregunta,
  calcularPuntuacion,
  calcularRefuerzosBase,
  combinacionCanjeValida,
  contarTerritorios,
  hayCadenaPropia,
  puedeAtacar,
  rangoMovimientoConquista,
  tiempoLimitePorNivel,
  valorCanje,
  victoriaTotal,
} from './reglas';
import * as persistencia from './persistencia';
import { actualizarEstadoSala } from './online';
import type {
  Baraja,
  Carta,
  ConquistaPendiente,
  EstadoPartida,
  IndiceJugador,
  Jugador,
  Nivel,
  OcupacionTerritorio,
  Pregunta,
  PreguntaPendiente,
  TerritorioId,
} from './tipos';

const FICHAS_INICIALES_POR_JUGADOR = 35;

export type Modo = 'local' | 'online';

interface AccionesStore {
  iniciarPartida: (
    nombre1: string,
    nombre2: string,
    baraja1: Baraja,
    baraja2: Baraja,
    limiteRondas: number | null,
    repartoAleatorio: boolean,
  ) => void;
  cargarDesdeAlmacenamiento: () => boolean;
  abandonarPartida: () => void;

  // Online. El anfitrión configura nombres y barajas de AMBOS jugadores.
  iniciarSalaOnline: (
    nombre1: string,
    baraja1: Baraja,
    nombre2: string,
    baraja2: Baraja,
    codigo: string,
    limiteRondas: number | null,
    repartoAleatorio: boolean,
  ) => void;
  cargarSalaOnline: (codigo: string, miIndice: IndiceJugador, estado: EstadoPartida) => void;
  // El segundo jugador solo reclama su asiento; no cambia nombres ni barajas.
  unirseSalaOnline: (
    codigo: string,
    miIndice: IndiceJugador,
    estado: EstadoPartida,
  ) => Promise<void>;
  aplicarEstadoEntrante: (estado: EstadoPartida) => void;
  salirDeSala: () => void;

  colocarFichaInicial: (territorio: TerritorioId) => void;

  canjearCartas: (cartas: [Carta, Carta, Carta]) => void;
  colocarRefuerzo: (territorio: TerritorioId, n: number) => void;
  terminarRefuerzos: () => void;

  declararAtaque: (origen: TerritorioId, destino: TerritorioId, N: number) => void;
  registrarRespuesta: (opcion: 0 | 1 | 2 | 3 | 'timeout') => void;
  responderPregunta: (opcion: 0 | 1 | 2 | 3 | 'timeout') => void;
  moverTrasConquista: (cantidad: number) => void;
  limpiarResultadoPregunta: () => void;
  terminarAtaques: () => void;

  fortificar: (origen: TerritorioId, destino: TerritorioId, n: number) => void;
  pasarFortificacion: () => void;
}

interface EstadoStore {
  partida: EstadoPartida | null;
  modo: Modo;
  codigoSala: string | null;
  miIndice: IndiceJugador | null;
}

type Store = EstadoStore & AccionesStore;

function fisherYates<T>(arr: T[]): T[] {
  const copia = [...arr];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

function construirMazo(): Carta[] {
  const cartas: Carta[] = TERRITORIO_IDS.map((id) => ({
    id: `t:${id}`,
    territorio: id,
    simbolo: SIMBOLO_TERRITORIO[id],
  }));
  cartas.push({ id: 'comodin:1', territorio: null, simbolo: 'comodin' });
  cartas.push({ id: 'comodin:2', territorio: null, simbolo: 'comodin' });
  return fisherYates(cartas);
}

function repartirTerritoriosIniciales(): Record<TerritorioId, OcupacionTerritorio> {
  const orden = fisherYates(TERRITORIO_IDS);
  const ocupacion = {} as Record<TerritorioId, OcupacionTerritorio>;
  for (let i = 0; i < orden.length; i++) {
    const jugador: IndiceJugador = i % 2 === 0 ? 0 : 1;
    ocupacion[orden[i]] = { jugador, fichas: 1 };
  }
  return ocupacion;
}

// Reparte de forma aleatoria los refuerzos iniciales restantes (los que en el modo
// manual se colocan uno a uno) entre los territorios propios de cada jugador.
function repartirRefuerzosAleatorios(
  ocupacion: Record<TerritorioId, OcupacionTerritorio>,
): Record<TerritorioId, OcupacionTerritorio> {
  const resultado = {} as Record<TerritorioId, OcupacionTerritorio>;
  for (const id of TERRITORIO_IDS) resultado[id] = { ...ocupacion[id] };
  for (const jugador of [0, 1] as IndiceJugador[]) {
    const propios = TERRITORIO_IDS.filter((t) => resultado[t].jugador === jugador);
    let restantes = FICHAS_INICIALES_POR_JUGADOR - propios.length;
    while (restantes > 0) {
      const t = propios[Math.floor(Math.random() * propios.length)];
      resultado[t].fichas += 1;
      restantes--;
    }
  }
  return resultado;
}

function ocupacionDeJugador(
  ocupacion: Record<TerritorioId, OcupacionTerritorio>,
  jugador: IndiceJugador,
): TerritorioId[] {
  return TERRITORIO_IDS.filter((t) => ocupacion[t].jugador === jugador);
}

function comarcasArray() {
  return Object.values(COMARCAS);
}

function refuerzosBaseTurno(
  ocupacion: Record<TerritorioId, OcupacionTerritorio>,
  jugador: IndiceJugador,
): number {
  const base = calcularRefuerzosBase(contarTerritorios(ocupacion, jugador));
  const bonus = calcularBonusComarcas(ocupacion, jugador, comarcasArray());
  return base + bonus;
}

function elegirPreguntaAleatoria(
  baraja: Baraja,
  nivel: Nivel,
  usadas: Record<Nivel, number[]>,
): { pregunta: Pregunta; usadasActualizadas: Record<Nivel, number[]> } {
  const todasNivel = baraja.questions.filter((p) => p.nivel === nivel);
  let usadasNivel = usadas[nivel] ?? [];
  let disponibles = todasNivel.filter((p) => !usadasNivel.includes(p.id));
  if (disponibles.length === 0) {
    usadasNivel = [];
    disponibles = todasNivel;
  }
  const elegida = disponibles[Math.floor(Math.random() * disponibles.length)];
  const usadasActualizadas: Record<Nivel, number[]> = {
    ...usadas,
    [nivel]: [...usadasNivel, elegida.id],
  };
  return { pregunta: elegida, usadasActualizadas };
}

function robarCarta(
  mazo: Carta[],
  descarte: Carta[],
): { mazo: Carta[]; descarte: Carta[]; carta: Carta | null } {
  let mazoLocal = mazo;
  let descarteLocal = descarte;
  if (mazoLocal.length === 0) {
    if (descarteLocal.length === 0) {
      return { mazo: mazoLocal, descarte: descarteLocal, carta: null };
    }
    mazoLocal = fisherYates(descarteLocal);
    descarteLocal = [];
  }
  const carta = mazoLocal[mazoLocal.length - 1];
  return {
    mazo: mazoLocal.slice(0, -1),
    descarte: descarteLocal,
    carta,
  };
}

// Termina la partida al agotarse el límite de rondas: gana quien más puntos tenga
// (territorios + bonus por territorios clave); si hay empate, se marca como tal.
function finalizarPorLimite(partida: EstadoPartida): EstadoPartida {
  const p0 = calcularPuntuacion(partida.ocupacion, 0).total;
  const p1 = calcularPuntuacion(partida.ocupacion, 1).total;
  let ganador: IndiceJugador | null = null;
  let empate = false;
  if (p0 > p1) ganador = 0;
  else if (p1 > p0) ganador = 1;
  else empate = true;
  return {
    ...partida,
    ganador,
    empate,
    finPartida: Date.now(),
    preguntaActiva: null,
    conquistaPendiente: null,
    ultimoResultadoPregunta: null,
  };
}

function pasarTurno(partida: EstadoPartida): EstadoPartida {
  const siguiente: IndiceJugador = partida.turnoActual === 0 ? 1 : 0;
  // Una ronda se completa cuando el turno vuelve al jugador que la abrió.
  const rondaCompletada = siguiente === partida.jugadorInicial;
  const rondasJugadas = partida.rondasJugadas + (rondaCompletada ? 1 : 0);

  if (
    partida.limiteRondas !== null &&
    rondaCompletada &&
    rondasJugadas >= partida.limiteRondas
  ) {
    return finalizarPorLimite({ ...partida, rondasJugadas });
  }

  const refuerzosPendientes = refuerzosBaseTurno(partida.ocupacion, siguiente);
  return {
    ...partida,
    turnoActual: siguiente,
    fase: 'refuerzos',
    refuerzosPendientes,
    rondasJugadas,
    conquistaEsteTurno: false,
    fortificacionUsada: false,
    preguntaActiva: null,
    conquistaPendiente: null,
    ultimoResultadoPregunta: null,
  };
}

function construirEstadoInicial(
  nombre1: string,
  nombre2: string,
  baraja1: Baraja,
  baraja2: Baraja,
  limiteRondas: number | null,
  repartoAleatorio: boolean,
): EstadoPartida {
  const inicial: IndiceJugador = Math.random() < 0.5 ? 0 : 1;
  const jugadores: [Jugador, Jugador] = [
    { indice: 0, nombre: nombre1.trim().slice(0, 20), cartas: [] },
    { indice: 1, nombre: nombre2.trim().slice(0, 20), cartas: [] },
  ];
  const usadasVacias = (): Record<Nivel, number[]> => ({
    1: [], 2: [], 3: [], 4: [], 5: [],
  });

  // Reparto inicial: manual (colocación uno a uno) o aleatorio automático.
  let ocupacion = repartirTerritoriosIniciales();
  let fase: EstadoPartida['fase'] = 'colocacion-inicial';
  let fichasPorColocarInicial: [number, number] = [
    FICHAS_INICIALES_POR_JUGADOR - 13,
    FICHAS_INICIALES_POR_JUGADOR - 13,
  ];
  let refuerzosPendientes = 0;
  if (repartoAleatorio) {
    ocupacion = repartirRefuerzosAleatorios(ocupacion);
    fichasPorColocarInicial = [0, 0];
    fase = 'refuerzos';
    refuerzosPendientes = refuerzosBaseTurno(ocupacion, inicial);
  }

  return {
    version: 3,
    jugadores,
    jugador2Unido: true,
    turnoActual: inicial,
    jugadorInicial: inicial,
    limiteRondas,
    rondasJugadas: 0,
    empate: false,
    fase,
    ocupacion,
    refuerzosPendientes,
    fichasPorColocarInicial,
    mazoCartas: construirMazo(),
    descarteCartas: [],
    canjesRealizados: 0,
    preguntasUsadas: [usadasVacias(), usadasVacias()],
    conquistaEsteTurno: false,
    fortificacionUsada: false,
    preguntaActiva: null,
    conquistaPendiente: null,
    barajas: [baraja1, baraja2],
    inicioPartida: Date.now(),
    finPartida: null,
    ganador: null,
    ultimoResultadoPregunta: null,
  };
}

export const useStore = create<Store>((set, get) => {
  const aplicar = (estado: EstadoPartida) => {
    set({ partida: estado });
    const { modo, codigoSala } = get();
    if (modo === 'local') {
      persistencia.guardar(estado);
    } else if (modo === 'online' && codigoSala) {
      void actualizarEstadoSala(codigoSala, estado).catch((e) => {
        console.error('Error sincronizando partida:', e);
      });
    }
  };

  return {
    partida: null,
    modo: 'local',
    codigoSala: null,
    miIndice: null,

    iniciarPartida: (nombre1, nombre2, baraja1, baraja2, limiteRondas, repartoAleatorio) => {
      const estado = construirEstadoInicial(
        nombre1, nombre2, baraja1, baraja2, limiteRondas, repartoAleatorio,
      );
      set({ modo: 'local', codigoSala: null, miIndice: null });
      aplicar(estado);
    },

    cargarDesdeAlmacenamiento: () => {
      const cargado = persistencia.cargar();
      if (cargado) {
        set({ partida: cargado, modo: 'local', codigoSala: null, miIndice: null });
        return true;
      }
      return false;
    },

    abandonarPartida: () => {
      const { modo } = get();
      if (modo === 'local') {
        persistencia.borrar();
      }
      set({ partida: null, modo: 'local', codigoSala: null, miIndice: null });
    },

    iniciarSalaOnline: (nombre1, baraja1, nombre2, baraja2, codigo, limiteRondas, repartoAleatorio) => {
      // El anfitrión define ya los dos jugadores y las dos barajas. El estado
      // queda completo; solo falta que el segundo jugador reclame su asiento.
      const base = construirEstadoInicial(
        nombre1, nombre2, baraja1, baraja2, limiteRondas, repartoAleatorio,
      );
      const estado: EstadoPartida = { ...base, jugador2Unido: false };
      set({
        partida: estado,
        modo: 'online',
        codigoSala: codigo,
        miIndice: 0,
      });
    },

    cargarSalaOnline: (codigo, miIndice, estado) => {
      set({
        partida: estado,
        modo: 'online',
        codigoSala: codigo,
        miIndice,
      });
    },

    unirseSalaOnline: async (codigo, miIndice, estado) => {
      // El segundo jugador acepta la configuración del anfitrión: solo marca
      // que se ha unido. Nombres y barajas no se tocan.
      const nuevo: EstadoPartida = { ...estado, jugador2Unido: true };
      set({
        partida: nuevo,
        modo: 'online',
        codigoSala: codigo,
        miIndice,
      });
      await actualizarEstadoSala(codigo, nuevo);
    },

    aplicarEstadoEntrante: (estado) => {
      // El estado entrante (SSE) viene "ligero": las barajas no traen preguntas.
      // Conservamos las barajas completas que ya tenemos cargadas en memoria.
      const actual = get().partida;
      const entranteLigero = !estado.barajas?.[0]?.questions?.length;
      const barajas =
        entranteLigero && actual?.barajas ? actual.barajas : estado.barajas;
      set({ partida: { ...estado, barajas } });
    },

    salirDeSala: () => {
      set({ partida: null, modo: 'local', codigoSala: null, miIndice: null });
    },

    colocarFichaInicial: (territorio) => {
      const partida = get().partida;
      if (!partida || partida.fase !== 'colocacion-inicial') return;
      if (partida.ocupacion[territorio].jugador !== partida.turnoActual) return;
      const restantes = partida.fichasPorColocarInicial[partida.turnoActual];
      if (restantes <= 0) return;

      const ocupacion = {
        ...partida.ocupacion,
        [territorio]: {
          ...partida.ocupacion[territorio],
          fichas: partida.ocupacion[territorio].fichas + 1,
        },
      };
      const fichas: [number, number] = [...partida.fichasPorColocarInicial] as [number, number];
      fichas[partida.turnoActual] = restantes - 1;

      const otro: IndiceJugador = partida.turnoActual === 0 ? 1 : 0;

      let siguienteFase: EstadoPartida['fase'] = 'colocacion-inicial';
      let siguienteTurno: IndiceJugador = partida.turnoActual;
      let refuerzosPendientes = 0;

      if (fichas[0] === 0 && fichas[1] === 0) {
        siguienteFase = 'refuerzos';
        siguienteTurno = otro;
        refuerzosPendientes = refuerzosBaseTurno(ocupacion, siguienteTurno);
      } else if (fichas[otro] > 0) {
        siguienteTurno = otro;
      } else {
        siguienteTurno = partida.turnoActual;
      }

      aplicar({
        ...partida,
        ocupacion,
        fichasPorColocarInicial: fichas,
        turnoActual: siguienteTurno,
        fase: siguienteFase,
        refuerzosPendientes,
      });
    },

    canjearCartas: (cartas) => {
      const partida = get().partida;
      if (!partida || partida.fase !== 'refuerzos') return;
      const jugadorActual = partida.jugadores[partida.turnoActual];
      for (const c of cartas) {
        if (!jugadorActual.cartas.some((cc) => cc.id === c.id)) return;
      }
      if (!combinacionCanjeValida([...cartas])) return;

      const numeroCanje = partida.canjesRealizados + 1;
      const valor = valorCanje(numeroCanje);

      let bonusTerritorio: TerritorioId | null = null;
      for (const c of cartas) {
        if (c.territorio && partida.ocupacion[c.territorio].jugador === partida.turnoActual) {
          bonusTerritorio = c.territorio;
          break;
        }
      }

      const cartasIds = new Set(cartas.map((c) => c.id));
      const nuevasCartasJugador = jugadorActual.cartas.filter((c) => !cartasIds.has(c.id));
      const jugadores: [Jugador, Jugador] = [partida.jugadores[0], partida.jugadores[1]];
      jugadores[partida.turnoActual] = { ...jugadorActual, cartas: nuevasCartasJugador };

      let ocupacion = partida.ocupacion;
      if (bonusTerritorio) {
        ocupacion = {
          ...ocupacion,
          [bonusTerritorio]: {
            ...ocupacion[bonusTerritorio],
            fichas: ocupacion[bonusTerritorio].fichas + 2,
          },
        };
      }

      aplicar({
        ...partida,
        jugadores,
        ocupacion,
        canjesRealizados: numeroCanje,
        refuerzosPendientes: partida.refuerzosPendientes + valor,
        descarteCartas: [...partida.descarteCartas, ...cartas],
      });
    },

    colocarRefuerzo: (territorio, n) => {
      const partida = get().partida;
      if (!partida || partida.fase !== 'refuerzos') return;
      if (partida.ocupacion[territorio].jugador !== partida.turnoActual) return;
      if (n < 1) return;
      if (n > partida.refuerzosPendientes) return;

      aplicar({
        ...partida,
        ocupacion: {
          ...partida.ocupacion,
          [territorio]: {
            ...partida.ocupacion[territorio],
            fichas: partida.ocupacion[territorio].fichas + n,
          },
        },
        refuerzosPendientes: partida.refuerzosPendientes - n,
      });
    },

    terminarRefuerzos: () => {
      const partida = get().partida;
      if (!partida || partida.fase !== 'refuerzos') return;
      if (partida.refuerzosPendientes > 0) return;
      if (partida.jugadores[partida.turnoActual].cartas.length >= 5) return;

      aplicar({ ...partida, fase: 'ataques' });
    },

    declararAtaque: (origen, destino, N) => {
      const partida = get().partida;
      if (!partida || partida.fase !== 'ataques') return;
      if (partida.preguntaActiva) return;
      if (partida.conquistaPendiente) return;
      if (!puedeAtacar(partida.ocupacion, partida.turnoActual, origen, destino, ADYACENCIAS)) return;
      const fichasOrigen = partida.ocupacion[origen].fichas;
      if (N < 1 || N > fichasOrigen - 1) return;
      const defensores = partida.ocupacion[destino].fichas;
      const nivel = calcularNivelPregunta(N, defensores);
      const tiempoLimiteS = tiempoLimitePorNivel(nivel);
      const defensorIndice: IndiceJugador = partida.turnoActual === 0 ? 1 : 0;
      const barajaDefensor = partida.barajas[defensorIndice];
      const usadasDefensor = partida.preguntasUsadas[defensorIndice];
      const { pregunta, usadasActualizadas } = elegirPreguntaAleatoria(
        barajaDefensor,
        nivel,
        usadasDefensor,
      );
      const pendiente: PreguntaPendiente = {
        preguntaId: pregunta.id,
        territorioAtacante: origen,
        territorioDefensor: destino,
        defensorIndice,
        atacantesN: N,
        defensores,
        nivel,
        tiempoLimiteS,
        iniciadoEn: Date.now(),
        respuesta: null,
      };
      const nuevasUsadas: [Record<Nivel, number[]>, Record<Nivel, number[]>] = [
        partida.preguntasUsadas[0],
        partida.preguntasUsadas[1],
      ];
      nuevasUsadas[defensorIndice] = usadasActualizadas;
      aplicar({
        ...partida,
        preguntaActiva: pendiente,
        preguntasUsadas: nuevasUsadas,
        ultimoResultadoPregunta: null,
      });
    },

    registrarRespuesta: (opcion) => {
      const partida = get().partida;
      if (!partida || !partida.preguntaActiva) return;
      if (partida.preguntaActiva.respuesta != null) return; // ya respondida
      // Sincroniza la opción elegida (sin resolver aún) para que el rival la vea.
      aplicar({
        ...partida,
        preguntaActiva: { ...partida.preguntaActiva, respuesta: opcion },
      });
    },

    responderPregunta: (opcion) => {
      const partida = get().partida;
      if (!partida || !partida.preguntaActiva) return;
      const pendiente = partida.preguntaActiva;
      const baraja = partida.barajas[pendiente.defensorIndice];
      const pregunta = baraja.questions.find((p) => p.id === pendiente.preguntaId);
      if (!pregunta) return;
      const defensorAcierta = opcion !== 'timeout' && opcion === pregunta.correcta;
      const explicacion = pregunta.explicacion;

      let ocupacion = partida.ocupacion;
      let conquistaPendiente: ConquistaPendiente | null = null;
      let conquistaEsteTurno = partida.conquistaEsteTurno;

      if (defensorAcierta) {
        const bajas = calcularBajasAtacante(pendiente.atacantesN);
        ocupacion = {
          ...ocupacion,
          [pendiente.territorioDefensor]: {
            ...ocupacion[pendiente.territorioDefensor],
            fichas: ocupacion[pendiente.territorioDefensor].fichas + 1,
          },
          [pendiente.territorioAtacante]: {
            ...ocupacion[pendiente.territorioAtacante],
            fichas: ocupacion[pendiente.territorioAtacante].fichas - bajas,
          },
        };
      } else {
        ocupacion = {
          ...ocupacion,
          [pendiente.territorioDefensor]: {
            jugador: partida.turnoActual,
            fichas: 0,
          },
        };
        const { min, max } = rangoMovimientoConquista(pendiente.atacantesN);
        conquistaPendiente = {
          territorioOrigen: pendiente.territorioAtacante,
          territorioDestino: pendiente.territorioDefensor,
          atacantesN: pendiente.atacantesN,
          minMover: min,
          maxMover: max,
        };
        conquistaEsteTurno = true;
      }

      aplicar({
        ...partida,
        ocupacion,
        preguntaActiva: null,
        conquistaPendiente,
        conquistaEsteTurno,
        ultimoResultadoPregunta: {
          opcionElegida: opcion,
          correcta: pregunta.correcta,
          acierto: defensorAcierta,
          explicacion,
          territorioAtacante: pendiente.territorioAtacante,
          territorioDefensor: pendiente.territorioDefensor,
        },
      });
    },

    moverTrasConquista: (cantidad) => {
      const partida = get().partida;
      if (!partida || !partida.conquistaPendiente) return;
      const cp = partida.conquistaPendiente;
      if (cantidad < cp.minMover || cantidad > cp.maxMover) return;
      const ocupacion = {
        ...partida.ocupacion,
        [cp.territorioOrigen]: {
          ...partida.ocupacion[cp.territorioOrigen],
          fichas: partida.ocupacion[cp.territorioOrigen].fichas - cantidad,
        },
        [cp.territorioDestino]: {
          jugador: partida.turnoActual,
          fichas: cantidad,
        },
      };
      let ganador: IndiceJugador | null = partida.ganador;
      let finPartida = partida.finPartida;
      if (victoriaTotal(ocupacion, partida.turnoActual)) {
        ganador = partida.turnoActual;
        finPartida = Date.now();
      }
      aplicar({
        ...partida,
        ocupacion,
        conquistaPendiente: null,
        ganador,
        finPartida,
      });
    },

    limpiarResultadoPregunta: () => {
      const partida = get().partida;
      if (!partida) return;
      if (partida.ultimoResultadoPregunta === null) return;
      aplicar({ ...partida, ultimoResultadoPregunta: null });
    },

    terminarAtaques: () => {
      const partida = get().partida;
      if (!partida || partida.fase !== 'ataques') return;
      if (partida.preguntaActiva || partida.conquistaPendiente) return;

      let mazo = partida.mazoCartas;
      let descarte = partida.descarteCartas;
      const jugadores: [Jugador, Jugador] = [partida.jugadores[0], partida.jugadores[1]];
      if (partida.conquistaEsteTurno) {
        const { mazo: m2, descarte: d2, carta } = robarCarta(mazo, descarte);
        mazo = m2;
        descarte = d2;
        if (carta) {
          jugadores[partida.turnoActual] = {
            ...jugadores[partida.turnoActual],
            cartas: [...jugadores[partida.turnoActual].cartas, carta],
          };
        }
      }

      aplicar({
        ...partida,
        jugadores,
        mazoCartas: mazo,
        descarteCartas: descarte,
        fase: 'fortificacion',
      });
    },

    fortificar: (origen, destino, n) => {
      const partida = get().partida;
      if (!partida || partida.fase !== 'fortificacion') return;
      if (partida.fortificacionUsada) return;
      if (partida.ocupacion[origen].jugador !== partida.turnoActual) return;
      if (partida.ocupacion[destino].jugador !== partida.turnoActual) return;
      if (n < 1) return;
      if (partida.ocupacion[origen].fichas - n < 1) return;
      if (!hayCadenaPropia(partida.ocupacion, partida.turnoActual, origen, destino, ADYACENCIAS)) return;

      const ocupacion = {
        ...partida.ocupacion,
        [origen]: {
          ...partida.ocupacion[origen],
          fichas: partida.ocupacion[origen].fichas - n,
        },
        [destino]: {
          ...partida.ocupacion[destino],
          fichas: partida.ocupacion[destino].fichas + n,
        },
      };
      const nuevo: EstadoPartida = pasarTurno({
        ...partida,
        ocupacion,
        fortificacionUsada: true,
      });
      aplicar(nuevo);
    },

    pasarFortificacion: () => {
      const partida = get().partida;
      if (!partida || partida.fase !== 'fortificacion') return;
      aplicar(pasarTurno(partida));
    },
  };
});

export function selectorOcupacionDeJugador(
  estado: EstadoPartida,
  jugador: IndiceJugador,
): TerritorioId[] {
  return ocupacionDeJugador(estado.ocupacion, jugador);
}

export function partidaTerminada(partida: EstadoPartida): boolean {
  return partida.ganador !== null || partida.empate;
}

export function puedoActuar(
  partida: EstadoPartida,
  modo: Modo,
  miIndice: IndiceJugador | null,
): boolean {
  if (partidaTerminada(partida)) return false;
  if (modo === 'local') return true;
  if (miIndice === null) return false;
  // En modo online: durante una pregunta activa, sólo el defensor (no turno) escribe la respuesta.
  if (partida.preguntaActiva) {
    return miIndice !== partida.turnoActual;
  }
  return miIndice === partida.turnoActual;
}
