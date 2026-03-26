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

  return {
    title: product.name,
    description:
      product.short_description.replace(/<[^>]*>/g, '').slice(0, 160) ||
      `Compra ${product.name} al mejor precio en TecnoPhone. Envíos a todo Colombia.`,
    alternates: {
      canonical: `/producto/${product.slug}`,
    },
    openGraph: {
      title: product.name,
      description: product.short_description.replace(/<[^>]*>/g, '').slice(0, 160),
      images: product.images[0] ? [{ url: product.images[0].src }] : [],
      url: `/producto/${product.slug}`,
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
