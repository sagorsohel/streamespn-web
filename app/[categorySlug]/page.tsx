'use client';

import React, { useEffect, useState, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { getCategories, clearCategoriesCache } from '@/lib/categories';
import { getCachedMatches, setCachedMatches, getCachedSubcategories, setCachedSubcategories } from '@/lib/matchesCache';
import { motion, AnimatePresence } from 'framer-motion';
import { slugify } from '@/lib/utils';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { TopLoadingBar, startTopLoader, stopTopLoader } from '@/components/layout/TopLoadingBar';
import { useLiveScoreSync } from '@/lib/useLiveScoreSync';
import { MatchCard, MatchItem } from '@/components/home/MatchCard';
import { MatchCardSkeleton } from '@/components/home/MatchCardSkeleton';
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

const getSportIcon = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('foot') || n.includes('socc')) return '⚽';
  if (n.includes('fight') || n.includes('ufc') || n.includes('box')) return '🥊';
  if (n.includes('nfl') || n.includes('americ')) return '🏈';
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
}

interface PageProps {
  params: Promise<{ categorySlug: string; subcategorySlug?: string }>;
}

export function CategoryPageComponent({ categorySlug, subcategorySlug }: { categorySlug: string; subcategorySlug?: string }) {
  const router = useRouter();

  const [category, setCategory] = useState<Category | null>(null);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [matches, setMatches] = useState<MatchItem[]>([]);

  // 🔄 REAL-TIME SILENT LIVE SCORE & MINUTE SYNC (15s interval)
  useLiveScoreSync(matches, setMatches);

  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [matchesLoading, setMatchesLoading] = useState<boolean>(false);
  const [notFound, setNotFound] = useState<boolean>(false);
  const [isMobileSubcatOpen, setIsMobileSubcatOpen] = useState<boolean>(false);

  // Infinite Scroll & Pagination States (20 items per batch)
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const observerTarget = useRef<HTMLDivElement>(null);
  const activeSubcatRef = useRef<HTMLButtonElement | null>(null);

  // Auto-scroll selected subcategory into view in left sidebar
  useEffect(() => {
    if (selectedSubcategory && activeSubcatRef.current) {
      const timer = setTimeout(() => {
        activeSubcatRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'nearest',
        });
      }, 250);
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
      let url = `/matches?limit=50&page=${pageNum}&categoryId=${catId}`;
      if (subId) url += `&subcategoryId=${subId}`;

      const res = await api.get(url);
      if (res.data?.success && Array.isArray(res.data?.data?.matches)) {
        let fetched: MatchItem[] = res.data.data.matches;

        // Fallback 1: If subcategory returns 0 matches, fallback to category matches
        if (pageNum === 1 && fetched.length === 0 && subId) {
          try {
            const catFallback = await api.get(`/matches?limit=50&page=1&categoryId=${catId}`);
            if (catFallback.data?.success && Array.isArray(catFallback.data?.data?.matches) && catFallback.data.data.matches.length > 0) {
              fetched = catFallback.data.data.matches;
              setSelectedSubcategory(null);
            }
          } catch (e) {}
        }

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
        setHasMore(fetched.length >= 50);
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
          if (isMounted) setNotFound(true);
          return;
        }

        const targetCategory = sportsList.find(
          (c) => slugify(c.sportName) === categorySlug.toLowerCase() || String(c.id) === categorySlug
        );

        if (!targetCategory) {
          if (isMounted) setNotFound(true);
          return;
        }

        if (!isMounted) return;

        setCategory(targetCategory);
        setLoading(false);

        let initialSubId: string | null = null;
        let fetchedSubList: Subcategory[] = [];

        try {
          const subRes = await api.get(`/subcategories?categoryId=${targetCategory.id}`);
          if (subRes.data?.success && Array.isArray(subRes.data?.data?.subcategories)) {
            fetchedSubList = subRes.data.data.subcategories;
            const activeSubs = fetchedSubList.filter((s: Subcategory) => Boolean(s.status) === true);

            if (subcategorySlug && activeSubs.length > 0) {
              const matchedSubcat = activeSubs.find(
                (s: Subcategory) => slugify(s.name) === subcategorySlug.toLowerCase() || String(s.id) === subcategorySlug
              );
              if (matchedSubcat) {
                initialSubId = String(matchedSubcat.id);
              }
            }
            if (isMounted) setSelectedSubcategory(initialSubId);
          }
        } catch (e) {}

        if (!isMounted) return;

        let matchUrl = `/matches?limit=100&page=1&categoryId=${targetCategory.id}`;
        if (initialSubId) matchUrl += `&subcategoryId=${initialSubId}`;

        const matchRes = await api.get(matchUrl);

        if (!isMounted) return;

        if (matchRes.data?.success && Array.isArray(matchRes.data?.data?.matches)) {
          let fetchedMatches: MatchItem[] = matchRes.data.data.matches;

          // Auto Fallback: If subcategory filter returns 0 matches, fallback to category matches
          if (fetchedMatches.length === 0 && initialSubId) {
            try {
              const fallbackRes = await api.get(`/matches?limit=100&page=1&categoryId=${targetCategory.id}`);
              if (fallbackRes.data?.success && Array.isArray(fallbackRes.data?.data?.matches) && fallbackRes.data.data.matches.length > 0) {
                fetchedMatches = fallbackRes.data.data.matches;
                setSelectedSubcategory(null);
              }
            } catch (e) {}
          }



          const uniqueMatches = Array.from(new Map(fetchedMatches.map((m) => [m.id, m])).values());
          setMatches(uniqueMatches);
          setPage(1);
          setHasMore(uniqueMatches.length >= 20);

          const activeSubList = fetchedSubList.filter((s: Subcategory) => Boolean(s.status) === true);
          if (isMounted) setSubcategories(activeSubList);
        }
      } catch (err) {
        if (isMounted && !matches.length) setNotFound(true);
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
  }, [categorySlug, subcategorySlug]);

  useEffect(() => {
    if (!subcategories.length || !category) return;
    let targetSubId: string | null = null;

    if (subcategorySlug) {
      const matchedSubcat = subcategories.find(
        (s) => slugify(s.name) === subcategorySlug.toLowerCase() || String(s.id) === subcategorySlug
      );
      if (matchedSubcat) {
        targetSubId = String(matchedSubcat.id);
      }
    }

    if (targetSubId !== selectedSubcategory) {
      setSelectedSubcategory(targetSubId);
      fetchMatches(category.id, targetSubId, 1);
    }
  }, [subcategorySlug, subcategories, category]);

  const handleSubcategorySelect = (subcat: Subcategory | null) => {
    if (!category) return;
    setIsMobileSubcatOpen(false);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }

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

  const isToday = (dateStr: string) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const now = new Date();
    return (
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear()
    );
  };

  const liveMatches = React.useMemo(() => uniqueMatches.filter((m) => m.status === 'live'), [uniqueMatches]);
  const todayUpcomingMatches = React.useMemo(() => uniqueMatches.filter((m) => m.status !== 'live' && isToday(m.matchTime)), [uniqueMatches]);
  const tomorrowUpcomingMatches = React.useMemo(() => uniqueMatches.filter((m) => m.status !== 'live' && !isToday(m.matchTime)), [uniqueMatches]);

  const selectedSubcatObj = subcategories.find((s) => String(s.id) === selectedSubcategory);

  return (
    <>
      <TopLoadingBar isLoading={matchesLoading} />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-6 pb-12 flex-1 w-full space-y-6">

        <div className="relative overflow-hidden rounded-2xl border border-[var(--border-glass)] bg-[var(--bg-card)] p-5 sm:p-6  flex items-center justify-between gap-4 transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/15 via-yellow-500/5 to-transparent opacity-80 pointer-events-none" />

          <div className="relative z-10 flex items-center justify-between w-full">
            <div className="flex items-center gap-3.5 sm:gap-5 min-w-0">
              <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-black text-2xl sm:text-3xl shrink-0 shadow-lg shadow-amber-500/20 font-black">
                {selectedSubcatObj?.logoUrl || category?.iconUrl ? (
                  <img
                    src={selectedSubcatObj?.logoUrl || category?.iconUrl}
                    alt=""
                    className="h-7 w-7 sm:h-8 sm:w-8 object-contain"
                  />
                ) : (
                  <span>{getSportIcon(selectedSubcatObj?.name || category?.sportName || categorySlug)}</span>
                )}
              </div>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[var(--text-white)] truncate capitalize">
                  {selectedSubcatObj ? selectedSubcatObj.name : (category ? `${category.sportName} Events` : `${categorySlug.replace(/-/g, ' ')} Events`)}
                </h1>
                <p className="text-xs sm:text-sm font-semibold text-[var(--text-muted)] mt-1">
                  Live streaming schedules, active leagues & results
                </p>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--bg-main)] border border-[var(--border-glass)] text-xs font-bold text-[#F8C831] shadow-inner shrink-0">
              <Sparkles className="h-3.5 w-3.5 text-[#F8C831]" />
              <span>{uniqueMatches.length} Events</span>
            </div>
          </div>
        </div>

        {!notFound && category && subcategories.length > 0 && (
          <div className="lg:hidden flex items-center gap-2.5 w-full">
            <button
              onClick={() => setIsMobileSubcatOpen(true)}
              className="flex-1 flex items-center justify-between gap-2.5 rounded-xl border border-[var(--border-glass)] bg-[var(--bg-card)] px-4 py-3 text-xs sm:text-sm font-bold text-[var(--text-white)] hover:border-[#F8C831] transition-all min-w-0"
            >
              <div className="flex items-center gap-2.5 truncate min-w-0">
                {selectedSubcatObj?.logoUrl ? (
                  <img src={selectedSubcatObj.logoUrl} alt="" className="h-5 w-5 object-contain shrink-0" />
                ) : (
                  <span className="text-sm shrink-0">🏆</span>
                )}
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

        {notFound ? (
          <div className="p-12 text-center border border-[var(--border-glass)] rounded-2xl bg-[var(--bg-card)] space-y-3">
            <div className="text-4xl">⚽</div>
            <h2 className="text-lg font-bold text-[var(--text-white)]">Category Not Found</h2>
            <p className="text-xs text-[var(--text-muted)]">
              The sports category "{categorySlug}" could not be located.
            </p>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6">

            <aside className="hidden lg:block w-64 shrink-0 space-y-4">
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
                className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all border ${selectedSubcategory === null
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
                <div className="flex flex-col gap-1.5 overflow-y-auto no-scrollbar max-h-[70vh]">
                  {subcategories.map((subcat) => {
                    const isSelected = selectedSubcategory === String(subcat.id);
                    return (
                      <button
                        key={subcat.id}
                        ref={isSelected ? activeSubcatRef : null}
                        onClick={() => handleSubcategorySelect(subcat)}
                        className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all border ${isSelected
                          ? 'bg-[#F8C831] text-black shadow-md border-[#F8C831]'
                          : 'bg-[var(--bg-card)] text-[#555555] dark:text-zinc-200 border-[var(--border-glass)] hover:bg-[var(--bg-card-hover)]'
                          }`}
                      >
                        <div className="flex items-center gap-2.5 truncate flex-1 min-w-0 pr-2">
                          {subcat.logoUrl ? (
                            <img src={subcat.logoUrl} alt="" className="h-5 w-5 object-contain shrink-0" />
                          ) : (
                            <span className="text-sm shrink-0">🏆</span>
                          )}
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
                </div>
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
              ) : uniqueMatches.length === 0 ? (
                <div className="p-8 text-center text-xs sm:text-sm text-[var(--text-muted)] border border-[var(--border-glass)] rounded-2xl bg-[var(--bg-card)] space-y-2">
                  <div className="text-3xl">📅</div>
                  <div className="font-bold text-[var(--text-white)]">No Events Available</div>
                  <p>There are currently no events available under this filter.</p>
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
        )}
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
            <div className="overflow-y-auto no-scrollbar space-y-4 flex-1 py-1">

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
                      onClick={() => handleSubcategorySelect(subcat)}
                      className="flex flex-col items-center justify-center group cursor-pointer"
                    >
                      <div className={`flex h-[52px] w-[52px] items-center justify-center rounded-2xl transition-all p-2 ${isSelected
                        ? 'bg-[#F8C831] shadow-lg ring-2 ring-[#F8C831]'
                        : 'bg-[var(--bg-main)] border border-[var(--border-glass)] group-hover:border-[#F8C831] group-hover:scale-105'
                        }`}>
                        {subcat.logoUrl ? (
                          <img src={subcat.logoUrl} alt="" className="max-h-full max-w-full object-contain" />
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

            </div>

          </div>
        </div>
      )}
    </>
  );
}

export default function CategoryPage({ params }: PageProps) {
  const { categorySlug } = use(params);
  return <CategoryPageComponent categorySlug={categorySlug} />;
}
