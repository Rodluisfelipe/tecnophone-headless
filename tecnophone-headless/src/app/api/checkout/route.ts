import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';
import { isPositiveInt, isValidEmail, stripHtml, truncate } from '@/lib/validation';

const WP_URL = process.env.NEXT_PUBLIC_WORDPRESS_URL || 'https://wp.tecnophone.co';
const CK = process.env.WC_CONSUMER_KEY;
const CS = process.env.WC_CONSUMER_SECRET;

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

// Build Store API URL using ?rest_route= to bypass LiteSpeed blocking /wp-json/
function storeUrl(path: string): string {
  return `${WP_URL}/?rest_route=/wc/store/v1${path}`;
}

// Collect Set-Cookie headers from a response into a forwarding string
function extractCookies(res: Response): string {
  const raw = res.headers.getSetCookie?.() ?? [];
  return raw.map((c) => c.split(';')[0]).join('; ');
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

/* ═══════════════════════════════════════════════════════════════════
   APPROACH 1 — WooCommerce Store API (designed for headless checkout)
   - Unauthenticated (no API keys needed)
   - Session-based via cookies + Cart-Token + Nonce
   ═══════════════════════════════════════════════════════════════════ */
async function storeApiCheckout(body: CheckoutBody): Promise<NextResponse | null> {
  const isBacs = body.payment_method === 'bacs';

  try {
    // ── Step 1: GET /cart → obtain nonce, cart-token, and session cookies ──
    const cartRes = await fetch(storeUrl('/cart'), {
      headers: { 'Accept': 'application/json' },
    });

    if (!cartRes.ok) {
      console.warn(`[Checkout][StoreAPI] GET /cart failed: ${cartRes.status}`);
      return null;
    }

    const nonce = cartRes.headers.get('nonce') || cartRes.headers.get('x-wc-store-api-nonce') || '';
    let cartToken = cartRes.headers.get('cart-token') || '';
    let cookies = extractCookies(cartRes);

    if (!nonce) {
      console.warn('[Checkout][StoreAPI] No nonce returned from GET /cart');
      return null;
    }

    console.log(`[Checkout][StoreAPI] Got nonce=${nonce.slice(0, 8)}… cartToken=${!!cartToken} cookies=${cookies.length > 0}`);

    // ── Step 2: Add items to cart (sequential to avoid race conditions) ──
    for (const item of body.line_items) {
      const itemId = item.variation_id || item.product_id;
      const addHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        'Nonce': nonce,
        'X-WC-Store-API-Nonce': nonce,
      };
      if (cartToken) addHeaders['Cart-Token'] = cartToken;
      if (cookies) addHeaders['Cookie'] = cookies;

      const addRes = await fetch(storeUrl('/cart/add-item'), {
        method: 'POST',
        headers: addHeaders,
        body: JSON.stringify({ id: itemId, quantity: item.quantity }),
      });

      if (!addRes.ok) {
        const err = await addRes.json().catch(() => ({}));
        console.error(`[Checkout][StoreAPI] add-item ${itemId} failed:`, addRes.status, err);

        const code = String(err.code || '');
        if (code.includes('out_of_stock') || code.includes('not_purchasable') || code.includes('too_many_in_cart')) {
          return NextResponse.json(
            { error: err.message || 'Producto no disponible' },
            { status: 409 }
          );
        }
        return null; // non-stock error → fall through to REST API
      }

      // Update session state from response
      const newToken = addRes.headers.get('cart-token');
      if (newToken) cartToken = newToken;
      const newCookies = extractCookies(addRes);
      if (newCookies) cookies = newCookies;
    }

    // ── Step 3: POST /checkout → create order ──
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

    const checkoutHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'Nonce': nonce,
      'X-WC-Store-API-Nonce': nonce,
    };
    if (cartToken) checkoutHeaders['Cart-Token'] = cartToken;
    if (cookies) checkoutHeaders['Cookie'] = cookies;

    const checkoutRes = await fetch(storeUrl('/checkout'), {
      method: 'POST',
      headers: checkoutHeaders,
      body: JSON.stringify({
        billing_address: billingAddress,
        shipping_address: shippingAddress,
        payment_method: isBacs ? 'bacs' : 'woo-mercado-pago-basic',
        customer_note: body.customer_note || '',
      }),
    });

    if (!checkoutRes.ok) {
      const err = await checkoutRes.json().catch(() => ({}));
      console.error('[Checkout][StoreAPI] checkout failed:', checkoutRes.status, err);

      if (checkoutRes.status === 404 || checkoutRes.status === 401) return null;

      const msg = String(err.message || '');
      if (msg.toLowerCase().includes('stock') || msg.toLowerCase().includes('agotado')) {
        return NextResponse.json({ error: msg }, { status: 409 });
      }
      return null; // fall through to REST API
    }

    const order = await checkoutRes.json();
    console.log(`[Checkout][StoreAPI] ✓ Order #${order.order_id} created`);

    return NextResponse.json({
      order_id: order.order_id,
      order_key: order.order_key,
      total: order.totals?.total_price || '0',
      payment_method: isBacs ? 'bacs' : 'mercadopago',
    });
  } catch (error) {
    console.error('[Checkout][StoreAPI] Exception:', error);
    return null;
  }
}

