import { NextRequest, NextResponse } from 'next/server';

const WP_URL = process.env.NEXT_PUBLIC_WORDPRESS_URL || 'https://www.tecnophone.co';
const CK = process.env.WC_CONSUMER_KEY;
const CS = process.env.WC_CONSUMER_SECRET;

interface LineItem {
  product_id: number;
  quantity: number;
  variation_id?: number;
}

interface CheckoutBody {
  billing: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    address_1: string;
    city: string;
    state: string;
    country: string;
  };
  shipping?: {
    first_name: string;
    last_name: string;
    address_1: string;
    city: string;
    state: string;
    country: string;
  };
  line_items: LineItem[];
  customer_note?: string;
}

export async function POST(request: NextRequest) {
  try {
    if (!CK || !CS) {
      console.error('[Checkout] Missing WC_CONSUMER_KEY or WC_CONSUMER_SECRET');
      return NextResponse.json({ error: 'Error de configuración del servidor' }, { status: 500 });
    }

    const body: CheckoutBody = await request.json();

    if (!body.line_items?.length) {
      return NextResponse.json({ error: 'El carrito está vacío' }, { status: 400 });
    }

    if (!body.billing?.first_name || !body.billing?.email || !body.billing?.phone) {
      return NextResponse.json({ error: 'Faltan datos de facturación' }, { status: 400 });
    }

    // Create WooCommerce order via REST API
    const orderData = {
      payment_method: 'woo-mercado-pago-basic',
      payment_method_title: 'MercadoPago',
      set_paid: false,
      status: 'pending',
      billing: {
        ...body.billing,
        country: body.billing.country || 'CO',
      },
      shipping: body.shipping || {
        first_name: body.billing.first_name,
        last_name: body.billing.last_name,
        address_1: body.billing.address_1,
        city: body.billing.city,
        state: body.billing.state,
        country: body.billing.country || 'CO',
      },
      line_items: body.line_items.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
        ...(item.variation_id ? { variation_id: item.variation_id } : {}),
      })),
      customer_note: body.customer_note || '',
    };

    const authHeader = 'Basic ' + Buffer.from(`${CK}:${CS}`).toString('base64');

    const res = await fetch(`${WP_URL}/wp-json/wc/v3/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify(orderData),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.error('[Checkout] WooCommerce error:', res.status, errorData);
      return NextResponse.json(
        { error: 'Error al crear el pedido. Intenta de nuevo.' },
        { status: 500 }
      );
    }

    const order = await res.json();

    return NextResponse.json({
      order_id: order.id,
      order_key: order.order_key,
      total: order.total,
    });
  } catch (error) {
    console.error('[Checkout] Error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
