'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Laptop,
  Smartphone,
  Gamepad2,
  ArrowRight,
  Zap,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { Banner, WCProduct } from '@/types/woocommerce';
import { formatPrice } from '@/lib/woocommerce';

// Fallback slides when no banners from CMS
const fallbackSlides: Banner[] = [
  {
    title: '¡Lo Mejor en Portátiles!',
    subtitle: 'HP, Dell y más. Intel Core, pantallas Full HD. Envío a todo Colombia.',
    highlightText: 'Portátiles',
    badgeText: 'Nuevo',
    ctaText: 'Ver Portátiles',
    ctaLink: '/categoria/portatiles-2',
    gradientFrom: '#3b82f6',
    gradientTo: '#1e40af',
    productImage: '',
    isActive: true,
    sortOrder: 0,
  },
  {
    title: 'Celulares de Última Generación',
    subtitle: 'Motorola y más. Los mejores precios con garantía oficial.',
    highlightText: 'Última Generación',
    badgeText: 'Trending',
    ctaText: 'Ver Celulares',
    ctaLink: '/categoria/celulares',
    gradientFrom: '#2563eb',
    gradientTo: '#3b82f6',
    productImage: '',
    isActive: true,
    sortOrder: 1,
  },
  {
    title: 'Monitores y Gaming',
    subtitle: 'Monitores gamer, mouse y accesorios para tu setup.',
    highlightText: 'Gaming',
    badgeText: 'Ofertas',
    ctaText: 'Ver Gaming',
    ctaLink: '/categoria/gaming',
    gradientFrom: '#3b82f6',
    gradientTo: '#60a5fa',
    productImage: '',
    isActive: true,
    sortOrder: 2,
  },
  {
    title: 'Ofertas Imperdibles 🔥',
    subtitle: 'Descuentos exclusivos en productos seleccionados. ¡Aprovecha!',
    highlightText: 'Imperdibles 🔥',
    badgeText: 'Hot Sale',
    ctaText: 'Ver Ofertas',
    ctaLink: '/categoria/ofertas',
    gradientFrom: '#1e3a8a',
    gradientTo: '#3b82f6',
    productImage: '',
    isActive: true,
    sortOrder: 3,
  },
];

const fallbackIcons: Record<string, typeof Laptop> = {
  '/categoria/portatiles-2': Laptop,
  '/categoria/celulares': Smartphone,
  '/categoria/gaming': Gamepad2,
};

const AUTOPLAY_DELAY = 6000;

interface HeroSliderProps {
  banners?: Banner[];
  featuredProducts?: WCProduct[];
}

