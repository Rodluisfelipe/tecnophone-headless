'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ShoppingCart,
  Minus,
  Plus,
  Truck,
  Shield,
  MessageCircle,
  Check,
  ChevronRight,
  ChevronLeft,
  Star,
  Zap,
  Package,
  Headphones,
  Lock,
  CreditCard,
  ChevronDown,
  ChevronUp,
  Monitor,
  Briefcase,
  GraduationCap,
  Gamepad2,
  Film,
  Share2,
  X,
} from 'lucide-react';
import { WCProduct } from '@/types/woocommerce';
import { formatPrice, calculateDiscount } from '@/lib/woocommerce';
import { useCartStore } from '@/store/cart';
import ProductCard from '@/components/products/ProductCard';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { toast } from '@/lib/toast';
import DeliveryBadge from '@/components/products/DeliveryBadge';
import ShareModal from '@/components/products/ShareModal';
import dynamic from 'next/dynamic';

const PaymentBrickDynamic = dynamic(() => import('@/components/checkout/PaymentBrick'), {
  ssr: false,
  loading: () => <div className="h-48 rounded-xl bg-surface-100 animate-pulse" />,
});

const colombianDepts = [
  'Amazonas','Antioquia','Arauca','Atlántico','Bolívar','Boyacá',
  'Caldas','Caquetá','Casanare','Cauca','Cesar','Chocó','Córdoba',
  'Cundinamarca','Guainía','Guaviare','Huila','La Guajira','Magdalena',
  'Meta','Nariño','Norte de Santander','Putumayo','Quindío','Risaralda',
  'San Andrés y Providencia','Santander','Sucre','Tolima','Valle del Cauca',
  'Vaupés','Vichada','Bogotá D.C.',
];

interface Props {
  product: WCProduct;
  relatedProducts: WCProduct[];
}

const idealParaIcons = [Briefcase, GraduationCap, Film, Gamepad2];

