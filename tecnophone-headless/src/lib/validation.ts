/** Shared input-validation helpers for API routes */

/** Check if a value is a positive integer */
export function isPositiveInt(v: unknown): v is number {
  return typeof v === 'number' && Number.isInteger(v) && v > 0;
}

/** Validate email with a simple but effective regex */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** Strip all HTML tags from a string to prevent stored XSS */
export function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, '').trim();
}

/** Truncate a string to maxLen characters */
export function truncate(s: string, maxLen: number): string {
  return s.length > maxLen ? s.slice(0, maxLen) : s;
}

/** Allowed orderby values for /api/products */
export const ALLOWED_ORDERBY = new Set([
  'date',
  'title',
  'price',
  'popularity',
  'rating',
  'id',
  'slug',
  'menu_order',
]);
