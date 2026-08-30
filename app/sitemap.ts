import { MetadataRoute } from 'next';
import api from '@/lib/api';
import { slugify } from '@/lib/utils';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://streamespn.org';

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: 'always',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/replay`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
  ];

  let categoryRoutes: MetadataRoute.Sitemap = [];
  let subcategoryRoutes: MetadataRoute.Sitemap = [];
  let matchRoutes: MetadataRoute.Sitemap = [];

  try {
    // 1. Dynamic Category Routes
    const catRes = await api.get('/categories', { timeout: 10000 }).catch(() => null);
    if (catRes?.data?.success && Array.isArray(catRes.data.data?.categories)) {
      categoryRoutes = catRes.data.data.categories.map((cat: any) => ({
        url: `${baseUrl}/${slugify(cat.sportName || 'sports')}`,
        lastModified: new Date(),
        changeFrequency: 'hourly' as const,
        priority: 0.9,
      }));
    }

    // 2. Dynamic Subcategory Routes
    const subRes = await api.get('/subcategories', { timeout: 10000 }).catch(() => null);
    if (subRes?.data?.success && Array.isArray(subRes.data.data?.subcategories)) {
      subcategoryRoutes = subRes.data.data.subcategories
        .filter((sub: any) => sub.status !== false)
        .map((sub: any) => ({
          url: `${baseUrl}/${slugify(sub.categoryName || 'sports')}/${slugify(sub.name || '')}`,
          lastModified: new Date(),
          changeFrequency: 'hourly' as const,
          priority: 0.85,
        }));
    }

    // 3. Dynamic Match Event Routes
    const matchRes = await api.get('/matches?limit=200', { timeout: 10000 }).catch(() => null);
    if (matchRes?.data?.success && Array.isArray(matchRes.data.data?.matches)) {
      matchRoutes = matchRes.data.data.matches.map((match: any) => {
        const catSlug = slugify(match.categoryName || 'sports');
        const matchSlug = match.slug || slugify(match.title || `${match.homeTeam}-vs-${match.awayTeam}`);
        return {
          url: `${baseUrl}/${catSlug}/${matchSlug}`,
          lastModified: match.updatedAt ? new Date(match.updatedAt) : new Date(),
          changeFrequency: 'always' as const,
          priority: 0.95,
        };
      });
    }
  } catch (e) {
    // Silent catch if API is offline
  }

  return [
    ...staticRoutes,
    ...categoryRoutes,
    ...subcategoryRoutes,
    ...matchRoutes,
  ];
}
