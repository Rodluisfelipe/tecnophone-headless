'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Loader2, ArrowRight, Package, ChevronLeft } from 'lucide-react';
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

interface CommandSearchProps {
  open: boolean;
  onClose: () => void;
}

export default function CommandSearch({ open, onClose }: CommandSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchHit[]>([]);
  const [total, setTotal] = useState(0);
  const [timeMs, setTimeMs] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const desktopInputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const abortRef = useRef<AbortController>();
  const router = useRouter();

  // Focus input on open
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        // Focus mobile or desktop input depending on viewport
        if (window.innerWidth >= 1024) {
          desktopInputRef.current?.focus();
        } else {
          inputRef.current?.focus();
        }
      }, 50);
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
    }
  }, [open]);

  // Lock body scroll
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

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
      const res = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}&limit=8`, {
        signal: controller.signal,
      });
      const data: SearchResponse = await res.json();
      setResults(data.products || []);
      setTotal(data.total || 0);
      setTimeMs(data.processingTimeMs || 0);
      setSelectedIndex(0);
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
    debounceRef.current = setTimeout(() => doSearch(query), 150);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, doSearch]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        router.push(`/producto/${results[selectedIndex].slug}`);
        onClose();
      } else if (query.trim()) {
        router.push(`/buscar?q=${encodeURIComponent(query.trim())}`);
        onClose();
      }
    }
  };

  if (!open) return null;

  // Shared result list
  const renderResults = (maxH: string) => (
    <div className={`${maxH} overflow-y-auto`}>
      {query.trim().length > 0 && results.length > 0 && (
        <>
          <div className="px-4 lg:px-5 py-2 flex items-center justify-between">
            <span className="text-[11px] font-bold text-surface-700 uppercase tracking-wider">
              {total} resultado{total !== 1 ? 's' : ''}
            </span>
            {timeMs > 0 && (
              <span className="text-[11px] text-surface-600">{timeMs}ms</span>
            )}
          </div>
          {results.map((hit, i) => (
            <Link
              key={hit.id}
              href={`/producto/${hit.slug}`}
              onClick={onClose}
              className={`flex items-center gap-3 lg:gap-4 px-4 lg:px-5 py-3 transition-colors ${
                i === selectedIndex ? 'bg-primary-500/10' : 'hover:bg-gray-50 active:bg-gray-100'
              }`}
            >
              <div className="w-12 h-12 lg:w-14 lg:h-14 flex-shrink-0 rounded-xl bg-surface-100 flex items-center justify-center overflow-hidden">
                {hit.image_src ? (
                  <Image
                    src={hit.image_src}
                    alt={hit.image_alt || hit.name}
                    width={48}
                    height={48}
                    className="object-contain w-9 h-9 lg:w-10 lg:h-10"
                  />
                ) : (
                  <Package className="w-5 h-5 lg:w-6 lg:h-6 text-surface-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-semibold truncate ${
                    i === selectedIndex ? 'text-primary-600' : 'text-gray-900'
                  }`}
                  dangerouslySetInnerHTML={{
                    __html: hit._formatted?.name || hit.name,
                  }}
                />
                <div className="flex items-center gap-2 mt-0.5">
                  {hit.category_names?.[0] && (
                    <span className="text-[11px] text-surface-700">{hit.category_names[0]}</span>
                  )}
                  {hit.brand_name && (
                    <span className="text-[11px] text-surface-600">· {hit.brand_name}</span>
                  )}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                {hit.on_sale && hit.regular_price && (
                  <span className="text-[11px] text-surface-600 line-through block">
                    {formatPrice(hit.regular_price)}
                  </span>
                )}
                <span className="text-sm font-bold text-primary-600">
                  {formatPrice(hit.price)}
                </span>
              </div>
            </Link>
          ))}
          {total > results.length && (
            <Link
              href={`/buscar?q=${encodeURIComponent(query.trim())}`}
              onClick={onClose}
              className="flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-primary-600 hover:bg-gray-50 active:bg-gray-100 transition-colors border-t border-surface-200"
            >
              Ver todos los resultados
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </>
      )}

      {query.trim().length > 0 && !loading && results.length === 0 && (
        <div className="px-5 py-10 text-center">
          <Package className="w-10 h-10 text-surface-400 mx-auto mb-3" />
          <p className="text-sm text-surface-600">No se encontraron productos para &ldquo;{query}&rdquo;</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100]">
      {/* ===== MOBILE: Full-screen search ===== */}
      <div className="lg:hidden flex flex-col h-full bg-white">
        {/* Top bar */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-surface-200 bg-white">
          <button
            onClick={onClose}
            className="p-2 -ml-1 text-surface-700 active:bg-surface-100 rounded-full transition-colors"
            aria-label="Cerrar búsqueda"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Buscar productos..."
              className="w-full bg-surface-100 rounded-full pl-10 pr-9 py-2.5 text-base text-gray-900 placeholder-surface-400 outline-none focus:bg-surface-50 focus:ring-2 focus:ring-primary-500/20 transition-all"
              autoComplete="off"
              enterKeyHint="search"
            />
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
            {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-600 animate-spin" />}
            {query && !loading && (
              <button
                onClick={() => { setQuery(''); setResults([]); inputRef.current?.focus(); }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-surface-500 active:text-gray-900"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Results area */}
        {query.trim().length === 0 ? (
          <div className="flex-1 flex items-center justify-center px-6">
            <div className="text-center">
              <Search className="w-10 h-10 text-surface-300 mx-auto mb-3" />
              <p className="text-sm text-surface-500">Busca por nombre, marca o categoría</p>
            </div>
          </div>
        ) : (
          renderResults('flex-1')
        )}
      </div>

      {/* ===== DESKTOP: Modal overlay ===== */}
      <div className="hidden lg:block">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative flex items-start justify-center pt-[15vh]">
          <div className="w-full max-w-2xl mx-4 bg-white border border-surface-200 rounded-2xl shadow-2xl shadow-gray-200/60 overflow-hidden animate-scale-in">
            {/* Search Input */}
            <div className="flex items-center gap-3 px-5 border-b border-surface-200">
              <Search className="w-5 h-5 text-surface-700 flex-shrink-0" />
              <input
                ref={desktopInputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Buscar productos, marcas, categorías..."
                className="flex-1 bg-transparent py-4 text-gray-900 text-base placeholder-surface-500 outline-none"
                autoComplete="off"
              />
              {loading && <Loader2 className="w-4 h-4 text-primary-600 animate-spin flex-shrink-0" />}
              {query && !loading && (
                <button onClick={() => { setQuery(''); setResults([]); }} className="p-1 text-surface-700 hover:text-gray-900 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              )}
              <kbd className="inline-flex items-center px-2 py-0.5 bg-surface-200 border border-surface-300 rounded text-[10px] font-bold text-surface-700">
                ESC
              </kbd>
            </div>

            {/* Results + empty state */}
            {query.trim().length === 0 ? (
              <div className="px-5 py-6 text-center">
                <p className="text-sm text-surface-700">Escribe para buscar en el catálogo</p>
                <div className="flex items-center justify-center gap-2 mt-3 text-[11px] text-surface-600">
                  <kbd className="px-1.5 py-0.5 bg-surface-100 border border-surface-200 rounded text-[10px]">↑↓</kbd>
                  <span>navegar</span>
                  <kbd className="px-1.5 py-0.5 bg-surface-200 border border-surface-300 rounded text-[10px]">↵</kbd>
                  <span>seleccionar</span>
                  <kbd className="px-1.5 py-0.5 bg-surface-200 border border-surface-300 rounded text-[10px]">esc</kbd>
                  <span>cerrar</span>
                </div>
              </div>
            ) : (
              renderResults('max-h-[50vh]')
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