export default function ProductDetail({ product, relatedProducts }: Props) {
  const router = useRouter();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const ctaRef = useRef<HTMLDivElement>(null);
  const addItem = useCartStore((s) => s.addItem);

  const discount = calculateDiscount(product.regular_price, product.sale_price);
  const price = parseFloat(product.price);
  const monthlyPrice = price > 0 ? Math.round(price / 12) : 0;
  const [inStock, setInStock] = useState(product.stock_status !== 'outofstock');
  const touchStartX = useRef<number | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  // Inline quick checkout
  const [showQuickCheckout, setShowQuickCheckout] = useState(false);
  const [quickStep, setQuickStep] = useState<'form' | 'payment'>('form');
  const [quickLoading, setQuickLoading] = useState(false);
  const [quickError, setQuickError] = useState('');
  const [quickOrderData, setQuickOrderData] = useState<{ order_id: number; order_key: string; total: string } | null>(null);
  const [quickForm, setQuickForm] = useState({ first_name: '', last_name: '', email: '', phone: '', address_1: '', city: '', state: 'Cundinamarca' });
  // Bundle: set of selected related product IDs
  const [bundleSelected, setBundleSelected] = useState<Set<number>>(new Set());
  const [shareOpen, setShareOpen] = useState(false);
  const mpEnabled = (process.env.NEXT_PUBLIC_MP_PUBLIC_KEY || '').length > 10;

  // Poll stock so the UI updates if availability changes while the user is browsing
  useEffect(() => {
    if (product.type === 'external') return;
    let lastKnown = product.stock_status !== 'outofstock';

    const check = () => {
      fetch('/api/stock-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: [{ product_id: product.id, quantity: 1 }] }),
      })
        .then((r) => r.ok ? r.json() : null)
        .then((data) => {
          if (!data) return;
          // Only act on definitive out-of-stock (issues array has a real "Agotado" reason)
          const isDefinitelyOut = data.issues?.some((i: { reason: string }) => i.reason === 'Agotado');
          const nowInStock = !isDefinitelyOut;
          if (lastKnown && !nowInStock) {
            toast.error('Este producto se acaba de agotar');
          } else if (!lastKnown && nowInStock && data.issues?.length === 0) {
            toast.success('¡Este producto volvió a estar disponible!');
          }
          lastKnown = nowInStock;
          setInStock(nowInStock);
        })
        .catch(() => {});
    };

    // First check after 5 seconds, then every 60 seconds
    const initialTimer = setTimeout(check, 5_000);
    const interval = setInterval(check, 60_000);

    // Also check when the user returns to the tab
    const onFocus = () => check();
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') onFocus();
    });

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, [product.id, product.type, product.stock_status]);
  const isFull = product.categories?.some((c) => c.slug === 'full');
  const displayCategory = product.categories?.find((c) => !['full', 'sin-categorizar', 'uncategorized'].includes(c.slug));

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addItem(product);
    }
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(50);
    setAddedToCart(true);
    toast.success(`${product.name} agregado al carrito`, {
      description: `${quantity} unidad${quantity > 1 ? 'es' : ''} — ${formatPrice(price * quantity)}`,
    });
    setTimeout(() => setAddedToCart(false), 2000);
  };

  // Sticky mobile bar: show when main CTA scrolls out of view
  useEffect(() => {
    if (!ctaRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShowStickyBar(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(ctaRef.current);
    return () => observer.disconnect();
  }, []);

  // Reset image skeleton on thumbnail change
  useEffect(() => { setImageLoaded(false); }, [selectedImage]);

  const handleShare = () => {
    setShareOpen(true);
  };

  const handleBuyNow = () => {
    for (let i = 0; i < quantity; i++) {
      addItem(product);
    }
    router.push('/checkout');
  };

  const whatsappMsg = encodeURIComponent(
    `Hola, estoy interesado en: ${product.name} - ${formatPrice(product.price)}\nhttps://tecnophone.co/producto/${product.slug}`
  );

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 40) { delta < 0 ? nextImage() : prevImage(); }
    touchStartX.current = null;
  };

  const handleQuickCheckout = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setQuickError('');
    setQuickLoading(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          billing: { ...quickForm, country: 'CO' },
          line_items: [{ product_id: product.id, quantity }],
          payment_method: mpEnabled ? 'mercadopago' : 'bacs',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al crear el pedido');
      setQuickOrderData(data);
      setQuickStep('payment');
    } catch (err) {
      setQuickError(err instanceof Error ? err.message : 'Error al procesar');
    } finally {
      setQuickLoading(false);
    }
  }, [quickForm, product.id, quantity, mpEnabled]);

  const handleQuickPaymentSuccess = useCallback((paymentId: number, status: string) => {
    router.push(`/checkout/gracias?payment_id=${paymentId}&status=${status}&order_id=${quickOrderData?.order_id}`);
  }, [router, quickOrderData]);

  const handleQuickPaymentError = useCallback((errorMsg: string) => {
    setQuickError(errorMsg);
  }, []);

  const shortDescText = product.short_description?.replace(/<[^>]*>/g, '').trim() || '';

  // WhatsApp contextual text based on product category
  const waCategorySlug = displayCategory?.slug || '';
  let whatsappAdvisorText = '¿Tienes preguntas? Habla con un asesor →';
  if (/portatil|laptop|computador|notebook/.test(waCategorySlug)) {
    whatsappAdvisorText = `¿Dudas sobre este portátil? Pregunta al asesor →`;
  } else if (/celular|smartphone|movil/.test(waCategorySlug)) {
    whatsappAdvisorText = `¿Dudas con este celular? Escríbenos →`;
  } else if (/tablet|ipad/.test(waCategorySlug)) {
    whatsappAdvisorText = `¿Preguntas sobre esta tablet? Te ayudamos →`;
  } else if (/audifono|auricular|headphone/.test(waCategorySlug)) {
    whatsappAdvisorText = `¿Dudas sobre estos audífonos? Pregunta →`;
  } else if (/monitor|pantalla/.test(waCategorySlug)) {
    whatsappAdvisorText = `¿Preguntas sobre este monitor? Te asesoramos →`;
  }

  // Deterministic price history sparkline (30-day simulated, anchored to real price)
  const sparkline = (() => {
    const W = 200, H = 48, N = 14;
    // Generate smooth variation using product ID as seed — deterministic so SSR = CSR
    const pts = Array.from({ length: N }, (_, i) => {
      const a = (product.id * 31 + i * 137 + i * i * 11) % 1000;
      const b = (product.id * 53 + i * 89) % 1000;
      const noise = ((a + b) % 1000) / 1000 - 0.5;
      return price * (1 + noise * 0.14);
    });
    // Last point is always today's real price
    pts[N - 1] = price;
    const min = Math.min(...pts), max = Math.max(...pts);
    const range = max - min || price * 0.01;
    const toXY = (v: number, i: number) => ({
      x: parseFloat(((i / (N - 1)) * W).toFixed(1)),
      y: parseFloat((H - ((v - min) / range) * (H - 10) - 5).toFixed(1)),
    });
    const points = pts.map((v, i) => toXY(v, i));
    // Smooth cubic bezier path
    const linePath = points
      .map((p, i) =>
        i === 0
          ? `M ${p.x} ${p.y}`
          : (() => {
              const prev = points[i - 1];
              const cpX = (prev.x + p.x) / 2;
              return `C ${cpX} ${prev.y} ${cpX} ${p.y} ${p.x} ${p.y}`;
            })()
      )
      .join(' ');
    const areaPath = `${linePath} L ${W} ${H} L 0 ${H} Z`;
    const firstVsLast = pts[0] > 0 ? ((pts[0] - price) / pts[0]) * 100 : 0;
    const trend: 'down' | 'up' | 'stable' = firstVsLast > 3 ? 'down' : firstVsLast < -3 ? 'up' : 'stable';
    const color = trend === 'down' ? '#22c55e' : trend === 'up' ? '#f97316' : '#6366f1';
    const lastPt = points[N - 1];
    const firstPt = points[0];
    return {
      linePath, areaPath, trend,
      pct: Math.abs(Math.round(firstVsLast)),
      color,
      lastX: lastPt.x, lastY: lastPt.y,
      firstX: firstPt.x, firstY: firstPt.y,
      firstPrice: pts[0],
    };
  })();

  // Estimate delivery date (3-5 business days)
  const deliveryStart = new Date();
  deliveryStart.setDate(deliveryStart.getDate() + 3);
  const deliveryEnd = new Date();
  deliveryEnd.setDate(deliveryEnd.getDate() + 5);
  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const deliveryText = `Llega gratis entre el ${dayNames[deliveryStart.getDay()]} y el ${dayNames[deliveryEnd.getDay()]}`;

  const prevImage = () => setSelectedImage((prev) => (prev > 0 ? prev - 1 : product.images.length - 1));
  const nextImage = () => setSelectedImage((prev) => (prev < product.images.length - 1 ? prev + 1 : 0));

  // JSON-LD structured data for SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: shortDescText || product.name,
    image: product.images.map((img) => img.src),
    sku: product.sku || undefined,
    brand: displayCategory
      ? { '@type': 'Brand', name: displayCategory.name }
      : undefined,
    offers: {
      '@type': 'Offer',
      url: `https://www.tecnophone.co/producto/${product.slug}`,
      priceCurrency: 'COP',
      price: parseFloat(product.price) || 0,
      availability: inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      seller: { '@type': 'Organization', name: 'TecnoPhone' },
    },
    ...(parseFloat(product.average_rating) > 0
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: product.average_rating,
            ratingCount: product.rating_count || 1,
          },
        }
      : {}),
  };

  // BreadcrumbList JSON-LD
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Inicio',
        item: 'https://www.tecnophone.co',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Productos',
        item: 'https://www.tecnophone.co/productos',
      },
      ...(displayCategory
        ? [
            {
              '@type': 'ListItem',
              position: 3,
              name: displayCategory.name,
              item: `https://www.tecnophone.co/categoria/${displayCategory.slug}`,
            },
            {
              '@type': 'ListItem',
              position: 4,
              name: product.name,
              item: `https://www.tecnophone.co/producto/${product.slug}`,
            },
          ]
        : [
            {
              '@type': 'ListItem',
              position: 3,
              name: product.name,
              item: `https://www.tecnophone.co/producto/${product.slug}`,
            },
          ]),
    ],
  };

  return (
    <div className="bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <div className="container-custom py-4 lg:py-8">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
          <Link href="/" className="hover:text-primary-600 transition-colors font-medium">Inicio</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href="/productos" className="hover:text-primary-600 transition-colors font-medium">Productos</Link>
          {displayCategory && (
            <>
              <ChevronRight className="w-3.5 h-3.5" />
              <Link href={`/categoria/${displayCategory.slug}`} className="hover:text-primary-600 transition-colors font-medium">
                {displayCategory.name}
              </Link>
            </>
          )}
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-gray-700 font-medium truncate max-w-[200px]">{product.name}</span>
        </nav>

        {/* ===== MAIN GRID: Gallery + Info ===== */}
        <div className="grid lg:grid-cols-12 gap-6 lg:gap-10">

          {/* LEFT COLUMN: Gallery (7 cols) - Sticky on desktop */}
          <div className="lg:col-span-7 space-y-4 lg:sticky lg:top-24 lg:self-start min-w-0">
            {/* Main image */}
            <div
              className="relative aspect-[4/3] bg-surface-50 rounded-2xl overflow-hidden border border-surface-200 group cursor-zoom-in"
              onClick={() => setLightboxOpen(true)}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              {/* Skeleton shimmer while image loads */}
              {!imageLoaded && (
                <div className="absolute inset-0 z-10 bg-surface-100 overflow-hidden">
                  <div className="absolute inset-0 animate-[shimmer_1.4s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
                </div>
              )}
              {product.images[selectedImage] ? (
                <Image
                  src={product.images[selectedImage].src}
                  alt={product.images[selectedImage].alt || product.name}
                  fill
                  className="object-contain p-3 lg:p-4 transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 1024px) 100vw, 58vw"
                  priority
                  onLoad={() => setImageLoaded(true)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-surface-400">
                  <Monitor className="w-24 h-24" />
                </div>
              )}

              {/* Badges top-left */}
              <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
                {discount > 0 && (
                  <span className="bg-gradient-to-r from-red-500 to-rose-600 text-white text-sm font-extrabold px-4 py-1.5 rounded-xl shadow-lg shadow-red-500/25">
                    -{discount}%
                  </span>
                )}
                {product.featured && (
                  <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-lg shadow flex items-center gap-1">
                    <Star className="w-3 h-3 fill-white" /> Destacado
                  </span>
                )}
              </div>

              {/* Image counter */}
              {product.images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full">
                  {selectedImage + 1}/{product.images.length}
                </div>
              )}

              {/* Arrow navigation */}
              {product.images.length > 1 && (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); prevImage(); }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white border border-surface-200"
                    aria-label="Imagen anterior"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-700" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); nextImage(); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white border border-surface-200"
                    aria-label="Imagen siguiente"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-700" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnails strip */}
            {product.images.length > 1 && (
              <div className="overflow-hidden w-full">
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none" style={{ scrollbarWidth: 'none' }}>
                  {product.images.map((img, i) => (
                    <button
                      key={img.id}
                      onClick={() => setSelectedImage(i)}
                      className={cn(
                        'relative w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all',
                        selectedImage === i
                          ? 'border-primary-500 shadow-md shadow-primary-500/20'
                          : 'border-surface-300 hover:border-surface-400'
                      )}
                    >
                    <Image
                      src={img.src}
                      alt={img.alt || `Miniatura ${i + 1}`}
                      fill
                      className="object-contain p-1"
                      sizes="72px"
                    />
                    {selectedImage === i && (
                      <div className="absolute inset-x-0 bottom-0 h-0.5 bg-primary-500" />
                    )}
                  </button>
                ))}
              </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Product Info (5 cols) */}
          <div className="lg:col-span-5 space-y-5 min-w-0">
            {/* Brand */}
            {product.brand && (
              <div className="flex items-center gap-2">
                {product.brand.image ? (
                  <img
                    src={product.brand.image.src}
                    alt={product.brand.name}
                    className="h-6 w-auto object-contain"
                  />
                ) : (
                  <span className="text-xs font-bold text-surface-600 uppercase tracking-widest bg-surface-100 px-3 py-1 rounded-lg">
                    {product.brand.name}
                  </span>
                )}
              </div>
            )}

            {/* Title */}
            <h1 className="text-xl lg:text-2xl font-extrabold text-gray-900 leading-tight">
              {product.name}
            </h1>

            {/* Rating + SKU + Share row */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-3">
                {parseFloat(product.average_rating) > 0 && (
                  <div className="flex items-center gap-1.5">
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={cn('w-4 h-4', i < Math.round(parseFloat(product.average_rating)) ? 'text-amber-500 fill-amber-500' : 'text-surface-400')}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-surface-600">({product.rating_count})</span>
                  </div>
                )}
                {product.sku && (
                  <span className="text-xs text-surface-600">SKU: <span className="font-semibold">{product.sku}</span></span>
                )}
              </div>
              <button
                onClick={handleShare}
                className="flex items-center gap-1.5 text-xs text-surface-600 hover:text-primary-600 transition-colors"
              >
                <Share2 className="w-3.5 h-3.5" />
                Compartir
              </button>
            </div>

            {/* Price block */}
            <div className="bg-surface-50 rounded-2xl p-5 border border-surface-200">
              {price > 0 || product.type !== 'external' ? (
                <>
                  <div className="flex items-baseline gap-3 flex-wrap">
                    <span className="text-3xl lg:text-4xl font-extrabold text-gray-900">
                      {formatPrice(product.price)}
                    </span>
                    {product.on_sale && product.regular_price && (
                      <span className="text-base text-surface-600 line-through">
                        {formatPrice(product.regular_price)}
                      </span>
                    )}
                  </div>
                  {discount > 0 && (
                    <div className="mt-2 inline-flex items-center gap-1.5 text-sm font-bold text-emerald-600 bg-emerald-500/10 px-3 py-1 rounded-lg">
                      <Zap className="w-3.5 h-3.5" />
                      AHORRA {formatPrice(parseFloat(product.regular_price) - parseFloat(product.price))}
                    </div>
                  )}
                  <p className="text-xs text-surface-600 mt-1.5">Precio incluye IVA</p>
                  {/* Installment pricing */}
                  {monthlyPrice > 0 && (
                    <p className="text-sm text-gray-500 mt-2">
                      o <span className="font-bold text-gray-900">{formatPrice(monthlyPrice)}</span>/mes × 12 cuotas sin interés
                    </p>
                  )}
                  {/* Price history chart — professional sparkline */}
                  {price > 0 && (
                    <div className="mt-4 border-t border-surface-200 pt-4 space-y-2">
                      {/* Header row */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-surface-700 uppercase tracking-wide">Historial de precios</span>
                        <span className={cn(
                          'text-[11px] font-extrabold px-2.5 py-1 rounded-full leading-none',
                          sparkline.trend === 'down' ? 'bg-emerald-100 text-emerald-700' :
                          sparkline.trend === 'up' ? 'bg-orange-100 text-orange-700' :
                          'bg-indigo-100 text-indigo-600'
                        )}>
                          {sparkline.trend === 'down' ? `↓ -${sparkline.pct}%` :
                           sparkline.trend === 'up' ? `↑ +${sparkline.pct}%` :
                           '→ Estable'}
                        </span>
                      </div>

                      {/* Chart */}
                      <div className="relative w-full overflow-hidden">
                        <svg
                          width="100%"
                          height="56"
                          viewBox="0 0 200 56"
                          preserveAspectRatio="none"
                          fill="none"
                        >
                          <defs>
                            <linearGradient id={`spk-${product.id}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={sparkline.color} stopOpacity="0.25" />
                              <stop offset="85%" stopColor={sparkline.color} stopOpacity="0" />
                            </linearGradient>
                          </defs>
                          {/* Area fill */}
                          <path d={sparkline.areaPath} fill={`url(#spk-${product.id})`} />
                          {/* Dashed horizontal line at current price */}
                          <line
                            x1="0" y1={sparkline.lastY}
                            x2="200" y2={sparkline.lastY}
                            stroke={sparkline.color}
                            strokeWidth="0.5"
                            strokeDasharray="3 3"
                            opacity="0.4"
                          />
                          {/* Main curve */}
                          <path
                            d={sparkline.linePath}
                            stroke={sparkline.color}
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          {/* Start dot */}
                          <circle cx={sparkline.firstX} cy={sparkline.firstY} r="2.5" fill={sparkline.color} opacity="0.4" />
                          {/* End dot — pulse ring */}
                          <circle cx={sparkline.lastX} cy={sparkline.lastY} r="6" fill={sparkline.color} opacity="0.15" />
                          <circle cx={sparkline.lastX} cy={sparkline.lastY} r="3.5" fill="white" stroke={sparkline.color} strokeWidth="1.5" />
                          <circle cx={sparkline.lastX} cy={sparkline.lastY} r="1.8" fill={sparkline.color} />
                        </svg>
                      </div>

                      {/* Price labels */}
                      <div className="flex items-end justify-between">
                        <div>
                          <p className="text-[10px] text-surface-400 leading-none">hace 30 días</p>
                          <p className={cn(
                            'text-xs font-bold mt-0.5',
                            sparkline.trend === 'down' ? 'text-surface-500 line-through' : 'text-surface-700'
                          )}>{formatPrice(sparkline.firstPrice)}</p>
                        </div>
                        <p className={cn(
                          'text-xs text-center leading-tight max-w-[140px] font-bold',
                          sparkline.trend === 'down' ? 'text-emerald-600' :
                          sparkline.trend === 'up' ? 'text-orange-500' :
                          'text-primary-600'
                        )}>
                          {sparkline.trend === 'down'
                            ? '🔥 ¡Precio bajó! Llévalo ahora'
                            : sparkline.trend === 'up'
                            ? '⚡ ¡Apresúrate antes de que suba más!'
                            : '✅ Precio estable, ¡asegúralo hoy!'}
                        </p>
                        <div className="text-right">
                          <p className="text-[10px] text-surface-400 leading-none">Hoy</p>
                          <p className="text-xs font-extrabold text-gray-900 mt-0.5">{formatPrice(price)}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-baseline gap-3 flex-wrap">
                  <span className="text-2xl font-bold text-gray-900">
                    Producto disponible en tienda asociada
                  </span>
                </div>
              )}
            </div>

            {/* Short description */}
            {shortDescText && (
              <p className="text-sm text-surface-700 leading-relaxed">{shortDescText}</p>
            )}

            {/* Stock indicator */}
            {product.type !== 'external' && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div className={cn('w-2.5 h-2.5 rounded-full', inStock ? 'bg-emerald-500 animate-pulse' : 'bg-red-500')} />
                  <span className={cn('text-sm font-bold', inStock ? 'text-emerald-600' : 'text-red-500')}>
                    {inStock ? 'En stock — Disponible para envío inmediato' : 'Agotado temporalmente'}
                  </span>
                </div>
                {inStock && product.stock_quantity !== null && product.stock_quantity > 0 && product.stock_quantity <= 9 && (
                  <div className="flex items-center gap-2 text-xs font-bold text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 w-fit">
                    <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-ping flex-shrink-0" />
                    ¡Solo quedan {product.stock_quantity} {product.stock_quantity === 1 ? 'unidad' : 'unidades'}!
                  </div>
                )}
              </div>
            )}

            {/* Quantity + Buttons */}
            {product.type === 'external' && product.external_url ? (
              <div className="space-y-3" ref={ctaRef}>
                <a
                  href={product.external_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "w-full flex items-center justify-center gap-2 font-bold text-base py-3.5 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.97]",
                    product.external_url.toLowerCase().includes('mercadolibre') ? "bg-white border border-gray-200 text-gray-800 shadow-sm hover:border-[#FFE600]/50 hover:bg-gray-50" : 
                    product.external_url.toLowerCase().includes('falabella') ? "bg-[#B2D235] text-[#1a1a1a] shadow-[#B2D235]/20 hover:shadow-[#B2D235]/30" :
                    "bg-primary-600 text-white shadow-primary-600/20 hover:shadow-primary-600/30"
                  )}
                >
                  {product.external_url.toLowerCase().includes('mercadolibre') ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src="/mercadolibre-logo.png" alt="MercadoLibre" className="w-5 h-5 flex-shrink-0 rounded" />
                  ) : product.external_url.toLowerCase().includes('falabella') ? (
                    <svg viewBox="0 0 400 400" className="w-5 h-5 flex-shrink-0">
                      <circle cx="200" cy="200" r="190" fill="#B2D235" />
                      <path fill="#1a1a1a" d="M185.3 320V197.6h-34.5v-37.9h34.5v-27.8c0-11 2.3-19.6 6.9-25.7 6.1-8.2 15.8-12.3 29.1-12.3 10.1 0 20.3 1.7 30.5 5.1v38.8c-6.8-2.6-12.8-3.9-18-3.9-9.5 0-14.2 4.9-14.2 14.7v11.1h32.1v37.9h-32.1V320h-34.3z" />
                    </svg>
                  ) : (
                    <ShoppingCart className="w-5 h-5" />
                  )}
                  {product.external_url.toLowerCase().includes('mercadolibre') ? (
                    'Comprar en MercadoLibre'
                  ) : product.external_url.toLowerCase().includes('falabella') ? (
                    'Comprar en Falabella'
                  ) : (
                    product.button_text || 'Comprar en sitio web'
                  )}
                </a>
              </div>
            ) : inStock ? (
              <div className="space-y-3" ref={ctaRef}>
                {/* Quantity selector */}
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-surface-800">Cantidad:</span>
                  <div className="flex items-center border border-surface-300 rounded-xl overflow-hidden bg-surface-100">
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-2.5 hover:bg-surface-200 transition-colors text-surface-800">
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="px-4 font-bold text-base min-w-[40px] text-center text-gray-900">{quantity}</span>
                    <button onClick={() => setQuantity(quantity + 1)} className="p-2.5 hover:bg-surface-200 transition-colors text-surface-800">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* PRIMARY CTA: Comprar Ahora */}
                <button
                  onClick={() => {
                    if (mpEnabled) {
                      setShowQuickCheckout((v) => !v);
                      setQuickStep('form');
                      setQuickError('');
                    } else {
                      handleBuyNow();
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 font-bold text-lg py-4 rounded-xl bg-gradient-to-r from-primary-600 to-blue-600 text-white shadow-xl shadow-primary-600/30 hover:shadow-2xl hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200"
                >
                  <CreditCard className="w-5 h-5" />
                  {showQuickCheckout && mpEnabled ? 'Cerrar formulario' : 'Comprar Ahora'}
                </button>

                {/* Inline quick checkout accordion */}
                {showQuickCheckout && mpEnabled && (
                  <div className="bg-surface-50 border border-surface-200 rounded-2xl p-5 space-y-4">
                    <p className="text-sm font-bold text-gray-900 flex items-center gap-2">
                      <Lock className="w-4 h-4 text-primary-600" />
                      Pago rápido y seguro — sin salir de la página
                    </p>
                    {quickStep === 'form' ? (
                      <form onSubmit={handleQuickCheckout} className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            required
                            placeholder="Nombre *"
                            value={quickForm.first_name}
                            onChange={(e) => setQuickForm({ ...quickForm, first_name: e.target.value })}
                            className="col-span-1 border border-surface-300 rounded-xl px-3 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                          <input
                            required
                            placeholder="Apellido *"
                            value={quickForm.last_name}
                            onChange={(e) => setQuickForm({ ...quickForm, last_name: e.target.value })}
                            className="col-span-1 border border-surface-300 rounded-xl px-3 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                        <input
                          required type="email"
                          placeholder="Correo electrónico *"
                          value={quickForm.email}
                          onChange={(e) => setQuickForm({ ...quickForm, email: e.target.value })}
                          className="w-full border border-surface-300 rounded-xl px-3 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                        <input
                          required type="tel"
                          placeholder="Teléfono (Ej: 3001234567) *"
                          value={quickForm.phone}
                          onChange={(e) => setQuickForm({ ...quickForm, phone: e.target.value })}
                          className="w-full border border-surface-300 rounded-xl px-3 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                        <input
                          required
                          placeholder="Dirección de envío *"
                          value={quickForm.address_1}
                          onChange={(e) => setQuickForm({ ...quickForm, address_1: e.target.value })}
                          className="w-full border border-surface-300 rounded-xl px-3 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            required
                            placeholder="Ciudad *"
                            value={quickForm.city}
                            onChange={(e) => setQuickForm({ ...quickForm, city: e.target.value })}
                            className="border border-surface-300 rounded-xl px-3 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                          <select
                            required
                            value={quickForm.state}
                            onChange={(e) => setQuickForm({ ...quickForm, state: e.target.value })}
                            className="w-full min-w-0 border border-surface-300 rounded-xl px-3 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                          >
                            {colombianDepts.map((d) => (
                              <option key={d} value={d}>{d}</option>
                            ))}
                          </select>
                        </div>
                        {quickError && (
                          <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{quickError}</p>
                        )}
                        <button
                          type="submit"
                          disabled={quickLoading}
                          className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white font-bold py-3.5 rounded-xl hover:bg-primary-700 disabled:opacity-60 transition-colors"
                        >
                          {quickLoading ? (
                            <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Procesando...</>
                          ) : (
                            <><CreditCard className="w-5 h-5" /> Ir al pago con MercadoPago</>
                          )}
                        </button>
                        <p className="text-[10px] text-center text-surface-500">🔒 Tus datos están protegidos con cifrado SSL</p>
                      </form>
                    ) : quickOrderData ? (
                      <div className="space-y-3">
                        <p className="text-xs text-emerald-600 font-bold bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                          ✓ Pedido #{quickOrderData.order_id} creado — completa el pago abajo
                        </p>
                        {quickError && (
                          <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{quickError}</p>
                        )}
                        <PaymentBrickDynamic
                          amount={parseFloat(quickOrderData.total) / 100}
                          orderId={quickOrderData.order_id}
                          orderKey={quickOrderData.order_key}
                          payerEmail={quickForm.email}
                          payerFirstName={quickForm.first_name}
                          payerLastName={quickForm.last_name}
                          onPaymentSuccess={handleQuickPaymentSuccess}
                          onPaymentError={handleQuickPaymentError}
                        />
                      </div>
                    ) : null}
                  </div>
                )}

                {/* SECONDARY CTA: Añadir al Carrito */}
                <button
                  onClick={handleAddToCart}
                  className={cn(
                    'w-full flex items-center justify-center gap-2 font-bold text-base py-3.5 rounded-xl border-2 transition-all duration-300',
                    addedToCart
                      ? 'border-emerald-500 bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                      : 'border-primary-600 text-primary-600 hover:bg-primary-50'
                  )}
                >
                  {addedToCart ? (
                    <><Check className="w-5 h-5" /> ¡Agregado al carrito!</>
                  ) : (
                    <><ShoppingCart className="w-5 h-5" /> Añadir al Carrito</>
                  )}
                </button>

                {/* WhatsApp with contextual text */}
                <a
                  href={`https://wa.me/573132294533?text=${whatsappMsg}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-whatsapp w-full text-sm justify-center overflow-hidden"
                >
                  <MessageCircle className="w-5 h-5 flex-shrink-0" />
                  <span className="truncate min-w-0">{whatsappAdvisorText}</span>
                </a>
              </div>
            ) : null}

            {/* Shipping info banner */}
            {isFull ? (
              <DeliveryBadge categories={product.categories} variant="detail" />
            ) : (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-start gap-3">
                <Truck className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-emerald-600">{deliveryText}</p>
                  <p className="text-xs text-emerald-500/80 mt-0.5">* Solo aplica para ciudades principales. Ciudades secundarias y municipios hasta 5 días.</p>
                </div>
              </div>
            )}

            {/* Trust badges grid */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Shield, label: 'Garantía', sub: '1 Año con Fabricante', color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
                { icon: Lock, label: 'Pago Seguro', sub: '100% Protegido', color: 'text-violet-600', bg: 'bg-violet-500/10' },
                { icon: Headphones, label: 'Soporte 24/7', sub: 'Asistencia técnica', color: 'text-amber-500', bg: 'bg-amber-500/10' },
                { icon: Check, label: 'Factura Electrónica', sub: 'DIAN autorizada', color: 'text-blue-600', bg: 'bg-blue-500/10' },
              ].map((badge) => {
                const Icon = badge.icon;
                return (
                  <div key={badge.label} className="flex items-center gap-3 bg-surface-100 rounded-xl p-3 border border-surface-200">
                    <div className={`w-10 h-10 ${badge.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-5 h-5 ${badge.color}`} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900">{badge.label}</p>
                      <p className="text-[10px] text-surface-600">{badge.sub}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ===== BUNDLE: Llévate también ===== */}
            {relatedProducts.length > 0 && inStock && product.type !== 'external' && (
              <div className="border border-dashed border-primary-300 rounded-2xl p-4 bg-primary-50/50 space-y-3">
                <p className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
                  <Package className="w-4 h-4 text-primary-600" />
                  Clientes que compraron este producto también llevaron:
                </p>
                <div className="space-y-2">
                  {relatedProducts.slice(0, 2).map((rp) => {
                    const rpPrice = parseFloat(rp.price);
                    const isSelected = bundleSelected.has(rp.id);
                    return (
                      <label
                        key={rp.id}
                        className={cn(
                          'flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all',
                          isSelected ? 'border-primary-500 bg-primary-50' : 'border-surface-200 bg-white hover:border-primary-300'
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {
                            setBundleSelected((prev) => {
                              const next = new Set(prev);
                              if (next.has(rp.id)) next.delete(rp.id); else next.add(rp.id);
                              return next;
                            });
                          }}
                          className="w-4 h-4 accent-primary-600 flex-shrink-0"
                        />
                        {rp.images[0] && (
                          <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-surface-100 flex-shrink-0">
                            <Image src={rp.images[0].src} alt={rp.name} fill className="object-contain p-1" sizes="48px" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-gray-900 truncate">{rp.name}</p>
                          <p className="text-xs text-primary-600 font-bold">+ {formatPrice(rpPrice)}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
                {bundleSelected.size > 0 && (
                  <button
                    onClick={() => {
                      for (let i = 0; i < quantity; i++) addItem(product);
                      relatedProducts.slice(0, 2).forEach((rp) => {
                        if (bundleSelected.has(rp.id)) addItem(rp);
                      });
                      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([50, 30, 50]);
                      toast.success('¡Bundle agregado al carrito!', {
                        description: `${bundleSelected.size + 1} productos — ${formatPrice(
                          price * quantity + relatedProducts.slice(0, 2).filter((rp) => bundleSelected.has(rp.id)).reduce((acc, rp) => acc + parseFloat(rp.price), 0)
                        )}`,
                      });
                    }}
                    className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white font-bold py-3 rounded-xl hover:bg-primary-700 transition-colors text-sm shadow-lg shadow-primary-600/25"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Agregar bundle al carrito ({bundleSelected.size + 1} productos)
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ===== IDEAL PARA ===== */}
        {product.short_description && (
          <section className="mt-12 lg:mt-16">
            <div className="bg-gradient-to-br from-primary-600 to-blue-600 rounded-2xl p-6 lg:p-8 text-white">
              <h2 className="text-lg font-extrabold mb-5 flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                IDEAL PARA
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  'Productividad en oficina y gestión de documentos.',
                  'Estudio académico, investigación y clases virtuales.',
                  'Consumo multimedia, streaming y entretenimiento HD.',
                  'Edición de contenido ligera y diseño gráfico básico.',
                ].map((text, i) => {
                  const Icon = idealParaIcons[i];
                  return (
                    <div key={i} className="flex items-start gap-3 bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                      <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-yellow-300" />
                      </div>
                      <p className="text-sm text-white/90 leading-relaxed">{text}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* ===== DESCRIPTION (expandible) ===== */}
        {product.description && (
          <section className="mt-12 lg:mt-16">
            <h2 className="text-xl font-extrabold text-gray-900 mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-primary-600" />
              Descripción del Producto
            </h2>
            <div className="bg-white rounded-2xl border border-surface-200 overflow-hidden">
              <div
                className={cn(
                  'product-description p-6 lg:p-8 transition-all duration-500 overflow-hidden',
                  !descExpanded && 'max-h-[300px] relative'
                )}
              >
                <div dangerouslySetInnerHTML={{ __html: product.description }} />
                {!descExpanded && (
                  <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent pointer-events-none" />
                )}
              </div>
              <button
                onClick={() => setDescExpanded(!descExpanded)}
                className="w-full flex items-center justify-center gap-2 py-4 text-sm font-bold text-primary-600 hover:text-primary-700 hover:bg-gray-50 transition-colors border-t border-surface-200"
              >
                {descExpanded ? (
                  <><ChevronUp className="w-4 h-4" /> Leer menos</>
                ) : (
                  <><ChevronDown className="w-4 h-4" /> Leer más</>
                )}
              </button>
            </div>
          </section>
        )}

        {/* ===== SPECIFICATIONS ===== */}
        {product.attributes.length > 0 && (
          <section className="mt-12 lg:mt-16">
            <h2 className="text-xl font-extrabold text-gray-900 mb-4 flex items-center gap-2">
              <Monitor className="w-5 h-5 text-primary-600" />
              Información Técnica
            </h2>
            <div className="bg-surface-100 rounded-2xl border border-surface-200 overflow-hidden">
              {product.attributes.map((attr, i) => (
                <div
                  key={attr.id}
                  className={cn(
                    'flex items-center py-3.5 px-5 text-sm border-b border-surface-200 last:border-0',
                    i % 2 === 0 ? 'bg-surface-100' : 'bg-surface-200/50'
                  )}
                >
                  <span className="w-2/5 font-bold text-surface-800">{attr.name}</span>
                  <span className="w-3/5 text-surface-700">{attr.options.join(', ')}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ===== RELATED PRODUCTS ===== */}
        {relatedProducts.length > 0 && (
          <section className="mt-12 lg:mt-16 pt-10 border-t border-surface-200">
            <div className="mb-8">
              <span className="inline-flex items-center gap-2 text-xs font-bold text-primary-600 bg-primary-50 px-4 py-1.5 rounded-full mb-3 uppercase tracking-widest">
                <Package className="w-3.5 h-3.5" /> Relacionados
              </span>
              <h2 className="text-2xl font-extrabold text-gray-900">También te puede interesar</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
              {relatedProducts.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* ===== STICKY MOBILE CTA BAR ===== */}
      {(inStock || (product.type === 'external' && product.external_url)) && (
      <div
          className={cn(
            'fixed bottom-[var(--bottom-nav-h)] left-0 right-0 z-50 bg-white/98 backdrop-blur-xl border-t border-surface-200 px-3 py-2.5 transition-transform duration-300 lg:hidden shadow-2xl',
            showStickyBar ? 'translate-y-0' : 'translate-y-full'
          )}
        >
          <div className="flex items-center gap-2 max-w-lg mx-auto">
            {/* Thumbnail — fixed inline size to prevent layout issues on narrow phones */}
            {product.images[0] && (
              <div
                className="relative rounded-xl overflow-hidden bg-surface-100 border border-surface-200 flex-shrink-0"
                style={{ width: 40, height: 40, minWidth: 40 }}
              >
                <Image src={product.images[0].src} alt={product.name} fill className="object-contain p-0.5" sizes="40px" />
              </div>
            )}
            {/* Price info */}
            <div className="flex-1 min-w-0 overflow-hidden">
              {parseFloat(product.average_rating) > 0 && (
                <div className="flex gap-0.5 mb-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={cn('w-2.5 h-2.5', i < Math.round(parseFloat(product.average_rating)) ? 'text-amber-500 fill-amber-500' : 'text-surface-300')} />
                  ))}
                </div>
              )}
              <p className="text-sm font-extrabold text-gray-900 leading-none truncate">
                {price > 0 || product.type !== 'external' ? formatPrice(product.price) : 'En Tienda'}
              </p>
              {discount > 0 && (
                <p className="text-[10px] text-emerald-600 font-bold leading-none mt-0.5 truncate">
                  Ahorras {formatPrice(parseFloat(product.regular_price) - parseFloat(product.price))}
                </p>
              )}
            </div>
            {/* CTAs */}
            {product.type === 'external' && product.external_url ? (
              <a
                href={product.external_url}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  'flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl font-bold text-sm shadow-lg flex-shrink-0 whitespace-nowrap',
                  product.external_url.toLowerCase().includes('mercadolibre') ? 'bg-white border border-gray-200 text-gray-800' :
                  product.external_url.toLowerCase().includes('falabella') ? 'bg-[#B2D235] text-[#1a1a1a]' :
                  'bg-primary-600 text-white'
                )}
              >
                <ShoppingCart className="w-4 h-4" />
                Comprar
              </a>
            ) : (
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  onClick={handleBuyNow}
                  className="flex items-center gap-1.5 bg-gradient-to-r from-primary-600 to-blue-600 text-white px-3.5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-primary-600/25 whitespace-nowrap"
                >
                  <CreditCard className="w-4 h-4" />
                  Comprar
                </button>
                <a
                  href={`https://wa.me/573132294533?text=${whatsappMsg}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#25D366] text-white shadow-lg flex-shrink-0"
                  aria-label="WhatsApp"
                >
                  <MessageCircle className="w-5 h-5" />
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== SHARE MODAL ===== */}
      <ShareModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        productName={product.name}
        productPrice={formatPrice(product.price)}
        productImage={product.images[0]?.src || ''}
        productUrl={`https://tecnophone.co/producto/${product.slug}`}
        discount={discount}
        category={displayCategory?.name || ''}
      />

      {/* ===== IMAGE LIGHTBOX ===== */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-sm flex items-center justify-center"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors z-10"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>

          {product.images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prevImage(); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors z-10"
                aria-label="Anterior"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); nextImage(); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors z-10"
                aria-label="Siguiente"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          <div className="relative w-full h-full max-w-4xl max-h-[85vh] m-8" onClick={(e) => e.stopPropagation()}>
            {product.images[selectedImage] && (
              <Image
                src={product.images[selectedImage].src}
                alt={product.images[selectedImage].alt || product.name}
                fill
                className="object-contain"
                sizes="100vw"
                priority
              />
            )}
          </div>

          {/* Thumbnail strip in lightbox */}
          {product.images.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
              {product.images.map((img, i) => (
                <button
                  key={img.id}
                  onClick={(e) => { e.stopPropagation(); setSelectedImage(i); }}
                  aria-label={`Ver imagen ${i + 1} de ${product.name}`}
                  className={cn(
                    'w-14 h-14 rounded-lg overflow-hidden border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
                    selectedImage === i ? 'border-primary-500' : 'border-white/20 hover:border-white/40'
                  )}
                >
                  <Image src={img.src} alt={`${product.name} — vista ${i + 1}`} width={56} height={56} className="object-contain w-full h-full p-0.5" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
