'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Boton } from '@/components/ui/Boton';

interface Diapositiva {
  icono: string;
  titulo: string;
  cuerpo: ReactNode;
}

// Pequeños bloques reutilizables para mantener las diapositivas legibles.
function Dato({ children }: { children: ReactNode }) {
  return (
    <span className="rounded bg-sepia/10 px-1.5 py-0.5 font-semibold text-sepiaOscuro">
      {children}
    </span>
  );
}

function Lista({ items }: { items: ReactNode[] }) {
  return (
    <ul className="mt-1 space-y-1.5 text-sm leading-relaxed text-sepiaOscuro/90">
      {items.map((it, i) => (
        <li key={i} className="flex gap-2">
          <span className="mt-1 h-1.5 w-1.5 flex-none rounded-full bg-sepia/60" />
          <span>{it}</span>
        </li>
      ))}
    </ul>
  );
}

const COMARCAS_BONUS: [string, number][] = [
  ['Noroeste', 5],
  ['Valle del Guadalentín', 5],
  ['Campo de Cartagena', 5],
  ['Vega Media', 3],
  ['Huerta de Murcia', 3],
  ['Altiplano', 2],
  ['Vega Alta', 2],
  ['Costa Cálida', 2],
  ['Río Mula', 1],
  ['Mar Menor', 1],
];

const VALORES_CANJE = [
  ['1.er canje', '4'],
  ['2.º', '6'],
  ['3.º', '8'],
  ['4.º', '10'],
  ['5.º', '12'],
  ['6.º', '15'],
  ['7.º y +', '+5 cada vez'],
];

