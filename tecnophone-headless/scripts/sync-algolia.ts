/**
 * Sync all WooCommerce products to Algolia.
 *
 * Usage:
 *   npx tsx scripts/sync-algolia.ts
 *
 * Requires env vars:
 *   NEXT_PUBLIC_GRAPHQL_URL, NEXT_PUBLIC_ALGOLIA_APP_ID, ALGOLIA_ADMIN_KEY
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { algoliasearch } from 'algoliasearch';

const GRAPHQL_URL = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'https://wp.tecnophone.co/graphql';
const APP_ID = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID || '';
const ADMIN_KEY = process.env.ALGOLIA_ADMIN_KEY || '';
const INDEX = 'products';
const WC_KEY = process.env.WC_CONSUMER_KEY || '';
const WC_SECRET = process.env.WC_CONSUMER_SECRET || '';
const WP_URL = process.env.NEXT_PUBLIC_WORDPRESS_URL || 'https://wp.tecnophone.co';

if (!APP_ID || !ADMIN_KEY) {
  console.error('❌ Missing NEXT_PUBLIC_ALGOLIA_APP_ID or ALGOLIA_ADMIN_KEY in .env.local');
  process.exit(1);
}

const client = algoliasearch(APP_ID, ADMIN_KEY);

// ── GraphQL query ──
const SYNC_QUERY = `
  query SyncProducts($first: Int!, $after: String) {
    products(first: $first, after: $after, where: { status: "publish" }) {
      pageInfo { hasNextPage endCursor }
      nodes {
        ... on SimpleProduct {
          databaseId name slug sku type featured
          onSale stockStatus shortDescription
          price(format: RAW) regularPrice(format: RAW) salePrice(format: RAW)
          averageRating reviewCount
          image { sourceUrl altText }
          productCategories { nodes { name slug } }
        }
        ... on VariableProduct {
          databaseId name slug sku type featured
          onSale stockStatus shortDescription
          price(format: RAW) regularPrice(format: RAW) salePrice(format: RAW)
          averageRating reviewCount
          image { sourceUrl altText }
          productCategories { nodes { name slug } }
        }
        ... on ExternalProduct {
          databaseId name slug type onSale
          price(format: RAW) regularPrice(format: RAW) salePrice(format: RAW)
          image { sourceUrl altText }
          productCategories { nodes { name slug } }
        }
      }
    }
  }
`;

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

// ── Fetch brands via REST ──
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
        if (p.brands?.[0]) {
          map.set(p.id, { name: p.brands[0].name, image: p.brands[0].image?.src || '' });
        }
      }
      hasMore = products.length === 100;
      page++;
    }
  } catch (e) {
    console.warn('⚠ Could not fetch brands:', (e as Error).message);
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

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, ' ').trim();
}

// ── Main ──
async function main() {
  console.log('🔄 Starting Algolia sync...');
  console.log(`   App ID:  ${APP_ID}`);
  console.log(`   Index:   ${INDEX}`);
  console.log(`   GraphQL: ${GRAPHQL_URL}`);

  // 1. Fetch brands
  console.log('\n📦 Fetching brands...');
  const brandsMap = await fetchBrandsMap();
  console.log(`   Found brands for ${brandsMap.size} products`);

  // 2. Fetch all products via GraphQL
  console.log('📦 Fetching products...');
  const allDocs: Record<string, unknown>[] = [];
  let after: string | null = null;
  let hasMore = true;
  let page = 0;

  while (hasMore) {
    page++;
    const vars: Record<string, unknown> = { first: 100 };
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
        objectID: String(n.databaseId),
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
        categories: cats.map((c) => c.slug),
        category_names: cats.map((c) => c.name),
        brand_name: brand?.name || '',
        brand_image: brand?.image || '',
        average_rating: n.averageRating || '0',
        short_description: stripHtml(n.shortDescription || ''),
        featured: n.featured || false,
        price_numeric: priceNum,
      });
    }

    hasMore = data.products.pageInfo.hasNextPage;
    after = data.products.pageInfo.endCursor;
    console.log(`   Page ${page}: ${nodes.length} products (total: ${allDocs.length})`);
  }

  if (allDocs.length === 0) {
    console.log('⚠ No products found.');
    return;
  }

  // 3. Configure index settings
  console.log('\n⚙️  Configuring index settings...');
  await client.setSettings({
    indexName: INDEX,
    indexSettings: {
      searchableAttributes: ['name', 'brand_name', 'category_names', 'short_description', 'sku'],
      attributesForFaceting: ['categories', 'brand_name', 'on_sale', 'stock_status'],
      customRanking: ['desc(featured)', 'desc(on_sale)'],
      typoTolerance: true,
      minWordSizefor1Typo: 3,
      minWordSizefor2Typos: 6,
    },
  });
  console.log('   ✅ Settings configured');

  // 4. Replace all objects (atomic: clears old + adds new in one operation)
  console.log(`\n📤 Indexing ${allDocs.length} products...`);
  await client.replaceAllObjects({
    indexName: INDEX,
    objects: allDocs,
  });

  console.log(`\n✅ Sync complete! ${allDocs.length} products indexed in Algolia.`);
}

main().catch((err) => {
  console.error('❌ Sync failed:', err);
  process.exit(1);
});
