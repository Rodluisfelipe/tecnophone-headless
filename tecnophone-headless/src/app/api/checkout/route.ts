import { NextRequest, NextResponse } from 'next/server';

const WP_URL = process.env.NEXT_PUBLIC_WORDPRESS_URL || 'https://www.tecnophone.co';
const CK = process.env.WC_CONSUMER_KEY;
const CS = process.env.WC_CONSUMER_SECRET;
const STORE_API = `${WP_URL}/wp-json/wc/store/v1`;

// Colombian department name → WooCommerce state code mapping
const STATE_MAP: Record<string, string> = {
  'Amazonas': 'CO-AMA', 'Antioquia': 'CO-ANT', 'Arauca': 'CO-ARA',
  'Atlántico': 'CO-ATL', 'Bolívar': 'CO-BOL', 'Boyacá': 'CO-BOY',
  'Caldas': 'CO-CAL', 'Caquetá': 'CO-CAQ', 'Casanare': 'CO-CAS',
  'Cauca': 'CO-CAU', 'Cesar': 'CO-CES', 'Chocó': 'CO-CHO',
  'Córdoba': 'CO-COR', 'Cundinamarca': 'CO-CUN', 'Guainía': 'CO-GUA',
  'Guaviare': 'CO-GUV', 'Huila': 'CO-HUI', 'La Guajira': 'CO-LAG',
  'Magdalena': 'CO-MAG', 'Meta': 'CO-MET', 'Nariño': 'CO-NAR',
  'Norte de Santander': 'CO-NSA', 'Putumayo': 'CO-PUT', 'Quindío': 'CO-QUI',
  'Risaralda': 'CO-RIS', 'San Andrés y Providencia': 'CO-SAP',
  'Santander': 'CO-SAN', 'Sucre': 'CO-SUC', 'Tolima': 'CO-TOL',
  'Valle del Cauca': 'CO-VAC', 'Vaupés': 'CO-VAU', 'Vichada': 'CO-VID',
  'Bogotá D.C.': 'CO-DC', 'Bogota': 'CO-DC', 'DC': 'CO-DC',
};

function toStateCode(state: string): string {
  if (state.startsWith('CO-')) return state;
  return STATE_MAP[state] || `CO-${state}`;
}

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
  payment_method?: 'mercadopago' | 'bacs';
}

/* ─── Store API checkout (fast path) ─── */
async function storeApiCheckout(body: CheckoutBody): Promise<NextResponse | null> {
  const isBacs = body.payment_method === 'bacs';

  try {
    // Step 1: GET cart to obtain nonce + cart token
    const cartRes = await fetch(`${STORE_API}/cart`);
    if (!cartRes.ok) return null;

    const nonce = cartRes.headers.get('nonce') || '';
    let cartToken = cartRes.headers.get('cart-token') || '';
    if (!nonce || !cartToken) return null;

    // Step 2: Add items to cart (sequential to avoid race conditions)
    let cartTotal = '0';

    for (const item of body.line_items) {
      const itemId = item.variation_id || item.product_id;
      const res = await fetch(`${STORE_API}/cart/add-item`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cart-Token': cartToken,
          'Nonce': nonce,
        },
        body: JSON.stringify({ id: itemId, quantity: item.quantity }),
      });

      if (!res.ok) {
        if (res.status === 404 || res.status === 401 || res.status === 403) {
          return null;
        }
        const err = await res.json().catch(() => ({}));
        return NextResponse.json(
          { error: err.message || 'Producto no disponible' },
          { status: 409 }
        );
      }

      // Update cart token if returned and capture total
      const newToken = res.headers.get('cart-token');
      if (newToken) cartToken = newToken;

      const cartData = await res.json();
      cartTotal = cartData.totals?.total_price || cartTotal;
    }

    // Step 3: Process checkout in one call
    const billingAddress = {
      first_name: body.billing.first_name,
      last_name: body.billing.last_name,
      email: body.billing.email,
      phone: body.billing.phone,
      address_1: body.billing.address_1,
      city: body.billing.city,
      state: toStateCode(body.billing.state),
      country: body.billing.country || 'CO',
    };

    const shippingAddress = body.shipping
      ? {
          first_name: body.shipping.first_name,
          last_name: body.shipping.last_name,
          address_1: body.shipping.address_1,
          city: body.shipping.city,
          state: toStateCode(body.shipping.state),
          country: body.shipping.country || 'CO',
        }
      : billingAddress;

    const checkoutRes = await fetch(`${STORE_API}/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cart-Token': cartToken,
        'Nonce': nonce,
      },
      body: JSON.stringify({
        billing_address: billingAddress,
        shipping_address: shippingAddress,
        payment_method: isBacs ? 'bacs' : 'woo-mercado-pago-basic',
        customer_note: body.customer_note || '',
      }),
    });

    if (!checkoutRes.ok) {
      if (checkoutRes.status === 404 || checkoutRes.status === 401) return null;
      const err = await checkoutRes.json().catch(() => ({}));
      console.error('[Checkout][StoreAPI] Error:', checkoutRes.status, err);
      return NextResponse.json(
        { error: err.message || 'Error al procesar el pedido' },
        { status: checkoutRes.status >= 400 && checkoutRes.status < 500 ? checkoutRes.status : 500 }
      );
    }

    const order = await checkoutRes.json();
    console.log(`[Checkout][StoreAPI] Order #${order.order_id} created`);

    return NextResponse.json({
      order_id: order.order_id,
      order_key: order.order_key,
      total: cartTotal,
      payment_method: isBacs ? 'bacs' : 'mercadopago',
    });
  } catch (error) {
    console.error('[Checkout][StoreAPI] Exception:', error);
    return null;
  }
}

/* ─── REST API checkout (fallback) ─── */
async function restApiCheckout(body: CheckoutBody): Promise<NextResponse> {
  const authHeader = 'Basic ' + Buffer.from(`${CK}:${CS}`).toString('base64');
  const isBacs = body.payment_method === 'bacs';

  const orderData = {
    payment_method: isBacs ? 'bacs' : 'woo-mercado-pago-basic',
    payment_method_title: isBacs ? 'Transferencia Bancaria' : 'MercadoPago',
    set_paid: false,
    status: isBacs ? 'on-hold' : 'pending',
    billing: { ...body.billing, country: body.billing.country || 'CO' },
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
    console.error('[Checkout][REST] WooCommerce error:', res.status, errorData);

    const msg = errorData?.message || '';
    if (msg.toLowerCase().includes('stock') || msg.toLowerCase().includes('agotado') || res.status === 409) {
      return NextResponse.json(
        { error: msg || 'Uno o más productos no tienen stock suficiente.' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Error al crear el pedido. Intenta de nuevo.' },
      { status: 500 }
    );
  }

  const order = await res.json();
  console.log(`[Checkout][REST] Order #${order.id} created (fallback)`);

  return NextResponse.json({
    order_id: order.id,
    order_key: order.order_key,
    total: order.total,
    payment_method: isBacs ? 'bacs' : 'mercadopago',
  });
}

/* ─── Main handler ─── */
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

    // Try Store API first (2-4x faster), fall back to REST API
    const storeResult = await storeApiCheckout(body);
    if (storeResult) return storeResult;

    console.log('[Checkout] Store API unavailable, using REST API fallback');
    return await restApiCheckout(body);
  } catch (error) {
    console.error('[Checkout] Error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
