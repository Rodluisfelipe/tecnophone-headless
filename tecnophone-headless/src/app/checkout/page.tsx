'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChevronRight,
  ShoppingBag,
  User,
  Mail,
  Phone,
  MapPin,
  Building2,
  FileText,
  Loader2,
  Shield,
  Lock,
  Truck,
  CreditCard,
  ArrowLeft,
  CheckCircle,
} from 'lucide-react';
import { useCartStore } from '@/store/cart';
import { formatPrice } from '@/lib/woocommerce';
import PaymentBrick from '@/components/checkout/PaymentBrick';

type CheckoutStep = 'info' | 'payment';

interface OrderData {
  order_id: number;
  order_key: string;
  total: string;
}

const colombianDepartments = [
  'Amazonas', 'Antioquia', 'Arauca', 'Atlántico', 'Bolívar', 'Boyacá',
  'Caldas', 'Caquetá', 'Casanare', 'Cauca', 'Cesar', 'Chocó',
  'Córdoba', 'Cundinamarca', 'Guainía', 'Guaviare', 'Huila',
  'La Guajira', 'Magdalena', 'Meta', 'Nariño', 'Norte de Santander',
  'Putumayo', 'Quindío', 'Risaralda', 'San Andrés y Providencia',
  'Santander', 'Sucre', 'Tolima', 'Valle del Cauca', 'Vaupés', 'Vichada',
];

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalPrice, clearCart } = useCartStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<CheckoutStep>('info');
  const [orderData, setOrderData] = useState<OrderData | null>(null);

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address_1: '',
    city: '',
    state: '',
    note: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handlePaymentSuccess = useCallback(
    (paymentId: number, status: string) => {
      clearCart();
      router.push(
        `/checkout/gracias?payment_id=${paymentId}&status=${status}&order_id=${orderData?.order_id}`
      );
    },
    [clearCart, router, orderData]
  );

  const handlePaymentError = useCallback(
    (errorMsg: string) => {
      setError(errorMsg);
    },
    []
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (items.length === 0) {
      setError('Tu carrito está vacío');
      return;
    }

    // Validate required fields
    if (!form.first_name.trim() || !form.last_name.trim() || !form.email.trim() || !form.phone.trim() || !form.address_1.trim() || !form.city.trim() || !form.state) {
      setError('Por favor completa todos los campos obligatorios');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      setError('Por favor ingresa un correo electrónico válido');
      return;
    }

    // Validate Colombian phone (7-10 digits, optional +57 prefix)
    const phoneClean = form.phone.replace(/[\s\-()]/g, '');
    const phoneRegex = /^(\+?57)?[0-9]{7,10}$/;
    if (!phoneRegex.test(phoneClean)) {
      setError('Por favor ingresa un número de teléfono válido');
      return;
    }

    setLoading(true);

    try {
      // Verify stock in real-time before creating the order
      const stockRes = await fetch('/api/stock-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((item) => ({
            product_id: item.product.id,
            quantity: item.quantity,
            ...(item.variationId ? { variation_id: item.variationId } : {}),
          })),
        }),
      });
      const stockData = await stockRes.json();
      if (!stockData.valid && stockData.issues?.length) {
        const issueMsg = stockData.issues
          .map((i: { name: string; reason: string }) => `${i.name}: ${i.reason}`)
          .join('\n');
        setError(`Problemas de disponibilidad:\n${issueMsg}`);
        setLoading(false);
        return;
      }

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          billing: {
            first_name: form.first_name,
            last_name: form.last_name,
            email: form.email,
            phone: form.phone,
            address_1: form.address_1,
            city: form.city,
            state: form.state,
            country: 'CO',
          },
          line_items: items.map((item) => ({
            product_id: item.product.id,
            quantity: item.quantity,
            ...(item.variationId ? { variation_id: item.variationId } : {}),
          })),
          customer_note: form.note,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Error al procesar tu pedido');
        setLoading(false);
        return;
      }

      // Store order data and move to payment step
      setOrderData({
        order_id: data.order_id,
        order_key: data.order_key,
        total: data.total,
      });
      setStep('payment');
      setLoading(false);
    } catch {
      setError('Error de conexión. Verifica tu internet e intenta de nuevo.');
      setLoading(false);
    }
  };

  if (items.length === 0 && !loading) {
    return (
      <div className="container-custom py-16 text-center">
        <div className="max-w-md mx-auto">
          <div className="w-20 h-20 rounded-3xl bg-surface-100 flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="w-10 h-10 text-surface-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Tu carrito está vacío</h1>
          <p className="text-surface-700 mb-6">Agrega productos antes de ir al checkout</p>
          <Link
            href="/productos"
            className="inline-flex items-center gap-2 bg-primary-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-primary-600 transition-colors"
          >
            Ver Productos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      <div className="container-custom py-6 lg:py-10">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm text-surface-600 mb-6">
          <Link href="/" className="hover:text-primary-600 transition-colors">Inicio</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href="/productos" className="hover:text-primary-600 transition-colors">Productos</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-gray-900 font-medium">Checkout</span>
        </nav>

        <h1 className="text-2xl lg:text-3xl font-extrabold text-gray-900 mb-4">Finalizar Compra</h1>

        {/* Trust bar */}
        <div className="flex flex-wrap items-center gap-4 sm:gap-6 mb-8 p-3 bg-surface-100 rounded-xl border border-surface-200 text-xs text-surface-700">
          <span className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-emerald-600" /> Pago 100% seguro</span>
          <span className="flex items-center gap-1.5"><Truck className="w-3.5 h-3.5 text-primary-600" /> Envío asegurado</span>
          <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-amber-500" /> Garantía incluida</span>
          <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-surface-600" /> No necesitas crear cuenta</span>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-3 mb-8">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-colors ${
            step === 'info'
              ? 'bg-primary-500 text-white'
              : 'bg-emerald-500/10 text-emerald-600'
          }`}>
            {step === 'payment' ? <CheckCircle className="w-4 h-4" /> : <User className="w-4 h-4" />}
            1. Datos
          </div>
          <ChevronRight className="w-4 h-4 text-surface-500" />
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-colors ${
            step === 'payment'
              ? 'bg-primary-500 text-white'
              : 'bg-surface-100 text-surface-600'
          }`}>
            <CreditCard className="w-4 h-4" />
            2. Pago
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-3 gap-8">
            {/* LEFT: Form / Payment */}
            <div className="lg:col-span-2 space-y-6">
              {step === 'info' && (
                <>
                  {/* Billing */}
                  <div className="bg-surface-100 rounded-2xl border border-surface-200 p-6">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-5">
                      <User className="w-5 h-5 text-primary-600" />
                      Datos de Facturación
                    </h2>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-surface-800 mb-1.5">
                      Nombre <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="first_name"
                      value={form.first_name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-surface-300 rounded-xl bg-white text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all placeholder:text-surface-500"
                      placeholder="Tu nombre"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-surface-800 mb-1.5">
                      Apellido <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="last_name"
                      value={form.last_name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-surface-300 rounded-xl bg-white text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all placeholder:text-surface-500"
                      placeholder="Tu apellido"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-semibold text-surface-800 mb-1.5">
                      <Mail className="w-3.5 h-3.5 inline mr-1" />
                      Correo electrónico <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-surface-300 rounded-xl bg-white text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all placeholder:text-surface-500"
                      placeholder="correo@ejemplo.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-surface-800 mb-1.5">
                      <Phone className="w-3.5 h-3.5 inline mr-1" />
                      Teléfono <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-surface-300 rounded-xl bg-white text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all placeholder:text-surface-500"
                      placeholder="300 123 4567"
                    />
                  </div>
                </div>
              </div>

              {/* Shipping */}
              <div className="bg-surface-100 rounded-2xl border border-surface-200 p-6">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-5">
                  <MapPin className="w-5 h-5 text-primary-600" />
                  Dirección de Envío
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-surface-800 mb-1.5">
                      Dirección <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="address_1"
                      value={form.address_1}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-surface-300 rounded-xl bg-white text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all placeholder:text-surface-500"
                      placeholder="Calle 123 #45-67, Apto 101"
                    />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-surface-800 mb-1.5">
                        <Building2 className="w-3.5 h-3.5 inline mr-1" />
                        Ciudad <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="city"
                        value={form.city}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-surface-300 rounded-xl bg-white text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all placeholder:text-surface-500"
                        placeholder="Bogotá"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-surface-800 mb-1.5">
                        Departamento <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="state"
                        value={form.state}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-surface-300 rounded-xl bg-white text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                      >
                        <option value="">Seleccionar...</option>
                        {colombianDepartments.map((dept) => (
                          <option key={dept} value={dept}>{dept}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="bg-surface-100 rounded-2xl border border-surface-200 p-6">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-5">
                  <FileText className="w-5 h-5 text-primary-600" />
                  Notas del Pedido
                  <span className="text-sm font-normal text-surface-600">(opcional)</span>
                </h2>
                <textarea
                  name="note"
                  value={form.note}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-3 border border-surface-300 rounded-xl bg-white text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all resize-none placeholder:text-surface-500"
                  placeholder="Instrucciones de entrega, horario preferido, etc."
                />
              </div>
                </>
              )}

              {step === 'payment' && orderData && (
                <>
                  {/* Back button */}
                  <button
                    type="button"
                    onClick={() => setStep('info')}
                    className="flex items-center gap-2 text-sm text-primary-600 font-semibold hover:underline"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Volver a editar datos
                  </button>

                  {/* Billing summary */}
                  <div className="bg-surface-100 rounded-2xl border border-surface-200 p-6">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                      Datos de Envío
                    </h2>
                    <div className="grid sm:grid-cols-2 gap-3 text-sm text-surface-700">
                      <p><span className="font-semibold text-gray-900">Nombre:</span> {form.first_name} {form.last_name}</p>
                      <p><span className="font-semibold text-gray-900">Email:</span> {form.email}</p>
                      <p><span className="font-semibold text-gray-900">Teléfono:</span> {form.phone}</p>
                      <p><span className="font-semibold text-gray-900">Ciudad:</span> {form.city}, {form.state}</p>
                      <p className="sm:col-span-2"><span className="font-semibold text-gray-900">Dirección:</span> {form.address_1}</p>
                    </div>
                  </div>

                  {/* Payment Brick */}
                  <div className="bg-surface-100 rounded-2xl border border-surface-200 p-6">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-5">
                      <CreditCard className="w-5 h-5 text-primary-600" />
                      Método de Pago
                    </h2>
                    <PaymentBrick
                      amount={parseFloat(orderData.total)}
                      orderId={orderData.order_id}
                      orderKey={orderData.order_key}
                      payerEmail={form.email}
                      payerFirstName={form.first_name}
                      payerLastName={form.last_name}
                      onPaymentSuccess={handlePaymentSuccess}
                      onPaymentError={handlePaymentError}
                    />
                  </div>
                </>
              )}
            </div>

            {/* RIGHT: Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-surface-100 rounded-2xl border border-surface-200 p-6 sticky top-24">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-5">
                  <ShoppingBag className="w-5 h-5 text-primary-600" />
                  Resumen del Pedido
                </h2>

                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {items.map((item) => (
                    <div
                      key={`${item.product.id}-${item.variationId || 0}`}
                      className="flex gap-3 p-2 rounded-xl"
                    >
                      <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-surface-200 flex-shrink-0 border border-surface-300">
                        {item.product.images[0] ? (
                          <Image
                            src={item.product.images[0].src}
                            alt={item.product.name}
                            fill
                            className="object-contain p-1"
                            sizes="56px"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-surface-500">
                            <ShoppingBag className="w-5 h-5" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 line-clamp-2">
                          {item.product.name}
                        </p>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-xs text-surface-600">×{item.quantity}</span>
                          <span className="text-sm font-bold text-primary-600">
                            {formatPrice(
                              (item.variation
                                ? parseFloat(item.variation.price)
                                : parseFloat(item.product.price)) * item.quantity
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-surface-200 mt-4 pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-surface-700">Subtotal</span>
                    <span className="font-semibold text-gray-900">{formatPrice(totalPrice())}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-surface-700 flex items-center gap-1">
                      <Truck className="w-3.5 h-3.5" /> Envío
                    </span>
                    <span className="text-emerald-600 font-semibold text-xs">Calculado al pagar</span>
                  </div>
                  <div className="flex justify-between text-lg font-extrabold pt-2 border-t border-surface-200">
                    <span className="text-gray-900">Total</span>
                    <span className="text-primary-600">{formatPrice(totalPrice())}</span>
                  </div>
                </div>

                {error && (
                  <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-500 font-medium">
                    {error}
                  </div>
                )}

                {step === 'info' && (
                  <>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full mt-5 bg-primary-500 text-white py-4 rounded-xl font-bold text-base shadow-lg shadow-primary-500/25 hover:shadow-xl hover:bg-primary-600 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Creando pedido...
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-4 h-4" />
                          Continuar al Pago
                        </>
                      )}
                    </button>

                    <div className="mt-4 space-y-3">
                      <div className="flex items-center justify-center gap-4 text-xs text-surface-600">
                        <span className="flex items-center gap-1">
                          <Shield className="w-3.5 h-3.5" /> Pago seguro
                        </span>
                        <span className="flex items-center gap-1">
                          <Lock className="w-3.5 h-3.5" /> SSL encriptado
                        </span>
                      </div>
                      <p className="text-[10px] text-center text-surface-600">
                        Procesado de forma segura por MercadoPago. No almacenamos tus datos de pago.
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
