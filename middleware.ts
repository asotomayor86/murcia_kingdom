import { NextResponse, type NextRequest } from 'next/server';
import { COOKIE_ACCESO, tokenEsperado } from '@/lib/acceso';

export const config = {
  // Se ejecuta en todo salvo recursos internos de Next y el favicon.
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

export async function middleware(req: NextRequest) {
  const password = process.env.ACCESO_PASSWORD;
  // Si no hay contraseña configurada (p. ej. desarrollo local), no hay barrera.
  if (!password) return NextResponse.next();

  const { pathname } = req.nextUrl;
  // La pantalla de acceso y su endpoint quedan siempre abiertos.
  if (pathname === '/acceso' || pathname === '/api/acceso') {
    return NextResponse.next();
  }
  // El área de admin tiene su propia clave (cookie rm_admin); se valida dentro
  // de la página y sus endpoints, así que la eximimos de la puerta compartida.
  if (pathname === '/admin' || pathname.startsWith('/api/admin')) {
    return NextResponse.next();
  }

  const cookie = req.cookies.get(COOKIE_ACCESO)?.value;
  const esperado = await tokenEsperado(password);
  if (cookie && cookie === esperado) {
    return NextResponse.next();
  }

  // No autorizado: las API responden 401; las páginas redirigen al acceso.
  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'no-autorizado' }, { status: 401 });
  }
  const url = req.nextUrl.clone();
  url.pathname = '/acceso';
  url.searchParams.set('volver', pathname + req.nextUrl.search);
  return NextResponse.redirect(url);
}
