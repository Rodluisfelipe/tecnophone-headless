'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Grid3X3, ShoppingCart, Truck } from 'lucide-react';
import { useCartStore } from '@/store/cart';
import { useChatStore } from '@/store/chat';
import { cn } from '@/lib/utils';
import TrackingModal from '@/components/tracking/TrackingModal';

const tabs = [
  { key: 'home', href: '/', icon: Home, label: 'Inicio' },
  { key: 'categories', href: '/categorias', icon: Grid3X3, label: 'Categorías' },
  { key: 'cart', href: '#cart', icon: ShoppingCart, label: 'Carrito' },
  { key: 'tracking', href: '#tracking', icon: Truck, label: 'Rastrear' },
  { key: 'support', href: '#support', icon: null as unknown as typeof Home, label: 'Tecno IA' },
] as const;

export default function BottomNav() {
  const pathname = usePathname();
  const totalItems = useCartStore((s) => s.totalItems());
  const openCart = useCartStore((s) => s.openCart);
  const isChatOpen = useChatStore((s) => s.isOpen);
  const toggleChat = useChatStore((s) => s.toggleChat);
  const [mounted, setMounted] = useState(false);
  const [trackingOpen, setTrackingOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    useCartStore.persist.rehydrate();
  }, []);

  const isActive = (key: string) => {
    if (key === 'home') return pathname === '/';
    if (key === 'categories') return pathname.startsWith('/categorias') || pathname.startsWith('/productos') || pathname.startsWith('/categoria');
    if (key === 'support') return isChatOpen;
    return false;
  };

  const handleTabClick = (key: string, e: React.MouseEvent) => {
    if (key === 'cart') {
      e.preventDefault();
      openCart();
    } else if (key === 'tracking') {
      e.preventDefault();
      setTrackingOpen(true);
    } else if (key === 'support') {
      e.preventDefault();
      toggleChat();
    }
  };

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white/95 backdrop-blur-xl border-t border-surface-200 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        aria-label="Navegación principal móvil"
      >
        <div className="flex items-end justify-around h-16 max-w-lg mx-auto px-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = isActive(tab.key);
            const isCart = tab.key === 'cart';
            const isAction = tab.key === 'cart' || tab.key === 'tracking' || tab.key === 'support';

            /* ===== CART — elevated circle in center ===== */
            if (isCart) {
              return (
                <button
                  key={tab.key}
                  onClick={(e) => handleTabClick(tab.key, e)}
                  className="flex-1 flex flex-col items-center -mt-5 relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 rounded-xl"
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
            const isSupportTab = tab.key === 'support';
            const content = (
              <div className="flex flex-col items-center gap-0.5 relative pb-1.5">
                <div
                  className={cn(
                    'relative flex items-center justify-center w-10 h-8 rounded-2xl transition-all duration-300',
                    active && 'bg-primary-500/10'
                  )}
                >
                  {isSupportTab ? (
                    <div className="w-[26px] h-[26px] rounded-full flex items-center justify-center bg-gradient-to-br from-primary-400 to-primary-600 shadow-sm shadow-primary-400/40 transition-all duration-200">
                      <svg width="14" height="16" viewBox="0 0 32 38" fill="none">
                        <path d="M16 2C8.268 2 2 8.268 2 16C2 22.5 7.5 28.5 13.5 33.5C14.8 34.6 15.3 35.8 16 36.5C16.7 35.8 17.2 34.6 18.5 33.5C24.5 28.5 30 22.5 30 16C30 8.268 23.732 2 16 2Z" fill="white"/>
                        <ellipse cx="8.5" cy="18" rx="2.5" ry="1.2" fill="#FF8DA1" opacity="0.6"/>
                        <ellipse cx="23.5" cy="18" rx="2.5" ry="1.2" fill="#FF8DA1" opacity="0.6"/>
                        <ellipse cx="11.5" cy="15" rx="2.6" ry="3" fill="#2563eb"/>
                        <circle cx="10.5" cy="13.8" r="0.9" fill="white"/>
                        <ellipse cx="20.5" cy="15" rx="2.6" ry="3" fill="#2563eb"/>
                        <circle cx="19.5" cy="13.8" r="0.9" fill="white"/>
                      </svg>
                    </div>
                  ) : (
                    <Icon
                      className={cn(
                        'w-[22px] h-[22px] transition-colors duration-200',
                        active ? 'text-primary-600' : 'text-gray-400'
                      )}
                      strokeWidth={active ? 2.5 : 1.8}
                    />
                  )}
                </div>
                <span
                  className={cn(
                    'text-[10px] font-semibold transition-colors duration-200',
                    (active || isSupportTab) ? 'text-primary-600' : 'text-gray-400'
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
                  className="flex-1 flex items-center justify-center min-h-[44px] pb-1.5 active:scale-95 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 rounded-xl"
                  aria-label={tab.label}
                >
                  {content}
                </button>
              );
            }

            return (
              <Link
                key={tab.key}
                href={tab.href}
                className="flex-1 flex items-center justify-center min-h-[44px] pb-1.5 active:scale-95 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 rounded-xl"
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
