import Image from 'next/image';
import Link from 'next/link';
import {
  Heart,
  Gift,
  Headphones,
  Smartphone,
  Laptop,
  Monitor,
  ShoppingCart,
  ArrowRight,
  Truck,
  Shield,
  CreditCard,
  Package,
  MessageCircle,
  Star,
  Sparkles,
} from 'lucide-react';
import { getProducts, formatPrice } from '@/lib/woocommerce';

export const revalidate = 3600;

// Gift ideas categorized by price range and use case
const GIFT_IDEAS = [
  {
    emoji: '🎧',
    title: 'Audífonos Bluetooth',
    desc: 'Para que disfrute su música, podcasts y llamadas con la mejor calidad de sonido.',
    budget: 'Desde $79.900',
    icon: Headphones,
    color: 'bg-pink-50 text-pink-600',
  },
  {
    emoji: '📱',
    title: 'Celular nuevo',
    desc: 'Un celular con buena cámara para que capture todos los momentos especiales.',
    budget: 'Desde $499.900',
    icon: Smartphone,
    color: 'bg-purple-50 text-purple-600',
  },
  {
    emoji: '💻',
    title: 'Portátil',
    desc: 'Para trabajar, estudiar o ver sus series favoritas desde cualquier lugar.',
    budget: 'Desde $1.199.900',
    icon: Laptop,
    color: 'bg-blue-50 text-blue-600',
  },
  {
    emoji: '🖥️',
    title: 'Monitor',
    desc: 'Pantalla grande para que trabaje cómoda o disfrute su contenido favorito.',
    budget: 'Desde $549.900',
    icon: Monitor,
    color: 'bg-indigo-50 text-indigo-600',
  },
];

