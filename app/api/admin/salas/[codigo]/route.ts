import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { adminAutenticado, adminConfigurado } from '@/lib/adminAuth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Cierra (borra) una sala. Solo admin.
export async function DELETE(
  _req: Request,
  { params }: { params: { codigo: string } },
) {
  if (!adminConfigurado()) {
    return NextResponse.json(
      { error: 'El área de administración no está configurada.' },
      { status: 503 },
    );
  }
  if (!(await adminAutenticado())) {
    return NextResponse.json({ error: 'no-autorizado' }, { status: 401 });
  }
  const codigo = (params.codigo ?? '').toUpperCase();
  if (!/^[A-Z0-9]{4,12}$/.test(codigo)) {
    return NextResponse.json({ error: 'Código inválido.' }, { status: 400 });
  }
  try {
    const filas = await sql()`
      delete from partidas where codigo = ${codigo} returning codigo
    `;
    if (filas.length === 0) {
      return NextResponse.json({ error: 'no-existe' }, { status: 404 });
    }
    return NextResponse.json({ ok: true, codigo });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
