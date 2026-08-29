import { MatchItem } from '@/components/home/MatchCard';

const matchesCache = new Map<string, MatchItem[]>();
const subcategoriesCache = new Map<string, any[]>();

export const getCachedMatches = (key: string): MatchItem[] | undefined => {
  return matchesCache.get(key);
};

export const setCachedMatches = (key: string, data: MatchItem[]) => {
  matchesCache.set(key, data);
};

export const getCachedSubcategories = (key: string): any[] | undefined => {
  return subcategoriesCache.get(key);
};

export const setCachedSubcategories = (key: string, data: any[]) => {
  subcategoriesCache.set(key, data);
};
