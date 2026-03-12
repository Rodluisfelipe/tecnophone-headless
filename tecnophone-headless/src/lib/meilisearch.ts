import { MeiliSearch } from 'meilisearch';

// ── Client instances ──
// Admin client (server-side only — uses master/admin key)
const adminClient = new MeiliSearch({
  host: process.env.MEILISEARCH_HOST || 'http://127.0.0.1:7700',
  apiKey: process.env.MEILISEARCH_ADMIN_KEY || '',
});

// Search-only client (safe for client-side — uses search key)
export const searchClient = new MeiliSearch({
  host: process.env.NEXT_PUBLIC_MEILISEARCH_HOST || 'http://127.0.0.1:7700',
  apiKey: process.env.NEXT_PUBLIC_MEILISEARCH_SEARCH_KEY || '',
});

const INDEX_NAME = 'products';

// ── Index configuration ──
export async function setupIndex() {
  const index = adminClient.index(INDEX_NAME);

  // Searchable attributes (order = priority)
  await index.updateSearchableAttributes([
    'name',
    'brand_name',
    'category_names',
    'short_description',
    'sku',
  ]);

  // Filterable attributes for faceted search
  await index.updateFilterableAttributes([
    'categories',
    'brand_name',
    'on_sale',
    'stock_status',
    'price_numeric',
  ]);

  // Sortable attributes
  await index.updateSortableAttributes([
    'price_numeric',
    'name',
    'created_at',
  ]);

  // Displayed attributes (what comes back in results)
  await index.updateDisplayedAttributes([
    'id',
    'name',
    'slug',
    'sku',
    'price',
    'regular_price',
    'sale_price',
    'on_sale',
    'stock_status',
    'image_src',
    'image_alt',
    'categories',
    'category_names',
    'brand_name',
    'brand_image',
    'average_rating',
    'rating_count',
    'short_description',
    'featured',
    'price_numeric',
  ]);

  // Ranking rules
  await index.updateRankingRules([
    'words',
    'typo',
    'proximity',
    'attribute',
    'sort',
    'exactness',
  ]);

  // Typo tolerance — Spanish-friendly
  await index.updateTypoTolerance({
    minWordSizeForTypos: { oneTypo: 3, twoTypos: 6 },
  });

  return index;
}

// ── Document shape for Meilisearch ──
export interface MeiliProduct {
  id: number;
  name: string;
  slug: string;
  sku: string;
  price: string;
  regular_price: string;
  sale_price: string;
  on_sale: boolean;
  stock_status: string;
  image_src: string;
  image_alt: string;
  categories: string[];       // slugs for filtering
  category_names: string[];   // names for search/display
  brand_name: string;
  brand_image: string;
  average_rating: string;
  rating_count: number;
  short_description: string;
  featured: boolean;
  price_numeric: number;
  created_at: number;
}

// ── CRUD operations (server-side) ──
export async function indexProducts(products: MeiliProduct[]) {
  const index = adminClient.index(INDEX_NAME);
  return index.addDocuments(products, { primaryKey: 'id' });
}

export async function updateProduct(product: MeiliProduct) {
  const index = adminClient.index(INDEX_NAME);
  return index.addDocuments([product], { primaryKey: 'id' });
}

export async function deleteProduct(productId: number) {
  const index = adminClient.index(INDEX_NAME);
  return index.deleteDocument(productId);
}

// ── Search (can be used server-side or via searchClient on client) ──
export async function searchProducts(
  query: string,
  options: {
    limit?: number;
    offset?: number;
    filter?: string | string[];
    sort?: string[];
    facets?: string[];
  } = {}
) {
  const index = searchClient.index(INDEX_NAME);
  return index.search(query, {
    limit: options.limit || 20,
    offset: options.offset || 0,
    filter: options.filter,
    sort: options.sort,
    facets: options.facets || ['categories', 'brand_name', 'on_sale'],
    attributesToHighlight: ['name'],
    highlightPreTag: '<mark class="bg-yellow-200">',
    highlightPostTag: '</mark>',
  });
}
