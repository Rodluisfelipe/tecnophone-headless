import Image from 'next/image';
import Link from 'next/link';
import {
  Building2,
  Monitor,
  Laptop,
  Headphones,
  Shield,
  Truck,
  BadgePercent,
  Users,
  Clock,
  CheckCircle2,
  ArrowRight,
  MessageCircle,
  Phone,
  Zap,
  Receipt,
  Wrench,
  Package,
} from 'lucide-react';
import { getProducts, formatPrice } from '@/lib/woocommerce';
import EmpresasForm from './EmpresasForm';

export const revalidate = 3600; // ISR: refresh every hour

export default async function EmpresasPage() {
  // Fetch real products for showcase
  const [laptopRes, monitorRes, accessoryRes] = await Promise.all([
    getProducts({ per_page: 4, category_slug: 'portatiles-2', orderby: 'date', order: 'desc' }),
    getProducts({ per_page: 2, category_slug: 'monitores', orderby: 'date', order: 'desc' }),
    getProducts({ per_page: 2, orderby: 'popularity', order: 'desc' }),
  ]);

  const featuredProducts = [...laptopRes.products, ...monitorRes.products, ...accessoryRes.products]
    .filter((p, i, arr) => arr.findIndex((x) => x.id === p.id) === i)
    .slice(0, 8);

  return (
    <div className="min-h-screen">
      {/* ===== HERO WITH PRODUCT SHOWCASE ===== */}
      <section className="relative bg-gradient-to-br from-primary-50 via-white to-blue-50 overflow-hidden">
        {/* Subtle decorations */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-100/50 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-100/40 rounded-full blur-3xl" />

        <div className="container-custom relative py-14 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left content */}
            <div>
              <span className="inline-flex items-center gap-2 bg-primary-100 text-primary-700 px-4 py-1.5 rounded-full text-sm font-bold mb-6 border border-primary-200">
                <Building2 className="w-4 h-4" />
                Descuentos exclusivos para empresas
              </span>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold leading-[1.1] mb-6 font-display text-gray-900">
                Equipa a todo tu equipo con{' '}
                <span className="text-primary-600">tecnología de primer nivel</span>
              </h1>
              <p className="text-lg lg:text-xl text-surface-700 mb-8 max-w-xl leading-relaxed">
                Renueva portátiles, monitores y periféricos de tu empresa con hasta <span className="text-primary-600 font-bold">30% de descuento</span>. Factura electrónica, garantía oficial y entrega en tu oficina.
              </p>
              <div className="flex flex-wrap gap-4 mb-10">
                <a
                  href="#cotizar"
                  className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-7 py-4 rounded-xl font-extrabold shadow-lg shadow-primary-500/25 hover:-translate-y-0.5 transition-all text-base"
                >
                  Solicitar cotización gratis
                  <ArrowRight className="w-5 h-5" />
                </a>
                <a
                  href="https://wa.me/573132294533?text=Hola%2C%20soy%20de%20una%20empresa%20y%20me%20interesa%20una%20cotizaci%C3%B3n%20corporativa"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-7 py-4 rounded-xl font-bold transition-all text-base"
                >
                  <MessageCircle className="w-5 h-5" />
                  WhatsApp directo
                </a>
              </div>
              {/* Mini trust signals */}
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-surface-700">
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-green-500" /> Factura electrónica</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-green-500" /> Garantía oficial</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-green-500" /> Envío gratis corporativo</span>
              </div>
            </div>

            {/* Right: floating product grid */}
            <div className="hidden lg:block relative">
              <div className="grid grid-cols-2 gap-4">
                {featuredProducts.slice(0, 4).map((product, i) => (
                  <div
                    key={product.id}
                    className={`bg-white rounded-2xl p-4 border border-surface-200 hover:border-primary-200 hover:shadow-lg transition-all group ${i === 0 ? 'translate-y-4' : i === 3 ? '-translate-y-4' : ''}`}
                  >
                    <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-surface-50 mb-3">
                      {product.images[0]?.src && (
                        <Image
                          src={product.images[0].src}
                          alt={product.name}
                          fill
                          className="object-contain p-3 group-hover:scale-105 transition-transform duration-500"
                          sizes="200px"
                        />
                      )}
                    </div>
                    <p className="text-xs text-gray-700 font-medium line-clamp-1">{product.name}</p>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-sm font-extrabold text-primary-600">{formatPrice(product.price)}</span>
                      {product.on_sale && product.regular_price && (
                        <span className="text-[10px] text-surface-500 line-through">{formatPrice(product.regular_price)}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {/* Discount tag overlay */}
              <div className="absolute -top-4 -right-2 bg-primary-600 text-white px-4 py-2 rounded-xl font-extrabold text-sm shadow-lg shadow-primary-500/30 rotate-3">
                Hasta -30% para empresas
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== STATS BAR — animated counters look ===== */}
      <section className="bg-white border-b border-surface-200 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-50/50 via-transparent to-amber-50/50" />
        <div className="container-custom py-10 relative">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { value: '500+', label: 'Empresas confían en nosotros', icon: Building2, color: 'text-primary-600' },
              { value: 'Hasta 30%', label: 'Descuento corporativo', icon: BadgePercent, color: 'text-amber-500' },
              { value: '24h', label: 'Cotización en menos de', icon: Clock, color: 'text-emerald-600' },
              { value: '100%', label: 'Garantía oficial', icon: Shield, color: 'text-primary-600' },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="text-center">
                  <Icon className={`w-6 h-6 ${stat.color} mx-auto mb-2`} />
                  <p className={`text-2xl lg:text-3xl font-extrabold font-display ${stat.color}`}>{stat.value}</p>
                  <p className="text-xs lg:text-sm text-surface-700 font-semibold mt-1">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== PRODUCT SHOWCASE — Real products ===== */}
      <section className="bg-surface-50 py-16 lg:py-24">
        <div className="container-custom">
          <div className="text-center mb-14">
            <span className="inline-block bg-primary-50 text-primary-600 text-sm font-bold px-4 py-1.5 rounded-full mb-4">
              Catálogo corporativo
            </span>
            <h2 className="text-2xl lg:text-4xl font-extrabold text-gray-900 font-display mb-4">
              Tecnología real, precios corporativos
            </h2>
            <p className="text-surface-700 max-w-2xl mx-auto text-lg">
              Estos son algunos de nuestros productos más populares entre empresas. Todos con descuento especial por volumen.
            </p>
          </div>

          {/* Product cards grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {featuredProducts.slice(0, 8).map((product) => (
              <Link
                key={product.id}
                href={`/producto/${product.slug}`}
                className="bg-white rounded-2xl border border-surface-200 overflow-hidden hover:shadow-xl hover:shadow-primary-500/10 hover:border-primary-200 hover:-translate-y-1 transition-all duration-300 group"
              >
                <div className="relative aspect-square bg-surface-50 p-4">
                  {product.images[0]?.src && (
                    <Image
                      src={product.images[0].src}
                      alt={product.name}
                      fill
                      className="object-contain p-2 group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                  )}
                  {product.on_sale && (
                    <span className="absolute top-3 left-3 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      OFERTA
                    </span>
                  )}
                  <span className="absolute top-3 right-3 bg-amber-400/90 text-gray-900 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    Corp. -30%
                  </span>
                </div>
                <div className="p-4">
                  <p className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug mb-2 group-hover:text-primary-600 transition-colors">
                    {product.name}
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-base font-extrabold text-primary-600 font-display">
                      {formatPrice(product.price)}
                    </span>
                    {product.on_sale && product.regular_price && (
                      <span className="text-xs text-surface-500 line-through">
                        {formatPrice(product.regular_price)}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-amber-600 font-semibold mt-1">Precio especial por volumen</p>
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link
              href="/productos"
              className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-8 py-3.5 rounded-xl font-bold shadow-lg shadow-primary-500/20 hover:-translate-y-0.5 transition-all"
            >
              Ver todo el catálogo
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ===== BENEFITS — Premium cards ===== */}
      <section className="bg-white py-16 lg:py-24">
        <div className="container-custom">
          <div className="text-center mb-14">
            <span className="inline-block bg-amber-50 text-amber-600 text-sm font-bold px-4 py-1.5 rounded-full mb-4">
              Ventajas corporativas
            </span>
            <h2 className="text-2xl lg:text-4xl font-extrabold text-gray-900 font-display mb-4">
              Todo lo que una empresa necesita
            </h2>
            <p className="text-surface-700 max-w-2xl mx-auto text-lg">
              No solo vendemos tecnología — ofrecemos un servicio completo para que tu empresa produzca más.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: BadgePercent, title: 'Descuentos hasta 30%', desc: 'Precios exclusivos por compras en volumen. A mayor cantidad, mayor descuento. Mínimo 3 unidades.', gradient: 'from-amber-400 to-orange-500' },
              { icon: Receipt, title: 'Factura electrónica', desc: 'Facturación electrónica DIAN válida para deducción de impuestos. Ideal para tu contabilidad.', gradient: 'from-blue-400 to-primary-600' },
              { icon: Shield, title: 'Garantía extendida', desc: 'Garantía oficial en todos los equipos con soporte técnico prioritario y canal exclusivo.', gradient: 'from-emerald-400 to-green-600' },
              { icon: Truck, title: 'Entrega en tu oficina', desc: 'Envío gratis en pedidos corporativos. Bogotá mismo día, a nivel nacional 1-3 días hábiles.', gradient: 'from-purple-400 to-purple-600' },
              { icon: Users, title: 'Asesor dedicado', desc: 'Un ejecutivo de cuenta exclusivo que conoce tu empresa y te consigue las mejores ofertas.', gradient: 'from-pink-400 to-rose-600' },
              { icon: Wrench, title: 'Soporte técnico', desc: 'Apoyo post-venta: configuración, instalación de software, y migración de datos incluida.', gradient: 'from-cyan-400 to-teal-600' },
            ].map((b) => {
              const Icon = b.icon;
              return (
                <div
                  key={b.title}
                  className="relative bg-white rounded-2xl p-7 border border-surface-200 hover:border-transparent hover:shadow-2xl hover:shadow-primary-500/10 transition-all duration-300 group overflow-hidden"
                >
                  {/* Hover gradient border effect */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${b.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl`} />
                  <div className="absolute inset-[2px] bg-white rounded-[14px] z-[1]" />

                  <div className="relative z-[2]">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${b.gradient} flex items-center justify-center mb-5 shadow-lg`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-lg font-extrabold text-gray-900 mb-2">{b.title}</h3>
                    <p className="text-sm text-surface-700 leading-relaxed">{b.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== USE CASES — Who is this for ===== */}
      <section className="bg-white py-16 lg:py-24 border-b border-surface-200">
        <div className="container-custom">
          <div className="text-center mb-14">
            <span className="inline-block bg-primary-50 text-primary-600 text-sm font-bold px-4 py-1.5 rounded-full mb-4">
              ¿Para quién es?
            </span>
            <h2 className="text-2xl lg:text-4xl font-extrabold text-gray-900 font-display mb-4">
              Soluciones para cada tipo de empresa
            </h2>
            <p className="text-surface-700 max-w-2xl mx-auto text-lg">
              Ya seas un emprendedor, una pyme o una corporación, tenemos planes adaptados a tu presupuesto.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { emoji: '🚀', title: 'Startups', desc: 'Equipa a tu equipo inicial con portátiles potentes sin quebrar tu pista de aterrizaje.', highlight: 'Desde 3 equipos' },
              { emoji: '🏢', title: 'Pymes', desc: 'Renueva el parque tecnológico completo de tu oficina con financiación flexible.', highlight: 'Hasta 50 equipos' },
              { emoji: '🏛️', title: 'Corporaciones', desc: 'Dotación masiva con logística coordinada, facturación centralizada y soporte VIP.', highlight: '50+ equipos' },
              { emoji: '🎓', title: 'Educación', desc: 'Equipos para colegios, universidades y centros de formación con descuentos especiales.', highlight: 'Precio especial' },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-surface-50 rounded-2xl p-6 border border-surface-200 hover:border-primary-200 hover:shadow-lg transition-all group"
              >
                <span className="text-4xl mb-4 block">{item.emoji}</span>
                <h3 className="text-lg font-extrabold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-surface-700 mb-4 leading-relaxed">{item.desc}</p>
                <span className="inline-block bg-primary-50 text-primary-600 text-xs font-bold px-3 py-1 rounded-full">
                  {item.highlight}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS — Timeline style ===== */}
      <section className="bg-surface-50 py-16 lg:py-24">
        <div className="container-custom">
          <div className="text-center mb-14">
            <span className="inline-block bg-primary-50 text-primary-600 text-sm font-bold px-4 py-1.5 rounded-full mb-4">
              Proceso simple
            </span>
            <h2 className="text-2xl lg:text-4xl font-extrabold text-gray-900 font-display mb-4">
              3 pasos para equipar tu empresa
            </h2>
          </div>
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8 relative">
              {/* Connection line */}
              <div className="hidden md:block absolute top-10 left-[16.5%] right-[16.5%] h-0.5 bg-gradient-to-r from-primary-500 via-amber-400 to-green-500" />

              {[
                { step: '1', title: 'Cuéntanos qué necesitas', desc: 'Llena el formulario o escríbenos por WhatsApp. Cuéntanos cuántos equipos necesitas y tu presupuesto.', icon: MessageCircle, color: 'bg-primary-600' },
                { step: '2', title: 'Recibe tu cotización', desc: 'En menos de 24 horas recibís una propuesta personalizada con precios corporativos y opciones de pago.', icon: Receipt, color: 'bg-amber-500' },
                { step: '3', title: 'Entrega en tu oficina', desc: 'Coordinamos la entrega, configuramos los equipos y te damos soporte post-venta dedicado.', icon: Package, color: 'bg-green-500' },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.step} className="text-center relative">
                    <div className={`w-20 h-20 ${item.color} rounded-2xl text-white text-2xl font-extrabold flex items-center justify-center mx-auto mb-5 shadow-lg relative z-10`}>
                      <Icon className="w-9 h-9" />
                    </div>
                    <span className="inline-block bg-primary-600 text-white text-xs font-bold px-3 py-1 rounded-full mb-3">
                      Paso {item.step}
                    </span>
                    <h3 className="text-lg font-extrabold text-gray-900 mb-2">{item.title}</h3>
                    <p className="text-sm text-surface-700 leading-relaxed">{item.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ===== CONTACT FORM — Premium version ===== */}
      <section id="cotizar" className="bg-gradient-to-b from-surface-50 to-white py-16 lg:py-24">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <span className="inline-block bg-green-50 text-green-600 text-sm font-bold px-4 py-1.5 rounded-full mb-4">
                Cotización gratuita
              </span>
              <h2 className="text-2xl lg:text-4xl font-extrabold text-gray-900 font-display mb-4">
                Solicita tu cotización corporativa
              </h2>
              <p className="text-surface-700 text-lg">
                Completa el formulario y te respondemos por WhatsApp en menos de 2 horas.
              </p>
            </div>

            <EmpresasForm />

            {/* Direct contact */}
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-6 text-sm">
              <a
                href="https://wa.me/573132294533?text=Hola%2C%20soy%20de%20una%20empresa%20y%20necesito%20una%20cotizaci%C3%B3n"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-green-50 text-green-700 hover:bg-green-100 px-5 py-3 rounded-xl font-bold transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
                +57 313 229 4533
              </a>
              <a
                href="tel:+573132294533"
                className="flex items-center gap-2 bg-surface-100 text-surface-700 hover:bg-surface-200 px-5 py-3 rounded-xl font-bold transition-colors"
              >
                <Phone className="w-5 h-5" />
                Llamar directamente
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className="bg-primary-50 border-t border-primary-100 py-16 lg:py-20">
        <div className="container-custom text-center">
          <h2 className="text-2xl lg:text-4xl font-extrabold text-gray-900 font-display mb-4">
            ¿Listo para equipar tu empresa?
          </h2>
          <p className="text-surface-700 text-lg mb-8 max-w-xl mx-auto">
            Únete a las 500+ empresas que ya confían en TecnoPhone para su tecnología corporativa.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a
              href="#cotizar"
              className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-xl font-extrabold shadow-lg shadow-primary-500/25 hover:-translate-y-0.5 transition-all"
            >
              Solicitar cotización gratis
              <ArrowRight className="w-5 h-5" />
            </a>
            <a
              href="https://wa.me/573132294533?text=Hola%2C%20quiero%20cotizar%20equipos%20para%20mi%20empresa"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-xl font-bold transition-all"
            >
              <MessageCircle className="w-5 h-5" />
              WhatsApp
            </a>
          </div>
          {/* Trust bar */}
          <div className="flex flex-wrap items-center justify-center gap-8 mt-12 text-sm text-surface-700">
            {[
              { icon: Receipt, text: 'Facturación electrónica' },
              { icon: Shield, text: 'Garantía oficial' },
              { icon: Truck, text: 'Envío gratis corporativo' },
              { icon: Clock, text: 'Soporte prioritario 24/7' },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.text} className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-primary-600" />
                  <span className="font-semibold">{item.text}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
