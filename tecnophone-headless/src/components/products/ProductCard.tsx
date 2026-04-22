'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, Star, Zap, Check, Truck } from 'lucide-react';
import { WCProduct } from '@/types/woocommerce';
import { formatPrice, calculateDiscount } from '@/lib/woocommerce';
import { useCartStore } from '@/store/cart';
import { cn } from '@/lib/utils';
import DeliveryBadge from './DeliveryBadge';

interface ProductCardProps {
  product: WCProduct;
  index?: number;
}

export default function ProductCard({ product, index = 0 }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem);
  const discount = calculateDiscount(product.regular_price, product.sale_price);
  const hasSecondImage = product.images?.length > 1;
  const [justAdded, setJustAdded] = useState(false);
  const price = parseFloat(product.price);
  const monthlyPrice = price > 0 ? Math.round(price / 12) : 0;
  const isFull = product.categories?.some((c) => c.slug === 'full');
  const displayCategory = product.categories?.find((c) => !['full', 'sin-categorizar', 'uncategorized'].includes(c.slug));

  const handleAddToCart = (e?: React.MouseEvent) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    if (product.stock_status === 'outofstock') return;
    addItem(product);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1800);
  };

  return (
    <article
      className={cn(
        'group relative bg-white rounded-2xl overflow-hidden card-hover border border-surface-200 flex flex-col h-full',
        'animate-fade-in-up opacity-0'
      )}
      style={{ animationDelay: `${index * 60}ms`, animationFillMode: 'forwards' }}
    >   {/* Image Container */}
      <Link href={`/producto/${product.slug}`} className="block relative aspect-square overflow-hidden bg-surface-50">
        {product.images?.[0] ? (
          <>
            {/* Primary image */}
            <Image
              src={product.images[0].src}
              alt={product.images[0].alt || product.name}
              fill
              className={cn(
                'object-contain p-2 sm:p-4 md:p-6 transition-all duration-700 ease-out',
                hasSecondImage
                  ? 'group-hover:opacity-0 group-hover:scale-105'
                  : 'group-hover:scale-110'
              )}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
            {/* Second image on hover */}
            {hasSecondImage && (
              <Image
                src={product.images[1].src}
                alt={product.images[1].alt || product.name}
                fill
                className="object-contain p-2 sm:p-4 md:p-6 opacity-0 group-hover:opacity-100 scale-105 group-hover:scale-100 transition-all duration-700 ease-out"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-surface-500">
            <ShoppingCart className="w-16 h-16" />
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
          {discount > 0 && (
            <span className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-extrabold px-3 py-1.5 rounded-full shadow-lg shadow-red-500/30 flex items-center gap-1">
              <Zap className="w-3 h-3" />
              -{discount}%
            </span>
          )}
          {product.featured && (
            <span className="bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-extrabold px-3 py-1.5 rounded-full shadow-lg shadow-amber-500/30">
              ⭐ Destacado
            </span>
          )}
          {product.stock_status === 'outofstock' && (
            <span className="bg-surface-400/90 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full">
              Agotado
            </span>
          )}
        </div>

        {/* Quick add overlay — desktop only */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden lg:block" />
        <div className="absolute bottom-3 left-3 right-3 hidden lg:flex justify-center opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-300">
          {product.type === 'external' && product.external_url ? (
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.open(product.external_url, '_blank', 'noopener,noreferrer'); }}
              aria-label={product.button_text || 'Comprar producto'}
              className="flex items-center gap-2 bg-primary-600/95 backdrop-blur-sm text-white px-5 py-2.5 rounded-xl shadow-lg hover:bg-primary-700 transition-colors duration-200 border border-primary-500 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary-700"
            >
              <ShoppingCart className="w-4 h-4" />
              {product.button_text || 'Comprar'}
            </button>
          ) : (
            <button
              onClick={handleAddToCart}
              disabled={product.stock_status === 'outofstock'}
              aria-disabled={product.stock_status === 'outofstock'}
              aria-label="Agregar al carrito"
              className="flex items-center gap-2 bg-primary-600/95 backdrop-blur-sm text-white px-5 py-2.5 rounded-xl shadow-lg hover:bg-primary-700 transition-colors duration-200 disabled:opacity-40 border border-primary-500 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary-700"
            >
              <ShoppingCart className="w-4 h-4" />
              Agregar
            </button>
          )}
        </div>
      </Link>

      {/* Info */}
      <div className="p-4 pb-5 flex flex-col flex-1">
        {/* Category tag */}
        <div className="mb-2 h-5">
          {displayCategory && (
            <span className="inline-block text-[11px] font-bold text-primary-600 bg-primary-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              {displayCategory.name}
            </span>
          )}
        </div>

        {/* Name */}
        <h3 className="text-sm font-bold text-gray-900 line-clamp-2 min-h-[2.5rem] group-hover:text-primary-600 transition-colors duration-300 leading-snug">
          {product.name}
        </h3>

        {/* Rating */}
        {parseFloat(product.average_rating) > 0 && (
          <div className="flex items-center gap-1 mt-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={cn(
                  'w-3.5 h-3.5',
                  i < Math.round(parseFloat(product.average_rating))
                    ? 'text-amber-500 fill-amber-500'
                    : 'text-surface-400 fill-surface-400'
                )}
              />
            ))}
            <span className="text-xs text-surface-700 ml-1 font-medium">({product.rating_count})</span>
          </div>
        )}

        {/* Price block */}
        <div className="mt-auto pt-3 space-y-1 min-h-[4rem]">
          {product.on_sale && product.regular_price && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-surface-700 line-through font-medium">
                {formatPrice(product.regular_price)}
              </span>
              {discount > 0 && (
                <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                  AHORRAS {formatPrice(parseFloat(product.regular_price) - parseFloat(product.price))}
                </span>
              )}
            </div>
          )}
          {price > 0 ? (
            <span className="text-xl font-extrabold text-gray-900 font-display tracking-tight">
              {formatPrice(product.price)}
            </span>
          ) : product.type === 'external' ? (
            <span className="text-[13px] font-bold text-gray-500 tracking-tight">Disponible en tienda</span>
          ) : null}
          {/* Installment pricing */}
          {monthlyPrice > 0 && price > 0 && (
            <p className="text-[11px] text-surface-600">
              o desde <span className="text-surface-800 font-semibold">{formatPrice(monthlyPrice)}</span>/mes x 12
            </p>
          )}
          {/* Shipping: full products get dynamic delivery badge, others get "Envío GRATIS" siempre */}
          {isFull ? (
            <DeliveryBadge categories={product.categories} variant="card" />
          ) : (
            <div className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-1.5 py-0.5 w-fit">
              <Truck className="w-3 h-3" />
              <span className="text-[11px] font-bold">Envío GRATIS</span>
            </div>
          )}
        </div>

        {/* Add to cart / External link button */}
        {product.type === 'external' && product.external_url ? (
          <a
            href={product.external_url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "mt-4 w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.97]",
              product.external_url.toLowerCase().includes('mercadolibre') ? "bg-white border text-gray-800 shadow-sm border-gray-200 hover:border-[#FFE600]/50 hover:bg-gray-50" : 
              product.external_url.toLowerCase().includes('falabella') ? "bg-[#B2D235] text-[#1a1a1a] shadow-[#B2D235]/20 hover:shadow-[#B2D235]/30" :
              "bg-primary-600 text-white shadow-primary-600/20 hover:shadow-primary-600/30"
            )}
          >
            {product.external_url.toLowerCase().includes('mercadolibre') ? (
              <Image src="/mercadolibre-logo.png" alt="MercadoLibre" width={20} height={20} className="w-5 h-5 flex-shrink-0 rounded" />
            ) : product.external_url.toLowerCase().includes('falabella') ? (
              <svg viewBox="0 0 400 400" className="w-5 h-5 flex-shrink-0">
                <circle cx="200" cy="200" r="190" fill="#B2D235" />
                <path fill="#1a1a1a" d="M185.3 320V197.6h-34.5v-37.9h34.5v-27.8c0-11 2.3-19.6 6.9-25.7 6.1-8.2 15.8-12.3 29.1-12.3 10.1 0 20.3 1.7 30.5 5.1v38.8c-6.8-2.6-12.8-3.9-18-3.9-9.5 0-14.2 4.9-14.2 14.7v11.1h32.1v37.9h-32.1V320h-34.3z" />
              </svg>
            ) : (
              <ShoppingCart className="w-4 h-4" />
            )}
            {product.external_url.toLowerCase().includes('mercadolibre') ? (
              <span>Comprar en MercadoLibre</span>
            ) : product.external_url.toLowerCase().includes('falabella') ? (
              <>
                <span className="lg:hidden">Falabella</span>
                <span className="hidden lg:inline">Comprar en Falabella</span>
              </>
            ) : (
              <>
                <span className="lg:hidden">{product.button_text || 'Comprar'}</span>
                <span className="hidden lg:inline">{product.button_text || 'Comprar en tienda'}</span>
              </>
            )}
          </a>
        ) : (
          <button
            onClick={handleAddToCart}
            disabled={product.stock_status === 'outofstock'}
            aria-disabled={product.stock_status === 'outofstock'}
            className={cn(
              'mt-4 w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
              product.stock_status === 'outofstock'
                ? 'bg-surface-200 text-surface-600 cursor-not-allowed'
                : justAdded
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                  : 'bg-primary-600 text-white shadow-lg shadow-primary-600/20 hover:shadow-xl hover:shadow-primary-600/30 hover:-translate-y-0.5 active:scale-[0.97]'
            )}
          >
            {justAdded ? (
              <>
                <Check className="w-4 h-4" />
                ¡Agregado!
              </>
            ) : (
              <>
                <ShoppingCart className="w-4 h-4" />
                <span className="lg:hidden">{product.stock_status === 'outofstock' ? 'Agotado' : 'Agregar'}</span>
                <span className="hidden lg:inline">{product.stock_status === 'outofstock' ? 'Agotado' : 'Agregar al Carrito'}</span>
              </>
            )}
          </button>
        )}
      </div>
    </article>
  );
}
