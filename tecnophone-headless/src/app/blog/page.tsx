import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, ArrowRight } from 'lucide-react';
import { getPosts } from '@/lib/woocommerce';

export const revalidate = 1800;

export const metadata: Metadata = {
  title: 'Blog - Guías y Noticias de Tecnología',
  description:
    'Lee nuestras guías, comparativas y noticias sobre tecnología. Portátiles, celulares, tips de compra y más.',
};

export default async function BlogPage() {
  const posts = await getPosts({ per_page: 20 });

  return (
    <div className="container-custom py-8 lg:py-12">
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Blog</h1>
        <p className="text-surface-700 mt-1">
          Guías, comparativas y noticias de tecnología
        </p>
      </div>

      {posts.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {posts.map((post) => {
            const featuredImage =
              post._embedded?.['wp:featuredmedia']?.[0]?.source_url;
            const featuredAlt =
              post._embedded?.['wp:featuredmedia']?.[0]?.alt_text || post.title.rendered;

            return (
              <article
                key={post.id}
                className="bg-surface-100 rounded-2xl border border-surface-200 overflow-hidden hover:shadow-lg transition-shadow group"
              >
                {/* Image */}
                <Link
                  href={`/blog/${post.slug}`}
                  className="block relative aspect-video bg-surface-200 overflow-hidden"
                >
                  {featuredImage ? (
                    <Image
                      src={featuredImage}
                      alt={featuredAlt}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
                      <span className="text-4xl">📝</span>
                    </div>
                  )}
                </Link>

                {/* Content */}
                <div className="p-5">
                  <div className="flex items-center gap-2 text-xs text-surface-600 mb-3">
                    <Calendar className="w-3.5 h-3.5" />
                    <time dateTime={post.date}>
                      {new Date(post.date).toLocaleDateString('es-CO', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </time>
                  </div>

                  <Link href={`/blog/${post.slug}`}>
                    <h2
                      className="text-lg font-bold text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-2 mb-2"
                      dangerouslySetInnerHTML={{ __html: post.title.rendered }}
                    />
                  </Link>

                  <div
                    className="text-sm text-surface-700 line-clamp-3 mb-4"
                    dangerouslySetInnerHTML={{ __html: post.excerpt.rendered }}
                  />

                  <Link
                    href={`/blog/${post.slug}`}
                    className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-500 transition-colors"
                  >
                    Leer más
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="text-4xl mb-4">📝</p>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Próximamente
          </h3>
          <p className="text-surface-700">Estamos preparando contenido interesante para ti</p>
        </div>
      )}
    </div>
  );
}
