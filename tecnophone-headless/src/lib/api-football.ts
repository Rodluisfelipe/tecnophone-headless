// football-data.org integration (free tier: 10 req/min)
// Docs: https://www.football-data.org/documentation/quickstart
// We cache aggressively via ISR to stay well under limits.

const API_BASE = 'https://api.football-data.org/v4';
const API_KEY = process.env.API_FOOTBALL_KEY || '';

// Competition codes (free tier)
export const COMPETITIONS = {
  WORLD_CUP: 'WC',     // Mundial 2026 (incluye Colombia)
  PREMIER: 'PL',       // Premier League
  LALIGA: 'PD',        // La Liga (Primera División)
  BUNDESLIGA: 'BL1',   // Bundesliga
  SERIE_A: 'SA',       // Serie A
} as const;

// Raw API response shapes
interface ApiMatchTeam {
  id: number;
  name: string;
  shortName?: string | null;
  tla?: string | null;
  crest?: string | null;
}

interface ApiMatch {
  id: number;
  utcDate: string;
  status: string;
  matchday: number | null;
  stage?: string;
  group?: string | null;
  homeTeam: ApiMatchTeam;
  awayTeam: ApiMatchTeam;
  score: {
    fullTime: { home: number | null; away: number | null };
    halfTime: { home: number | null; away: number | null };
  };
  competition: {
    id: number;
    name: string;
    code: string;
    emblem?: string | null;
  };
}

interface ApiMatchesResponse {
  matches: ApiMatch[];
  resultSet?: { count: number };
  competition?: { name: string; emblem?: string | null };
}

// Normalised fixture shape used by UI
export interface ApiFixture {
  fixture: {
    id: number;
    date: string;
    timestamp: number;
    timezone: string;
    status: { short: string; long: string; elapsed: number | null };
    venue: { name: string | null; city: string | null };
  };
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
    round: string;
  };
  teams: {
    home: { id: number; name: string; logo: string; winner: boolean | null };
    away: { id: number; name: string; logo: string; winner: boolean | null };
  };
  goals: { home: number | null; away: number | null };
}

async function apiFetch(path: string): Promise<ApiMatch[]> {
  if (!API_KEY) {
    console.warn('[football-data] API_FOOTBALL_KEY missing — returning empty array');
    return [];
  }
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { 'X-Auth-Token': API_KEY },
      // ISR-friendly: revalidate every 2 hours
      next: { revalidate: 7200 },
    });
    if (!res.ok) {
      console.error('[football-data] HTTP error', res.status, path);
      return [];
    }
    const data: ApiMatchesResponse = await res.json();
    return data.matches || [];
  } catch (err) {
    console.error('[football-data] fetch error', err);
    return [];
  }
}

/** Map raw football-data.org match → normalized ApiFixture */
function mapMatch(m: ApiMatch): ApiFixture {
  // Map status from football-data.org → short codes for UI compatibility
  const statusMap: Record<string, { short: string; long: string }> = {
    SCHEDULED: { short: 'NS', long: 'Programado' },
    TIMED: { short: 'NS', long: 'Programado' },
    IN_PLAY: { short: '1H', long: 'En juego' },
    PAUSED: { short: 'HT', long: 'Descanso' },
    FINISHED: { short: 'FT', long: 'Finalizado' },
    POSTPONED: { short: 'PST', long: 'Aplazado' },
    SUSPENDED: { short: 'SUSP', long: 'Suspendido' },
    CANCELLED: { short: 'CANC', long: 'Cancelado' },
  };
  const s = statusMap[m.status] || { short: m.status, long: m.status };

  return {
    fixture: {
      id: m.id,
      date: m.utcDate,
      timestamp: new Date(m.utcDate).getTime() / 1000,
      timezone: 'UTC',
      status: { short: s.short, long: s.long, elapsed: null },
      venue: { name: null, city: null },
    },
    league: {
      id: m.competition.id,
      name: m.competition.name,
      country: '',
      logo: m.competition.emblem || '',
      round: m.stage || (m.matchday !== null ? `Jornada ${m.matchday}` : ''),
    },
    teams: {
      home: {
        id: m.homeTeam.id,
        name: m.homeTeam.shortName || m.homeTeam.name || 'Por definir',
        logo: m.homeTeam.crest || '',
        winner: null,
      },
      away: {
        id: m.awayTeam.id,
        name: m.awayTeam.shortName || m.awayTeam.name || 'Por definir',
        logo: m.awayTeam.crest || '',
        winner: null,
      },
    },
    goals: {
      home: m.score.fullTime.home,
      away: m.score.fullTime.away,
    },
  };
}

/** Get scheduled matches from a competition (sorted by date asc, sliced) */
async function getCompetitionFixtures(code: string, limit = 10): Promise<ApiFixture[]> {
  const matches = await apiFetch(`/competitions/${code}/matches?status=SCHEDULED`);
  return matches
    .sort((a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime())
    .slice(0, limit)
    .map(mapMatch);
}

/** Aggregate: returns featured fixtures grouped by competition */
export async function getFeaturedFixtures() {
  const [worldCupRaw, premier, laliga, bundesliga, serieA] = await Promise.all([
    apiFetch(`/competitions/${COMPETITIONS.WORLD_CUP}/matches?status=SCHEDULED`),
    getCompetitionFixtures(COMPETITIONS.PREMIER, 8),
    getCompetitionFixtures(COMPETITIONS.LALIGA, 8),
    getCompetitionFixtures(COMPETITIONS.BUNDESLIGA, 8),
    getCompetitionFixtures(COMPETITIONS.SERIE_A, 8),
  ]);

  // Filter Colombia matches from World Cup
  const colombia = worldCupRaw
    .filter(
      (m) =>
        m.homeTeam.name?.toLowerCase().includes('colombia') ||
        m.awayTeam.name?.toLowerCase().includes('colombia')
    )
    .sort((a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime())
    .slice(0, 5)
    .map(mapMatch);

  // Top World Cup matches (next 8)
  const mundial = worldCupRaw
    .sort((a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime())
    .slice(0, 8)
    .map(mapMatch);

  return {
    colombia,
    mundial,
    premier,
    laliga,
    bundesliga,
    serieA,
  };
}

/** Helper: format fixture local Colombia time */
export function formatFixtureDate(iso: string): { date: string; time: string; timestamp: number } {
  const d = new Date(iso);
  const date = d.toLocaleDateString('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'America/Bogota',
  });
  const time = d.toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Bogota',
  });
  return { date, time, timestamp: d.getTime() };
}

/** Helper: hours until kickoff (negative if started) */
export function hoursUntil(iso: string): number {
  return (new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60);
}
