import { NextRequest, NextResponse } from 'next/server';
import { searchProducts as meiliSearch } from '@/lib/meilisearch';
import { searchProducts as wcSearch } from '@/lib/woocommerce';

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q');
  const filter = request.nextUrl.searchParams.get('filter') || undefined;
  const sort = request.nextUrl.searchParams.get('sort') || undefined;
  const limit = parseInt(request.nextUrl.searchParams.get('limit') || '20', 10);
  const offset = parseInt(request.nextUrl.searchParams.get('offset') || '0', 10);

  if (!query || query.trim().length < 1) {
    return NextResponse.json({ products: [], total: 0, facets: {} });
  }

  try {
    // Try Meilisearch first with 3s timeout
    const result = await Promise.race([
      meiliSearch(query.trim(), {
        limit,
        offset,
        filter: filter || undefined,
        sort: sort ? [sort] : undefined,
        facets: ['categories', 'brand_name', 'on_sale'],
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Meilisearch timeout')), 3000)
      ),
    ]);

    return NextResponse.json({
      products: result.hits,
      total: result.estimatedTotalHits,
      facets: result.facetDistribution || {},
      processingTimeMs: result.processingTimeMs,
    });
  } catch (error) {
    // Fallback to WooCommerce GraphQL if Meilisearch is unavailable
    console.warn('[Search] Meilisearch unavailable, falling back to WooCommerce:', (error as Error).message);
    try {
      const products = await wcSearch(query.trim(), limit);
      return NextResponse.json({ products, total: products.length, facets: {}, fallback: true });
    } catch {
      return NextResponse.json({ products: [], total: 0, facets: {} });
    }
  }
}
