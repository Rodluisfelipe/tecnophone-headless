import { NextRequest, NextResponse } from 'next/server';

/**
 * TEMPORARY diagnostic endpoint — DELETE AFTER WEBHOOKS ARE WORKING.
 *
 * GET  /api/webhook/debug          → List WC webhooks + check env vars
 * POST /api/webhook/debug?action=create → Create webhook with correct secret
 * POST /api/webhook/debug?action=update&id=X → Update webhook #X secret
 *
 * Protected by a one-time token so only you can use it.
 */

const WP_URL = process.env.NEXT_PUBLIC_WORDPRESS_URL || 'https://wp.tecnophone.co';
const CK = process.env.WC_CONSUMER_KEY || '';
const CS = process.env.WC_CONSUMER_SECRET || '';
const WEBHOOK_SECRET = process.env.WC_WEBHOOK_SECRET || '';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.tecnophone.co';

// Simple protection: require ?token=<first 8 chars of CK>
function isAuthorized(req: NextRequest): boolean {
  const token = req.nextUrl.searchParams.get('token') || '';
  return token === CK.slice(0, 12);
}

function authHeader(): string {
  return 'Basic ' + Buffer.from(`${CK}:${CS}`).toString('base64');
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized. Add ?token=<first 12 chars of WC_CONSUMER_KEY>' }, { status: 401 });
  }

  try {
    // List all webhooks
    const res = await fetch(`${WP_URL}/wp-json/wc/v3/webhooks?per_page=50`, {
      headers: { Authorization: authHeader() },
    });

    if (!res.ok) {
      const body = await res.text();
      return NextResponse.json({
        error: 'Failed to list webhooks',
        status: res.status,
        body: body.slice(0, 500),
      }, { status: 502 });
    }

    const webhooks = await res.json();

    return NextResponse.json({
      env: {
        WC_WEBHOOK_SECRET_configured: !!WEBHOOK_SECRET,
        WC_WEBHOOK_SECRET_length: WEBHOOK_SECRET.length,
        WC_WEBHOOK_SECRET_first8: WEBHOOK_SECRET.slice(0, 8),
        SITE_URL,
        WP_URL,
      },
      webhooks: webhooks.map((w: Record<string, unknown>) => ({
        id: w.id,
        name: w.name,
        status: w.status,
        topic: w.topic,
        delivery_url: w.delivery_url,
        secret: w.secret, // WC API returns the secret in clear text
        date_created: w.date_created,
        date_modified: w.date_modified,
      })),
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const action = req.nextUrl.searchParams.get('action');
  const deliveryUrl = `${SITE_URL}/api/webhook/products`;

  if (action === 'create') {
    // Create a new webhook with the exact secret from env
    const res = await fetch(`${WP_URL}/wp-json/wc/v3/webhooks`, {
      method: 'POST',
      headers: {
        Authorization: authHeader(),
        'Content-Type': 'application/json',
      },
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
      status: res.status,
      ok: res.ok,
      delivery_url: deliveryUrl,
      webhook: res.ok ? { id: body.id, name: body.name, status: body.status, secret: body.secret } : body,
    });
  }

  if (action === 'update') {
    const id = req.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing ?id= parameter' }, { status: 400 });

    // Update existing webhook's secret
    const res = await fetch(`${WP_URL}/wp-json/wc/v3/webhooks/${id}`, {
      method: 'PUT',
      headers: {
        Authorization: authHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: 'active',
        secret: WEBHOOK_SECRET,
        delivery_url: deliveryUrl,
      }),
    });

    const body = await res.json();
    return NextResponse.json({
      action: 'update',
      status: res.status,
      ok: res.ok,
      webhook: res.ok ? { id: body.id, name: body.name, status: body.status, secret: body.secret } : body,
    });
  }

  return NextResponse.json({ error: 'Use ?action=create or ?action=update&id=X' }, { status: 400 });
}
