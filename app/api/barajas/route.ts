import { promises as fs } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const dir = path.join(process.cwd(), 'public', 'barajas');
    const entradas = await fs.readdir(dir);
    const barajas = entradas
      .filter((f) => f.toLowerCase().endsWith('.json') && f !== 'index.json')
      .sort();
    return NextResponse.json({ barajas });
  } catch (e: unknown) {
    return NextResponse.json(
      { barajas: [], error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
