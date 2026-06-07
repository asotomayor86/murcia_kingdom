'use client';

import { useEffect, useRef, useState } from 'react';
import { Modal } from './ui/Modal';
import { NOMBRES_TERRITORIO, COLOR_JUGADOR } from '@/lib/territorios';
import type { IndiceJugador, Pregunta, PreguntaPendiente } from '@/lib/tipos';

interface Props {
  abierto: boolean;
  pendiente: PreguntaPendiente | null;
  pregunta: Pregunta | null;
  defensorIndice: IndiceJugador;
  defensorNombre: string;
  atacanteNombre: string;
  puedoResponder?: boolean;
  /** Registra la opción elegida (se sincroniza para que el rival la vea). */
  onElegir: (opcion: 0 | 1 | 2 | 3 | 'timeout') => void;
  /** Resuelve la batalla tras mostrar el resultado (solo quien responde). */
  onResponder: (opcion: 0 | 1 | 2 | 3 | 'timeout') => void;
}

const LETRAS = ['A', 'B', 'C', 'D'] as const;

export function DialogoPregunta({
  abierto,
  pendiente,
  pregunta,
  defensorIndice,
  defensorNombre,
  atacanteNombre,
  puedoResponder = true,
  onElegir,
  onResponder,
}: Props) {
  const [segundos, setSegundos] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onElegirRef = useRef(onElegir);
  onElegirRef.current = onElegir;
  const onResponderRef = useRef(onResponder);
  onResponderRef.current = onResponder;

  // La respuesta vive en el estado sincronizado: ambos jugadores la ven.
  const respuesta = pendiente?.respuesta ?? null;
  const respondida = respuesta != null;
  const preguntaId = pendiente?.preguntaId ?? null;
  const iniciadoEn = pendiente?.iniciadoEn ?? 0;
  const tiempoLimiteS = pendiente?.tiempoLimiteS ?? 0;

  // Cuenta atrás mientras no haya respuesta. Al agotarse, quien responde registra timeout.
  useEffect(() => {
    if (!abierto || preguntaId === null || respondida) {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      return;
    }
    const calc = () =>
      Math.max(0, tiempoLimiteS - Math.floor((Date.now() - iniciadoEn) / 1000));
    setSegundos(calc());
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      const s = calc();
      setSegundos(s);
      if (s === 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = null;
        if (puedoResponder) onElegirRef.current('timeout');
      }
    }, 200);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [abierto, preguntaId, respondida, iniciadoEn, tiempoLimiteS, puedoResponder]);

  // Tras revelar la respuesta, esperar 3 s y resolver la batalla (solo quien responde).
  useEffect(() => {
    if (!abierto || !respondida || !puedoResponder || respuesta === null) return;
    const t = setTimeout(() => onResponderRef.current(respuesta), 3000);
    return () => clearTimeout(t);
  }, [abierto, respondida, respuesta, puedoResponder, preguntaId]);

  if (!abierto || !pendiente || !pregunta) return null;

  const colorDefensor = COLOR_JUGADOR[defensorIndice];
  const total = pendiente.tiempoLimiteS;
  const ratio = Math.max(0, Math.min(1, segundos / total));

  const elegir = (opc: 0 | 1 | 2 | 3) => {
    if (respondida || !puedoResponder) return;
    onElegirRef.current(opc);
  };

  return (
    <Modal abierto={abierto} ancho="lg">
      <div
        className="mb-3 rounded-lg p-3 text-center"
        style={{ background: colorDefensor, color: '#fff8e8' }}
      >
        <div className="text-xs uppercase tracking-wider opacity-80">Responde</div>
        <div className="text-2xl font-bold tracking-wide">{defensorNombre}</div>
      </div>

      <div className="mb-3 flex items-center justify-between text-sm text-sepiaOscuro">
        <span>
          Nivel <span className="font-bold">{pendiente.nivel}</span> · {pregunta.tema}
        </span>
        <span>
          {NOMBRES_TERRITORIO[pendiente.territorioAtacante]} → {NOMBRES_TERRITORIO[pendiente.territorioDefensor]}
          {' '}({atacanteNombre} ataca con {pendiente.atacantesN})
        </span>
      </div>

      <div className="mb-4 h-2 w-full overflow-hidden rounded bg-pergaminoOscuro/50">
        <div
          className="h-full transition-all"
          style={{ width: `${ratio * 100}%`, background: ratio > 0.3 ? '#5a3818' : '#a83737' }}
        />
      </div>
      <div className="mb-4 text-right text-sm font-mono text-sepiaOscuro">{segundos}s</div>

      <p className="mb-5 font-serif text-xl text-sepiaOscuro">{pregunta.enunciado}</p>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {pregunta.opciones.map((op, i) => {
          const idx = i as 0 | 1 | 2 | 3;
          const esCorrecta = pregunta.correcta === idx;
          const esElegida = respuesta === idx;
          let estilo = 'bg-pergamino hover:bg-pergaminoOscuro';
          if (respondida) {
            if (esCorrecta) estilo = 'bg-green-200 ring-2 ring-green-600';
            else if (esElegida) estilo = 'bg-red-200 ring-2 ring-red-600';
            else estilo = 'bg-pergamino opacity-70';
          }
          return (
            <button
              key={i}
              disabled={respondida || !puedoResponder}
              onClick={() => elegir(idx)}
              className={`flex items-start gap-3 rounded-lg border-2 border-sepia/60 p-3 text-left text-sepiaOscuro transition ${estilo} ${!puedoResponder && !respondida ? 'opacity-70' : ''}`}
              aria-label={`Opción ${LETRAS[i]}: ${op}`}
            >
              <span className="font-title text-lg font-bold">{LETRAS[i]}</span>
              <span className="font-serif text-base">{op}</span>
            </button>
          );
        })}
      </div>

      {respondida && (
        <div className="mt-5 rounded border border-sepia/40 bg-pergaminoOscuro/40 p-3 text-sepiaOscuro">
          <div className="text-sm font-semibold">
            {respuesta === 'timeout'
              ? `${defensorNombre} no respondió a tiempo.`
              : respuesta === pregunta.correcta
                ? `${defensorNombre} acertó.`
                : `${defensorNombre} falló.`}
          </div>
          <div className="mt-1 text-sm italic">{pregunta.explicacion}</div>
        </div>
      )}
      {!respondida && !puedoResponder && (
        <div className="mt-5 rounded border border-sepia/40 bg-pergaminoOscuro/40 p-3 text-center text-sm text-sepiaOscuro">
          Esperando respuesta de <span className="font-semibold">{defensorNombre}</span>…
        </div>
      )}
    </Modal>
  );
}
