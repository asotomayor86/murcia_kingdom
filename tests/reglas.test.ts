import { describe, it, expect } from 'vitest';
import {
  calcularNivelPregunta,
  tiempoLimitePorNivel,
  calcularBajasAtacante,
  rangoMovimientoConquista,
  calcularRefuerzosBase,
  calcularBonusComarcas,
  comarcaCompleta,
  valorCanje,
  combinacionCanjeValida,
  puedeAtacar,
  hayCadenaPropia,
  victoriaTotal,
  calcularPuntuacion,
} from '../lib/reglas';
import {
  ADYACENCIAS,
  COMARCAS,
  TERRITORIO_IDS,
} from '../lib/territorios';
import type {
  Carta,
  OcupacionTerritorio,
  TerritorioId,
} from '../lib/tipos';

function ocupacionInicial(
  asignacion: Partial<Record<TerritorioId, { jugador: 0 | 1; fichas: number }>>,
  defJugador: 0 | 1 = 0,
  defFichas = 1,
): Record<TerritorioId, OcupacionTerritorio> {
  return TERRITORIO_IDS.reduce((acc, id) => {
    const a = asignacion[id];
    acc[id] = a ?? { jugador: defJugador, fichas: defFichas };
    return acc;
  }, {} as Record<TerritorioId, OcupacionTerritorio>);
}

describe('calcularNivelPregunta', () => {
  it('D <= -3 -> nivel 1', () => {
    expect(calcularNivelPregunta(1, 4)).toBe(1);
    expect(calcularNivelPregunta(1, 10)).toBe(1);
  });
  it('-2 <= D <= 0 -> nivel 2', () => {
    expect(calcularNivelPregunta(1, 3)).toBe(2);
    expect(calcularNivelPregunta(2, 2)).toBe(2);
    expect(calcularNivelPregunta(3, 3)).toBe(2);
  });
  it('1 <= D <= 4 -> nivel 3', () => {
    expect(calcularNivelPregunta(4, 3)).toBe(3);
    expect(calcularNivelPregunta(5, 1)).toBe(3);
  });
  it('5 <= D <= 9 -> nivel 4', () => {
    expect(calcularNivelPregunta(6, 1)).toBe(4);
    expect(calcularNivelPregunta(10, 1)).toBe(4);
  });
  it('D >= 10 -> nivel 5', () => {
    expect(calcularNivelPregunta(11, 1)).toBe(5);
    expect(calcularNivelPregunta(30, 5)).toBe(5);
  });
});

describe('tiempoLimitePorNivel', () => {
  it('niveles 1,2,3 -> 30 s', () => {
    expect(tiempoLimitePorNivel(1)).toBe(30);
    expect(tiempoLimitePorNivel(2)).toBe(30);
    expect(tiempoLimitePorNivel(3)).toBe(30);
  });
  it('nivel 4 -> 45 s', () => {
    expect(tiempoLimitePorNivel(4)).toBe(45);
  });
  it('nivel 5 -> 60 s', () => {
    expect(tiempoLimitePorNivel(5)).toBe(60);
  });
});

describe('calcularBajasAtacante', () => {
  it('redondeo hacia arriba', () => {
    expect(calcularBajasAtacante(1)).toBe(1);
    expect(calcularBajasAtacante(2)).toBe(1);
    expect(calcularBajasAtacante(3)).toBe(2);
    expect(calcularBajasAtacante(4)).toBe(2);
    expect(calcularBajasAtacante(10)).toBe(5);
  });
});

describe('rangoMovimientoConquista', () => {
  it('rango [min(3,N), N]', () => {
    expect(rangoMovimientoConquista(1)).toEqual({ min: 1, max: 1 });
    expect(rangoMovimientoConquista(2)).toEqual({ min: 2, max: 2 });
    expect(rangoMovimientoConquista(3)).toEqual({ min: 3, max: 3 });
    expect(rangoMovimientoConquista(5)).toEqual({ min: 3, max: 5 });
  });
});

describe('valorCanje', () => {
  it('secuencia esperada', () => {
    expect(valorCanje(1)).toBe(4);
    expect(valorCanje(2)).toBe(6);
    expect(valorCanje(3)).toBe(8);
    expect(valorCanje(4)).toBe(10);
    expect(valorCanje(5)).toBe(12);
    expect(valorCanje(6)).toBe(15);
    expect(valorCanje(7)).toBe(20);
    expect(valorCanje(8)).toBe(25);
    expect(valorCanje(9)).toBe(30);
  });
});

