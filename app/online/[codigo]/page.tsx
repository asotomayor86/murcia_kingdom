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
import { cargarBaraja, listarBarajas, type InfoBaraja } from '@/lib/cargarBaraja';
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
  const [nombreUnirse, setNombreUnirse] = useState('');
  const [uniendo, setUniendo] = useState(false);
  const [barajasDisponibles, setBarajasDisponibles] = useState<InfoBaraja[]>([]);
  const [barajaUnirse, setBarajaUnirse] = useState<string>('');
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
        } else {
          // El segundo jugador todavía no se ha unido si su nombre es el placeholder.
          if (estado.jugadores[1].nombre === 'Esperando jugador…') {
            setEstadoUI({ tipo: 'unirse', estado });
          } else {
            setEstadoUI({ tipo: 'error', mensaje: 'La sala ya está completa.' });
          }
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

  // Cargar barajas disponibles cuando llegamos al formulario de unirse.
  useEffect(() => {
    if (estadoUI.tipo !== 'unirse') return;
    if (barajasDisponibles.length > 0) return;
    listarBarajas()
      .then((bs) => {
        setBarajasDisponibles(bs);
        if (bs.length > 0 && !barajaUnirse) setBarajaUnirse(bs[0].archivo);
      })
      .catch(() => undefined);
  }, [estadoUI.tipo, barajasDisponibles.length, barajaUnirse]);

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
    const nombre = nombreUnirse.trim();
    if (!nombre) return;
    if (!barajaUnirse) return;
    setUniendo(true);
    try {
      const baraja2 = await cargarBaraja(barajaUnirse);
      guardarSesion(codigo, 1);
      await unirseSalaOnline(codigo, nombre, baraja2, 1, estadoUI.estado);
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
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md rounded-lg border-2 border-sepia bg-pergamino p-6">
          <h2 className="text-center font-title text-2xl text-sepiaOscuro">Unirse a la sala</h2>
          <p className="mt-2 text-center text-sm text-sepiaOscuro/80">
            Código: <span className="font-mono font-bold">{codigo}</span>
          </p>
          <p className="mt-2 text-center text-sm text-sepiaOscuro/80">
            Te enfrentarás a <span className="font-semibold">{estadoUI.estado.jugadores[0].nombre}</span>.
          </p>
          <label className="mt-4 block">
            <span className="text-sm text-sepiaOscuro">Tu nombre</span>
            <input
              type="text"
              maxLength={20}
              value={nombreUnirse}
              onChange={(e) => setNombreUnirse(e.target.value)}
              className="mt-1 w-full rounded border border-sepia bg-pergamino px-3 py-2 text-sepiaOscuro outline-none focus:ring-2 focus:ring-sepia/40"
              placeholder="Nombre del jugador 2"
            />
          </label>
          <label className="mt-4 block">
            <span className="text-sm text-sepiaOscuro">
              Tu baraja (la que se usa cuando defiendes)
            </span>
            <select
              value={barajaUnirse}
              onChange={(e) => setBarajaUnirse(e.target.value)}
              className="mt-1 w-full rounded border border-sepia bg-pergamino px-3 py-2 text-sepiaOscuro outline-none focus:ring-2 focus:ring-sepia/40"
            >
              {barajasDisponibles.length === 0 ? (
                <option value="">Cargando…</option>
              ) : (
                barajasDisponibles.map((b) => (
                  <option key={b.archivo} value={b.archivo}>
                    {b.deck_name}
                  </option>
                ))
              )}
            </select>
          </label>
          <div className="mt-5 flex justify-end gap-2">
            <Boton variante="fantasma" onClick={() => router.replace('/')} disabled={uniendo}>
              Cancelar
            </Boton>
            <Boton
              variante="primario"
              onClick={onUnirme}
              disabled={uniendo || !nombreUnirse.trim() || !barajaUnirse}
            >
              {uniendo ? 'Uniéndose…' : 'Entrar'}
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

  const esperandoRival = partida.jugadores[1].nombre === 'Esperando jugador…';

  const salir = () => {
    olvidarSesion(codigo);
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
