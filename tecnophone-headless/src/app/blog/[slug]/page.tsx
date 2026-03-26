import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, ChevronRight, ArrowLeft } from 'lucide-react';
import { getPost, getPosts } from '@/lib/woocommerce';

export const revalidate = 1800;
export const dynamicParams = true;

interface Props {
  params: { slug: string };
}

export async function generateStaticParams() {
  try {
    const posts = await getPosts({ per_page: 100 });
    return posts.map((post) => ({ slug: post.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPost(decodeURIComponent(params.slug));
  if (!post) return { title: 'Artículo no encontrado' };

  return {
    title: post.title.rendered.replace(/<[^>]*>/g, ''),
    description: post.excerpt.rendered.replace(/<[^>]*>/g, '').slice(0, 160),
    openGraph: {
      title: post.title.rendered.replace(/<[^>]*>/g, ''),
      description: post.excerpt.rendered.replace(/<[^>]*>/g, '').slice(0, 160),
      images: post._embedded?.['wp:featuredmedia']?.[0]
        ? [{ url: post._embedded['wp:featuredmedia'][0].source_url }]
        : [],
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const post = await getPost(decodeURIComponent(params.slug));
  if (!post) notFound();

  const featuredImage = post._embedded?.['wp:featuredmedia']?.[0]?.source_url;
  const featuredAlt =
    post._embedded?.['wp:featuredmedia']?.[0]?.alt_text || post.title.rendered;

  return (
    <article className="container-custom py-8 lg:py-12">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-surface-600 mb-6">
        <Link href="/" className="hover:text-primary-600 transition-colors">
          Inicio
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/blog" className="hover:text-primary-600 transition-colors">
          Blog
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span
          className="text-gray-900 font-medium truncate"
          dangerouslySetInnerHTML={{ __html: post.title.rendered }}
        />
      </nav>

      <div className="max-w-3xl mx-auto">
        {/* Date */}
        <div className="flex items-center gap-2 text-sm text-surface-600 mb-4">
          <Calendar className="w-4 h-4" />
          <time dateTime={post.date}>
            {new Date(post.date).toLocaleDateString('es-CO', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </time>
        </div>

        {/* Title */}
        <h1
          className="text-3xl lg:text-4xl font-bold text-gray-900 leading-tight mb-8"
          dangerouslySetInnerHTML={{ __html: post.title.rendered }}
        />

        {/* Featured Image */}
        {featuredImage && (
          <div className="relative aspect-video rounded-2xl overflow-hidden mb-10">
            <Image
              src={featuredImage}
              alt={featuredAlt}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 768px"
              priority
            />
          </div>
        )}

        {/* Content */}
        <div
          className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-surface-700 prose-a:text-primary-600 prose-img:rounded-xl"
          dangerouslySetInnerHTML={{ __html: post.content.rendered }}
        />

        {/* Back link */}
        <div className="mt-12 pt-8 border-t border-surface-200">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-primary-600 font-medium hover:text-primary-500 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al Blog
          </Link>
        </div>
      </div>
    </article>
  );
}
