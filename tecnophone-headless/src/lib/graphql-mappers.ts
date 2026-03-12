import { WCProduct, WCCategory, WCImage, WCProductVariation, Banner } from '@/types/woocommerce';
import { WPPost } from '@/lib/woocommerce';

// ============ RAW GRAPHQL RESPONSE TYPES ============

interface GQLImage {
  databaseId?: number;
  sourceUrl: string;
  altText?: string;
  title?: string;
}

interface GQLCategory {
  databaseId: number;
  name: string;
  slug: string;
  parentDatabaseId?: number;
  description?: string;
  count?: number;
  image?: GQLImage | null;
}

interface GQLTag {
  databaseId: number;
  name: string;
  slug: string;
}

interface GQLAttribute {
  name: string;
  position?: number;
  visible?: boolean;
  variation?: boolean;
  options?: string[];
}

interface GQLVariation {
  databaseId: number;
  sku?: string;
  price?: string;
  regularPrice?: string;
  salePrice?: string;
  stockStatus?: string;
  stockQuantity?: number | null;
  attributes?: {
    nodes: { name: string; value: string }[];
  };
  image?: GQLImage;
}

interface GQLMeta {
  id: number;
  key: string;
  value: string;
}

export interface GQLProduct {
  databaseId: number;
  name: string;
  slug: string;
  type?: string;
  status?: string;
  featured?: boolean;
  description?: string;
  shortDescription?: string;
  sku?: string;
  price?: string;
  regularPrice?: string;
  salePrice?: string;
  onSale?: boolean;
  stockStatus?: string;
  stockQuantity?: number | null;
  averageRating?: number;
  reviewCount?: number;
  externalUrl?: string;
  buttonText?: string;
  image?: GQLImage;
  galleryImages?: { nodes: GQLImage[] };
  productCategories?: { nodes: GQLCategory[] };
  productTags?: { nodes: GQLTag[] };
  attributes?: { nodes: GQLAttribute[] };
  variations?: { nodes: GQLVariation[] };
  related?: { nodes: { databaseId: number }[] };
  metaData?: GQLMeta[];
}

interface GQLPost {
  databaseId: number;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  date: string;
  featuredImage?: {
    node: GQLImage;
  };
}

interface GQLBanner {
  databaseId: number;
  title: string;
  bannerSettings?: {
    subtitulo?: string;
    textoDestacado?: string;
    badge?: string;
    textoBoton?: string;
    linkBoton?: string;
    gradientFrom?: string;
    gradientTo?: string;
    productImage?: {
      node: GQLImage;
    };
    isActive?: boolean;
    orden?: number;
  };
}

// ============ PRODUCT RESPONSES ============

export interface GQLProductsResponse {
  products: {
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
    nodes: GQLProduct[];
  };
}

export interface GQLSingleProductResponse {
  product: GQLProduct | null;
}

// ============ CATEGORY RESPONSES ============

export interface GQLCategoriesResponse {
  productCategories: {
    nodes: GQLCategory[];
  };
}

export interface GQLTagsResponse {
  productTags: {
    nodes: GQLTag[];
  };
}

// ============ POST RESPONSES ============

export interface GQLPostsResponse {
  posts: { nodes: GQLPost[] };
}

export interface GQLSinglePostResponse {
  post: GQLPost | null;
}

// ============ BANNER RESPONSES ============

export interface GQLBannersResponse {
  banners: { nodes: GQLBanner[] };
}

// ============ MAPPER FUNCTIONS ============

function mapImage(img?: GQLImage | null): WCImage {
  if (!img) return { id: 0, src: '', name: '', alt: '' };
  return {
    id: img.databaseId || 0,
    src: img.sourceUrl || '',
    name: img.title || '',
    alt: img.altText || '',
  };
}

