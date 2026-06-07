'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Boton } from '@/components/ui/Boton';
import { Modal } from '@/components/ui/Modal';
import { ComoJugar } from '@/components/ComoJugar';
import { listarBarajas, cargarBaraja, type InfoBaraja } from '@/lib/cargarBaraja';
import { hayPartidaGuardada, borrar } from '@/lib/persistencia';
import { useStore } from '@/lib/store';
import { onlineDisponible } from '@/lib/config';
import {
  crearSala,
  generarCodigoSala,
  guardarSesion,
} from '@/lib/online';

type Modal =
  | null
  | 'local'
  | 'crear-online'
  | 'unirse-online'
  | 'ayuda';

export default function PaginaMenu() {
  const router = useRouter();
  const iniciarPartida = useStore((s) => s.iniciarPartida);
  const iniciarSalaOnline = useStore((s) => s.iniciarSalaOnline);
  const cargarDesdeAlmacenamiento = useStore((s) => s.cargarDesdeAlmacenamiento);

  const [partidaGuardada, setPartidaGuardada] = useState(false);
  const [modal, setModal] = useState<Modal>(null);
  const [nombre1, setNombre1] = useState('');
  const [nombre2, setNombre2] = useState('');
  const [codigoUnirse, setCodigoUnirse] = useState('');
  const [barajas, setBarajas] = useState<InfoBaraja[]>([]);
  const [barajaJ1, setBarajaJ1] = useState<string>('');
  const [barajaJ2, setBarajaJ2] = useState<string>('');
  const [duracionLocal, setDuracionLocal] = useState<string>('15');
  const [duracionOnline, setDuracionOnline] = useState<string>('15');
  const [repartoAleatorio, setRepartoAleatorio] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trabajando, setTrabajando] = useState(false);

  const hayOnline = onlineDisponible();

  useEffect(() => {
    setPartidaGuardada(hayPartidaGuardada());
  }, []);

  useEffect(() => {
    if (modal !== 'local' && modal !== 'crear-online') return;
    setError(null);
    listarBarajas()
      .then((bs) => {
        setBarajas(bs);
        if (bs.length > 0) {
          if (!barajaJ1) setBarajaJ1(bs[0].archivo);
          if (!barajaJ2) setBarajaJ2(bs[0].archivo);
        }
      })
      .catch((e) => setError(String(e?.message ?? e)));
  }, [modal]); // eslint-disable-line react-hooks/exhaustive-deps

  const continuar = () => {
    if (cargarDesdeAlmacenamiento()) {
      router.push('/partida');
    }
  };

  const empezarLocal = async () => {
    setError(null);
    if (!nombre1.trim() || !nombre2.trim()) {
      setError('Introduce los dos nombres.');
      return;
    }
    if (!barajaJ1 || !barajaJ2) {
      setError('Selecciona una baraja para cada jugador.');
      return;
    }
    try {
      setTrabajando(true);
      const [b1, b2] =
        barajaJ1 === barajaJ2
          ? await cargarBaraja(barajaJ1).then((b) => [b, b] as const)
          : await Promise.all([cargarBaraja(barajaJ1), cargarBaraja(barajaJ2)]);
      borrar();
      iniciarPartida(nombre1, nombre2, b1, b2, duracionALimite(duracionLocal), repartoAleatorio);
      router.push('/partida');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setTrabajando(false);
    }
  };

  const crearOnline = async () => {
    setError(null);
    if (!nombre1.trim() || !nombre2.trim()) {
      setError('Introduce los dos nombres.');
      return;
    }
    if (!barajaJ1 || !barajaJ2) {
      setError('Selecciona una baraja para cada jugador.');
      return;
    }
    try {
      setTrabajando(true);
      const [b1, b2] =
        barajaJ1 === barajaJ2
          ? await cargarBaraja(barajaJ1).then((b) => [b, b] as const)
          : await Promise.all([cargarBaraja(barajaJ1), cargarBaraja(barajaJ2)]);
      const codigo = generarCodigoSala();
      iniciarSalaOnline(
        nombre1, b1, nombre2, b2, codigo, duracionALimite(duracionOnline), repartoAleatorio,
      );
      const estado = useStore.getState().partida;
      if (!estado) throw new Error('No se pudo iniciar la partida.');
      await crearSala(codigo, estado);
      guardarSesion(codigo, 0);
      router.push(`/online/${codigo}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setTrabajando(false);
    }
  };

  const unirseOnline = () => {
    setError(null);
    const codigo = codigoUnirse.trim().toUpperCase();
    if (codigo.length < 4) {
      setError('Introduce un código válido.');
      return;
    }
    router.push(`/online/${codigo}`);
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center px-4 py-10">
      <div className="w-full rounded-2xl border-2 border-sepia bg-pergamino p-8 shadow-panel">
        <h1 className="text-center font-title text-5xl tracking-widest text-sepiaOscuro">
          REINO DE MVRCIA
        </h1>
        <p className="mt-2 text-center font-serif italic text-sepiaOscuro/80">
          Juego de conquista por turnos · 2 jugadores
        </p>

        <div className="mt-8 grid grid-cols-1 gap-3 md:grid-cols-2">
          <Boton variante="primario" onClick={() => setModal('local')}>
            Partida local (mismo dispositivo)
          </Boton>
          <Boton
            variante="primario"
            onClick={() => setModal('crear-online')}
            disabled={!hayOnline}
            title={hayOnline ? undefined : 'El modo online no está habilitado en esta instancia'}
          >
            Crear sala online
          </Boton>
          <Boton
            variante="secundario"
            onClick={() => setModal('unirse-online')}
            disabled={!hayOnline}
          >
            Unirse con código
          </Boton>
          <Boton variante="secundario" onClick={continuar} disabled={!partidaGuardada}>
            Continuar partida local
          </Boton>
        </div>

        {!hayOnline && (
          <p className="mt-4 text-center text-xs text-sepiaOscuro/70">
            El modo online no está habilitado en esta instancia.
          </p>
        )}

        <div className="mt-6 text-center">
          <Boton variante="fantasma" onClick={() => setModal('ayuda')}>
            Cómo jugar
          </Boton>
        </div>
      </div>

      <Modal
        abierto={modal === 'local'}
        titulo="Nueva partida local"
        onCerrar={() => setModal(null)}
        ancho="md"
      >
        <div className="space-y-4">
          <p className="text-xs text-sepiaOscuro/70">
            La baraja de cada jugador se usa <em>cuando ese jugador defiende</em>.
          </p>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="space-y-3 rounded border border-jugador0/40 bg-pergamino p-3">
              <label className="block">
                <span className="text-sm font-semibold text-jugador0">Jugador 1 (azul)</span>
                <input
                  type="text"
                  maxLength={20}
                  value={nombre1}
                  onChange={(e) => setNombre1(e.target.value)}
                  className="mt-1 w-full rounded border border-sepia bg-pergamino px-3 py-2 text-sepiaOscuro outline-none focus:ring-2 focus:ring-sepia/40"
                  placeholder="Nombre"
                />
              </label>
              <SelectorBaraja
                barajas={barajas}
                valor={barajaJ1}
                onCambio={setBarajaJ1}
                etiqueta="Baraja al defender"
              />
            </div>
            <div className="space-y-3 rounded border border-jugador1/40 bg-pergamino p-3">
              <label className="block">
                <span className="text-sm font-semibold text-jugador1">Jugador 2 (rojo)</span>
                <input
                  type="text"
                  maxLength={20}
                  value={nombre2}
                  onChange={(e) => setNombre2(e.target.value)}
                  className="mt-1 w-full rounded border border-sepia bg-pergamino px-3 py-2 text-sepiaOscuro outline-none focus:ring-2 focus:ring-sepia/40"
                  placeholder="Nombre"
                />
              </label>
              <SelectorBaraja
                barajas={barajas}
                valor={barajaJ2}
                onCambio={setBarajaJ2}
                etiqueta="Baraja al defender"
              />
            </div>
          </div>
          <SelectorDuracion valor={duracionLocal} onCambio={setDuracionLocal} />
          <CasillaRepartoAleatorio valor={repartoAleatorio} onCambio={setRepartoAleatorio} />
          {error && <p className="rounded bg-red-100 p-2 text-sm text-red-900">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Boton variante="fantasma" onClick={() => setModal(null)} disabled={trabajando}>
              Cancelar
            </Boton>
            <Boton variante="primario" onClick={empezarLocal} disabled={trabajando}>
              {trabajando ? 'Iniciando…' : 'Empezar'}
            </Boton>
          </div>
        </div>
      </Modal>

      <Modal
        abierto={modal === 'crear-online'}
        titulo="Crear sala online"
        onCerrar={() => setModal(null)}
        ancho="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-sepiaOscuro/80">
            Configura a los <strong>dos jugadores</strong> (nombres y barajas). Tú jugarás
            como Jugador 1 (azul). Crearás una sala con un código único: compártelo con tu
            rival, que verá esta configuración pero no podrá cambiarla.
          </p>
          <p className="text-xs text-sepiaOscuro/70">
            La baraja de cada jugador se usa <em>cuando ese jugador defiende</em>.
          </p>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="space-y-3 rounded border border-jugador0/40 bg-pergamino p-3">
              <label className="block">
                <span className="text-sm font-semibold text-jugador0">Jugador 1 (azul) · tú</span>
                <input
                  type="text"
                  maxLength={20}
                  value={nombre1}
                  onChange={(e) => setNombre1(e.target.value)}
                  className="mt-1 w-full rounded border border-sepia bg-pergamino px-3 py-2 text-sepiaOscuro outline-none focus:ring-2 focus:ring-sepia/40"
                  placeholder="Nombre"
                />
              </label>
              <SelectorBaraja
                barajas={barajas}
                valor={barajaJ1}
                onCambio={setBarajaJ1}
                etiqueta="Baraja al defender"
              />
            </div>
            <div className="space-y-3 rounded border border-jugador1/40 bg-pergamino p-3">
              <label className="block">
                <span className="text-sm font-semibold text-jugador1">Jugador 2 (rojo) · rival</span>
                <input
                  type="text"
                  maxLength={20}
                  value={nombre2}
                  onChange={(e) => setNombre2(e.target.value)}
                  className="mt-1 w-full rounded border border-sepia bg-pergamino px-3 py-2 text-sepiaOscuro outline-none focus:ring-2 focus:ring-sepia/40"
                  placeholder="Nombre"
                />
              </label>
              <SelectorBaraja
                barajas={barajas}
                valor={barajaJ2}
                onCambio={setBarajaJ2}
                etiqueta="Baraja al defender"
              />
            </div>
          </div>
          <SelectorDuracion valor={duracionOnline} onCambio={setDuracionOnline} />
          <CasillaRepartoAleatorio valor={repartoAleatorio} onCambio={setRepartoAleatorio} />
          {error && <p className="rounded bg-red-100 p-2 text-sm text-red-900">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Boton variante="fantasma" onClick={() => setModal(null)} disabled={trabajando}>
              Cancelar
            </Boton>
            <Boton variante="primario" onClick={crearOnline} disabled={trabajando}>
              {trabajando ? 'Creando…' : 'Crear sala'}
            </Boton>
          </div>
        </div>
      </Modal>

      <Modal
        abierto={modal === 'unirse-online'}
        titulo="Unirse a una sala"
        onCerrar={() => setModal(null)}
        ancho="sm"
      >
        <div className="space-y-4">
          <label className="block">
            <span className="text-sm text-sepiaOscuro">Código de la sala</span>
            <input
              type="text"
              maxLength={6}
              value={codigoUnirse}
              onChange={(e) => setCodigoUnirse(e.target.value.toUpperCase())}
              className="mt-1 w-full rounded border border-sepia bg-pergamino px-3 py-2 text-center font-mono text-2xl tracking-widest text-sepiaOscuro outline-none focus:ring-2 focus:ring-sepia/40"
              placeholder="ABC123"
            />
          </label>
          {error && <p className="rounded bg-red-100 p-2 text-sm text-red-900">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Boton variante="fantasma" onClick={() => setModal(null)}>
              Cancelar
            </Boton>
            <Boton variante="primario" onClick={unirseOnline}>
              Entrar
            </Boton>
          </div>
        </div>
      </Modal>

      <Modal abierto={modal === 'ayuda'} titulo="Cómo jugar" onCerrar={() => setModal(null)} ancho="xl">
        <ComoJugar onCerrar={() => setModal(null)} />
      </Modal>
    </main>
  );
}

// Convierte el valor del selector ('10','15','20','30','sin') al límite de rondas.
function duracionALimite(valor: string): number | null {
  return valor === 'sin' ? null : Number(valor);
}

const OPCIONES_DURACION: { valor: string; etiqueta: string }[] = [
  { valor: '10', etiqueta: '10 rondas (corta)' },
  { valor: '15', etiqueta: '15 rondas (media)' },
  { valor: '20', etiqueta: '20 rondas (larga)' },
  { valor: '30', etiqueta: '30 rondas (épica)' },
  { valor: 'sin', etiqueta: 'Sin límite (conquista total)' },
];

function SelectorDuracion({
  valor,
  onCambio,
}: {
  valor: string;
  onCambio: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm text-sepiaOscuro">Duración de la partida</span>
      <select
        value={valor}
        onChange={(e) => onCambio(e.target.value)}
        className="mt-1 w-full rounded border border-sepia bg-pergamino px-3 py-2 text-sepiaOscuro outline-none focus:ring-2 focus:ring-sepia/40"
      >
        {OPCIONES_DURACION.map((o) => (
          <option key={o.valor} value={o.valor}>
            {o.etiqueta}
          </option>
        ))}
      </select>
      <span className="mt-1 block text-xs text-sepiaOscuro/70">
        Una ronda = juegan ambos. Al acabar gana quien más puntos tenga: +1 por
        territorio y bonus por Murcia (+2), Cartagena (+2) y Lorca (+1).
      </span>
    </label>
  );
}

function CasillaRepartoAleatorio({
  valor,
  onCambio,
}: {
  valor: boolean;
  onCambio: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2 rounded border border-sepia/40 bg-pergaminoOscuro/20 p-3">
      <input
        type="checkbox"
        checked={valor}
        onChange={(e) => onCambio(e.target.checked)}
        className="mt-0.5 h-4 w-4 accent-sepia"
      />
      <span className="text-sm text-sepiaOscuro">
        Reparto aleatorio de los refuerzos iniciales
        <span className="mt-0.5 block text-xs text-sepiaOscuro/70">
          Si se activa, las tropas iniciales se reparten solas al azar entre tus
          territorios (te saltas la colocación manual).
        </span>
      </span>
    </label>
  );
}

function SelectorBaraja({
  barajas,
  valor,
  onCambio,
  etiqueta = 'Baraja de preguntas',
}: {
  barajas: InfoBaraja[];
  valor: string;
  onCambio: (v: string) => void;
  etiqueta?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm text-sepiaOscuro">{etiqueta}</span>
      <select
        value={valor}
        onChange={(e) => onCambio(e.target.value)}
        className="mt-1 w-full rounded border border-sepia bg-pergamino px-3 py-2 text-sepiaOscuro outline-none focus:ring-2 focus:ring-sepia/40"
      >
        {barajas.length === 0 ? (
          <option value="">Cargando…</option>
        ) : (
          barajas.map((b) => (
            <option key={b.archivo} value={b.archivo}>
              {b.deck_name}
            </option>
          ))
        )}
      </select>
    </label>
  );
}
