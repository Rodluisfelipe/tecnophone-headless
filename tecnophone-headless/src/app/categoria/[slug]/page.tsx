import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { getCategory, getProducts, getCategories } from '@/lib/woocommerce';
import ProductCard from '@/components/products/ProductCard';

export const revalidate = 900;
export const dynamicParams = true;

interface Props {
  params: { slug: string };
}

export async function generateStaticParams() {
  try {
    const categories = await getCategories();
    return categories.map((cat) => ({ slug: cat.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const category = await getCategory(decodeURIComponent(params.slug));
  if (!category) return { title: 'Categoría no encontrada' };

  return {
    title: `${category.name} - Compra Online`,
    description:
      category.description ||
      `Compra ${category.name} al mejor precio en TecnoPhone. Envíos a todo Colombia.`,
    alternates: {
      canonical: `/categoria/${category.slug}`,
    },
  };
}

export default async function CategoriaPage({ params }: Props) {
  const category = await getCategory(decodeURIComponent(params.slug));
  if (!category) notFound();

  const { products, total } = await getProducts({
    category: category.id,
    per_page: 20,
  });

  return (
    <div className="container-custom py-8 lg:py-12">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-surface-600 mb-6">
        <Link href="/" className="hover:text-primary-600 transition-colors">
          Inicio
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/productos" className="hover:text-primary-600 transition-colors">
          Productos
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-gray-900 font-medium">{category.name}</span>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">{category.name}</h1>
        {category.description && (
          <p
            className="text-surface-700 mt-2 max-w-2xl"
            dangerouslySetInnerHTML={{ __html: category.description }}
          />
        )}
        <p className="text-sm text-surface-600 mt-2">
          {total} producto{total !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Products */}
      {products.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No hay productos en esta categoría
          </h3>
          <p className="text-surface-700 mb-6">Pronto agregaremos nuevos productos</p>
          <Link href="/productos" className="btn-primary">
            Ver todos los productos
          </Link>
        </div>
      )}
    </div>
  );
}
