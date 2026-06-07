import type {
  Comarca,
  ComarcaId,
  SimboloCarta,
  Territorio,
  TerritorioId,
} from './tipos';

export const NOMBRES_TERRITORIO: Record<TerritorioId, string> = {
  'moratalla': 'Moratalla',
  'calasparra': 'Calasparra',
  'cieza': 'Cieza',
  'jumilla': 'Jumilla',
  'yecla': 'Yecla',
  'caravaca': 'Caravaca',
  'cehegin-bullas': 'Cehegín y Bullas',
  'valle-ricote': 'Valle de Ricote',
  'archena': 'Archena',
  'molina': 'Molina de Segura',
  'vega-media': 'Vega Media',
  'santomera-beniel': 'Santomera y Beniel',
  'mula': 'Mula',
  'alcantarilla': 'Alcantarilla',
  'murcia': 'Murcia',
  'lorca': 'Lorca',
  'alhama-librilla': 'Alhama y Librilla',
  'totana': 'Totana',
  'fuente-alamo': 'Fuente Álamo',
  'torre-pacheco': 'Torre-Pacheco',
  'mar-menor': 'Mar Menor',
  'puerto-lumbreras': 'Puerto Lumbreras',
  'aguilas': 'Águilas',
  'mazarron': 'Mazarrón',
  'cartagena': 'Cartagena',
  'la-union': 'La Unión',
};

export const COMARCA_DE_TERRITORIO: Record<TerritorioId, ComarcaId> = {
  'yecla': 'altiplano',
  'jumilla': 'altiplano',

  'moratalla': 'noroeste',
  'calasparra': 'noroeste',
  'caravaca': 'noroeste',
  'cehegin-bullas': 'noroeste',

  'cieza': 'vega-alta',
  'valle-ricote': 'vega-alta',

  'mula': 'rio-mula',

  'archena': 'vega-media',
  'molina': 'vega-media',
  'vega-media': 'vega-media',

  'santomera-beniel': 'huerta',
  'alcantarilla': 'huerta',
  'murcia': 'huerta',

  'lorca': 'guadalentin',
  'alhama-librilla': 'guadalentin',
  'totana': 'guadalentin',
  'puerto-lumbreras': 'guadalentin',

  'aguilas': 'costa-calida',
  'mazarron': 'costa-calida',

  'fuente-alamo': 'campo-cartagena',
  'torre-pacheco': 'campo-cartagena',
  'cartagena': 'campo-cartagena',
  'la-union': 'campo-cartagena',

  'mar-menor': 'mar-menor',
};

export const COMARCAS: Record<ComarcaId, Comarca> = {
  'altiplano': {
    id: 'altiplano',
    nombre: 'Altiplano',
    territorios: ['yecla', 'jumilla'],
    bonus: 2,
    colorBase: '#d4b15c',
  },
  'noroeste': {
    id: 'noroeste',
    nombre: 'Noroeste',
    territorios: ['moratalla', 'calasparra', 'caravaca', 'cehegin-bullas'],
    bonus: 5,
    colorBase: '#9aa867',
  },
  'vega-alta': {
    id: 'vega-alta',
    nombre: 'Vega Alta',
    territorios: ['cieza', 'valle-ricote'],
    bonus: 2,
    colorBase: '#c89968',
  },
  'rio-mula': {
    id: 'rio-mula',
    nombre: 'Río Mula',
    territorios: ['mula'],
    bonus: 1,
    colorBase: '#b8956a',
  },
  'vega-media': {
    id: 'vega-media',
    nombre: 'Vega Media',
    territorios: ['archena', 'molina', 'vega-media'],
    bonus: 3,
    colorBase: '#b8c168',
  },
  'huerta': {
    id: 'huerta',
    nombre: 'Huerta de Murcia',
    territorios: ['santomera-beniel', 'alcantarilla', 'murcia'],
    bonus: 3,
    colorBase: '#d99878',
  },
  'guadalentin': {
    id: 'guadalentin',
    nombre: 'Valle del Guadalentín',
    territorios: ['lorca', 'alhama-librilla', 'totana', 'puerto-lumbreras'],
    bonus: 5,
    colorBase: '#c89058',
  },
  'costa-calida': {
    id: 'costa-calida',
    nombre: 'Costa Cálida',
    territorios: ['aguilas', 'mazarron'],
    bonus: 2,
    colorBase: '#9ab0bb',
  },
  'campo-cartagena': {
    id: 'campo-cartagena',
    nombre: 'Campo de Cartagena',
    territorios: ['fuente-alamo', 'torre-pacheco', 'cartagena', 'la-union'],
    bonus: 5,
    colorBase: '#b88060',
  },
  'mar-menor': {
    id: 'mar-menor',
    nombre: 'Mar Menor',
    territorios: ['mar-menor'],
    bonus: 1,
    colorBase: '#a8c0cc',
  },
};

