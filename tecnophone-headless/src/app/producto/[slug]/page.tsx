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

  return <ProductDetail product={product} relatedProducts={relatedProducts} />;
}
