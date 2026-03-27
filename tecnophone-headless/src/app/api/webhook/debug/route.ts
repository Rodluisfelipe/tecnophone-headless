import { NextRequest, NextResponse } from 'next/server';

/**
 * TEMPORARY diagnostic endpoint — DELETE AFTER WEBHOOKS ARE WORKING.
 *
 * GET  /api/webhook/debug          → List WC webhooks + check env vars
 * POST /api/webhook/debug?action=create → Create webhook with correct secret
 * POST /api/webhook/debug?action=update&id=X → Update webhook #X secret
 * POST /api/webhook/debug?action=delete&id=X → Delete webhook #X
 *
 * Protected by a one-time token so only you can use it.
 */

const WP_URL = process.env.NEXT_PUBLIC_WORDPRESS_URL || 'https://wp.tecnophone.co';
const CK = process.env.WC_CONSUMER_KEY || '';
const CS = process.env.WC_CONSUMER_SECRET || '';
const WEBHOOK_SECRET = process.env.WC_WEBHOOK_SECRET || '';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.tecnophone.co';

// Simple protection: require ?token=<first 12 chars of CK>
function isAuthorized(req: NextRequest): boolean {
  const token = req.nextUrl.searchParams.get('token') || '';
  return token === CK.slice(0, 12);
}

/**
 * Build WC REST API URL using ?rest_route= format (works when /wp-json/ is blocked by LiteSpeed).
 * Auth via query params (required for non-pretty-permalink servers).
 */
function wcApiUrl(route: string, extraParams = ''): string {
  const base = `${WP_URL}/?rest_route=/wc/v3${route}&consumer_key=${CK}&consumer_secret=${CS}`;
  return extraParams ? `${base}&${extraParams}` : base;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized. Add ?token=<first 12 chars of WC_CONSUMER_KEY>' }, { status: 401 });
  }

  const results: Record<string, unknown> = {
    env: {
      WC_WEBHOOK_SECRET_configured: !!WEBHOOK_SECRET,
      WC_WEBHOOK_SECRET_length: WEBHOOK_SECRET.length,
      WC_WEBHOOK_SECRET_first8: WEBHOOK_SECRET.slice(0, 8) + '…',
      SITE_URL,
      WP_URL,
      expected_delivery_url: `https://www.tecnophone.co/api/webhook/products`,
    },
  };

  // Test 1: Can we reach WP REST API at all?
  try {
    const testRes = await fetch(`${WP_URL}/?rest_route=/`);
    const testData = await testRes.json();
    results.wp_rest_api = { reachable: true, site_name: testData.name, url: testData.url };
  } catch (err) {
    results.wp_rest_api = { reachable: false, error: String(err) };
  }

  // Test 2: Can we auth and list webhooks?
  try {
    const res = await fetch(wcApiUrl('/webhooks', 'per_page=50'));
    if (!res.ok) {
      const body = await res.text();
      results.webhooks_error = { status: res.status, body: body.slice(0, 500) };
    } else {
      const webhooks = await res.json();
      results.webhooks = (webhooks as Record<string, unknown>[]).map((w) => ({
        id: w.id,
        name: w.name,
        status: w.status,
        topic: w.topic,
        delivery_url: w.delivery_url,
        secret: w.secret,
        date_created: w.date_created,
        date_modified: w.date_modified,
      }));
      results.webhooks_count = (webhooks as unknown[]).length;
    }
  } catch (err) {
    results.webhooks_error = { error: String(err) };
  }

  return NextResponse.json(results);
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const action = req.nextUrl.searchParams.get('action');
  const deliveryUrl = 'https://www.tecnophone.co/api/webhook/products';

  if (action === 'create') {
    const res = await fetch(wcApiUrl('/webhooks'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Headless Product Sync',
        status: 'active',
        topic: 'product.updated',
        delivery_url: deliveryUrl,
        secret: WEBHOOK_SECRET,
      }),
    });

    const body = await res.json();
    return NextResponse.json({
      action: 'create',
      http_status: res.status,
      ok: res.ok,
      delivery_url: deliveryUrl,
      secret_sent: WEBHOOK_SECRET.slice(0, 8) + '…',
      webhook: body,
    });
  }

  if (action === 'update') {
    const id = req.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing ?id= parameter' }, { status: 400 });

    const res = await fetch(wcApiUrl(`/webhooks/${id}`), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'active',
        secret: WEBHOOK_SECRET,
        delivery_url: deliveryUrl,
      }),
    });

    const body = await res.json();
    return NextResponse.json({
      action: 'update',
      http_status: res.status,
      ok: res.ok,
      webhook: body,
    });
  }

  if (action === 'delete') {
    const id = req.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing ?id= parameter' }, { status: 400 });

    const res = await fetch(wcApiUrl(`/webhooks/${id}`) + '&force=true', {
      method: 'DELETE',
    });

    const body = await res.json();
    return NextResponse.json({
      action: 'delete',
      http_status: res.status,
      ok: res.ok,
      result: body,
    });
  }

  return NextResponse.json({
    error: 'Use ?action=create or ?action=update&id=X or ?action=delete&id=X',
    delivery_url: deliveryUrl,
  }, { status: 400 });
}
