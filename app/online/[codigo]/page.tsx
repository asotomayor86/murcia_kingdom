'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Juego } from '@/components/Juego';
import { Boton } from '@/components/ui/Boton';
import { useStore } from '@/lib/store';
import {
  guardarSesion,
  obtenerEstadoSala,
  obtenerSesion,
  olvidarSesion,
  suscribirseASala,
  type SuscripcionSala,
} from '@/lib/online';
import { onlineDisponible } from '@/lib/config';
import type { EstadoPartida } from '@/lib/tipos';
import { COLOR_JUGADOR } from '@/lib/territorios';

type EstadoCarga =
  | { tipo: 'cargando' }
  | { tipo: 'unirse'; estado: EstadoPartida }
  | { tipo: 'jugando' }
  | { tipo: 'error'; mensaje: string }
  | { tipo: 'no-existe' }
  | { tipo: 'sin-online' };

export default function PaginaOnline() {
  const router = useRouter();
  const params = useParams<{ codigo: string }>();
  const codigo = (params?.codigo ?? '').toUpperCase();

  const partida = useStore((s) => s.partida);
  const modo = useStore((s) => s.modo);
  const miIndice = useStore((s) => s.miIndice);
  const cargarSalaOnline = useStore((s) => s.cargarSalaOnline);
  const unirseSalaOnline = useStore((s) => s.unirseSalaOnline);
  const aplicarEstadoEntrante = useStore((s) => s.aplicarEstadoEntrante);
  const salirDeSala = useStore((s) => s.salirDeSala);

  const [estadoUI, setEstadoUI] = useState<EstadoCarga>({ tipo: 'cargando' });
  const [uniendo, setUniendo] = useState(false);
  const suscripcionRef = useRef<SuscripcionSala | null>(null);

  useEffect(() => {
    if (!codigo) return;
    if (!onlineDisponible()) {
      setEstadoUI({ tipo: 'sin-online' });
      return;
    }
    let cancelado = false;

    (async () => {
      try {
        const estado = await obtenerEstadoSala(codigo);
        if (cancelado) return;
        if (!estado) {
          setEstadoUI({ tipo: 'no-existe' });
          return;
        }
        const sesion = obtenerSesion(codigo);
        if (sesion) {
          cargarSalaOnline(codigo, sesion.miIndice, estado);
          setEstadoUI({ tipo: 'jugando' });
        } else if (!estado.jugador2Unido) {
          // El asiento del jugador 2 sigue libre: mostramos la configuración para confirmar.
          setEstadoUI({ tipo: 'unirse', estado });
        } else {
          setEstadoUI({ tipo: 'error', mensaje: 'La sala ya está completa.' });
        }
      } catch (e: unknown) {
        setEstadoUI({
          tipo: 'error',
          mensaje: e instanceof Error ? e.message : String(e),
        });
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [codigo, cargarSalaOnline]);

  // Suscripción a Realtime cuando empezamos a jugar.
  useEffect(() => {
    if (estadoUI.tipo !== 'jugando') return;
    if (suscripcionRef.current) return;
    suscripcionRef.current = suscribirseASala(codigo, (nuevo) => {
      aplicarEstadoEntrante(nuevo);
    });
    return () => {
      suscripcionRef.current?.desuscribir();
      suscripcionRef.current = null;
    };
  }, [estadoUI.tipo, codigo, aplicarEstadoEntrante]);

  const onUnirme = async () => {
    if (estadoUI.tipo !== 'unirse') return;
    setUniendo(true);
    try {
      guardarSesion(codigo, 1);
      await unirseSalaOnline(codigo, 1, estadoUI.estado);
      setEstadoUI({ tipo: 'jugando' });
    } catch (e: unknown) {
      olvidarSesion(codigo);
      setEstadoUI({
        tipo: 'error',
        mensaje: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setUniendo(false);
    }
  };

  if (estadoUI.tipo === 'cargando') {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-sepiaOscuro/70">Conectando a la sala…</p>
      </main>
    );
  }

  if (estadoUI.tipo === 'sin-online') {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <div className="max-w-md rounded-lg border-2 border-sepia bg-pergamino p-6 text-center">
          <h2 className="font-title text-xl text-sepiaOscuro">Modo online no configurado</h2>
          <p className="mt-2 text-sm text-sepiaOscuro/80">
            Esta instancia no tiene habilitado el modo online.
          </p>
          <div className="mt-4">
            <Boton variante="primario" onClick={() => router.replace('/')}>
              Volver al menú
            </Boton>
          </div>
        </div>
      </main>
    );
  }

  if (estadoUI.tipo === 'no-existe') {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <div className="max-w-md rounded-lg border-2 border-sepia bg-pergamino p-6 text-center">
          <h2 className="font-title text-xl text-sepiaOscuro">Sala no encontrada</h2>
          <p className="mt-2 text-sm text-sepiaOscuro/80">
            El código <span className="font-mono">{codigo}</span> no existe o ha expirado.
          </p>
          <div className="mt-4">
            <Boton variante="primario" onClick={() => router.replace('/')}>
              Volver al menú
            </Boton>
          </div>
        </div>
      </main>
    );
  }

  if (estadoUI.tipo === 'error') {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <div className="max-w-md rounded-lg border-2 border-sepia bg-pergamino p-6 text-center">
          <h2 className="font-title text-xl text-sepiaOscuro">Error</h2>
          <p className="mt-2 text-sm text-sepiaOscuro/80">{estadoUI.mensaje}</p>
          <div className="mt-4">
            <Boton variante="primario" onClick={() => router.replace('/')}>
              Volver al menú
            </Boton>
          </div>
        </div>
      </main>
    );
  }

  if (estadoUI.tipo === 'unirse') {
    const cfg = estadoUI.estado;
    const duracionTexto =
      cfg.limiteRondas === null ? 'Sin límite (conquista total)' : `${cfg.limiteRondas} rondas`;
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md rounded-lg border-2 border-sepia bg-pergamino p-6">
          <h2 className="text-center font-title text-2xl text-sepiaOscuro">Unirse a la sala</h2>
          <p className="mt-2 text-center text-sm text-sepiaOscuro/80">
            Código: <span className="font-mono font-bold">{codigo}</span>
          </p>
          <p className="mt-3 text-center text-xs text-sepiaOscuro/70">
            El anfitrión ya ha configurado la partida. Revísala y entra: jugarás como
            Jugador 2 (rojo).
          </p>
          <div className="mt-4 space-y-3">
            <div className="rounded border border-jugador0/40 bg-pergamino p-3">
              <p className="text-sm font-semibold text-jugador0">Jugador 1 (azul)</p>
              <p className="mt-1 text-sepiaOscuro">{cfg.jugadores[0].nombre}</p>
              <p className="mt-1 text-xs text-sepiaOscuro/70">
                Baraja al defender: <span className="font-medium">{cfg.barajas[0].deck_name}</span>
              </p>
            </div>
            <div className="rounded border border-jugador1/40 bg-pergamino p-3">
              <p className="text-sm font-semibold text-jugador1">Jugador 2 (rojo) · tú</p>
              <p className="mt-1 text-sepiaOscuro">{cfg.jugadores[1].nombre}</p>
              <p className="mt-1 text-xs text-sepiaOscuro/70">
                Baraja al defender: <span className="font-medium">{cfg.barajas[1].deck_name}</span>
              </p>
            </div>
            <p className="text-xs text-sepiaOscuro/70">
              Duración: <span className="font-medium">{duracionTexto}</span>
              {' · '}
              Reparto inicial:{' '}
              <span className="font-medium">
                {cfg.fichasPorColocarInicial[0] === 0 && cfg.fichasPorColocarInicial[1] === 0
                  ? 'aleatorio'
                  : 'manual'}
              </span>
            </p>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <Boton variante="fantasma" onClick={() => router.replace('/')} disabled={uniendo}>
              Cancelar
            </Boton>
            <Boton variante="primario" onClick={onUnirme} disabled={uniendo}>
              {uniendo ? 'Uniéndose…' : 'Unirme a la partida'}
            </Boton>
          </div>
        </div>
      </main>
    );
  }

  // estadoUI.tipo === 'jugando'
  if (!partida) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-sepiaOscuro/70">Cargando partida…</p>
      </main>
    );
  }

  const esperandoRival = !partida.jugador2Unido;

  const salir = () => {
    olvidarSesion(codigo);
    suscripcionRef.current?.desuscribir();
    suscripcionRef.current = null;
    salirDeSala();
    router.replace('/');
  };

  // Volver al menú conservando la sesión: se puede retomar volviendo a entrar con
  // el código de la sala (la partida sigue viva en el servidor).
  const volver = () => {
    suscripcionRef.current?.desuscribir();
    suscripcionRef.current = null;
    salirDeSala();
    router.replace('/');
  };

  const colorMio = miIndice !== null ? COLOR_JUGADOR[miIndice] : '#5a3818';

  if (esperandoRival) {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <div className="max-w-md rounded-lg border-2 border-sepia bg-pergamino p-6 text-center">
          <h2 className="font-title text-2xl text-sepiaOscuro">Esperando rival…</h2>
          <p className="mt-2 text-sm text-sepiaOscuro/80">
            Esperando a que <span className="font-semibold">{partida.jugadores[1].nombre}</span>{' '}
            se una.
          </p>
          <p className="mt-3 text-sm text-sepiaOscuro/80">Comparte este código:</p>
          <div className="mt-2 rounded border-2 border-dashed border-sepia bg-pergaminoOscuro/40 p-3 font-mono text-2xl tracking-widest text-sepiaOscuro">
            {codigo}
          </div>
          <p className="mt-3 text-xs text-sepiaOscuro/70">
            O comparte esta URL: <span className="font-mono">{typeof window !== 'undefined' ? window.location.href : ''}</span>
          </p>
          <div className="mt-5 flex justify-center gap-2">
            <Boton variante="fantasma" onClick={salir}>
              Cancelar
            </Boton>
          </div>
        </div>
      </main>
    );
  }

  return (
    <Juego
      onSalir={salir}
      onVolver={volver}
      banner={
        modo === 'online' && miIndice !== null ? (
          <div
            className="mb-3 rounded-lg border-2 px-3 py-2 text-sm"
            style={{
              borderColor: colorMio,
              background: `${colorMio}11`,
              color: '#3d2817',
            }}
          >
            Sala <span className="font-mono font-bold">{codigo}</span> · Juegas como{' '}
            <span className="font-semibold">{partida.jugadores[miIndice].nombre}</span>{' '}
            ({miIndice === 0 ? 'azul' : 'rojo'})
          </div>
        ) : null
      }
    />
  );
}