/* ═══════════════════════════════════════════════════════════════════
   APPROACH 2 — WooCommerce REST API (/wc/v3/orders)
   Try 3 auth methods in order:
     a) Basic auth header + ?rest_route= (LiteSpeed allows the header,
        only blocks the /wp-json/ path)
     b) Query param auth + ?rest_route=
     c) Basic auth header + /wp-json/ path (in case LiteSpeed was fixed)
   ═══════════════════════════════════════════════════════════════════ */
async function restApiCheckout(body: CheckoutBody): Promise<NextResponse> {
  const isBacs = body.payment_method === 'bacs';
  const authHeader = 'Basic ' + Buffer.from(`${CK}:${CS}`).toString('base64');

  const orderData = {
    payment_method: isBacs ? 'bacs' : 'woo-mercado-pago-basic',
    payment_method_title: isBacs ? 'Transferencia Bancaria' : 'MercadoPago',
    set_paid: false,
    status: isBacs ? 'on-hold' : 'pending',
    billing: {
      ...body.billing,
      state: toStateCode(body.billing.state),
      country: body.billing.country || 'CO',
    },
    shipping: body.shipping
      ? {
          ...body.shipping,
          state: toStateCode(body.shipping.state),
          country: body.shipping.country || 'CO',
        }
      : {
          first_name: body.billing.first_name,
          last_name: body.billing.last_name,
          address_1: body.billing.address_1,
          city: body.billing.city,
          state: toStateCode(body.billing.state),
          country: body.billing.country || 'CO',
        },
    line_items: body.line_items.map((item) => ({
      product_id: item.product_id,
      quantity: item.quantity,
      ...(item.variation_id ? { variation_id: item.variation_id } : {}),
    })),
    customer_note: body.customer_note || '',
  };

  const jsonBody = JSON.stringify(orderData);

  // Define auth strategies to try in order
  const strategies = [
    {
      name: 'BasicAuth+RestRoute',
      url: `${WP_URL}/?rest_route=/wc/v3/orders`,
      headers: { 'Content-Type': 'application/json', 'Authorization': authHeader },
    },
    {
      name: 'QueryParams+RestRoute',
      url: `${WP_URL}/?rest_route=/wc/v3/orders&consumer_key=${CK}&consumer_secret=${CS}`,
      headers: { 'Content-Type': 'application/json' },
    },
    {
      name: 'BasicAuth+WpJson',
      url: `${WP_URL}/wp-json/wc/v3/orders`,
      headers: { 'Content-Type': 'application/json', 'Authorization': authHeader },
    },
  ];

  let lastError: { status: number; data: Record<string, unknown> } | null = null;

  for (const strategy of strategies) {
    try {
      console.log(`[Checkout][REST] Trying ${strategy.name}…`);
      const res = await fetch(strategy.url, {
        method: 'POST',
        headers: strategy.headers,
        body: jsonBody,
      });

      if (res.ok) {
        const order = await res.json();
        console.log(`[Checkout][REST] ✓ Order #${order.id} created via ${strategy.name}`);
        return NextResponse.json({
          order_id: order.id,
          order_key: order.order_key,
          total: order.total,
          payment_method: isBacs ? 'bacs' : 'mercadopago',
        });
      }

      const errorData = await res.json().catch(() => ({}));
      console.error(`[Checkout][REST] ${strategy.name} failed:`, res.status, errorData);

      // If it's a stock/product error, return immediately (no point retrying)
      const msg = String(errorData?.message || '');
      if (
        msg.toLowerCase().includes('stock') ||
        msg.toLowerCase().includes('agotado') ||
        res.status === 409
      ) {
        return NextResponse.json(
          { error: msg || 'Uno o más productos no tienen stock suficiente.' },
          { status: 409 }
        );
      }

      lastError = { status: res.status, data: errorData };

      // 401/403 = auth issue → try next strategy
      // Other errors = stop retrying
      if (res.status !== 401 && res.status !== 403) break;
    } catch (err) {
      console.error(`[Checkout][REST] ${strategy.name} exception:`, err);
    }
  }

  console.error('[Checkout][REST] All strategies failed. Last error:', lastError);
  return NextResponse.json(
    { error: 'Error al crear el pedido. Intenta de nuevo.' },
    { status: 500 }
  );
}

