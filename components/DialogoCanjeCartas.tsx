'use client';

import { useMemo, useState } from 'react';
import { Modal } from './ui/Modal';
import { Boton } from './ui/Boton';
import { NOMBRES_TERRITORIO } from '@/lib/territorios';
import { combinacionCanjeValida, valorCanje } from '@/lib/reglas';
import type { Carta } from '@/lib/tipos';

interface Props {
  abierto: boolean;
  cartas: Carta[];
  proximoNumeroCanje: number;
  onCanjear: (cartas: [Carta, Carta, Carta]) => void;
  onCerrar: () => void;
}

const SIMBOLO_TXT: Record<Carta['simbolo'], string> = {
  soldado: 'Soldado',
  jinete: 'Jinete',
  artilleria: 'Artillería',
  comodin: 'Comodín',
};

export function DialogoCanjeCartas({
  abierto,
  cartas,
  proximoNumeroCanje,
  onCanjear,
  onCerrar,
}: Props) {
  const [seleccion, setSeleccion] = useState<string[]>([]);

  const seleccionadas = useMemo(
    () => cartas.filter((c) => seleccion.includes(c.id)),
    [cartas, seleccion],
  );
  const valida = combinacionCanjeValida(seleccionadas);

  const toggle = (id: string) => {
    setSeleccion((s) => {
      if (s.includes(id)) return s.filter((x) => x !== id);
      if (s.length >= 3) return s;
      return [...s, id];
    });
  };

  const confirmar = () => {
    if (!valida || seleccionadas.length !== 3) return;
    onCanjear([seleccionadas[0], seleccionadas[1], seleccionadas[2]]);
    setSeleccion([]);
  };

  if (!abierto) return null;

  return (
    <Modal abierto={abierto} titulo="Canjear cartas" onCerrar={onCerrar} ancho="lg">
      <p className="mb-3 text-sepiaOscuro">
        Selecciona <span className="font-semibold">3 cartas</span>: tres del mismo símbolo o una de cada tipo. Los comodines sustituyen.
      </p>
      {cartas.length === 0 ? (
        <p className="text-sepiaOscuro/70">No tienes cartas.</p>
      ) : (
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
          {cartas.map((c) => {
            const activa = seleccion.includes(c.id);
            return (
              <button
                key={c.id}
                onClick={() => toggle(c.id)}
                className={`flex flex-col items-start rounded-lg border-2 p-3 text-left text-sm transition ${
                  activa
                    ? 'border-sepia bg-pergamino ring-2 ring-sepia'
                    : 'border-sepia/40 bg-pergamino/70 hover:bg-pergamino'
                }`}
                aria-pressed={activa}
              >
                <span className="text-xs uppercase tracking-wider text-sepiaOscuro/70">
                  {SIMBOLO_TXT[c.simbolo]}
                </span>
                <span className="mt-1 font-serif text-base text-sepiaOscuro">
                  {c.territorio ? NOMBRES_TERRITORIO[c.territorio] : '— Comodín —'}
                </span>
              </button>
            );
          })}
        </div>
      )}
      <div className="mt-5 flex items-center justify-between">
        <div className="text-sm text-sepiaOscuro">
          {seleccionadas.length === 3
            ? valida
              ? `Combinación válida (+${valorCanje(proximoNumeroCanje)} ejércitos)`
              : 'Combinación no válida'
            : `${seleccionadas.length}/3 seleccionadas`}
        </div>
        <div className="flex gap-2">
          <Boton variante="fantasma" onClick={onCerrar}>
            Cerrar
          </Boton>
          <Boton variante="primario" onClick={confirmar} disabled={!valida || seleccionadas.length !== 3}>
            Canjear
          </Boton>
        </div>
      </div>
    </Modal>
  );
}
