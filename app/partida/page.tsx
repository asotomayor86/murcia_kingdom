'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Juego } from '@/components/Juego';
import { useStore } from '@/lib/store';

export default function PaginaPartida() {
  const router = useRouter();
  const partida = useStore((s) => s.partida);
  const modo = useStore((s) => s.modo);
  const cargarDesdeAlmacenamiento = useStore((s) => s.cargarDesdeAlmacenamiento);
  const abandonarPartida = useStore((s) => s.abandonarPartida);
  const [comprobando, setComprobando] = useState(true);

  useEffect(() => {
    if (!partida || modo !== 'local') {
      const ok = cargarDesdeAlmacenamiento();
      if (!ok) {
        router.replace('/');
        return;
      }
    }
    setComprobando(false);
  }, [partida, modo, cargarDesdeAlmacenamiento, router]);

  if (comprobando || !partida) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-sepiaOscuro/70">Cargando partida…</p>
      </main>
    );
  }

  return (
    <Juego
      onSalir={() => {
        abandonarPartida();
        router.replace('/');
      }}
    />
  );
}