/* ─── Main handler ─── */
export async function POST(request: NextRequest) {
  try {
    // Rate limit: 5 checkout attempts per minute per IP
    const limited = rateLimit(request, { name: 'checkout', max: 5, windowMs: 60_000 });
    if (limited) return limited;

    if (!CK || !CS) {
      console.error('[Checkout] Missing WC_CONSUMER_KEY or WC_CONSUMER_SECRET');
      return NextResponse.json({ error: 'Error de configuración del servidor' }, { status: 500 });
    }

    const body: CheckoutBody = await request.json();

    // ── Validate line_items ──
    if (!Array.isArray(body.line_items) || body.line_items.length === 0) {
      return NextResponse.json({ error: 'El carrito está vacío' }, { status: 400 });
    }
    if (body.line_items.length > 20) {
      return NextResponse.json({ error: 'Demasiados productos (máx 20)' }, { status: 400 });
    }
    for (const item of body.line_items) {
      if (!isPositiveInt(item.product_id) || !isPositiveInt(item.quantity)) {
        return NextResponse.json({ error: 'Datos de producto inválidos' }, { status: 400 });
      }
      if (item.quantity > 100) {
        return NextResponse.json({ error: 'Cantidad máxima por producto: 100' }, { status: 400 });
      }
      if (item.variation_id !== undefined && !isPositiveInt(item.variation_id)) {
        return NextResponse.json({ error: 'Datos de variación inválidos' }, { status: 400 });
      }
    }

    // ── Validate billing ──
    if (!body.billing?.first_name || !body.billing?.email || !body.billing?.phone) {
      return NextResponse.json({ error: 'Faltan datos de facturación' }, { status: 400 });
    }
    if (!isValidEmail(body.billing.email)) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 });
    }

    // ── Sanitize string fields (length limits + strip HTML) ──
    body.billing.first_name = truncate(stripHtml(body.billing.first_name), 100);
    body.billing.last_name = truncate(stripHtml(body.billing.last_name || ''), 100);
    body.billing.email = truncate(body.billing.email.trim(), 254);
    body.billing.phone = truncate(body.billing.phone.replace(/[^\d+\-() ]/g, ''), 30);
    body.billing.address_1 = truncate(stripHtml(body.billing.address_1 || ''), 200);
    body.billing.city = truncate(stripHtml(body.billing.city || ''), 100);
    body.billing.state = truncate(stripHtml(body.billing.state || ''), 100);
    if (body.customer_note) {
      body.customer_note = truncate(stripHtml(body.customer_note), 500);
    }
    if (body.shipping) {
      body.shipping.first_name = truncate(stripHtml(body.shipping.first_name || ''), 100);
      body.shipping.last_name = truncate(stripHtml(body.shipping.last_name || ''), 100);
      body.shipping.address_1 = truncate(stripHtml(body.shipping.address_1 || ''), 200);
      body.shipping.city = truncate(stripHtml(body.shipping.city || ''), 100);
      body.shipping.state = truncate(stripHtml(body.shipping.state || ''), 100);
    }

    // ── Approach 1: Store API (designed for headless, no API keys needed) ──
    const storeResult = await storeApiCheckout(body);
    if (storeResult) return storeResult;

    // ── Approach 2: REST API (tries Basic auth, query params, and /wp-json/) ──
    console.log('[Checkout] Store API did not succeed, trying REST API…');
    return await restApiCheckout(body);
  } catch (error) {
    console.error('[Checkout] Error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/* ═══════════════════════════════════════════════════════════
   GET /api/checkout — Diagnostic endpoint (protected by token)
   Tests Store API + REST API connectivity to identify what works
   Usage: GET /api/checkout?token=<first 12 chars of WC_CONSUMER_KEY>
   ═══════════════════════════════════════════════════════════ */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token') || '';
  if (!CK || token !== CK.slice(0, 12)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results: Record<string, unknown> = { timestamp: new Date().toISOString() };
  const authHeader = 'Basic ' + Buffer.from(`${CK}:${CS}`).toString('base64');

  // Test 1: Store API — GET /cart
  try {
    const res = await fetch(storeUrl('/cart'));
    const nonce = res.headers.get('nonce') || res.headers.get('x-wc-store-api-nonce') || '';
    const cartToken = res.headers.get('cart-token') || '';
    const cookies = extractCookies(res);
    const body = res.ok ? await res.json() : await res.text().catch(() => '');
    results.store_api_cart = {
      status: res.status,
      ok: res.ok,
      nonce: nonce ? nonce.slice(0, 8) + '…' : null,
      cart_token: !!cartToken,
      has_cookies: cookies.length > 0,
      cookies_preview: cookies.slice(0, 100),
      body_preview: typeof body === 'string' ? body.slice(0, 200) : 'JSON OK',
    };
  } catch (err) {
    results.store_api_cart = { error: String(err) };
  }

  // Test 2: REST API — GET a single order (read) with BasicAuth+RestRoute
  try {
    const res = await fetch(`${WP_URL}/?rest_route=/wc/v3/orders&per_page=1`, {
      headers: { Authorization: authHeader },
    });
    const body = res.ok ? 'JSON OK' : await res.text().catch(() => '');
    results.rest_basic_auth_rest_route = {
      method: 'GET',
      status: res.status,
      ok: res.ok,
      body_preview: typeof body === 'string' ? body.slice(0, 200) : body,
    };
  } catch (err) {
    results.rest_basic_auth_rest_route = { error: String(err) };
  }

  // Test 3: REST API — GET with QueryParams+RestRoute
  try {
    const res = await fetch(
      `${WP_URL}/?rest_route=/wc/v3/orders&per_page=1&consumer_key=${CK}&consumer_secret=${CS}`
    );
    const body = res.ok ? 'JSON OK' : await res.text().catch(() => '');
    results.rest_query_params_rest_route = {
      method: 'GET',
      status: res.status,
      ok: res.ok,
      body_preview: typeof body === 'string' ? body.slice(0, 200) : body,
    };
  } catch (err) {
    results.rest_query_params_rest_route = { error: String(err) };
  }

  // Test 4: REST API — GET with BasicAuth+WpJson
  try {
    const res = await fetch(`${WP_URL}/wp-json/wc/v3/orders?per_page=1`, {
      headers: { Authorization: authHeader },
    });
    const body = res.ok ? 'JSON OK' : await res.text().catch(() => '');
    results.rest_basic_auth_wp_json = {
      method: 'GET',
      status: res.status,
      ok: res.ok,
      body_preview: typeof body === 'string' ? body.slice(0, 200) : body,
    };
  } catch (err) {
    results.rest_basic_auth_wp_json = { error: String(err) };
  }

  // Test 5: Verify API key permissions by checking the key details
  try {
    const res = await fetch(`${WP_URL}/?rest_route=/wc/v3&consumer_key=${CK}&consumer_secret=${CS}`);
    const body = res.ok ? await res.json() : await res.text().catch(() => '');
    results.api_root = {
      status: res.status,
      ok: res.ok,
      description: typeof body === 'object' ? body.description : String(body).slice(0, 200),
    };
  } catch (err) {
    results.api_root = { error: String(err) };
  }

  return NextResponse.json(results, { status: 200 });
}