export function mapGraphQLProduct(p: GQLProduct): WCProduct {
  const mainImage = mapImage(p.image);
  const galleryImages = p.galleryImages?.nodes?.map(mapImage) || [];
  const allImages = mainImage.src ? [mainImage, ...galleryImages] : galleryImages;

  // WooGraphQL returns price as a range string for variable products e.g. "100000-200000"
  // or as a single value. We need to extract the first numeric value.
  const parsePrice = (raw?: string): string => {
    if (!raw) return '';
    // Remove currency symbols and whitespace, take first number
    const cleaned = raw.replace(/[^0-9.,\-]/g, '');
    // If it's a range like "100000-200000", take the first value
    const parts = cleaned.split('-');
    return parts[0] || '';
  };

  return {
    id: p.databaseId,
    name: p.name || '',
    slug: p.slug || '',
    type: (p.type || 'simple').toLowerCase(),
    status: p.status || 'publish',
    featured: p.featured || false,
    description: p.description || '',
    short_description: p.shortDescription || '',
    sku: p.sku || '',
    price: parsePrice(p.price),
    regular_price: parsePrice(p.regularPrice),
    sale_price: parsePrice(p.salePrice),
    on_sale: p.onSale || false,
    stock_status: (p.stockStatus || 'instock').toLowerCase().replace('_', ''),
    stock_quantity: p.stockQuantity ?? null,
    categories: p.productCategories?.nodes?.map(mapGraphQLCategory) || [],
    tags: p.productTags?.nodes?.map((t) => ({
      id: t.databaseId,
      name: t.name,
      slug: t.slug,
    })) || [],
    images: allImages,
    attributes: p.attributes?.nodes?.map((a, i) => ({
      id: i,
      name: a.name || '',
      position: a.position || 0,
      visible: a.visible ?? true,
      variation: a.variation || false,
      options: a.options || [],
    })) || [],
    variations: p.variations?.nodes?.map((v) => v.databaseId) || [],
    average_rating: String(p.averageRating || '0'),
    rating_count: p.reviewCount || 0,
    related_ids: p.related?.nodes?.map((r) => r.databaseId) || [],
    meta_data: p.metaData?.map((m) => ({
      id: m.id,
      key: m.key,
      value: m.value,
    })) || [],
    external_url: p.externalUrl || '',
    button_text: p.buttonText || '',
  };
}

export function mapGraphQLCategory(c: GQLCategory): WCCategory {
  return {
    id: c.databaseId,
    name: c.name || '',
    slug: c.slug || '',
    parent: c.parentDatabaseId || 0,
    description: c.description || '',
    image: c.image ? mapImage(c.image) : null,
    count: c.count || 0,
  };
}

export function mapGraphQLVariation(v: GQLVariation): WCProductVariation {
  return {
    id: v.databaseId,
    sku: v.sku || '',
    price: v.price || '',
    regular_price: v.regularPrice || '',
    sale_price: v.salePrice || '',
    stock_status: (v.stockStatus || 'instock').toLowerCase().replace('_', ''),
    stock_quantity: v.stockQuantity ?? null,
    attributes: v.attributes?.nodes?.map((a) => ({
      name: a.name,
      option: a.value,
    })) || [],
    image: mapImage(v.image),
  };
}

export function mapGraphQLPost(p: GQLPost): WPPost {
  return {
    id: p.databaseId,
    slug: p.slug,
    title: { rendered: p.title || '' },
    excerpt: { rendered: p.excerpt || '' },
    content: { rendered: p.content || '' },
    date: p.date || '',
    featured_media: 0,
    _embedded: p.featuredImage?.node
      ? {
          'wp:featuredmedia': [
            {
              source_url: p.featuredImage.node.sourceUrl,
              alt_text: p.featuredImage.node.altText || '',
            },
          ],
        }
      : undefined,
  };
}

export function mapGraphQLBanner(b: GQLBanner): Banner {
  const s = b.bannerSettings;
  return {
    title: b.title || '',
    subtitle: s?.subtitulo || '',
    highlightText: s?.textoDestacado || '',
    badgeText: s?.badge || '',
    ctaText: s?.textoBoton || 'Ver más',
    ctaLink: s?.linkBoton || '/productos',
    gradientFrom: s?.gradientFrom || '#2563eb',
    gradientTo: s?.gradientTo || '#1e40af',
    productImage: s?.productImage?.node?.sourceUrl || '',
    isActive: s?.isActive !== false,
    sortOrder: s?.orden || 0,
  };
}
