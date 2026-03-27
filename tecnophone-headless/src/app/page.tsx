import Link from 'next/link';
import {
  Laptop,
  Smartphone,
  Monitor,
  Headphones,
  Gamepad2,
  ArrowRight,
  Truck,
  Shield,
  CreditCard,
  MessageCircle,
  Zap,
  BadgeCheck,
  Package,
  Star,
  Plug,
  Tag,
  ShoppingCart,
  Clock,
  Flame,
  Building2,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { getProducts, getBanners, getCategories, getBrands, formatPrice, calculateDiscount } from '@/lib/woocommerce';
import ProductCard from '@/components/products/ProductCard';
import ProductCardHorizontal from '@/components/products/ProductCardHorizontal';
import { Banner, WCCategory } from '@/types/woocommerce';
import Image from 'next/image';

const HeroSlider = dynamic(() => import('@/components/home/HeroSlider'), {
  loading: () => (
    <div className="w-full h-[220px] lg:h-[480px] bg-surface-100 animate-pulse" />
  ),
});

// Fixed ordered categories to display (only categories with real products)
const showCategories = [
  { slug: 'portatiles-2', name: 'Portátiles', icon: Laptop },
  { slug: 'celulares', name: 'Celulares', icon: Smartphone },
  { slug: 'monitores', name: 'Monitores', icon: Monitor },
  { slug: 'auriculares', name: 'Auriculares', icon: Headphones },
  { slug: 'gaming', name: 'Gaming', icon: Gamepad2 },
  { slug: 'accesorios-tecnologicos-en-colombia', name: 'Accesorios', icon: Plug },
  { slug: 'ofertas', name: 'Ofertas', icon: Tag },
];

export const revalidate = 600;


const promoBanners = [
  {
    title: '¡Portátiles desde',
    highlight: '$1.299.000!',
    desc: 'HP, Dell y más. Intel Core i5, 16GB RAM, SSD 512GB.',
    cta: 'Ver Portátiles',
    href: '/categoria/portatiles-2',
    bg: 'from-primary-600 to-primary-500',
    icon: Laptop,
  },
  {
    title: 'Ofertas',
    highlight: 'Imperdibles 🔥',
    desc: 'Los mejores descuentos en tecnología. ¡Aprovecha!',
    cta: 'Ver Ofertas',
    href: '/categoria/ofertas',
    bg: 'from-primary-600 to-blue-700',
    icon: Tag,
  },
  {
    title: 'Accesorios',
    highlight: 'Gaming',
    desc: 'Mouse, auriculares y monitores para gamers.',
    cta: 'Explorar',
    href: '/categoria/gaming',
    bg: 'from-blue-600 to-primary-600',
    icon: Gamepad2,
  },
];

export default async function HomePage() {
  let latestProducts: import('@/types/woocommerce').WCProduct[] = [];
  let saleProducts: import('@/types/woocommerce').WCProduct[] = [];
  let banners: Banner[] = [];
  let categories: WCCategory[] = [];
  let brands: import('@/types/woocommerce').WCBrand[] = [];
  let pddProduct: import('@/types/woocommerce').WCProduct | null = null;

  // Categories to hide from the grid
  const hideSlugs = new Set(['sin-categorizar', 'uncategorized', 'full', 'terminado', 'regalo', 'ofertas']);

  try {
    const [productsResult, saleResult, bannersResult, categoriesResult, brandsResult, pddResult] = await Promise.all([
      getProducts({ per_page: 8, orderby: 'date', order: 'desc' }),
      getProducts({ per_page: 8, on_sale: true }),
      getBanners(),
      getCategories({ hide_empty: false }),
      getBrands(),
      getProducts({ per_page: 1, category_slug: 'pdd' }),
    ]);
    latestProducts = productsResult.products;
    saleProducts = saleResult.products;
    banners = bannersResult;
    categories = categoriesResult;
    brands = brandsResult;
    pddProduct = pddResult.products[0] || null;
  } catch (error) {
    console.error('[HomePage] Error fetching data:', error);
  }

  // Pre-compute secondary banners for strategic placement on mobile
  const sbanners = banners
    .filter((b) => b.title.startsWith('SBANNER') && b.isActive && b.productImage)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .slice(0, 3);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.tecnophone.co';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${siteUrl}/#organization`,
        name: 'TecnoPhone',
        url: siteUrl,
        logo: `${siteUrl}/icons/icon-512.png`,
        contactPoint: {
          '@type': 'ContactPoint',
          telephone: '+57-313-229-4533',
          contactType: 'sales',
          areaServed: 'CO',
          availableLanguage: 'Spanish',
        },
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Chía',
          addressRegion: 'Cundinamarca',
          addressCountry: 'CO',
        },
        sameAs: [
          'https://www.facebook.com/tecnophone.co',
          'https://www.instagram.com/tecnophone.co',
        ],
      },
      {
        '@type': 'WebSite',
        '@id': `${siteUrl}/#website`,
        url: siteUrl,
        name: 'TecnoPhone',
        publisher: { '@id': `${siteUrl}/#organization` },
        potentialAction: {
          '@type': 'SearchAction',
          target: `${siteUrl}/productos?q={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Visually hidden H1 for SEO — page has visual hero slider instead */}
      <h1 className="sr-only">TecnoPhone — Portátiles, Celulares y Accesorios de Tecnología en Colombia al Mejor Precio</h1>

      {/* SEO intro text — visible but compact */}
      <div className="bg-white border-b border-surface-200">
        <div className="px-4 sm:px-6 lg:px-8 max-w-[1550px] mx-auto py-3 lg:py-4">
          <p className="text-xs lg:text-sm text-surface-600 leading-relaxed max-w-3xl">
            Bienvenido a <strong>TecnoPhone</strong>, tu tienda de tecnología en Colombia. Encuentra <strong>portátiles</strong>, <strong>celulares</strong>, monitores, auriculares y <strong>accesorios</strong> de las mejores marcas al mejor precio con envío a todo el país.
          </p>
        </div>
      </div>

      {/* ===== HERO SLIDER ===== */}
      <HeroSlider banners={(() => { const hero = banners.filter(b => !b.title.startsWith('SBANNER') && !b.title.startsWith('LBANNER') && !b.title.startsWith('LARGEBANNER')); return hero.length > 0 ? hero : undefined; })()} featuredProducts={latestProducts.length > 0 ? latestProducts : undefined} />

      {/* ===== TRUST FEATURES BAR ===== */}
      <section className="bg-white lg:bg-surface-100 border-b border-surface-200">
        <div className="px-4 sm:px-6 lg:px-8 max-w-[1550px] mx-auto">
          {/* Mobile: compact grid */}
          <div className="grid grid-cols-5 gap-1 py-3 lg:hidden">
            {[
              { icon: Truck, text: 'Envío nacional' },
              { icon: CreditCard, text: 'Pago seguro' },
              { icon: Package, text: '1-3 días' },
            ].map((feat) => {
              const Icon = feat.icon;
              return (
                <div key={feat.text} className="flex flex-col items-center gap-0.5 text-center">
                  <Icon className="w-4 h-4 text-primary-600" />
                  <span className="text-gray-600 text-[10px] font-semibold leading-tight">{feat.text}</span>
                </div>
              );
            })}
            <a
              href="https://wa.me/573132294533?text=Hola%2C%20quiero%20gestionar%20la%20garant%C3%ADa%20de%20mi%20producto"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-0.5 text-center text-emerald-700"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="text-[10px] font-bold leading-tight">Garantía</span>
            </a>
            <Link
              href="/empresas"
              className="flex flex-col items-center gap-0.5 text-center text-primary-600"
            >
              <Building2 className="w-4 h-4" />
              <span className="text-[10px] font-bold leading-tight">¿Empresa?</span>
            </Link>
          </div>
          {/* Desktop: grid with dividers */}
          <div className="hidden lg:grid grid-cols-4 divide-x divide-surface-200">
            {[
              { icon: Truck, text: 'Envío a todo Colombia' },
              { icon: Shield, text: 'Garantía oficial' },
              { icon: CreditCard, text: 'Pago seguro' },
              { icon: Package, text: 'Entrega 1-3 días' },
            ].map((feat) => {
              const Icon = feat.icon;
              return (
                <div key={feat.text} className="flex items-center justify-center gap-3 py-5">
                  <Icon className="w-5 h-5 text-primary-600 flex-shrink-0" />
                  <span className="text-gray-700 text-sm font-semibold">{feat.text}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== DIAN FACTURA BANNER ===== */}
      <div className="bg-surface-50 border-b border-surface-200">
        {/* Mobile */}
        <div className="px-4 py-2 flex items-center justify-center gap-2.5 lg:hidden">
          <span className="text-[11px] font-semibold text-gray-600">Todos nuestros productos son facturados electrónicamente</span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/dian-logo.png" alt="DIAN" width={60} height={10} className="h-3 w-auto shrink-0" />
        </div>
        {/* Desktop */}
        <div className="hidden lg:flex items-center justify-center gap-3 py-2.5">
          <span className="text-xs font-semibold text-gray-500">Todos nuestros productos incluyen factura electrónica</span>
          <span className="text-gray-300">|</span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/dian-logo.png" alt="DIAN" width={80} height={14} className="h-3.5 w-auto" />
        </div>
      </div>

      {/* ===== CATEGORIES ===== */}
      <section className="bg-white border-b border-surface-200">
        <div className="px-4 sm:px-6 lg:px-8 max-w-[1550px] mx-auto">
          {/* Mobile: circular icons */}
          <div className="flex gap-4 py-4 overflow-x-auto scrollbar-hide lg:hidden" style={{ scrollbarWidth: 'none' }}>
            {showCategories.map((cat) => {
              const Icon = cat.icon;
              return (
                <Link
                  key={cat.slug}
                  href={`/categoria/${cat.slug}`}
                  className="flex flex-col items-center gap-1.5 flex-shrink-0 w-[60px] group active:scale-95 transition-transform"
                >
                  <div className="w-[52px] h-[52px] rounded-full bg-surface-100 flex items-center justify-center group-hover:bg-primary-50 group-hover:shadow-md transition-all">
                    <Icon className="w-5 h-5 text-primary-600" />
                  </div>
                  <span className="text-[10px] font-semibold text-gray-600 text-center leading-tight line-clamp-2 w-full">{cat.name}</span>
                </Link>
              );
            })}
          </div>
          {/* Desktop: pill chips */}
          <div className="hidden lg:flex items-center gap-2 py-5 overflow-x-auto scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
            {showCategories.map((cat) => {
              const Icon = cat.icon;
              return (
                <Link
                  key={cat.slug}
                  href={`/categoria/${cat.slug}`}
                  className="group flex items-center gap-2.5 px-5 py-2.5 rounded-full border border-surface-300 hover:border-primary-500 hover:bg-primary-500 transition-all duration-200 flex-shrink-0"
                >
                  <Icon className="w-5 h-5 text-primary-600 group-hover:text-white transition-colors" />
                  <span className="text-gray-700 group-hover:text-white text-sm font-semibold whitespace-nowrap transition-colors">{cat.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== SECONDARY BANNERS (SBANNER) — Desktop only (mobile banners distributed below) ===== */}
      {sbanners.length > 0 && (
        <section className="hidden lg:block py-6 bg-white">
          <div className="px-4 sm:px-6 lg:px-8 max-w-[1550px] mx-auto">
            <div className={`grid gap-4 ${
              sbanners.length === 3 ? 'grid-cols-3' :
              sbanners.length === 2 ? 'grid-cols-2' : 'grid-cols-1'
            }`}>
              {sbanners.map((sb, idx) => (
                <Link
                  key={idx}
                  href={sb.ctaLink || '/productos'}
                  className="block overflow-hidden rounded-2xl hover:shadow-lg transition-shadow duration-300"
                >
                  <Image
                    src={sb.productImage}
                    alt={sb.title.replace(/SBANNER\d*/g, '').trim() || `Banner ${idx + 1}`}
                    width={700}
                    height={350}
                    className="w-full h-auto object-cover"
                    sizes="33vw"
                  />
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== MOBILE BANNER 1 — After Categories ===== */}
      {sbanners[0] && (
        <section className="lg:hidden py-3 bg-white">
          <div className="px-4">
            <Link
              href={sbanners[0].ctaLink || '/productos'}
              className="block overflow-hidden rounded-2xl"
            >
              <Image
                src={sbanners[0].productImage}
                alt={sbanners[0].title.replace(/SBANNER\d*/g, '').trim() || 'Banner 1'}
                width={700}
                height={350}
                className="w-full h-auto object-cover"
                sizes="(max-width: 1024px) 100vw, 33vw"
              />
            </Link>
          </div>
        </section>
      )}

      {/* ===== LATEST PRODUCTS ===== */}
      {latestProducts.length > 0 && (
        <section className="py-6 lg:py-16 bg-white">
          <div className="px-4 sm:px-6 lg:px-8 max-w-[1550px] mx-auto">
            <div className="flex items-end justify-between mb-5 lg:mb-8">
              <div>
                <span className="inline-block bg-primary-600 text-white text-[10px] lg:text-xs font-bold px-2.5 lg:px-3 py-1 rounded mb-1.5 lg:mb-2 uppercase tracking-wider">
                  Nuevos
                </span>
                <h2 className="text-xl lg:text-3xl font-extrabold text-gray-900">Productos Recién Llegados</h2>
              </div>
              <Link
                href="/productos"
                className="group flex items-center gap-1.5 text-primary-600 font-bold hover:text-primary-700 transition-colors text-xs lg:text-sm"
              >
                Ver todo
                <ArrowRight className="w-3.5 h-3.5 lg:w-4 lg:h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Mobile: 4 vertical (2x2) + 4 horizontal full-width */}
            <div className="flex flex-col gap-3 lg:hidden">
              {/* 2 rows of 2 vertical cards = 4 products */}
              <div className="grid grid-cols-2 gap-3">
                {latestProducts.slice(0, 4).map((product, i) => (
                  <ProductCard key={product.id} product={product} index={i} />
                ))}
              </div>
              {/* 4 horizontal full-width cards */}
              {latestProducts.slice(4, 8).map((product, i) => (
                <ProductCardHorizontal key={product.id} product={product} index={4 + i} />
              ))}
            </div>
            {/* Desktop: grid */}
            <div className="hidden lg:grid grid-cols-4 gap-5 items-stretch">
              {latestProducts.slice(0, 8).map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== MOBILE BANNER 2 — After Latest Products ===== */}
      {sbanners[1] && (
        <section className="lg:hidden py-3 bg-white">
          <div className="px-4">
            <Link
              href={sbanners[1].ctaLink || '/productos'}
              className="block overflow-hidden rounded-2xl"
            >
              <Image
                src={sbanners[1].productImage}
                alt={sbanners[1].title.replace(/SBANNER\d*/g, '').trim() || 'Banner 2'}
                width={700}
                height={350}
                className="w-full h-auto object-cover"
                sizes="(max-width: 1024px) 100vw, 33vw"
              />
            </Link>
          </div>
        </section>
      )}

      {/* ===== PRODUCT OF THE DAY ===== */}
      {pddProduct && (
        <section className="py-6 lg:py-16 bg-surface-50 border-y border-surface-200" style={{ contentVisibility: 'auto', containIntrinsicSize: 'auto 500px' }}>
          <div className="px-4 sm:px-6 lg:px-8 max-w-[1550px] mx-auto">
            <div className="flex items-center gap-2.5 lg:gap-3 mb-5 lg:mb-8">
              <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <Flame className="w-4 h-4 lg:w-5 lg:h-5 text-amber-500" />
              </div>
              <div>
                <span className="inline-block bg-amber-500 text-white text-[10px] lg:text-xs font-bold px-2.5 lg:px-3 py-0.5 lg:py-1 rounded mb-0.5 lg:mb-1 uppercase tracking-wider">
                  🔥 Oferta del Día
                </span>
                <h2 className="text-lg lg:text-2xl font-extrabold text-gray-900">No te lo pierdas</h2>
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-500/10 to-surface-100 rounded-2xl border border-amber-500/20 p-4 lg:p-8">
              <div className="flex flex-col lg:flex-row items-center gap-5 lg:gap-8">
                {/* Image */}
                <div className="relative w-48 h-48 lg:w-80 lg:h-80 flex-shrink-0">
                  {pddProduct.images[0] && (
                    <Image
                      src={pddProduct.images[0].src}
                      alt={pddProduct.name}
                      fill
                      className="object-contain"
                      sizes="(max-width: 1024px) 256px, 320px"
                    />
                  )}
                  {parseFloat(pddProduct.regular_price) > parseFloat(pddProduct.price) && (
                    <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-black px-3 py-1 rounded-full">
                      -{calculateDiscount(pddProduct.regular_price, pddProduct.price)}%
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 text-center lg:text-left">
                  <h3 className="text-base lg:text-2xl font-extrabold text-gray-900 mb-2 lg:mb-3 line-clamp-2">{pddProduct.name}</h3>
                  <div className="flex items-center justify-center lg:justify-start gap-2 lg:gap-3 mb-3 lg:mb-4">
                    {parseFloat(pddProduct.regular_price) > parseFloat(pddProduct.price) && (
                      <span className="text-sm lg:text-lg text-surface-600 line-through">{formatPrice(pddProduct.regular_price)}</span>
                    )}
                    <span className="text-2xl lg:text-3xl font-black text-primary-600 font-display">{formatPrice(pddProduct.price)}</span>
                  </div>
                  <p className="text-xs lg:text-sm text-surface-700 mb-4 lg:mb-6 line-clamp-2 lg:line-clamp-3" dangerouslySetInnerHTML={{ __html: pddProduct.short_description || '' }} />
                  <div className="flex flex-col sm:flex-row items-center gap-2 lg:gap-3">
                    <Link
                      href={`/producto/${pddProduct.slug}`}
                      className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-white px-6 py-3 lg:px-8 lg:py-3.5 rounded-xl font-bold shadow-lg shadow-amber-500/25 hover:-translate-y-0.5 transition-all text-sm lg:text-base"
                    >
                      <ShoppingCart className="w-4 h-4 lg:w-5 lg:h-5" />
                      Comprar Ahora
                    </Link>
                    <span className="flex items-center gap-1.5 text-[11px] lg:text-xs text-surface-600">
                      <Clock className="w-3 h-3 lg:w-3.5 lg:h-3.5" /> Oferta por tiempo limitado
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ===== MOBILE BANNER 3 — After Product of the Day ===== */}
      {sbanners[2] && (
        <section className="lg:hidden py-3 bg-white">
          <div className="px-4">
            <Link
              href={sbanners[2].ctaLink || '/productos'}
              className="block overflow-hidden rounded-2xl"
            >
              <Image
                src={sbanners[2].productImage}
                alt={sbanners[2].title.replace(/SBANNER\d*/g, '').trim() || 'Banner 3'}
                width={700}
                height={350}
                className="w-full h-auto object-cover"
                sizes="(max-width: 1024px) 100vw, 33vw"
              />
            </Link>
          </div>
        </section>
      )}

      {/* ===== LARGEBANNER ===== */}
      {(() => {
        const largeBanners = banners
          .filter((b) => b.title.startsWith('LARGEBANNER') && b.isActive && b.productImage)
          .sort((a, b) => a.sortOrder - b.sortOrder);
        if (largeBanners.length === 0) return null;
        return (
          <section className="bg-white">
            <div className="px-4 sm:px-6 lg:px-8 max-w-[1550px] mx-auto">
              {largeBanners.map((lb, idx) => (
                <Link
                  key={idx}
                  href={lb.ctaLink || '/productos'}
                  className="block overflow-hidden rounded-2xl hover:shadow-lg transition-shadow duration-300"
                >
                  <Image
                    src={lb.productImage}
                    alt={lb.title.replace(/LARGEBANNER\d*/g, '').trim() || `Banner ${idx + 1}`}
                    width={1800}
                    height={400}
                    className="w-full h-auto object-cover"
                    sizes="(max-width: 1024px) 100vw, 1200px"
                  />
                </Link>
              ))}
            </div>
          </section>
        );
      })()}

      {/* ===== STATS / INVENTORY BANNER ===== */}
      <section className="bg-surface-50 py-12 lg:py-16 relative overflow-hidden border-y border-surface-200" style={{ contentVisibility: 'auto', containIntrinsicSize: 'auto 300px' }}>
        <div className="px-4 sm:px-6 lg:px-8 max-w-[1550px] mx-auto relative z-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 text-center">
            {[
              { value: '25+', label: 'Marcas Oficiales', icon: BadgeCheck },
              { value: '100%', label: 'Garantía Oficial', icon: Shield },
              { value: '1-3', label: 'Días de Entrega', icon: Package },
              { value: '4.9/5', label: 'Calificación Clientes', icon: Star },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label}>
                  <div className="flex justify-center mb-3">
                    <div className="w-12 h-12 rounded-xl bg-primary-500/10 flex items-center justify-center">
                      <Icon className="w-6 h-6 text-primary-600" />
                    </div>
                  </div>
                  <p className="text-3xl lg:text-4xl font-black text-gray-900 font-display">{stat.value}</p>
                  <p className="text-surface-700 text-sm mt-1 font-medium">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== SALE PRODUCTS ===== */}
      {saleProducts.length > 0 && (
        <section className="py-6 lg:py-16 bg-white" style={{ contentVisibility: 'auto', containIntrinsicSize: 'auto 800px' }}>
          <div className="px-4 sm:px-6 lg:px-8 max-w-[1550px] mx-auto">
            <div className="flex items-end justify-between mb-5 lg:mb-8">
              <div>
                <span className="inline-flex items-center gap-1.5 bg-red-600 text-white text-[10px] lg:text-xs font-bold px-2.5 lg:px-3 py-1 rounded mb-1.5 lg:mb-2 uppercase tracking-wider">
                  <Zap className="w-3 h-3" /> Hot Sale
                </span>
                <h2 className="text-xl lg:text-3xl font-extrabold text-gray-900">Descuentos y Ofertas</h2>
              </div>
              <Link
                href="/productos?on_sale=true"
                className="group flex items-center gap-1.5 text-red-600 font-bold hover:text-red-700 transition-colors text-xs lg:text-sm"
              >
                Ver ofertas
                <ArrowRight className="w-3.5 h-3.5 lg:w-4 lg:h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Mobile: 4 vertical (2x2) + 4 horizontal full-width */}
            <div className="flex flex-col gap-3 lg:hidden">
              {/* 2 rows of 2 vertical cards = 4 products */}
              <div className="grid grid-cols-2 gap-3">
                {saleProducts.slice(0, 4).map((product, i) => (
                  <ProductCard key={product.id} product={product} index={i} />
                ))}
              </div>
              {/* 4 horizontal full-width cards */}
              {saleProducts.slice(4, 8).map((product, i) => (
                <ProductCardHorizontal key={product.id} product={product} index={4 + i} />
              ))}
            </div>
            {/* Desktop: grid */}
            <div className="hidden lg:grid grid-cols-4 gap-5 items-stretch">
              {saleProducts.slice(0, 8).map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== BRANDS BAR ===== */}
      {brands.length > 0 && (
        <section className="py-10 lg:py-14 bg-surface-50 border-y border-surface-200" style={{ contentVisibility: 'auto', containIntrinsicSize: 'auto 200px' }}>
          <div className="px-4 sm:px-6 lg:px-8 max-w-[1550px] mx-auto text-center mb-6">
            <h2 className="text-xl lg:text-2xl font-extrabold text-gray-900">Marcas Oficiales</h2>
          </div>
          <div className="overflow-hidden">
            <div className="flex animate-marquee items-center">
              {[...brands, ...brands].map((brand, i) => (
                <div key={`${brand.slug}-${i}`} className="flex-shrink-0 mx-6 lg:mx-10">
                  {brand.image ? (
                    <Image
                      src={brand.image.src}
                      alt={brand.image.alt || brand.name}
                      width={120}
                      height={40}
                      className="h-8 lg:h-10 w-auto object-contain grayscale hover:grayscale-0 opacity-60 hover:opacity-100 transition-all duration-300"
                      loading="lazy"
                    />
                  ) : (
                    <span className="text-sm lg:text-base font-bold text-surface-400 hover:text-primary-600 transition-all duration-300 cursor-default font-display whitespace-nowrap select-none tracking-wide uppercase">
                      {brand.name}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== CTA / WHATSAPP BANNER ===== */}
      <section className="bg-gradient-to-br from-primary-600 via-primary-500 to-blue-600 py-12 lg:py-16 relative overflow-hidden" style={{ contentVisibility: 'auto', containIntrinsicSize: 'auto 300px' }}>
        {/* Deco */}
        <div className="absolute -left-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-white/5 rounded-full blur-3xl" />

        <div className="px-4 sm:px-6 lg:px-8 max-w-[1550px] mx-auto relative z-10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8 text-center lg:text-left">
            <div>
              <h2 className="text-2xl lg:text-4xl font-black text-white font-display leading-tight">
                ¿Necesitas asesoría?{' '}
                <span className="text-yellow-300">Escríbenos</span>
              </h2>
              <p className="text-white/80 mt-2 text-sm lg:text-base max-w-lg">
                Nuestro equipo de expertos te ayuda a elegir el producto perfecto para ti. Respuesta inmediata por WhatsApp.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href="https://wa.me/573132294533?text=Hola%2C%20necesito%20asesor%C3%ADa%20para%20elegir%20un%20producto"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-xl shadow-emerald-500/25 hover:shadow-2xl transition-all hover:-translate-y-0.5"
              >
                <MessageCircle className="w-5 h-5" />
                WhatsApp
              </a>
              <Link
                href="/productos"
                className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-xl hover:bg-white/20 transition-all hover:-translate-y-0.5"
              >
                Ver Productos
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
