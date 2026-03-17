import { algoliasearch } from 'algoliasearch';

const APP_ID = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID || '';
const SEARCH_KEY = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY || '';
const ADMIN_KEY = process.env.ALGOLIA_ADMIN_KEY || '';

export const INDEX_NAME = 'products';

/** Search-only client (safe for server & client) */
export function getSearchClient() {
  return algoliasearch(APP_ID, SEARCH_KEY);
}

/** Admin client (server-side only — for indexing) */
export function getAdminClient() {
  return algoliasearch(APP_ID, ADMIN_KEY);
}

/** Shape of a product document in Algolia */
export interface AlgoliaProduct {
  objectID: string;
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
  short_description: string;
  featured: boolean;
  price_numeric: number;
}

/** Check if Algolia is configured */
export function isAlgoliaConfigured(): boolean {
  return !!(APP_ID && SEARCH_KEY);
}
