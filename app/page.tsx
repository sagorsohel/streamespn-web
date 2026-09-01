'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { getCategories } from '@/lib/categories';
import { getCachedMatches, setCachedMatches } from '@/lib/matchesCache';
import { slugify } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { SportsFilter, Category } from '@/components/home/SportsFilter';
import { MatchCard, MatchItem } from '@/components/home/MatchCard';
import { useLiveScoreSync } from '@/lib/useLiveScoreSync';
import { MatchCardSkeleton } from '@/components/home/MatchCardSkeleton';
import { MobileLiveSlider } from '@/components/home/MobileLiveSlider';
import { AdRenderer } from '@/components/ads/AdRenderer';
import { startTopLoader, stopTopLoader } from '@/components/layout/TopLoadingBar';
import {
  Tv,
  PlayCircle,
  Clock3,
  CheckCircle2,
  Filter,
  RefreshCw,
  Sparkles,
  Zap,
  ChevronRight,
  Flame,
  Radio,
  CalendarDays
} from 'lucide-react';

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [trendingSubcategories, setTrendingSubcategories] = useState<any[]>([]);
  const [matches, setMatches] = useState<MatchItem[]>([]);

  // 🔄 REAL-TIME SILENT LIVE SCORE & MINUTE SYNC (15s interval)
  useLiveScoreSync(matches, setMatches);

  // Loading & Infinite Scroll States
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
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

  // Fetch Trending Subcategories (where is_trending = 1 in DB)
  const fetchTrendingSubcategories = async () => {
    try {
      const res = await api.get('/subcategories?trending=true');
      if (res.data?.success) {
        setTrendingSubcategories(res.data.data.subcategories || []);
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
      let url = `/matches?limit=50&page=${pageNum}&`;
      if (selectedCategory !== 'all') url += `categoryId=${selectedCategory}&`;
      if (selectedSubcategory) url += `subcategoryId=${selectedSubcategory}&`;

      const res = await api.get(url);
      if (res.data?.success && Array.isArray(res.data?.data?.matches)) {
        let fetchedMatches: MatchItem[] = res.data.data.matches;

        // Auto Fallback for Home Page ONLY if selectedCategory is 'all' and selectedSubcategory is set
        if (pageNum === 1 && fetchedMatches.length === 0 && selectedCategory === 'all' && selectedSubcategory !== null) {
          try {
            const fallbackRes = await api.get('/matches?limit=50&page=1');
            if (fallbackRes.data?.success && Array.isArray(fallbackRes.data?.data?.matches) && fallbackRes.data.data.matches.length > 0) {
              fetchedMatches = fallbackRes.data.data.matches;
              setSelectedSubcategory(null);
            }
          } catch (e) {
            // ignore
          }
        }

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
        setHasMore(fetchedMatches.length >= 50);
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

  useEffect(() => {
    fetchCategories();
    fetchTrendingSubcategories();
  }, []);

  // Re-fetch matches whenever selectedCategory or selectedSubcategory changes
  useEffect(() => {
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

  // Format Next Day's Date Header for Tab (e.g., "Sat, Aug 30")
  const nextDayFormattedDate = React.useMemo(() => {
    const tomorrowDate = new Date();
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    return tomorrowDate.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }, []);

  // Deduplicate matches array by ID to guarantee unique React keys
  const uniqueMatches = React.useMemo(() => {
    return Array.from(new Map(matches.map((m) => [m.id, m])).values());
  }, [matches]);

  // Featured Hero Match
  const featuredMatch = uniqueMatches[0] || null;

  // Filter 3 Sections: Live, Today's Upcoming, Future Dated
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

  const liveMatches = React.useMemo(() => {
    return uniqueMatches.filter((m) => m.status === 'live');
  }, [uniqueMatches]);

  const todayUpcomingMatches = React.useMemo(() => {
    return uniqueMatches.filter((m) => m.status !== 'live' && isToday(m.matchTime));
  }, [uniqueMatches]);

  const tomorrowUpcomingMatches = React.useMemo(() => {
    return uniqueMatches.filter((m) => m.status !== 'live' && !isToday(m.matchTime));
  }, [uniqueMatches]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1.0] }}
      className="mx-auto max-w-7xl px-4 sm:px-6 pt-3  pb-12 flex-1 w-full"
    >
      <div className="flex flex-col lg:flex-row gap-6">

        {/* LEFT SIDEBAR: TRENDING SUBCATEGORIES LIST (DESKTOP ONLY - HIDDEN ON MOBILE) */}
        <aside className="hidden lg:block w-full lg:w-64 shrink-0 space-y-4">

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
            <div className="flex flex-col gap-1 max-h-[75vh] overflow-y-auto no-scrollbar">
              {trendingSubcategories.map((subcat) => {
                const isSelected = selectedSubcategory === String(subcat.id);
                const hasLive = Boolean(subcat.liveMatchCount && subcat.liveMatchCount > 0);
                const hasMatches = Boolean(subcat.matchCount && subcat.matchCount > 0);

                return (
                  <button
                    key={subcat.id}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedSubcategory(null);
                      } else {
                        setSelectedSubcategory(String(subcat.id));
                      }
                    }}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-[14px] font-semibold leading-[1.5] transition-all group ${
                      isSelected
                        ? 'bg-[#F8C831] text-black shadow-md border border-[#F8C831]'
                        : 'bg-[var(--bg-card)] text-[#555555] dark:text-zinc-200 border border-[var(--border-glass)] hover:bg-[var(--bg-card-hover)]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate flex-1 min-w-0 mr-1.5">
                      {subcat.logoUrl ? (
                        <img src={subcat.logoUrl} alt="" className="h-5 w-5 object-contain shrink-0 rounded-sm" />
                      ) : (
                        <span className="text-sm shrink-0">🏆</span>
                      )}
                      <span className="text-[14px] font-semibold leading-[1.5] truncate flex-1 text-left">
                        {subcat.name}
                      </span>
                    </div>

                    <ChevronRight
                      className={`h-4 w-4 shrink-0 transition-transform ${
                        isSelected ? 'text-black' : 'text-slate-400 dark:text-zinc-400 group-hover:translate-x-0.5'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          )}

        </aside>

        {/* RIGHT MAIN CONTENT AREA */}
        <main className="flex-1 space-y-6 min-w-0">

          {/* MOBILE ONLY: LATEST 10 LIVE MATCHES AUTO-SLIDING CAROUSEL */}
          <MobileLiveSlider matches={matches} />

          {/* FEATURED MATCH BANNER (DESKTOP / TABLET ONLY - HIDDEN ON MOBILE) */}
          {featuredMatch && (() => {
            const heroCatSlug = slugify(featuredMatch.categoryName || 'sport');
            const heroSubSlug = slugify(featuredMatch.subcategoryName || 'all');
            const heroMatchSlug = featuredMatch.slug || String(featuredMatch.id);
            const heroTargetLink = featuredMatch.referralLink || `/${heroCatSlug}/${heroSubSlug}/${heroMatchSlug}`;
            const isHeroExternal = !!featuredMatch.referralLink;

            const HeroWrapper = ({ children }: { children: React.ReactNode }) => {
              if (isHeroExternal) {
                return (
                  <a
                    href={heroTargetLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hidden sm:block relative overflow-hidden rounded-2xl border border-[var(--border-glass)] bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 shadow-2xl min-h-[220px] flex items-center justify-center p-6 text-white group cursor-pointer hover:border-[#F8C831]/50 transition-all"
                  >
                    {children}
                  </a>
                );
              }
              return (
                <Link
                  href={heroTargetLink}
                  className="hidden sm:block relative overflow-hidden rounded-2xl border border-[var(--border-glass)] bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 shadow-2xl min-h-[220px] flex items-center justify-center p-6 text-white group cursor-pointer hover:border-[#F8C831]/50 transition-all"
                >
                  {children}
                </Link>
              );
            };

            return (
              <HeroWrapper>
                {/* Stadium / Match Player background overlay */}
                <div
                  className="absolute inset-0 opacity-40 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                  style={{
                    backgroundImage: `url(${featuredMatch.playerImage ||
                      featuredMatch.bgImage ||
                      featuredMatch.categoryPlayerImage ||
                      featuredMatch.categoryThumbUrl ||
                      'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80'
                      })`,
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />

                <div className="relative z-10 w-full flex flex-col items-center text-center space-y-3.5">

                  {/* Status Badge */}
                  <span className="inline-flex items-center gap-1.5 text-xs font-black text-white px-3.5 py-1 bg-[#40b857] rounded-full shadow-lg">
                    <span className="h-2 w-2 rounded-full  bg-white animate-ping" />
                    {featuredMatch.status === 'live' ? 'Featured Live Event' : 'Upcoming Highlight'}
                  </span>

                  {/* Teams vs Banner or Title Event Banner */}
                  {featuredMatch.matchType === 'team_vs_team' && (featuredMatch.homeTeam || featuredMatch.awayTeam) ? (
                    <div className="flex items-center justify-center gap-4 sm:gap-8 w-full">
                      <div className="flex items-center gap-2.5">
                        <span className="text-base sm:text-2xl font-black text-white">{featuredMatch.homeTeam || 'Home Team'}</span>
                        {featuredMatch.homeTeamLogo && (
                          <img src={featuredMatch.homeTeamLogo} alt="" className="h-8 w-8 sm:h-12 sm:w-12 object-contain drop-shadow-md" />
                        )}
                      </div>

                      <div className="px-4 py-1.5 bg-black/60 rounded-xl font-mono text-base sm:text-lg font-black text-[#F8C831] border border-white/10 shadow-inner">
                        {featuredMatch.homeScore !== null && featuredMatch.awayScore !== null
                          ? `${featuredMatch.homeScore} - ${featuredMatch.awayScore}`
                          : 'VS'}
                      </div>

                      <div className="flex items-center gap-2.5">
                        {featuredMatch.awayTeamLogo && (
                          <img src={featuredMatch.awayTeamLogo} alt="" className="h-8 w-8 sm:h-12 sm:w-12 object-contain drop-shadow-md" />
                        )}
                        <span className="text-base sm:text-2xl font-black text-white">{featuredMatch.awayTeam || 'Away Team'}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center space-y-2 py-1 max-w-2xl mx-auto">
                      <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#F8C831]/20 border border-[#F8C831]/40 text-[#F8C831] text-xs font-black uppercase tracking-wider">
                        <span>🏆</span>
                        <span>{featuredMatch.subcategoryName || featuredMatch.categoryName || 'Special Live Event'}</span>
                      </div>
                      <h2 className="text-xl sm:text-3xl font-black text-white tracking-tight drop-shadow-md">
                        {featuredMatch.title || 'Live Stream Highlight Event'}
                      </h2>
                    </div>
                  )}

                  {/* TIME & WATCH STREAM BUTTON */}
                  <div className="flex flex-wrap items-center justify-center gap-4 pt-1">
                    <span className="text-xs font-extrabold text-amber-300 font-mono">
                      {featuredMatch.matchTime ? new Date(featuredMatch.matchTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : ''} - {featuredMatch.subcategoryName || featuredMatch.categoryName || 'Tournament'}
                    </span>

                    {/* EYE-CATCHING WATCH BUTTON */}
                    <span className="inline-flex items-center gap-2 rounded-xl bg-[#F8C831] hover:bg-yellow-400 px-5 py-2 text-xs sm:text-sm font-black text-black shadow-lg transition-transform group-hover:scale-105">
                      <PlayCircle className="h-4 w-4 fill-black text-[#F8C831]" />
                      <span>Watch Stream</span>
                    </span>
                  </div>

                </div>
              </HeroWrapper>
            );
          })()}

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
          ) : uniqueMatches.length === 0 ? (
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

      {/* FOOTER */}
      <Footer />

    </motion.div>
  );
}
