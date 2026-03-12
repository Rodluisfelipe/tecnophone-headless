// WooCommerce Product types
export interface WCProduct {
  id: number;
  name: string;
  slug: string;
  type: string;
  status: string;
  featured: boolean;
  description: string;
  short_description: string;
  sku: string;
  price: string;
  regular_price: string;
  sale_price: string;
  on_sale: boolean;
  stock_status: string;
  stock_quantity: number | null;
  categories: WCCategory[];
  tags: WCTag[];
  images: WCImage[];
  attributes: WCAttribute[];
  variations: number[];
  average_rating: string;
  rating_count: number;
  related_ids: number[];
  meta_data: WCMeta[];
  brand?: WCBrand | null;
  external_url?: string;
  button_text?: string;
}

export interface WCCategory {
  id: number;
  name: string;
  slug: string;
  parent: number;
  description: string;
  image: WCImage | null;
  count: number;
}

export interface WCTag {
  id: number;
  name: string;
  slug: string;
}

export interface WCBrand {
  id: number;
  name: string;
  slug: string;
  image: WCImage | null;
}

export interface WCImage {
  id: number;
  src: string;
  name: string;
  alt: string;
}

export interface WCAttribute {
  id: number;
  name: string;
  position: number;
  visible: boolean;
  variation: boolean;
  options: string[];
}

export interface WCMeta {
  id: number;
  key: string;
  value: string;
}

export interface WCProductVariation {
  id: number;
  sku: string;
  price: string;
  regular_price: string;
  sale_price: string;
  stock_status: string;
  stock_quantity: number | null;
  attributes: { name: string; option: string }[];
  image: WCImage;
}

// Banner type (ACF custom fields from WordPress)
export interface Banner {
  title: string;
  subtitle: string;
  highlightText: string;
  badgeText: string;
  ctaText: string;
  ctaLink: string;
  gradientFrom: string;
  gradientTo: string;
  productImage: string;
  isActive: boolean;
  sortOrder: number;
}

// Cart types
export interface CartItem {
  product: WCProduct;
  quantity: number;
  variationId?: number;
  variation?: WCProductVariation;
}

// API response types
export interface PaginatedResponse<T> {
  data: T[];
  totalPages: number;
  total: number;
}