export const ADYACENCIAS: Record<TerritorioId, TerritorioId[]> = {
  'moratalla':         ['calasparra', 'caravaca', 'cehegin-bullas'],
  'calasparra':        ['moratalla', 'cieza', 'caravaca', 'cehegin-bullas', 'valle-ricote'],
  'cieza':             ['calasparra', 'jumilla', 'valle-ricote', 'cehegin-bullas', 'archena'],
  'jumilla':           ['cieza', 'yecla', 'molina', 'vega-media', 'valle-ricote', 'archena', 'santomera-beniel'],
  'yecla':             ['jumilla', 'vega-media', 'santomera-beniel'],
  'caravaca':          ['moratalla', 'calasparra', 'cehegin-bullas', 'mula'],
  'cehegin-bullas':    ['calasparra', 'caravaca', 'valle-ricote', 'mula', 'moratalla', 'cieza', 'alcantarilla'],
  'valle-ricote':      ['cieza', 'cehegin-bullas', 'archena', 'mula', 'calasparra', 'jumilla', 'alcantarilla'],
  'archena':           ['valle-ricote', 'molina', 'alcantarilla', 'cieza', 'jumilla', 'murcia'],
  'molina':            ['jumilla', 'archena', 'vega-media', 'murcia', 'alcantarilla'],
  'vega-media':        ['jumilla', 'yecla', 'molina', 'santomera-beniel', 'murcia'],
  'santomera-beniel':  ['yecla', 'vega-media', 'murcia', 'jumilla'],
  'mula':              ['caravaca', 'cehegin-bullas', 'valle-ricote', 'alcantarilla', 'lorca', 'alhama-librilla'],
  'alcantarilla':      ['mula', 'archena', 'murcia', 'alhama-librilla', 'cehegin-bullas', 'valle-ricote', 'molina', 'lorca', 'totana', 'fuente-alamo'],
  'murcia':            ['molina', 'vega-media', 'santomera-beniel', 'alcantarilla', 'totana', 'fuente-alamo', 'torre-pacheco', 'mar-menor', 'archena'],
  'lorca':             ['mula', 'alhama-librilla', 'puerto-lumbreras', 'aguilas', 'alcantarilla'],
  'alhama-librilla':   ['alcantarilla', 'lorca', 'totana', 'mazarron', 'mula', 'aguilas'],
  'totana':            ['alhama-librilla', 'murcia', 'fuente-alamo', 'mazarron', 'alcantarilla', 'cartagena'],
  'fuente-alamo':      ['murcia', 'totana', 'torre-pacheco', 'mazarron', 'cartagena', 'alcantarilla', 'la-union'],
  'torre-pacheco':     ['murcia', 'fuente-alamo', 'mar-menor', 'cartagena', 'la-union'],
  'mar-menor':         ['murcia', 'torre-pacheco', 'la-union'],
  'puerto-lumbreras':  ['lorca', 'aguilas'],
  'aguilas':           ['lorca', 'puerto-lumbreras', 'mazarron', 'cartagena', 'alhama-librilla'],
  'mazarron':          ['aguilas', 'totana', 'alhama-librilla', 'fuente-alamo', 'cartagena'],
  'cartagena':         ['mazarron', 'fuente-alamo', 'torre-pacheco', 'la-union', 'aguilas', 'totana'],
  'la-union':          ['cartagena', 'torre-pacheco', 'mar-menor', 'fuente-alamo'],
};

export const SIMBOLO_TERRITORIO: Record<TerritorioId, Exclude<SimboloCarta, 'comodin'>> = {
  'moratalla': 'soldado', 'cieza': 'soldado', 'yecla': 'soldado',
  'caravaca': 'soldado', 'molina': 'soldado', 'mula': 'soldado',
  'lorca': 'soldado', 'mazarron': 'soldado', 'cartagena': 'soldado',

  'calasparra': 'jinete', 'jumilla': 'jinete', 'cehegin-bullas': 'jinete',
  'valle-ricote': 'jinete', 'archena': 'jinete', 'vega-media': 'jinete',
  'alcantarilla': 'jinete', 'totana': 'jinete', 'aguilas': 'jinete',

  'santomera-beniel': 'artilleria', 'murcia': 'artilleria',
  'alhama-librilla': 'artilleria', 'fuente-alamo': 'artilleria',
  'torre-pacheco': 'artilleria', 'mar-menor': 'artilleria',
  'puerto-lumbreras': 'artilleria', 'la-union': 'artilleria',
};

