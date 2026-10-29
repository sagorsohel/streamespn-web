'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { getCategories } from '@/lib/categories';
import { slugify } from '@/lib/utils';
import { motion } from 'framer-motion';
import { JsonLdSchema } from '@/components/seo/JsonLdSchema';
import { SportsFilter, Category } from '@/components/home/SportsFilter';
import { MatchCard, MatchItem } from '@/components/home/MatchCard';
import { useLiveScoreSync } from '@/lib/useLiveScoreSync';
import { MatchCardSkeleton } from '@/components/home/MatchCardSkeleton';
import { BannerSkeleton } from '@/components/home/BannerSkeleton';
import { MobileLiveSlider } from '@/components/home/MobileLiveSlider';
import { HeroBannerCarousel } from '@/components/home/HeroBannerCarousel';
import { OptimizedImage } from '@/components/common/OptimizedImage';
import { ScrollableSidebarList } from '@/components/common/ScrollableSidebarList';
import { startTopLoader, stopTopLoader } from '@/components/layout/TopLoadingBar';
import {
  Clock3,
  ChevronRight,
  Flame,
  Radio,
  CalendarDays
} from 'lucide-react';

export interface HomePageClientProps {
  initialCategories?: Category[];
  initialTrendingSubcategories?: any[];
  initialBannerMatches?: MatchItem[];
  initialMatches?: MatchItem[];
}

