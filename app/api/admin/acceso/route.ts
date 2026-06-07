import { NextResponse } from 'next/server';
import { COOKIE_ADMIN, tokenAdmin } from '@/lib/acceso';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Login de admin: comprueba ADMIN_PASSWORD y pone la cookie rm_admin.
export async function POST(req: Request) {
  try {
    const real = process.env.ADMIN_PASSWORD;
    if (!real) {
      return NextResponse.json(
        { error: 'El área de administración no está configurada.' },
        { status: 503 },
      );
    }
    const body = (await req.json()) as { password?: unknown };
    const password = typeof body.password === 'string' ? body.password : '';
    if (password !== real) {
      return NextResponse.json({ error: 'Clave incorrecta.' }, { status: 401 });
    }

    const token = await tokenAdmin(real);
    const res = NextResponse.json({ ok: true });
    res.cookies.set(COOKIE_ADMIN, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 días
    });
    return res;
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}

// Logout de admin: borra la cookie.
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_ADMIN, '', { path: '/', maxAge: 0 });
  return res;
}
