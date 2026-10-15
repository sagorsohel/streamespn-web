import api from '@/lib/api';
import { getCategories } from '@/lib/categories';
import { slugify } from '@/lib/utils';
import { MatchItem } from '@/components/home/MatchCard';

export interface Category {
  id: number;
  sportName: string;
  iconUrl?: string;
  thumbUrl?: string;
}

export interface Subcategory {
  id: number;
  categoryId: number;
  name: string;
  logoUrl?: string;
  status: boolean | number;
  isTrending?: boolean;
  matchCount?: number;
  liveMatchCount?: number;
  totalMatchCount?: number;
}

export interface PrefetchedCategoryData {
  category: Category | null;
  subcategories: Subcategory[];
  matches: MatchItem[];
  selectedSubId: string | null;
  cateName: string;
  subName: string;
}

// In-memory server cache with short TTL (25 seconds)
// This ensures that when requests come in with arbitrary tracking query params
// (e.g. ?alpha, ?ali, ?ref, etc.), subsequent requests within 25s are served in 0ms from RAM
const serverCache = new Map<string, { timestamp: number; data: PrefetchedCategoryData }>();
const CACHE_TTL_MS = 25 * 1000;

export async function prefetchCategoryData(
  categorySlug: string,
  subcategorySlug?: string
): Promise<PrefetchedCategoryData> {
  const normCat = (categorySlug || '').toLowerCase().trim();
  const normSub = (subcategorySlug || '').toLowerCase().trim();
  const cacheKey = `${normCat}___${normSub || 'all'}`;

  const cached = serverCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  let cateName = '';
  let subName = '';
  let targetCategory: Category | null = null;
  let activeSubs: Subcategory[] = [];
  let matches: MatchItem[] = [];
  let selectedSubId: string | null = null;

  try {
    const sportsList = await getCategories();
    if (Array.isArray(sportsList)) {
      targetCategory = sportsList.find(
        (s: any) =>
          s.sportName?.toLowerCase() === normCat.replace(/-/g, ' ') ||
          slugify(s.sportName) === normCat ||
          String(s.id) === normCat
      ) || null;

      if (targetCategory) {
        cateName = targetCategory.sportName;

        // Fetch subcategories
        const subRes = await api.get(`/subcategories?categoryId=${targetCategory.id}`, { timeout: 8000 });
        if (subRes.data?.success && Array.isArray(subRes.data?.data?.subcategories)) {
          const allSubs: Subcategory[] = subRes.data.data.subcategories;
          activeSubs = allSubs.filter(
            (s: Subcategory) =>
              Boolean(s.status) === true &&
              (Number(s.matchCount || 0) > 0 || Number(s.totalMatchCount || 0) > 0)
          );

          if (normSub) {
            const matchedSub = activeSubs.find(
              (s: Subcategory) =>
                slugify(s.name) === normSub ||
                String(s.id) === normSub ||
                s.name?.toLowerCase() === normSub.replace(/-/g, ' ')
            );
            if (matchedSub) {
              selectedSubId = String(matchedSub.id);
              subName = matchedSub.name;
            }
          }
        }

        // Fetch matches for subcategory or category
        let matchUrl = `/matches?limit=100&page=1&categoryId=${targetCategory.id}`;
        if (selectedSubId) {
          matchUrl += `&subcategoryId=${selectedSubId}`;
        } else if (normSub) {
          matchUrl += `&subcategoryId=${normSub}`;
        }

        const matchRes = await api.get(matchUrl, { timeout: 8000 });
        if (matchRes.data?.success && Array.isArray(matchRes.data?.data?.matches)) {
          matches = matchRes.data.data.matches;
          if (matches.length === 0 && selectedSubId) {
            try {
              const fallbackRes = await api.get(`/matches?limit=100&page=1&categoryId=${targetCategory.id}`, { timeout: 5000 });
              if (fallbackRes.data?.success && Array.isArray(fallbackRes.data?.data?.matches) && fallbackRes.data.data.matches.length > 0) {
                matches = fallbackRes.data.data.matches;
                selectedSubId = null;
              }
            } catch (e) {}
          }
        }
      }
    }
  } catch (err) {
    // gracefully fallback
  }

  const result: PrefetchedCategoryData = {
    category: targetCategory,
    subcategories: activeSubs,
    matches,
    selectedSubId,
    cateName: cateName || normCat,
    subName: subName || normSub,
  };

  serverCache.set(cacheKey, { timestamp: Date.now(), data: result });
  return result;
}

export interface PrefetchedHomeData {
  categories: Category[];
  trendingSubcategories: any[];
  bannerMatches: MatchItem[];
  matches: MatchItem[];
}

let homeCache: { timestamp: number; data: PrefetchedHomeData | null } = {
  timestamp: 0,
  data: null,
};
const HOME_CACHE_TTL_MS = 20 * 1000; // 20s in-memory TTL

export async function prefetchHomeData(): Promise<PrefetchedHomeData> {
  if (homeCache.data && Date.now() - homeCache.timestamp < HOME_CACHE_TTL_MS) {
    return homeCache.data;
  }

  let categories: Category[] = [];
  let trendingSubcategories: any[] = [];
  let bannerMatches: MatchItem[] = [];
  let matches: MatchItem[] = [];

  try {
    const [catRes, trendRes, bannerRes, matchRes] = await Promise.allSettled([
      getCategories(),
      api.get('/subcategories?trending=true&home=true', { timeout: 6000 }),
      api.get('/matches/banner', { timeout: 6000 }),
      api.get('/matches?limit=20&page=1&home=true', { timeout: 6000 }),
    ]);

    if (catRes.status === 'fulfilled' && Array.isArray(catRes.value)) {
      categories = catRes.value;
    }
    if (trendRes.status === 'fulfilled' && trendRes.value.data?.success && Array.isArray(trendRes.value.data?.data?.subcategories)) {
      trendingSubcategories = trendRes.value.data.data.subcategories;
    }
    if (bannerRes.status === 'fulfilled' && bannerRes.value.data?.success && Array.isArray(bannerRes.value.data?.data?.matches)) {
      bannerMatches = bannerRes.value.data.data.matches;
    }
    if (matchRes.status === 'fulfilled' && matchRes.value.data?.success && Array.isArray(matchRes.value.data?.data?.matches)) {
      matches = matchRes.value.data.data.matches;
    }
  } catch (err) {
    // gracefully fallback
  }

  const result: PrefetchedHomeData = {
    categories,
    trendingSubcategories,
    bannerMatches,
    matches,
  };

  homeCache = {
    timestamp: Date.now(),
    data: result,
  };
  return result;
}

