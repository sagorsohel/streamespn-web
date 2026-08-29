import api from '@/lib/api';

export interface Category {
  id: number;
  sportName: string;
  iconUrl?: string;
  thumbUrl?: string;
}

let categoriesCache: Category[] | null = null;
let categoriesPromise: Promise<Category[]> | null = null;

export const getCategories = async (): Promise<Category[]> => {
  if (categoriesCache && categoriesCache.length > 0) {
    return categoriesCache;
  }
  if (categoriesPromise) {
    const result = await categoriesPromise;
    if (result && result.length > 0) {
      return result;
    }
  }

  categoriesPromise = (async () => {
    try {
      const res = await api.get('/sports', { timeout: 25000 });
      if (res.data?.success && Array.isArray(res.data?.data?.sports) && res.data.data.sports.length > 0) {
        categoriesCache = res.data.data.sports;
        return res.data.data.sports;
      }
    } catch (err) {
      // ignore
    } finally {
      if (!categoriesCache || categoriesCache.length === 0) {
        categoriesPromise = null;
      }
    }
    return [];
  })();

  return categoriesPromise;
};

export const clearCategoriesCache = () => {
  categoriesCache = null;
  categoriesPromise = null;
};
