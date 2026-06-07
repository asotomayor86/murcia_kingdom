'use client';

import { ButtonHTMLAttributes } from 'react';

type Variante = 'primario' | 'secundario' | 'peligro' | 'fantasma';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante;
}

const CLASES: Record<Variante, string> = {
  primario:
    'bg-sepia text-pergamino hover:bg-sepiaOscuro disabled:bg-sepia/40 disabled:text-pergamino/70',
  secundario:
    'bg-pergaminoOscuro text-sepiaOscuro border border-sepia hover:bg-pergamino disabled:opacity-50',
  peligro:
    'bg-jugador1 text-pergamino hover:bg-[#a83737] disabled:bg-jugador1/40',
  fantasma:
    'bg-transparent text-sepiaOscuro hover:bg-pergaminoOscuro/40 disabled:opacity-40',
};

export function Boton({ variante = 'primario', className = '', children, ...props }: Props) {
  return (
    <button
      className={`rounded-md px-4 py-2 text-sm font-medium tracking-wide transition disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-sepia/40 ${CLASES[variante]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
