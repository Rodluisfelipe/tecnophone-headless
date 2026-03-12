'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, Zap, Check, Truck, Plus } from 'lucide-react';
import { WCProduct } from '@/types/woocommerce';
import { formatPrice, calculateDiscount } from '@/lib/woocommerce';
import { useCartStore } from '@/store/cart';
import { cn } from '@/lib/utils';
import { toast } from '@/lib/toast';

interface ProductCardHorizontalProps {
  product: WCProduct;
  index?: number;
}

const FREE_SHIPPING_THRESHOLD = 500000;

export default function ProductCardHorizontal({ product, index = 0 }: ProductCardHorizontalProps) {
  const addItem = useCartStore((s) => s.addItem);
  const discount = calculateDiscount(product.regular_price, product.sale_price);
  const [justAdded, setJustAdded] = useState(false);
  const price = parseFloat(product.price);
  const hasFreeShipping = price >= FREE_SHIPPING_THRESHOLD;

  const handleAddToCart = (e?: React.MouseEvent) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    if (product.stock_status === 'outofstock') return;
    addItem(product);
    setJustAdded(true);
    toast.success(`${product.name} agregado al carrito`, {
      description: hasFreeShipping ? '🚚 Incluye envío gratis' : undefined,
    });
    setTimeout(() => setJustAdded(false), 1800);
  };

  return (
    <article
      className={cn(
        'group relative bg-white rounded-2xl overflow-hidden card-hover border border-surface-200 flex flex-row h-[140px]',
        'animate-fade-in-up opacity-0'
      )}
      style={{ animationDelay: `${index * 60}ms`, animationFillMode: 'forwards' }}
    >
      {/* Image */}
      <Link href={`/producto/${product.slug}`} className="relative w-[140px] flex-shrink-0 bg-surface-50 overflow-hidden">
        {product.images?.[0] ? (
          <Image
            src={product.images[0].src}
            alt={product.images[0].alt || product.name}
            fill
            className="object-contain p-3"
            sizes="140px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-surface-400">
            <ShoppingCart className="w-10 h-10" />
          </div>
        )}

        {/* Discount badge */}
        {discount > 0 && (
          <span className="absolute top-2 left-2 bg-gradient-to-r from-red-500 to-pink-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow flex items-center gap-0.5 z-10">
            <Zap className="w-2.5 h-2.5" />
            -{discount}%
          </span>
        )}
      </Link>

      {/* Info */}
      <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
        <div>
          {/* Brand */}
          {product.brand && (
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest line-clamp-1">
              {product.brand.name}
            </span>
          )}
          {/* Name */}
          <Link href={`/producto/${product.slug}`}>
            <h3 className="text-[13px] font-bold text-gray-900 line-clamp-2 leading-tight mt-0.5 group-hover:text-primary-600 transition-colors">
              {product.name}
            </h3>
          </Link>
        </div>

        {/* Price + CTA row */}
        <div className="flex items-end justify-between gap-2 mt-auto">
          <div className="min-w-0">
            {product.on_sale && product.regular_price && (
              <span className="text-[11px] text-surface-500 line-through block">
                {formatPrice(product.regular_price)}
              </span>
            )}
            <span className="text-lg font-extrabold text-gray-900 font-display tracking-tight">
              {formatPrice(product.price)}
            </span>
            {hasFreeShipping && (
              <div className="flex items-center gap-1 text-emerald-600 mt-0.5">
                <Truck className="w-3 h-3" />
                <span className="text-[10px] font-semibold">Envío gratis</span>
              </div>
            )}
          </div>

          {/* Add button */}
          {product.stock_status !== 'outofstock' && (
            <button
              onClick={handleAddToCart}
              aria-label="Agregar al carrito"
              className={cn(
                'flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center shadow-md transition-all duration-200 active:scale-90',
                justAdded
                  ? 'bg-emerald-500 text-white'
                  : 'bg-primary-600 text-white'
              )}
            >
              {justAdded ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" strokeWidth={2.5} />}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
