'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  ShoppingCart,
  ChevronDown,
  Laptop,
  Smartphone,
  Monitor,
  Headphones,
  Gamepad2,
  ShoppingBag,
  Zap,
  User,
  Truck,
  Shield,
  Building2,
} from 'lucide-react';
import { useCartStore } from '@/store/cart';
import { cn } from '@/lib/utils';
import TrackingModal from '@/components/tracking/TrackingModal';
import SearchTrigger from '@/components/home/SearchTrigger';
import InstantSearch, { type InstantSearchHandle } from '@/components/search/InstantSearch';
import LeadNavTrigger from '@/components/lead/LeadNavTrigger';

const categories = [
  { name: 'Portátiles', slug: 'portatiles-2', icon: Laptop, desc: 'HP, Dell, Lenovo y más' },
  { name: 'Celulares', slug: 'celulares', icon: Smartphone, desc: 'Smartphones y accesorios' },
  { name: 'Monitores', slug: 'monitores', icon: Monitor, desc: 'Full HD, 4K y gaming' },
  { name: 'Auriculares', slug: 'auriculares', icon: Headphones, desc: 'Inalámbricos y con cable' },
  { name: 'Gaming', slug: 'gaming', icon: Gamepad2, desc: 'Mouse, teclados y periféricos' },
  { name: 'Accesorios', slug: 'accesorios-tecnologicos-en-colombia', icon: ShoppingBag, desc: 'Mouse, teclados y más' },
  { name: 'Ofertas', slug: 'ofertas', icon: Zap, desc: 'Descuentos especiales' },
];

const navLinks = [
  { href: '/', label: 'Inicio' },
  { href: '/productos', label: 'Productos', hasDropdown: true },
];

