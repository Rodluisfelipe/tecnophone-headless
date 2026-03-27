import { NextRequest, NextResponse } from 'next/server';
import { getSearchClient, isAlgoliaConfigured, INDEX_NAME } from '@/lib/algolia';
import { rateLimit } from '@/lib/rate-limit';

/**
 * Browse products via Algolia with faceted attribute filtering.
 * Supports: query, page, per_page, sort, on_sale, min_price, max_price,
 * and any attr_* facet filter (e.g. attr_ram=8GB).
 * Returns products + available facet values with counts.
 */
export async function GET(request: NextRequest) {
  const limited = rateLimit(request, { name: 'browse', max: 30, windowMs: 60_000 });
  if (limited) return limited;

  if (!isAlgoliaConfigured()) {
    return NextResponse.json({ error: 'Search not configured' }, { status: 503 });
  }

  const sp = request.nextUrl.searchParams;
  const query = sp.get('q')?.trim().slice(0, 200) || '';
  const page = Math.max(0, parseInt(sp.get('page') || '0'));
  const hitsPerPage = Math.min(parseInt(sp.get('per_page') || '24'), 100);
  const onSale = sp.get('on_sale') === 'true';
  const minPrice = parseFloat(sp.get('min_price') || '') || undefined;
  const maxPrice = parseFloat(sp.get('max_price') || '') || undefined;
  const sortParam = sp.get('sort') || 'date-desc';

  // Collect attribute filters from query params (attr_ram=8GB&attr_almacenamiento=128GB)
  const facetFilters: string[] = [];
  if (onSale) facetFilters.push('on_sale:true');

  const brand = sp.get('brand') || '';
  if (brand) facetFilters.push(`brand_name:${brand}`);

  sp.forEach((value, key) => {
    if (key.startsWith('attr_') && value) {
      facetFilters.push(`${key}:${value}`);
    }
  });

  // Numeric price filter
  const numericFilters: string[] = [];
  if (minPrice !== undefined) numericFilters.push(`price_numeric >= ${minPrice}`);
  if (maxPrice !== undefined) numericFilters.push(`price_numeric <= ${maxPrice}`);

  // Facets to retrieve — use wildcard to get all attr_* dynamically
  const facets = ['*'];

  try {
    const client = getSearchClient();
    const result = await client.searchSingleIndex({
      indexName: INDEX_NAME,
      searchParams: {
        query,
        page,
        hitsPerPage,
        facets,
        facetFilters: facetFilters.length ? facetFilters : undefined,
        numericFilters: numericFilters.length ? numericFilters : undefined,
        attributesToHighlight: [],
      },
    });

    return NextResponse.json({
      products: result.hits || [],
      total: result.nbHits || 0,
      totalPages: result.nbPages || 0,
      page: result.page || 0,
      facets: result.facets || {},
      processingTimeMs: result.processingTimeMS || 0,
    });
  } catch (error) {
    console.error('[Browse] Algolia error:', (error as Error).message);
    return NextResponse.json({ error: 'Error searching products' }, { status: 500 });
  }
}
