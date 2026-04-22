'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Loader2, ArrowRight, Package } from 'lucide-react';
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
}

function formatPrice(price: string | number): string {
  const num = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(num) || num === 0) return '';
  return `$ ${Math.round(num).toLocaleString('es-CO')}`;
}

export default function SearchTrigger() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchHit[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const abortRef = useRef<AbortController>();
  const router = useRouter();

  const showDropdown = focused && (query.trim().length > 0);

  const doSearch = useCallback(async (q: string) => {
    if (q.trim().length < 1) {
      setResults([]);
      setTotal(0);
      setLoading(false);
      return;
    }
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}&limit=5`, {
        signal: controller.signal,
      });
      const data: SearchResponse = await res.json();
      setResults(data.products || []);
      setTotal(data.total || 0);
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
      return;
    }
    debounceRef.current = setTimeout(() => doSearch(query), 200);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, doSearch]);

  // Close dropdown on tap outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setFocused(false);
      inputRef.current?.blur();
      router.push(`/buscar?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleResultClick = () => {
    setFocused(false);
    setQuery('');
    setResults([]);
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Inline search input */}
      <form onSubmit={handleSubmit} className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          placeholder="¿Qué estás buscando hoy?"
          className="w-full bg-surface-100/80 backdrop-blur-sm rounded-2xl pl-11 pr-10 py-3 text-base text-gray-900 placeholder-surface-500 outline-none focus:bg-white focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 border border-surface-200/60 hover:border-primary-300 hover:bg-white shadow-sm hover:shadow-md focus:shadow-md transition-all duration-200"
          autoComplete="off"
          enterKeyHint="search"
          aria-label="Buscar productos en TecnoPhone"
        />
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-primary-500 pointer-events-none" strokeWidth={2.25} />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-600 animate-spin" />
        )}
        {query && !loading && (
          <button
            type="button"
            onClick={() => { setQuery(''); setResults([]); inputRef.current?.focus(); }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-surface-400 active:text-gray-700"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </form>

      {/* Inline dropdown results */}
      {showDropdown && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl border border-surface-200 shadow-xl shadow-black/10 overflow-hidden z-50 max-h-[60vh] overflow-y-auto">
          {results.length > 0 ? (
            <>
              {results.map((hit) => (
                <Link
                  key={hit.id}
                  href={`/producto/${hit.slug}`}
                  onClick={handleResultClick}
                  className="flex items-center gap-3 px-3.5 py-2.5 active:bg-surface-100 transition-colors border-b border-surface-100 last:border-b-0"
                >
                  <div className="w-11 h-11 flex-shrink-0 rounded-xl bg-surface-50 flex items-center justify-center overflow-hidden">
                    {hit.image_src ? (
                      <Image
                        src={hit.image_src}
                        alt={hit.image_alt || hit.name}
                        width={40}
                        height={40}
                        className="object-contain w-8 h-8"
                      />
                    ) : (
                      <Package className="w-5 h-5 text-surface-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-[13px] font-semibold text-gray-900 truncate"
                      dangerouslySetInnerHTML={{
                        __html: hit._formatted?.name || hit.name,
                      }}
                    />
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {hit.brand_name && (
                        <span className="text-[11px] text-surface-500">{hit.brand_name}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {hit.on_sale && hit.regular_price && (
                      <span className="text-[10px] text-surface-400 line-through block">
                        {formatPrice(hit.regular_price)}
                      </span>
                    )}
                    <span className="text-[13px] font-bold text-primary-600">
                      {formatPrice(hit.price)}
                    </span>
                  </div>
                </Link>
              ))}
              {total > results.length && (
                <Link
                  href={`/buscar?q=${encodeURIComponent(query.trim())}`}
                  onClick={handleResultClick}
                  className="flex items-center justify-center gap-1.5 py-3 text-[13px] font-semibold text-primary-600 active:bg-surface-50 transition-colors"
                >
                  Ver los {total} resultados
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </>
          ) : !loading ? (
            <div className="py-8 text-center">
              <Package className="w-8 h-8 text-surface-300 mx-auto mb-2" />
              <p className="text-sm text-surface-500">Sin resultados para &ldquo;{query}&rdquo;</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