export default function Navbar() {
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [trackingOpen, setTrackingOpen] = useState(false);
  const categoriesRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<InstantSearchHandle>(null);
  const totalItems = useCartStore((s) => s.totalItems());
  const openCart = useCartStore((s) => s.openCart);

  useEffect(() => {
    setMounted(true);
    useCartStore.persist.rehydrate();
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (categoriesRef.current && !categoriesRef.current.contains(e.target as Node)) {
        setCategoriesOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cmd+K / Ctrl+K focuses the desktop search bar
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const [promoIndex, setPromoIndex] = useState(0);
  const [promoPaused, setPromoPaused] = useState(false);

  const promos = [
    '🔥 Envío GRATIS en compras desde $500.000',
    '⚡ Hasta 30% OFF en productos seleccionados',
    '🛡️ Garantía extendida en todos los equipos',
    '💳 Hasta 12 cuotas sin interés con MercadoPago',
  ];

  useEffect(() => {
    if (promoPaused) return;
    const interval = setInterval(() => {
      setPromoIndex((i) => (i + 1) % promos.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [promos.length, promoPaused]);

  return (
    <>
      <header className="sticky top-0 z-50">
        {/* Top promo bar — rotating, pauses on hover */}
        <div
          className="bg-primary-600 text-white py-1.5 text-center overflow-hidden"
          style={{ paddingTop: 'calc(env(safe-area-inset-top) + 0.375rem)' }}
          onMouseEnter={() => setPromoPaused(true)}
          onMouseLeave={() => setPromoPaused(false)}
          onFocus={() => setPromoPaused(true)}
          onBlur={() => setPromoPaused(false)}
          role="region"
          aria-label="Promociones destacadas"
          aria-live="polite"
        >
          <div className="container-custom">
            <div className="text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-500">
              {mounted ? promos[promoIndex] : promos[0]}
            </div>
          </div>
        </div>

        {/* Main nav */}
        <nav
          className={cn(
            'border-b border-surface-200 transition-all duration-500',
            scrolled
              ? 'bg-white lg:bg-white/90 backdrop-blur-xl shadow-lg shadow-gray-200/60'
              : 'bg-white lg:bg-white/80 backdrop-blur-md'
          )}
        >
          <div className="container-custom">
            {/* ===== MOBILE HEADER ===== */}
            <div className="lg:hidden flex items-center gap-2.5 py-2.5">
              <Link
                href="/"
                className="flex-shrink-0 rounded-xl active:scale-90 transition-transform duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
                aria-label="Ir al inicio TecnoPhone"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/icons/logo-mobile.webp"
                  alt="TecnoPhone"
                  width={40}
                  height={40}
                  className="w-10 h-10 drop-shadow-sm"
                />
              </Link>
              <div className="flex-1 min-w-0">
                <SearchTrigger />
              </div>
              <LeadNavTrigger variant="mobile" />
              <button
                onClick={openCart}
                className="relative flex-shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-surface-700 hover:text-primary-600 hover:bg-primary-50 active:scale-90 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
                aria-label={`Carrito de compras${mounted && totalItems > 0 ? ` (${totalItems} productos)` : ''}`}
              >
                <ShoppingCart className="w-5 h-5" strokeWidth={2.25} />
                {mounted && totalItems > 0 && (
                  <span className="absolute top-1 right-1 bg-gradient-to-br from-primary-500 to-primary-600 text-white text-[10px] font-black min-w-[20px] h-[20px] rounded-full flex items-center justify-center px-1 shadow-md shadow-primary-500/40 ring-2 ring-white animate-in zoom-in-50 duration-300">
                    {totalItems > 9 ? '9+' : totalItems}
                  </span>
                )}
              </button>
            </div>

            {/* ===== DESKTOP HEADER ===== */}
            <div className="hidden lg:flex items-center justify-between h-[68px] gap-4">
              {/* Logo */}
              <Link href="/" className="flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/icons/logo-desktop.webp"
                  alt="TecnoPhone"
                  width={233}
                  height={80}
                  className="h-14 w-auto"
                />
              </Link>

              {/* Nav links (desktop) */}
              <div className="hidden lg:flex items-center gap-1">
                {navLinks.map((link) => (
                  <div key={link.href} className="relative" ref={link.hasDropdown ? categoriesRef : undefined}>
                    {link.hasDropdown ? (
                      <button
                        onMouseEnter={() => setCategoriesOpen(true)}
                        onClick={() => setCategoriesOpen(!categoriesOpen)}
                        className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-gray-700 hover:text-primary-600 rounded-lg hover:bg-gray-50 transition-all"
                      >
                        {link.label}
                        <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', categoriesOpen && 'rotate-180')} />
                      </button>
                    ) : (
                      <Link
                        href={link.href}
                        className="px-4 py-2 text-sm font-semibold text-gray-700 hover:text-primary-600 rounded-lg hover:bg-gray-50 transition-all"
                      >
                        {link.label}
                      </Link>
                    )}

                    {/* Mega-menu dropdown */}
                    {link.hasDropdown && categoriesOpen && (
                      <div
                        className="absolute top-full left-1/2 -translate-x-1/2 mt-3 bg-white backdrop-blur-xl rounded-2xl shadow-2xl shadow-gray-200/60 py-5 px-5 w-[580px] z-50 animate-fade-in-up border border-surface-200"
                        onMouseLeave={() => setCategoriesOpen(false)}
                      >
                        <div className="grid grid-cols-2 gap-1">
                          {categories.map((cat) => {
                            const Icon = cat.icon;
                            return (
                              <Link
                                key={cat.slug}
                                href={`/categoria/${cat.slug}`}
                                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-700 hover:text-primary-600 hover:bg-gray-50 transition-all group"
                                onClick={() => setCategoriesOpen(false)}
                              >
                                <div className="w-9 h-9 rounded-lg bg-surface-200 group-hover:bg-primary-500/20 flex items-center justify-center transition-colors">
                                  <Icon className="w-4 h-4 text-surface-700 group-hover:text-primary-600 transition-colors" />
                                </div>
                                <div>
                                  <span className="text-sm font-semibold block">{cat.name}</span>
                                  <span className="text-[11px] text-surface-700">{cat.desc}</span>
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                        <div className="mt-3 pt-3 border-t border-surface-200">
                          <Link
                            href="/productos"
                            className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-primary-600 hover:bg-primary-500/10 transition-all"
                            onClick={() => setCategoriesOpen(false)}
                          >
                            Ver todos los productos
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                <Link
                  href="/productos?on_sale=true"
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-amber-600 hover:text-amber-700 rounded-lg hover:bg-amber-50 transition-all"
                >
                  <Zap className="w-3.5 h-3.5" />
                  Ofertas
                </Link>

                <Link
                  href="/empresas"
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-primary-600 hover:text-primary-700 rounded-lg hover:bg-primary-50 transition-all"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  ¿Eres empresa?
                </Link>
              </div>

              {/* Inline search bar (desktop) */}
              <div className="hidden md:block flex-1 max-w-md lg:max-w-xl">
                <InstantSearch ref={searchRef} />
              </div>

              {/* Right actions */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setTrackingOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-full text-gray-500 hover:text-primary-600 hover:bg-gray-100 transition-all text-xs font-semibold"
                  aria-label="Seguir envío"
                >
                  <Truck className="w-4 h-4" />
                  <span>Seguir envío</span>
                </button>

                <a
                  href="https://wa.me/573132294533?text=Hola%2C%20quiero%20gestionar%20la%20garant%C3%ADa%20de%20mi%20producto"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-full text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 transition-all text-xs font-semibold"
                  aria-label="Gestionar garantía"
                >
                  <Shield className="w-4 h-4" />
                  <span>Garantía</span>
                </a>

                <LeadNavTrigger variant="desktop" />

                <button
                  onClick={openCart}
                  className="relative p-2.5 rounded-full text-gray-500 hover:text-primary-600 hover:bg-gray-100 transition-all"
                  aria-label="Carrito de compras"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {mounted && totalItems > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-primary-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-lg shadow-primary-500/40 animate-scale-in">
                      {totalItems > 9 ? '9+' : totalItems}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </nav>
      </header>

      <TrackingModal open={trackingOpen} onClose={() => setTrackingOpen(false)} />
    </>
  );
}
