import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        pergamino: '#ead9a8',
        pergaminoOscuro: '#d9c189',
        sepia: '#5a3818',
        sepiaOscuro: '#3d2817',
        mar: '#a4c3cc',
        jugador0: '#2c4a6b',
        jugador1: '#8b2c2c',
      },
      fontFamily: {
        serif: ['"EB Garamond"', '"Cinzel"', 'Georgia', 'serif'],
        title: ['"Cinzel"', '"EB Garamond"', 'Georgia', 'serif'],
      },
      boxShadow: {
        panel: '0 2px 6px rgba(61, 40, 23, 0.25)',
      },
    },
  },
  plugins: [],
};

export default config;
