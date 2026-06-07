'use client';

import { ReactNode } from 'react';

interface Props {
  abierto: boolean;
  titulo?: string;
  children: ReactNode;
  onCerrar?: () => void;
  ancho?: 'sm' | 'md' | 'lg' | 'xl';
}

const ANCHOS: Record<NonNullable<Props['ancho']>, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export function Modal({ abierto, titulo, children, onCerrar, ancho = 'md' }: Props) {
  if (!abierto) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4"
      onClick={onCerrar}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`w-full ${ANCHOS[ancho]} rounded-xl border-2 border-sepia bg-pergamino p-6 shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        {titulo && (
          <h2 className="mb-4 text-2xl font-title tracking-wide text-sepiaOscuro">{titulo}</h2>
        )}
        {children}
      </div>
    </div>
  );
}
