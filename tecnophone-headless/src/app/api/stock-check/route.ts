import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';
import { isPositiveInt } from '@/lib/validation';

const WP_URL = process.env.NEXT_PUBLIC_WORDPRESS_URL || 'https://wp.tecnophone.co';
const CK = process.env.WC_CONSUMER_KEY;
const CS = process.env.WC_CONSUMER_SECRET;

interface StockCheckItem {
  product_id: number;
  variation_id?: number;
  quantity: number;
}

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 15 stock checks per minute per IP
    const limited = rateLimit(request, { name: 'stock-check', max: 15, windowMs: 60_000 });
    if (limited) return limited;

    if (!CK || !CS) {
      // If credentials missing, don't break the page — just say stock is OK
      return NextResponse.json({ valid: true, issues: [] });
    }

    const { items }: { items: StockCheckItem[] } = await request.json();

    if (!items?.length) {
      return NextResponse.json({ valid: true, issues: [] });
    }

    // Limit array size to prevent DoS amplification
    if (items.length > 20) {
      return NextResponse.json(
        { error: 'Demasiados items (máx 20)' },
        { status: 400 }
      );
    }

    // Validate each item has positive integer IDs (prevent path traversal)
    for (const item of items) {
      if (!isPositiveInt(item.product_id) || !isPositiveInt(item.quantity)) {
        return NextResponse.json({ error: 'Datos de producto inválidos' }, { status: 400 });
      }
      if (item.variation_id !== undefined && !isPositiveInt(item.variation_id)) {
        return NextResponse.json({ error: 'Datos de variación inválidos' }, { status: 400 });
      }
    }

    const issues: { product_id: number; name: string; reason: string }[] = [];

    // Check each product's stock via WC REST API
    const authHeader = 'Basic ' + Buffer.from(`${CK}:${CS}`).toString('base64');
    for (const item of items) {
      const id = item.variation_id || item.product_id;
      const endpoint = item.variation_id
        ? `${WP_URL}/wp-json/wc/v3/products/${item.product_id}/variations/${item.variation_id}`
        : `${WP_URL}/wp-json/wc/v3/products/${id}`;

      const res = await fetch(endpoint, {
        headers: { 'Authorization': authHeader },
        next: { revalidate: 0 },
      });

      if (!res.ok) {
        // API unreachable — do NOT mark as out of stock, just skip
        console.warn(`[Stock Check] API returned ${res.status} for product #${item.product_id}`);
        continue;
      }

      const product = await res.json();

      if (product.stock_status === 'outofstock') {
        issues.push({
          product_id: item.product_id,
          name: product.name || `Producto #${item.product_id}`,
          reason: 'Agotado',
        });
      } else if (
        product.manage_stock &&
        product.stock_quantity !== null &&
        product.stock_quantity < item.quantity
      ) {
        issues.push({
          product_id: item.product_id,
          name: product.name || `Producto #${item.product_id}`,
          reason: `Solo quedan ${product.stock_quantity} unidades`,
        });
      }
    }

    return NextResponse.json({
      valid: issues.length === 0,
      issues,
    });
  } catch (error) {
    console.error('[Stock Check] Error:', error);
    // On error, assume stock is OK — don't falsely mark products as out of stock
    return NextResponse.json({ valid: true, issues: [] });
  }
}
