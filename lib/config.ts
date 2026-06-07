// Configuración visible en el cliente. El modo online se sirve desde el servidor
// (Neon), así que el navegador no puede leer DATABASE_URL: usamos una bandera
// pública para mostrar u ocultar las opciones online en el menú.
export function onlineDisponible(): boolean {
  return process.env.NEXT_PUBLIC_ONLINE === '1';
}
