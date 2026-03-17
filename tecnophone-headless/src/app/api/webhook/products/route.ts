import { NextRequest, NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';
import { revalidatePath } from 'next/cache';
import { updateProduct, deleteProduct, MeiliProduct } from '@/lib/meilisearch';

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

function mapToMeiliProduct(wc: WCWebhookProduct): MeiliProduct {
  const priceRaw = wc.sale_price || wc.price || wc.regular_price || '0';
  const priceNum = parseFloat(priceRaw.replace(/[^0-9.]/g, '')) || 0;

  return {
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
    rating_count: wc.rating_count || 0,
    short_description: (wc.short_description || '').replace(/<[^>]*>/g, '').trim(),
    featured: wc.featured,
    price_numeric: priceNum,
    created_at: Date.now(),
  };
}

export async function POST(request: NextRequest) {
  // Validate webhook secret via HMAC-SHA256 signature
  const signature = request.headers.get('x-wc-webhook-signature') || '';
  const topic = request.headers.get('x-wc-webhook-topic') || '';
  const source = request.headers.get('x-wc-webhook-source') || '';

  const rawBody = await request.text();

  if (!WEBHOOK_SECRET) {
    console.error('[WC Webhook] WC_WEBHOOK_SECRET not configured — rejecting');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  if (WEBHOOK_SECRET) {
    if (signature) {
      const expectedSig = createHmac('sha256', WEBHOOK_SECRET)
        .update(rawBody, 'utf8')
        .digest('base64');
      // Timing-safe comparison
      const expectedBuf = Buffer.from(expectedSig, 'utf8');
      const receivedBuf = Buffer.from(signature, 'utf8');
      if (expectedBuf.length !== receivedBuf.length || !timingSafeEqual(expectedBuf, receivedBuf)) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    } else {
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
    }
  }

  try {
    const body = JSON.parse(rawBody);

    // WooCommerce sends a ping on webhook creation
    if (topic === 'product.ping' || !body?.id) {
      return NextResponse.json({ status: 'pong' });
    }

    const productId = body.id as number;

    if (topic === 'product.deleted') {
      await deleteProduct(productId);
      revalidatePath('/productos');
      revalidatePath('/');
      console.log(`[Webhook] Deleted product ${productId} from Meilisearch`);
      return NextResponse.json({ status: 'deleted', id: productId });
    }

    // product.created or product.updated
    const wcProduct = body as WCWebhookProduct;

    // Only index published products
    if (wcProduct.status !== 'publish') {
      await deleteProduct(productId);
      console.log(`[Webhook] Product ${productId} not published, removed from index`);
      return NextResponse.json({ status: 'removed_unpublished', id: productId });
    }

    const meiliDoc = mapToMeiliProduct(wcProduct);
    await updateProduct(meiliDoc);

    // Revalidate cached pages so ISR picks up the change immediately
    revalidatePath(`/producto/${wcProduct.slug}`);
    revalidatePath('/productos');
    revalidatePath('/');
    if (wcProduct.categories?.length) {
      for (const cat of wcProduct.categories) {
        revalidatePath(`/categoria/${cat.slug}`);
      }
    }

    console.log(`[Webhook] Indexed product ${productId}: ${wcProduct.name}`);

    return NextResponse.json({ status: 'indexed', id: productId, name: wcProduct.name });
  } catch (error) {
    console.error('[Webhook] Error processing:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}

// Reject non-POST requests
export async function GET() {
  return new NextResponse(null, { status: 405 });
}
