// Utilidades de acceso. Usa Web Crypto, disponible tanto en el runtime Edge
// (middleware) como en Node.
//
// Dos puertas independientes:
//  - Acceso compartido (rm_acceso): la contraseña del grupo, exige el middleware.
//  - Admin (rm_admin): clave aparte para la pantalla de gestión de salas.

export const COOKIE_ACCESO = 'rm_acceso';
export const COOKIE_ADMIN = 'rm_admin';

/**
 * Token determinista derivado de un secreto. El cliente nunca ve el secreto: el
 * servidor guarda este hash en una cookie httpOnly y lo recalcula para comparar.
 * El `scope` separa los hashes de acceso y de admin aunque compartan secreto.
 */
async function hash(scope: string, secreto: string): Promise<string> {
  const data = new TextEncoder().encode(`risk-murcia:${scope}:${secreto}`);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function tokenEsperado(password: string): Promise<string> {
  return hash('acceso', password);
}

export function tokenAdmin(password: string): Promise<string> {
  return hash('admin', password);
}
