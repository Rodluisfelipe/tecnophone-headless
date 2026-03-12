'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, Loader2, SlidersHorizontal, X, Zap } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface SearchHit {
  id: number;
  name: string;
  slug: string;
  price: string;
  regular_price: string;
  sale_price: string;
  on_sale: boolean;
  stock_status: string;
  image_src: string;
  image_alt: string;
  brand_name: string;
  category_names: string[];
  categories: string[];
  average_rating: string;
  rating_count: number;
  featured: boolean;
  price_numeric: number;
  _formatted?: { name?: string };
}

function formatPrice(price: string | number): string {
  const num = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(num) || num === 0) return '';
  return `$ ${Math.round(num).toLocaleString('es-CO')}`;
}

function calculateDiscount(regular: string, sale: string): number {
  const r = parseFloat(regular);
  const s = parseFloat(sale);
  if (!r || !s || r <= s) return 0;
  return Math.round(((r - s) / r) * 100);
}

export default function SearchResults() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get('q') || '';
  const activeCategory = searchParams.get('cat') || '';
  const activeBrand = searchParams.get('brand') || '';
  const activeSort = searchParams.get('sort') || '';
  const onSaleFilter = searchParams.get('sale') === '1';

  const [hits, setHits] = useState<SearchHit[]>([]);
  const [total, setTotal] = useState(0);
  const [timeMs, setTimeMs] = useState(0);
  const [facets, setFacets] = useState<Record<string, Record<string, number>>>({});
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const doSearch = useCallback(async () => {
    if (!query.trim()) return;

    setLoading(true);

    // Build filter string
    const filters: string[] = [];
    if (activeCategory) filters.push(`categories = "${activeCategory}"`);
    if (activeBrand) filters.push(`brand_name = "${activeBrand}"`);
    if (onSaleFilter) filters.push('on_sale = true');

    const params = new URLSearchParams({
      q: query.trim(),
      limit: '40',
      ...(filters.length > 0 ? { filter: filters.join(' AND ') } : {}),
      ...(activeSort ? { sort: activeSort } : {}),
    });

    try {
      const res = await fetch(`/api/search?${params.toString()}`);
      const data = await res.json();
      setHits(data.products || []);
      setTotal(data.total || 0);
      setTimeMs(data.processingTimeMs || 0);
      setFacets(data.facets || {});
    } catch {
      setHits([]);
      setTotal(0);
    }
    setLoading(false);
  }, [query, activeCategory, activeBrand, activeSort, onSaleFilter]);

  useEffect(() => { doSearch(); }, [doSearch]);

  // Update URL params
  const setFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`/buscar?${params.toString()}`, { scroll: false });
  };

  const clearFilters = () => {
    router.push(`/buscar?q=${encodeURIComponent(query)}`, { scroll: false });
  };

  const hasFilters = activeCategory || activeBrand || onSaleFilter || activeSort;

  return (
    <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-gray-900">
            Resultados de búsqueda
          </h1>
          {query && (
            <p className="text-surface-700 mt-1">
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Buscando...
                </span>
              ) : (
                <>
                  <span className="font-bold text-gray-900">{total}</span> resultado{total !== 1 ? 's' : ''} para{' '}
                  <span className="font-semibold text-primary-600">&ldquo;{query}&rdquo;</span>
                  {timeMs > 0 && <span className="text-surface-500 ml-2">({timeMs}ms)</span>}
                </>
              )}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Sort */}
          <select
            value={activeSort}
            onChange={(e) => setFilter('sort', e.target.value)}
            className="text-sm border border-surface-300 rounded-xl px-3 py-2 bg-white text-gray-900 focus:outline-none focus:border-primary-500"
          >
            <option value="">Relevancia</option>
            <option value="price_numeric:asc">Precio: menor a mayor</option>
            <option value="price_numeric:desc">Precio: mayor a menor</option>
            <option value="name:asc">Nombre A-Z</option>
          </select>

          {/* Toggle filters (mobile) */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="lg:hidden flex items-center gap-2 text-sm font-semibold text-surface-800 border border-surface-300 rounded-xl px-3 py-2 hover:bg-surface-100"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filtros
          </button>
        </div>
      </div>

      {/* Active filters pills */}
      {hasFilters && (
        <div className="flex flex-wrap items-center gap-2 mb-6">
          {activeCategory && (
            <span className="inline-flex items-center gap-1.5 bg-primary-500/10 text-primary-600 text-xs font-bold px-3 py-1.5 rounded-full">
              {activeCategory}
              <button onClick={() => setFilter('cat', '')}><X className="w-3 h-3" /></button>
            </span>
          )}
          {activeBrand && (
            <span className="inline-flex items-center gap-1.5 bg-primary-500/10 text-primary-600 text-xs font-bold px-3 py-1.5 rounded-full">
              {activeBrand}
              <button onClick={() => setFilter('brand', '')}><X className="w-3 h-3" /></button>
            </span>
          )}
          {onSaleFilter && (
            <span className="inline-flex items-center gap-1.5 bg-red-500/10 text-red-500 text-xs font-bold px-3 py-1.5 rounded-full">
              En oferta
              <button onClick={() => setFilter('sale', '')}><X className="w-3 h-3" /></button>
            </span>
          )}
          <button onClick={clearFilters} className="text-xs text-surface-600 hover:text-gray-900 underline">
            Limpiar todo
          </button>
        </div>
      )}

      <div className="flex gap-8">
        {/* Sidebar filters */}
        <aside className={`w-64 flex-shrink-0 space-y-6 ${showFilters ? 'block' : 'hidden lg:block'}`}>
          {/* On sale toggle */}
          <div>
            <button
              onClick={() => setFilter('sale', onSaleFilter ? '' : '1')}
              className={`w-full flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                onSaleFilter
                  ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                  : 'bg-surface-100 text-surface-800 border border-surface-200 hover:border-red-500/20 hover:bg-red-500/10'
              }`}
            >
              <Zap className="w-4 h-4" />
              Solo ofertas
            </button>
          </div>

          {/* Category facets */}
          {facets.categories && Object.keys(facets.categories).length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-3">Categorías</h3>
              <div className="space-y-1.5">
                {Object.entries(facets.categories)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 15)
                  .map(([slug, count]) => (
                    <button
                      key={slug}
                      onClick={() => setFilter('cat', activeCategory === slug ? '' : slug)}
                      className={`w-full text-left flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all ${
                        activeCategory === slug
                          ? 'bg-primary-500 text-white font-bold'
                          : 'text-surface-700 hover:bg-surface-100 hover:text-gray-900'
                      }`}
                    >
                      <span className="truncate">{slug}</span>
                      <span className={`text-xs ${activeCategory === slug ? 'text-white/70' : 'text-surface-600'}`}>{count}</span>
                    </button>
                  ))}
              </div>
            </div>
          )}

          {/* Brand facets */}
          {facets.brand_name && Object.keys(facets.brand_name).length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-3">Marcas</h3>
              <div className="space-y-1.5">
                {Object.entries(facets.brand_name)
                  .filter(([name]) => name.trim() !== '')
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 15)
                  .map(([name, count]) => (
                    <button
                      key={name}
                      onClick={() => setFilter('brand', activeBrand === name ? '' : name)}
                      className={`w-full text-left flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all ${
                        activeBrand === name
                          ? 'bg-primary-500 text-white font-bold'
                          : 'text-surface-700 hover:bg-surface-100 hover:text-gray-900'
                      }`}
                    >
                      <span className="truncate">{name}</span>
                      <span className={`text-xs ${activeBrand === name ? 'text-white/70' : 'text-surface-600'}`}>{count}</span>
                    </button>
                  ))}
              </div>
            </div>
          )}
        </aside>

        {/* Results grid */}
        <div className="flex-1">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-5 items-stretch">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-surface-100 animate-pulse rounded-2xl h-80 border border-surface-200" />
              ))}
            </div>
          ) : hits.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-5 items-stretch">
              {hits.map((hit) => (
                <MeiliProductCard key={hit.id} hit={hit} />
              ))}
            </div>
          ) : query ? (
            <div className="text-center py-20">
              <Search className="w-16 h-16 text-surface-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No se encontraron resultados
              </h3>
              <p className="text-surface-700">
                Intenta con otros términos de búsqueda
              </p>
            </div>
          ) : (
            <div className="text-center py-20">
              <Search className="w-16 h-16 text-surface-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Busca productos
              </h3>
              <p className="text-surface-700">
                Escribe el nombre del producto que estás buscando
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Lightweight product card for Meilisearch hits ──
function MeiliProductCard({ hit }: { hit: SearchHit }) {
  const discount = calculateDiscount(hit.regular_price, hit.sale_price);

  return (
    <article className="group relative bg-surface-100 rounded-3xl overflow-hidden border border-surface-200 hover:border-surface-300 hover:shadow-lg hover:shadow-gray-200/60 transition-all duration-300 flex flex-col h-full">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Image */}
      <Link href={`/producto/${hit.slug}`} className="block relative aspect-square overflow-hidden bg-surface-200">
        {hit.image_src ? (
          <Image
            src={hit.image_src}
            alt={hit.image_alt || hit.name}
            fill
            className="object-contain p-6 group-hover:scale-110 transition-transform duration-700 ease-out"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-surface-400">
            <Search className="w-16 h-16" />
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
          {discount > 0 && (
            <span className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-extrabold px-3 py-1.5 rounded-full shadow-lg shadow-red-500/30 flex items-center gap-1">
              <Zap className="w-3 h-3" />
              -{discount}%
            </span>
          )}
        </div>
      </Link>

      {/* Info */}
      <div className="p-4 pb-5 flex flex-col flex-1">
        <div className="mb-2 h-4">
          {hit.brand_name && (
            <span className="text-[10px] font-bold text-surface-600 uppercase tracking-widest">
              {hit.brand_name}
            </span>
          )}
        </div>

        <div className="mb-2 h-5">
          {hit.category_names?.[0] && (
            <span className="inline-block text-[11px] font-bold text-primary-600 bg-primary-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              {hit.category_names[0]}
            </span>
          )}
        </div>

        <Link href={`/producto/${hit.slug}`}>
          <h3
            className="text-sm font-bold text-gray-900 line-clamp-2 min-h-[2.5rem] group-hover:text-primary-600 transition-colors duration-300 leading-snug"
            dangerouslySetInnerHTML={{ __html: hit._formatted?.name || hit.name }}
          />
        </Link>

        <div className="mt-auto pt-3 space-y-1">
          {hit.on_sale && hit.regular_price && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-surface-600 line-through font-medium">
                {formatPrice(hit.regular_price)}
              </span>
              {discount > 0 && (
                <span className="text-[10px] font-extrabold text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded">
                  AHORRAS {formatPrice(parseFloat(hit.regular_price) - parseFloat(hit.price))}
                </span>
              )}
            </div>
          )}
          <span className="text-xl font-extrabold text-gray-900 font-display tracking-tight">
            {formatPrice(hit.price || hit.price_numeric)}
          </span>
        </div>

        <Link
          href={`/producto/${hit.slug}`}
          className="mt-4 w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-sm font-bold bg-primary-600 text-white shadow-lg shadow-primary-500/20 hover:shadow-xl hover:shadow-primary-500/30 hover:-translate-y-0.5 active:scale-[0.97] transition-all duration-300"
        >
          Ver Producto
        </Link>
      </div>
    </article>
  );
}
