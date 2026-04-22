import { NextRequest, NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';
import { revalidatePath } from 'next/cache';
import {
  saveProduct,
  deleteProductFromAlgolia,
  isAlgoliaAdminConfigured,
  AlgoliaProduct,
} from '@/lib/algolia';
import { invalidateProductCache, revalidateProduct, revalidateAllProducts } from '@/lib/woocommerce';

// Shared secret for webhook validation
const WEBHOOK_SECRET = process.env.WC_WEBHOOK_SECRET || '';

// WooCommerce webhook payload types
interface WCWebhookProduct {
  id: number;
  name: string;
  slug: string;
  sku: string;
  status: string;
  type: string;
  featured: boolean;
  description: string;
  short_description: string;
  price: string;
  regular_price: string;
  sale_price: string;
  on_sale: boolean;
  stock_status: string;
  categories: { id: number; name: string; slug: string }[];
  images: { id: number; src: string; alt: string }[];
  brands?: { id: number; name: string; image?: { src: string } }[];
  attributes: { name: string; options: string[]; visible: boolean }[];
  average_rating: string;
  rating_count: number;
}

function mapToAlgoliaProduct(wc: WCWebhookProduct): AlgoliaProduct {
  const priceRaw = wc.sale_price || wc.price || wc.regular_price || '0';
  const priceNum = parseFloat(priceRaw.replace(/[^0-9.]/g, '')) || 0;

  return {
    objectID: String(wc.id),
    id: wc.id,
    name: wc.name,
    slug: wc.slug,
    sku: wc.sku || '',
    price: wc.price || '0',
    regular_price: wc.regular_price || '0',
    sale_price: wc.sale_price || '',
    on_sale: wc.on_sale,
    stock_status: wc.stock_status || 'instock',
    image_src: wc.images?.[0]?.src || '',
    image_alt: wc.images?.[0]?.alt || wc.name,
    categories: wc.categories?.map(c => c.slug) || [],
    category_names: wc.categories?.map(c => c.name) || [],
    brand_name: wc.brands?.[0]?.name || '',
    brand_image: wc.brands?.[0]?.image?.src || '',
    average_rating: wc.average_rating || '0',
    short_description: (wc.short_description || '').replace(/<[^>]*>/g, '').trim(),
    featured: wc.featured,
    price_numeric: priceNum,
    ...extractAttributes(wc.attributes),
  };
}

/** Extract product attributes into flat attr_* fields for Algolia faceting */
function extractAttributes(attrs?: { name: string; options: string[]; visible: boolean }[]): Record<string, string> {
  if (!attrs?.length) return {};
  const result: Record<string, string> = {};
  for (const attr of attrs) {
    if (!attr.visible || !attr.options?.length) continue;
    // Normalize: strip pa_ prefix, lowercase, slugify
    const slug = attr.name.toLowerCase().replace(/^pa_/, '').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const key = `attr_${slug}`;
    result[key] = attr.options.join(', ');
  }
  return result;
}

/** Revalidate all pages that display products */
function revalidateAllProductPages(slug?: string, categories?: { slug: string }[]) {
  // Core product pages
  if (slug) revalidatePath(`/producto/${slug}`);
  revalidatePath('/productos');
  revalidatePath('/');
  revalidatePath('/categorias');

  // Category pages
  if (categories?.length) {
    for (const cat of categories) {
      revalidatePath(`/categoria/${cat.slug}`);
    }
  }

  // SEO/landing pages that show products
  revalidatePath('/empresas');
  revalidatePath('/dolar-hoy');
  revalidatePath('/salario-minimo');
  revalidatePath('/dia-de-la-madre');
  revalidatePath('/nequi-pagos');
}

export async function POST(request: NextRequest) {
  const signature = request.headers.get('x-wc-webhook-signature') || '';
  const topic = request.headers.get('x-wc-webhook-topic') || '';
  const webhookId = request.headers.get('x-wc-webhook-id') || 'unknown';
  const deliveryId = request.headers.get('x-wc-webhook-delivery-id') || 'unknown';
  const source = request.headers.get('x-wc-webhook-source') || 'unknown';

  console.log(
    `[WC Webhook] Received: topic=${topic}, webhook_id=${webhookId}, delivery_id=${deliveryId}, source=${source}, has_signature=${!!signature}`
  );

  // Read raw bytes to avoid encoding roundtrip issues with HMAC
  const rawBuffer = await request.arrayBuffer();
  const rawBody = new TextDecoder().decode(rawBuffer);

  if (!WEBHOOK_SECRET) {
    console.error('[WC Webhook] WC_WEBHOOK_SECRET not configured — rejecting');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  // Auth method 1: HMAC signature in header (standard WooCommerce webhook signing)
  // Auth method 2: Secret as ?secret= query param in delivery URL (fallback when WC UI doesn't save the secret)
  const urlSecret = request.nextUrl.searchParams.get('secret') || '';
  let authenticated = false;

  if (signature) {
    const expectedSig = createHmac('sha256', WEBHOOK_SECRET)
      .update(Buffer.from(rawBuffer))
      .digest('base64');
    const expectedBuf = Buffer.from(expectedSig, 'utf8');
    const receivedBuf = Buffer.from(signature, 'utf8');
    if (expectedBuf.length === receivedBuf.length && timingSafeEqual(expectedBuf, receivedBuf)) {
      authenticated = true;
    } else {
      console.error(`[WC Webhook] Signature mismatch — secret_len=${WEBHOOK_SECRET.length}, received="${signature.slice(0, 12)}…", expected="${expectedSig.slice(0, 12)}…", body_len=${rawBuffer.byteLength}`);
    }
  }

  if (!authenticated && urlSecret) {
    // Timing-safe comparison of URL token vs env secret
    const expectedBuf = Buffer.from(WEBHOOK_SECRET, 'utf8');
    const receivedBuf = Buffer.from(urlSecret, 'utf8');
    if (expectedBuf.length === receivedBuf.length && timingSafeEqual(expectedBuf, receivedBuf)) {
      authenticated = true;
    } else {
      console.error('[WC Webhook] URL secret mismatch');
    }
  }

  if (!authenticated) {
    console.error(`[WC Webhook] Authentication failed — no valid HMAC signature and no valid URL secret`);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // WooCommerce may send pings as form-encoded (webhook_id=12) or JSON
    let body: Record<string, unknown>;
    const contentType = request.headers.get('content-type') || '';

    if (rawBody.startsWith('{')) {
      body = JSON.parse(rawBody);
    } else if (rawBody.includes('=')) {
      // Form-encoded: parse "webhook_id=12" → { webhook_id: "12" }
      body = Object.fromEntries(new URLSearchParams(rawBody));
    } else {
      body = {};
    }

    console.log(`[WC Webhook] Parsed body: content_type=${contentType}, topic=${topic}, body_keys=${Object.keys(body).join(',')}, id=${body.id || body.webhook_id || 'none'}`);

    // WooCommerce sends a ping on webhook creation/save
    if (topic === 'product.ping' || (!body?.id && !topic)) {
      console.log(`[WC Webhook] Ping received — webhook is working ✓`);
      return NextResponse.json({ status: 'pong' });
    }

    if (!body?.id) {
      console.log(`[WC Webhook] No product id in payload — treating as ping`);
      return NextResponse.json({ status: 'pong' });
    }

    const productId = body.id as number;
    const algoliaReady = isAlgoliaAdminConfigured();

    if (topic === 'product.deleted') {
      if (algoliaReady) await deleteProductFromAlgolia(productId);
      invalidateProductCache(undefined, productId);
      revalidateProduct(undefined, productId);
      revalidateAllProductPages();
      console.log(`[Webhook] Deleted product ${productId} from Algolia`);
      return NextResponse.json({ status: 'deleted', id: productId });
    }

    // product.created or product.updated
    const wcProduct = body as unknown as WCWebhookProduct;

    // Only index published products
    if (wcProduct.status !== 'publish') {
      if (algoliaReady) await deleteProductFromAlgolia(productId);
      revalidateProduct(wcProduct.slug, productId);
      revalidateAllProductPages(wcProduct.slug, wcProduct.categories);
      console.log(`[Webhook] Product ${productId} not published, removed from Algolia`);
      return NextResponse.json({ status: 'removed_unpublished', id: productId });
    }

    // Index to Algolia
    if (algoliaReady) {
      const algoliaDoc = mapToAlgoliaProduct(wcProduct);
      await saveProduct(algoliaDoc);
    }

    // Clear in-memory cache for this product so fresh data is served
    invalidateProductCache(wcProduct.slug, productId);

    // Invalidate Vercel Data Cache (distributed across all serverless instances)
    revalidateProduct(wcProduct.slug, productId);

    // Revalidate all cached pages so ISR picks up the change immediately
    revalidateAllProductPages(wcProduct.slug, wcProduct.categories);

    console.log(`[Webhook] Indexed product ${productId}: ${wcProduct.name} → Algolia${algoliaReady ? ' ✓' : ' (not configured)'}`);

    return NextResponse.json({ status: 'indexed', id: productId, name: wcProduct.name });
  } catch (error) {
    console.error('[Webhook] Error processing:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}

// Health-check endpoint — verify webhook connectivity and env config
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: '/api/webhook/products',
    secret_configured: !!WEBHOOK_SECRET,
    algolia_configured: isAlgoliaAdminConfigured(),
    timestamp: new Date().toISOString(),
  });
}
