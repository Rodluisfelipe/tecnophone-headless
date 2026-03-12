'use client';

import { useEffect, useState, useCallback } from 'react';
import { initMercadoPago, Payment } from '@mercadopago/sdk-react';
import { Loader2 } from 'lucide-react';

interface PaymentBrickProps {
  amount: number;
  orderId: number;
  orderKey: string;
  payerEmail: string;
  payerFirstName: string;
  payerLastName: string;
  onPaymentSuccess: (paymentId: number, status: string) => void;
  onPaymentError: (error: string) => void;
}

let mpInitialized = false;

export default function PaymentBrick({
  amount,
  orderId,
  orderKey,
  payerEmail,
  payerFirstName,
  payerLastName,
  onPaymentSuccess,
  onPaymentError,
}: PaymentBrickProps) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const publicKey = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY;
    if (!publicKey) {
      onPaymentError('Falta la configuración de MercadoPago (public key)');
      return;
    }
    if (!mpInitialized) {
      initMercadoPago(publicKey, { locale: 'es-CO' });
      mpInitialized = true;
    }
  }, [onPaymentError]);

  const handleOnSubmit = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async (param: any) => {
      const { formData } = param;

      try {
        const res = await fetch('/api/payments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: formData.token,
            issuer_id: formData.issuer_id,
            payment_method_id: formData.payment_method_id,
            transaction_amount: formData.transaction_amount,
            installments: formData.installments,
            payer: formData.payer,
            order_id: orderId,
            order_key: orderKey,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          onPaymentError(data.error || 'Error al procesar el pago');
          return;
        }

        onPaymentSuccess(data.id, data.status);
      } catch {
        onPaymentError('Error de conexión al procesar el pago');
      }
    },
    [orderId, orderKey, onPaymentError, onPaymentSuccess]
  );

  const handleOnReady = useCallback(() => {
    setReady(true);
  }, []);

  const handleOnError = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (error: any) => {
      console.error('[PaymentBrick] Error:', error);
      onPaymentError('Error al cargar el formulario de pago');
    },
    [onPaymentError]
  );

  return (
    <div className="relative">
      {!ready && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
          <span className="ml-3 text-surface-700">Cargando formulario de pago...</span>
        </div>
      )}
      <div className={ready ? '' : 'opacity-0 h-0 overflow-hidden'}>
        <Payment
          initialization={{
            amount,
            payer: {
              email: payerEmail,
              firstName: payerFirstName,
              lastName: payerLastName,
            },
          }}
          customization={{
            paymentMethods: {
              maxInstallments: 12,
              prepaidCard: 'all',
            },
            visual: {
              style: {
                theme: 'default',
                customVariables: {
                  formBackgroundColor: '#ffffff',
                  baseColor: '#3b82f6',
                },
              },
            },
          }}
          onSubmit={handleOnSubmit}
          onReady={handleOnReady}
          onError={handleOnError}
          locale="es-CO"
        />
      </div>
    </div>
  );
}
