'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Loader2, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface SearchHit {
  id: number;
  name: string;
  slug: string;
  price: string;
  regular_price: string;
  sale_price: string;
  on_sale: boolean;
  image_src: string;
  image_alt: string;
  brand_name: string;
  category_names: string[];
  price_numeric: number;
  _formatted?: { name?: string };
}

interface SearchResponse {
  products: SearchHit[];
  total: number;
  processingTimeMs?: number;
  facets?: Record<string, Record<string, number>>;
}

function formatPrice(price: string | number): string {
  const num = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(num) || num === 0) return '';
  return `$ ${Math.round(num).toLocaleString('es-CO')}`;
}

export default function InstantSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchHit[]>([]);
  const [total, setTotal] = useState(0);
  const [timeMs, setTimeMs] = useState(0);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const abortRef = useRef<AbortController>();
  const router = useRouter();

  // Debounced search
  const doSearch = useCallback(async (q: string) => {
    if (q.trim().length < 1) {
      setResults([]);
      setTotal(0);
      setLoading(false);
      return;
    }

    // Abort previous request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}&limit=6`, {
        signal: controller.signal,
      });
      const data: SearchResponse = await res.json();
      setResults(data.products || []);
      setTotal(data.total || 0);
      setTimeMs(data.processingTimeMs || 0);
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setResults([]);
        setTotal(0);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length < 1) {
      setResults([]);
      setTotal(0);
      setOpen(false);
      return;
    }

    setOpen(true);
    debounceRef.current = setTimeout(() => doSearch(query), 150);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, doSearch]);

  // Close on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setOpen(false);
      inputRef.current?.blur();
    }
    if (e.key === 'Enter' && query.trim()) {
      setOpen(false);
      router.push(`/buscar?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <div ref={containerRef} className="relative flex-1 max-w-sm lg:max-w-md">
      {/* Input */}
      <form
        className="relative"
        onSubmit={(e) => {
          e.preventDefault();
          if (query.trim()) {
            setOpen(false);
            router.push(`/buscar?q=${encodeURIComponent(query.trim())}`);
          }
        }}
      >
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { if (results.length > 0) setOpen(true); }}
          onKeyDown={handleKeyDown}
          placeholder="Buscar productos..."
          className="w-full pl-4 pr-12 py-2.5 bg-white border border-surface-300 rounded-full text-gray-900 placeholder-surface-500 text-sm focus:outline-none focus:bg-surface-50 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
          autoComplete="off"
        />
        <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
          {query && (
            <button
              type="button"
              onClick={() => { setQuery(''); setResults([]); setOpen(false); inputRef.current?.focus(); }}
              className="p-1.5 text-surface-600 hover:text-surface-800 transition-colors"
              aria-label="Limpiar búsqueda"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="submit"
            className="bg-primary-500 hover:bg-primary-600 text-white p-2 rounded-full transition-colors"
            aria-label="Buscar"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </button>
        </div>
      </form>

      {/* Dropdown results */}
      {open && (query.trim().length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl shadow-gray-200/60 border border-surface-200 z-50 overflow-hidden max-h-[70vh] overflow-y-auto">
          {loading && results.length === 0 ? (
            <div className="p-6 text-center">
              <Loader2 className="w-6 h-6 text-primary-500 animate-spin mx-auto mb-2" />
              <p className="text-sm text-surface-700">Buscando...</p>
            </div>
          ) : results.length > 0 ? (
            <>
              {/* Results header */}
              <div className="px-4 py-2.5 bg-surface-200 border-b border-surface-300 flex items-center justify-between">
                <span className="text-xs text-surface-700">
                  {total} resultado{total !== 1 ? 's' : ''}
                  {timeMs > 0 && <span className="text-surface-600 ml-1">({timeMs}ms)</span>}
                </span>
                {loading && <Loader2 className="w-3 h-3 text-primary-500 animate-spin" />}
              </div>

              {/* Product list */}
              {results.map((hit) => (
                <Link
                  key={hit.id}
                  href={`/producto/${hit.slug}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-surface-200/60 transition-colors border-b border-surface-200 last:border-b-0"
                >
                  {/* Product image */}
                  <div className="w-14 h-14 flex-shrink-0 rounded-xl bg-surface-200 flex items-center justify-center overflow-hidden">
                    {hit.image_src ? (
                      <Image
                        src={hit.image_src}
                        alt={hit.image_alt || hit.name}
                        width={56}
                        height={56}
                        className="object-contain w-full h-full p-1"
                      />
                    ) : (
                      <Search className="w-5 h-5 text-surface-500" />
                    )}
                  </div>

                  {/* Product info */}
                  <div className="flex-1 min-w-0">
                    {hit.brand_name && (
                      <span className="text-[10px] font-bold text-surface-600 uppercase tracking-wider">
                        {hit.brand_name}
                      </span>
                    )}
                    <h4
                      className="text-sm font-semibold text-gray-900 truncate"
                      dangerouslySetInnerHTML={{ __html: hit._formatted?.name || hit.name }}
                    />
                    {hit.category_names?.[0] && (
                      <span className="text-[10px] text-primary-600 font-medium">
                        {hit.category_names[0]}
                      </span>
                    )}
                  </div>

                  {/* Price */}
                  <div className="text-right flex-shrink-0">
                    {hit.on_sale && hit.regular_price && (
                      <span className="text-[10px] text-surface-600 line-through block">
                        {formatPrice(hit.regular_price)}
                      </span>
                    )}
                    <span className="text-sm font-extrabold text-gray-900">
                      {formatPrice(hit.price || hit.price_numeric)}
                    </span>
                  </div>
                </Link>
              ))}

              {/* View all link */}
              {total > results.length && (
                <Link
                  href={`/buscar?q=${encodeURIComponent(query.trim())}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-surface-50 text-primary-600 text-sm font-bold hover:bg-surface-100 transition-colors"
                >
                  Ver los {total} resultados
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}
            </>
          ) : (
            <div className="p-6 text-center">
              <Search className="w-8 h-8 text-surface-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-900">No se encontraron resultados</p>
              <p className="text-xs text-surface-600 mt-1">Intenta con otros términos</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
