'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  PackageSearch,
  Loader2,
  MapPin,
  Calendar,
  Truck,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShoppingCart,
  Phone,
  MessageCircle,
  Package,
  Shield,
  HelpCircle,
} from 'lucide-react';

interface TrackingResult {
  exito: boolean;
  guia: string;
  estado: string;
  origen: string | null;
  destino: string | null;
  fechaEnvio: string | null;
  fechaEntrega: string | null;
  primerosMovimientos: Array<{
    descripcion: string;
    fecha: string;
    ubicacion: string;
  }>;
  totalMovimientos: number;
  error?: string;
}

export default function RastrearEnvioClient() {
  const [guia, setGuia] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TrackingResult | null>(null);
  const [error, setError] = useState('');

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: '¿Cuánto tarda un envío de TecnoPhone?',
        acceptedAnswer: { '@type': 'Answer', text: 'Los envíos a ciudades principales tardan 1-2 días hábiles. A municipios intermedios 2-3 días. Zonas rurales pueden tardar hasta 5 días hábiles.' },
      },
      {
        '@type': 'Question',
        name: '¿Dónde encuentro mi número de guía de TecnoPhone?',
        acceptedAnswer: { '@type': 'Answer', text: 'Tu número de guía se envía por correo electrónico y WhatsApp una vez que el pedido es despachado. También puedes consultarlo con nuestro equipo de soporte.' },
      },
      {
        '@type': 'Question',
        name: '¿Qué pasa si mi pedido de TecnoPhone no llega?',
        acceptedAnswer: { '@type': 'Answer', text: 'Si tu pedido no llega en el tiempo estimado, contáctanos por WhatsApp al +57 313 229 4533. Rastreamos tu paquete y te damos una solución inmediata.' },
      },
      {
        '@type': 'Question',
        name: '¿Puedo cambiar la dirección de entrega?',
        acceptedAnswer: { '@type': 'Answer', text: 'Si el pedido aún no ha sido despachado, sí podemos actualizar la dirección. Contáctanos lo antes posible por WhatsApp.' },
      },
    ],
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = guia.trim();
    if (!trimmed) return;
    if (!/^\d{6,30}$/.test(trimmed)) {
      setError('Ingresa un número de guía válido (solo dígitos, entre 6 y 30 caracteres).');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch(`/api/tracking?guia=${encodeURIComponent(trimmed)}`);
      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.error || 'No se pudo consultar la guía.');
      } else if (!data.exito) {
        setError(data.error || 'No se encontró información para esta guía.');
      } else {
        setResult(data);
      }
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const estadoColor = result
    ? /entregad|recibid/i.test(result.estado)
      ? 'text-green-600 bg-green-50'
      : /tr.nsito|camino|reparto/i.test(result.estado)
        ? 'text-blue-600 bg-blue-50'
        : 'text-amber-600 bg-amber-50'
    : '';

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <div className="min-h-screen bg-gradient-to-b from-surface-50 to-white">
      {/* Hero + Search */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-indigo-50" />
        <div className="relative container-custom py-12 lg:py-20">
          <div className="max-w-2xl mx-auto text-center">
            <span className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 text-sm font-bold px-4 py-1.5 rounded-full mb-5">
              <Truck className="w-4 h-4" />
              Seguimiento en tiempo real
            </span>
            <h1 className="text-3xl lg:text-5xl font-extrabold text-gray-900 font-display mb-4">
              Rastrear tu Envío
            </h1>
            <p className="text-surface-600 text-lg mb-8">
              Ingresa tu número de guía para conocer el estado de tu pedido TecnoPhone.
            </p>

            {/* Search form */}
            <form onSubmit={handleSubmit} className="max-w-lg mx-auto">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <PackageSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Número de guía (ej: 1234567890)"
                    value={guia}
                    onChange={(e) => {
                      setGuia(e.target.value);
                      setError('');
                    }}
                    className="w-full pl-11 pr-4 py-4 border border-surface-300 rounded-xl text-lg font-semibold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !guia.trim()}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-surface-300 text-white font-bold px-6 py-4 rounded-xl transition-colors flex items-center gap-2 shrink-0"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Truck className="w-5 h-5" />}
                  Rastrear
                </button>
              </div>
            </form>

            {/* Error */}
            {error && (
              <div className="mt-4 flex items-center gap-2 justify-center text-red-600 bg-red-50 rounded-xl px-4 py-3 max-w-lg mx-auto">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span className="text-sm font-semibold">{error}</span>
              </div>
            )}

            {/* Result */}
            {result && (
              <div className="mt-6 max-w-lg mx-auto text-left bg-white rounded-2xl shadow-lg border border-surface-200 overflow-hidden">
                {/* Status header */}
                <div className={`p-4 ${estadoColor} border-b`}>
                  <div className="flex items-center gap-2">
                    {/entregad|recibid/i.test(result.estado) ? (
                      <CheckCircle2 className="w-6 h-6" />
                    ) : (
                      <Truck className="w-6 h-6" />
                    )}
                    <div>
                      <div className="font-extrabold text-lg">{result.estado}</div>
                      <div className="text-sm opacity-80">Guía: {result.guia}</div>
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className="p-4 space-y-3">
                  {result.origen && (
                    <div className="flex items-center gap-3 text-sm">
                      <MapPin className="w-4 h-4 text-surface-400 shrink-0" />
                      <span className="text-surface-600">Origen: <strong className="text-gray-900">{result.origen}</strong></span>
                    </div>
                  )}
                  {result.destino && (
                    <div className="flex items-center gap-3 text-sm">
                      <MapPin className="w-4 h-4 text-blue-500 shrink-0" />
                      <span className="text-surface-600">Destino: <strong className="text-gray-900">{result.destino}</strong></span>
                    </div>
                  )}
                  {result.fechaEnvio && (
                    <div className="flex items-center gap-3 text-sm">
                      <Calendar className="w-4 h-4 text-surface-400 shrink-0" />
                      <span className="text-surface-600">Enviado: <strong className="text-gray-900">{result.fechaEnvio}</strong></span>
                    </div>
                  )}
                  {result.fechaEntrega && (
                    <div className="flex items-center gap-3 text-sm">
                      <Calendar className="w-4 h-4 text-green-500 shrink-0" />
                      <span className="text-surface-600">Entregado: <strong className="text-gray-900">{result.fechaEntrega}</strong></span>
                    </div>
                  )}

                  {/* Movements timeline */}
                  {result.primerosMovimientos.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-surface-200">
                      <h3 className="text-sm font-bold text-gray-900 mb-3">Movimientos</h3>
                      <div className="space-y-3">
                        {result.primerosMovimientos.map((mov, i) => (
                          <div key={i} className="flex gap-3">
                            <div className="flex flex-col items-center">
                              <div className={`w-2.5 h-2.5 rounded-full ${i === 0 ? 'bg-blue-500' : 'bg-surface-300'}`} />
                              {i < result.primerosMovimientos.length - 1 && <div className="w-0.5 flex-1 bg-surface-200 mt-1" />}
                            </div>
                            <div className="pb-3">
                              <p className="text-sm font-semibold text-gray-900">{mov.descripcion}</p>
                              <p className="text-xs text-surface-500">{mov.fecha} — {mov.ubicacion}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      {result.totalMovimientos > result.primerosMovimientos.length && (
                        <p className="text-xs text-surface-500 mt-2">+ {result.totalMovimientos - result.primerosMovimientos.length} movimientos anteriores</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-12 lg:py-16 bg-white border-t border-surface-200">
        <div className="container-custom max-w-3xl mx-auto">
          <h2 className="text-2xl font-extrabold text-gray-900 text-center mb-8">Preguntas frecuentes sobre envíos</h2>
          <div className="space-y-4">
            {[
              {
                icon: Clock,
                q: '¿Cuánto tarda mi envío?',
                a: 'Los envíos a ciudades principales tardan 1-2 días hábiles. A municipios intermedios 2-3 días. Zonas rurales pueden tardar hasta 5 días hábiles.',
              },
              {
                icon: Package,
                q: '¿Dónde encuentro mi número de guía?',
                a: 'Tu número de guía se envía por correo electrónico y WhatsApp una vez que el pedido es despachado. También puedes consultarlo con nuestro equipo de soporte.',
              },
              {
                icon: Shield,
                q: '¿Qué pasa si mi pedido no llega?',
                a: 'Si tu pedido no llega en el tiempo estimado, contáctanos por WhatsApp al +57 313 229 4533. Rastreamos tu paquete y te damos una solución inmediata.',
              },
              {
                icon: HelpCircle,
                q: '¿Puedo cambiar la dirección de entrega?',
                a: 'Si el pedido aún no ha sido despachado, sí podemos actualizar la dirección. Contáctanos lo antes posible por WhatsApp.',
              },
            ].map((faq) => {
              const Icon = faq.icon;
              return (
                <div key={faq.q} className="bg-surface-50 rounded-xl p-5">
                  <div className="flex items-start gap-3">
                    <Icon className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-bold text-gray-900 mb-1">{faq.q}</h3>
                      <p className="text-sm text-surface-600 leading-relaxed">{faq.a}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Contact + CTA */}
      <section className="py-12 lg:py-16 bg-surface-50 border-t border-surface-200">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto grid sm:grid-cols-2 gap-4">
            <a
              href="https://wa.me/573132294533?text=Hola%2C%20necesito%20ayuda%20con%20mi%20env%C3%ADo"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 bg-white rounded-xl border border-surface-200 hover:border-green-300 hover:shadow-md p-5 transition-all group"
            >
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-green-100 transition-colors">
                <MessageCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="font-bold text-gray-900">¿Problema con tu envío?</p>
                <p className="text-sm text-surface-600">Escríbenos por WhatsApp</p>
              </div>
            </a>
            <Link
              href="/productos"
              className="flex items-center gap-3 bg-white rounded-xl border border-surface-200 hover:border-primary-300 hover:shadow-md p-5 transition-all group"
            >
              <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-primary-100 transition-colors">
                <ShoppingCart className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <p className="font-bold text-gray-900">Seguir comprando</p>
                <p className="text-sm text-surface-600">Ver todos los productos</p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* SEO content */}
      <section className="py-10 lg:py-14 bg-white border-t border-surface-200">
        <div className="container-custom max-w-3xl mx-auto">
          <h2 className="text-xl font-extrabold text-gray-900 mb-4">Cómo rastrear tu envío de TecnoPhone</h2>
          <div className="prose prose-sm text-surface-700 max-w-none space-y-3">
            <p>
              En TecnoPhone realizamos envíos a toda Colombia a través de transportadoras certificadas. 
              Una vez que tu pedido es despachado, recibes un número de guía por correo electrónico y WhatsApp 
              que puedes usar en esta página para consultar el estado de tu envío en tiempo real.
            </p>
            <h3 className="text-lg font-bold text-gray-900 mt-6">Estados de envío</h3>
            <p>
              <strong>En preparación:</strong> Tu pedido está siendo empaquetado en nuestro centro de distribución.<br />
              <strong>En tránsito:</strong> El paquete ya fue recogido por la transportadora y está en camino.<br />
              <strong>En reparto:</strong> Tu paquete está en la ciudad de destino y será entregado hoy.<br />
              <strong>Entregado:</strong> El paquete fue entregado exitosamente.
            </p>
            <h3 className="text-lg font-bold text-gray-900 mt-6">Cobertura de envíos</h3>
            <p>
              Enviamos a todas las ciudades y municipios de Colombia. Las principales ciudades (Bogotá, Medellín, 
              Cali, Barranquilla, Bucaramanga, Cartagena) tienen entrega en 1-2 días hábiles. El resto del país 
              en 2-5 días hábiles según la zona.
            </p>
          </div>
        </div>
      </section>
    </div>
    </>
  );
}
