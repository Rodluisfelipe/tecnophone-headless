import { MetadataRoute } from 'next';
import { getAllProductSlugs, getCategories, getPosts } from '@/lib/woocommerce';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.tecnophone.co';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/productos`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/categorias`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}/partidos`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${SITE_URL}/dolar-hoy`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${SITE_URL}/empresas`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE_URL}/salario-minimo`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE_URL}/dia-de-la-madre`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${SITE_URL}/blog`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${SITE_URL}/nequi-pagos`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/rastrear-envio`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/contacto`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/politica-envios`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/politica-privacidad`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/terminos-condiciones`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/derecho-retracto`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ];

  let productEntries: MetadataRoute.Sitemap = [];
  try {
    const slugs = await getAllProductSlugs();
    productEntries = slugs.map((slug) => ({
      url: `${SITE_URL}/producto/${slug}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));
  } catch (error) {
    console.error('[Sitemap] Failed to fetch product slugs:', error);
  }

  let categoryEntries: MetadataRoute.Sitemap = [];
  try {
    const categories = await getCategories();
    categoryEntries = categories.map((cat) => ({
      url: `${SITE_URL}/categoria/${cat.slug}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));
  } catch (error) {
    console.error('[Sitemap] Failed to fetch categories:', error);
  }

  let blogEntries: MetadataRoute.Sitemap = [];
  try {
    const posts = await getPosts({ per_page: 100 });
    blogEntries = posts.map((post) => ({
      url: `${SITE_URL}/blog/${post.slug}`,
      lastModified: post.date ? new Date(post.date) : now,
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    }));
  } catch (error) {
    console.error('[Sitemap] Failed to fetch blog posts:', error);
  }

  return [...staticPages, ...productEntries, ...categoryEntries, ...blogEntries];
}
