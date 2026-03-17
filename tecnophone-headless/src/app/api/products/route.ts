import { NextRequest, NextResponse } from 'next/server';
import { getProducts } from '@/lib/woocommerce';
import { rateLimit } from '@/lib/rate-limit';
import { ALLOWED_ORDERBY } from '@/lib/validation';

export async function GET(request: NextRequest) {
  // Rate limit: 30 product list requests per minute per IP
  const limited = rateLimit(request, { name: 'products', max: 30, windowMs: 60_000 });
  if (limited) return limited;

  const searchParams = request.nextUrl.searchParams;

  const page = parseInt(searchParams.get('page') || '1');
  const per_page = Math.min(parseInt(searchParams.get('per_page') || '12'), 100);
  const category = searchParams.get('category')
    ? parseInt(searchParams.get('category')!)
    : undefined;
  const search = searchParams.get('search')?.slice(0, 200) || undefined;
  const rawOrderby = searchParams.get('orderby') || 'date';
  const orderby = ALLOWED_ORDERBY.has(rawOrderby) ? rawOrderby : 'date';
  const order = searchParams.get('order') === 'asc' ? 'asc' : 'desc';
  const on_sale = searchParams.get('on_sale') === 'true';
  const featured = searchParams.get('featured') === 'true';
  const min_price = searchParams.get('min_price')
    ? parseInt(searchParams.get('min_price')!)
    : undefined;
  const max_price = searchParams.get('max_price')
    ? parseInt(searchParams.get('max_price')!)
    : undefined;

  try {
    const result = await getProducts({
      page,
      per_page,
      category,
      search,
      orderby,
      order,
      on_sale: on_sale || undefined,
      featured: featured || undefined,
      min_price,
      max_price,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al obtener productos' },
      { status: 500 }
    );
  }
}
