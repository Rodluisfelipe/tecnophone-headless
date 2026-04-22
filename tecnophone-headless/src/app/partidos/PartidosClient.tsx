'use client';

import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Tv,
  Calendar,
  Clock,
  MapPin,
  Trophy,
  Flag,
  ChevronDown,
  ShoppingCart,
  Sparkles,
  Zap,
} from 'lucide-react';
import { ApiFixture, formatFixtureDate, hoursUntil } from '@/lib/api-football';

interface Product {
  name: string;
  slug: string;
  price: string;
  regular_price: string;
  images: { src: string }[];
  on_sale: boolean;
}

interface FixturesData {
  colombia: ApiFixture[];
  mundial: ApiFixture[];
  premier: ApiFixture[];
  laliga: ApiFixture[];
  bundesliga: ApiFixture[];
  serieA: ApiFixture[];
}

interface FaqItem { q: string; a: string; }

interface PartidosClientProps {
  fixtures: FixturesData;
  tvProducts: Product[];
  faqItems: FaqItem[];
}

function formatCOP(value: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPrice(price: string) {
  const n = parseFloat(price);
  return isNaN(n) ? price : formatCOP(n);
}

const TABS = [
  { id: 'colombia', label: 'Colombia', icon: Flag },
  { id: 'mundial', label: 'Mundial 2026', icon: Trophy },
  { id: 'premier', label: 'Premier', icon: Trophy },
  { id: 'laliga', label: 'La Liga', icon: Trophy },
  { id: 'bundesliga', label: 'Bundesliga', icon: Trophy },
  { id: 'serieA', label: 'Serie A', icon: Trophy },
] as const;

type TabId = typeof TABS[number]['id'];

function FixtureCard({ fixture, highlight = false }: { fixture: ApiFixture; highlight?: boolean }) {
  const { date, time } = formatFixtureDate(fixture.fixture.date);
  const hours = hoursUntil(fixture.fixture.date);
  const isSoon = hours > 0 && hours < 24;
  const isLive = ['1H', '2H', 'HT', 'ET', 'P', 'LIVE'].includes(fixture.fixture.status.short);

  return (
    <div
      className={`rounded-2xl border bg-white p-4 transition-all hover:shadow-md ${
        highlight ? 'border-yellow-300 bg-yellow-50/40' : 'border-slate-200'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Calendar className="w-3.5 h-3.5" />
          <span className="capitalize">{date}</span>
        </div>
        {isLive && (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-600 text-white text-[10px] font-bold px-2 py-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> EN VIVO
          </span>
        )}
        {!isLive && isSoon && (
          <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 text-orange-700 text-[10px] font-bold px-2 py-0.5">
            <Zap className="w-3 h-3" /> HOY
          </span>
        )}
      </div>

      <div className="flex items-center justify-between gap-3">
        {/* Home */}
        <div className="flex-1 flex flex-col items-center text-center gap-1.5">
          {fixture.teams.home.logo && (
            <img src={fixture.teams.home.logo} alt={fixture.teams.home.name} className="w-10 h-10 object-contain" />
          )}
          <span className="text-xs font-semibold text-slate-700 line-clamp-2">{fixture.teams.home.name}</span>
        </div>

        {/* Score / time */}
        <div className="flex flex-col items-center min-w-[60px]">
          {isLive || fixture.goals.home !== null ? (
            <span className="text-2xl font-black text-slate-900">
              {fixture.goals.home ?? 0} - {fixture.goals.away ?? 0}
            </span>
          ) : (
            <>
              <Clock className="w-3.5 h-3.5 text-slate-400 mb-0.5" />
              <span className="text-sm font-bold text-slate-900">{time}</span>
            </>
          )}
        </div>

        {/* Away */}
        <div className="flex-1 flex flex-col items-center text-center gap-1.5">
          {fixture.teams.away.logo && (
            <img src={fixture.teams.away.logo} alt={fixture.teams.away.name} className="w-10 h-10 object-contain" />
          )}
          <span className="text-xs font-semibold text-slate-700 line-clamp-2">{fixture.teams.away.name}</span>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
        <span className="truncate">{fixture.league.name}</span>
        {fixture.fixture.venue.city && (
          <span className="inline-flex items-center gap-1 shrink-0">
            <MapPin className="w-3 h-3" /> {fixture.fixture.venue.city}
          </span>
        )}
      </div>
    </div>
  );
}

export default function PartidosClient({ fixtures, tvProducts, faqItems }: PartidosClientProps) {
  const [activeTab, setActiveTab] = useState<TabId>('colombia');
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [stickyVisible, setStickyVisible] = useState(false);
  const [stickyDismissed, setStickyDismissed] = useState(false);

  // Find next match overall (closest in time, not started)
  const nextMatch = useMemo(() => {
    const all = [
      ...fixtures.colombia,
      ...fixtures.mundial,
      ...fixtures.premier,
      ...fixtures.laliga,
      ...fixtures.bundesliga,
      ...fixtures.serieA,
    ];
    const upcoming = all
      .filter((f) => hoursUntil(f.fixture.date) > 0)
      .sort((a, b) => new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime());
    return upcoming[0] || null;
  }, [fixtures]);

  // Today's matches across all
  const todayMatches = useMemo(() => {
    const all = [
      ...fixtures.colombia,
      ...fixtures.mundial,
      ...fixtures.premier,
      ...fixtures.laliga,
      ...fixtures.bundesliga,
      ...fixtures.serieA,
    ];
    return all.filter((f) => {
      const h = hoursUntil(f.fixture.date);
      return h >= -2 && h < 24;
    }).slice(0, 8);
  }, [fixtures]);

  // Cheapest TV for sticky CTA
  const cheapestTV = useMemo(() => {
    if (tvProducts.length === 0) return null;
    return tvProducts.reduce((min, p) =>
      parseFloat(p.price) < parseFloat(min.price) ? p : min
    , tvProducts[0]);
  }, [tvProducts]);

  // Sticky CTA on scroll
  useEffect(() => {
    const onScroll = () => setStickyVisible(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const activeFixtures = fixtures[activeTab] || [];

  // Time until next Colombia match
  const colombiaHours = nextMatch && fixtures.colombia.includes(nextMatch)
    ? hoursUntil(nextMatch.fixture.date)
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-20">
      {/* Announcement bar */}
      <div className="bg-gradient-to-r from-yellow-400 via-blue-600 to-red-600 text-white text-sm font-semibold py-2 px-4 text-center">
        ⚽ Mira el fútbol en grande · Smart TVs desde {cheapestTV ? formatPrice(cheapestTV.price) : 'precios cómodos'} · Envío hoy en Bogotá
      </div>

      <div className="container-custom pt-6">
        {/* Hero */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-3">
            <Sparkles className="w-3.5 h-3.5" /> Actualizado cada 2 horas
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 mb-3">
            Partidos de Fútbol Hoy
          </h1>
          <p className="text-slate-600 max-w-2xl mx-auto text-sm md:text-base">
            Calendario en vivo de la Selección Colombia, Liga BetPlay, Champions League, Premier League y La Liga.
            Mira los partidos en grande con los <strong>mejores Smart TVs</strong>.
          </p>
        </div>

        {/* NEXT MATCH HERO + CTA */}
        {nextMatch && (
          <div className="mb-8 rounded-3xl overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-blue-800 text-white shadow-xl">
            <div className="grid md:grid-cols-[1.3fr_1fr]">
              {/* Match info */}
              <div className="p-6 md:p-8">
                <div className="text-xs font-bold uppercase tracking-widest text-blue-200 mb-2">
                  Próximo partido destacado
                </div>
                <div className="text-sm text-blue-100 mb-4">{nextMatch.league.name}</div>

                <div className="flex items-center justify-between gap-4 mb-6">
                  <div className="flex flex-col items-center text-center flex-1">
                    {nextMatch.teams.home.logo && (
                      <img src={nextMatch.teams.home.logo} alt={`Escudo de ${nextMatch.teams.home.name}`} className="w-16 h-16 object-contain mb-2" />
                    )}
                    <span className="font-bold text-sm md:text-base">{nextMatch.teams.home.name}</span>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-blue-200 mb-1">VS</div>
                    <div className="text-2xl md:text-3xl font-black">
                      {formatFixtureDate(nextMatch.fixture.date).time}
                    </div>
                    <div className="text-xs text-blue-200 mt-1 capitalize">
                      {formatFixtureDate(nextMatch.fixture.date).date}
                    </div>
                  </div>
                  <div className="flex flex-col items-center text-center flex-1">
                    {nextMatch.teams.away.logo && (
                      <img src={nextMatch.teams.away.logo} alt={`Escudo de ${nextMatch.teams.away.name}`} className="w-16 h-16 object-contain mb-2" />
                    )}
                    <span className="font-bold text-sm md:text-base">{nextMatch.teams.away.name}</span>
                  </div>
                </div>

                {colombiaHours !== null && colombiaHours < 48 && (
                  <div className="bg-yellow-400 text-slate-900 rounded-xl px-4 py-3 text-sm font-bold flex items-center gap-2">
                    🇨🇴 ¡Colombia juega en {Math.floor(colombiaHours)}h! ¿Listo para verlo en grande?
                  </div>
                )}
              </div>

              {/* TV CTA */}
              {cheapestTV && (
                <div className="bg-white/10 backdrop-blur p-6 md:p-8 flex flex-col justify-center border-t md:border-t-0 md:border-l border-white/20">
                  <Tv className="w-8 h-8 mb-3" />
                  <div className="text-sm font-semibold text-blue-100 mb-1">Smart TVs desde</div>
                  <div className="text-3xl md:text-4xl font-black mb-1">
                    {formatPrice(cheapestTV.price)}
                  </div>
                  <div className="text-xs text-blue-200 mb-4">
                    O paga en cuotas con tu tarjeta de crédito
                  </div>
                  <Link
                    href="/categoria/televisores"
                    className="inline-flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-bold px-5 py-3 rounded-xl text-sm transition"
                  >
                    <ShoppingCart className="w-4 h-4" /> Ver televisores
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TODAY MATCHES */}
        {todayMatches.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xl md:text-2xl font-black text-slate-900 mb-4 flex items-center gap-2">
              <Zap className="w-6 h-6 text-orange-500" /> Partidos de hoy
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {todayMatches.map((f) => (
                <FixtureCard key={f.fixture.id} fixture={f} highlight />
              ))}
            </div>
          </section>
        )}

        {/* TABS */}
        <section className="mb-10">
          <h2 className="text-xl md:text-2xl font-black text-slate-900 mb-4 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-blue-600" /> Próximos partidos por competencia
          </h2>

          <div className="flex gap-2 overflow-x-auto pb-2 mb-5 -mx-4 px-4 scrollbar-hide">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-white border border-slate-200 text-slate-700 hover:border-blue-400'
                  }`}
                >
                  <Icon className="w-4 h-4" /> {tab.label}
                </button>
              );
            })}
          </div>

          {activeFixtures.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeFixtures.map((f) => (
                <FixtureCard key={f.fixture.id} fixture={f} />
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-slate-500 bg-white rounded-2xl border border-slate-200">
              <p className="mb-1">No hay partidos próximos disponibles.</p>
              <p className="text-xs">Los datos se actualizan automáticamente cada 2 horas.</p>
            </div>
          )}
        </section>

        {/* TV PROMO */}
        {tvProducts.length > 0 && (
          <section className="mb-10">
            <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 text-white p-6 md:p-8 mb-6">
              <div className="flex items-center gap-3 mb-3">
                <Tv className="w-7 h-7 text-yellow-400" />
                <h2 className="text-xl md:text-2xl font-black">
                  Smart TVs para vivir el fútbol
                </h2>
              </div>
              <p className="text-slate-300 text-sm md:text-base max-w-2xl">
                Pantallas grandes, 4K, Smart TV con apps de streaming. Paga en cuotas con tu tarjeta de crédito.
                Envío rápido a todo Colombia · Garantía oficial.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {tvProducts.slice(0, 8).map((p) => {
                const price = parseFloat(p.price);
                const regularPrice = parseFloat(p.regular_price);
                const hasDiscount = p.on_sale && regularPrice > price;
                const discountPct = hasDiscount ? Math.round(((regularPrice - price) / regularPrice) * 100) : 0;
                return (
                  <Link
                    key={p.slug}
                    href={`/producto/${p.slug}`}
                    className="group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg hover:border-blue-400 transition"
                  >
                    <div className="relative aspect-square bg-slate-50 overflow-hidden">
                      {p.images[0] && (
                        <Image
                          src={p.images[0].src}
                          alt={p.name}
                          fill
                          sizes="(max-width:768px) 50vw, 25vw"
                          className="object-contain p-2 group-hover:scale-105 transition-transform"
                        />
                      )}
                      {hasDiscount && (
                        <span className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded">
                          -{discountPct}%
                        </span>
                      )}
                    </div>
                    <div className="p-3">
                      <h3 className="text-xs font-semibold text-slate-700 line-clamp-2 mb-2 min-h-[2.5rem]">
                        {p.name}
                      </h3>
                      <div className="text-blue-700 font-black text-base">{formatPrice(p.price)}</div>
                      {hasDiscount && (
                        <div className="text-[11px] text-slate-400 line-through">{formatPrice(p.regular_price)}</div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>

            <div className="text-center mt-6">
              <Link
                href="/categoria/televisores"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl transition"
              >
                Ver todos los televisores <ShoppingCart className="w-4 h-4" />
              </Link>
            </div>
          </section>
        )}

        {/* FAQ */}
        <section className="mb-10">
          <h2 className="text-xl md:text-2xl font-black text-slate-900 mb-4">
            Preguntas frecuentes
          </h2>
          <div className="space-y-2">
            {faqItems.map((item, i) => {
              const isOpen = openFaq === i;
              return (
                <div key={i} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    className="w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-slate-50"
                  >
                    <span className="font-semibold text-slate-800 text-sm md:text-base">{item.q}</span>
                    <ChevronDown className={`w-5 h-5 text-slate-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 text-sm text-slate-600 leading-relaxed">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* STICKY CTA */}
      {stickyVisible && !stickyDismissed && cheapestTV && (
        <div className="fixed bottom-20 lg:bottom-6 left-4 right-4 lg:left-6 lg:right-auto lg:max-w-sm z-40 animate-in slide-in-from-bottom">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 flex items-center gap-3">
            <div className="bg-blue-100 rounded-xl p-2 shrink-0">
              <Tv className="w-6 h-6 text-blue-700" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-slate-500 leading-tight">Smart TVs desde</div>
              <div className="text-base font-black text-slate-900 leading-tight">
                {formatPrice(cheapestTV.price)}
              </div>
            </div>
            <Link
              href="/categoria/televisores"
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-2 rounded-lg shrink-0"
            >
              Ver
            </Link>
            <button
              onClick={() => setStickyDismissed(true)}
              className="text-slate-400 hover:text-slate-600 text-xs shrink-0"
              aria-label="Cerrar"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
