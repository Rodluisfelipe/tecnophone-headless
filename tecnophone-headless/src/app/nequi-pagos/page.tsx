import Image from 'next/image';
import Link from 'next/link';
import {
  Smartphone,
  Shield,
  Zap,
  CheckCircle2,
  ArrowRight,
  ShoppingCart,
  CreditCard,
  MessageCircle,
  Clock,
  Lock,
  Banknote,
  HelpCircle,
} from 'lucide-react';
import { getProducts, formatPrice } from '@/lib/woocommerce';

export const revalidate = 3600;

const STEPS = [
  {
    step: '1',
    title: 'Elige tus productos',
    desc: 'Navega nuestro catálogo y agrega al carrito los equipos que quieres comprar.',
    icon: ShoppingCart,
    color: 'bg-purple-600',
  },
  {
    step: '2',
    title: 'Selecciona MercadoPago',
    desc: 'En el checkout, elige "Pagar con MercadoPago" como método de pago.',
    icon: CreditCard,
    color: 'bg-blue-600',
  },
  {
    step: '3',
    title: 'Paga con Nequi',
    desc: 'MercadoPago te mostrará la opción de pagar con Nequi. Confirma desde tu app Nequi y listo.',
    icon: Smartphone,
    color: 'bg-green-600',
  },
];

const BENEFITS = [
  {
    icon: Zap,
    title: 'Pago instantáneo',
    desc: 'La confirmación es inmediata, tu pedido se procesa al instante.',
  },
  {
    icon: Shield,
    title: 'Seguro y protegido',
    desc: 'Transacción cifrada a través de MercadoPago. Tu dinero está protegido.',
  },
  {
    icon: Lock,
    title: 'Sin compartir datos',
    desc: 'No necesitas ingresar datos bancarios. Todo se aprueba desde tu app Nequi.',
  },
  {
    icon: Banknote,
    title: 'Sin costos extra',
    desc: 'No cobramos comisión adicional por pagar con Nequi. El precio es el mismo.',
  },
];

