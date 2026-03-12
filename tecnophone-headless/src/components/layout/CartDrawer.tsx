'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { X, Minus, Plus, ShoppingBag, Trash2, MessageCircle, ArrowRight, CreditCard, Truck, Shield, Clock } from 'lucide-react';
import { useCartStore } from '@/store/cart';
import { formatPrice } from '@/lib/woocommerce';
import { cn } from '@/lib/utils';
import { toast } from '@/lib/toast';

const FREE_SHIPPING_THRESHOLD = 500000; // $500.000 COP

export default function CartDrawer() {
  const { items, isOpen, closeCart, updateQuantity, removeItem, clearCart, totalPrice } =
    useCartStore();
  const [confirmClear, setConfirmClear] = useState(false);

  const total = totalPrice();
  const shippingProgress = Math.min((total / FREE_SHIPPING_THRESHOLD) * 100, 100);
  const remaining = FREE_SHIPPING_THRESHOLD - total;

  // Calculate savings from sale prices
  const totalSavings = items.reduce((acc, item) => {
    const regular = parseFloat(item.product.regular_price || '0');
    const sale = parseFloat(item.product.price || '0');
    if (regular > sale && sale > 0) return acc + (regular - sale) * item.quantity;
    return acc;
  }, 0);

  // Estimated delivery date (3-5 business days)
  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + (total >= FREE_SHIPPING_THRESHOLD ? 3 : 5));
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
          'fixed inset-0 bg-black/70 backdrop-blur-sm z-50 transition-all duration-500',
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
          // Mobile: bottom sheet
          'fixed z-50 bg-white shadow-2xl flex flex-col border-surface-200',
          'inset-x-0 bottom-0 max-h-[85vh] rounded-t-3xl border-t transition-transform duration-500 ease-out',
          // Desktop: side drawer
          'lg:inset-y-0 lg:left-auto lg:right-0 lg:bottom-auto lg:max-h-full lg:w-full lg:max-w-md lg:rounded-none lg:border-l lg:border-t-0',
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
        <div className="flex items-center justify-between px-6 py-5 border-b border-surface-200">
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
            className="p-2.5 rounded-xl hover:bg-gray-100 transition-all text-gray-400 hover:text-gray-700"
            aria-label="Cerrar carrito"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Shipping progress bar */}
        {items.length > 0 && (
          <div className="px-6 py-3 border-b border-surface-200">
            {remaining > 0 ? (
              <p className="text-xs text-surface-800 mb-2">
                <Truck className="w-3.5 h-3.5 inline mr-1 text-emerald-600" />
                Te faltan <span className="font-bold text-emerald-600">{formatPrice(remaining)}</span> para envío gratis
              </p>
            ) : (
              <p className="text-xs text-emerald-600 font-bold mb-2">
                <Truck className="w-3.5 h-3.5 inline mr-1" />
                ¡Envío gratis desbloqueado!
              </p>
            )}
            <div className="h-1.5 bg-surface-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary-500 to-emerald-500 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${shippingProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
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
            <ul className="space-y-3">
              {items.map((item) => (
                <li
                  key={`${item.product.id}-${item.variationId || 0}`}
                  className="flex gap-4 p-3 bg-surface-100 rounded-2xl border border-surface-200 hover:border-surface-300 transition-all"
                >
                  {/* Image */}
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-surface-200 flex-shrink-0">
                    {item.product.images[0] ? (
                      <Image
                        src={item.product.images[0].src}
                        alt={item.product.images[0].alt || item.product.name}
                        fill
                        className="object-contain p-1.5"
                        sizes="80px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-surface-500">
                        <ShoppingBag className="w-8 h-8" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/producto/${item.product.slug}`}
                      className="text-sm font-semibold text-gray-900 hover:text-primary-600 line-clamp-2 transition-colors"
                      onClick={closeCart}
                    >
                      {item.product.name}
                    </Link>

                    {item.variation && (
                      <p className="text-xs text-surface-700 mt-0.5">
                        {item.variation.attributes
                          .map((a) => `${a.name}: ${a.option}`)
                          .join(', ')}
                      </p>
                    )}

                    <p className="text-sm font-extrabold text-primary-600 mt-1 font-display">
                      {formatPrice(
                        item.variation ? item.variation.price : item.product.price
                      )}
                    </p>

                    {/* Quantity controls */}
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center border border-surface-300 rounded-xl bg-surface-200 overflow-hidden">
                        <button
                          onClick={() =>
                            updateQuantity(
                              item.product.id,
                              item.quantity - 1,
                              item.variationId
                            )
                          }
                          className="p-1.5 hover:bg-surface-400 transition-colors text-surface-800"
                          aria-label="Reducir cantidad"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-3 text-sm font-bold min-w-[32px] text-center text-gray-900">
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
                          className="p-1.5 hover:bg-surface-400 transition-colors text-surface-800"
                          aria-label="Aumentar cantidad"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        onClick={() =>
                          removeItem(item.product.id, item.variationId)
                        }
                        className="p-1.5 text-surface-600 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all ml-auto"
                        aria-label="Eliminar producto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-surface-200 px-5 py-5 space-y-3 bg-surface-50">
            {/* Savings banner */}
            {totalSavings > 0 && (
              <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2">
                <span className="text-emerald-600 text-xs font-bold">🎉 Estás ahorrando {formatPrice(totalSavings)}</span>
              </div>
            )}

            <div className="flex justify-between items-center">
              <span className="font-semibold text-surface-800">Total:</span>
              <span className="text-2xl font-extrabold text-gray-900 font-display">
                {formatPrice(total)}
              </span>
            </div>

            {/* Delivery estimate */}
            <div className="flex items-center gap-2 text-xs text-surface-700">
              <Clock className="w-3.5 h-3.5 text-primary-600" />
              <span>Entrega estimada: <strong className="text-gray-900">{deliveryStr}</strong></span>
            </div>

            {/* Primary CTA - Checkout */}
            <Link
              href="/checkout"
              onClick={closeCart}
              className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white py-3.5 rounded-xl font-bold text-base shadow-lg shadow-primary-600/25 hover:shadow-xl hover:-translate-y-0.5 transition-all"
            >
              <CreditCard className="w-5 h-5" />
              Finalizar Compra
            </Link>

            {/* Secondary CTA - WhatsApp */}
            <a
              href="https://wa.me/573132294533?text=Hola%2C%20quiero%20hacer%20un%20pedido"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 border border-surface-200 text-gray-700 py-3 rounded-xl font-medium text-sm hover:bg-gray-50 transition-all"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              Pedir por WhatsApp
            </a>

            {/* Trust signals */}
            <div className="flex items-center justify-center gap-3 text-[10px] text-surface-600">
              <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> Pago seguro</span>
              <span>·</span>
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
                  : 'text-surface-600 hover:text-red-500'
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
