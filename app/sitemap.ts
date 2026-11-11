import { MetadataRoute } from 'next';
import api from '@/lib/api';
import { slugify } from '@/lib/utils';

// Ensure sitemap is dynamically generated on-demand and auto-updated when matches are inserted
export const dynamic = 'force-dynamic';
export const revalidate = 60; // Auto-regenerates with fresh data every 60 seconds

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
      changeFrequency: 'hourly',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/about-us`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/privacy-policy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/terms-and-conditions`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/dmca`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/contact-us`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  let categoryRoutes: MetadataRoute.Sitemap = [];
  let subcategoryRoutes: MetadataRoute.Sitemap = [];
  let matchRoutes: MetadataRoute.Sitemap = [];
  const categoryMap = new Map<number, string>();

  try {
    // 1. Dynamic Sports / Category Routes (Endpoint is /sports)
    const sportsRes = await api.get('/sports', { timeout: 15000 }).catch(() => null);
    if (sportsRes?.data?.success && Array.isArray(sportsRes.data.data?.sports)) {
      const sportsList = sportsRes.data.data.sports;
      sportsList.forEach((cat: any) => {
        if (cat.id && cat.sportName) {
          categoryMap.set(cat.id, cat.sportName);
        }
      });

      categoryRoutes = sportsList.map((cat: any) => ({
        url: `${baseUrl}/${slugify(cat.sportName || 'sports')}`,
        lastModified: new Date(),
        changeFrequency: 'hourly' as const,
        priority: 0.9,
      }));
    }

    // 2. Dynamic Subcategory / League Routes
    const subRes = await api.get('/subcategories?all=true&limit=1500', { timeout: 15000 }).catch(() => null);
    if (subRes?.data?.success && Array.isArray(subRes.data.data?.subcategories)) {
      subcategoryRoutes = subRes.data.data.subcategories
        .filter((sub: any) => sub.status !== false && sub.name)
        .map((sub: any) => {
          const parentSportName = sub.categoryName || categoryMap.get(sub.categoryId) || 'sports';
          return {
            url: `${baseUrl}/${slugify(parentSportName)}/${slugify(sub.name || '')}`,
            lastModified: sub.updatedAt ? new Date(sub.updatedAt) : new Date(),
            changeFrequency: 'hourly' as const,
            priority: 0.85,
          };
        });
    }

    // 3. Dynamic Match Event Routes (Auto-updated when new matches are added via API)
    const matchRes = await api.get('/matches?all=true&limit=1000', { timeout: 20000 }).catch(() => null);
    if (matchRes?.data?.success && Array.isArray(matchRes.data.data?.matches)) {
      const matchMap = new Map<string, any>();

      matchRes.data.data.matches.forEach((match: any) => {
        if (!match) return;
        const catSlug = slugify(match.categoryName || categoryMap.get(match.categoryId) || 'sports');
        const subSlug = slugify(match.subcategoryName || 'all');
        const matchSlug = match.slug || String(match.id);
        const canonicalUrl = `${baseUrl}/${catSlug}/${subSlug}/${matchSlug}`;

        if (!matchMap.has(canonicalUrl)) {
          const isLive = match.status === 'live';
          const isUpcoming = match.status === 'upcoming';
          const lastMod = match.updatedAt
            ? new Date(match.updatedAt)
            : match.matchTime
              ? new Date(match.matchTime)
              : new Date();

          matchMap.set(canonicalUrl, {
            url: canonicalUrl,
            lastModified: lastMod,
            changeFrequency: isLive ? 'always' : isUpcoming ? 'hourly' : 'daily',
            priority: isLive ? 1.0 : isUpcoming ? 0.95 : 0.7,
          });
        }
      });

      matchRoutes = Array.from(matchMap.values());
    }
  } catch (e) {
    // Graceful fallback to static routes if remote API is temporarily slow
  }

  return [
    ...staticRoutes,
    ...categoryRoutes,
    ...subcategoryRoutes,
    ...matchRoutes,
  ];
}
