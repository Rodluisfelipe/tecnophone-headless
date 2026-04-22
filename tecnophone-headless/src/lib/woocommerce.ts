import { WCProduct, WCCategory, WCProductVariation, WCTag, WCBrand, Banner } from '@/types/woocommerce';
import { graphqlFetch } from '@/lib/graphql';
import { unstable_cache, revalidateTag } from 'next/cache';
import { PRODUCTS_QUERY, PRODUCT_BY_SLUG_QUERY, PRODUCT_BY_ID_QUERY, PRODUCTS_LIST_QUERY, ALL_PRODUCT_SLUGS_QUERY } from '@/lib/queries/products';
import { CATEGORIES_QUERY, CATEGORY_BY_SLUG_QUERY } from '@/lib/queries/categories';
import { POSTS_QUERY, POST_BY_SLUG_QUERY } from '@/lib/queries/posts';
import { BANNERS_QUERY } from '@/lib/queries/banners';
import { PRODUCT_TAGS_QUERY } from '@/lib/queries/tags';
import {
  GQLProductsResponse,
  GQLSingleProductResponse,
  GQLCategoriesResponse,
  GQLTagsResponse,
  GQLPostsResponse,
  GQLSinglePostResponse,
  GQLBannersResponse,
  GQLProduct,
  mapGraphQLProduct,
  mapGraphQLCategory,
  mapGraphQLVariation,
  mapGraphQLPost,
  mapGraphQLBanner,
} from '@/lib/graphql-mappers';

// ============ IN-MEMORY CACHE ============

interface CacheEntry<T> {
  data: T;
  expires: number;
}

const memCache = new Map<string, CacheEntry<unknown>>();

