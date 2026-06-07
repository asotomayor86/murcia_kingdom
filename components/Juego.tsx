'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { MapaMurcia, type NumeroCombate } from './Map/MapaMurcia';
import { PanelJugador } from './PanelJugador';
import { PanelComarcas } from './PanelComarcas';
import { PanelFase } from './PanelFase';
import { BarraTurno } from './BarraTurno';
import { DialogoColocacion } from './DialogoColocacion';
import { DialogoAtaque } from './DialogoAtaque';
import { DialogoPregunta } from './DialogoPregunta';
import { DialogoMoverConquista } from './DialogoMoverConquista';
import { DialogoFortificacion } from './DialogoFortificacion';
import { DialogoCanjeCartas } from './DialogoCanjeCartas';
import { Modal } from './ui/Modal';
import { Boton } from './ui/Boton';
import { AnuncioFase, type Anuncio } from './AnuncioFase';
import { useStore, puedoActuar, partidaTerminada } from '@/lib/store';
import { ADYACENCIAS, COLOR_JUGADOR, NOMBRES_TERRITORIO } from '@/lib/territorios';
import { calcularPuntuacion, hayCadenaPropia, puedeAtacar } from '@/lib/reglas';
import type { ComarcaId, Fase, IndiceJugador, TerritorioId } from '@/lib/tipos';

interface Props {
  onSalir: () => void;
  banner?: React.ReactNode;
}