export const POLIGONOS: Record<TerritorioId, string> = {
  'moratalla':       '40,118 175,114 180,193 95,206 48,182 38,148',
  'calasparra':      '175,114 260,116 262,193 180,193',
  'cieza':           '260,116 360,114 358,186 285,198 262,193',
  'jumilla':         '360,114 538,112 545,188 358,186',
  'yecla':           '538,112 678,116 678,194 545,188',
  'caravaca':        '48,182 95,206 180,193 165,278 60,278 38,232',
  'cehegin-bullas':  '180,193 262,193 252,278 165,278',
  'valle-ricote':    '262,193 285,198 358,186 340,278 252,278',
  'archena':         '358,186 410,184 408,275 340,278',
  'molina':          '410,184 500,184 498,278 408,275',
  'vega-media':      '500,184 545,188 580,273 498,278',
  'santomera-beniel':'545,188 678,194 678,275 580,273',
  'mula':            '38,232 60,278 165,278 252,278 220,360 50,348',
  'alcantarilla':    '252,278 340,278 408,275 400,360 220,360',
  'murcia':          '408,275 498,278 580,273 678,275 678,360 400,360',
  'lorca':           '50,348 220,360 200,460 50,452 38,402',
  'alhama-librilla': '220,360 310,362 295,462 200,460',
  'totana':          '310,362 400,360 392,455 295,462',
  'fuente-alamo':    '400,360 490,360 488,455 392,455',
  'torre-pacheco':   '490,360 580,356 582,452 488,455',
  'mar-menor':       '580,356 678,360 678,452 582,452',
  'puerto-lumbreras':'50,452 158,455 145,548 50,538 38,490',
  'aguilas':         '158,455 200,460 275,460 268,548 145,548',
  'mazarron':        '275,460 295,462 392,455 420,548 268,548',
  'cartagena':       '392,455 488,455 555,548 420,548',
  'la-union':        '488,455 582,452 678,452 668,548 555,548',
};

export const CENTROS: Record<TerritorioId, { x: number; y: number }> = {
  'moratalla':        { x: 110, y: 165 },
  'calasparra':       { x: 222, y: 160 },
  'cieza':            { x: 310, y: 160 },
  'jumilla':          { x: 450, y: 155 },
  'yecla':            { x: 608, y: 158 },
  'caravaca':         { x: 110, y: 240 },
  'cehegin-bullas':   { x: 213, y: 240 },
  'valle-ricote':     { x: 305, y: 240 },
  'archena':          { x: 378, y: 235 },
  'molina':           { x: 455, y: 235 },
  'vega-media':       { x: 540, y: 235 },
  'santomera-beniel': { x: 612, y: 235 },
  'mula':             { x: 148, y: 320 },
  'alcantarilla':     { x: 314, y: 320 },
  'murcia':           { x: 540, y: 320 },
  'lorca':            { x: 130, y: 412 },
  'alhama-librilla':  { x: 252, y: 412 },
  'totana':           { x: 348, y: 412 },
  'fuente-alamo':     { x: 440, y: 412 },
  'torre-pacheco':    { x: 535, y: 412 },
  'mar-menor':        { x: 630, y: 412 },
  'puerto-lumbreras': { x: 100, y: 505 },
  'aguilas':          { x: 213, y: 505 },
  'mazarron':         { x: 345, y: 505 },
  'cartagena':        { x: 475, y: 505 },
  'la-union':         { x: 615, y: 505 },
};

// --- Color de fondo por municipio ---
// Cada municipio recibe un tono claro derivado del color de su comarca, con una
// ligera variación por municipio. Al ser claros, el color del jugador (capa
// superpuesta) resalta con fuerza encima.
function hexARgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function rgbAHex(r: number, g: number, b: number): string {
  const c = (n: number) =>
    Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}

// Mezcla un color con blanco. t=0 deja el color original; t=1 lo vuelve blanco.
function aclarar(hex: string, t: number): string {
  const [r, g, b] = hexARgb(hex);
  return rgbAHex(r + (255 - r) * t, g + (255 - g) * t, b + (255 - b) * t);
}

export const COLOR_BASE_TERRITORIO: Record<TerritorioId, string> = (() => {
  const out = {} as Record<TerritorioId, string>;
  for (const comarca of Object.values(COMARCAS)) {
    const n = comarca.territorios.length;
    comarca.territorios.forEach((t, i) => {
      // Centro claro (~0.55 hacia blanco) con un pequeño escalón por municipio.
      const f = Math.max(0.42, Math.min(0.66, 0.55 + (i - (n - 1) / 2) * 0.06));
      out[t] = aclarar(comarca.colorBase, f);
    });
  }
  return out;
})();

export const TERRITORIO_IDS: TerritorioId[] = [
  'moratalla', 'calasparra', 'cieza', 'jumilla', 'yecla',
  'caravaca', 'cehegin-bullas', 'valle-ricote', 'archena',
  'molina', 'vega-media', 'santomera-beniel',
  'mula', 'alcantarilla', 'murcia',
  'lorca', 'alhama-librilla', 'totana', 'fuente-alamo',
  'torre-pacheco', 'mar-menor',
  'puerto-lumbreras', 'aguilas', 'mazarron', 'cartagena', 'la-union',
];

export const TERRITORIOS: Record<TerritorioId, Territorio> = TERRITORIO_IDS.reduce(
  (acc, id) => {
    acc[id] = {
      id,
      nombre: NOMBRES_TERRITORIO[id],
      comarca: COMARCA_DE_TERRITORIO[id],
      simboloCarta: SIMBOLO_TERRITORIO[id],
      poligono: POLIGONOS[id],
      centro: CENTROS[id],
    };
    return acc;
  },
  {} as Record<TerritorioId, Territorio>,
);

export const COLOR_JUGADOR: Record<0 | 1, string> = {
  0: '#2c4a6b',
  1: '#8b2c2c',
};
