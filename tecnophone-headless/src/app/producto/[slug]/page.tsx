import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getProduct, getProducts, getAllProductSlugs } from '@/lib/woocommerce';
import { WCProduct } from '@/types/woocommerce';
import ProductDetail from './ProductDetail';

export const revalidate = 900;
export const dynamicParams = true;

interface Props {
  params: { slug: string };
}

export async function generateStaticParams() {
  try {
    const slugs = await getAllProductSlugs();
    return slugs.map((slug) => ({ slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProduct(decodeURIComponent(params.slug));
  if (!product) return { title: 'Producto no encontrado' };

  const { calculateDiscount, formatPrice } = await import('@/lib/woocommerce');
  const discount = calculateDiscount(product.regular_price, product.sale_price);
  const price = formatPrice(product.price);
  const displayCategory = product.categories.find(
    (c) => !['full', 'sin-categorizar', 'uncategorized'].includes(c.slug)
  );

  const ogParams = new URLSearchParams({
    name:     product.name,
    price,
    image:    product.images[0]?.src || '',
    discount: String(discount),
    category: displayCategory?.name || '',
  });
  const ogImageUrl = `https://tecnophone.co/api/og?${ogParams.toString()}`;
  const description =
    product.short_description.replace(/<[^>]*>/g, '').slice(0, 160) ||
    `Compra ${product.name} al mejor precio en TecnoPhone. Envíos a todo Colombia.`;

  return {
    title: product.name,
    description,
    alternates: {
      canonical: `/producto/${product.slug}`,
    },
    openGraph: {
      title: product.name,
      description,
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: product.name }],
      url: `/producto/${product.slug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description,
      images: [ogImageUrl],
    },
  };
}

function buildProductJsonLd(product: WCProduct) {
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.tecnophone.co';
  const url = `${SITE_URL}/producto/${product.slug}`;
  const description =
    product.short_description.replace(/<[^>]*>/g, '').slice(0, 5000) ||
    product.name;
  const availability =
    product.stock_status === 'instock'
      ? 'https://schema.org/InStock'
      : 'https://schema.org/OutOfStock';

  const offers: Record<string, unknown> = {
    '@type': 'Offer',
    url,
    priceCurrency: 'COP',
    price: product.price || product.regular_price,
    availability,
    itemCondition: 'https://schema.org/NewCondition',
    seller: {
      '@type': 'Organization',
      name: 'TecnoPhone',
      url: SITE_URL,
    },
  };

  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description,
    sku: product.sku || String(product.id),
    image: product.images.map((i) => i.src).filter(Boolean),
    url,
    offers,
  };

  if (product.brand?.name) {
    jsonLd.brand = { '@type': 'Brand', name: product.brand.name };
  }

  const ratingCount = Number(product.rating_count || 0);
  const avgRating = Number(product.average_rating || 0);
  if (ratingCount > 0 && avgRating > 0) {
    jsonLd.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: avgRating,
      reviewCount: ratingCount,
    };
  }

  return jsonLd;
}

export default async function ProductoPage({ params }: Props) {
  const product = await getProduct(decodeURIComponent(params.slug));
  if (!product) notFound();

  // Fetch related products in parallel — no sequential waterfall
  let relatedProducts: WCProduct[] = [];
  const relatedCat = product.categories.find((c) => !['full', 'sin-categorizar', 'uncategorized'].includes(c.slug));
  if (relatedCat) {
    const result = await getProducts({
      category: relatedCat.id,
      per_page: 5,
    });
    relatedProducts = result.products.filter((p) => p.id !== product.id).slice(0, 4);
  }

  const jsonLd = buildProductJsonLd(product);

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductDetail product={product} relatedProducts={relatedProducts} />
    </>
  );
}
