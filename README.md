# Risk Murcia — Reino de Mvrcia

Juego de conquista por turnos para **2 jugadores**, ambientado en la Región de Murcia.
Las tiradas de dados se sustituyen por **preguntas de conocimiento general**.

Dos modos:

- **Local**: ambos jugadores en el mismo dispositivo (sin internet).
- **Online**: cada jugador desde su dispositivo, sincronizado vía **Neon** (Postgres)
  con actualizaciones en tiempo real por **SSE** (Server-Sent Events).

El juego es **privado**: una contraseña de invitación compartida protege el acceso.

## Arrancar en local

```bash
npm install
npm run dev
```

Abre <http://localhost:3000>. El **modo local** funciona sin configurar nada más.
Si no defines `ACCESO_PASSWORD`, no habrá pantalla de acceso (cómodo en desarrollo).

## Activar el modo online

El modo online necesita una base de datos **Neon** (Postgres). Todo el acceso a la
base de datos ocurre en el servidor (API routes de Next.js); la cadena de conexión
nunca llega al navegador.

### 1. Crear la tabla

En la consola SQL de Neon (o `psql`) ejecuta:

```sql
create table if not exists partidas (
  codigo     text primary key,
  estado     jsonb not null,
  barajas    jsonb,
  version    integer not null default 0,
  updated_at timestamptz not null default now()
);
```

> No hace falta RLS ni políticas: la base de datos solo se toca desde el servidor.
> La columna `barajas` guarda las dos barajas (inmutables) una sola vez, para que
> el `estado` que se sincroniza en cada jugada vaya ligero. `npm run db:init`
> crea la tabla y migra una base de datos existente de forma idempotente.

### 2. Configurar variables de entorno en local

```bash
cp .env.local.example .env.local
```

Edita `.env.local`:

```
DATABASE_URL=postgresql://usuario:password@host.neon.tech/dbname?sslmode=require
ACCESO_PASSWORD=la-clave-que-compartes-con-tus-amigos
NEXT_PUBLIC_ONLINE=1
```

Reinicia `npm run dev`. En el menú aparecerán habilitadas las opciones online.

## Desplegar a Vercel (con Neon)

1. Sube el repo a GitHub.
2. En Vercel: **New Project → Import** el repo. Framework auto-detectado: Next.js.
3. **Crear la base de datos Neon**: en el proyecto de Vercel, pestaña **Storage →
   Create Database → Neon**. Al conectarla, Vercel inyecta automáticamente la
   variable `DATABASE_URL` (entre otras) en el proyecto.
4. Crea la tabla: abre la consola SQL de Neon (desde el dashboard de Neon o el
   panel de Storage en Vercel) y ejecuta el `create table` del paso anterior.
5. En **Settings → Environment Variables** del proyecto en Vercel añade:
   - `ACCESO_PASSWORD` → la contraseña de invitación que repartirás.
   - `NEXT_PUBLIC_ONLINE` → `1`.
6. **Deploy**. Comparte la URL pública y la contraseña con tu grupo.

Para invitar a alguien: dale la **URL** + la **contraseña**. Para jugar una partida,
uno crea la sala (recibe un código de 6 caracteres / una URL) y se la pasa al rival.

## Tests

```bash
npm run test
```

## Build de producción

```bash
npm run build
npm run start
```

## Añadir una nueva baraja de preguntas

1. Coloca el archivo `.json` en `public/barajas/`. La app detecta automáticamente todos los
   `.json` de esa carpeta vía la ruta `GET /api/barajas` y los muestra en el selector.
2. Estructura mínima del archivo:

   ```json
   {
     "deck_id": "mi_deck",
     "deck_name": "Mi baraja",
     "description": "...",
     "version": "1.0",
     "language": "es",
     "themes": ["..."],
     "levels": { "1": "Muy fácil", "...": "..." },
     "questions": [
       {
         "id": 1, "nivel": 1, "tema": "geografia",
         "enunciado": "¿...?",
         "opciones": ["A", "B", "C", "D"],
         "correcta": 0, "explicacion": "..."
       }
     ]
   }
   ```

   Debe haber al menos una pregunta de cada nivel del 1 al 5 y los `id` no pueden repetirse.
   Las barajas con formato inválido se descartan silenciosamente.

## Estructura

- `app/` — Páginas Next.js: menú, partida local (`/partida`), partida online
  (`/online/[codigo]`), pantalla de acceso (`/acceso`) y rutas API (`/api/salas`,
  `/api/acceso`, `/api/barajas`).
- `components/` — Mapa, paneles, diálogos, UI primitiva, componente `Juego.tsx` compartido.
- `lib/` — Tipos, datos estáticos, reglas, store Zustand, persistencia, cargador de
  barajas, cliente Neon (`db.ts`), capa online (`online.ts`) y acceso (`acceso.ts`).
- `middleware.ts` — Puerta de acceso (contraseña compartida) sobre todas las rutas.
- `tests/` — Tests con Vitest sobre `lib/reglas.ts`.
- `public/barajas/` — Barajas de preguntas + índice.

## Notas técnicas

- **Modelo de concurrencia online**: cada cliente escribe en la base de datos solo
  cuando le toca actuar (turno activo, o defensor durante una pregunta). El otro
  cliente recibe los cambios por SSE. La UI gatea los inputs según `miIndice`.
- **Tiempo real (SSE)**: el navegador abre un `EventSource` contra
  `GET /api/salas/[codigo]/stream`. El servidor sondea Neon y empuja el estado
  cuando cambia la columna `version`. El flujo se cierra cada ~45 s y el navegador
  reconecta solo (dentro de los límites de funciones de Vercel).
- **Acceso**: `middleware.ts` exige una cookie de acceso en todas las rutas; quien
  no la tenga es redirigido a `/acceso`, donde introduce la contraseña compartida
  (`ACCESO_PASSWORD`). Las rutas API responden `401` en su lugar.
- **Persistencia**: el modo local guarda en `localStorage`; el modo online en Neon
  (la sesión — qué jugador eres en cada sala — sí queda en `localStorage`).
- **Adyacencia marítima**: Águilas ↔ Cartagena cuenta como adyacente normal en ataques y
  fortificación.
- **Preguntas**: no se repiten en la misma partida hasta agotar el nivel; entonces se vacía
  el conjunto de usadas para ese nivel y se vuelve a sortear.