describe('calcularRefuerzosBase', () => {
  it('mínimo 3', () => {
    expect(calcularRefuerzosBase(1)).toBe(3);
    expect(calcularRefuerzosBase(9)).toBe(3);
  });
  it('floor(n/3) cuando supera 9', () => {
    expect(calcularRefuerzosBase(12)).toBe(4);
    expect(calcularRefuerzosBase(13)).toBe(4);
    expect(calcularRefuerzosBase(26)).toBe(8);
  });
});

describe('comarcaCompleta y calcularBonusComarcas', () => {
  it('comarca completa devuelve true', () => {
    const ocupacion = ocupacionInicial({
      yecla: { jugador: 0, fichas: 1 },
      jumilla: { jugador: 0, fichas: 1 },
    });
    expect(comarcaCompleta(ocupacion, 0, COMARCAS['altiplano'])).toBe(true);
  });
  it('comarca incompleta devuelve false', () => {
    const ocupacion = ocupacionInicial({
      yecla: { jugador: 0, fichas: 1 },
      jumilla: { jugador: 1, fichas: 1 },
    });
    expect(comarcaCompleta(ocupacion, 0, COMARCAS['altiplano'])).toBe(false);
  });
  it('suma bonus de comarcas completas', () => {
    const ocupacion = ocupacionInicial(
      {
        yecla: { jugador: 0, fichas: 1 },
        jumilla: { jugador: 0, fichas: 1 },
      },
      1,
    );
    const bonus = calcularBonusComarcas(ocupacion, 0, Object.values(COMARCAS));
    expect(bonus).toBe(2);
  });
});

describe('combinacionCanjeValida', () => {
  const t = (s: 'soldado' | 'jinete' | 'artilleria' | 'comodin'): Carta => ({
    id: `c-${Math.random()}`,
    territorio: null,
    simbolo: s,
  });
  it('tres iguales válido', () => {
    expect(combinacionCanjeValida([t('soldado'), t('soldado'), t('soldado')])).toBe(true);
  });
  it('una de cada válido', () => {
    expect(combinacionCanjeValida([t('soldado'), t('jinete'), t('artilleria')])).toBe(true);
  });
  it('dos iguales no válido', () => {
    expect(combinacionCanjeValida([t('soldado'), t('soldado'), t('jinete')])).toBe(false);
  });
  it('comodín sustituye', () => {
    expect(combinacionCanjeValida([t('soldado'), t('soldado'), t('comodin')])).toBe(true);
    expect(combinacionCanjeValida([t('soldado'), t('jinete'), t('comodin')])).toBe(true);
  });
});

describe('hayCadenaPropia', () => {
  it('cadena con 3 saltos propia', () => {
    // moratalla -> calasparra -> cieza -> jumilla, todos del jugador 0
    const ocupacion = ocupacionInicial(
      {
        moratalla: { jugador: 0, fichas: 1 },
        calasparra: { jugador: 0, fichas: 1 },
        cieza: { jugador: 0, fichas: 1 },
        jumilla: { jugador: 0, fichas: 1 },
      },
      1,
    );
    expect(
      hayCadenaPropia(ocupacion, 0, 'moratalla', 'jumilla', ADYACENCIAS),
    ).toBe(true);
  });
  it('no hay cadena si interrumpe enemigo', () => {
    const ocupacion = ocupacionInicial(
      {
        moratalla: { jugador: 0, fichas: 1 },
        calasparra: { jugador: 1, fichas: 1 },
        cieza: { jugador: 0, fichas: 1 },
        jumilla: { jugador: 0, fichas: 1 },
      },
      1,
    );
    expect(
      hayCadenaPropia(ocupacion, 0, 'moratalla', 'jumilla', ADYACENCIAS),
    ).toBe(false);
  });
});

