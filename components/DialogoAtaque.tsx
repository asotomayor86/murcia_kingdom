'use client';

import { useEffect, useState } from 'react';
import { Modal } from './ui/Modal';
import { Boton } from './ui/Boton';
import { Slider } from './ui/Slider';
import { NOMBRES_TERRITORIO } from '@/lib/territorios';
import { calcularNivelPregunta, tiempoLimitePorNivel } from '@/lib/reglas';
import type { TerritorioId } from '@/lib/tipos';

interface Props {
  abierto: boolean;
  origen: TerritorioId | null;
  destino: TerritorioId | null;
  fichasOrigen: number;
  fichasDefensor: number;
  onConfirmar: (N: number) => void;
  onCancelar: () => void;
}

export function DialogoAtaque({
  abierto,
  origen,
  destino,
  fichasOrigen,
  fichasDefensor,
  onConfirmar,
  onCancelar,
}: Props) {
  const maxN = Math.max(1, fichasOrigen - 1);
  const [n, setN] = useState(1);

  useEffect(() => {
    if (abierto) setN(1);
  }, [abierto, origen, destino]);

  if (!abierto || !origen || !destino) return null;

  const nClamped = Math.min(Math.max(1, n), maxN);
  const nivel = calcularNivelPregunta(nClamped, fichasDefensor);
  const tiempo = tiempoLimitePorNivel(nivel);

  return (
    <Modal abierto={abierto} titulo="Declarar ataque" onCerrar={onCancelar} ancho="md">
      <p className="mb-3 text-sepiaOscuro">
        <span className="font-semibold">{NOMBRES_TERRITORIO[origen]}</span> ataca a{' '}
        <span className="font-semibold">{NOMBRES_TERRITORIO[destino]}</span>.
      </p>
      <div className="mb-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded border border-sepia/40 bg-pergaminoOscuro/30 p-3">
          <div className="text-xs uppercase tracking-wide text-sepiaOscuro/70">Origen</div>
          <div className="font-mono text-lg">{fichasOrigen} fichas</div>
        </div>
        <div className="rounded border border-sepia/40 bg-pergaminoOscuro/30 p-3">
          <div className="text-xs uppercase tracking-wide text-sepiaOscuro/70">Defensores</div>
          <div className="font-mono text-lg">{fichasDefensor}</div>
        </div>
      </div>
      <Slider
        min={1}
        max={maxN}
        value={nClamped}
        onChange={setN}
        etiqueta={`Atacantes (1 a ${maxN})`}
      />
      <div className="mt-4 rounded border border-sepia/40 bg-pergamino p-3 text-sepiaOscuro">
        <div className="text-sm">
          Pregunta prevista: <span className="font-bold">nivel {nivel}</span>
          {' '}·{' '}<span>{tiempo} segundos</span>
        </div>
        <div className="mt-1 text-xs text-sepiaOscuro/70">
          Si el defensor falla o se agota el tiempo, conquistas; si acierta, pierdes{' '}
          {Math.ceil(nClamped / 2)} fichas.
        </div>
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <Boton variante="fantasma" onClick={onCancelar}>
          Cancelar
        </Boton>
        <Boton variante="peligro" onClick={() => onConfirmar(nClamped)}>
          Atacar con {nClamped}
        </Boton>
      </div>
    </Modal>
  );
}
