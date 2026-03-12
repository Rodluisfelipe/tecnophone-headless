import { NextRequest, NextResponse } from 'next/server';
import { getProducts } from '@/lib/woocommerce';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const page = parseInt(searchParams.get('page') || '1');
  const per_page = Math.min(parseInt(searchParams.get('per_page') || '12'), 100);
  const category = searchParams.get('category')
    ? parseInt(searchParams.get('category')!)
    : undefined;
  const search = searchParams.get('search') || undefined;
  const orderby = searchParams.get('orderby') || 'date';
  const order = searchParams.get('order') || 'desc';
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
