'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Boton } from '@/components/ui/Boton';

function FormularioAcceso() {
  const router = useRouter();
  const params = useSearchParams();
  const volver = params.get('volver') || '/';

  const [password, setPassword] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const entrar = async () => {
    if (!password.trim()) return;
    setEnviando(true);
    setError(null);
    try {
      const res = await fetch('/api/acceso', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error || 'No se pudo acceder.');
        return;
      }
      router.replace(volver.startsWith('/') ? volver : '/');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md rounded-lg border-2 border-sepia bg-pergamino p-6">
        <h1 className="text-center font-title text-2xl text-sepiaOscuro">Reino de Mvrcia</h1>
        <p className="mt-2 text-center text-sm text-sepiaOscuro/80">
          Este juego es privado. Introduce la contraseña de invitación.
        </p>
        <label className="mt-5 block">
          <span className="text-sm text-sepiaOscuro">Contraseña</span>
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
        <div className="mt-5 flex justify-end">
          <Boton variante="primario" onClick={() => void entrar()} disabled={enviando || !password.trim()}>
            {enviando ? 'Comprobando…' : 'Entrar'}
          </Boton>
        </div>
      </div>
    </main>
  );
}

export default function PaginaAcceso() {
  return (
    <Suspense fallback={<main className="min-h-screen" />}>
      <FormularioAcceso />
    </Suspense>
  );
}
