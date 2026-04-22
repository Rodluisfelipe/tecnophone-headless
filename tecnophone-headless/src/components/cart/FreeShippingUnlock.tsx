'use client';

import { useEffect, useMemo, useState } from 'react';
import { Truck, X } from 'lucide-react';
import { useCartStore } from '@/store/cart';

const CONFETTI_COLORS = [
  '#10b981', // emerald
  '#3b82f6', // primary
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
];

const CONFETTI_COUNT = 28;

interface ConfettiPiece {
  id: number;
  left: number;
  x: number;
  rotate: number;
  delay: number;
  size: number;
  color: string;
  shape: 'square' | 'circle';
}

function makeConfetti(): ConfettiPiece[] {
  return Array.from({ length: CONFETTI_COUNT }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    x: (Math.random() - 0.5) * 200,
    rotate: 360 + Math.random() * 720,
    delay: Math.random() * 250,
    size: 6 + Math.random() * 8,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    shape: Math.random() > 0.5 ? 'square' : 'circle',
  }));
}

export default function FreeShippingUnlock() {
  const show = useCartStore((s) => s.freeShippingCelebration);
  const dismiss = useCartStore((s) => s.dismissFreeShipping);
  const openCart = useCartStore((s) => s.openCart);
  const [closing, setClosing] = useState(false);

  const confetti = useMemo<ConfettiPiece[]>(
    () => (show ? makeConfetti() : []),
    [show]
  );

  useEffect(() => {
    if (!show) {
      setClosing(false);
      return;
    }
    const t1 = window.setTimeout(() => setClosing(true), 3200);
    const t2 = window.setTimeout(() => dismiss(), 3600);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [show, dismiss]);

  if (!show) return null;

  const handleViewCart = () => {
    setClosing(true);
    window.setTimeout(() => {
      dismiss();
      openCart();
    }, 250);
  };

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] flex justify-center"
    >
      {/* Confetti */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[110vh] overflow-hidden">
        {confetti.map((p) => (
          <span
            key={p.id}
            className="fs-confetti-piece absolute block"
            style={{
              left: `${p.left}%`,
              top: '-2vh',
              width: p.size,
              height: p.size,
              backgroundColor: p.color,
              borderRadius: p.shape === 'circle' ? '50%' : '2px',
              animationDelay: `${p.delay}ms`,
              ['--fs-x' as any]: `${p.x}px`,
              ['--fs-r' as any]: `${p.rotate}deg`,
            }}
          />
        ))}
      </div>

      {/* Toast */}
      <div
        role="status"
        className={`pointer-events-auto fixed left-1/2 top-4 sm:top-6 w-[92vw] max-w-md ${
          closing ? 'fs-toast-out' : 'fs-toast'
        }`}
        style={{ transform: 'translate(-50%, 0)' }}
      >
        <div className="relative overflow-hidden rounded-2xl border border-emerald-200 bg-white shadow-2xl shadow-emerald-500/20">
          {/* Top gradient stripe */}
          <div className="h-1 bg-gradient-to-r from-emerald-400 via-emerald-500 to-primary-500" />

          <div className="flex items-start gap-3 p-4 sm:p-5">
            {/* Icon with glow */}
            <div className="fs-glow-pulse relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/40">
              <Truck className="h-6 w-6" strokeWidth={2.5} />
              {/* Animated check overlay */}
              <svg
                viewBox="0 0 24 24"
                className="fs-check absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-white p-0.5 text-emerald-600 shadow"
              >
                <path
                  d="M5 12l4 4 10-10"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">
                🎉 ¡Acabas de desbloquear!
              </p>
              <h3 className="mt-0.5 font-display text-lg font-extrabold leading-tight text-gray-900">
                Envío <span className="text-emerald-600">GRATIS</span>
              </h3>
              <p className="mt-1 text-xs text-surface-700">
                Aplicado automáticamente a tu pedido.{' '}
                <span className="font-semibold text-gray-900">Sin código.</span>
              </p>

              {/* Progress bar full */}
              <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-emerald-100">
                <div className="fs-bar-fill h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600" />
              </div>

              <button
                onClick={handleViewCart}
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-bold text-white transition-all hover:bg-gray-800 hover:-translate-y-0.5"
              >
                Ver carrito
                <span aria-hidden>→</span>
              </button>
            </div>

            <button
              onClick={() => setClosing(true)}
              aria-label="Cerrar notificación"
              className="ml-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-surface-400 transition-colors hover:bg-surface-100 hover:text-gray-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
