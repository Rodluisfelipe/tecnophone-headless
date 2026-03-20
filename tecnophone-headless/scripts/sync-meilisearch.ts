/**
 * Sync all WooCommerce products to Meilisearch.
 *
 * Usage:
 *   npx tsx scripts/sync-meilisearch.ts
 *
 * Requires env vars:
 *   NEXT_PUBLIC_GRAPHQL_URL, MEILISEARCH_HOST, MEILISEARCH_ADMIN_KEY
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

const GRAPHQL_URL = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'https://wp.tecnophone.co/graphql';
const MEILI_HOST = process.env.MEILISEARCH_HOST || 'http://127.0.0.1:7700';
const MEILI_KEY = process.env.MEILISEARCH_ADMIN_KEY || '';
const INDEX = 'products';
const BATCH = 100;

// ── Lightweight GraphQL query for sync ──
const SYNC_QUERY = `
  query SyncProducts($first: Int!, $after: String) {
    products(first: $first, after: $after, where: { status: "publish" }) {
      pageInfo { hasNextPage endCursor }
      nodes {
        ... on SimpleProduct {
          databaseId name slug sku type featured
          onSale stockStatus
          shortDescription
          price(format: RAW)
          regularPrice(format: RAW)
          salePrice(format: RAW)
          averageRating reviewCount
          image { sourceUrl altText }
          productCategories { nodes { name slug } }
        }
        ... on VariableProduct {
          databaseId name slug sku type featured
          onSale stockStatus
          shortDescription
          price(format: RAW)
          regularPrice(format: RAW)
          salePrice(format: RAW)
          averageRating reviewCount
          image { sourceUrl altText }
          productCategories { nodes { name slug } }
        }
        ... on ExternalProduct {
          databaseId name slug type
          onSale
          image { sourceUrl altText }
        }
      }
    }
  }
`;

// ── Brands query (WC REST API via GraphQL isn't available, use REST) ──
const WC_KEY = process.env.WC_CONSUMER_KEY || '';
const WC_SECRET = process.env.WC_CONSUMER_SECRET || '';
const WP_URL = process.env.NEXT_PUBLIC_WORDPRESS_URL || 'https://wp.tecnophone.co';

interface GQLNode {
  databaseId: number;
  name: string;
  slug: string;
  sku?: string;
  type?: string;
  featured?: boolean;
  onSale?: boolean;
  stockStatus?: string;
  shortDescription?: string;
  price?: string;
  regularPrice?: string;
  salePrice?: string;
  averageRating?: string;
  reviewCount?: number;
  image?: { sourceUrl: string; altText: string } | null;
  productCategories?: { nodes: { name: string; slug: string }[] };
}

interface MeiliDoc {
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
  categories: string[];
  category_names: string[];
  brand_name: string;
  brand_image: string;
  average_rating: string;
  rating_count: number;
  short_description: string;
  featured: boolean;
  price_numeric: number;
  created_at: number;
}

// ── Fetch brands mapping via REST API ──
async function fetchBrandsMap(): Promise<Map<number, { name: string; image: string }>> {
  const map = new Map<number, { name: string; image: string }>();
  if (!WC_KEY || !WC_SECRET) return map;

  try {
    let page = 1;
    let hasMore = true;
    while (hasMore) {
      const url = `${WP_URL}/wp-json/wc/v3/products?per_page=100&page=${page}&consumer_key=${WC_KEY}&consumer_secret=${WC_SECRET}`;
      const res = await fetch(url);
      if (!res.ok) break;
      const products: Array<{ id: number; brands?: Array<{ id: number; name: string; image?: { src: string } }> }> = await res.json();
      if (products.length === 0) break;
      for (const p of products) {
        if (p.brands && p.brands.length > 0) {
          const brand = p.brands[0];
          map.set(p.id, { name: brand.name, image: brand.image?.src || '' });
        }
      }
      hasMore = products.length === 100;
      page++;
    }
  } catch (e) {
    console.warn('⚠ Could not fetch brands via REST, skipping brand info:', (e as Error).message);
  }
  return map;
}

// ── GraphQL fetch ──
async function gqlFetch(query: string, variables: Record<string, unknown>) {
  const res = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`GraphQL ${res.status}: ${await res.text()}`);
  const json = await res.json();
  if (json.errors) throw new Error(`GraphQL errors: ${JSON.stringify(json.errors)}`);
  return json.data;
}

// ── Meilisearch fetch helper ──
async function meiliFetch(path: string, method = 'GET', body?: unknown) {
  const res = await fetch(`${MEILI_HOST}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(MEILI_KEY ? { Authorization: `Bearer ${MEILI_KEY}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok && res.status !== 404) {
    throw new Error(`Meilisearch ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

// ── Setup index settings ──
async function setupIndex() {
  // Create index if it doesn't exist
  try {
    await meiliFetch(`/indexes/${INDEX}`, 'POST', { uid: INDEX, primaryKey: 'id' });
  } catch { /* already exists */ }

  await meiliFetch(`/indexes/${INDEX}/settings`, 'PATCH', {
    searchableAttributes: ['name', 'brand_name', 'category_names', 'short_description', 'sku'],
    filterableAttributes: ['categories', 'brand_name', 'on_sale', 'stock_status', 'price_numeric'],
    sortableAttributes: ['price_numeric', 'name', 'created_at'],
    rankingRules: ['words', 'typo', 'proximity', 'attribute', 'sort', 'exactness'],
    typoTolerance: { minWordSizeForTypos: { oneTypo: 3, twoTypos: 6 } },
  });

  console.log('✅ Index settings configured');
}

