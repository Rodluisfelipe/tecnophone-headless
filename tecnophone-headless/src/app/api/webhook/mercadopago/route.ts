import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { createHmac, timingSafeEqual } from 'crypto';

const ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
const MP_WEBHOOK_SECRET = process.env.MP_WEBHOOK_SECRET || '';

/**
 * MercadoPago IPN/Webhook handler.
 * Receives payment status notifications and updates WooCommerce order accordingly.
 * Configure this URL in MercadoPago Dashboard → Webhooks:
 *   https://tu-dominio.com/api/webhook/mercadopago
 */
export async function POST(request: NextRequest) {
  try {
    if (!ACCESS_TOKEN) {
      console.error('[MP Webhook] Missing MP_ACCESS_TOKEN');
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
    }

    // Validate signature — reject if secret is not configured
    if (!MP_WEBHOOK_SECRET) {
      console.error('[MP Webhook] MP_WEBHOOK_SECRET not configured — rejecting');
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    {
      const xSignature = request.headers.get('x-signature') || '';
      const xRequestId = request.headers.get('x-request-id') || '';

      if (!xSignature || !xRequestId) {
        return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
      }

      // Parse x-signature: "ts=...,v1=..."
      const parts = Object.fromEntries(
        xSignature.split(',').map((p) => {
          const [key, ...vals] = p.trim().split('=');
          return [key, vals.join('=')];
        })
      );

      const ts = parts['ts'];
      const v1 = parts['v1'];

      if (!ts || !v1) {
        return NextResponse.json({ error: 'Invalid signature format' }, { status: 401 });
      }

      // Read query param data_id for signature validation
      const dataId = request.nextUrl.searchParams.get('data.id') || '';

      // Build the manifest string as per MP docs
      const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
      const expectedHmac = createHmac('sha256', MP_WEBHOOK_SECRET)
        .update(manifest)
        .digest('hex');

      // Timing-safe comparison to prevent timing attacks
      const expectedBuf = Buffer.from(expectedHmac, 'utf8');
      const receivedBuf = Buffer.from(v1, 'utf8');
      if (expectedBuf.length !== receivedBuf.length || !timingSafeEqual(expectedBuf, receivedBuf)) {
        console.warn('[MP Webhook] Signature mismatch');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const body = await request.json();

    // MercadoPago sends different notification types
    const { type, data, action } = body as {
      type?: string;
      data?: { id?: string };
      action?: string;
    };

    // We only care about payment notifications
    if (type !== 'payment' || !data?.id) {
      // Acknowledge non-payment events with 200
      return NextResponse.json({ status: 'ignored', type });
    }

    const paymentId = data.id;

    // Fetch the full payment details from MercadoPago API
    const client = new MercadoPagoConfig({ accessToken: ACCESS_TOKEN });
    const paymentApi = new Payment(client);
    const payment = await paymentApi.get({ id: paymentId });

    if (!payment || !payment.metadata) {
      console.warn(`[MP Webhook] Payment ${paymentId} has no metadata`);
      return NextResponse.json({ status: 'no_metadata' });
    }

    const orderId = payment.metadata.order_id as number | undefined;
    const orderKey = payment.metadata.order_key as string | undefined;

    if (!orderId) {
      console.warn(`[MP Webhook] Payment ${paymentId} has no order_id in metadata`);
      return NextResponse.json({ status: 'no_order_id' });
    }

    // Map MercadoPago status → WooCommerce status
    let wcStatus: string;
    let setPaid = false;

    switch (payment.status) {
      case 'approved':
        wcStatus = 'processing';
        setPaid = true;
        break;
      case 'pending':
      case 'in_process':
      case 'authorized':
        wcStatus = 'on-hold';
        break;
      case 'rejected':
      case 'cancelled':
        wcStatus = 'cancelled';
        break;
      case 'refunded':
        wcStatus = 'refunded';
        break;
      case 'charged_back':
        wcStatus = 'refunded';
        break;
      default:
        wcStatus = 'on-hold';
    }

    await updateWCOrderStatus(orderId, wcStatus, setPaid, paymentId.toString());

    console.log(
      `[MP Webhook] Payment ${paymentId} (${payment.status}) → Order #${orderId} → WC status: ${wcStatus}`
    );

    return NextResponse.json({
      status: 'processed',
      payment_id: paymentId,
      payment_status: payment.status,
      order_id: orderId,
      wc_status: wcStatus,
    });
  } catch (error) {
    console.error('[MP Webhook] Error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

async function updateWCOrderStatus(
  orderId: number,
  status: string,
  setPaid: boolean,
  paymentId: string
) {
  const WP_URL = process.env.NEXT_PUBLIC_WORDPRESS_URL || 'https://wp.tecnophone.co';
  const CK = process.env.WC_CONSUMER_KEY;
  const CS = process.env.WC_CONSUMER_SECRET;

  if (!CK || !CS) {
    console.error('[MP Webhook] Missing WC credentials');
    return;
  }

  const authHeader = 'Basic ' + Buffer.from(`${CK}:${CS}`).toString('base64');

  const res = await fetch(`${WP_URL}/wp-json/wc/v3/orders/${orderId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: authHeader,
    },
    body: JSON.stringify({
      status,
      set_paid: setPaid,
      transaction_id: paymentId,
    }),
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => '');
    console.error(`[MP Webhook] Failed to update WC order ${orderId}:`, res.status, errBody);
  }
}

// Health-check endpoint — verify webhook connectivity and env config
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: '/api/webhook/mercadopago',
    access_token_configured: !!ACCESS_TOKEN,
    webhook_secret_configured: !!MP_WEBHOOK_SECRET,
    timestamp: new Date().toISOString(),
  });
}
