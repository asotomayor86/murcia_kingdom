import { NextResponse } from 'next/server';
import { COOKIE_ACCESO, tokenEsperado } from '@/lib/acceso';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const real = process.env.ACCESO_PASSWORD;
    if (!real) {
      // Sin contraseña configurada el acceso es libre; nada que validar.
      return NextResponse.json({ ok: true });
    }
    const body = (await req.json()) as { password?: unknown };
    const password = typeof body.password === 'string' ? body.password : '';
    if (password !== real) {
      return NextResponse.json({ error: 'Contraseña incorrecta.' }, { status: 401 });
    }

    const token = await tokenEsperado(real);
    const res = NextResponse.json({ ok: true });
    res.cookies.set(COOKIE_ACCESO, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 días
    });
    return res;
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