function getCached<T>(key: string): T | null {
  const entry = memCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    memCache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCache<T>(key: string, data: T, ttlSeconds: number): void {
  memCache.set(key, { data, expires: Date.now() + ttlSeconds * 1000 });
  // Evict old entries if cache grows too large
  if (memCache.size > 500) {
    const now = Date.now();
    memCache.forEach((v, k) => {
      if (now > v.expires) memCache.delete(k);
    });

  }
}

/** Invalidate all cached entries for a product (by slug and/or id). Called by webhooks. */
export function invalidateProductCache(slug?: string, productId?: number): void {
  if (slug) {
    memCache.delete(`product_${slug}`);
  }
  if (productId) {
    memCache.delete(`product_id_${productId}`);
  }
  // Also clear the products list caches so catalog pages get fresh data
  memCache.forEach((_v, key) => {
    if (key.startsWith('products_') || key.startsWith('search_')) {
      memCache.delete(key);
    }
  });
}

// ============ DISTRIBUTED CACHE TAGS (Vercel Data Cache) ============
// Tags shared across all serverless instances. Use revalidateTag from
// a Server Action or Route Handler to invalidate cluster-wide.
export const CACHE_TAGS = {
  products: 'wc-products',
  product: (slug: string) => `wc-product-${slug}`,
  productById: (id: number) => `wc-product-id-${id}`,
  categories: 'wc-categories',
  category: (slug: string) => `wc-category-${slug}`,
} as const;

/** Revalidate distributed cache for all products + lists. */
export function revalidateAllProducts(): void {
  revalidateTag(CACHE_TAGS.products);
}

/** Revalidate distributed cache for a single product (and product lists). */
export function revalidateProduct(slug?: string, productId?: number): void {
  if (slug) revalidateTag(CACHE_TAGS.product(slug));
  if (productId) revalidateTag(CACHE_TAGS.productById(productId));
  revalidateTag(CACHE_TAGS.products);
}

// ============ ORDERBY MAPPING ============

function mapOrderby(orderby?: string, order?: string): { field: string; order: string }[] | undefined {
  if (!orderby) return undefined;
  const gqlOrder = (order || 'desc').toUpperCase();
  const mapping: Record<string, string> = {
    date: 'DATE',
    price: 'PRICE',
    title: 'SLUG',
    popularity: 'TOTAL_SALES',
    rating: 'RATING',
    menu_order: 'MENU_ORDER',
  };
  const field = mapping[orderby] || 'DATE';
  return [{ field, order: gqlOrder }];
}

// ============ PRODUCTS ============

export async function getProducts(params: {
  page?: number;
  per_page?: number;
  category?: number;
  category_slug?: string;
  tag?: number;
  tag_slug?: string;
  search?: string;
  orderby?: string;
  order?: string;
  featured?: boolean;
  on_sale?: boolean;
  min_price?: number;
  max_price?: number;
} = {}): Promise<{ products: WCProduct[]; totalPages: number; total: number }> {
  const perPage = params.per_page || 12;
  const page = params.page || 1;

  // For page > 1 we must fetch all items up to the requested page
  // because WPGraphQL uses cursor-based pagination.
  const fetchCount = page * perPage;

  const variables: Record<string, unknown> = {
    first: fetchCount,
    orderby: mapOrderby(params.orderby, params.order),
  };

  if (params.search) variables.search = params.search;
  if (params.on_sale) variables.onSale = true;
  if (params.featured) variables.featured = true;
  if (params.min_price) variables.minPrice = params.min_price;
  if (params.max_price) variables.maxPrice = params.max_price;
  if (params.tag_slug) variables.tagSlug = [params.tag_slug];
  if (params.category_slug) variables.categorySlug = [params.category_slug];

  // Category filtering: GraphQL uses slug, REST uses ID.
  if (params.category) {
    const catCacheKey = `cat_slug_${params.category}`;
    let catSlug = getCached<string>(catCacheKey);
    if (!catSlug) {
      try {
        const catData = await graphqlFetch<{ productCategory: { slug: string } | null }>(
          `query GetCatSlug($id: ID!) { productCategory(id: $id, idType: DATABASE_ID) { slug } }`,
          { id: String(params.category) },
          3600
        );
        if (catData.productCategory?.slug) {
          catSlug = catData.productCategory.slug;
          setCache(catCacheKey, catSlug, 3600);
        }
      } catch {
        // If category lookup fails, skip filter
      }
    }
    if (catSlug) variables.categorySlug = [catSlug];
  }

  // Use lightweight query for list views (no description, no meta, no related, no gallery)
  const cacheKey = `products_${JSON.stringify(variables)}`;
  const cached = getCached<{ products: WCProduct[]; totalPages: number; total: number }>(cacheKey);
  if (cached) return cached;

  const data = await graphqlFetch<GQLProductsResponse>(PRODUCTS_LIST_QUERY, variables, 900);
  const allProducts = data.products.nodes.map(mapGraphQLProduct);

  // Slice to the requested page
  const offset = (page - 1) * perPage;
  const products = allProducts.slice(offset, offset + perPage);

  // Enrich with brand data
  await enrichProductsWithBrands(products);

  // Total estimation: if we fetched `fetchCount` items and there are more,
  // total is at least fetchCount + 1. Otherwise total is allProducts.length.
  const hasMore = data.products.pageInfo.hasNextPage;
  const total = hasMore ? allProducts.length + perPage : allProducts.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  const result = { products, totalPages, total };
  setCache(cacheKey, result, 300);
  return result;
}

export async function getProduct(slug: string): Promise<WCProduct | null> {
  const cacheKey = `product_${slug}`;
  const cached = getCached<WCProduct | null>(cacheKey);
  if (cached !== null) return cached;

  const fetcher = unstable_cache(
    async (s: string) => {
      const data = await graphqlFetch<GQLSingleProductResponse>(PRODUCT_BY_SLUG_QUERY, { slug: s }, 900);
      const p = data.product ? mapGraphQLProduct(data.product) : null;
      if (p) await enrichProductsWithBrands([p]);
      return p;
    },
    [`wc-product-by-slug`],
    { revalidate: 600, tags: [CACHE_TAGS.products, CACHE_TAGS.product(slug)] }
  );

  const product = await fetcher(slug);
  if (product) setCache(cacheKey, product, 600);
  return product;
}

export async function getProductById(id: number): Promise<WCProduct> {
  const cacheKey = `product_id_${id}`;
  const cached = getCached<WCProduct>(cacheKey);
  if (cached) return cached;

  const fetcher = unstable_cache(
    async (productId: number) => {
      const data = await graphqlFetch<GQLSingleProductResponse>(PRODUCT_BY_ID_QUERY, { id: String(productId) }, 900);
      if (!data.product) throw new Error(`Product ${productId} not found`);
      const p = mapGraphQLProduct(data.product);
      await enrichProductsWithBrands([p]);
      return p;
    },
    [`wc-product-by-id`],
    { revalidate: 600, tags: [CACHE_TAGS.products, CACHE_TAGS.productById(id)] }
  );

  const product = await fetcher(id);
  setCache(cacheKey, product, 600);
  return product;
}

export async function getProductVariations(productId: number): Promise<WCProductVariation[]> {
  // WooGraphQL returns variations as part of the product query for VariableProduct
  const data = await graphqlFetch<GQLSingleProductResponse>(PRODUCT_BY_ID_QUERY, { id: String(productId) });
  if (!data.product) return [];
  const gqlProduct = data.product as GQLProduct & { variations?: { nodes: unknown[] } };
  if (!gqlProduct.variations?.nodes) return [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return gqlProduct.variations.nodes.map((v: any) => mapGraphQLVariation(v));
}

export async function getRelatedProducts(productId: number): Promise<WCProduct[]> {
  const product = await getProductById(productId);
  if (!product.related_ids.length) return [];

  const relatedIds = product.related_ids.slice(0, 4);
  const promises = relatedIds.map((id) => getProductById(id));
  const results = await Promise.allSettled(promises);

  return results
    .filter((r): r is PromiseFulfilledResult<WCProduct> => r.status === 'fulfilled')
    .map((r) => r.value);
}

// ============ CATEGORIES ============

export async function getCategories(params: {
  per_page?: number;
  parent?: number;
  hide_empty?: boolean;
} = {}): Promise<WCCategory[]> {
  const cacheKey = `categories_${params.parent}_${params.hide_empty}`;
  const cached = getCached<WCCategory[]>(cacheKey);
  if (cached) return cached;

  const fetcher = unstable_cache(
    async (perPage: number, hideEmpty: boolean) => {
      const variables: Record<string, unknown> = { first: perPage, hideEmpty };
      const data = await graphqlFetch<GQLCategoriesResponse>(CATEGORIES_QUERY, variables, 3600);
      return data.productCategories.nodes.map(mapGraphQLCategory);
    },
    [`wc-categories`],
    { revalidate: 1800, tags: [CACHE_TAGS.categories] }
  );

  let categories = await fetcher(params.per_page || 100, params.hide_empty !== false);

  if (params.parent !== undefined) {
    categories = categories.filter((c) => c.parent === params.parent);
  }

  setCache(cacheKey, categories, 1800);
  return categories;
}

export async function getCategory(slug: string): Promise<WCCategory | null> {
  const cacheKey = `category_${slug}`;
  const cached = getCached<WCCategory | null>(cacheKey);
  if (cached !== null) return cached;

  const fetcher = unstable_cache(
    async (s: string) => {
      const data = await graphqlFetch<GQLCategoriesResponse>(CATEGORY_BY_SLUG_QUERY, { slug: [s] }, 3600);
      const cat = data.productCategories.nodes[0];
      return cat ? mapGraphQLCategory(cat) : null;
    },
    [`wc-category-by-slug`],
    { revalidate: 1800, tags: [CACHE_TAGS.categories, CACHE_TAGS.category(slug)] }
  );

  const category = await fetcher(slug);
  if (category) setCache(cacheKey, category, 1800);
  return category;
}

// ============ SEARCH ============

export async function searchProducts(query: string, limit = 10): Promise<WCProduct[]> {
  const { products } = await getProducts({ search: query, per_page: limit });
  return products;
}

/** Search with full product details (description, gallery, attributes). Used by AI chat. */
export async function searchProductsDetailed(query: string, limit = 8): Promise<WCProduct[]> {
  const variables: Record<string, unknown> = { first: limit, search: query };
  const cacheKey = `search_detailed_${query}_${limit}`;
  const cached = getCached<WCProduct[]>(cacheKey);
  if (cached) return cached;

  const data = await graphqlFetch<GQLProductsResponse>(PRODUCTS_QUERY, variables, 900);
  const products = data.products.nodes.map(mapGraphQLProduct);
  await enrichProductsWithBrands(products);
  setCache(cacheKey, products, 300);
  return products;
}

// ============ PRODUCT TAGS (BRANDS) ============

export async function getProductTags(params: {
  per_page?: number;
  hide_empty?: boolean;
} = {}): Promise<WCTag[]> {
  const cacheKey = `product_tags_${params.per_page}_${params.hide_empty}`;
  const cached = getCached<WCTag[]>(cacheKey);
  if (cached) return cached;

  const variables: Record<string, unknown> = {
    first: params.per_page || 100,
    hideEmpty: params.hide_empty !== false,
  };

  const data = await graphqlFetch<GQLTagsResponse>(PRODUCT_TAGS_QUERY, variables, 3600);
  const tags: WCTag[] = data.productTags.nodes.map((t) => ({
    id: t.databaseId,
    name: t.name,
    slug: t.slug,
  }));

  setCache(cacheKey, tags, 1800);
  return tags;
}

// ============ PRODUCT ↔ BRAND MAPPING ============

interface RestProductBrand {
  id: number;
  brands?: { id: number; name: string; slug: string }[];
}

// Fetch product→brand associations from WC REST API (cached 30 min)
async function getProductBrandMap(): Promise<Map<number, { id: number; name: string; slug: string }>> {
  const cacheKey = 'product_brand_map';
  const cached = getCached<Map<number, { id: number; name: string; slug: string }>>(cacheKey);
  if (cached) return cached;

  const baseUrl = process.env.NEXT_PUBLIC_WORDPRESS_URL || 'https://wp.tecnophone.co';
  const ck = process.env.WC_CONSUMER_KEY || '';
  const cs = process.env.WC_CONSUMER_SECRET || '';
  const brandMap = new Map<number, { id: number; name: string; slug: string }>();

  try {
    let page = 1;
    let hasMore = true;
    while (hasMore) {
      const authHeader = 'Basic ' + Buffer.from(`${ck}:${cs}`).toString('base64');
      const url = `${baseUrl}/wp-json/wc/v3/products?per_page=100&page=${page}&_fields=id,brands&status=publish`;
      const res = await fetch(url, {
        headers: { 'Authorization': authHeader },
        next: { revalidate: 1800 },
      });
      if (!res.ok) break;
      const data: RestProductBrand[] = await res.json();
      for (const p of data) {
        if (p.brands && Array.isArray(p.brands) && p.brands.length > 0) {
          brandMap.set(p.id, p.brands[0]);
        }
      }
      hasMore = data.length === 100;
      page++;
    }
  } catch {
    // Silently fail — products will just not have brand info
  }

  setCache(cacheKey, brandMap, 1800);
  return brandMap;
}

// Enrich products with brand data (name + logo from brands list)
async function enrichProductsWithBrands(products: WCProduct[]): Promise<void> {
  try {
    const [brandMap, allBrands] = await Promise.all([getProductBrandMap(), getBrands()]);
    const brandBySlug = new Map(allBrands.map((b) => [b.slug, b]));

    for (const product of products) {
      const brandInfo = brandMap.get(product.id);
      if (brandInfo) {
        const fullBrand = brandBySlug.get(brandInfo.slug);
        product.brand = fullBrand || {
          id: brandInfo.id,
          name: brandInfo.name.replace(/&amp;/g, '&'),
          slug: brandInfo.slug,
          image: null,
        };
      }
    }
  } catch {
    // Silently fail
  }
}

// Fetch brands from WooCommerce REST API (products/brands taxonomy with logos)
export async function getBrands(): Promise<WCBrand[]> {
  const cacheKey = 'wc_brands';
  const cached = getCached<WCBrand[]>(cacheKey);
  if (cached) return cached;

  const baseUrl = process.env.NEXT_PUBLIC_WORDPRESS_URL || 'https://wp.tecnophone.co';
  const ck = process.env.WC_CONSUMER_KEY || '';
  const cs = process.env.WC_CONSUMER_SECRET || '';
  const authHeader = 'Basic ' + Buffer.from(`${ck}:${cs}`).toString('base64');
  const url = `${baseUrl}/wp-json/wc/v3/products/brands?per_page=100`;

  try {
    const res = await fetch(url, {
      headers: { 'Authorization': authHeader },
      next: { revalidate: 1800 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const brands: WCBrand[] = (data as Array<{ id: number; name: string; slug: string; image?: { id: number; src: string; name: string; alt: string } | null }>).map((b) => ({
      id: b.id,
      name: b.name.replace(/&amp;/g, '&'),
      slug: b.slug,
      image: b.image ? { id: b.image.id, src: b.image.src, name: b.image.name, alt: b.image.alt } : null,
    }));
    brands.sort((a, b) => a.name.localeCompare(b.name));
    setCache(cacheKey, brands, 1800);
    return brands;
  } catch {
    return [];
  }
}

// ============ BLOG (WordPress Posts) ============

export interface WPPost {
  id: number;
  slug: string;
  title: { rendered: string };
  excerpt: { rendered: string };
  content: { rendered: string };
  date: string;
  featured_media: number;
  _embedded?: {
    'wp:featuredmedia'?: Array<{ source_url: string; alt_text: string }>;
  };
}

export async function getPosts(params: { per_page?: number; page?: number } = {}): Promise<WPPost[]> {
  const cacheKey = `posts_${params.per_page || 10}`;
  const cached = getCached<WPPost[]>(cacheKey);
  if (cached) return cached;

  const data = await graphqlFetch<GQLPostsResponse>(POSTS_QUERY, {
    first: params.per_page || 10,
  }, 1800);
  const posts = data.posts.nodes.map(mapGraphQLPost);
  setCache(cacheKey, posts, 900);
  return posts;
}

export async function getPost(slug: string): Promise<WPPost | null> {
  const cacheKey = `post_${slug}`;
  const cached = getCached<WPPost | null>(cacheKey);
  if (cached !== null) return cached;

  const data = await graphqlFetch<GQLSinglePostResponse>(POST_BY_SLUG_QUERY, { slug }, 1800);
  const post = data.post ? mapGraphQLPost(data.post) : null;
  if (post) setCache(cacheKey, post, 900);
  return post;
}

// ============ BANNERS ============

export async function getBanners(): Promise<Banner[]> {
  const cacheKey = 'banners';
  const cached = getCached<Banner[]>(cacheKey);
  if (cached) return cached;

  try {
    const data = await graphqlFetch<GQLBannersResponse>(BANNERS_QUERY, {}, 120);
    const banners = data.banners.nodes
      .map(mapGraphQLBanner)
      .filter((b) => b.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder);
    setCache(cacheKey, banners, 60);
    return banners;
  } catch (error) {
    console.error('[getBanners] ERROR:', error);
    return [];
  }
}

// Helper for generateStaticParams
export async function getAllProductSlugs(): Promise<string[]> {
  const slugs: string[] = [];
  let after: string | null = null;
  let hasMore = true;

  while (hasMore) {
    const vars: Record<string, unknown> = { first: 100 };
    if (after) vars.after = after;

    const res = await graphqlFetch<{ products: { pageInfo: { hasNextPage: boolean; endCursor: string | null }; nodes: { slug: string }[] } }>(
      ALL_PRODUCT_SLUGS_QUERY,
      vars,
      3600
    );
    slugs.push(...res.products.nodes.map((n) => n.slug));
    hasMore = res.products.pageInfo.hasNextPage;
    after = res.products.pageInfo.endCursor;
  }

  return slugs;
}

// ============ Utility ============

export function formatPrice(price: string | number): string {
  const num = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(num)) return '$0';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

export function calculateDiscount(regularPrice: string, salePrice: string): number {
  const regular = parseFloat(regularPrice);
  const sale = parseFloat(salePrice);
  if (!regular || !sale || regular <= sale) return 0;
  return Math.round(((regular - sale) / regular) * 100);
}
