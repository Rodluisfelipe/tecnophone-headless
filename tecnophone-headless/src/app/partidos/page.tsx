import { getProducts } from '@/lib/woocommerce';
import { getFeaturedFixtures, formatFixtureDate } from '@/lib/api-football';
import PartidosClient from './PartidosClient';

// ISR: revalidate every 2 hours (~60 API calls/day, well under 100/day free limit)
export const revalidate = 7200;

const FAQ_ITEMS = [
  {
    q: '¿Dónde puedo ver los partidos de la Selección Colombia?',
    a: 'Los partidos de la Selección Colombia se transmiten por Caracol TV, RCN, Gol Caracol y Win Sports+. Para verlos en alta calidad necesitas un televisor moderno con buena resolución (Full HD o 4K). En TecnoPhone tenemos televisores Smart TV desde precios cómodos.',
  },
  {
    q: '¿Qué televisor es mejor para ver fútbol?',
    a: 'Para ver fútbol se recomienda un Smart TV de mínimo 43 pulgadas con resolución Full HD o 4K, alta tasa de refresco (60Hz o más) y tecnología LED/QLED para mejor contraste en partidos diurnos. Mientras más grande, mejor experiencia con familia y amigos.',
  },
  {
    q: '¿A qué hora juega Colombia en el Mundial 2026?',
    a: 'Los horarios de los partidos de la Selección Colombia en el Mundial 2026 varían según la fase. En esta página actualizamos automáticamente el calendario con los próximos partidos de la Tricolor.',
  },
  {
    q: '¿Dónde ver Premier League, La Liga, Bundesliga y Serie A?',
    a: 'Las principales ligas europeas se transmiten en Colombia por ESPN, DIRECTV Sports, Win Sports+ y servicios de streaming. Acá puedes ver el calendario completo con fecha y hora local Colombia.',
  },
  {
    q: '¿Cómo puedo comprar un TV antes del partido?',
    a: 'En TecnoPhone tenemos envío rápido a todo Colombia. Para Bogotá despachamos el mismo día si compras antes de las 2pm. Pagas con tarjeta de crédito en cuotas, PSE, Nequi o contra entrega.',
  },
];

export const metadata = {
  alternates: { canonical: 'https://tecnophone.co/partidos' },
};

export default async function PartidosPage() {
  // Fetch fixtures (cached) + TVs in parallel
  const [fixtures, tvRes, fallbackRes] = await Promise.all([
    getFeaturedFixtures(),
    getProducts({ per_page: 12, category_slug: 'televisores', orderby: 'price', order: 'asc' }).catch(() => ({ products: [] })),
    getProducts({ per_page: 12, orderby: 'price', order: 'asc' }),
  ]);

  // Use TVs if found, else generic products as fallback
  const tvProducts = (tvRes.products.length > 0 ? tvRes.products : fallbackRes.products).map((p) => ({
    name: p.name,
    slug: p.slug,
    price: p.price,
    regular_price: p.regular_price,
    images: p.images.map((img) => ({ src: img.src })),
    on_sale: p.on_sale,
  }));

  // ===== JSON-LD: Event schema for next 10 most relevant fixtures =====
  const allFixtures = [
    ...fixtures.colombia,
    ...fixtures.mundial,
    ...fixtures.premier,
    ...fixtures.laliga,
    ...fixtures.bundesliga,
    ...fixtures.serieA,
  ].slice(0, 10);

  const eventsJsonLd = allFixtures.map((f) => {
    const { date, time } = formatFixtureDate(f.fixture.date);
    return {
      '@context': 'https://schema.org',
      '@type': 'SportsEvent',
      name: `${f.teams.home.name} vs ${f.teams.away.name}`,
      startDate: f.fixture.date,
      eventStatus: 'https://schema.org/EventScheduled',
      eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode',
      location: {
        '@type': 'Place',
        name: f.fixture.venue.name || f.league.name,
        address: f.fixture.venue.city || f.league.country,
      },
      sport: 'Soccer',
      description: `Partido de ${f.league.name}: ${f.teams.home.name} vs ${f.teams.away.name} — ${date} a las ${time}.`,
      organizer: { '@type': 'Organization', name: f.league.name },
      competitor: [
        { '@type': 'SportsTeam', name: f.teams.home.name },
        { '@type': 'SportsTeam', name: f.teams.away.name },
      ],
    };
  });

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ_ITEMS.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  };

  return (
    <>
      {eventsJsonLd.map((event, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(event) }}
        />
      ))}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <PartidosClient
        fixtures={fixtures}
        tvProducts={tvProducts}
        faqItems={FAQ_ITEMS}
      />
    </>
  );
}
