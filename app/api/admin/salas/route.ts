import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { adminAutenticado, adminConfigurado } from '@/lib/adminAuth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Lista resumida de salas. Extrae solo unos campos del JSON (no el estado
// completo ni las barajas) para que la respuesta sea ligera.
export async function GET() {
  if (!adminConfigurado()) {
    return NextResponse.json(
      { error: 'El área de administración no está configurada.' },
      { status: 503 },
    );
  }
  if (!(await adminAutenticado())) {
    return NextResponse.json({ error: 'no-autorizado' }, { status: 401 });
  }
  try {
    const filas = await sql()`
      select
        codigo,
        updated_at,
        version,
        estado->'jugadores'->0->>'nombre' as nombre1,
        estado->'jugadores'->1->>'nombre' as nombre2,
        estado->>'jugador2Unido'         as jugador2_unido,
        estado->>'fase'                   as fase,
        estado->>'turnoActual'            as turno_actual,
        estado->>'rondasJugadas'          as rondas_jugadas,
        estado->>'limiteRondas'           as limite_rondas,
        estado->>'ganador'                as ganador,
        estado->>'empate'                 as empate
      from partidas
      order by updated_at desc
    `;
    return NextResponse.json({ salas: filas });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
