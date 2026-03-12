'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Grid3X3, ShoppingCart, Truck, MessageCircle } from 'lucide-react';
import { useCartStore } from '@/store/cart';
import { cn } from '@/lib/utils';
import TrackingModal from '@/components/tracking/TrackingModal';

const WHATSAPP_URL = 'https://wa.me/573132294533?text=Hola%2C%20necesito%20soporte';

const tabs = [
  { key: 'home', href: '/', icon: Home, label: 'Inicio' },
  { key: 'categories', href: '/productos', icon: Grid3X3, label: 'Categorías' },
  { key: 'cart', href: '#cart', icon: ShoppingCart, label: 'Carrito' },
  { key: 'tracking', href: '#tracking', icon: Truck, label: 'Rastrear' },
  { key: 'support', href: WHATSAPP_URL, icon: MessageCircle, label: 'Soporte' },
] as const;

export default function BottomNav() {
  const pathname = usePathname();
  const totalItems = useCartStore((s) => s.totalItems());
  const openCart = useCartStore((s) => s.openCart);
  const [mounted, setMounted] = useState(false);
  const [trackingOpen, setTrackingOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    useCartStore.persist.rehydrate();
  }, []);

  const isActive = (key: string) => {
    if (key === 'home') return pathname === '/';
    if (key === 'categories') return pathname.startsWith('/productos') || pathname.startsWith('/categoria');
    return false;
  };

  const handleTabClick = (key: string, e: React.MouseEvent) => {
    if (key === 'cart') {
      e.preventDefault();
      openCart();
    } else if (key === 'tracking') {
      e.preventDefault();
      setTrackingOpen(true);
    }
  };

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white/95 backdrop-blur-xl border-t border-surface-200 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        aria-label="Navegación principal móvil"
      >
        <div className="flex items-end justify-around h-16 max-w-lg mx-auto px-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = isActive(tab.key);
            const isCart = tab.key === 'cart';
            const isAction = tab.key === 'cart' || tab.key === 'tracking';

            /* ===== CART — elevated circle in center ===== */
            if (isCart) {
              return (
                <button
                  key={tab.key}
                  onClick={(e) => handleTabClick(tab.key, e)}
                  className="flex-1 flex flex-col items-center -mt-5 relative"
                  aria-label={tab.label}
                >
                  <div className="relative w-14 h-14 rounded-full bg-primary-600 shadow-lg shadow-primary-600/30 flex items-center justify-center active:scale-90 transition-transform ring-4 ring-white">
                    <ShoppingCart className="w-6 h-6 text-white" strokeWidth={2} />
                    {mounted && totalItems > 0 && (
                      <span className="absolute -top-1 -right-1 bg-white text-primary-600 text-[10px] font-black min-w-[20px] h-5 rounded-full flex items-center justify-center shadow-md border-2 border-primary-500 px-1">
                        {totalItems > 9 ? '9+' : totalItems}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-bold text-primary-600 mt-0.5">
                    {tab.label}
                  </span>
                </button>
              );
            }

            /* ===== Normal tabs ===== */
            const content = (
              <div className="flex flex-col items-center gap-0.5 relative pb-1.5">
                <div
                  className={cn(
                    'relative flex items-center justify-center w-10 h-8 rounded-2xl transition-all duration-300',
                    active && 'bg-primary-500/10'
                  )}
                >
                  <Icon
                    className={cn(
                      'w-[22px] h-[22px] transition-colors duration-200',
                      active ? 'text-primary-600' : 'text-gray-400'
                    )}
                    strokeWidth={active ? 2.5 : 1.8}
                  />
                </div>
                <span
                  className={cn(
                    'text-[10px] font-semibold transition-colors duration-200',
                    active ? 'text-primary-600' : 'text-gray-400'
                  )}
                >
                  {tab.label}
                </span>
              </div>
            );

            if (isAction) {
              return (
                <button
                  key={tab.key}
                  onClick={(e) => handleTabClick(tab.key, e)}
                  className="flex-1 flex items-center justify-center pb-1.5 active:scale-95 transition-transform"
                  aria-label={tab.label}
                >
                  {content}
                </button>
              );
            }

            if (tab.key === 'support') {
              return (
                <a
                  key={tab.key}
                  href={tab.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center pb-1.5 active:scale-95 transition-transform"
                  aria-label={tab.label}
                >
                  {content}
                </a>
              );
            }

            return (
              <Link
                key={tab.key}
                href={tab.href}
                className="flex-1 flex items-center justify-center pb-1.5 active:scale-95 transition-transform"
                aria-label={tab.label}
              >
                {content}
              </Link>
            );
          })}
        </div>
      </nav>

      <TrackingModal open={trackingOpen} onClose={() => setTrackingOpen(false)} />
    </>
  );
}
