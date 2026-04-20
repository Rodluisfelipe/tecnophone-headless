'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { SlidersHorizontal, Grid3X3, LayoutList, ChevronDown, ChevronUp, X, Filter, DollarSign, Tag, Cpu, Check, Store } from 'lucide-react';
import ProductCard from '@/components/products/ProductCard';
import { WCProduct } from '@/types/woocommerce';
import { cn } from '@/lib/utils';

/** Map an Algolia hit (flat fields) to the WCProduct shape that ProductCard expects */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapAlgoliaHitToProduct(hit: any): WCProduct {
  return {
    id: hit.id || hit.objectID,
    name: hit.name || '',
    slug: hit.slug || '',
    type: 'simple',
    status: 'publish',
    featured: hit.featured || false,
    description: '',
    short_description: hit.short_description || '',
    sku: hit.sku || '',
    price: hit.price || '0',
    regular_price: hit.regular_price || '0',
    sale_price: hit.sale_price || '',
    on_sale: hit.on_sale || false,
    stock_status: hit.stock_status === 'IN_STOCK' || hit.stock_status === 'instock' ? 'instock' : hit.stock_status || 'instock',
    stock_quantity: null,
    categories: (hit.category_names || []).map((name: string, i: number) => ({
      id: i,
      name,
      slug: (hit.categories || [])[i] || name.toLowerCase().replace(/\s+/g, '-'),
      parent: 0,
      description: '',
      image: null,
      count: 0,
    })),
    tags: [],
    images: hit.image_src
      ? [{ id: 0, src: hit.image_src, name: hit.name || '', alt: hit.image_alt || hit.name || '' }]
      : [],
    attributes: [],
    variations: [],
    average_rating: hit.average_rating || '0',
    rating_count: hit.rating_count || 0,
    related_ids: [],
    meta_data: [],
    brand: hit.brand_name ? { id: 0, name: hit.brand_name, slug: hit.brand_name.toLowerCase().replace(/\s+/g, '-'), image: hit.brand_image ? { id: 0, src: hit.brand_image, name: '', alt: '' } : null } : null,
  };
}

const sortOptions = [
  { value: 'date-desc', label: 'Más recientes' },
  { value: 'price-asc', label: 'Menor precio' },
  { value: 'price-desc', label: 'Mayor precio' },
  { value: 'title-asc', label: 'A - Z' },
  { value: 'popularity-desc', label: 'Populares' },
  { value: 'rating-desc', label: 'Mejor valorados' },
];

const priceRanges = [
  { label: 'Todos los precios', min: '', max: '' },
  { label: 'Hasta $500.000', min: '', max: '500000' },
  { label: '$500.000 - $1.000.000', min: '500000', max: '1000000' },
  { label: '$1.000.000 - $2.000.000', min: '1000000', max: '2000000' },
  { label: '$2.000.000 - $5.000.000', min: '2000000', max: '5000000' },
  { label: 'Más de $5.000.000', min: '5000000', max: '' },
];

const ATTR_LABELS: Record<string, string> = {
  attr_ram: 'RAM',
  attr_almacenamiento: 'Almacenamiento',
  attr_pantalla: 'Pantalla',
  attr_procesador: 'Procesador',
  attr_tipo: 'Tipo',
  attr_marca: 'Marca',
  'attr_memoria-ram': 'Memoria RAM',
  'attr_color': 'Color',
  'attr_tamano': 'Tamaño',
};

/* ─── Collapsible filter section ─── */
function FilterSection({ title, icon, defaultOpen = true, children }: {
  title: string;
  icon: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-surface-200 last:border-b-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full py-3 text-left group"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-gray-800 group-hover:text-primary-600 transition-colors">
          {icon}
          {title}
        </span>
        {open
          ? <ChevronUp className="w-4 h-4 text-surface-500" />
          : <ChevronDown className="w-4 h-4 text-surface-500" />
        }
      </button>
      {open && <div className="pb-3 animate-fade-in">{children}</div>}
    </div>
  );
}

interface ProductCatalogProps {
  initialProducts: WCProduct[];
  initialTotal: number;
  initialTotalPages: number;
}

