import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';

const ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;

// ── Simple in-memory rate limiter ──
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 5; // max 5 payment attempts per minute per IP

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  entry.count++;
  if (entry.count > RATE_LIMIT_MAX) return true;
  return false;
}

// Periodic cleanup of old entries
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    rateLimitMap.forEach((v, k) => {
      if (now > v.resetAt) rateLimitMap.delete(k);
    });
  }, 60_000);
}

interface PaymentBody {
  token: string;
  issuer_id: string;
  payment_method_id: string;
  transaction_amount: number;
  installments: number;
  payer: {
    email: string;
    identification?: {
      type: string;
      number: string;
    };
  };
  // WooCommerce order data
  order_id: number;
  order_key: string;
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting by IP
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Demasiados intentos. Espera un momento antes de intentar de nuevo.' },
        { status: 429 }
      );
    }

    if (!ACCESS_TOKEN) {
      console.error('[Payments] Missing MP_ACCESS_TOKEN');
      return NextResponse.json(
        { error: 'Error de configuración del servidor' },
        { status: 500 }
      );
    }

    const body: PaymentBody = await request.json();

    if (!body.token || !body.transaction_amount || !body.payer?.email) {
      return NextResponse.json(
        { error: 'Datos de pago incompletos' },
        { status: 400 }
      );
    }

    const client = new MercadoPagoConfig({ accessToken: ACCESS_TOKEN });
    const payment = new Payment(client);

    const result = await payment.create({
      body: {
        token: body.token,
        issuer_id: Number(body.issuer_id),
        payment_method_id: body.payment_method_id,
        transaction_amount: body.transaction_amount,
        installments: body.installments,
        payer: {
          email: body.payer.email,
          identification: body.payer.identification,
        },
        metadata: {
          order_id: body.order_id,
          order_key: body.order_key,
        },
      },
    });

    // If payment approved, update WooCommerce order status
    if (result.status === 'approved') {
      await updateWCOrderStatus(body.order_id, 'processing', result.id?.toString());
    } else if (result.status === 'in_process' || result.status === 'pending') {
      await updateWCOrderStatus(body.order_id, 'on-hold', result.id?.toString());
    }

    return NextResponse.json({
      status: result.status,
      status_detail: result.status_detail,
      id: result.id,
    });
  } catch (error) {
    console.error('[Payments] Error:', error);
    return NextResponse.json(
      { error: 'Error al procesar el pago' },
      { status: 500 }
    );
  }
}

async function updateWCOrderStatus(
  orderId: number,
  status: string,
  paymentId?: string
) {
  const WP_URL = process.env.NEXT_PUBLIC_WORDPRESS_URL || 'https://www.tecnophone.co';
  const CK = process.env.WC_CONSUMER_KEY;
  const CS = process.env.WC_CONSUMER_SECRET;

  if (!CK || !CS) return;

  try {
    const authHeader = 'Basic ' + Buffer.from(`${CK}:${CS}`).toString('base64');
    await fetch(`${WP_URL}/wp-json/wc/v3/orders/${orderId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify({
        status,
        set_paid: status === 'processing',
        transaction_id: paymentId || '',
      }),
    });
  } catch (err) {
    console.error('[Payments] Failed to update WC order:', err);
  }
}
