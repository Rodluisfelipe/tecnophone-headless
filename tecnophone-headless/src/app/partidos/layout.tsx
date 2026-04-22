import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Partidos de hoy y esta semana — Colombia, Champions, Premier y La Liga | TecnoPhone',
  description:
    'Calendario de partidos de fútbol en vivo: Selección Colombia, Liga BetPlay Dimayor, Champions League, Premier League y La Liga. Mira los partidos en grande con los mejores televisores.',
  keywords: [
    'partidos hoy',
    'partidos colombia hoy',
    'a qué hora juega colombia',
    'liga betplay calendario',
    'champions league hoy',
    'premier league hoy',
    'la liga hoy',
    'fixture selección colombia',
    'eliminatorias colombia',
    'televisores para ver fútbol',
  ],
  openGraph: {
    title: 'Partidos de Hoy — Colombia, Champions, Premier, La Liga',
    description:
      'Calendario de partidos en vivo. Mira el fútbol en grande con TVs desde precios cómodos en TecnoPhone.',
    type: 'website',
  },
  alternates: { canonical: 'https://tecnophone.co/partidos' },
};

export default function PartidosLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