export default async function NequiPagosPage() {
  const productRes = await getProducts({ per_page: 8, orderby: 'popularity', order: 'desc' });
  const products = productRes.products;

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: '¿Necesito tener tarjeta de crédito para pagar con Nequi?',
        acceptedAnswer: { '@type': 'Answer', text: 'No. Nequi funciona con el saldo de tu cuenta o con tu cuenta de ahorros Bancolombia vinculada. No necesitas tarjeta de crédito.' },
      },
      {
        '@type': 'Question',
        name: '¿Hay un límite de monto para pagar con Nequi?',
        acceptedAnswer: { '@type': 'Answer', text: 'Nequi tiene límites de transacción según tu nivel de cuenta. Generalmente puedes hacer pagos de hasta $2.000.000 por transacción. Para montos mayores, puedes usar transferencia bancaria.' },
      },
      {
        '@type': 'Question',
        name: '¿El pago con Nequi es inmediato?',
        acceptedAnswer: { '@type': 'Answer', text: 'Sí. Una vez confirmas el pago desde tu app Nequi, la transacción se procesa al instante y tu pedido entra en preparación.' },
      },
      {
        '@type': 'Question',
        name: '¿Puedo pagar a cuotas con Nequi?',
        acceptedAnswer: { '@type': 'Answer', text: 'Nequi procesa pagos de contado con el saldo disponible. Si necesitas pagar a cuotas, puedes usar tarjeta de crédito a través de MercadoPago (hasta 12 cuotas).' },
      },
      {
        '@type': 'Question',
        name: '¿Cómo solicito un reembolso si pagué con Nequi?',
        acceptedAnswer: { '@type': 'Answer', text: 'Si necesitas un reembolso, el dinero se devuelve a tu cuenta Nequi en 3-5 días hábiles. Contáctanos por WhatsApp para gestionar la devolución.' },
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <div className="min-h-screen bg-gradient-to-b from-purple-50/30 to-white">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-white to-indigo-50" />
        <div className="relative container-custom py-12 lg:py-20">
          <div className="max-w-3xl mx-auto text-center">
            <span className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 text-sm font-bold px-4 py-1.5 rounded-full mb-5">
              <Smartphone className="w-4 h-4" />
              Método de pago
            </span>
            <h1 className="text-3xl lg:text-5xl font-extrabold text-gray-900 font-display mb-4">
              Compra Tecnología pagando con{' '}
              <span className="text-purple-600">Nequi</span>
            </h1>
            <p className="text-surface-600 text-lg max-w-xl mx-auto mb-8">
              Paga desde tu celular de forma rápida y segura. Sin necesidad de tarjeta de crédito ni datos bancarios.
            </p>
            <Link
              href="/productos"
              className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold px-6 py-3.5 rounded-xl transition-colors shadow-md hover:shadow-lg"
            >
              <ShoppingCart className="w-5 h-5" />
              Comprar ahora con Nequi
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-12 lg:py-16 bg-white border-y border-surface-200">
        <div className="container-custom">
          <div className="text-center mb-10">
            <h2 className="text-2xl lg:text-3xl font-extrabold text-gray-900 font-display mb-3">
              ¿Cómo pagar con Nequi en TecnoPhone?
            </h2>
            <p className="text-surface-600 max-w-lg mx-auto">
              Solo necesitas tu app Nequi instalada y saldo disponible. 3 pasos simples:
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8 relative">
              {/* Connection line */}
              <div className="hidden md:block absolute top-12 left-[16.5%] right-[16.5%] h-0.5 bg-gradient-to-r from-purple-500 via-blue-400 to-green-500" />

              {STEPS.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.step} className="text-center relative">
                    <div className={`w-20 h-20 ${item.color} rounded-2xl text-white flex items-center justify-center mx-auto mb-5 shadow-lg relative z-10`}>
                      <Icon className="w-9 h-9" />
                    </div>
                    <span className="inline-block bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full mb-3">
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

      {/* Benefits */}
      <section className="py-12 lg:py-16 bg-surface-50">
        <div className="container-custom">
          <div className="text-center mb-10">
            <h2 className="text-2xl lg:text-3xl font-extrabold text-gray-900 font-display mb-3">
              Ventajas de pagar con Nequi
            </h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 max-w-4xl mx-auto">
            {BENEFITS.map((b) => {
              const Icon = b.icon;
              return (
                <div key={b.title} className="bg-white rounded-xl border border-surface-200 p-5 text-center hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Icon className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="text-sm font-extrabold text-gray-900 mb-1">{b.title}</h3>
                  <p className="text-xs text-surface-600 leading-relaxed">{b.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Other payment methods */}
      <section className="py-10 lg:py-14 bg-white border-t border-surface-200">
        <div className="container-custom max-w-3xl mx-auto">
          <h2 className="text-xl font-extrabold text-gray-900 text-center mb-6">
            Otros métodos de pago disponibles
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { name: 'Tarjeta crédito', desc: 'Hasta 12 cuotas', icon: CreditCard },
              { name: 'Tarjeta débito', desc: 'Pago directo', icon: CreditCard },
              { name: 'Transferencia', desc: 'PSE / Bancolombia', icon: Banknote },
            ].map((m) => {
              const Icon = m.icon;
              return (
                <div key={m.name} className="bg-surface-50 rounded-xl p-4 text-center">
                  <Icon className="w-5 h-5 text-surface-500 mx-auto mb-2" />
                  <p className="text-sm font-bold text-gray-900">{m.name}</p>
                  <p className="text-[11px] text-surface-500">{m.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Products */}
      {products.length > 0 && (
        <section className="py-12 lg:py-16 bg-surface-50 border-t border-surface-200">
          <div className="container-custom">
            <div className="text-center mb-10">
              <span className="inline-block bg-purple-50 text-purple-600 text-sm font-bold px-4 py-1.5 rounded-full mb-3">
                Paga con Nequi
              </span>
              <h2 className="text-2xl lg:text-3xl font-extrabold text-gray-900 font-display mb-3">
                Productos populares
              </h2>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {products.slice(0, 8).map((product) => (
                <Link
                  key={product.slug}
                  href={`/producto/${product.slug}`}
                  className="group bg-white rounded-xl border border-surface-200 overflow-hidden hover:shadow-lg hover:border-purple-200 transition-all duration-300"
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
                      <span className="absolute top-2 left-2 bg-purple-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">OFERTA</span>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm font-bold text-gray-900 line-clamp-2 mb-2 group-hover:text-purple-600 transition-colors">{product.name}</h3>
                    <span className="text-base font-extrabold text-purple-600">{formatPrice(product.price)}</span>
                    {product.on_sale && product.regular_price && (
                      <span className="ml-2 text-xs text-surface-400 line-through">{formatPrice(product.regular_price)}</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>

            <div className="text-center mt-8">
              <Link
                href="/productos"
                className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold px-6 py-3 rounded-xl transition-colors shadow-md"
              >
                <ShoppingCart className="w-5 h-5" />
                Ver todos los productos
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      <section className="py-12 lg:py-16 bg-white border-t border-surface-200">
        <div className="container-custom max-w-3xl mx-auto">
          <h2 className="text-2xl font-extrabold text-gray-900 text-center mb-8">Preguntas frecuentes</h2>
          <div className="space-y-4">
            {[
              {
                q: '¿Necesito tener tarjeta de crédito para pagar con Nequi?',
                a: 'No. Nequi funciona con el saldo de tu cuenta o con tu cuenta de ahorros Bancolombia vinculada. No necesitas tarjeta de crédito.',
              },
              {
                q: '¿Hay un límite de monto para pagar con Nequi?',
                a: 'Nequi tiene límites de transacción según tu nivel de cuenta. Generalmente puedes hacer pagos de hasta $2.000.000 por transacción. Para montos mayores, puedes usar transferencia bancaria.',
              },
              {
                q: '¿El pago es inmediato?',
                a: 'Sí. Una vez confirmas el pago desde tu app Nequi, la transacción se procesa al instante y tu pedido entra en preparación.',
              },
              {
                q: '¿Puedo pagar a cuotas con Nequi?',
                a: 'Nequi procesa pagos de contado con el saldo disponible. Si necesitas pagar a cuotas, puedes usar tarjeta de crédito a través de MercadoPago (hasta 12 cuotas).',
              },
              {
                q: '¿Cómo solicito un reembolso?',
                a: 'Si necesitas un reembolso, el dinero se devuelve a tu cuenta Nequi en 3-5 días hábiles. Contáctanos por WhatsApp para gestionar la devolución.',
              },
            ].map((faq) => (
              <div key={faq.q} className="bg-surface-50 rounded-xl p-5">
                <div className="flex items-start gap-3">
                  <HelpCircle className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">{faq.q}</h3>
                    <p className="text-sm text-surface-600 leading-relaxed">{faq.a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 lg:py-16 bg-purple-50 border-t border-purple-100">
        <div className="container-custom text-center">
          <h2 className="text-2xl lg:text-3xl font-extrabold text-gray-900 font-display mb-3">
            ¿Listo para comprar con Nequi?
          </h2>
          <p className="text-surface-600 text-lg mb-6 max-w-md mx-auto">
            Miles de colombianos ya compran tecnología con Nequi en TecnoPhone.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/productos"
              className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold px-6 py-3.5 rounded-xl transition-colors shadow-md"
            >
              <ShoppingCart className="w-5 h-5" />
              Explorar productos
            </Link>
            <a
              href="https://wa.me/573132294533?text=Hola%2C%20quiero%20comprar%20tecnolog%C3%ADa%20pagando%20con%20Nequi"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white hover:bg-surface-50 text-gray-900 font-bold px-6 py-3.5 rounded-xl border border-surface-200 transition-colors"
            >
              <MessageCircle className="w-5 h-5 text-green-600" />
              Asesoría WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* SEO content */}
      <section className="py-10 lg:py-14 bg-white border-t border-surface-200">
        <div className="container-custom max-w-3xl mx-auto">
          <h2 className="text-xl font-extrabold text-gray-900 mb-4">Comprar tecnología con Nequi en Colombia</h2>
          <div className="prose prose-sm text-surface-700 max-w-none space-y-3">
            <p>
              Nequi es una de las billeteras digitales más populares de Colombia, con millones de usuarios activos. 
              En TecnoPhone aceptamos pagos con Nequi a través de la integración con MercadoPago, lo que te permite 
              comprar celulares, portátiles, audífonos y toda la tecnología que necesitas directamente desde tu celular.
            </p>
            <h3 className="text-lg font-bold text-gray-900 mt-6">¿Es seguro pagar con Nequi?</h3>
            <p>
              Sí. Nequi es vigilada por la Superintendencia Financiera de Colombia y opera bajo los estándares de 
              seguridad de Bancolombia. Las transacciones están protegidas con cifrado de extremo a extremo y 
              requieren autenticación biométrica o PIN desde tu app.
            </p>
            <h3 className="text-lg font-bold text-gray-900 mt-6">Ventajas de comprar en TecnoPhone</h3>
            <p>
              Todos nuestros productos incluyen factura electrónica DIAN, garantía oficial del fabricante y envío 
              a toda Colombia. Si pagas con Nequi, no tiene costo adicional: pagas exactamente el precio que ves.
            </p>
          </div>
        </div>
      </section>
    </div>
    </>
  );
}
