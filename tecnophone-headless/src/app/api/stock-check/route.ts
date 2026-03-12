import { NextRequest, NextResponse } from 'next/server';

const WP_URL = process.env.NEXT_PUBLIC_WORDPRESS_URL || 'https://www.tecnophone.co';
const CK = process.env.WC_CONSUMER_KEY;
const CS = process.env.WC_CONSUMER_SECRET;

interface StockCheckItem {
  product_id: number;
  variation_id?: number;
  quantity: number;
}

export async function POST(request: NextRequest) {
  try {
    if (!CK || !CS) {
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
    }

    const { items }: { items: StockCheckItem[] } = await request.json();

    if (!items?.length) {
      return NextResponse.json({ valid: true, issues: [] });
    }

    const authHeader = 'Basic ' + Buffer.from(`${CK}:${CS}`).toString('base64');
    const issues: { product_id: number; name: string; reason: string }[] = [];

    // Check each product's stock via WC REST API
    for (const item of items) {
      const id = item.variation_id || item.product_id;
      const endpoint = item.variation_id
        ? `${WP_URL}/wp-json/wc/v3/products/${item.product_id}/variations/${item.variation_id}`
        : `${WP_URL}/wp-json/wc/v3/products/${item.product_id}`;

      const res = await fetch(endpoint, {
        headers: { Authorization: authHeader },
        next: { revalidate: 0 },
      });

      if (!res.ok) {
        issues.push({
          product_id: item.product_id,
          name: `Producto #${item.product_id}`,
          reason: 'No se pudo verificar disponibilidad',
        });
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
    return NextResponse.json({ valid: true, issues: [] });
  }
}