export function Juego({ onSalir, banner }: Props) {
  const partida = useStore((s) => s.partida);
  const modo = useStore((s) => s.modo);
  const miIndice = useStore((s) => s.miIndice);

  const colocarFichaInicial = useStore((s) => s.colocarFichaInicial);
  const colocarRefuerzo = useStore((s) => s.colocarRefuerzo);
  const terminarRefuerzos = useStore((s) => s.terminarRefuerzos);
  const declararAtaque = useStore((s) => s.declararAtaque);
  const responderPregunta = useStore((s) => s.responderPregunta);
  const moverTrasConquista = useStore((s) => s.moverTrasConquista);
  const terminarAtaques = useStore((s) => s.terminarAtaques);
  const fortificar = useStore((s) => s.fortificar);
  const pasarFortificacion = useStore((s) => s.pasarFortificacion);
  const canjearCartas = useStore((s) => s.canjearCartas);

  const [origenSeleccionado, setOrigenSeleccionado] = useState<TerritorioId | null>(null);
  const [destinoAtaque, setDestinoAtaque] = useState<TerritorioId | null>(null);
  const [destinoFortificacion, setDestinoFortificacion] = useState<TerritorioId | null>(null);
  const [colocando, setColocando] = useState<TerritorioId | null>(null);
  const [canjeAbierto, setCanjeAbierto] = useState(false);
  const [confirmarSalir, setConfirmarSalir] = useState(false);
  const [recienConquistados, setRecienConquistados] = useState<Set<TerritorioId>>(new Set());
  const [conquistasAnim, setConquistasAnim] = useState<Map<TerritorioId, IndiceJugador>>(new Map());
  const [numerosCombate, setNumerosCombate] = useState<NumeroCombate[]>([]);
  const [comarcaResaltada, setComarcaResaltada] = useState<ComarcaId | null>(null);
  const [anuncio, setAnuncio] = useState<Anuncio | null>(null);
  const faseAnteriorRef = useRef<Fase | null>(null);
  const anuncioIdRef = useRef(0);
  const ocupacionAnteriorRef = useRef<Record<TerritorioId, { jugador: IndiceJugador; fichas: number }> | null>(null);
  // Cambios de propietario pendientes de animar: id -> dueño anterior.
  const pendientesAnimacionRef = useRef<Map<TerritorioId, IndiceJugador>>(new Map());
  // Foto de las tropas al iniciar una batalla, para calcular los números de combate.
  const batallaSnapshotRef = useRef<{
    atacante: TerritorioId;
    defensor: TerritorioId;
    fichasAtacante: number;
    fichasDefensor: number;
    duenoDefensor: IndiceJugador;
  } | null>(null);
  const numeroIdRef = useRef(0);
  // Foto de tropas para animar "+N" flotante al colocar refuerzos / colocación inicial.
  const fichasRefuerzoRef = useRef<Record<TerritorioId, number> | null>(null);

  // 0. Al iniciar una batalla, fotografiar las tropas implicadas (estado previo).
  useEffect(() => {
    if (!partida?.preguntaActiva) return;
    const pa = partida.preguntaActiva;
    batallaSnapshotRef.current = {
      atacante: pa.territorioAtacante,
      defensor: pa.territorioDefensor,
      fichasAtacante: partida.ocupacion[pa.territorioAtacante].fichas,
      fichasDefensor: partida.ocupacion[pa.territorioDefensor].fichas,
      duenoDefensor: partida.ocupacion[pa.territorioDefensor].jugador,
    };
  }, [partida?.preguntaActiva]); // eslint-disable-line react-hooks/exhaustive-deps

  // 1. Detectar cambios de propietario y encolarlos (guardando el dueño anterior).
  useEffect(() => {
    if (!partida) return;
    const previa = ocupacionAnteriorRef.current;
    const actual = partida.ocupacion;
    if (previa) {
      for (const id of Object.keys(actual) as TerritorioId[]) {
        if (previa[id] && previa[id].jugador !== actual[id].jugador) {
          // Solo fijamos el dueño anterior la primera vez (puede haber pasos intermedios).
          if (!pendientesAnimacionRef.current.has(id)) {
            pendientesAnimacionRef.current.set(id, previa[id].jugador);
          }
        }
      }
    }
    ocupacionAnteriorRef.current = actual;
  }, [partida?.ocupacion]); // eslint-disable-line react-hooks/exhaustive-deps

  // 2. Disparar animaciones sólo cuando ningún diálogo está bloqueando el mapa.
  // En una batalla resuelta: primero el cartel grande VICTORIA/DERROTA (según la
  // perspectiva de quien mira) y, tras él, las animaciones de territorio
  // (mancha de aceite + números de incremento/decremento).
  useEffect(() => {
    if (!partida) return;
    if (partida.preguntaActiva) return;
    if (partida.conquistaPendiente) return;

    // Capturamos y limpiamos los refs ya, para no perderlos durante el retardo.
    const snap = batallaSnapshotRef.current;
    batallaSnapshotRef.current = null;
    const entradas = Array.from(pendientesAnimacionRef.current.entries());
    pendientesAnimacionRef.current = new Map();
    if (!snap && entradas.length === 0) return;

    // (a) mancha de aceite + (b) números de combate flotantes.
    const animarTerritorios = () => {
      if (entradas.length > 0) {
        const ids = entradas.map(([id]) => id);
        setConquistasAnim((prev) => {
          const next = new Map(prev);
          for (const [id, de] of entradas) next.set(id, de);
          return next;
        });
        setRecienConquistados((prev) => {
          const next = new Set(prev);
          for (const id of ids) next.add(id);
          return next;
        });
        setTimeout(() => {
          setConquistasAnim((prev) => {
            const next = new Map(prev);
            for (const id of ids) next.delete(id);
            return next;
          });
        }, 880);
        setTimeout(() => {
          setRecienConquistados((prev) => {
            const next = new Set(prev);
            for (const id of ids) next.delete(id);
            return next;
          });
        }, 1400);
      }

      if (snap) {
        const nums: NumeroCombate[] = [];
        const defAhora = partida.ocupacion[snap.defensor];
        const conquistado = defAhora.jugador !== snap.duenoDefensor;
        if (conquistado) {
          nums.push({
            key: ++numeroIdRef.current,
            territorio: snap.defensor,
            texto: `+${defAhora.fichas}`,
            tipo: 'gano',
          });
        } else {
          const dAtacante = partida.ocupacion[snap.atacante].fichas - snap.fichasAtacante;
          if (dAtacante < 0) {
            nums.push({
              key: ++numeroIdRef.current,
              territorio: snap.atacante,
              texto: `${dAtacante}`,
              tipo: 'perdida',
            });
          }
          const dDefensor = defAhora.fichas - snap.fichasDefensor;
          if (dDefensor > 0) {
            nums.push({
              key: ++numeroIdRef.current,
              territorio: snap.defensor,
              texto: `+${dDefensor}`,
              tipo: 'gano',
            });
          }
        }
        if (nums.length > 0) {
          setNumerosCombate((prev) => [...prev, ...nums]);
          const keys = new Set(nums.map((n) => n.key));
          setTimeout(() => {
            setNumerosCombate((prev) => prev.filter((n) => !keys.has(n.key)));
          }, 1600);
        }
      }
    };

    if (snap) {
      // Cartel grande de resultado, desde la perspectiva de quien mira la pantalla.
      const defensorIdx = snap.duenoDefensor;
      const atacanteIdx: IndiceJugador = defensorIdx === 0 ? 1 : 0;
      const conquistado = partida.ocupacion[snap.defensor].jugador !== snap.duenoDefensor;
      const ganadorBatalla: IndiceJugador = conquistado ? atacanteIdx : defensorIdx;
      // Online: la perspectiva es mi jugador. Local (pantalla compartida): la del
      // atacante, que es quien tiene el turno.
      const viewerIdx: IndiceJugador =
        modo === 'online' && miIndice !== null ? miIndice : partida.turnoActual;
      const miVictoria = viewerIdx === ganadorBatalla;
      const territorio = NOMBRES_TERRITORIO[snap.defensor];
      const subtitulo = conquistado
        ? miVictoria
          ? `Has conquistado ${territorio}`
          : `${territorio} ha caído`
        : miVictoria
          ? `Has defendido ${territorio}`
          : `Ataque repelido en ${territorio}`;
      const miKey = ++anuncioIdRef.current;
      setAnuncio({
        key: miKey,
        titulo: miVictoria ? '¡VICTORIA!' : 'DERROTA',
        subtitulo,
        icono: miVictoria ? '🏆' : '🏳️',
        color: COLOR_JUGADOR[viewerIdx],
        rapido: true,
      });
      // El cartel se limpia solo si sigue siendo el nuestro (no pisar uno nuevo).
      setTimeout(() => setAnuncio((a) => (a && a.key === miKey ? null : a)), 1700);
      // Las animaciones de territorio entran cuando el cartel empieza a desvanecerse.
      setTimeout(animarTerritorios, 1100);
      return;
    }

    // Cambio de propietario sin batalla (no debería ocurrir): animar de inmediato.
    animarTerritorios();
  }, [partida?.preguntaActiva, partida?.conquistaPendiente, partida?.ocupacion]); // eslint-disable-line react-hooks/exhaustive-deps

  // 3. Refuerzos: "+N" flotante por cada territorio donde aumentan las tropas.
  // Funciona para el jugador que coloca y para el rival que lo observa (online),
  // porque se basa en el diff del estado. Solo en fases de colocación (en ataques
  // los cambios de tropas ya los animan los números de combate).
  useEffect(() => {
    if (!partida) return;
    const actual = partida.ocupacion;
    const previa = fichasRefuerzoRef.current;
    const enColocacion =
      partida.fase === 'refuerzos' || partida.fase === 'colocacion-inicial';
    if (previa && enColocacion) {
      const nums: NumeroCombate[] = [];
      for (const id of Object.keys(actual) as TerritorioId[]) {
        const antes = previa[id];
        if (antes === undefined) continue;
        const delta = actual[id].fichas - antes;
        if (delta > 0) {
          nums.push({
            key: ++numeroIdRef.current,
            territorio: id,
            texto: `+${delta}`,
            tipo: 'gano',
          });
        }
      }
      if (nums.length > 0) {
        setNumerosCombate((prev) => [...prev, ...nums]);
        const keys = new Set(nums.map((n) => n.key));
        setTimeout(() => {
          setNumerosCombate((prev) => prev.filter((n) => !keys.has(n.key)));
        }, 1600);
      }
    }
    // Actualizar la foto para el siguiente diff (siempre, en cualquier fase).
    const snap = {} as Record<TerritorioId, number>;
    for (const id of Object.keys(actual) as TerritorioId[]) snap[id] = actual[id].fichas;
    fichasRefuerzoRef.current = snap;
  }, [partida?.ocupacion, partida?.fase]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setOrigenSeleccionado(null);
    setDestinoAtaque(null);
    setDestinoFortificacion(null);
    setColocando(null);
  }, [partida?.fase, partida?.turnoActual]);

  // Anuncio a tablero completo al cambiar de fase (y de turno, que entra en refuerzos).
  useEffect(() => {
    if (!partida) return;
    const faseActual = partida.fase;
    const faseAnterior = faseAnteriorRef.current;
    faseAnteriorRef.current = faseActual;
    if (faseAnterior === null) return; // primera carga: no anunciar
    if (faseAnterior === faseActual) return; // sólo cambió el turno dentro de la colocación
    if (faseActual === 'colocacion-inicial') return; // no anunciamos la colocación inicial
    if (partidaTerminada(partida)) return;

    const nombre = partida.jugadores[partida.turnoActual].nombre;
    const color = COLOR_JUGADOR[partida.turnoActual];
    let titulo: string;
    let subtitulo: string | undefined;
    let rapido = false;
    if (faseActual === 'refuerzos') {
      // Salto de línea fijo: "¡Turno de" arriba y el nombre abajo, para que no
      // repagine entre 1 y 2 líneas según el ancho (la animación cambia el ancho).
      titulo = `¡Turno de\n${nombre}!`;
      subtitulo = 'Comenzamos con la fase de Refuerzos';
    } else if (faseActual === 'ataques') {
      titulo = 'Fase de Ataque';
      rapido = true;
    } else {
      titulo = 'Fase de\nFortificación';
      rapido = true;
    }
    setAnuncio({ key: ++anuncioIdRef.current, titulo, subtitulo, color, rapido });
    const t = setTimeout(() => setAnuncio(null), rapido ? 1600 : 2400);
    return () => clearTimeout(t);
  }, [partida?.fase, partida?.turnoActual]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!partida) return;
    if (partida.fase !== 'refuerzos') return;
    if (modo === 'online' && miIndice !== partida.turnoActual) return;
    const jugadorActual = partida.jugadores[partida.turnoActual];
    if (jugadorActual.cartas.length >= 5) setCanjeAbierto(true);
  }, [partida?.fase, partida?.turnoActual, partida?.jugadores, modo, miIndice, partida]);

  const preguntaActual = useMemo(() => {
    if (!partida || !partida.preguntaActiva) return null;
    const baraja = partida.barajas[partida.preguntaActiva.defensorIndice];
    return baraja.questions.find((p) => p.id === partida.preguntaActiva!.preguntaId) ?? null;
  }, [partida]);

  if (!partida) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-sepiaOscuro/70">Cargando partida…</p>
      </main>
    );
  }

  const turno = partida.turnoActual;
  const otro: IndiceJugador = turno === 0 ? 1 : 0;
  const jugadorActual = partida.jugadores[turno];
  const interactivo = puedoActuar(partida, modo, miIndice);
  const soyDefensorPregunta = modo === 'local' ? true : miIndice === otro;
  const terminada = partidaTerminada(partida);

  // Fondo de pantalla teñido con el color del jugador al turno (muy suave, más
  // claro que el fondo de los territorios).
  const fondoTurno = turno === 0 ? 'rgba(44, 74, 107, 0.30)' : 'rgba(139, 44, 44, 0.30)';

  const destinosValidos: TerritorioId[] = (() => {
    if (!origenSeleccionado) return [];
    if (partida.fase === 'ataques') {
      return ADYACENCIAS[origenSeleccionado].filter((d) =>
        puedeAtacar(partida.ocupacion, turno, origenSeleccionado, d, ADYACENCIAS),
      );
    }
    if (partida.fase === 'fortificacion') {
      return Object.keys(partida.ocupacion).filter(
        (d) =>
          d !== origenSeleccionado &&
          partida.ocupacion[d as TerritorioId].jugador === turno &&
          hayCadenaPropia(
            partida.ocupacion,
            turno,
            origenSeleccionado,
            d as TerritorioId,
            ADYACENCIAS,
          ),
      ) as TerritorioId[];
    }
    return [];
  })();

  const seleccionables: TerritorioId[] = (() => {
    if (partida.preguntaActiva || partida.conquistaPendiente) return [];
    if (!interactivo) return [];
    if (partida.fase === 'colocacion-inicial' || partida.fase === 'refuerzos') {
      return Object.keys(partida.ocupacion).filter(
        (t) => partida.ocupacion[t as TerritorioId].jugador === turno,
      ) as TerritorioId[];
    }
    if (partida.fase === 'ataques') {
      return Object.keys(partida.ocupacion).filter(
        (t) =>
          partida.ocupacion[t as TerritorioId].jugador === turno &&
          partida.ocupacion[t as TerritorioId].fichas >= 2,
      ) as TerritorioId[];
    }
    if (partida.fase === 'fortificacion') {
      if (partida.fortificacionUsada) return [];
      return Object.keys(partida.ocupacion).filter(
        (t) =>
          partida.ocupacion[t as TerritorioId].jugador === turno &&
          partida.ocupacion[t as TerritorioId].fichas >= 2,
      ) as TerritorioId[];
    }
    return [];
  })();

  const handleClickTerritorio = (id: TerritorioId) => {
    if (terminada) return;
    if (partida.preguntaActiva || partida.conquistaPendiente) return;
    if (!interactivo) return;
    const o = partida.ocupacion[id];

    if (partida.fase === 'colocacion-inicial') {
      if (o.jugador === turno && partida.fichasPorColocarInicial[turno] > 0) {
        colocarFichaInicial(id);
      }
      return;
    }

    if (partida.fase === 'refuerzos') {
      if (o.jugador === turno && partida.refuerzosPendientes > 0) {
        setColocando(id);
      }
      return;
    }

    if (partida.fase === 'ataques') {
      if (origenSeleccionado === null) {
        if (o.jugador === turno && o.fichas >= 2) setOrigenSeleccionado(id);
        return;
      }
      if (id === origenSeleccionado) {
        setOrigenSeleccionado(null);
        return;
      }
      if (o.jugador === turno && o.fichas >= 2) {
        setOrigenSeleccionado(id);
        return;
      }
      if (puedeAtacar(partida.ocupacion, turno, origenSeleccionado, id, ADYACENCIAS)) {
        setDestinoAtaque(id);
      }
      return;
    }

    if (partida.fase === 'fortificacion') {
      if (partida.fortificacionUsada) return;
      if (origenSeleccionado === null) {
        if (o.jugador === turno && o.fichas >= 2) setOrigenSeleccionado(id);
        return;
      }
      if (id === origenSeleccionado) {
        setOrigenSeleccionado(null);
        return;
      }
      // Destino válido: territorio propio conectado por cadena, sin importar sus
      // fichas. Se comprueba ANTES que el cambio de origen para no robar el clic
      // cuando el destino propio ya tiene 2+ soldados.
      if (
        o.jugador === turno &&
        hayCadenaPropia(partida.ocupacion, turno, origenSeleccionado, id, ADYACENCIAS)
      ) {
        setDestinoFortificacion(id);
        return;
      }
      // No es un destino válido: si es propio con 2+ fichas, cambiar el origen.
      if (o.jugador === turno && o.fichas >= 2) {
        setOrigenSeleccionado(id);
      }
      return;
    }
  };

  const duracionPartida = (() => {
    const fin = partida.finPartida ?? Date.now();
    const ms = fin - partida.inicioPartida;
    const total = Math.floor(ms / 1000);
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  })();

  // Marcador de puntos (territorios + bonus por territorios clave) para el final.
  const puntuaciones = [
    calcularPuntuacion(partida.ocupacion, 0),
    calcularPuntuacion(partida.ocupacion, 1),
  ] as const;
  const ganoPorConquista =
    partida.ganador !== null && puntuaciones[partida.ganador].territorios === 26;

  return (
    <div
      className="min-h-screen transition-colors duration-700"
      style={{ backgroundColor: fondoTurno }}
    >
    <main className="mx-auto max-w-[1400px] px-3 py-4">
      {banner}
      <div className="mb-3">
        <BarraTurno
          partida={partida}
          onTerminarRefuerzos={interactivo ? terminarRefuerzos : () => undefined}
          onTerminarAtaques={interactivo ? terminarAtaques : () => undefined}
          onPasarFortificacion={interactivo ? pasarFortificacion : () => undefined}
          onAbandonar={() => setConfirmarSalir(true)}
        />
      </div>

      {modo === 'online' && !interactivo && !terminada && !partida.preguntaActiva && (
        <div className="mb-3 rounded-lg border border-sepia/40 bg-pergaminoOscuro/30 p-3 text-center text-sm text-sepiaOscuro">
          Esperando a {jugadorActual.nombre}…
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[260px_minmax(0,1fr)_260px]">
        <aside className="space-y-3 lg:sticky lg:top-2 lg:self-start">
          <PanelJugador
            partida={partida}
            jugador={0}
            onAbrirCanje={
              interactivo && turno === 0 ? () => setCanjeAbierto(true) : undefined
            }
          />
          <PanelComarcas partida={partida} onResaltarComarca={setComarcaResaltada} />
        </aside>

        <section className="relative overflow-hidden rounded-lg border-2 border-sepia bg-pergamino p-2 shadow-panel">
          <MapaMurcia
            ocupacion={partida.ocupacion}
            origenSeleccionado={origenSeleccionado}
            destinosValidos={destinosValidos}
            seleccionables={seleccionables}
            recienConquistados={recienConquistados}
            conquistasAnim={conquistasAnim}
            numerosCombate={numerosCombate}
            comarcaResaltada={comarcaResaltada}
            onClickTerritorio={handleClickTerritorio}
            interactivo={
              interactivo &&
              !terminada &&
              partida.preguntaActiva === null &&
              partida.conquistaPendiente === null
            }
          />
          <AnuncioFase key={anuncio?.key} anuncio={anuncio} />
        </section>

        <aside className="space-y-3 lg:sticky lg:top-2 lg:self-start">
          <PanelJugador
            partida={partida}
            jugador={1}
            onAbrirCanje={
              interactivo && turno === 1 ? () => setCanjeAbierto(true) : undefined
            }
          />
          <PanelFase partida={partida} />
        </aside>
      </div>

      <DialogoColocacion
        abierto={colocando !== null}
        territorio={colocando}
        maximo={partida.refuerzosPendientes}
        titulo="Colocar refuerzos"
        onConfirmar={(n) => {
          if (colocando) colocarRefuerzo(colocando, n);
          setColocando(null);
        }}
        onCancelar={() => setColocando(null)}
      />

      <DialogoAtaque
        abierto={destinoAtaque !== null && origenSeleccionado !== null}
        origen={origenSeleccionado}
        destino={destinoAtaque}
        fichasOrigen={origenSeleccionado ? partida.ocupacion[origenSeleccionado].fichas : 0}
        fichasDefensor={destinoAtaque ? partida.ocupacion[destinoAtaque].fichas : 0}
        onConfirmar={(N) => {
          if (origenSeleccionado && destinoAtaque) {
            declararAtaque(origenSeleccionado, destinoAtaque, N);
          }
          setDestinoAtaque(null);
        }}
        onCancelar={() => setDestinoAtaque(null)}
      />

      <DialogoPregunta
        abierto={partida.preguntaActiva !== null}
        pendiente={partida.preguntaActiva}
        pregunta={preguntaActual}
        defensorIndice={otro}
        defensorNombre={partida.jugadores[otro].nombre}
        atacanteNombre={jugadorActual.nombre}
        puedoResponder={soyDefensorPregunta}
        onResponder={(opcion) => {
          if (!soyDefensorPregunta) return;
          responderPregunta(opcion);
          setOrigenSeleccionado(null);
        }}
      />

      <DialogoMoverConquista
        abierto={partida.conquistaPendiente !== null && interactivo}
        conquista={partida.conquistaPendiente}
        onConfirmar={(n) => moverTrasConquista(n)}
      />

      <DialogoFortificacion
        abierto={destinoFortificacion !== null && origenSeleccionado !== null}
        origen={origenSeleccionado}
        destino={destinoFortificacion}
        fichasOrigen={origenSeleccionado ? partida.ocupacion[origenSeleccionado].fichas : 0}
        onConfirmar={(n) => {
          if (origenSeleccionado && destinoFortificacion) {
            fortificar(origenSeleccionado, destinoFortificacion, n);
          }
          setDestinoFortificacion(null);
          setOrigenSeleccionado(null);
        }}
        onCancelar={() => setDestinoFortificacion(null)}
      />

      <DialogoCanjeCartas
        abierto={canjeAbierto}
        cartas={jugadorActual.cartas}
        proximoNumeroCanje={partida.canjesRealizados + 1}
        onCanjear={(cs) => {
          canjearCartas(cs);
        }}
        onCerrar={() => {
          if (jugadorActual.cartas.length >= 5) return;
          setCanjeAbierto(false);
        }}
      />

      <Modal
        abierto={confirmarSalir}
        titulo={modo === 'online' ? 'Salir de la sala' : 'Abandonar partida'}
        onCerrar={() => setConfirmarSalir(false)}
        ancho="sm"
      >
        <p className="text-sepiaOscuro">
          {modo === 'online'
            ? '¿Salir de esta sala? La partida sigue para el otro jugador.'
            : '¿Seguro que quieres abandonar la partida? Se borrará el guardado.'}
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Boton variante="fantasma" onClick={() => setConfirmarSalir(false)}>
            Cancelar
          </Boton>
          <Boton variante="peligro" onClick={onSalir}>
            {modo === 'online' ? 'Salir' : 'Abandonar'}
          </Boton>
        </div>
      </Modal>

      <Modal abierto={terminada} ancho="md">
        <h2 className="text-center font-title text-3xl tracking-wider text-sepiaOscuro">
          {partida.empate ? 'Empate' : '¡Victoria!'}
        </h2>
        <p className="mt-2 text-center text-sepiaOscuro">
          {partida.empate ? (
            <>Los dos reinos terminan con los mismos puntos.</>
          ) : (
            <>
              <span className="font-semibold">
                {partida.ganador !== null ? partida.jugadores[partida.ganador].nombre : ''}
              </span>{' '}
              {ganoPorConquista
                ? 'ha conquistado el Reino de Mvrcia.'
                : 'gana al término de las rondas.'}
            </>
          )}
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3">
          {([0, 1] as const).map((idx) => {
            const p = puntuaciones[idx];
            const esGanador = !partida.empate && partida.ganador === idx;
            return (
              <div
                key={idx}
                className="rounded-lg border-2 bg-pergamino p-3"
                style={{
                  borderColor: idx === 0 ? '#2c4a6b' : '#8b2c2c',
                  opacity: !partida.empate && partida.ganador !== null && !esGanador ? 0.7 : 1,
                }}
              >
                <div className="flex items-center justify-between">
                  <span
                    className="font-title text-lg"
                    style={{ color: idx === 0 ? '#2c4a6b' : '#8b2c2c' }}
                  >
                    {partida.jugadores[idx].nombre}
                  </span>
                  {esGanador && <span aria-hidden>👑</span>}
                </div>
                <div className="mt-1 font-title text-3xl text-sepiaOscuro">{p.total} pts</div>
                <div className="mt-1 text-xs text-sepiaOscuro/80">
                  {p.territorios} territorios
                  {p.bonus > 0 && (
                    <> · +{p.bonus} ({p.claves.map((c) => NOMBRES_TERRITORIO[c]).join(', ')})</>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-3 text-center text-sm text-sepiaOscuro/70">
          {partida.limiteRondas !== null && (
            <>Rondas jugadas: {partida.rondasJugadas} de {partida.limiteRondas} · </>
          )}
          Duración: {duracionPartida}
        </p>
        <div className="mt-4 flex justify-center">
          <Boton variante="primario" onClick={onSalir}>
            Volver al menú
          </Boton>
        </div>
      </Modal>
    </main>
    </div>
  );
}
