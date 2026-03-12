'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, ShoppingBag, XCircle, Clock, Loader2 } from 'lucide-react';
import { useCartStore } from '@/store/cart';
import { initMercadoPago, StatusScreen } from '@mercadopago/sdk-react';

let mpInitialized = false;

function ThankYouContent() {
  const clearCart = useCartStore((s) => s.clearCart);
  const searchParams = useSearchParams();
  const paymentId = searchParams.get('payment_id');
  const status = searchParams.get('status');
  const orderId = searchParams.get('order_id');

  useEffect(() => {
    // Initialize MP SDK for StatusScreen Brick
    const publicKey = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY;
    if (publicKey && !mpInitialized) {
      initMercadoPago(publicKey, { locale: 'es-CO' });
      mpInitialized = true;
    }
  }, []);

  useEffect(() => {
    // Clear cart on any successful arrival to this page
    if (paymentId || sessionStorage.getItem('pending_order')) {
      clearCart();
      sessionStorage.removeItem('pending_order');
    }
  }, [clearCart, paymentId]);

  const isApproved = status === 'approved';
  const isPending = status === 'pending' || status === 'in_process';

  return (
    <div className="container-custom py-16">
      <div className="max-w-2xl mx-auto text-center">
        {/* Status icon */}
        <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 ${
          isApproved ? 'bg-emerald-500/10' : isPending ? 'bg-yellow-500/10' : 'bg-red-500/10'
        }`}>
          {isApproved ? (
            <CheckCircle className="w-10 h-10 text-emerald-600" />
          ) : isPending ? (
            <Clock className="w-10 h-10 text-yellow-500" />
          ) : (
            <XCircle className="w-10 h-10 text-red-500" />
          )}
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {isApproved
            ? '¡Gracias por tu compra!'
            : isPending
              ? 'Pago en proceso'
              : 'Pago no aprobado'}
        </h1>
        <p className="text-surface-700 mb-2">
          {isApproved
            ? 'Tu pedido ha sido procesado exitosamente. Recibirás un correo con los detalles.'
            : isPending
              ? 'Tu pago está siendo procesado. Te notificaremos cuando se confirme.'
              : 'Hubo un problema con tu pago. Puedes intentar de nuevo.'}
        </p>

        {orderId && (
          <p className="text-sm text-surface-600 mb-6">Pedido #{orderId}</p>
        )}

        {/* MercadoPago StatusScreen Brick */}
        {paymentId && (
          <div className="my-8 text-left">
            <StatusScreen
              initialization={{ paymentId }}
              locale="es-CO"
            />
          </div>
        )}

        <Link
          href="/productos"
          className="inline-flex items-center gap-2 bg-primary-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-primary-600 transition-colors"
        >
          <ShoppingBag className="w-4 h-4" />
          Seguir Comprando
        </Link>
      </div>
    </div>
  );
}

export default function ThankYouPage() {
  return (
    <Suspense fallback={
      <div className="container-custom py-16 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    }>
      <ThankYouContent />
    </Suspense>
  );
}
