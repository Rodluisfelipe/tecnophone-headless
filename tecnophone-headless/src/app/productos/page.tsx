import { Suspense } from 'react';
import { Metadata } from 'next';
import { getProducts } from '@/lib/woocommerce';
import ProductCatalog from './ProductCatalog';

export const revalidate = 600;

export const metadata: Metadata = {
  title: 'Todos los Productos',
  description:
    'Explora nuestro catálogo completo de tecnología: portátiles, celulares, tablets, monitores, impresoras y más. Envíos a todo Colombia.',
  alternates: {
    canonical: '/productos',
  },
};

export default async function ProductosPage() {
  // Server-side initial data fetch for SEO and performance
  const initialData = await getProducts({ page: 1, per_page: 24, orderby: 'date', order: 'desc' });

  return (
    <Suspense
      fallback={
        <div className="container-custom py-12">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-surface-200 rounded w-64" />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-surface-100 rounded-2xl h-80 border border-surface-200" />
              ))}
            </div>
          </div>
        </div>
      }
    >
      <ProductCatalog
        initialProducts={initialData.products}
        initialTotal={initialData.total}
        initialTotalPages={initialData.totalPages}
      />
    </Suspense>
  );
}