describe('puedeAtacar', () => {
  it('permite atacar vecino enemigo con >=2 fichas', () => {
    const ocupacion = ocupacionInicial(
      {
        murcia: { jugador: 0, fichas: 5 },
        molina: { jugador: 1, fichas: 2 },
      },
      1,
    );
    expect(puedeAtacar(ocupacion, 0, 'murcia', 'molina', ADYACENCIAS)).toBe(true);
  });
  it('rechaza si destino propio', () => {
    const ocupacion = ocupacionInicial(
      {
        murcia: { jugador: 0, fichas: 5 },
        molina: { jugador: 0, fichas: 2 },
      },
      1,
    );
    expect(puedeAtacar(ocupacion, 0, 'murcia', 'molina', ADYACENCIAS)).toBe(false);
  });
  it('rechaza si origen tiene 1 ficha', () => {
    const ocupacion = ocupacionInicial(
      {
        murcia: { jugador: 0, fichas: 1 },
        molina: { jugador: 1, fichas: 2 },
      },
      1,
    );
    expect(puedeAtacar(ocupacion, 0, 'murcia', 'molina', ADYACENCIAS)).toBe(false);
  });
  it('rechaza si no son adyacentes', () => {
    const ocupacion = ocupacionInicial(
      {
        murcia: { jugador: 0, fichas: 5 },
        yecla: { jugador: 1, fichas: 2 },
      },
      1,
    );
    expect(puedeAtacar(ocupacion, 0, 'murcia', 'yecla', ADYACENCIAS)).toBe(false);
  });
});

describe('victoriaTotal', () => {
  it('todos del mismo jugador -> true', () => {
    const ocupacion = ocupacionInicial({}, 0);
    expect(victoriaTotal(ocupacion, 0)).toBe(true);
    expect(victoriaTotal(ocupacion, 1)).toBe(false);
  });
});

describe('calcularPuntuacion', () => {
  it('1 punto por territorio, sin territorios clave', () => {
    // Todos del jugador 1 salvo Murcia/Cartagena/Lorca, que son del 0.
    const ocupacion = ocupacionInicial(
      {
        murcia: { jugador: 1, fichas: 1 },
        cartagena: { jugador: 1, fichas: 1 },
        lorca: { jugador: 1, fichas: 1 },
      },
      0,
    );
    const p0 = calcularPuntuacion(ocupacion, 0);
    expect(p0.territorios).toBe(23);
    expect(p0.bonus).toBe(0);
    expect(p0.total).toBe(23);
    expect(p0.claves).toEqual([]);
  });

  it('suma bonus por Murcia (+2), Cartagena (+2) y Lorca (+1)', () => {
    const ocupacion = ocupacionInicial({}, 0); // jugador 0 lo tiene todo
    const p0 = calcularPuntuacion(ocupacion, 0);
    expect(p0.territorios).toBe(26);
    expect(p0.bonus).toBe(5);
    expect(p0.total).toBe(31);
    expect(p0.claves).toEqual(['murcia', 'cartagena', 'lorca']);

    const p1 = calcularPuntuacion(ocupacion, 1);
    expect(p1.total).toBe(0);
  });

  it('cuenta solo los territorios clave que posee el jugador', () => {
    const ocupacion = ocupacionInicial(
      {
        murcia: { jugador: 0, fichas: 1 },
        lorca: { jugador: 0, fichas: 1 },
        // cartagena queda del jugador 1 (default)
      },
      1,
    );
    const p0 = calcularPuntuacion(ocupacion, 0);
    expect(p0.territorios).toBe(2);
    expect(p0.bonus).toBe(3); // murcia +2, lorca +1
    expect(p0.claves).toEqual(['murcia', 'lorca']);
  });
});

describe('Simetría de ADYACENCIAS', () => {
  it('a en ADYACENCIAS[b] => b en ADYACENCIAS[a]', () => {
    for (const a of TERRITORIO_IDS) {
      for (const b of ADYACENCIAS[a]) {
        expect(ADYACENCIAS[b], `${a} -> ${b} no simétrica`).toContain(a);
      }
    }
  });
  it('incluye la conexión marítima aguilas <-> cartagena', () => {
    expect(ADYACENCIAS['aguilas']).toContain('cartagena');
    expect(ADYACENCIAS['cartagena']).toContain('aguilas');
  });
  it('cobertura: 26 territorios definidos', () => {
    expect(TERRITORIO_IDS).toHaveLength(26);
  });
});
