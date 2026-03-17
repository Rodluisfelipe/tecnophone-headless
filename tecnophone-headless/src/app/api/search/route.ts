import { NextRequest, NextResponse } from 'next/server';
import { searchProducts } from '@/lib/woocommerce';
import { getSearchClient, isAlgoliaConfigured, INDEX_NAME } from '@/lib/algolia';
import { rateLimit } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
  // Rate limit: 30 searches per minute per IP
  const limited = rateLimit(request, { name: 'search', max: 30, windowMs: 60_000 });
  if (limited) return limited;

  const query = request.nextUrl.searchParams.get('q');
  const limit = Math.min(parseInt(request.nextUrl.searchParams.get('limit') || '20', 10), 100);

  if (!query || query.trim().length < 1) {
    return NextResponse.json({ products: [], total: 0 });
  }

  // Limit query length to prevent abuse
  const trimmedQuery = query.trim().slice(0, 200);

  // Try Algolia first (if configured)
  if (isAlgoliaConfigured()) {
    try {
      const client = getSearchClient();
      const result = await client.searchSingleIndex({
        indexName: INDEX_NAME,
        searchParams: {
          query: trimmedQuery,
          hitsPerPage: limit,
          attributesToHighlight: ['name'],
          highlightPreTag: '<mark class="bg-yellow-200">',
          highlightPostTag: '</mark>',
        },
      });

      const hits = (result.hits || []).map((hit) => ({
        ...hit,
        _formatted: { name: (hit._highlightResult as Record<string, { value?: string }>)?.name?.value || (hit as Record<string, unknown>).name },
      }));

      return NextResponse.json({
        products: hits,
        total: result.nbHits || hits.length,
        processingTimeMs: result.processingTimeMS || 0,
      });
    } catch (error) {
      console.warn('[Search] Algolia error, falling back to WooCommerce:', (error as Error).message);
    }
  }

  // Fallback: WooCommerce GraphQL
  try {
    const start = Date.now();
    const products = await searchProducts(trimmedQuery, limit);
    const processingTimeMs = Date.now() - start;

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
