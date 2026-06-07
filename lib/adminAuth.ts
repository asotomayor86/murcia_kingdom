import { cookies } from 'next/headers';
import { COOKIE_ADMIN, tokenAdmin } from './acceso';

/**
 * Comprueba si la petición trae una cookie de admin válida. Si no hay
 * ADMIN_PASSWORD configurada, el área de admin queda bloqueada (no abierta).
 * Solo debe usarse en código de servidor (route handlers).
 */
export async function adminAutenticado(): Promise<boolean> {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) return false;
  const c = cookies().get(COOKIE_ADMIN)?.value;
  return !!c && c === (await tokenAdmin(pw));
}

export function adminConfigurado(): boolean {
  return !!process.env.ADMIN_PASSWORD;
}
