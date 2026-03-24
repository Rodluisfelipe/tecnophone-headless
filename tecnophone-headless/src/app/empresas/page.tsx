'use client';

import { useState } from 'react';
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
} from 'lucide-react';

const benefits = [
  {
    icon: BadgePercent,
    title: 'Descuentos por volumen',
    desc: 'Precios especiales para compras corporativas. A mayor cantidad, mayor descuento.',
  },
  {
    icon: Shield,
    title: 'Garantía extendida',
    desc: 'Garantía oficial en todos los equipos con soporte técnico prioritario.',
  },
  {
    icon: Truck,
    title: 'Envío a toda Colombia',
    desc: 'Entregamos en tu oficina o sede. Envío gratis para pedidos corporativos.',
  },
  {
    icon: Users,
    title: 'Asesor dedicado',
    desc: 'Un ejecutivo de cuenta exclusivo que conoce las necesidades de tu empresa.',
  },
  {
    icon: Clock,
    title: 'Entrega rápida',
    desc: 'Despacho prioritario para empresas. Bogotá mismo día, resto del país 1-3 días.',
  },
  {
    icon: Monitor,
    title: 'Dotación completa',
    desc: 'Portátiles, monitores, periféricos, redes. Todo lo que tu equipo necesita.',
  },
];

const categories = [
  { icon: Laptop, name: 'Portátiles corporativos', desc: 'HP, Dell, Lenovo — desde gama entrada hasta workstations' },
  { icon: Monitor, name: 'Monitores y pantallas', desc: 'Full HD, 4K, ultrawide para productividad' },
  { icon: Headphones, name: 'Periféricos y accesorios', desc: 'Teclados, mouse, audífonos, webcams, docking stations' },
  { icon: Building2, name: 'Mobiliario tecnológico', desc: 'Sillas, escritorios y accesorios ergonómicos' },
];