export default function ProductCatalog({
  initialProducts,
  initialTotal,
  initialTotalPages,
}: ProductCatalogProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [products, setProducts] = useState<WCProduct[]>(initialProducts);
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [total, setTotal] = useState(initialTotal);
  const [gridCols, setGridCols] = useState<2 | 3 | 4>(3);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [facets, setFacets] = useState<Record<string, Record<string, number>>>({});
  const drawerRef = useRef<HTMLDivElement>(null);

  const page = parseInt(searchParams.get('page') || '1');
  const sort = searchParams.get('sort') || 'date-desc';
  const onSale = searchParams.get('on_sale') === 'true';
  const minPrice = searchParams.get('min_price') || '';
  const maxPrice = searchParams.get('max_price') || '';

  const activeAttrs = useMemo(() => {
    const map: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      if (key.startsWith('attr_') && value) map[key] = value;
    });
    return map;
  }, [searchParams]);

  const hasAttrFilters = Object.keys(activeAttrs).length > 0;
  const activeBrand = searchParams.get('brand') || '';
  const hasAnyFilter = hasAttrFilters || onSale || !!minPrice || !!maxPrice || !!activeBrand;
  const isInitialState = page === 1 && sort === 'date-desc' && !hasAnyFilter;

  const fetchProducts = useCallback(async () => {
    if (isInitialState) {
      setProducts(initialProducts);
      setTotal(initialTotal);
      setTotalPages(initialTotalPages);
      try {
        const res = await fetch('/api/products/browse?per_page=0');
        const data = await res.json();
        if (data.facets) setFacets(data.facets);
      } catch { /* non-critical */ }
      return;
    }

    setLoading(true);

    if (hasAnyFilter) {
      // Filters active → use Algolia (has price_numeric, brand_name, attr_*)
      const params = new URLSearchParams();
      params.set('page', String(Math.max(0, page - 1)));
      params.set('per_page', '24');
      if (onSale) params.set('on_sale', 'true');
      if (minPrice) params.set('min_price', minPrice);
      if (maxPrice) params.set('max_price', maxPrice);
      if (activeBrand) params.set('brand', activeBrand);
      for (const [key, value] of Object.entries(activeAttrs)) {
        params.set(key, value);
      }
      try {
        const res = await fetch(`/api/products/browse?${params.toString()}`);
        const data = await res.json();
        setProducts((data.products || []).map(mapAlgoliaHitToProduct));
        setTotalPages(data.totalPages || 0);
        setTotal(data.total || 0);
        if (data.facets) setFacets(data.facets);
      } catch {
        setProducts([]);
      }
    } else {
      // No filters, just pagination/sort → use WooCommerce API (GraphQL, full catalog)
      const [sortField, sortDir] = sort.split('-');
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('per_page', '24');
      params.set('orderby', sortField);
      params.set('order', sortDir);
      try {
        const res = await fetch(`/api/products?${params.toString()}`);
        const data = await res.json();
        setProducts(data.products || []);
        setTotalPages(data.totalPages || 0);
        setTotal(data.total || 0);
      } catch {
        setProducts([]);
      }
      // Also refresh facets from Algolia in background
      try {
        const res = await fetch('/api/products/browse?per_page=0');
        const data = await res.json();
        if (data.facets) setFacets(data.facets);
      } catch { /* non-critical */ }
    }

    setLoading(false);
  }, [page, sort, onSale, minPrice, maxPrice, isInitialState, initialProducts, initialTotal, initialTotalPages, activeAttrs, activeBrand]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Close mobile drawer on outside click
  useEffect(() => {
    if (!mobileFiltersOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        setMobileFiltersOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [mobileFiltersOpen]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    document.body.style.overflow = mobileFiltersOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileFiltersOpen]);

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    if (key !== 'page') params.set('page', '1');
    router.push(`${pathname}?${params.toString()}`);
  };

  const activeFiltersCount = (onSale ? 1 : 0) + (minPrice || maxPrice ? 1 : 0) + Object.keys(activeAttrs).length + (activeBrand ? 1 : 0);

  const clearAllFilters = () => {
    const params = new URLSearchParams();
    params.set('page', '1');
    if (sort !== 'date-desc') params.set('sort', sort);
    router.push(`${pathname}?${params.toString()}`);
  };

  /** Brand facets with product counts — sorted by count descending */
  const brandFacets = useMemo(() => {
    const brands = facets['brand_name'];
    if (!brands) return [];
    return Object.entries(brands)
      .filter(([name]) => name.trim() !== '')
      .sort(([, a], [, b]) => b - a);
  }, [facets]);

  /** Map brand_name -> brand_image from products (built once from current product set) */
  const brandImages = useMemo(() => {
    const map: Record<string, string> = {};
    for (const p of products) {
      if (p.brand?.name && p.brand.image?.src) {
        map[p.brand.name] = p.brand.image.src;
      }
    }
    return map;
  }, [products]);

  const attrFacets = useMemo(() => {
    return Object.entries(facets)
      .filter(([key, values]) => key.startsWith('attr_') && Object.keys(values).length > 0)
      .map(([key, values]) => ({
        key,
        label: ATTR_LABELS[key] || key.replace('attr_', '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        options: Object.entries(values).sort(([a], [b]) => a.localeCompare(b, 'es', { numeric: true })),
      }));
  }, [facets]);

  const categoryFacets = useMemo(() => {
    const cats = facets['category_names'];
    if (!cats) return [];
    return Object.entries(cats)
      .filter(([name]) => !['full', 'sin-categorizar', 'uncategorized'].includes(name.toLowerCase()))
      .sort(([, a], [, b]) => b - a);
  }, [facets]);

  /* ─── Shared filter sidebar content ─── */
  const filterContent = (
    <div className="space-y-0">
      {/* Active filters summary */}
      {activeFiltersCount > 0 && (
        <div className="pb-3 border-b border-surface-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              {activeFiltersCount} filtro{activeFiltersCount !== 1 ? 's' : ''} activo{activeFiltersCount !== 1 ? 's' : ''}
            </span>
            <button
              onClick={clearAllFilters}
              className="text-xs text-red-500 hover:text-red-400 font-semibold transition-colors"
            >
              Limpiar todo
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {onSale && (
              <span className="inline-flex items-center gap-1 bg-red-50 text-red-600 pl-2.5 pr-1.5 py-1 rounded-full text-[11px] font-medium border border-red-200">
                Ofertas
                <button onClick={() => updateParam('on_sale', '')} className="hover:bg-red-100 rounded-full p-0.5 transition-colors"><X className="w-3 h-3" /></button>
              </span>
            )}
            {(minPrice || maxPrice) && (
              <span className="inline-flex items-center gap-1 bg-primary-50 text-primary-700 pl-2.5 pr-1.5 py-1 rounded-full text-[11px] font-medium border border-primary-200">
                {priceRanges.find(r => r.min === minPrice && r.max === maxPrice)?.label || `$${minPrice || '0'} – $${maxPrice || '∞'}`}
                <button onClick={() => {
                  const params = new URLSearchParams(searchParams.toString());
                  params.delete('min_price');
                  params.delete('max_price');
                  params.set('page', '1');
                  router.push(`${pathname}?${params.toString()}`);
                }} className="hover:bg-primary-100 rounded-full p-0.5 transition-colors"><X className="w-3 h-3" /></button>
              </span>
            )}
            {Object.entries(activeAttrs).map(([key, value]) => (
              <span key={key} className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 pl-2.5 pr-1.5 py-1 rounded-full text-[11px] font-medium border border-indigo-200">
                {value}
                <button onClick={() => updateParam(key, '')} className="hover:bg-indigo-100 rounded-full p-0.5 transition-colors"><X className="w-3 h-3" /></button>
              </span>
            ))}
            {activeBrand && (
              <span className="inline-flex items-center gap-1 bg-violet-50 text-violet-700 pl-2.5 pr-1.5 py-1 rounded-full text-[11px] font-medium border border-violet-200">
                {activeBrand}
                <button onClick={() => updateParam('brand', '')} className="hover:bg-violet-100 rounded-full p-0.5 transition-colors"><X className="w-3 h-3" /></button>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Categories */}
      {categoryFacets.length > 0 && (
        <FilterSection title="Categoría" icon={<Tag className="w-3.5 h-3.5 text-primary-500" />}>
          <div className="space-y-0.5 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
            {categoryFacets.map(([name, count]) => (
              <button
                key={name}
                onClick={() => {/* Category filtering can be added later */}}
                className="flex items-center justify-between w-full px-2 py-1.5 rounded-lg text-sm text-gray-700 hover:bg-surface-50 hover:text-gray-900 transition-colors group"
              >
                <span className="truncate">{name}</span>
                <span className="text-[11px] text-surface-500 font-medium tabular-nums group-hover:text-gray-600">{count}</span>
              </button>
            ))}
          </div>
        </FilterSection>
      )}

      {/* Brands */}
      {brandFacets.length > 0 && (
        <FilterSection title="Marca" icon={<Store className="w-3.5 h-3.5 text-violet-500" />}>
          <div className="space-y-0.5 max-h-56 overflow-y-auto pr-1 scrollbar-thin">
            {brandFacets.map(([name, count]) => {
              const isActive = activeBrand === name;
              const logo = brandImages[name];
              return (
                <button
                  key={name}
                  onClick={() => updateParam('brand', isActive ? '' : name)}
                  className={cn(
                    'flex items-center justify-between w-full px-2 py-1.5 rounded-lg text-sm transition-colors',
                    isActive
                      ? 'bg-violet-50 text-violet-700 font-medium'
                      : 'text-gray-700 hover:bg-surface-50 hover:text-gray-900'
                  )}
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <span className={cn(
                      'w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors',
                      isActive ? 'border-violet-500 bg-violet-500' : 'border-surface-300'
                    )}>
                      {isActive && <Check className="w-3 h-3 text-white" />}
                    </span>
                    {logo ? (
                      <img src={logo} alt={name} className="w-5 h-5 object-contain rounded flex-shrink-0" />
                    ) : null}
                    <span className="truncate">{name}</span>
                  </span>
                  <span className="text-[11px] text-surface-500 font-medium tabular-nums ml-1">{count}</span>
                </button>
              );
            })}
          </div>
        </FilterSection>
      )}

      {/* Price */}
      <FilterSection title="Precio" icon={<DollarSign className="w-3.5 h-3.5 text-emerald-500" />}>
        <div className="space-y-0.5">
          {priceRanges.map((range) => {
            const isActive = minPrice === range.min && maxPrice === range.max;
            return (
              <button
                key={range.label}
                onClick={() => {
                  const params = new URLSearchParams(searchParams.toString());
                  if (range.min) params.set('min_price', range.min); else params.delete('min_price');
                  if (range.max) params.set('max_price', range.max); else params.delete('max_price');
                  params.set('page', '1');
                  router.push(`${pathname}?${params.toString()}`);
                }}
                className={cn(
                  'flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-sm transition-colors',
                  isActive
                    ? 'bg-primary-50 text-primary-700 font-medium'
                    : 'text-gray-700 hover:bg-surface-50 hover:text-gray-900'
                )}
              >
                <span className={cn(
                  'w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors',
                  isActive ? 'border-primary-500 bg-primary-500' : 'border-surface-300'
                )}>
                  {isActive && <Check className="w-3 h-3 text-white" />}
                </span>
                {range.label}
              </button>
            );
          })}
        </div>
      </FilterSection>

      {/* Offers */}
      <FilterSection title="Ofertas" icon={<Tag className="w-3.5 h-3.5 text-red-500" />}>
        <button
          onClick={() => updateParam('on_sale', onSale ? '' : 'true')}
          className={cn(
            'flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-sm transition-colors',
            onSale
              ? 'bg-red-50 text-red-600 font-medium'
              : 'text-gray-700 hover:bg-surface-50 hover:text-gray-900'
          )}
        >
          <span className={cn(
            'w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors',
            onSale ? 'border-red-500 bg-red-500' : 'border-surface-300'
          )}>
            {onSale && <Check className="w-3 h-3 text-white" />}
          </span>
          🔥 Solo ofertas
        </button>
      </FilterSection>

      {/* Dynamic attribute facets */}
      {attrFacets.map((facet) => (
        <FilterSection
          key={facet.key}
          title={facet.label}
          icon={<Cpu className="w-3.5 h-3.5 text-indigo-500" />}
        >
          <div className="space-y-0.5">
            {facet.options.map(([value, count]) => {
              const isActive = activeAttrs[facet.key] === value;
              return (
                <button
                  key={value}
                  onClick={() => updateParam(facet.key, isActive ? '' : value)}
                  className={cn(
                    'flex items-center justify-between w-full px-2 py-1.5 rounded-lg text-sm transition-colors',
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 font-medium'
                      : 'text-gray-700 hover:bg-surface-50 hover:text-gray-900'
                  )}
                >
                  <span className="flex items-center gap-2">
                    <span className={cn(
                      'w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors',
                      isActive ? 'border-indigo-500 bg-indigo-500' : 'border-surface-300'
                    )}>
                      {isActive && <Check className="w-3 h-3 text-white" />}
                    </span>
                    <span className="uppercase">{value}</span>
                  </span>
                  <span className="text-[11px] text-surface-500 font-medium tabular-nums">{count}</span>
                </button>
              );
            })}
          </div>
        </FilterSection>
      ))}
    </div>
  );

  return (
    <div className="container-custom py-6 lg:py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
            {onSale ? '🔥 Ofertas Especiales' : 'Todos los Productos'}
          </h1>
          <p className="text-surface-600 mt-1 text-sm">
            {total} producto{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Mobile filter trigger */}
          <button
            onClick={() => setMobileFiltersOpen(true)}
            className="lg:hidden flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-white border border-surface-300 text-gray-700 hover:border-primary-500/40 transition-colors shadow-sm"
          >
            <Filter className="w-4 h-4" />
            Filtros
            {activeFiltersCount > 0 && (
              <span className="bg-primary-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* Sort */}
          <div className="relative">
            <select
              value={sort}
              onChange={(e) => updateParam('sort', e.target.value)}
              className="appearance-none bg-white border border-surface-300 rounded-xl pl-4 pr-10 py-2.5 text-sm text-gray-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none cursor-pointer shadow-sm"
            >
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500 pointer-events-none" />
          </div>

          {/* Grid toggle (desktop) */}
          <div className="hidden lg:flex items-center border border-surface-300 rounded-xl overflow-hidden shadow-sm">
            {[3, 4].map((cols) => (
              <button
                key={cols}
                onClick={() => setGridCols(cols as 3 | 4)}
                className={cn(
                  'p-2.5 transition-colors',
                  gridCols === cols ? 'bg-primary-500 text-white' : 'bg-white text-gray-400 hover:text-gray-700'
                )}
              >
                {cols === 3 ? <LayoutList className="w-4 h-4" /> : <Grid3X3 className="w-4 h-4" />}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Layout: Sidebar + Products ─── */}
      <div className="flex gap-8">
        {/* Desktop Sidebar — always visible */}
        <aside className="hidden lg:block w-[260px] flex-shrink-0">
          <div className="sticky top-24 bg-white rounded-2xl border border-surface-200 p-4 shadow-sm max-h-[calc(100vh-7rem)] overflow-y-auto scrollbar-thin">
            <div className="flex items-center gap-2 mb-3 pb-3 border-b border-surface-200">
              <SlidersHorizontal className="w-4 h-4 text-primary-600" />
              <span className="text-sm font-bold text-gray-900">Filtros</span>
            </div>
            {filterContent}
          </div>
        </aside>

        {/* Mobile Slide-out Drawer */}
        {mobileFiltersOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" />
            {/* Drawer */}
            <div
              ref={drawerRef}
              className="absolute inset-y-0 left-0 w-full max-w-xs bg-white shadow-2xl flex flex-col animate-slide-in-right"
              style={{ animationDuration: '0.3s' }}
            >
              <div className="flex items-center justify-between p-4 border-b border-surface-200">
                <span className="flex items-center gap-2 text-base font-bold text-gray-900">
                  <SlidersHorizontal className="w-5 h-5 text-primary-600" />
                  Filtros
                </span>
                <button
                  onClick={() => setMobileFiltersOpen(false)}
                  className="p-2 -mr-2 rounded-xl hover:bg-surface-100 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
                {filterContent}
              </div>
              <div className="p-4 border-t border-surface-200">
                <button
                  onClick={() => setMobileFiltersOpen(false)}
                  className="w-full py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl transition-colors text-sm shadow-lg shadow-primary-500/25"
                >
                  Ver {total} resultado{total !== 1 ? 's' : ''}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Products area */}
        <div className="flex-1 min-w-0">
          {/* Active filter chips (mobile visible, desktop compact) */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-4 lg:hidden">
              <span className="text-xs text-surface-500 font-medium">Filtros:</span>
              {onSale && (
                <span className="inline-flex items-center gap-1 bg-red-50 text-red-600 pl-2 pr-1 py-0.5 rounded-full text-[11px] font-medium border border-red-200">
                  Ofertas
                  <button onClick={() => updateParam('on_sale', '')} className="p-0.5"><X className="w-2.5 h-2.5" /></button>
                </span>
              )}
              {Object.entries(activeAttrs).map(([key, value]) => (
                <span key={key} className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 pl-2 pr-1 py-0.5 rounded-full text-[11px] font-medium border border-indigo-200">
                  {value}
                  <button onClick={() => updateParam(key, '')} className="p-0.5"><X className="w-2.5 h-2.5" /></button>
                </span>
              ))}
              {activeBrand && (
                <span className="inline-flex items-center gap-1 bg-violet-50 text-violet-700 pl-2 pr-1 py-0.5 rounded-full text-[11px] font-medium border border-violet-200">
                  {activeBrand}
                  <button onClick={() => updateParam('brand', '')} className="p-0.5"><X className="w-2.5 h-2.5" /></button>
                </span>
              )}
              <button onClick={clearAllFilters} className="text-[11px] text-red-500 font-medium hover:underline ml-1">
                Limpiar
              </button>
            </div>
          )}

          {/* Products Grid */}
          {loading ? (
            <div className={cn(
              'grid gap-4 lg:gap-5',
              gridCols === 3 ? 'grid-cols-2 lg:grid-cols-3' : 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
            )}>
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="bg-surface-100 animate-pulse rounded-2xl h-80 border border-surface-200" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <SlidersHorizontal className="w-16 h-16 text-surface-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No se encontraron productos</h3>
              <p className="text-surface-600 mb-4">Intenta ajustar los filtros de búsqueda</p>
              {activeFiltersCount > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="text-sm text-primary-600 hover:text-primary-700 font-semibold underline underline-offset-2"
                >
                  Limpiar todos los filtros
                </button>
              )}
            </div>
          ) : (
            <div
              className={cn(
                'grid gap-4 lg:gap-5',
                gridCols === 3
                  ? 'grid-cols-2 lg:grid-cols-3'
                  : 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
              )}
            >
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-10">
              {(() => {
                const pages: (number | 'ellipsis')[] = [];
                if (totalPages <= 7) {
                  for (let i = 1; i <= totalPages; i++) pages.push(i);
                } else {
                  pages.push(1);
                  if (page > 3) pages.push('ellipsis');
                  for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
                  if (page < totalPages - 2) pages.push('ellipsis');
                  pages.push(totalPages);
                }
                return pages.map((p, idx) =>
                  p === 'ellipsis' ? (
                    <span key={`e${idx}`} className="w-10 h-10 flex items-center justify-center text-surface-500">…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => updateParam('page', String(p))}
                      className={cn(
                        'w-10 h-10 rounded-xl text-sm font-medium transition-colors',
                        p === page
                          ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                          : 'bg-white border border-surface-300 text-surface-700 hover:border-primary-500/30 hover:text-gray-900'
                      )}
                    >
                      {p}
                    </button>
                  )
                );
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
