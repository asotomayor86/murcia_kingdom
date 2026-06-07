// Utilidades de la puerta de acceso (contraseña compartida única).
// Usa Web Crypto, disponible tanto en el runtime Edge (middleware) como en Node.

export const COOKIE_ACCESO = 'rm_acceso';

/**
 * Token determinista derivado de la contraseña. El cliente nunca ve la
 * contraseña: el servidor guarda este hash en una cookie httpOnly y el
 * middleware lo recalcula para comparar.
 */
export async function tokenEsperado(password: string): Promise<string> {
  const data = new TextEncoder().encode(`risk-murcia:acceso:${password}`);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
