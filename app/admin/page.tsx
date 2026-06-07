'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Boton } from '@/components/ui/Boton';

interface ResumenSala {
  codigo: string;
  updated_at: string;
  version: number;
  nombre1: string | null;
  nombre2: string | null;
  jugador2_unido: string | null;
  fase: string | null;
  turno_actual: string | null;
  rondas_jugadas: string | null;
  limite_rondas: string | null;
  ganador: string | null;
  empate: string | null;
}

type Vista =
  | { tipo: 'comprobando' }
  | { tipo: 'login' }
  | { tipo: 'no-configurado' }
  | { tipo: 'listo' };

function hace(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '—';
  const s = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (s < 60) return 'hace unos segundos';
  const m = Math.floor(s / 60);
  if (m < 60) return `hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  return `hace ${d} día${d === 1 ? '' : 's'}`;
}

function estadoDe(s: ResumenSala): { texto: string; clase: string } {
  const terminada = s.ganador === '0' || s.ganador === '1' || s.empate === 'true';
  if (terminada) {
    if (s.empate === 'true') {
      return { texto: 'Terminada · empate', clase: 'bg-sepia/15 text-sepiaOscuro' };
    }
    const gan = s.ganador === '0' ? s.nombre1 : s.nombre2;
    return { texto: `Terminada · ganó ${gan ?? '—'}`, clase: 'bg-sepia/15 text-sepiaOscuro' };
  }
  if (s.jugador2_unido === 'false') {
    return { texto: 'Esperando rival', clase: 'bg-amber-200/60 text-amber-900' };
  }
  if (s.fase === 'colocacion-inicial') {
    return { texto: 'Colocación inicial', clase: 'bg-emerald-200/60 text-emerald-900' };
  }
  const turno = s.turno_actual === '0' ? s.nombre1 : s.nombre2;
  return { texto: `En juego · turno de ${turno ?? '—'}`, clase: 'bg-emerald-200/60 text-emerald-900' };
}

function ronda(s: ResumenSala): string {
  const r = s.rondas_jugadas ?? '0';
  const lim = s.limite_rondas;
  return lim && lim !== 'null' ? `Ronda ${r}/${lim}` : `Ronda ${r} · sin límite`;
}

export default function PaginaAdmin() {
  const router = useRouter();
  const [vista, setVista] = useState<Vista>({ tipo: 'comprobando' });
  const [salas, setSalas] = useState<ResumenSala[]>([]);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [trabajando, setTrabajando] = useState(false);
  const [confirmar, setConfirmar] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/salas', { cache: 'no-store' });
      if (res.status === 401) {
        setVista({ tipo: 'login' });
        return;
      }
      if (res.status === 503) {
        setVista({ tipo: 'no-configurado' });
        return;
      }
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { error?: string };
        setError(d.error || `Error ${res.status}`);
        return;
      }
      const data = (await res.json()) as { salas: ResumenSala[] };
      setSalas(data.salas);
      setVista({ tipo: 'listo' });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  // Refresco automático mientras vemos la lista, para que «hace X» y los estados
  // se mantengan al día.
  useEffect(() => {
    if (vista.tipo !== 'listo') return;
    const id = setInterval(() => void cargar(), 15000);
    return () => clearInterval(id);
  }, [vista.tipo, cargar]);

  const entrar = async () => {
    if (!password.trim()) return;
    setTrabajando(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/acceso', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { error?: string };
        setError(d.error || 'No se pudo acceder.');
        return;
      }
      setPassword('');
      await cargar();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setTrabajando(false);
    }
  };

  const cerrarSala = async (codigo: string) => {
    setTrabajando(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/salas/${encodeURIComponent(codigo)}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { error?: string };
        setError(d.error || `Error ${res.status}`);
        return;
      }
      setConfirmar(null);
      setSalas((prev) => prev.filter((s) => s.codigo !== codigo));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setTrabajando(false);
    }
  };

  const salir = async () => {
    await fetch('/api/admin/acceso', { method: 'DELETE' }).catch(() => undefined);
    setVista({ tipo: 'login' });
    setSalas([]);
  };

  // --- Vistas ---

  if (vista.tipo === 'comprobando') {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-sepiaOscuro/70">Comprobando…</p>
      </main>
    );
  }

  if (vista.tipo === 'no-configurado') {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <div className="max-w-md rounded-lg border-2 border-sepia bg-pergamino p-6 text-center">
          <h1 className="font-title text-xl text-sepiaOscuro">Administración no configurada</h1>
          <p className="mt-2 text-sm text-sepiaOscuro/80">
            Define la variable de entorno <code className="font-mono">ADMIN_PASSWORD</code> para
            habilitar la gestión de salas.
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

  if (vista.tipo === 'login') {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-lg border-2 border-sepia bg-pergamino p-6">
          <h1 className="text-center font-title text-2xl text-sepiaOscuro">Gestión de salas</h1>
          <p className="mt-2 text-center text-sm text-sepiaOscuro/80">
            Área de administración. Introduce la clave de admin.
          </p>
          <label className="mt-5 block">
            <span className="text-sm text-sepiaOscuro">Clave de admin</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void entrar();
              }}
              autoFocus
              className="mt-1 w-full rounded border border-sepia bg-pergamino px-3 py-2 text-sepiaOscuro outline-none focus:ring-2 focus:ring-sepia/40"
              placeholder="••••••••"
            />
          </label>
          {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
          <div className="mt-5 flex justify-between gap-2">
            <Boton variante="fantasma" onClick={() => router.replace('/')}>
              Volver
            </Boton>
            <Boton variante="primario" onClick={() => void entrar()} disabled={trabajando || !password.trim()}>
              {trabajando ? 'Comprobando…' : 'Entrar'}
            </Boton>
          </div>
        </div>
      </main>
    );
  }

  // vista.tipo === 'listo'
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 py-8">
      <div className="rounded-2xl border-2 border-sepia bg-pergamino p-6 shadow-panel">
        <div className="flex items-center justify-between gap-2">
          <h1 className="font-title text-3xl tracking-wide text-sepiaOscuro">Salas abiertas</h1>
          <div className="flex gap-2">
            <Boton variante="secundario" onClick={() => void cargar()} disabled={trabajando}>
              Actualizar
            </Boton>
            <Boton variante="fantasma" onClick={() => void salir()}>
              Salir
            </Boton>
          </div>
        </div>
        <p className="mt-1 text-sm text-sepiaOscuro/70">
          {salas.length === 0
            ? 'No hay ninguna partida en la base de datos.'
            : `${salas.length} ${salas.length === 1 ? 'partida' : 'partidas'} · se refresca sola cada 15 s`}
        </p>

        {error && <p className="mt-3 rounded bg-red-100 p-2 text-sm text-red-900">{error}</p>}

        <ul className="mt-4 space-y-3">
          {salas.map((s) => {
            const est = estadoDe(s);
            return (
              <li
                key={s.codigo}
                className="rounded-lg border border-sepia/40 bg-pergaminoOscuro/20 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-lg font-bold tracking-widest text-sepiaOscuro">
                    {s.codigo}
                  </span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${est.clase}`}>
                    {est.texto}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-sepiaOscuro/90">
                  <span>
                    <span className="font-semibold text-jugador0">{s.nombre1 ?? '—'}</span>
                    <span className="text-sepiaOscuro/50"> vs </span>
                    <span className="font-semibold text-jugador1">{s.nombre2 ?? '—'}</span>
                  </span>
                  <span className="text-sepiaOscuro/60">·</span>
                  <span className="text-sepiaOscuro/80">{ronda(s)}</span>
                </div>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs text-sepiaOscuro/60">
                    Último movimiento: {hace(s.updated_at)}
                  </span>
                  {confirmar === s.codigo ? (
                    <span className="flex items-center gap-2">
                      <span className="text-xs text-sepiaOscuro/80">¿Cerrar esta sala?</span>
                      <Boton variante="peligro" onClick={() => void cerrarSala(s.codigo)} disabled={trabajando}>
                        Sí, cerrar
                      </Boton>
                      <Boton variante="fantasma" onClick={() => setConfirmar(null)} disabled={trabajando}>
                        No
                      </Boton>
                    </span>
                  ) : (
                    <Boton variante="secundario" onClick={() => setConfirmar(s.codigo)}>
                      Cerrar
                    </Boton>
                  )}
                </div>
              </li>
            );
          })}
        </ul>

        <div className="mt-6">
          <Boton variante="fantasma" onClick={() => router.replace('/')}>
            ← Volver al menú
          </Boton>
        </div>
      </div>
    </main>
  );
}
