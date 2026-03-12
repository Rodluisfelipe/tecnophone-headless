'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Search,
  ShoppingCart,
  Menu,
  X,
  ChevronDown,
  Laptop,
  Smartphone,
  Tablet,
  Monitor,
  Printer,
  Speaker,
  Headphones,
  Gamepad2,
  Tv,
  Projector,
  ShoppingBag,
  Briefcase,
  Zap,
  User,
  Command,
  Truck,
} from 'lucide-react';
import { useCartStore } from '@/store/cart';
import { cn } from '@/lib/utils';
import CommandSearch from '@/components/search/CommandSearch';
import TrackingModal from '@/components/tracking/TrackingModal';
import SearchTrigger from '@/components/home/SearchTrigger';

const categories = [
  { name: 'Portátiles', slug: 'portatiles', icon: Laptop, desc: 'Laptops y ultrabooks' },
  { name: 'Celulares', slug: 'celulares', icon: Smartphone, desc: 'Smartphones y accesorios' },
  { name: 'Tablets', slug: 'tablets', icon: Tablet, desc: 'iPads y Android tablets' },
  { name: 'Monitores', slug: 'monitores', icon: Monitor, desc: 'Full HD, 4K y gaming' },
  { name: 'Computadores', slug: 'computadores', icon: Monitor, desc: 'All-in-one y torres' },
  { name: 'Impresoras', slug: 'impresoras', icon: Printer, desc: 'Láser e inyección' },
  { name: 'Parlantes', slug: 'parlantes', icon: Speaker, desc: 'Bluetooth y barras' },
  { name: 'Auriculares', slug: 'auriculares', icon: Headphones, desc: 'Over-ear e in-ear' },
  { name: 'Gaming', slug: 'gaming', icon: Gamepad2, desc: 'Periféricos y consolas' },
  { name: 'Televisores', slug: 'televisores', icon: Tv, desc: 'Smart TV y OLED' },
  { name: 'Proyectores', slug: 'proyectores', icon: Projector, desc: 'Home cinema y portátil' },
  { name: 'Accesorios', slug: 'accesorios', icon: ShoppingBag, desc: 'Cables, fundas y más' },
  { name: 'Bolsos y Maletas', slug: 'bolsos-maletas', icon: Briefcase, desc: 'Para tu portátil' },
  { name: 'Ofertas', slug: 'ofertas', icon: ShoppingBag, desc: 'Descuentos especiales' },
];

const navLinks = [
  { href: '/', label: 'Inicio' },
  { href: '/productos', label: 'Productos', hasDropdown: true },
  { href: '/contacto', label: 'Nosotros' },
];

export default function Navbar() {
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [trackingOpen, setTrackingOpen] = useState(false);
  const categoriesRef = useRef<HTMLDivElement>(null);
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

  // Cmd+K / Ctrl+K shortcut
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCmdOpen(true);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const [promoIndex, setPromoIndex] = useState(0);

  const promos = [
    '🔥 Envío GRATIS en compras desde $500.000',
    '⚡ Hasta 30% OFF en productos seleccionados',
    '🛡️ Garantía extendida en todos los equipos',
    '💳 Hasta 12 cuotas sin interés con MercadoPago',
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setPromoIndex((i) => (i + 1) % promos.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [promos.length]);

  return (
    <>
      <header className="sticky top-0 z-50">
        {/* Top promo bar — rotating */}
        <div className="bg-primary-600 text-white py-1.5 text-center overflow-hidden">
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
              ? 'bg-white/90 backdrop-blur-xl shadow-lg shadow-gray-200/60'
              : 'bg-white/80 backdrop-blur-md'
          )}
        >
          <div className="container-custom">
            {/* ===== MOBILE HEADER ===== */}
            <div className="lg:hidden flex items-center gap-2 py-2">
              <Link href="/" className="flex-shrink-0">
                <span className="text-lg font-black tracking-tight font-display">
                  <span className="text-primary-600">T</span>
                  <span className="text-gray-900">p</span>
                </span>
              </Link>
              <div className="flex-1 min-w-0">
                <SearchTrigger />
              </div>
              <button
                onClick={openCart}
                className="relative flex-shrink-0 p-2 rounded-full text-surface-700 active:scale-90 transition-transform"
                aria-label="Carrito de compras"
              >
                <ShoppingCart className="w-5 h-5" />
                {mounted && totalItems > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-primary-500 text-white text-[9px] font-black min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-0.5 shadow-sm">
                    {totalItems > 9 ? '9+' : totalItems}
                  </span>
                )}
              </button>
            </div>

            {/* ===== DESKTOP HEADER ===== */}
            <div className="hidden lg:flex items-center justify-between h-[68px] gap-4">
              {/* Logo */}
              <Link href="/" className="flex-shrink-0 group">
                <span className="text-[28px] font-black tracking-tight font-display">
                  <span className="text-primary-600 group-hover:text-primary-500 transition-colors">Tecno</span>
                  <span className="text-gray-900">Phone</span>
                </span>
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
              </div>

              {/* Search trigger (desktop) — opens Cmd+K modal */}
              <button
                onClick={() => setCmdOpen(true)}
                className="hidden md:flex items-center gap-3 flex-1 max-w-sm lg:max-w-md px-4 py-2.5 bg-surface-100 border border-surface-300 rounded-full text-surface-700 text-sm hover:border-surface-400 hover:bg-surface-200 transition-all group"
              >
                <Search className="w-4 h-4" />
                <span className="flex-1 text-left">Buscar productos...</span>
                <kbd className="hidden lg:inline-flex items-center gap-0.5 px-2 py-0.5 bg-surface-200 border border-surface-300 rounded-md text-[10px] font-bold text-surface-700 group-hover:border-surface-400 transition-colors">
                  <Command className="w-3 h-3" />K
                </kbd>
              </button>

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

                <Link
                  href="/contacto"
                  className="p-2.5 rounded-full text-gray-500 hover:text-primary-600 hover:bg-gray-100 transition-all"
                  aria-label="Mi cuenta"
                >
                  <User className="w-5 h-5" />
                </Link>

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

      <CommandSearch open={cmdOpen} onClose={() => setCmdOpen(false)} />
      <TrackingModal open={trackingOpen} onClose={() => setTrackingOpen(false)} />
    </>
  );
}
