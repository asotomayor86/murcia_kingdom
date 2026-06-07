'use client';

import { useEffect, useState } from 'react';
import { Modal } from './ui/Modal';
import { Boton } from './ui/Boton';
import { Slider } from './ui/Slider';
import { NOMBRES_TERRITORIO } from '@/lib/territorios';
import type { TerritorioId } from '@/lib/tipos';

interface Props {
  abierto: boolean;
  origen: TerritorioId | null;
  destino: TerritorioId | null;
  fichasOrigen: number;
  onConfirmar: (n: number) => void;
  onCancelar: () => void;
}

export function DialogoFortificacion({
  abierto,
  origen,
  destino,
  fichasOrigen,
  onConfirmar,
  onCancelar,
}: Props) {
  const max = Math.max(1, fichasOrigen - 1);
  const [n, setN] = useState(1);

  useEffect(() => {
    setN(1);
  }, [origen, destino, abierto]);

  if (!abierto || !origen || !destino) return null;

  return (
    <Modal abierto={abierto} titulo="Fortificación" onCerrar={onCancelar} ancho="md">
      <p className="mb-4 text-sepiaOscuro">
        Mover de <span className="font-semibold">{NOMBRES_TERRITORIO[origen]}</span> a{' '}
        <span className="font-semibold">{NOMBRES_TERRITORIO[destino]}</span>.
      </p>
      <Slider min={1} max={max} value={Math.min(n, max)} onChange={setN} etiqueta="Fichas a mover" />
      <p className="mt-2 text-xs text-sepiaOscuro/70">Debe quedar al menos 1 ficha en el origen.</p>
      <div className="mt-6 flex justify-end gap-2">
        <Boton variante="fantasma" onClick={onCancelar}>
          Cancelar
        </Boton>
        <Boton variante="primario" onClick={() => onConfirmar(Math.min(n, max))}>
          Mover {Math.min(n, max)}
        </Boton>
      </div>
    </Modal>
  );
}
