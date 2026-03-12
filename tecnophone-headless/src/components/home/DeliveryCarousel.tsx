'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Truck, Clock, ChevronRight } from 'lucide-react';
import { WCProduct } from '@/types/woocommerce';
import { formatPrice } from '@/lib/woocommerce';

interface DeliveryCarouselProps {
  products: WCProduct[];
}

export default function DeliveryCarousel({ products }: DeliveryCarouselProps) {
  if (products.length === 0) return null;

  // Tomorrow's date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayName = tomorrow.toLocaleDateString('es-CO', { weekday: 'long' });
  const dayNum = tomorrow.getDate();
  const monthName = tomorrow.toLocaleDateString('es-CO', { month: 'short' });

  return (
    <section className="py-8 lg:py-12 bg-white border-b border-surface-200 overflow-hidden">
      <div className="container-custom">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
              <Truck className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg lg:text-xl font-extrabold text-gray-900">
                  Te llega <span className="text-emerald-500">mañana</span>
                </h2>
                <span className="hidden sm:inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-600 text-[11px] font-bold px-2.5 py-1 rounded-full border border-emerald-500/20">
                  <Clock className="w-3 h-3" />
                  {dayName} {dayNum} {monthName}
                </span>
              </div>
              <p className="text-surface-600 text-xs font-medium mt-0.5">Envío express disponible en estos productos</p>
            </div>
          </div>
          <Link
            href="/productos"
            className="text-primary-600 text-sm font-bold hover:text-primary-500 flex items-center gap-1 flex-shrink-0"
          >
            Ver más <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Carousel — CSS scroll-snap */}
      <div className="pl-4 sm:pl-8 lg:pl-[max(2rem,calc((100vw-1280px)/2+2rem))]">
        <div className="flex gap-3 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-4 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {products.map((product) => {
            const img = product.images?.[0]?.src;
            const hasDiscount = product.on_sale && product.sale_price;

            return (
              <div key={product.id} className="w-[160px] sm:w-[190px] lg:w-[210px] flex-shrink-0 snap-start">
                <Link
                  href={`/producto/${product.slug}`}
                  className="group block bg-surface-100 hover:bg-surface-200 rounded-2xl border border-surface-200 hover:border-primary-500/20 hover:shadow-lg transition-all duration-300 overflow-hidden"
                >
                  {/* Image */}
                  <div className="relative aspect-square bg-surface-200 p-3 flex items-center justify-center">
                    {img ? (
                      <Image
                        src={img}
                        alt={product.name}
                        width={180}
                        height={180}
                        className="object-contain w-full h-full group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-surface-200 rounded-lg" />
                    )}

                    {/* Delivery badge */}
                    <div className="absolute top-2 left-2 flex items-center gap-1 bg-emerald-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                      <Truck className="w-2.5 h-2.5" />
                      Mañana
                    </div>

                    {hasDiscount && (
                      <div className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                        -{Math.round(((parseFloat(product.regular_price) - parseFloat(product.sale_price)) / parseFloat(product.regular_price)) * 100)}%
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-3 pt-2">
                    <p className="text-[11px] text-surface-600 font-medium truncate">
                      {product.categories?.[0]?.name || 'Tecnología'}
                    </p>
                    <h3 className="text-xs font-bold text-gray-900 leading-tight line-clamp-2 mt-0.5 min-h-[2rem]">
                      {product.name}
                    </h3>
                    <div className="mt-2">
                      {hasDiscount ? (
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-sm font-extrabold text-gray-900">{formatPrice(product.sale_price)}</span>
                          <span className="text-[10px] text-surface-600 line-through">{formatPrice(product.regular_price)}</span>
                        </div>
                      ) : (
                        <span className="text-sm font-extrabold text-gray-900">{formatPrice(product.price)}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-1.5 text-emerald-600">
                      <Truck className="w-3 h-3" />
                      <span className="text-[10px] font-semibold">Envío gratis</span>
                    </div>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