export default async function DiaDeLaMadrePage() {
  // Fetch products sorted by popularity (most sold)
  const [generalRes, affordableRes] = await Promise.all([
    getProducts({ per_page: 8, orderby: 'popularity', order: 'desc' }),
    getProducts({ per_page: 8, orderby: 'price', order: 'asc' }),
  ]);

  const popularProducts = generalRes.products;
  const affordableProducts = affordableRes.products;

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50/50 to-white">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-50 via-white to-purple-50" />
        <div className="relative container-custom py-12 lg:py-20">
          <div className="max-w-3xl mx-auto text-center">
            <span className="inline-flex items-center gap-2 bg-pink-100 text-pink-700 text-sm font-bold px-4 py-1.5 rounded-full mb-5">
              <Heart className="w-4 h-4 fill-current" />
              Mayo 2026
            </span>
            <h1 className="text-3xl lg:text-5xl font-extrabold text-gray-900 font-display mb-4">
              Regalos Tecnológicos para el<br />
              <span className="text-pink-600">Día de la Madre</span>
            </h1>
            <p className="text-surface-600 text-lg max-w-xl mx-auto mb-8">
              Sorprende a mamá con tecnología que mejora su día a día. 
              Envío gratis, garantía oficial y factura electrónica DIAN.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <a
                href="#regalos"
                className="inline-flex items-center gap-2 bg-pink-600 hover:bg-pink-700 text-white font-bold px-6 py-3 rounded-xl transition-colors shadow-md hover:shadow-lg"
              >
                <Gift className="w-5 h-5" />
                Ver ideas de regalo
                <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="https://wa.me/573132294533?text=Hola%2C%20necesito%20ayuda%20para%20elegir%20un%20regalo%20para%20el%20D%C3%ADa%20de%20la%20Madre"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-white hover:bg-surface-50 text-gray-900 font-bold px-6 py-3 rounded-xl border border-surface-200 transition-colors"
              >
                <MessageCircle className="w-5 h-5 text-green-600" />
                Te ayudamos a elegir
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <div className="bg-white border-y border-surface-200">
        <div className="container-custom">
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-surface-200">
            {[
              { icon: Truck, text: 'Envío gratis' },
              { icon: Gift, text: 'Empaque de regalo' },
              { icon: Shield, text: 'Garantía oficial' },
              { icon: CreditCard, text: 'Hasta 12 cuotas' },
            ].map((feat) => {
              const Icon = feat.icon;
              return (
                <div key={feat.text} className="flex items-center justify-center gap-2 py-4">
                  <Icon className="w-5 h-5 text-pink-600 flex-shrink-0" />
                  <span className="text-gray-700 text-sm font-semibold">{feat.text}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Gift Ideas Grid */}
      <section id="regalos" className="py-12 lg:py-16 bg-white">
        <div className="container-custom">
          <div className="text-center mb-10">
            <span className="inline-block bg-pink-50 text-pink-600 text-sm font-bold px-4 py-1.5 rounded-full mb-3">
              <Sparkles className="w-4 h-4 inline mr-1" />
              Ideas de regalo
            </span>
            <h2 className="text-2xl lg:text-3xl font-extrabold text-gray-900 font-display mb-3">
              ¿Qué regalarle a mamá?
            </h2>
            <p className="text-surface-600 max-w-lg mx-auto">
              Tecnología para cada presupuesto. Todas con garantía y factura electrónica.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {GIFT_IDEAS.map((idea) => {
              const Icon = idea.icon;
              return (
                <Link
                  key={idea.title}
                  href="/productos"
                  className="group bg-white rounded-2xl border border-surface-200 hover:border-pink-200 hover:shadow-lg p-6 transition-all text-center"
                >
                  <div className={`w-14 h-14 ${idea.color} rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-base font-extrabold text-gray-900 mb-1">{idea.title}</h3>
                  <p className="text-xs text-surface-600 mb-3 leading-relaxed">{idea.desc}</p>
                  <span className="inline-block text-xs font-bold text-pink-600 bg-pink-50 px-3 py-1 rounded-full">
                    {idea.budget}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Products: Most Popular */}
      {popularProducts.length > 0 && (
        <section className="py-12 lg:py-16 bg-surface-50 border-t border-surface-200">
          <div className="container-custom">
            <div className="text-center mb-10">
              <span className="inline-block bg-amber-50 text-amber-600 text-sm font-bold px-4 py-1.5 rounded-full mb-3">
                <Star className="w-4 h-4 inline mr-1 fill-current" />
                Más vendidos
              </span>
              <h2 className="text-2xl lg:text-3xl font-extrabold text-gray-900 font-display mb-3">
                Los favoritos para regalar
              </h2>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {popularProducts.slice(0, 8).map((product) => (
                <Link
                  key={product.slug}
                  href={`/producto/${product.slug}`}
                  className="group bg-white rounded-xl border border-surface-200 overflow-hidden hover:shadow-lg hover:border-pink-200 transition-all duration-300"
                >
                  <div className="relative aspect-square bg-surface-50 p-3">
                    {product.images?.[0]?.src && (
                      <Image
                        src={product.images[0].src}
                        alt={product.name}
                        fill
                        className="object-contain p-2 group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 768px) 50vw, 25vw"
                      />
                    )}
                    {product.on_sale && (
                      <span className="absolute top-2 left-2 bg-pink-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        OFERTA
                      </span>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm font-bold text-gray-900 line-clamp-2 mb-2 group-hover:text-pink-600 transition-colors">
                      {product.name}
                    </h3>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-base font-extrabold text-pink-600">{formatPrice(product.price)}</span>
                      {product.on_sale && product.regular_price && (
                        <span className="text-xs text-surface-400 line-through">{formatPrice(product.regular_price)}</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <div className="text-center mt-8">
              <Link
                href="/productos"
                className="inline-flex items-center gap-2 bg-pink-600 hover:bg-pink-700 text-white font-bold px-6 py-3 rounded-xl transition-colors shadow-md"
              >
                <ShoppingCart className="w-5 h-5" />
                Ver todos los productos
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Budget-friendly section */}
      {affordableProducts.length > 0 && (
        <section className="py-12 lg:py-16 bg-white border-t border-surface-200">
          <div className="container-custom">
            <div className="text-center mb-10">
              <span className="inline-block bg-green-50 text-green-600 text-sm font-bold px-4 py-1.5 rounded-full mb-3">
                💰 Para todo presupuesto
              </span>
              <h2 className="text-2xl lg:text-3xl font-extrabold text-gray-900 font-display mb-3">
                Regalos desde menos de $200.000
              </h2>
              <p className="text-surface-600 max-w-lg mx-auto">
                No necesitas gastar mucho para hacer feliz a mamá. Opciones de calidad a precios accesibles.
              </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {affordableProducts.slice(0, 4).map((product) => (
                <Link
                  key={product.slug}
                  href={`/producto/${product.slug}`}
                  className="group bg-white rounded-xl border border-surface-200 overflow-hidden hover:shadow-lg hover:border-green-200 transition-all duration-300"
                >
                  <div className="relative aspect-square bg-surface-50 p-3">
                    {product.images?.[0]?.src && (
                      <Image
                        src={product.images[0].src}
                        alt={product.name}
                        fill
                        className="object-contain p-2 group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 768px) 50vw, 25vw"
                      />
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm font-bold text-gray-900 line-clamp-2 mb-2 group-hover:text-green-600 transition-colors">
                      {product.name}
                    </h3>
                    <span className="text-base font-extrabold text-green-600">{formatPrice(product.price)}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* WhatsApp CTA */}
      <section className="py-12 lg:py-16 bg-gradient-to-r from-pink-50 to-purple-50 border-t border-surface-200">
        <div className="container-custom text-center">
          <Heart className="w-10 h-10 text-pink-500 mx-auto mb-4 fill-current" />
          <h2 className="text-2xl lg:text-3xl font-extrabold text-gray-900 font-display mb-3">
            ¿No sabes qué regalar?
          </h2>
          <p className="text-surface-600 text-lg mb-6 max-w-md mx-auto">
            Escríbenos por WhatsApp y te ayudamos a encontrar el regalo perfecto según tu presupuesto.
          </p>
          <a
            href="https://wa.me/573132294533?text=Hola%2C%20necesito%20ayuda%20para%20elegir%20un%20regalo%20para%20el%20D%C3%ADa%20de%20la%20Madre"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold px-8 py-4 rounded-xl transition-colors shadow-lg hover:shadow-xl text-lg"
          >
            <MessageCircle className="w-6 h-6" />
            Asesoría personalizada gratis
          </a>
        </div>
      </section>

      {/* SEO content */}
      <section className="py-10 lg:py-14 bg-white border-t border-surface-200">
        <div className="container-custom max-w-3xl mx-auto">
          <h2 className="text-xl font-extrabold text-gray-900 mb-4">Regalos tecnológicos para el Día de la Madre en Colombia</h2>
          <div className="prose prose-sm text-surface-700 max-w-none space-y-3">
            <p>
              El Día de la Madre en Colombia se celebra el segundo domingo de mayo y es una de las fechas más importantes del comercio. En TecnoPhone tenemos opciones de regalo para todos los presupuestos: desde audífonos Bluetooth hasta portátiles de última generación.
            </p>
            <h3 className="text-lg font-bold text-gray-900 mt-6">¿Por qué regalar tecnología el Día de la Madre?</h3>
            <p>
              La tecnología es un regalo práctico que mamá usará todos los días. Un celular con buena cámara para sus fotos, unos audífonos para su música, o un portátil para trabajar cómoda. Además, en TecnoPhone todos los productos incluyen garantía oficial del fabricante y factura electrónica DIAN.
            </p>
            <h3 className="text-lg font-bold text-gray-900 mt-6">Envío gratis y entrega antes del Día de la Madre</h3>
            <p>
              Realizamos envíos a toda Colombia con entrega en 1 a 3 días hábiles. Compra con anticipación para que tu regalo llegue a tiempo. Aceptamos todos los medios de pago: tarjeta de crédito, débito, transferencia bancaria y pago contra entrega en ciudades principales.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