export default function HeroSlider({ banners, featuredProducts = [] }: HeroSliderProps) {
  // Memoize the slides array to avoid re-computation on every render
  const slides = useMemo(() => {
    // Build auto-product slides from real products (groups of 3)
    const autoSlides: (Banner & { _products?: WCProduct[] })[] = [];
    const productsWithImage = featuredProducts.filter((p) => p.images?.[0]?.src);
    if (productsWithImage.length >= 2) {
      const group = productsWithImage.slice(0, 3);
      const topCat = group[0]?.categories?.[0]?.name || 'Tecnología';
      autoSlides.push({
        title: `Lo Más Vendido en ${topCat}`,
        subtitle: 'Productos destacados con envío express. ¡Te llegan mañana!',
        highlightText: topCat,
        badgeText: '🔥 Popular',
        ctaText: 'Ver Productos',
        ctaLink: '/productos',
        gradientFrom: '#3b82f6',
        gradientTo: '#1e3a8a',
        productImage: '',
        isActive: true,
        sortOrder: 999,
        _products: group,
      });
    }

    const cmsSlides = banners && banners.length > 0
      ? banners.filter((b) => !b.title.startsWith('SBANNER') && !b.title.startsWith('LBANNER') && !b.title.startsWith('LARGEBANNER'))
      : fallbackSlides;
    return [...cmsSlides, ...autoSlides];
  }, [banners, featuredProducts]);

  // Mobile: only OBANNER (full-image) slides
  const mobileSlides = useMemo(() =>
    slides.filter(s => s.title.startsWith('OBANNER') && !!s.productImage),
    [slides]
  );

  const [activeIndex, setActiveIndex] = useState(0);
  const [mobileIndex, setMobileIndex] = useState(0);
  const progressRef = useRef<HTMLDivElement>(null);
  const mobileProgressRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const autoplayRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Animate progress bar (direct DOM update — no state re-renders)
  const animateProgress = useCallback(() => {
    const elapsed = Date.now() - startTimeRef.current;
    const pct = Math.min((elapsed / AUTOPLAY_DELAY) * 100, 100);
    if (progressRef.current) progressRef.current.style.width = `${pct}%`;
    if (mobileProgressRef.current) mobileProgressRef.current.style.width = `${pct}%`;
    if (pct < 100) {
      rafRef.current = requestAnimationFrame(animateProgress);
    }
  }, []);

  const goToSlide = useCallback((idx: number) => {
    setActiveIndex(idx);
    cancelAnimationFrame(rafRef.current);
    if (progressRef.current) progressRef.current.style.width = '0%';
    if (mobileProgressRef.current) mobileProgressRef.current.style.width = '0%';
    startTimeRef.current = Date.now();
    rafRef.current = requestAnimationFrame(animateProgress);
  }, [animateProgress]);

  // Autoplay timer
  useEffect(() => {
    startTimeRef.current = Date.now();
    rafRef.current = requestAnimationFrame(animateProgress);

    autoplayRef.current = setInterval(() => {
      setActiveIndex(prev => {
        const next = (prev + 1) % slides.length;
        cancelAnimationFrame(rafRef.current);
        if (progressRef.current) progressRef.current.style.width = '0%';
        if (mobileProgressRef.current) mobileProgressRef.current.style.width = '0%';
        startTimeRef.current = Date.now();
        rafRef.current = requestAnimationFrame(animateProgress);
        return next;
      });
    }, AUTOPLAY_DELAY);

    return () => {
      cancelAnimationFrame(rafRef.current);
      if (autoplayRef.current) clearInterval(autoplayRef.current);
    };
  }, [slides.length, animateProgress]);

  // Mobile autoplay (OBANNER-only slider)
  const mobileAutoplayRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (mobileSlides.length <= 1) return;
    mobileAutoplayRef.current = setInterval(() => {
      setMobileIndex(prev => (prev + 1) % mobileSlides.length);
    }, AUTOPLAY_DELAY);
    return () => {
      if (mobileAutoplayRef.current) clearInterval(mobileAutoplayRef.current);
    };
  }, [mobileSlides.length]);

  // Reset autoplay when user manually navigates
  const handleGoToSlide = useCallback((idx: number) => {
    if (autoplayRef.current) clearInterval(autoplayRef.current);
    goToSlide(idx);
    autoplayRef.current = setInterval(() => {
      setActiveIndex(prev => {
        const next = (prev + 1) % slides.length;
        cancelAnimationFrame(rafRef.current);
        if (progressRef.current) progressRef.current.style.width = '0%';
        if (mobileProgressRef.current) mobileProgressRef.current.style.width = '0%';
        startTimeRef.current = Date.now();
        rafRef.current = requestAnimationFrame(animateProgress);
        return next;
      });
    }, AUTOPLAY_DELAY);
  }, [goToSlide, slides.length, animateProgress]);

  const handleNext = useCallback(() => {
    handleGoToSlide((activeIndex + 1) % slides.length);
  }, [activeIndex, slides.length, handleGoToSlide]);

  const handlePrev = useCallback(() => {
    handleGoToSlide((activeIndex - 1 + slides.length) % slides.length);
  }, [activeIndex, slides.length, handleGoToSlide]);

  // Guard activeIndex within bounds
  const safeIndex = slides.length > 0 ? activeIndex % slides.length : 0;

  // Touch swipe support
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(() => {
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0) handleNext();
      else handlePrev();
    }
  }, [handleNext, handlePrev]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  }, []);

  // Mobile swipe (OBANNER slider)
  const mobileTouchStartX = useRef(0);
  const mobileTouchEndX = useRef(0);
  const handleMobileTouchStart = useCallback((e: React.TouchEvent) => {
    mobileTouchStartX.current = e.touches[0].clientX;
  }, []);
  const handleMobileTouchMove = useCallback((e: React.TouchEvent) => {
    mobileTouchEndX.current = e.touches[0].clientX;
  }, []);
  const handleMobileTouchEnd = useCallback(() => {
    const diff = mobileTouchStartX.current - mobileTouchEndX.current;
    if (Math.abs(diff) > 50) {
      if (mobileAutoplayRef.current) clearInterval(mobileAutoplayRef.current);
      setMobileIndex(prev =>
        diff > 0 ? (prev + 1) % mobileSlides.length : (prev - 1 + mobileSlides.length) % mobileSlides.length
      );
      mobileAutoplayRef.current = setInterval(() => {
        setMobileIndex(prev => (prev + 1) % mobileSlides.length);
      }, AUTOPLAY_DELAY);
    }
  }, [mobileSlides.length]);

  const safeMobileIndex = mobileSlides.length > 0 ? mobileIndex % mobileSlides.length : 0;

  return (
    <section className="relative group" aria-roledescription="carrusel" aria-label="Banner principal">
      {/* ═══ MOBILE: Full-image banners only (OBANNER) ═══ */}
      {mobileSlides.length > 0 && (
        <div
          className="lg:hidden relative w-full overflow-hidden h-[220px]"
          onTouchStart={handleMobileTouchStart}
          onTouchMove={handleMobileTouchMove}
          onTouchEnd={handleMobileTouchEnd}
        >
          {mobileSlides.map((slide, i) => (
            <div
              key={i}
              className="absolute inset-0 w-full transition-opacity duration-700 ease-in-out"
              style={{
                opacity: safeMobileIndex === i ? 1 : 0,
                zIndex: safeMobileIndex === i ? 10 : 0,
                pointerEvents: safeMobileIndex === i ? 'auto' : 'none',
                background: `linear-gradient(135deg, ${slide.gradientFrom} 0%, ${slide.gradientTo} 100%)`,
              }}
            >
              <Link href={slide.ctaLink} className="block w-full h-[220px] relative">
                <Image
                  src={slide.productImage}
                  alt={slide.title.replace('OBANNER', '').trim() || 'Banner'}
                  fill
                  className="object-contain object-center"
                  priority={i === 0}
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </Link>
            </div>
          ))}
          {mobileSlides.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5">
              {mobileSlides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    if (mobileAutoplayRef.current) clearInterval(mobileAutoplayRef.current);
                    setMobileIndex(idx);
                    mobileAutoplayRef.current = setInterval(() => {
                      setMobileIndex(prev => (prev + 1) % mobileSlides.length);
                    }, AUTOPLAY_DELAY);
                  }}
                  className={`transition-all duration-300 rounded-full min-h-0 ${
                    idx === safeMobileIndex ? 'w-6 h-2 bg-white' : 'w-2 h-2 bg-white/40'
                  }`}
                  aria-label={`Ir al banner ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══ DESKTOP: all slides ═══ */}
      <div className="hidden lg:block relative">
      <div
        className="relative w-full overflow-hidden h-[480px]"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {slides.map((slide, i) => {
          const FallbackIcon = fallbackIcons[slide.ctaLink] || Zap;
          const hasImage = !!slide.productImage;
          const isFullBanner = slide.title.startsWith('OBANNER');
          const autoProducts = (slide as Banner & { _products?: WCProduct[] })._products;
          const titleWithoutHighlight = slide.highlightText
            ? slide.title.replace(slide.highlightText, '').trim()
            : slide.title;

          return (
            <div
              key={i}
              className="absolute inset-0 w-full transition-opacity duration-700 ease-in-out"
              style={{ opacity: safeIndex === i ? 1 : 0, zIndex: safeIndex === i ? 10 : 0, pointerEvents: safeIndex === i ? 'auto' : 'none' }}
            >
              <div
                className="relative overflow-hidden w-full h-[380px] sm:h-[400px] lg:h-[480px]"
                style={{
                  background: `linear-gradient(135deg, ${slide.gradientFrom} 0%, ${slide.gradientTo} 60%, ${slide.gradientFrom}dd 100%)`,
                }}
              >
                {autoProducts && autoProducts.length > 0 ? (
                  /* ════ AUTO PRODUCT SLIDE: 2-3 productos con fondo generado ════ */
                  <>


                    <div className="relative z-10 flex items-center h-[380px] sm:h-[400px] lg:h-[480px] px-6 sm:px-10 lg:px-14 max-w-[1340px] mx-auto">
                      <div className="grid lg:grid-cols-12 gap-4 lg:gap-6 items-center w-full">
                        {/* LEFT: Texto auto-generado (4 cols) */}
                        <div className="lg:col-span-4 space-y-3 lg:space-y-4 py-6 lg:py-8">
                          <div className="hero-animate hero-animate-delay-1">
                            <span className="inline-flex items-center gap-1.5 bg-yellow-400/20 backdrop-blur-md text-yellow-300 text-[11px] sm:text-xs font-bold px-3 py-1.5 rounded-full border border-yellow-400/30">
                              {slide.badgeText}
                            </span>
                          </div>

                          <div className="hero-animate hero-animate-delay-2">
                            <p className="text-2xl sm:text-3xl lg:text-[2.6rem] lg:leading-[1.08] font-black text-white font-display tracking-tight" role="heading" aria-level={2}>
                              {titleWithoutHighlight}
                              {titleWithoutHighlight && <br />}
                              <span className="text-yellow-300">{slide.highlightText}</span>
                            </p>
                          </div>

                          <div className="hero-animate hero-animate-delay-3">
                            <p className="text-white/70 text-xs sm:text-sm lg:text-[15px] max-w-sm leading-relaxed">
                              {slide.subtitle}
                            </p>
                          </div>

                          <div className="hero-animate hero-animate-delay-4 flex items-center gap-3 pt-1">
                            <Link
                              href={slide.ctaLink}
                              className="inline-flex items-center gap-2.5 bg-white text-gray-900 pl-5 pr-4 py-2.5 sm:py-3 rounded-full font-extrabold text-xs sm:text-sm shadow-2xl shadow-black/15 hover:scale-[1.03] transition-all duration-300 group/btn"
                            >
                              {slide.ctaText}
                              <span className="w-7 h-7 rounded-full bg-primary-500 flex items-center justify-center group-hover/btn:translate-x-0.5 transition-transform">
                                <ArrowRight className="w-3.5 h-3.5 text-white" />
                              </span>
                            </Link>
                          </div>
                        </div>

                        {/* RIGHT: 2-3 productos flotando (8 cols) */}
                        <div className="lg:col-span-8 flex items-center justify-center relative h-[340px] sm:h-[380px] lg:h-[500px]">
                          {autoProducts.map((prod, pi) => {
                            const img = prod.images?.[0]?.src;
                            if (!img) return null;
                            const positions = autoProducts.length === 3
                              ? [
                                  { className: 'left-[5%] bottom-[10%] w-[42%] z-10 -rotate-3', delay: 'hero-animate-delay-2' },
                                  { className: 'left-[30%] top-[2%] w-[44%] z-20 rotate-1', delay: 'hero-animate-delay-3' },
                                  { className: 'right-[2%] bottom-[8%] w-[40%] z-10 rotate-3', delay: 'hero-animate-delay-4' },
                                ]
                              : [
                                  { className: 'left-[8%] bottom-[8%] w-[48%] z-10 -rotate-2', delay: 'hero-animate-delay-2' },
                                  { className: 'right-[5%] top-[5%] w-[48%] z-20 rotate-2', delay: 'hero-animate-delay-3' },
                                ];
                            const pos = positions[pi];
                            if (!pos) return null;

                            return (
                              <Link
                                key={prod.id}
                                href={`/producto/${prod.slug}`}
                                className={`absolute ${pos.className} hero-animate ${pos.delay} group/prod`}
                              >
                                <div className="relative bg-white/10 backdrop-blur-sm rounded-2xl p-3 sm:p-4 border border-white/15 hover:border-white/30 hover:bg-white/15 transition-all duration-300 shadow-xl">
                                  <div className="relative aspect-square flex items-center justify-center">
                                    <Image
                                      src={img}
                                      alt={prod.name}
                                      width={280}
                                      height={280}
                                      className="object-contain w-full h-full drop-shadow-[0_10px_30px_rgba(0,0,0,0.3)] group-hover/prod:scale-105 transition-transform duration-300"
                                    />
                                  </div>
                                  {/* Price tag */}
                                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm border border-surface-200 rounded-lg px-3 py-1 shadow-xl whitespace-nowrap">
                                    {prod.on_sale && prod.sale_price ? (
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-xs font-extrabold text-gray-900">{formatPrice(prod.sale_price)}</span>
                                        <span className="text-[9px] text-surface-600 line-through">{formatPrice(prod.regular_price)}</span>
                                      </div>
                                    ) : (
                                      <span className="text-xs font-extrabold text-gray-900">{formatPrice(prod.price)}</span>
                                    )}
                                  </div>
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </>
                ) : isFullBanner && hasImage ? (
                  /* ════ OBANNER: imagen = todo el contenido, sin recorte ════ */
                  <Link href={slide.ctaLink} className="block w-full h-[380px] sm:h-[400px] lg:h-[480px] relative">
                    <Image
                      src={slide.productImage}
                      alt={slide.title.replace('OBANNER', '').trim() || 'Banner'}
                      fill
                      className="object-contain object-center"
                      priority={i === 0}
                      sizes="(max-width: 1024px) 100vw, 50vw"
                    />
                  </Link>
                ) : (
                  /* ════ MODO NORMAL: texto + imagen de producto ════ */
                  <>


                    {/* ── Content: compact layout, image-first ── */}
                    <div className="relative z-10 flex items-center h-[380px] sm:h-[400px] lg:h-[480px] px-6 sm:px-10 lg:px-14 max-w-[1340px] mx-auto">
                      <div className="grid lg:grid-cols-12 gap-4 lg:gap-6 items-center w-full">

                        {/* LEFT: Text — compact (4 cols) */}
                        <div className="lg:col-span-4 space-y-3 lg:space-y-4 py-6 lg:py-8">
                          {/* Badge */}
                          {slide.badgeText && (
                            <div className="hero-animate hero-animate-delay-1">
                              <span className="inline-flex items-center gap-1.5 bg-white/[0.14] backdrop-blur-md text-white text-[11px] sm:text-xs font-bold px-3 py-1.5 rounded-full border border-white/20">
                                <span className="w-4 h-4 rounded-full bg-yellow-400 flex items-center justify-center">
                                  <Sparkles className="w-2.5 h-2.5 text-yellow-800" />
                                </span>
                                {slide.badgeText}
                              </span>
                            </div>
                          )}

                          {/* Title */}
                          <div className="hero-animate hero-animate-delay-2">
                            <p className="text-2xl sm:text-3xl lg:text-[2.6rem] lg:leading-[1.08] font-black text-white font-display tracking-tight" role="heading" aria-level={2}>
                              {slide.highlightText ? (
                                <>
                                  {titleWithoutHighlight}
                                  {titleWithoutHighlight && <br />}
                                  <span className="relative inline-block">
                                    <span className="relative z-10 text-yellow-300">{slide.highlightText}</span>
                                    <span className="absolute bottom-0 left-0 right-0 h-2.5 bg-yellow-400/20 rounded-full -z-0" />
                                  </span>
                                </>
                              ) : (
                                slide.title
                              )}
                            </p>
                          </div>

                          {/* Subtitle — 2 lines max */}
                          <div className="hero-animate hero-animate-delay-3">
                            <p className="text-white/70 text-xs sm:text-sm lg:text-[15px] max-w-sm leading-relaxed line-clamp-2">
                              {slide.subtitle}
                            </p>
                          </div>

                          {/* CTA */}
                          <div className="hero-animate hero-animate-delay-4 flex items-center gap-3 pt-1">
                            <Link
                              href={slide.ctaLink}
                              className="inline-flex items-center gap-2.5 bg-white text-gray-900 pl-5 pr-4 py-2.5 sm:py-3 rounded-full font-extrabold text-xs sm:text-sm shadow-2xl shadow-black/15 hover:scale-[1.03] transition-all duration-300 group/btn"
                            >
                              {slide.ctaText}
                              <span className="w-7 h-7 rounded-full bg-primary-500 flex items-center justify-center group-hover/btn:translate-x-0.5 transition-transform">
                                <ArrowRight className="w-3.5 h-3.5 text-white" />
                              </span>
                            </Link>
                            <Link
                              href="/productos"
                              className="text-white/70 text-xs font-semibold hover:text-white border-b border-white/25 hover:border-white pb-0.5 transition-all hidden sm:inline"
                            >
                              Ver todo
                            </Link>
                          </div>
                        </div>

                        {/* RIGHT: Product image — HERO (8 cols) */}
                        <div className="lg:col-span-8 flex justify-center items-center relative">
                          {hasImage ? (
                            <div className="relative w-full h-[340px] sm:h-[380px] lg:h-[500px] hero-animate hero-animate-delay-2">


                              {/* Product image — fills most of the space */}
                              <div className="relative w-full h-full flex items-center justify-center hero-float">
                                <Image
                                  src={slide.productImage}
                                  alt={slide.title}
                                  width={600}
                                  height={600}
                                  className="relative z-10 object-contain drop-shadow-[0_25px_60px_rgba(0,0,0,0.35)] max-h-full max-w-full w-auto h-[90%]"
                                  priority={i === 0}
                                />
                              </div>

                              {/* Floating reflection shadow */}
                              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[50%] h-5 bg-black/12 rounded-[100%] blur-lg pointer-events-none" />

                              {/* Floating badge card — top-right */}
                              {slide.badgeText && (
                                <div className="absolute top-2 right-0 sm:top-4 sm:right-4 z-20 bg-white/90 backdrop-blur-sm border border-surface-200 rounded-xl px-3 py-2 shadow-2xl shadow-gray-200/60 hero-animate hero-animate-delay-4 hidden sm:block">
                                  <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-lg bg-yellow-400 flex items-center justify-center">
                                      <Zap className="w-3.5 h-3.5 text-yellow-800" />
                                    </div>
                                    <div>
                                      <p className="text-[9px] text-surface-600 font-bold uppercase tracking-wider leading-none">Oferta</p>
                                      <p className="text-xs font-extrabold text-gray-900 leading-tight">{slide.badgeText}</p>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Envío gratis pill — bottom-left */}
                              <div className="absolute bottom-8 left-0 sm:left-2 z-20 bg-white/90 backdrop-blur-sm border border-surface-200 rounded-xl pl-2.5 pr-4 py-2 shadow-lg hero-animate hero-animate-delay-5 hidden md:flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                                  <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                                <div>
                                  <p className="text-[11px] font-extrabold text-gray-900 leading-tight">Envío Gratis</p>
                                  <p className="text-[9px] text-surface-600 font-medium leading-tight">Todo Colombia</p>
                                </div>
                              </div>
                            </div>
                          ) : (
                            /* Fallback icon */
                            <div className="relative w-full h-[320px] sm:h-[360px] lg:h-[460px] hero-animate hero-animate-delay-2 hidden lg:flex items-center justify-center">

                              <div className="relative hero-float">
                                <div className="w-36 h-36 lg:w-44 lg:h-44 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-2xl shadow-black/10 rotate-6">
                                  <FallbackIcon className="w-20 h-20 lg:w-24 lg:h-24 text-white/50" />
                                </div>
                              </div>
                              <div className="absolute top-8 right-16 w-14 h-14 rounded-2xl bg-yellow-400/90 flex items-center justify-center shadow-xl shadow-yellow-400/20 -rotate-12 hero-animate hero-animate-delay-4">
                                <span className="text-yellow-800 font-black text-[9px] text-center leading-tight">
                                  {slide.badgeText || '¡Nuevo!'}
                                </span>
                              </div>
                              <div className="absolute bottom-14 left-12 w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center hero-animate hero-animate-delay-5">
                                <Sparkles className="w-4 h-4 text-white/70" />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* ── Bottom progress bar removed — shared bar outside slides ── */}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Desktop progress bar ── */}
      <div className="absolute bottom-0 left-0 right-0 z-30 pointer-events-none">
        <div className="h-[3px] bg-white/10">
          <div ref={progressRef} className="h-full bg-white/60 transition-none" style={{ width: '0%' }} />
        </div>
      </div>

      {/* ── Slide dots ── */}
      <div className="absolute bottom-4 left-10 z-30 flex items-center gap-3">
        <span className="text-white/90 font-mono text-xs font-bold tracking-wider">
          <span className="text-white text-base">{String(safeIndex + 1).padStart(2, '0')}</span>
          <span className="text-white/40 mx-0.5">/</span>
          <span className="text-white/40 text-xs">{String(slides.length).padStart(2, '0')}</span>
        </span>
        <div className="flex items-center gap-1">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => handleGoToSlide(idx)}
              className={`transition-all duration-300 rounded-full min-h-0 ${
                idx === safeIndex
                  ? 'w-6 h-1.5 bg-white'
                  : 'w-1.5 h-1.5 bg-white/30 hover:bg-white/50'
              }`}
              aria-label={`Ir al slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>

      {/* ── Navigation arrows ── */}
      <div className="absolute bottom-3 right-10 z-30 flex items-center gap-1.5">
        <button onClick={handlePrev} aria-label="Slide anterior" className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white flex items-center justify-center hover:bg-white/20 transition-all active:scale-90">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button onClick={handleNext} aria-label="Siguiente slide" className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white flex items-center justify-center hover:bg-white/20 transition-all active:scale-90">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      </div> {/* end desktop wrapper */}
    </section>
  );
}
