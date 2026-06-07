import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Risk Murcia — Reino de Mvrcia',
  description: 'Juego de conquista por turnos en la Región de Murcia, con preguntas en lugar de dados.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700&family=EB+Garamond:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-pergamino text-sepiaOscuro antialiased">{children}</body>
    </html>
  );
}
