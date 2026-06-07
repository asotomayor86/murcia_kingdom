'use client';

import { useEffect, useState } from 'react';
import { Modal } from './ui/Modal';
import { Boton } from './ui/Boton';
import { Slider } from './ui/Slider';
import { NOMBRES_TERRITORIO } from '@/lib/territorios';
import type { ConquistaPendiente } from '@/lib/tipos';

interface Props {
  abierto: boolean;
  conquista: ConquistaPendiente | null;
  onConfirmar: (n: number) => void;
}

export function DialogoMoverConquista({ abierto, conquista, onConfirmar }: Props) {
  const [cantidad, setCantidad] = useState(0);

  useEffect(() => {
    if (conquista) setCantidad(conquista.minMover);
  }, [conquista]);

  if (!abierto || !conquista) return null;

  return (
    <Modal abierto={abierto} titulo="Territorio conquistado" ancho="md">
      <p className="mb-4 text-sepiaOscuro">
        Has conquistado <span className="font-semibold">{NOMBRES_TERRITORIO[conquista.territorioDestino]}</span>.
        ¿Cuántas fichas mover desde <span className="font-semibold">{NOMBRES_TERRITORIO[conquista.territorioOrigen]}</span>?
      </p>
      <Slider
        min={conquista.minMover}
        max={conquista.maxMover}
        value={cantidad}
        onChange={setCantidad}
        etiqueta={`Entre ${conquista.minMover} y ${conquista.maxMover}`}
      />
      <div className="mt-6 flex justify-end">
        <Boton variante="primario" onClick={() => onConfirmar(cantidad)}>
          Mover {cantidad}
        </Boton>
      </div>
    </Modal>
  );
}
