'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { X, Minus, Plus, ShoppingBag, Trash2, MessageCircle, ArrowRight, CreditCard, Truck, Shield, Clock } from 'lucide-react';
import { useCartStore } from '@/store/cart';
import { formatPrice } from '@/lib/woocommerce';
import { cn } from '@/lib/utils';
import { toast } from '@/lib/toast';

const SHIPPING_VALUE = 15000; // Valor referencial del envío para mostrar el ahorro

export default function CartDrawer() {
  const { items, isOpen, closeCart, updateQuantity, removeItem, clearCart, totalPrice } =
    useCartStore();
  const [confirmClear, setConfirmClear] = useState(false);

  const total = totalPrice();

  // Calculate savings from sale prices
  const totalSavings = items.reduce((acc, item) => {
    const regular = parseFloat(item.product.regular_price || '0');
    const sale = parseFloat(item.product.price || '0');
    if (regular > sale && sale > 0) return acc + (regular - sale) * item.quantity;
    return acc;
  }, 0);

  // Estimated delivery date (3 business days, envío siempre gratis)
  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + 3);
  const deliveryStr = deliveryDate.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });

  const handleClearCart = () => {
    if (!confirmClear) {
      setConfirmClear(true);
      return;
    }
    clearCart();
    setConfirmClear(false);
    toast.success('Carrito vaciado');
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] transition-all duration-500',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={closeCart}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Carrito de compras"
        className={cn(
          // Mobile: bottom sheet (más alto para aprovechar el espacio vertical)
          'fixed z-[60] bg-white shadow-2xl flex flex-col border-surface-200',
          'inset-x-0 bottom-0 h-[94vh] max-h-[94vh] rounded-t-3xl border-t transition-transform duration-500 ease-out',
          // Desktop: full-height right side panel with rounded left corners
          'lg:inset-y-0 lg:left-auto lg:right-0 lg:h-auto lg:max-h-full lg:w-full lg:max-w-lg lg:rounded-l-3xl lg:rounded-tr-none lg:border-l lg:border-t-0',
          isOpen
            ? 'translate-y-0 lg:translate-x-0'
            : 'translate-y-full lg:translate-y-0 lg:translate-x-full'
        )}
      >
        {/* Mobile drag handle */}
        <div className="flex justify-center pt-3 pb-1 lg:hidden">
          <div className="w-10 h-1 rounded-full bg-surface-300" />
        </div>
        {/* Header */}
        <div className="flex items-center justify-between px-5 lg:px-6 py-3 lg:py-5 border-b border-surface-200">
          <h2 className="text-lg font-extrabold text-gray-900 flex items-center gap-2.5 font-display">
            <div className="w-9 h-9 rounded-xl bg-primary-500 flex items-center justify-center shadow-lg shadow-primary-500/20">
              <ShoppingBag className="w-[18px] h-[18px] text-white" />
            </div>
            Carrito
            {items.length > 0 && (
              <span className="text-xs font-bold bg-primary-50 text-primary-600 px-2.5 py-0.5 rounded-full">
                {items.length}
              </span>
            )}
          </h2>
          <button
            onClick={closeCart}
            className="min-w-[44px] min-h-[44px] p-3 rounded-xl hover:bg-gray-100 transition-all text-gray-500 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            aria-label="Cerrar carrito"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Free shipping always-on banner */}
        {items.length > 0 && (
          <div className="px-5 lg:px-6 py-2 lg:py-3 border-b border-surface-200 bg-gradient-to-r from-emerald-50 to-emerald-50/30">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shadow-sm flex-shrink-0">
                <svg viewBox="0 0 24 24" className="w-3 h-3 text-white">
                  <path d="M5 12l4 4 10-10" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="text-xs font-bold text-emerald-700 truncate">
                Envío <span className="text-emerald-600">GRATIS</span> desbloqueado
              </p>
              <span className="ml-auto text-[10px] font-semibold text-emerald-600 bg-white/80 px-2 py-0.5 rounded-full border border-emerald-200 whitespace-nowrap">
                Ahorras {formatPrice(SHIPPING_VALUE)}
              </span>
            </div>
          </div>
        )}

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-3 lg:px-5 py-2 lg:py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-20 h-20 rounded-3xl bg-surface-100 flex items-center justify-center mb-5">
                <ShoppingBag className="w-10 h-10 text-surface-500" />
              </div>
              <p className="text-lg font-bold text-gray-900">Tu carrito está vacío</p>
              <p className="text-sm text-surface-700 mt-1.5 max-w-[250px]">Explora nuestra tienda y agrega los productos que más te gusten</p>
              <Link
                href="/productos"
                onClick={closeCart}
                className="mt-6 inline-flex items-center gap-2 bg-primary-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-primary-500/25 hover:-translate-y-0.5 transition-all"
              >
                Ver Productos
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <ul className="space-y-2 lg:space-y-3">
              {items.map((item) => {
                const itemPrice = item.variation ? item.variation.price : item.product.price;
                const regularPrice = item.product.regular_price;
                const hasDiscount = regularPrice && parseFloat(regularPrice) > parseFloat(itemPrice) && parseFloat(itemPrice) > 0;

                return (
                <li
                  key={`${item.product.id}-${item.variationId || 0}`}
                  className="flex gap-2.5 lg:gap-4 p-2 lg:p-4 bg-surface-50 rounded-xl lg:rounded-2xl border border-surface-200 hover:border-surface-300 transition-all group"
                >
                  {/* Image */}
                  <Link
                    href={`/producto/${item.product.slug}`}
                    onClick={closeCart}
                    className="relative w-16 h-16 lg:w-24 lg:h-24 rounded-lg lg:rounded-xl overflow-hidden bg-white border border-surface-200 flex-shrink-0 group-hover:border-primary-200 transition-colors"
                  >
                    {item.product.images[0] ? (
                      <Image
                        src={item.product.images[0].src}
                        alt={item.product.images[0].alt || item.product.name}
                        fill
                        className="object-contain p-2"
                        sizes="96px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-surface-400">
                        <ShoppingBag className="w-8 h-8" />
                      </div>
                    )}
                  </Link>

                  {/* Info */}
                  <div className="flex-1 min-w-0 flex flex-col">
                    <Link
                      href={`/producto/${item.product.slug}`}
                      className="text-xs lg:text-sm font-semibold text-gray-900 hover:text-primary-600 line-clamp-2 transition-colors leading-snug"
                      onClick={closeCart}
                    >
                      {item.product.name}
                    </Link>

                    {item.variation && (
                      <p className="text-xs text-surface-600 mt-0.5">
                        {item.variation.attributes
                          .map((a) => `${a.name}: ${a.option}`)
                          .join(', ')}
                      </p>
                    )}

                    {/* Price */}
                    <div className="flex items-baseline gap-2 mt-0.5 lg:mt-1">
                      <span className="text-sm lg:text-base font-extrabold text-primary-600 font-display">
                        {formatPrice(itemPrice)}
                      </span>
                      {hasDiscount && (
                        <span className="text-[10px] lg:text-xs text-surface-500 line-through">
                          {formatPrice(regularPrice)}
                        </span>
                      )}
                    </div>

                    {/* Quantity controls + remove */}
                    <div className="flex items-center gap-1.5 lg:gap-2 mt-auto pt-1.5 lg:pt-2">
                      <div className="flex items-center border border-surface-300 rounded-lg bg-white overflow-hidden shadow-sm">
                        <button
                          onClick={() =>
                            updateQuantity(
                              item.product.id,
                              item.quantity - 1,
                              item.variationId
                            )
                          }
                          className="p-1.5 lg:px-2.5 lg:py-1.5 hover:bg-surface-100 transition-colors text-surface-700"
                          aria-label="Reducir cantidad"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-3 text-sm font-bold min-w-[32px] text-center text-gray-900 tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(
                              item.product.id,
                              item.quantity + 1,
                              item.variationId
                            )
                          }
                          className="p-1.5 lg:px-2.5 lg:py-1.5 hover:bg-surface-100 transition-colors text-surface-700"
                          aria-label="Aumentar cantidad"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Line total on desktop */}
                      <span className="hidden lg:block text-xs text-surface-600 ml-1">
                        = {formatPrice(parseFloat(itemPrice) * item.quantity)}
                      </span>

                      <button
                        onClick={() =>
                          removeItem(item.product.id, item.variationId)
                        }
                        className="p-1.5 text-surface-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all ml-auto"
                        aria-label="Eliminar producto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-surface-200 px-4 lg:px-6 py-3 lg:py-5 pb-[max(env(safe-area-inset-bottom),1.25rem)] lg:pb-5 space-y-2 lg:space-y-3 bg-white">
            {/* Savings banner */}
            {totalSavings > 0 && (
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg lg:rounded-xl px-3 py-1.5 lg:py-2.5">
                <span className="text-emerald-700 text-[11px] lg:text-xs font-bold">🎉 Estás ahorrando {formatPrice(totalSavings)}</span>
              </div>
            )}

            {/* Subtotal & shipping */}
            <div className="space-y-1 lg:space-y-2">
              <div className="flex justify-between items-center text-xs lg:text-sm">
                <span className="text-surface-700">Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} productos)</span>
                <span className="font-semibold text-gray-900">{formatPrice(total)}</span>
              </div>
              <div className="flex justify-between items-center text-xs lg:text-sm">
                <span className="text-surface-700">Envío</span>
                <span className="font-semibold flex items-center gap-1.5">
                  <span className="relative text-surface-400">
                    {formatPrice(SHIPPING_VALUE)}
                    <span className="absolute left-0 right-0 top-1/2 h-[2px] bg-surface-400 rounded-full" />
                  </span>
                  <span className="fs-bounce-in inline-flex items-center gap-1 rounded-md bg-emerald-100 px-1.5 lg:px-2 py-0.5 text-emerald-700 text-[11px] lg:text-xs font-extrabold">
                    GRATIS
                  </span>
                </span>
              </div>
              <div className="h-px bg-surface-200" />
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-900 text-sm lg:text-base">Total</span>
                <span className="text-lg lg:text-2xl font-extrabold text-gray-900 font-display">
                  {formatPrice(total)}
                </span>
              </div>
            </div>

            {/* Delivery estimate */}
            <div className="flex items-center gap-2 text-[11px] lg:text-xs text-surface-600 bg-surface-50 rounded-md lg:rounded-lg px-2.5 py-1.5 lg:px-3 lg:py-2">
              <Clock className="w-3 h-3 lg:w-3.5 lg:h-3.5 text-primary-600 flex-shrink-0" />
              <span>Entrega estimada: <strong className="text-gray-900">{deliveryStr}</strong></span>
            </div>

            {/* Primary CTA - Checkout */}
            <Link
              href="/checkout"
              onClick={closeCart}
              className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white py-3 lg:py-3.5 rounded-xl font-bold text-sm lg:text-base shadow-lg shadow-primary-600/25 hover:bg-primary-700 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all"
            >
              <CreditCard className="w-4 h-4 lg:w-5 lg:h-5" />
              Finalizar Compra
            </Link>

            {/* Secondary CTA - WhatsApp (oculto en mobile para ahorrar espacio) */}
            <a
              href="https://wa.me/573132294533?text=Hola%2C%20quiero%20hacer%20un%20pedido"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:flex w-full items-center justify-center gap-2 border border-surface-200 text-gray-700 py-3 rounded-xl font-medium text-sm hover:bg-gray-50 transition-all"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              Pedir por WhatsApp
            </a>

            {/* Trust signals (solo desktop) */}
            <div className="hidden lg:flex items-center justify-center gap-4 text-[11px] text-surface-500 pt-1">
              <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> Pago seguro</span>
              <span className="flex items-center gap-1"><Truck className="w-3 h-3" /> Envío asegurado</span>
            </div>

            {/* Clear cart with confirmation */}
            <button
              onClick={handleClearCart}
              onBlur={() => setConfirmClear(false)}
              className={cn(
                'w-full text-xs transition-all py-1.5 font-medium rounded-lg',
                confirmClear
                  ? 'text-red-500 bg-red-500/10 border border-red-500/20'
                  : 'text-surface-500 hover:text-red-500'
              )}
            >
              {confirmClear ? '¿Seguro? Toca de nuevo para vaciar' : 'Vaciar carrito'}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