export function HomePageClient({
  initialCategories,
  initialTrendingSubcategories,
  initialBannerMatches,
  initialMatches,
}: HomePageClientProps) {
  const [categories, setCategories] = useState<Category[]>(initialCategories || []);
  const [trendingSubcategories, setTrendingSubcategories] = useState<any[]>(initialTrendingSubcategories || []);
  const [matches, setMatches] = useState<MatchItem[]>(initialMatches || []);
  const [bannerMatches, setBannerMatches] = useState<MatchItem[]>(initialBannerMatches || []);

  // 🔄 REAL-TIME SILENT LIVE SCORE & MINUTE SYNC (15s interval)
  useLiveScoreSync(matches, setMatches);

  // Loading & Infinite Scroll States
  const [loading, setLoading] = useState<boolean>(!initialMatches || initialMatches.length === 0);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>((initialMatches?.length || 0) >= 20);
  const observerTarget = useRef<HTMLDivElement>(null);
  const isFetchingRef = useRef<boolean>(false);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);

  // Fetch Categories
  const fetchCategories = async () => {
    try {
      const sportsList = await getCategories();
      setCategories(sportsList);
    } catch (err) {
      // ignore
    }
  };

  // Fetch Trending Subcategories
  const fetchTrendingSubcategories = async () => {
    try {
      const res = await api.get('/subcategories?trending=true&home=true');
      if (res.data?.success) {
        setTrendingSubcategories(res.data.data.subcategories || []);
      }
    } catch (err) {
      // ignore
    }
  };

  // Fetch Banner Carousel Matches
  const fetchBannerMatches = async () => {
    try {
      const res = await api.get('/matches/banner');
      if (res.data?.success && Array.isArray(res.data?.data?.matches)) {
        setBannerMatches(res.data.data.matches);
      }
    } catch (err) {
      // ignore
    }
  };

  // Fetch Matches
  const fetchMatches = async (pageNum = 1) => {
    if (pageNum === 1) {
      startTopLoader();
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    isFetchingRef.current = true;

    try {
      let url = `/matches?limit=20&page=${pageNum}&home=true&`;
      if (selectedCategory !== 'all') url += `categoryId=${selectedCategory}&`;
      if (selectedSubcategory) url += `subcategoryId=${selectedSubcategory}&`;

      const res = await api.get(url);
      if (res.data?.success && Array.isArray(res.data?.data?.matches)) {
        let fetchedMatches: MatchItem[] = res.data.data.matches;

        if (pageNum === 1) {
          const unique = Array.from(new Map(fetchedMatches.map((m) => [m.id, m])).values());
          setMatches(unique);
        } else {
          setMatches((prev) => {
            const combined = [...prev, ...fetchedMatches];
            return Array.from(new Map(combined.map((m) => [m.id, m])).values());
          });
        }

        setPage(pageNum);
        setHasMore(fetchedMatches.length >= 20);
      } else {
        if (pageNum === 1) setMatches([]);
        setHasMore(false);
      }
    } catch (err) {
      if (pageNum === 1) setMatches([]);
      setHasMore(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      isFetchingRef.current = false;
      stopTopLoader();
    }
  };

  // Load More Matches (Next Page)
  const loadMoreMatches = () => {
    if (isFetchingRef.current || loadingMore || !hasMore || loading) return;
    fetchMatches(page + 1);
  };

  const initialDataProvided = useRef<boolean>(
    Boolean(initialMatches && initialMatches.length > 0)
  );

  useEffect(() => {
    // If SSR already pre-populated data, fast-mount with initialMatches then silently revalidate
    if (initialDataProvided.current) {
      initialDataProvided.current = false;
      fetchMatches(1);
      return;
    }
    fetchCategories();
    fetchTrendingSubcategories();
    fetchBannerMatches();
    fetchMatches(1);
  }, []);

  // Re-fetch matches only when user actually switches filters (not on initial mount)
  const isFilterMountedRef = useRef<boolean>(false);
  useEffect(() => {
    if (!isFilterMountedRef.current) {
      isFilterMountedRef.current = true;
      return;
    }
    fetchMatches(1);
  }, [selectedCategory, selectedSubcategory]);

  // Infinite Scroll IntersectionObserver
  useEffect(() => {
    const target = observerTarget.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore && !isFetchingRef.current) {
          loadMoreMatches();
        }
      },
      { rootMargin: '200px', threshold: 0.1 }
    );

    observer.observe(target);

    return () => {
      observer.unobserve(target);
      observer.disconnect();
    };
  }, [hasMore, loading, loadingMore, page, selectedCategory, selectedSubcategory]);

  // Deduplicate matches array by ID to guarantee unique React keys
  const uniqueMatches = React.useMemo(() => {
    return Array.from(new Map(matches.map((m) => [m.id, m])).values());
  }, [matches]);

  // Filter Date Helpers
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
      // Stale safety guard: Sports matches do not exceed 3.5 hours and cannot belong to earlier days
      return hoursDiff >= -0.5 && hoursDiff <= 3.5 && (isToday(m.matchTime) || isTomorrow(m.matchTime));
    });
  }, [uniqueMatches]);

  // 2. Today's Upcoming: Matches happening today (excluding finished and live)
  const todayUpcomingMatches = React.useMemo(() => {
    return uniqueMatches.filter((m) => m.status !== 'live' && m.status !== 'finished' && isToday(m.matchTime));
  }, [uniqueMatches]);

  // 3. Tomorrow's Scheduled Matches: Matches happening tomorrow only (excluding finished and live)
  const tomorrowUpcomingMatches = React.useMemo(() => {
    return uniqueMatches.filter((m) => m.status !== 'live' && m.status !== 'finished' && isTomorrow(m.matchTime));
  }, [uniqueMatches]);

  // Featured Hero Matches Carousel (from banner API or fallback to live and today/tomorrow upcoming)
  const displayedBannerMatches = React.useMemo(() => {
    const now = Date.now();
    const validMatches = (bannerMatches.length > 0 ? bannerMatches : uniqueMatches).filter((m) => {
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
    return [...live, ...upcoming].slice(0, 10);
  }, [bannerMatches, uniqueMatches]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1.0] }}
      className="mx-auto max-w-7xl px-4 sm:px-6 pt-3 pb-12 flex-1 w-full"
    >
      <JsonLdSchema type="home" />

      {/* BANNER / SLIDER LOADING SKELETON (MOBILE & DESKTOP STYLED) */}
      {loading && displayedBannerMatches.length === 0 ? (
        <BannerSkeleton />
      ) : (
        <>
          {/* MOBILE ONLY: FEATURED MATCHES AUTO-SLIDING CAROUSEL (SAME AS DESKTOP BANNER) */}
          <MobileLiveSlider matches={displayedBannerMatches} />

          {/* FULL-WIDTH FEATURED MATCH BANNER CAROUSEL (DESKTOP / TABLET ONLY - FULL NAVBAR WIDTH) */}
          <HeroBannerCarousel matches={displayedBannerMatches} />
        </>
      )}

      <div className="flex flex-col lg:flex-row gap-6">

        {/* LEFT SIDEBAR: TRENDING SUBCATEGORIES LIST (DESKTOP ONLY - HIDDEN ON MOBILE) */}
        <aside className="hidden lg:block w-full lg:w-64 shrink-0 space-y-4 pt-3">

          <div className="border-b border-[var(--border-glass)] ">
            <h2 className="text-base font-black text-[var(--text-white)] border-b-2 border-[#F8C831] pb-1 inline-flex items-center gap-1.5">
              <Flame className="h-4 w-4 text-[#F8C831] fill-[#F8C831]" />
              <span>Trending</span>
            </h2>
          </div>

          {trendingSubcategories.length === 0 ? (
            <div className="p-4 rounded-xl border border-[var(--border-glass)] bg-[var(--bg-card)] text-xs text-[var(--text-muted)] text-center">
              No trending leagues available right now.
            </div>
          ) : (
            <ScrollableSidebarList
              maxHeightClass="max-h-[75vh]"
              className="flex flex-col gap-1 pr-1"
              dependency={trendingSubcategories}
              label="More Leagues"
            >
              {trendingSubcategories.map((subcat) => {
                const parentCat = categories.find((c) => c.id === subcat.categoryId);
                const catSlug = slugify(subcat.categoryName || parentCat?.sportName || 'sports');
                const subSlug = slugify(subcat.name);
                const targetUrl = `/${catSlug}/${subSlug}`;
                const isSelected = selectedSubcategory === String(subcat.id);

                return (
                  <Link
                    key={subcat.id}
                    href={targetUrl}
                    onClick={() => startTopLoader()}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-[14px] font-semibold leading-[1.5] transition-all group ${isSelected
                      ? 'bg-[#F8C831] text-black shadow-md border border-[#F8C831]'
                      : 'bg-[var(--bg-card)] text-[#555555] dark:text-zinc-200 border border-[var(--border-glass)] hover:bg-[var(--bg-card-hover)] hover:text-black dark:hover:text-white'
                      }`}
                  >
                    <div className="flex items-center gap-2.5 truncate flex-1 min-w-0 mr-1.5">
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
                      <span className="text-[14px] font-semibold leading-[1.5] truncate flex-1 text-left">
                        {subcat.name}
                      </span>
                    </div>

                    <ChevronRight
                      className={`h-4 w-4 shrink-0 transition-transform ${isSelected ? 'text-black' : 'text-slate-400 dark:text-zinc-400 group-hover:translate-x-0.5'
                        }`}
                    />
                  </Link>
                );
              })}
            </ScrollableSidebarList>
          )}

        </aside>

        {/* RIGHT MAIN CONTENT AREA */}
        <main className="flex-1 space-y-6 min-w-0">

          {/* MOBILE ONLY: TRENDING LEAGUES HORIZONTAL SCROLL BAR */}
          {trendingSubcategories.length > 0 && (
            <div className="lg:hidden space-y-2 pt-1 pb-1">
              <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-[var(--text-white)]">
                <Flame className="h-4 w-4 text-[#F8C831] fill-[#F8C831]" />
                <span>Trending Leagues</span>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
                {trendingSubcategories.map((subcat) => {
                  const parentCat = categories.find((c) => c.id === subcat.categoryId);
                  const catSlug = slugify(subcat.categoryName || parentCat?.sportName || 'sports');
                  const subSlug = slugify(subcat.name);
                  const targetUrl = `/${catSlug}/${subSlug}`;
                  const isSelected = selectedSubcategory === String(subcat.id);

                  return (
                    <Link
                      key={subcat.id}
                      href={targetUrl}
                      onClick={() => startTopLoader()}
                      className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold shrink-0 transition-all ${
                        isSelected
                          ? 'bg-[#F8C831] text-black shadow-md border border-[#F8C831]'
                          : 'bg-[var(--bg-card)] text-[#555555] dark:text-zinc-200 border border-[var(--border-glass)] hover:bg-[var(--bg-card-hover)] hover:text-black dark:hover:text-white'
                      }`}
                    >
                      <div className="h-4 w-4 rounded-full bg-white border border-[#F8C831] p-[1.5px] flex items-center justify-center shrink-0">
                        {subcat.logoUrl ? (
                          <OptimizedImage
                            src={subcat.logoUrl}
                            alt=""
                            width={14}
                            height={14}
                            sizeVariant="tiny"
                            className="max-h-full max-w-full object-contain"
                            fallback={<span className="text-[10px]">🏆</span>}
                          />
                        ) : (
                          <span className="text-[10px]">🏆</span>
                        )}
                      </div>
                      <span className="whitespace-nowrap">{subcat.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* INITIAL LOADING STATE WITH RESPONSIVE SKELETONS */}
          {loading && matches.length === 0 ? (
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
              <div className="font-bold text-[var(--text-white)]">No Events Available</div>
              <p>There are currently no events available under this filter.</p>
            </div>
          ) : (
            <motion.div
              key={selectedCategory + (selectedSubcategory || 'all')}
              initial={{ opacity: 0.4, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="space-y-6 min-h-[400px]"
            >
              {/* 1. LIVE MATCHES (FIRST ORDER) */}
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

              {/* 2. UPCOMING MATCHES (SECOND ORDER) */}
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

              {/* 3. FUTURE SCHEDULED MATCHES GROUPED BY DATE */}
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

              {/* INFINITE SCROLL OBSERVER TARGET */}
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

    </motion.div>
  );
}

export default HomePageClient;
