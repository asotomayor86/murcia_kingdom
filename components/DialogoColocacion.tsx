'use client';

import { useRef, useState } from 'react';
import { Modal } from './ui/Modal';
import { Boton } from './ui/Boton';
import { Slider } from './ui/Slider';
import { NOMBRES_TERRITORIO } from '@/lib/territorios';
import type { TerritorioId } from '@/lib/tipos';

interface Props {
  abierto: boolean;
  territorio: TerritorioId | null;
  maximo: number;
  onConfirmar: (cantidad: number) => void;
  onCancelar: () => void;
  titulo?: string;
}

export function DialogoColocacion({
  abierto,
  territorio,
  maximo,
  onConfirmar,
  onCancelar,
  titulo,
}: Props) {
  const [cantidad, setCantidad] = useState(1);

  // Reiniciar a 1 cada vez que se abre el diálogo para un territorio distinto.
  // (Patrón de React para resetear estado al cambiar una prop: se ajusta durante
  // el render, sin frame intermedio ni parpadeo.)
  const territorioPrevio = useRef(territorio);
  if (territorio !== territorioPrevio.current) {
    territorioPrevio.current = territorio;
    setCantidad(1);
  }

  if (!abierto || !territorio) return null;
  const tope = Math.max(1, maximo);
  const valor = Math.min(Math.max(1, cantidad), tope);

  return (
    <Modal abierto={abierto} titulo={titulo ?? 'Colocar fichas'} onCerrar={onCancelar} ancho="sm">
      <p className="mb-4 text-sepiaOscuro">
        ¿Cuántas fichas colocar en{' '}
        <span className="font-semibold">{NOMBRES_TERRITORIO[territorio]}</span>?{' '}
        <span className="text-sepiaOscuro/70">(quedan {tope})</span>
      </p>
      <Slider min={1} max={tope} value={valor} onChange={setCantidad} />
      <div className="mt-6 flex justify-end gap-2">
        <Boton variante="fantasma" onClick={onCancelar}>
          Cancelar
        </Boton>
        <Boton variante="primario" onClick={() => onConfirmar(valor)}>
          Colocar {valor}
        </Boton>
      </div>
    </Modal>
  );
}