const DIAPOSITIVAS: Diapositiva[] = [
  {
    icono: '👋',
    titulo: 'Bienvenido al Reino de Mvrcia',
    cuerpo: (
      <div className="space-y-3 text-sm leading-relaxed text-sepiaOscuro/90">
        <p>
          Un juego de <strong>conquista por turnos para 2 jugadores</strong> ambientado en
          la Región de Murcia. Repartís sus 26 municipios y lucháis por dominarlos todos.
        </p>
        <p>
          El gran giro: <strong>no hay dados</strong>. Las batallas se deciden con{' '}
          <strong>preguntas de cultura general</strong>. Aquí manda la cabeza, no la suerte.
        </p>
        <p className="text-sepiaOscuro/70">
          Desliza con las flechas, los puntos de abajo, las teclas ← → o arrastrando con el
          dedo. Son 12 diapositivas; en un par de minutos lo tendrás todo claro.
        </p>
      </div>
    ),
  },
  {
    icono: '🎯',
    titulo: 'El objetivo',
    cuerpo: (
      <div className="space-y-2">
        <p className="text-sm leading-relaxed text-sepiaOscuro/90">
          Hay <strong>dos formas de ganar</strong>:
        </p>
        <Lista
          items={[
            <>
              <strong>Conquista total:</strong> hazte con los 26 territorios y ganas al
              instante.
            </>,
            <>
              <strong>A puntos:</strong> si la partida tiene límite de rondas, al agotarse
              gana quien más puntos tenga.
            </>,
          ]}
        />
        <p className="mt-2 text-sm text-sepiaOscuro/90">
          Puntuación final: <Dato>+1</Dato> por cada territorio, más bonus por las plazas
          clave: <Dato>Murcia +2</Dato>, <Dato>Cartagena +2</Dato>, <Dato>Lorca +1</Dato>.
        </p>
        <p className="text-xs text-sepiaOscuro/70">
          Una «ronda» es cuando han jugado los dos. La duración (10, 15, 20, 30 rondas o sin
          límite) se elige al crear la partida.
        </p>
      </div>
    ),
  },
  {
    icono: '🗺️',
    titulo: 'El mapa y las comarcas',
    cuerpo: (
      <div className="space-y-2">
        <p className="text-sm leading-relaxed text-sepiaOscuro/90">
          Los 26 municipios se agrupan en <strong>10 comarcas</strong>. Si controlas{' '}
          <strong>una comarca entera</strong>, ganas tropas extra <em>cada turno</em>:
        </p>
        <div className="mt-1 grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-sepiaOscuro/90">
          {COMARCAS_BONUS.map(([nombre, bonus]) => (
            <div key={nombre} className="flex items-center justify-between gap-2">
              <span>{nombre}</span>
              <Dato>+{bonus}</Dato>
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-sepiaOscuro/70">
          Solo puedes atacar o mover entre territorios <strong>vecinos</strong>. Curiosidad:
          Águilas y Cartagena son vecinas por mar.
        </p>
      </div>
    ),
  },
  {
    icono: '⚙️',
    titulo: 'Preparación: el reparto',
    cuerpo: (
      <div className="space-y-2">
        <p className="text-sm leading-relaxed text-sepiaOscuro/90">
          Cada jugador dispone de <Dato>35 tropas</Dato>. Al empezar:
        </p>
        <Lista
          items={[
            <>Los 26 territorios se reparten <strong>13 y 13</strong>, con 1 tropa cada uno.</>,
            <>
              Por turnos, vais <strong>colocando las tropas restantes</strong> (22 cada uno)
              de una en una, donde queráis de lo vuestro.
            </>,
            <>
              ¿Prefieres ir directo a la acción? Al crear la partida puedes activar el{' '}
              <strong>reparto aleatorio</strong> y se colocan solas.
            </>,
          ]}
        />
        <p className="text-xs text-sepiaOscuro/70">
          Concentrar tropas crea fortalezas; repartirlas, frentes amplios. Tú decides.
        </p>
      </div>
    ),
  },
  {
    icono: '🔁',
    titulo: 'Tu turno tiene 3 fases',
    cuerpo: (
      <div className="space-y-3">
        <div className="space-y-2">
          {[
            ['1 · Refuerzos', 'Recibes y colocas tropas nuevas. Puedes canjear cartas.'],
            ['2 · Ataques', 'Atacas a tus vecinos respondiendo preguntas. Todos los que quieras.'],
            ['3 · Fortificación', 'Mueves tropas una vez para reorganizar tu defensa.'],
          ].map(([t, d]) => (
            <div key={t} className="rounded border border-sepia/40 bg-sepia/5 p-2.5">
              <p className="text-sm font-semibold text-sepiaOscuro">{t}</p>
              <p className="text-xs text-sepiaOscuro/80">{d}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-sepiaOscuro/70">
          Al terminar la fortificación, el turno pasa al rival. Vemos cada fase en detalle.
        </p>
      </div>
    ),
  },
  {
    icono: '➕',
    titulo: 'Fase 1 · Refuerzos',
    cuerpo: (
      <div className="space-y-2">
        <p className="text-sm leading-relaxed text-sepiaOscuro/90">
          Al inicio de cada turno recibes tropas para colocar en tus territorios:
        </p>
        <Lista
          items={[
            <>
              <strong>Base:</strong> tus territorios ÷ 3 (redondeando hacia abajo), con un{' '}
              <Dato>mínimo de 3</Dato>.
            </>,
            <>
              <strong>Bonus de comarca:</strong> se suma el bonus de cada comarca que
              controles por completo.
            </>,
          ]}
        />
        <p className="mt-1 text-sm text-sepiaOscuro/90">
          Ejemplo: con 18 territorios y la Huerta de Murcia completa →{' '}
          <Dato>6 + 3 = 9 tropas</Dato>.
        </p>
        <p className="text-xs text-sepiaOscuro/70">
          En esta fase también puedes canjear cartas (siguiente diapositiva).
        </p>
      </div>
    ),
  },
  {
    icono: '🃏',
    titulo: 'Las cartas',
    cuerpo: (
      <div className="space-y-2">
        <p className="text-sm leading-relaxed text-sepiaOscuro/90">
          Si en tu turno <strong>conquistas al menos un territorio</strong>, robas{' '}
          <strong>1 carta</strong>. Cada carta es un <Dato>soldado</Dato>,{' '}
          <Dato>jinete</Dato> o <Dato>artillería</Dato> (o un comodín).
        </p>
        <p className="text-sm text-sepiaOscuro/90">
          Canjea un <strong>trío</strong> por tropas: tres iguales, o una de cada tipo. El{' '}
          <strong>comodín</strong> vale por cualquiera. Cada canje (entre los dos jugadores)
          vale más que el anterior:
        </p>
        <div className="mt-1 grid grid-cols-3 gap-x-3 gap-y-1 text-xs text-sepiaOscuro/90 sm:grid-cols-4">
          {VALORES_CANJE.map(([orden, valor]) => (
            <div key={orden} className="flex items-center justify-between gap-1">
              <span>{orden}</span>
              <Dato>{valor}</Dato>
            </div>
          ))}
        </div>
        <p className="text-xs text-sepiaOscuro/70">
          Si una carta muestra un territorio que es tuyo al canjear, recibes{' '}
          <Dato>+2 tropas</Dato> en él. Ojo: con 5 cartas en mano, debes canjear antes de
          atacar.
        </p>
      </div>
    ),
  },
  {
    icono: '⚔️',
    titulo: 'Fase 2 · Ataques',
    cuerpo: (
      <div className="space-y-2">
        <p className="text-sm leading-relaxed text-sepiaOscuro/90">Para atacar:</p>
        <Lista
          items={[
            <>
              Elige un territorio <strong>tuyo</strong> con al menos <Dato>2 tropas</Dato>.
            </>,
            <>Elige un territorio <strong>rival vecino</strong>.</>,
            <>
              Decide con <strong>cuántas tropas</strong> atacas (N). Debes dejar siempre 1 en
              el de origen.
            </>,
          ]}
        />
        <p className="mt-1 text-sm text-sepiaOscuro/90">
          Entonces, en vez de tirar dados, el <strong>defensor</strong> recibe una{' '}
          <strong>pregunta tipo test</strong>. El resultado del duelo lo decide su respuesta.
        </p>
        <p className="text-xs text-sepiaOscuro/70">
          Puedes encadenar tantos ataques como quieras (y puedas) en un mismo turno.
        </p>
      </div>
    ),
  },
  {
    icono: '❓',
    titulo: 'El duelo de preguntas',
    cuerpo: (
      <div className="space-y-2">
        <p className="text-sm leading-relaxed text-sepiaOscuro/90">
          Responde el <strong>defensor</strong>, con tiempo limitado. La{' '}
          <strong>dificultad</strong> depende de la fuerza del ataque:
        </p>
        <Lista
          items={[
            <>
              Cuantas <strong>más tropas envíes</strong> frente a las defensoras, más{' '}
              <strong>difícil</strong> es la pregunta (te conviene como atacante).
            </>,
            <>
              Tiempo según dificultad: <Dato>30s</Dato>, <Dato>45s</Dato> o <Dato>60s</Dato>.
            </>,
          ]}
        />
        <div className="mt-1 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div className="rounded border border-jugador0/40 bg-jugador0/5 p-2.5">
            <p className="text-sm font-semibold text-jugador0">Si el defensor ACIERTA</p>
            <p className="text-xs text-sepiaOscuro/80">
              Resiste el ataque. El atacante pierde la <strong>mitad</strong> de las tropas
              atacantes (redondeando hacia arriba) y el defensor gana +1.
            </p>
          </div>
          <div className="rounded border border-jugador1/40 bg-jugador1/5 p-2.5">
            <p className="text-sm font-semibold text-jugador1">Si FALLA o se acaba el tiempo</p>
            <p className="text-xs text-sepiaOscuro/80">
              El territorio <strong>cae</strong> y pasa al atacante.
            </p>
          </div>
        </div>
      </div>
    ),
  },
  {
    icono: '🚩',
    titulo: 'Conquista y movimiento',
    cuerpo: (
      <div className="space-y-2">
        <p className="text-sm leading-relaxed text-sepiaOscuro/90">
          Cuando conquistas un territorio, debes <strong>ocuparlo</strong>: mueves a él
          entre <Dato>mín(3, N)</Dato> y <Dato>N</Dato> de las tropas con las que atacaste.
        </p>
        <Lista
          items={[
            <>El resto se queda guardando el territorio de origen.</>,
            <>
              Conquistar te da derecho a <strong>robar carta</strong> al final de tus ataques.
            </>,
            <>
              Si te quedas con <strong>todo el mapa</strong>, ganas la partida en ese instante.
            </>,
          ]}
        />
        <p className="text-xs text-sepiaOscuro/70">
          Avanzar mucho debilita tu retaguardia: piensa qué territorios dejas flojos.
        </p>
      </div>
    ),
  },
  {
    icono: '🛡️',
    titulo: 'Fase 3 · Fortificación',
    cuerpo: (
      <div className="space-y-2">
        <p className="text-sm leading-relaxed text-sepiaOscuro/90">
          Una <strong>vez por turno</strong>, puedes reorganizar tu ejército:
        </p>
        <Lista
          items={[
            <>
              Mueve tropas entre <strong>dos territorios tuyos</strong> conectados por una{' '}
              <strong>cadena de territorios propios</strong>.
            </>,
            <>Debes dejar al menos <Dato>1 tropa</Dato> en el de origen.</>,
            <>Es opcional: puedes pasar si prefieres no mover nada.</>,
          ]}
        />
        <p className="text-xs text-sepiaOscuro/70">
          Úsalo para llevar tropas del interior tranquilo hacia la primera línea del frente.
        </p>
      </div>
    ),
  },
  {
    icono: '🏆',
    titulo: 'Fin de la partida · ¡A jugar!',
    cuerpo: (
      <div className="space-y-2">
        <Lista
          items={[
            <>
              <strong>Conquista total</strong> → victoria inmediata.
            </>,
            <>
              <strong>Por límite de rondas</strong> → gana quien más puntos sume:{' '}
              <Dato>+1</Dato> por territorio y bonus de <Dato>Murcia</Dato>,{' '}
              <Dato>Cartagena</Dato> y <Dato>Lorca</Dato>. Puede haber empate.
            </>,
          ]}
        />
        <div className="mt-1 rounded border border-sepia/40 bg-sepia/5 p-2.5 text-xs text-sepiaOscuro/85">
          <p className="font-semibold text-sepiaOscuro">Local vs. Online</p>
          <p className="mt-1">
            <strong>Local:</strong> ambos en el mismo dispositivo, os turnáis.{' '}
            <strong>Online:</strong> cada uno en el suyo, todo se sincroniza solo; durante una
            pregunta, solo el defensor responde.
          </p>
        </div>
        <p className="pt-1 text-center text-sm font-semibold text-sepiaOscuro">
          ¡Que conquiste el más sabio! 🏰
        </p>
      </div>
    ),
  },
];

export function ComoJugar({ onCerrar }: { onCerrar?: () => void }) {
  const [i, setI] = useState(0);
  const total = DIAPOSITIVAS.length;
  const tactilX = useRef<number | null>(null);

  const ir = useCallback(
    (delta: number) => {
      setI((prev) => Math.min(total - 1, Math.max(0, prev + delta)));
    },
    [total],
  );

  useEffect(() => {
    const onTecla = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') ir(-1);
      else if (e.key === 'ArrowRight') ir(1);
    };
    window.addEventListener('keydown', onTecla);
    return () => window.removeEventListener('keydown', onTecla);
  }, [ir]);

  const onTouchStart = (e: React.TouchEvent) => {
    tactilX.current = e.touches[0]?.clientX ?? null;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (tactilX.current === null) return;
    const dx = (e.changedTouches[0]?.clientX ?? tactilX.current) - tactilX.current;
    if (Math.abs(dx) > 40) ir(dx < 0 ? 1 : -1);
    tactilX.current = null;
  };

  const esUltima = i === total - 1;

  return (
    <div className="select-none">
      {/* Visor con la pista deslizante */}
      <div
        className="h-[58vh] min-h-[320px] max-h-[460px] overflow-hidden rounded-lg border border-sepia/30 bg-pergaminoOscuro/20"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div
          className="flex h-full transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${i * 100}%)` }}
        >
          {DIAPOSITIVAS.map((d, idx) => (
            <div
              key={idx}
              className="h-full w-full flex-none overflow-y-auto p-5"
              aria-hidden={idx !== i}
            >
              <div className="mb-3 flex items-center gap-3">
                <span className="text-3xl" aria-hidden>
                  {d.icono}
                </span>
                <h3 className="font-title text-xl leading-tight text-sepiaOscuro">{d.titulo}</h3>
              </div>
              {d.cuerpo}
            </div>
          ))}
        </div>
      </div>

      {/* Puntos de navegación */}
      <div className="mt-3 flex items-center justify-center gap-1.5">
        {DIAPOSITIVAS.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setI(idx)}
            aria-label={`Ir a la diapositiva ${idx + 1}`}
            className={`h-2 rounded-full transition-all ${
              idx === i ? 'w-5 bg-sepia' : 'w-2 bg-sepia/30 hover:bg-sepia/50'
            }`}
          />
        ))}
      </div>

      {/* Controles */}
      <div className="mt-3 flex items-center justify-between gap-2">
        <Boton variante="fantasma" onClick={() => ir(-1)} disabled={i === 0}>
          ← Anterior
        </Boton>
        <span className="text-xs text-sepiaOscuro/70">
          {i + 1} / {total}
        </span>
        {esUltima ? (
          <Boton variante="primario" onClick={onCerrar}>
            ¡A jugar!
          </Boton>
        ) : (
          <Boton variante="primario" onClick={() => ir(1)}>
            Siguiente →
          </Boton>
        )}
      </div>
    </div>
  );
}
