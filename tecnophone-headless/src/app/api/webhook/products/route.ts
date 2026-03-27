import { NextRequest, NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';
import { revalidatePath } from 'next/cache';
import {
  saveProduct,
  deleteProductFromAlgolia,
  isAlgoliaAdminConfigured,
  AlgoliaProduct,
} from '@/lib/algolia';

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
  };
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

  if (signature) {
    const expectedSig = createHmac('sha256', WEBHOOK_SECRET)
      .update(Buffer.from(rawBuffer))
      .digest('base64');
    const expectedBuf = Buffer.from(expectedSig, 'utf8');
    const receivedBuf = Buffer.from(signature, 'utf8');
    if (expectedBuf.length !== receivedBuf.length || !timingSafeEqual(expectedBuf, receivedBuf)) {
      console.error(`[WC Webhook] Signature mismatch — secret_len=${WEBHOOK_SECRET.length}, received="${signature.slice(0, 12)}…", expected="${expectedSig.slice(0, 12)}…", body_len=${rawBuffer.byteLength}`);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
  } else {
    // WooCommerce only sends the signature header when the webhook has a secret configured.
    // If this fires, the webhook in WP Admin → WooCommerce → Webhooks is missing its secret.
    console.error(
      `[WC Webhook] Missing x-wc-webhook-signature header. ` +
      `This means the webhook in WooCommerce (id=${webhookId}) does NOT have a secret configured. ` +
      `Go to WP Admin → WooCommerce → Settings → Advanced → Webhooks → edit webhook #${webhookId} → ` +
      `paste the secret and save.`
    );
    return NextResponse.json(
      {
        error: 'Missing signature',
        fix: 'The WooCommerce webhook does not have a secret configured. Edit the webhook in WP Admin → WooCommerce → Settings → Advanced → Webhooks and paste the secret into the Secret field.',
      },
      { status: 401 }
    );
  }

  try {
    const body = JSON.parse(rawBody);

    // WooCommerce sends a ping on webhook creation
    if (topic === 'product.ping' || !body?.id) {
      return NextResponse.json({ status: 'pong' });
    }

    const productId = body.id as number;
    const algoliaReady = isAlgoliaAdminConfigured();

    if (topic === 'product.deleted') {
      if (algoliaReady) await deleteProductFromAlgolia(productId);
      revalidateAllProductPages();
      console.log(`[Webhook] Deleted product ${productId} from Algolia`);
      return NextResponse.json({ status: 'deleted', id: productId });
    }

    // product.created or product.updated
    const wcProduct = body as WCWebhookProduct;

    // Only index published products
    if (wcProduct.status !== 'publish') {
      if (algoliaReady) await deleteProductFromAlgolia(productId);
      revalidateAllProductPages(wcProduct.slug, wcProduct.categories);
      console.log(`[Webhook] Product ${productId} not published, removed from Algolia`);
      return NextResponse.json({ status: 'removed_unpublished', id: productId });
    }

    // Index to Algolia
    if (algoliaReady) {
      const algoliaDoc = mapToAlgoliaProduct(wcProduct);
      await saveProduct(algoliaDoc);
    }

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