export default function EmpresasPage() {
  const [form, setForm] = useState({
    empresa: '',
    contacto: '',
    telefono: '',
    empleados: '',
    necesidad: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const msg = [
      `Hola, soy ${form.contacto} de *${form.empresa}*.`,
      form.empleados ? `Somos aproximadamente ${form.empleados} empleados.` : '',
      form.necesidad ? `Necesitamos: ${form.necesidad}` : '',
      form.telefono ? `Mi teléfono: ${form.telefono}` : '',
      'Me gustaría recibir una cotización corporativa.',
    ]
      .filter(Boolean)
      .join('\n');

    window.open(
      `https://wa.me/573132294533?text=${encodeURIComponent(msg)}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  return (
    <div className="min-h-screen">
      {/* HERO */}
      <section className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj48cGF0aCBkPSJNMzYgMzRoLTJWMGgydjM0em0tNCAwVjBoMnYzNGgtMnoiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iLjAzIi8+PC9nPjwvc3ZnPg==')] opacity-40" />
        <div className="container-custom relative py-16 lg:py-24">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white/90 px-4 py-1.5 rounded-full text-sm font-semibold mb-6">
              <Building2 className="w-4 h-4" />
              Soluciones Corporativas
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight mb-6 font-display">
              Equipa tu empresa con la{' '}
              <span className="text-amber-300">mejor tecnología</span>{' '}
              a precios especiales
            </h1>
            <p className="text-lg lg:text-xl text-white/80 mb-8 max-w-2xl">
              Renueva el mobiliario tecnológico de tu equipo con descuentos exclusivos para empresas.
              Portátiles, monitores, periféricos y más con garantía oficial y soporte dedicado.
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                href="#cotizar"
                className="inline-flex items-center gap-2 bg-white text-primary-700 px-6 py-3.5 rounded-xl font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
              >
                Solicitar cotización
                <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="https://wa.me/573132294533?text=Hola%2C%20soy%20de%20una%20empresa%20y%20me%20interesa%20una%20cotizaci%C3%B3n%20corporativa"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-green-500 text-white px-6 py-3.5 rounded-xl font-bold hover:bg-green-600 transition-all"
              >
                <MessageCircle className="w-4 h-4" />
                WhatsApp directo
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* STATS BAR */}
      <section className="bg-white border-b border-surface-200">
        <div className="container-custom py-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
            {[
              { value: '500+', label: 'Empresas atendidas' },
              { value: 'Hasta 30%', label: 'Descuento corporativo' },
              { value: '1-3 días', label: 'Entrega a nivel nacional' },
              { value: '100%', label: 'Garantía oficial' },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-2xl lg:text-3xl font-extrabold text-primary-600 font-display">{stat.value}</p>
                <p className="text-sm text-surface-700 font-semibold mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section className="bg-surface-50 py-16 lg:py-20">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-2xl lg:text-3xl font-extrabold text-gray-900 font-display mb-3">
              ¿Por qué elegir TecnoPhone para tu empresa?
            </h2>
            <p className="text-surface-700 max-w-2xl mx-auto">
              Más que un proveedor, somos tu aliado tecnológico. Ofrecemos soluciones integrales para empresas de todos los tamaños.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((b) => {
              const Icon = b.icon;
              return (
                <div
                  key={b.title}
                  className="bg-white rounded-2xl p-6 border border-surface-200 hover:border-primary-200 hover:shadow-lg hover:shadow-primary-500/5 transition-all group"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary-50 group-hover:bg-primary-100 flex items-center justify-center mb-4 transition-colors">
                    <Icon className="w-6 h-6 text-primary-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{b.title}</h3>
                  <p className="text-sm text-surface-700 leading-relaxed">{b.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* PRODUCT CATEGORIES */}
      <section className="bg-white py-16 lg:py-20">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-2xl lg:text-3xl font-extrabold text-gray-900 font-display mb-3">
              Todo lo que tu equipo necesita
            </h2>
            <p className="text-surface-700 max-w-2xl mx-auto">
              Desde un solo portátil hasta la dotación completa de toda tu oficina.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-5 max-w-3xl mx-auto">
            {categories.map((cat) => {
              const Icon = cat.icon;
              return (
                <div
                  key={cat.name}
                  className="flex items-start gap-4 bg-surface-50 rounded-2xl p-5 border border-surface-200"
                >
                  <div className="w-11 h-11 rounded-xl bg-primary-500/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">{cat.name}</h3>
                    <p className="text-sm text-surface-700">{cat.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="text-center mt-8">
            <Link
              href="/productos"
              className="inline-flex items-center gap-2 text-primary-600 font-bold hover:text-primary-700 transition-colors"
            >
              Ver todo el catálogo
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-surface-50 py-16 lg:py-20">
        <div className="container-custom">
          <h2 className="text-2xl lg:text-3xl font-extrabold text-gray-900 font-display text-center mb-12">
            ¿Cómo funciona?
          </h2>
          <div className="grid sm:grid-cols-3 gap-8 max-w-3xl mx-auto">
            {[
              { step: '1', title: 'Cuéntanos qué necesitas', desc: 'Llena el formulario o escríbenos por WhatsApp con los requerimientos de tu empresa.' },
              { step: '2', title: 'Recibe tu cotización', desc: 'En menos de 24 horas te enviamos una propuesta con precios especiales corporativos.' },
              { step: '3', title: 'Recibe en tu oficina', desc: 'Coordinamos la entrega, instalación y configuración de los equipos.' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-14 h-14 rounded-full bg-primary-600 text-white text-xl font-extrabold flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary-500/20">
                  {item.step}
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-surface-700">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT FORM */}
      <section id="cotizar" className="bg-white py-16 lg:py-20">
        <div className="container-custom">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-2xl lg:text-3xl font-extrabold text-gray-900 font-display mb-3">
                Solicita tu cotización corporativa
              </h2>
              <p className="text-surface-700">
                Completa el formulario y te contactamos por WhatsApp con una propuesta personalizada.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="bg-surface-50 rounded-2xl border border-surface-200 p-6 lg:p-8 space-y-5">
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="empresa" className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Nombre de la empresa *
                  </label>
                  <input
                    id="empresa"
                    name="empresa"
                    type="text"
                    required
                    maxLength={100}
                    value={form.empresa}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-surface-300 bg-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                    placeholder="Ej: Mi Empresa SAS"
                  />
                </div>
                <div>
                  <label htmlFor="contacto" className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Nombre de contacto *
                  </label>
                  <input
                    id="contacto"
                    name="contacto"
                    type="text"
                    required
                    maxLength={80}
                    value={form.contacto}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-surface-300 bg-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                    placeholder="Tu nombre"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="telefono" className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Teléfono / Celular
                  </label>
                  <input
                    id="telefono"
                    name="telefono"
                    type="tel"
                    maxLength={15}
                    value={form.telefono}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-surface-300 bg-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                    placeholder="300 123 4567"
                  />
                </div>
                <div>
                  <label htmlFor="empleados" className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Cantidad de empleados
                  </label>
                  <select
                    id="empleados"
                    name="empleados"
                    value={form.empleados}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-surface-300 bg-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                  >
                    <option value="">Seleccionar</option>
                    <option value="1-10">1 - 10</option>
                    <option value="11-50">11 - 50</option>
                    <option value="51-200">51 - 200</option>
                    <option value="200+">200+</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="necesidad" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  ¿Qué necesitas? *
                </label>
                <textarea
                  id="necesidad"
                  name="necesidad"
                  required
                  maxLength={500}
                  rows={4}
                  value={form.necesidad}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-surface-300 bg-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all resize-none"
                  placeholder="Ej: Necesitamos 20 portátiles para nuestra oficina, monitores de 24 pulgadas y teclados inalámbricos..."
                />
              </div>

              <button
                type="submit"
                className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-green-500/20 hover:-translate-y-0.5"
              >
                <MessageCircle className="w-5 h-5" />
                Enviar por WhatsApp
              </button>

              <p className="text-xs text-center text-surface-600">
                Al enviar, serás redirigido a WhatsApp con tu solicitud. Respondemos en menos de 2 horas en horario laboral.
              </p>
            </form>

            {/* Direct contact */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 text-sm">
              <a
                href="https://wa.me/573132294533?text=Hola%2C%20soy%20de%20una%20empresa%20y%20necesito%20una%20cotizaci%C3%B3n"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-green-600 hover:text-green-700 font-semibold transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                +57 313 229 4533
              </a>
              <span className="text-surface-400 hidden sm:inline">|</span>
              <a
                href="tel:+573132294533"
                className="flex items-center gap-2 text-surface-700 hover:text-primary-600 font-semibold transition-colors"
              >
                <Phone className="w-4 h-4" />
                Llamar directamente
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST */}
      <section className="bg-surface-50 border-t border-surface-200 py-12">
        <div className="container-custom">
          <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-surface-700">
            {[
              { icon: CheckCircle2, text: 'Facturación electrónica' },
              { icon: Shield, text: 'Garantía oficial' },
              { icon: Truck, text: 'Envío a todo Colombia' },
              { icon: Clock, text: 'Soporte prioritario' },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.text} className="flex items-center gap-2">
                  <Icon className="w-5 h-5 text-primary-600" />
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