// ── Strip HTML tags ──
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, ' ').trim();
}

// ── Main sync ──
async function main() {
  console.log('🔄 Starting Meilisearch sync...');
  console.log(`   Meilisearch: ${MEILI_HOST}`);
  console.log(`   GraphQL:     ${GRAPHQL_URL}`);

  // 1. Setup index
  await setupIndex();

  // 2. Fetch brands
  console.log('📦 Fetching brands...');
  const brandsMap = await fetchBrandsMap();
  console.log(`   Found brands for ${brandsMap.size} products`);

  // 3. Fetch all products via GraphQL (paginated)
  console.log('📦 Fetching products...');
  const allDocs: MeiliDoc[] = [];
  let after: string | null = null;
  let hasMore = true;
  let page = 0;

  while (hasMore) {
    page++;
    const vars: Record<string, unknown> = { first: BATCH };
    if (after) vars.after = after;

    const data = await gqlFetch(SYNC_QUERY, vars);
    const nodes: GQLNode[] = data.products.nodes;

    for (const n of nodes) {
      if (!n.databaseId || !n.name) continue;

      const cats = n.productCategories?.nodes || [];
      const brand = brandsMap.get(n.databaseId);
      const priceRaw = n.salePrice || n.price || n.regularPrice || '0';
      const priceNum = parseFloat(priceRaw.replace(/[^0-9.]/g, '')) || 0;

      allDocs.push({
        id: n.databaseId,
        name: n.name,
        slug: n.slug,
        sku: n.sku || '',
        price: n.price || '0',
        regular_price: n.regularPrice || '0',
        sale_price: n.salePrice || '',
        on_sale: n.onSale || false,
        stock_status: n.stockStatus || 'instock',
        image_src: n.image?.sourceUrl || '',
        image_alt: n.image?.altText || n.name,
        categories: cats.map(c => c.slug),
        category_names: cats.map(c => c.name),
        brand_name: brand?.name || '',
        brand_image: brand?.image || '',
        average_rating: n.averageRating || '0',
        rating_count: n.reviewCount || 0,
        short_description: stripHtml(n.shortDescription || ''),
        featured: n.featured || false,
        price_numeric: priceNum,
        created_at: Date.now(),
      });
    }

    hasMore = data.products.pageInfo.hasNextPage;
    after = data.products.pageInfo.endCursor;
    console.log(`   Page ${page}: ${nodes.length} products (total: ${allDocs.length})`);
  }

  if (allDocs.length === 0) {
    console.log('⚠ No products found. Check your GraphQL endpoint.');
    return;
  }

  // 4. Clear and re-index
  console.log(`🗑  Clearing old index...`);
  await meiliFetch(`/indexes/${INDEX}/documents`, 'DELETE');
  // Wait a moment for deletion to process
  await new Promise(r => setTimeout(r, 1000));

  // 5. Index in batches
  console.log(`📤 Indexing ${allDocs.length} products...`);
  for (let i = 0; i < allDocs.length; i += BATCH) {
    const batch = allDocs.slice(i, i + BATCH);
    await meiliFetch(`/indexes/${INDEX}/documents`, 'POST', batch);
    console.log(`   Indexed ${Math.min(i + BATCH, allDocs.length)}/${allDocs.length}`);
  }

  console.log(`\n✅ Sync complete! ${allDocs.length} products indexed in Meilisearch.`);
  console.log(`   Test: curl "${MEILI_HOST}/indexes/${INDEX}/search" -d '{"q":"portatil"}'`);
}

main().catch((err) => {
  console.error('❌ Sync failed:', err);
  process.exit(1);
});
