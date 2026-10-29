'use client';

import React, { useEffect, useState, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

import { getCategories, clearCategoriesCache } from '@/lib/categories';
import { getCachedMatches, setCachedMatches, getCachedSubcategories, setCachedSubcategories } from '@/lib/matchesCache';
import { motion, AnimatePresence } from 'framer-motion';
import { slugify } from '@/lib/utils';

import { TopLoadingBar, startTopLoader, stopTopLoader } from '@/components/layout/TopLoadingBar';
import { useLiveScoreSync } from '@/lib/useLiveScoreSync';
import { MatchCard, MatchItem } from '@/components/home/MatchCard';
import { MatchCardSkeleton } from '@/components/home/MatchCardSkeleton';
import { BannerSkeleton } from '@/components/home/BannerSkeleton';
import { HeroBannerCarousel } from '@/components/home/HeroBannerCarousel';
import { MobileLiveSlider } from '@/components/home/MobileLiveSlider';
import { OptimizedImage } from '@/components/common/OptimizedImage';
import { ScrollableSidebarList } from '@/components/common/ScrollableSidebarList';
import {
  Radio,
  Clock3,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Layers,
  Sparkles,
  Grid,
  X,
  Loader2
} from 'lucide-react';

const getSportIcon = (name: string): React.ReactNode => {
  const n = (name || '').toLowerCase();
  // High School / HS gets a distinct colored football (Electric Blue / Cyan hue)
  if (n.includes('high school') || n.includes('hs')) {
    return (
      <span
        className="inline-block filter hue-rotate-[160deg] saturate-[220%] contrast-[115%]"
        title="High School Football"
      >
        🏈
      </span>
    );
  }
  // American Football / NFL gets standard brown football
  if (n.includes('nfl') || n.includes('americ')) return '🏈';
  if (n.includes('foot') || n.includes('socc')) return '⚽';
  if (n.includes('fight') || n.includes('ufc') || n.includes('box')) return '🥊';
  if (n.includes('formu') || n.includes('motor') || n.includes('f1')) return '🏎️';
  if (n.includes('rugb') || n.includes('afl')) return '🏉';
  if (n.includes('base') || n.includes('mlb')) return '⚾';
  if (n.includes('bask') || n.includes('nba')) return '🏀';
  if (n.includes('tenn') || n.includes('ping')) return '🎾';
  if (n.includes('voll') || n.includes('volly')) return '🏐';
  if (n.includes('cycl') || n.includes('bike')) return '🚴';
  if (n.includes('cric')) return '🏏';
  if (n.includes('golf')) return '⛳';
  if (n.includes('ice') || n.includes('nhl')) return '🏒';
  if (n.includes('esport') || n.includes('game')) return '🎮';
  if (n.includes('other')) return '⭐';
  return '🏆';
};

interface Category {
  id: number;
  sportName: string;
  iconUrl?: string;
  thumbUrl?: string;
}

interface Subcategory {
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

export interface CategoryPageComponentProps {
  categorySlug: string;
  subcategorySlug?: string;
  initialCategory?: Category | null;
  initialSubcategories?: Subcategory[];
  initialMatches?: MatchItem[];
  initialSelectedSubcategory?: string | null;
}

export function CategoryPageComponent({
  categorySlug,
  subcategorySlug,
  initialCategory,
  initialSubcategories,
  initialMatches,
  initialSelectedSubcategory,
}: CategoryPageComponentProps) {
  const router = useRouter();

  const [category, setCategory] = useState<Category | null>(initialCategory || null);
  const [subcategories, setSubcategories] = useState<Subcategory[]>(initialSubcategories || []);
  const [matches, setMatches] = useState<MatchItem[]>(initialMatches || []);

  // 🔄 REAL-TIME SILENT LIVE SCORE & MINUTE SYNC (15s interval)
  useLiveScoreSync(matches, setMatches);

  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(
    initialSelectedSubcategory || subcategorySlug || null
  );
  const [loading, setLoading] = useState<boolean>(!initialCategory);
  const [matchesLoading, setMatchesLoading] = useState<boolean>(false);
  const [notFound, setNotFound] = useState<boolean>(false);
  const [isMobileSubcatOpen, setIsMobileSubcatOpen] = useState<boolean>(false);

  // Infinite Scroll & Pagination States (20 items per batch)
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>((initialMatches?.length || 0) >= 20);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const observerTarget = useRef<HTMLDivElement>(null);
  const activeSubcatRef = useRef<HTMLButtonElement | null>(null);
  const prevSubSlugRef = useRef<string | undefined>(subcategorySlug);

  const initialDataUsedRef = useRef<boolean>(
    Boolean(initialCategory)
  );

  const currentRouteKey = `${categorySlug}___${subcategorySlug || 'all'}`;
  const initialKeyRef = useRef(currentRouteKey);

  // Sync state if user navigates via client-side Link router to another category/subcategory
  useEffect(() => {
    if (initialKeyRef.current !== currentRouteKey) {
      initialKeyRef.current = currentRouteKey;
      prevSubSlugRef.current = subcategorySlug;
      if (initialCategory) setCategory(initialCategory);
      if (initialSubcategories && initialSubcategories.length > 0) setSubcategories(initialSubcategories);
      if (initialMatches) setMatches(initialMatches);

      let resolvedSubId: string | null = initialSelectedSubcategory || null;
      if (!resolvedSubId && subcategorySlug) {
        const pool = [
          ...(initialSubcategories || []),
          ...subcategories,
          ...(category ? getCachedSubcategories(String(category.id)) || [] : []),
        ];
        const found = pool.find(
          (s) =>
            slugify(s.name) === subcategorySlug.toLowerCase() ||
            String(s.id) === subcategorySlug ||
            s.name?.toLowerCase() === subcategorySlug.replace(/-/g, ' ').toLowerCase()
        );
        if (found) {
          resolvedSubId = String(found.id);
        } else {
          resolvedSubId = subcategorySlug;
        }
      }

      if (resolvedSubId) {
        setSelectedSubcategory(resolvedSubId);
      } else if (!subcategorySlug) {
        setSelectedSubcategory(null);
      }
    }
  }, [currentRouteKey, initialCategory, initialSubcategories, initialMatches, initialSelectedSubcategory, subcategorySlug, category]);

  // Auto-scroll selected subcategory into view in left sidebar (fallback)
  useEffect(() => {
    if (selectedSubcategory && activeSubcatRef.current) {
      const timer = setTimeout(() => {
        activeSubcatRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest',
        });
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [selectedSubcategory, subcategories]);

  const fetchMatches = async (catId: number, subId: string | null, pageNum = 1) => {
    if (pageNum === 1) {
      startTopLoader();
      setMatchesLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      let url = `/matches?limit=20&page=${pageNum}&categoryId=${catId}`;
      if (subId) url += `&subcategoryId=${subId}`;

      const res = await api.get(url);
      if (res.data?.success && Array.isArray(res.data?.data?.matches)) {
        let fetched: MatchItem[] = res.data.data.matches;

        if (pageNum === 1) {
          const unique = Array.from(new Map<number, MatchItem>(fetched.map((m) => [m.id, m])).values());
          setMatches(unique);
        } else {
          setMatches((prev) => {
            const map = new Map<number, MatchItem>();
            prev.forEach((m) => map.set(m.id, m));
            fetched.forEach((m) => map.set(m.id, m));
            return Array.from(map.values());
          });
        }

        setPage(pageNum);
        setHasMore(fetched.length >= 20);
      } else {
        if (pageNum === 1) setMatches([]);
        setHasMore(false);
      }
    } catch (err) {
      if (pageNum === 1) setMatches([]);
      setHasMore(false);
    } finally {
      setMatchesLoading(false);
      setLoadingMore(false);
      stopTopLoader();
    }
  };

  const loadMoreMatches = async () => {
    if (loadingMore || !hasMore || loading || matchesLoading || !category) return;
    fetchMatches(category.id, selectedSubcategory, page + 1);
  };

  useEffect(() => {
    let isMounted = true;
    setNotFound(false);

    // If SSR already pre-populated data for this category/subcategory, skip initial client waterfall
    if (initialDataUsedRef.current) {
      initialDataUsedRef.current = false;
      return;
    }

    setMatchesLoading(true);

    const initCategoryPage = async () => {
      try {
        let sportsList: Category[] = await getCategories();
        if (!sportsList || sportsList.length === 0) {
          clearCategoriesCache();
          const retryRes = await api.get('/sports');
          if (retryRes.data?.success && Array.isArray(retryRes.data?.data?.sports)) {
            sportsList = retryRes.data.data.sports;
          }
        }

        if (!sportsList || sportsList.length === 0) {
          if (isMounted) {
            setNotFound(true);
            setLoading(false);
          }
          return;
        }

        const targetCategory = sportsList.find(
          (c) => slugify(c.sportName) === categorySlug.toLowerCase() || String(c.id) === categorySlug
        );

        if (!targetCategory) {
          if (isMounted) {
            setNotFound(true);
            setLoading(false);
          }
          return;
        }

        if (!isMounted) return;

        setCategory(targetCategory);
        setLoading(false);

        let initialSubId: string | null = null;
        let fetchedSubList: Subcategory[] = getCachedSubcategories(String(targetCategory.id)) || [];

        if (fetchedSubList.length > 0) {
          const activeSubs = fetchedSubList.filter(
            (s: Subcategory) =>
              Boolean(s.status) === true &&
              (Number(s.matchCount || 0) > 0 || Number(s.totalMatchCount || 0) > 0)
          );
          if (subcategorySlug && fetchedSubList.length > 0) {
            const matchedSubcat = fetchedSubList.find(
              (s: Subcategory) =>
                slugify(s.name) === subcategorySlug.toLowerCase() ||
                String(s.id) === subcategorySlug ||
                s.name?.toLowerCase() === subcategorySlug.replace(/-/g, ' ').toLowerCase()
            );
            if (matchedSubcat) {
              initialSubId = String(matchedSubcat.id);
              if (!activeSubs.some((s) => s.id === matchedSubcat.id)) {
                activeSubs.unshift(matchedSubcat);
              }
            }
          }
          if (isMounted) {
            setSelectedSubcategory(initialSubId || subcategorySlug || null);
            setSubcategories(activeSubs);
          }
        }

        let targetSubIdOrSlug = initialSubId || subcategorySlug || null;
        let matchUrl = `/matches?limit=100&page=1&categoryId=${targetCategory.id}`;
        if (targetSubIdOrSlug) matchUrl += `&subcategoryId=${targetSubIdOrSlug}`;

        const [subResResult, matchResResult] = await Promise.allSettled([
          api.get(`/subcategories?categoryId=${targetCategory.id}`),
          api.get(matchUrl),
        ]);

        if (!isMounted) return;

        // Process subcategories
        if (subResResult.status === 'fulfilled' && subResResult.value.data?.success && Array.isArray(subResResult.value.data?.data?.subcategories)) {
          fetchedSubList = subResResult.value.data.data.subcategories;
          setCachedSubcategories(String(targetCategory.id), fetchedSubList);
          const activeSubs = fetchedSubList.filter(
            (s: Subcategory) =>
              Boolean(s.status) === true &&
              (Number(s.matchCount || 0) > 0 || Number(s.totalMatchCount || 0) > 0)
          );

          if (subcategorySlug && fetchedSubList.length > 0) {
            const matchedSubcat = fetchedSubList.find(
              (s: Subcategory) =>
                slugify(s.name) === subcategorySlug.toLowerCase() ||
                String(s.id) === subcategorySlug ||
                s.name?.toLowerCase() === subcategorySlug.replace(/-/g, ' ').toLowerCase()
            );
            if (matchedSubcat) {
              initialSubId = String(matchedSubcat.id);
              if (!activeSubs.some((s) => s.id === matchedSubcat.id)) {
                activeSubs.unshift(matchedSubcat);
              }
            }
          }
          if (isMounted) {
            setSelectedSubcategory(initialSubId || subcategorySlug || null);
            setSubcategories(activeSubs);
          }
        }

        // Update document title for client-side navigation
        if (typeof document !== 'undefined') {
          const isFromNotFound =
            typeof window !== 'undefined' &&
            (window.location.search.includes('notfound=true') ||
             window.location.search.includes('notfound=1') ||
             window.location.search.includes('error=404'));

          if (subcategorySlug) {
            const matched = fetchedSubList.find(
              (s: Subcategory) =>
                slugify(s.name) === subcategorySlug.toLowerCase() ||
                String(s.id) === subcategorySlug ||
                s.name?.toLowerCase() === subcategorySlug.replace(/-/g, ' ').toLowerCase()
            );
            const subTitle = matched ? matched.name : subcategorySlug.toUpperCase();
            const catTitle = targetCategory?.sportName || '';
            document.title = isFromNotFound
              ? `(404) - ${subTitle} Fixtures, Live Scores & Schedule | StreamESPN`
              : `${subTitle} Fixtures, Live Scores & Schedule | StreamESPN`;
          } else if (targetCategory?.sportName) {
            document.title = isFromNotFound
              ? `(404) - ${targetCategory.sportName} Fixtures, Live Scores & Schedules | StreamESPN`
              : `${targetCategory.sportName} Fixtures, Live Scores & Schedules | StreamESPN`;
          }
        }

        // Process matches
        if (matchResResult.status === 'fulfilled' && matchResResult.value.data?.success && Array.isArray(matchResResult.value.data?.data?.matches)) {
          let fetchedMatches: MatchItem[] = matchResResult.value.data.data.matches;

          const uniqueMatches = Array.from(new Map(fetchedMatches.map((m) => [m.id, m])).values());
          setMatches(uniqueMatches);
          setPage(1);
          setHasMore(uniqueMatches.length >= 20);
        }
      } catch (err) {
        // silent error handling - never reset to notFound for 0 matches
      } finally {
        if (isMounted) {
          setLoading(false);
          setMatchesLoading(false);
        }
      }
    };

    initCategoryPage();
    return () => {
      isMounted = false;
    };
  }, [categorySlug]);



  useEffect(() => {
    if (prevSubSlugRef.current === subcategorySlug) return;
    prevSubSlugRef.current = subcategorySlug;

    if (!category) return;

    if (!subcategorySlug) {
      setSelectedSubcategory(null);
      fetchMatches(category.id, null, 1);
      return;
    }

    const cached = getCachedSubcategories(String(category.id)) || [];
    const pool = [...subcategories, ...cached];
    const matchedSubcat = pool.find(
      (s) =>
        slugify(s.name) === subcategorySlug.toLowerCase() ||
        String(s.id) === subcategorySlug ||
        s.name?.toLowerCase() === subcategorySlug.replace(/-/g, ' ').toLowerCase()
    );

    if (matchedSubcat) {
      const targetSubId = String(matchedSubcat.id);
      setSelectedSubcategory(targetSubId);
      setSubcategories((prev) =>
        prev.some((s) => s.id === matchedSubcat.id) ? prev : [matchedSubcat, ...prev]
      );
      fetchMatches(category.id, targetSubId, 1);
    } else {
      setSelectedSubcategory(subcategorySlug);
      fetchMatches(category.id, subcategorySlug, 1);

      api.get(`/subcategories?categoryId=${category.id}`).then((res) => {
        if (res.data?.success && Array.isArray(res.data?.data?.subcategories)) {
          const freshSubs: Subcategory[] = res.data.data.subcategories;
          setCachedSubcategories(String(category.id), freshSubs);
          const found = freshSubs.find(
            (s) =>
              slugify(s.name) === subcategorySlug.toLowerCase() ||
              String(s.id) === subcategorySlug ||
              s.name?.toLowerCase() === subcategorySlug.replace(/-/g, ' ').toLowerCase()
          );
          if (found) {
            setSelectedSubcategory(String(found.id));
            setSubcategories((prev) =>
              prev.some((s) => s.id === found.id) ? prev : [found, ...prev]
            );
          }
        }
      }).catch(() => {});
    }
  }, [subcategorySlug, category]);

  const handleSubcategorySelect = (subcat: Subcategory | null) => {
    if (!category) return;
    setIsMobileSubcatOpen(false);

    let targetUrl = `/${categorySlug}`;
    let newSubId: string | null = null;

    if (subcat) {
      const isSelected = selectedSubcategory === String(subcat.id);
      if (!isSelected) {
        newSubId = String(subcat.id);
        targetUrl = `/${categorySlug}/${slugify(subcat.name)}`;
      }
    }

    setSelectedSubcategory(newSubId);
    prevSubSlugRef.current = newSubId && subcat ? slugify(subcat.name) : undefined;
    router.replace(targetUrl, { scroll: false });
    fetchMatches(category.id, newSubId, 1);
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !matchesLoading && !loadingMore) {
          loadMoreMatches();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loading, matchesLoading, loadingMore, page, category, selectedSubcategory]);

  const uniqueMatches = React.useMemo(() => {
    return Array.from(new Map<number, MatchItem>(matches.map((m) => [m.id, m])).values());
  }, [matches]);

  const isToday = (dateStr?: string | null) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return false;
    const now = new Date();
    return (
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear()
    );
  };

  const isTomorrow = (dateStr?: string | null) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return false;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return (
      d.getDate() === tomorrow.getDate() &&
      d.getMonth() === tomorrow.getMonth() &&
      d.getFullYear() === tomorrow.getFullYear()
    );
  };

  // 1. Live Matches: Only include if status is 'live' AND match started within the last 3.5 hours and on current date
  const liveMatches = React.useMemo(() => {
    const now = Date.now();
    return uniqueMatches.filter((m) => {
      if (m.status !== 'live') return false;
      if (!m.matchTime) return true;
      const t = new Date(m.matchTime).getTime();
      if (isNaN(t)) return true;
      const hoursDiff = (now - t) / (1000 * 3600);
      return hoursDiff >= -0.5 && hoursDiff <= 3.5 && (isToday(m.matchTime) || isTomorrow(m.matchTime));
    });
  }, [uniqueMatches]);

  // 2. Today's Upcoming: Matches happening today (excluding finished and live)
  const todayUpcomingMatches = React.useMemo(() => uniqueMatches.filter((m) => m.status !== 'live' && m.status !== 'finished' && isToday(m.matchTime)), [uniqueMatches]);

  // 3. Tomorrow's Scheduled Matches: Matches happening tomorrow only (excluding finished and live)
  // Past matches whose date has passed are excluded!
  const tomorrowUpcomingMatches = React.useMemo(() => uniqueMatches.filter((m) => m.status !== 'live' && m.status !== 'finished' && isTomorrow(m.matchTime)), [uniqueMatches]);

  const selectedSubcatObj = subcategories.find(
    (s) =>
      String(s.id) === String(selectedSubcategory) ||
      (Boolean(subcategorySlug) && slugify(s.name) === subcategorySlug?.toLowerCase())
  );

  // Category Banner Matches: Prioritize Live matches first, then Upcoming matches (Today / Tomorrow only)
  const categoryBannerMatches = React.useMemo(() => {
    const now = Date.now();
    const validMatches = uniqueMatches.filter((m) => {
      if (m.status === 'live') {
        if (!m.matchTime) return true;
        const t = new Date(m.matchTime).getTime();
        if (isNaN(t)) return true;
        const hoursDiff = (now - t) / (1000 * 3600);
        return hoursDiff >= -0.5 && hoursDiff <= 3.5 && (isToday(m.matchTime) || isTomorrow(m.matchTime));
      }
      if (m.status === 'finished') return false;
      return isToday(m.matchTime) || isTomorrow(m.matchTime);
    });
    const live = validMatches.filter((m) => m.status === 'live');
    const upcoming = validMatches.filter((m) => m.status !== 'live');
    const combined = [...live, ...upcoming];
    return combined.slice(0, 10);
  }, [uniqueMatches]);

  if (notFound || (!loading && !category)) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center space-y-4">
        <div className="text-4xl">⚠️</div>
        <h1 className="text-xl font-bold text-[var(--text-white)]">Category Not Found</h1>
        <p className="text-xs sm:text-sm text-[var(--text-muted)]">
          The requested category could not be found.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-6 pb-12 flex-1 w-full space-y-6">

        {/* BANNER / SLIDER LOADING SKELETON (MOBILE & DESKTOP STYLED) */}
        {(loading || (matchesLoading && matches.length === 0)) ? (
          <BannerSkeleton />
        ) : (
          <>
            {/* MOBILE ONLY: SLIDING LIVE / TOP EVENTS CAROUSEL */}
            <MobileLiveSlider matches={categoryBannerMatches.length > 0 ? categoryBannerMatches : matches} />

            {/* FULL-WIDTH FEATURED MATCH BANNER CAROUSEL (DESKTOP / TABLET ONLY - HIDDEN ON MOBILE) */}
            {categoryBannerMatches.length > 0 && (
              <HeroBannerCarousel matches={categoryBannerMatches} />
            )}
          </>
        )}



        {!notFound && category && subcategories.length > 0 && (
          <div className="lg:hidden flex items-center gap-2.5 w-full">
            <button
              onClick={() => setIsMobileSubcatOpen(true)}
              className="flex-1 flex items-center justify-between gap-2.5 rounded-xl border border-[var(--border-glass)] bg-[var(--bg-card)] px-4 py-3 text-xs sm:text-sm font-bold text-[var(--text-white)] hover:border-[#F8C831] transition-all min-w-0"
            >
              <div className="flex items-center gap-2.5 truncate min-w-0">
                <div className="h-6 w-6 rounded-full bg-white border border-[#F8C831] p-[3px] flex items-center justify-center shrink-0 shadow-sm">
                  {selectedSubcatObj?.logoUrl ? (
                    <OptimizedImage
                      src={selectedSubcatObj.logoUrl}
                      alt=""
                      width={24}
                      height={24}
                      sizeVariant="tiny"
                      className="max-h-full max-w-full object-contain drop-shadow-[0_1px_1px_rgba(0,0,0,0.25)]"
                      fallback={<span className="text-xs">🏆</span>}
                    />
                  ) : (
                    <span className="text-xs">🏆</span>
                  )}
                </div>
                <span className="truncate font-extrabold">
                  {selectedSubcatObj ? selectedSubcatObj.name : `All ${category.sportName} Leagues`}
                </span>
              </div>
              <ChevronRight className="h-4 w-4 text-[var(--text-muted)] shrink-0 rotate-90" />
            </button>
            <button
              onClick={() => setIsMobileSubcatOpen(true)}
              className="inline-flex items-center justify-center gap-1.5 rounded-[4px] bg-[#F8C831] px-5 py-3 text-xs sm:text-sm font-black text-gray-700 shadow-md hover:bg-yellow-400 transition-all shrink-0 cursor-pointer"
            >
              <Grid className="h-4 w-4" />
              <span>All ›</span>
            </button>
          </div>
        )}

          <div className="flex flex-col lg:flex-row gap-6 ">

            <aside className="hidden lg:block w-64 shrink-0 space-y-4 pt-2">
              <div className="flex items-center justify-between border-b border-[var(--border-glass)] pb-3">
                <h2 className="text-sm font-black text-[var(--text-white)] uppercase tracking-wider flex items-center gap-2">
                  <Layers className="h-4 w-4 text-[#F8C831]" /> Active Leagues
                </h2>
                <span className="text-xs font-bold text-[var(--text-muted)]">
                  {subcategories.length} Active
                </span>
              </div>

              <button
                onClick={() => handleSubcategorySelect(null)}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all border ${selectedSubcategory === null && !subcategorySlug
                  ? 'bg-[#F8C831] text-black shadow-md border-[#F8C831]'
                  : 'bg-[var(--bg-card)] text-[var(--text-white)] border-[var(--border-glass)] hover:bg-[var(--bg-card-hover)]'
                  }`}
              >
                <span className="truncate">All {category?.sportName || 'League'} Events</span>
              </button>

              {loading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-10 rounded-xl bg-slate-300 dark:bg-zinc-800 animate-pulse" />
                  ))}
                </div>
              ) : subcategories.length === 0 ? (
                <div className="p-4 border border-[var(--border-glass)] bg-[var(--bg-card)] rounded-xl text-xs text-[var(--text-muted)] text-center">
                  No active subcategories enabled for this sport.
                </div>
              ) : (
                <ScrollableSidebarList
                  maxHeightClass="max-h-[70vh]"
                  className="flex flex-col gap-1.5 pr-1"
                  dependency={[subcategories, selectedSubcategory]}
                  activeId={selectedSubcategory}
                  label="More Leagues"
                >
                  {subcategories.map((subcat) => {
                    const isSelected = selectedSubcategory === String(subcat.id) || (Boolean(subcategorySlug) && slugify(subcat.name) === subcategorySlug?.toLowerCase());
                    return (
                      <button
                        key={subcat.id}
                        data-subid={String(subcat.id)}
                        data-active={isSelected ? 'true' : 'false'}
                        ref={isSelected ? activeSubcatRef : null}
                        onClick={() => handleSubcategorySelect(subcat)}
                        className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all border ${isSelected
                          ? 'bg-[#F8C831] text-black shadow-md border-[#F8C831]'
                          : 'bg-[var(--bg-card)] text-[#555555] dark:text-zinc-200 border-[var(--border-glass)] hover:bg-[var(--bg-card-hover)]'
                          }`}
                      >
                        <div className="flex items-center gap-2.5 truncate flex-1 min-w-0 pr-2">
                          <div className="h-6 w-6 rounded-full bg-white border border-[#F8C831] p-[3px] flex items-center justify-center shrink-0 shadow-sm">
                            {subcat.logoUrl ? (
                              <OptimizedImage
                                src={subcat.logoUrl}
                                alt=""
                                width={24}
                                height={24}
                                sizeVariant="tiny"
                                className="max-h-full max-w-full object-contain drop-shadow-[0_1px_1px_rgba(0,0,0,0.25)]"
                                fallback={<span className="text-xs">🏆</span>}
                              />
                            ) : (
                              <span className="text-xs">🏆</span>
                            )}
                          </div>
                          <span className="truncate text-left font-bold text-xs sm:text-sm">
                            {subcat.name}
                          </span>
                        </div>
                        <ChevronRight
                          className={`h-4 w-4 shrink-0 transition-transform ${isSelected ? 'text-black' : 'text-slate-400 dark:text-zinc-400'
                            }`}
                        />
                      </button>
                    );
                  })}
                </ScrollableSidebarList>
              )}
            </aside>

            <main className="flex-1 space-y-6 min-w-0">
              {loading || (matchesLoading && matches.length === 0) ? (
                <div className="space-y-4 min-h-[400px]">
                  <div className="h-6 w-48 rounded-lg bg-slate-300 dark:bg-zinc-800 animate-pulse mb-3" />
                  <div className="space-y-2.5">
                    {[...Array(6)].map((_, i) => (
                      <MatchCardSkeleton key={i} />
                    ))}
                  </div>
                </div>
              ) : (uniqueMatches.length === 0 || (liveMatches.length === 0 && todayUpcomingMatches.length === 0 && tomorrowUpcomingMatches.length === 0)) ? (
                <div className="p-8 text-center text-xs sm:text-sm text-[var(--text-muted)] border border-[var(--border-glass)] rounded-2xl bg-[var(--bg-card)] space-y-2">
                  <div className="text-3xl">📅</div>
                  <div className="font-bold text-base text-[var(--text-white)]">
                    {selectedSubcategory || subcategorySlug ? 'No match schedule today' : 'No Events Available'}
                  </div>
                  <p>
                    {selectedSubcategory || subcategorySlug
                      ? `There are currently no matches scheduled for ${subcategories.find((s) => String(s.id) === String(selectedSubcategory) || (subcategorySlug && slugify(s.name) === subcategorySlug.toLowerCase()))?.name || (subcategorySlug ? subcategorySlug.replace(/-/g, ' ') : 'this league')} today. Please check back later.`
                      : 'There are currently no events available under this filter.'}
                  </p>
                </div>
              ) : (
                <motion.div
                  key={categorySlug + (selectedSubcategory || 'all')}
                  initial={{ opacity: 0.4, y: 3 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  className={`space-y-6 min-h-[400px] ${matchesLoading ? 'opacity-60 transition-opacity duration-150 pointer-events-none' : 'opacity-100'}`}
                >
                  {liveMatches.length > 0 && (
                    <div className="space-y-3">
                      <div className="relative flex items-center justify-center my-6">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-[var(--border-glass)]" />
                        </div>
                        <div className="relative inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--bg-card)] border border-[var(--border-glass)] text-[11px] font-black uppercase tracking-wider text-[var(--text-white)] shadow-sm">
                          <Radio className="h-3.5 w-3.5 text-[#40b857] animate-pulse" />
                          <span>LIVE EVENTS</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#40b857]/10 text-[#40b857] border border-[#40b857]/20 font-bold">
                            {liveMatches.length}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {liveMatches.map((m) => (
                          <MatchCard key={m.id} match={m} />
                        ))}
                      </div>
                    </div>
                  )}

                  {todayUpcomingMatches.length > 0 && (
                    <div className="space-y-3">
                      <div className="relative flex items-center justify-center my-6">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-[var(--border-glass)]" />
                        </div>
                        <div className="relative inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--bg-card)] border border-[var(--border-glass)] text-[11px] font-black uppercase tracking-wider text-[var(--text-white)] shadow-sm">
                          <Clock3 className="h-3.5 w-3.5 text-indigo-400" />
                          <span>UPCOMING</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold">
                            {todayUpcomingMatches.length}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {todayUpcomingMatches.map((m) => (
                          <MatchCard key={m.id} match={m} />
                        ))}
                      </div>
                    </div>
                  )}

                  {tomorrowUpcomingMatches.length > 0 && (
                    <div className="space-y-6 pt-2">
                      {(() => {
                        const groupedTomorrow: { [key: string]: MatchItem[] } = {};
                        tomorrowUpcomingMatches.forEach((m) => {
                          const matchDate = m.matchTime ? new Date(m.matchTime) : new Date();
                          const dateFormatted = matchDate.toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                          }).toUpperCase();
                          if (!groupedTomorrow[dateFormatted]) groupedTomorrow[dateFormatted] = [];
                          groupedTomorrow[dateFormatted].push(m);
                        });

                        return Object.entries(groupedTomorrow).map(([dateHeader, items]) => (
                          <div key={dateHeader} className="space-y-3">
                            <div className="relative flex items-center justify-center my-6">
                              <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-[var(--border-glass)]" />
                              </div>
                              <div className="relative inline-flex items-center gap-2 px-4.5 py-1.5 rounded-full bg-[var(--bg-card)] border border-[var(--border-glass)] text-[11px] font-black uppercase tracking-wider text-[var(--text-white)] shadow-sm font-mono">
                                <CalendarDays className="h-3.5 w-3.5 text-[#F8C831]" />
                                <span>{dateHeader}</span>
                              </div>
                            </div>
                            <div className="space-y-2">
                              {items.map((m) => (
                                <MatchCard key={m.id} match={m} />
                              ))}
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  )}

                  <div ref={observerTarget} className="py-4">
                    {loadingMore && (
                      <div className="space-y-2.5">
                        {[...Array(3)].map((_, i) => (
                          <MatchCardSkeleton key={`more-${i}`} />
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </main>
          </div>
      </div>

      {isMobileSubcatOpen && (
        <div className="fixed inset-0 z-[9999999999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-[28px] border border-[var(--border-glass)] bg-[var(--bg-card)] text-[var(--text-white)] p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[var(--border-glass)] pb-3 shrink-0">
              <h3 className="text-base font-extrabold text-[var(--text-white)]">All Leagues</h3>
              <button
                onClick={() => setIsMobileSubcatOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--bg-card-hover)] text-[var(--text-muted)] hover:text-[var(--text-white)] transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* SCROLLABLE MODAL BODY */}
            <ScrollableSidebarList
              maxHeightClass="max-h-[60vh]"
              className="space-y-4 flex-1 py-1 pr-1"
              dependency={[subcategories, selectedSubcategory]}
              activeId={selectedSubcategory}
              label="More Leagues"
            >

              {/* ALL LEAGUES BUTTON */}
              <button
                onClick={() => handleSubcategorySelect(null)}
                className={`w-full flex items-center justify-between p-3 rounded-2xl text-xs sm:text-sm font-extrabold transition-all border ${selectedSubcategory === null
                  ? 'bg-[#F8C831] text-black shadow-md border-[#F8C831]'
                  : 'bg-[var(--bg-main)] text-[var(--text-white)] border-[var(--border-glass)]'
                  }`}
              >
                <span>All {category?.sportName || 'League'} Events</span>
              </button>

              {/* SECTION HEADER: | TOP LEAGUES */}
              <div className="text-[11px] font-black text-[#F8C831] uppercase tracking-wider flex items-center gap-1.5 pt-2">
                <span className="h-3 w-1 bg-[#F8C831] rounded-full" />
                <span>TOP LEAGUES</span>
              </div>

              {/* 3-COLUMN GRID OF REAL SUBCATEGORIES (MATCHES USER SCREENSHOT) */}
              <div className="grid grid-cols-3 gap-y-6 gap-x-3 text-center py-2">
                {subcategories.map((subcat) => {
                  const isSelected = selectedSubcategory === String(subcat.id);
                  return (
                    <button
                      key={subcat.id}
                      data-subid={String(subcat.id)}
                      data-active={isSelected ? 'true' : 'false'}
                      onClick={() => handleSubcategorySelect(subcat)}
                      className="flex flex-col items-center justify-center group cursor-pointer"
                    >
                      <div className={`flex h-[52px] w-[52px] items-center justify-center rounded-full transition-all p-2.5 ${isSelected
                        ? 'bg-[#F8C831] shadow-lg ring-2 ring-[#F8C831]'
                        : 'bg-white border-2 border-[#F8C831] group-hover:scale-105 shadow-sm'
                        }`}>
                        {subcat.logoUrl ? (
                          <OptimizedImage
                            src={subcat.logoUrl}
                            alt=""
                            width={40}
                            height={40}
                            sizeVariant="tiny"
                            className="max-h-full max-w-full object-contain drop-shadow-[0_1px_1px_rgba(0,0,0,0.25)]"
                            fallback={<span className="text-xl">🏆</span>}
                          />
                        ) : (
                          <span className="text-xl">🏆</span>
                        )}
                      </div>
                      <span className={`text-[11px] font-bold mt-2 truncate max-w-full ${isSelected ? 'text-[#F8C831]' : 'text-[var(--text-white)]'
                        }`}>
                        {subcat.name}
                      </span>
                    </button>
                  );
                })}
              </div>

            </ScrollableSidebarList>

          </div>
        </div>
      )}
    </>
  );
}
