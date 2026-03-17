import { NextRequest, NextResponse } from 'next/server';
import { searchProducts } from '@/lib/woocommerce';

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q');
  const limit = Math.min(parseInt(request.nextUrl.searchParams.get('limit') || '20', 10), 100);

  if (!query || query.trim().length < 1) {
    return NextResponse.json({ products: [], total: 0 });
  }

  try {
    const start = Date.now();
    const products = await searchProducts(query.trim(), limit);
    const processingTimeMs = Date.now() - start;

    // Map WCProduct → SearchHit shape expected by frontend
    const hits = products.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: p.price,
      regular_price: p.regular_price,
      sale_price: p.sale_price,
      on_sale: p.on_sale,
      image_src: p.images?.[0]?.src || '',
      image_alt: p.images?.[0]?.alt || p.name,
      brand_name: p.brand?.name || '',
      category_names: (p.categories || []).map((c) => c.name).filter(Boolean),
      price_numeric: parseFloat(p.price) || 0,
    }));

    return NextResponse.json({
      products: hits,
      total: hits.length,
      processingTimeMs,
    });
  } catch (error) {
    console.error('[Search] Error:', (error as Error).message);
    return NextResponse.json({ products: [], total: 0 });
  }
}
