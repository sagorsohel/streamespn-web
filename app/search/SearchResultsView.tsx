'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { MatchCard, MatchItem } from '@/components/home/MatchCard';
import { MatchCardSkeleton } from '@/components/home/MatchCardSkeleton';
import { useLiveScoreSync } from '@/lib/useLiveScoreSync';
import { startTopLoader, stopTopLoader } from '@/components/layout/TopLoadingBar';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  X,
  Radio,
  Clock3,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
  ArrowLeft,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

const POPULAR_SEARCHES = ['Soccer', 'NFL', 'Basketball', 'Baseball', 'Premier League', 'UFC'];

export default function SearchResultsView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawQuery = searchParams.get('q') || searchParams.get('search') || '';

  const [searchInput, setSearchInput] = useState(rawQuery);
  const [activeQuery, setActiveQuery] = useState(rawQuery);
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'all' | 'live' | 'upcoming' | 'finished'>('all');
  const [selectedSport, setSelectedSport] = useState<string>('all');

  // Keep search input synced when URL query changes
  useEffect(() => {
    setSearchInput(rawQuery);
    setActiveQuery(rawQuery);
  }, [rawQuery]);

  // Fetch search results
  useEffect(() => {
    let isCancelled = false;

    const fetchSearchResults = async () => {
      setLoading(true);
      startTopLoader();

      try {
        const queryTerm = activeQuery.trim();
        let fetchedList: MatchItem[] = [];

        // 1. Try search endpoint with q/search param
        try {
          const res = await api.get('/matches', {
            params: {
              search: queryTerm || undefined,
              q: queryTerm || undefined,
              all: 'true',
              limit: 500,
            },
          });
          if (res.data?.success && Array.isArray(res.data.data?.matches)) {
            fetchedList = res.data.data.matches;
          }
        } catch (apiErr) {
          // If endpoint fails, fallback to fetching all matches
        }

        // 2. If query was supplied and remote backend did not filter (or returned empty/fallback)
        // Perform exhaustive client-side inclusion check across all relevant match fields
        if (queryTerm) {
          const term = queryTerm.toLowerCase();
          const words = term.split(/\s+/).filter(Boolean);

          const matchesSearch = (m: MatchItem) => {
            const h = (m.homeTeam || '').toLowerCase();
            const a = (m.awayTeam || '').toLowerCase();
            const t = (m.title || '').toLowerCase();
            const c = (m.categoryName || '').toLowerCase();
            const s = (m.subcategoryName || '').toLowerCase();

            // Direct substring match across visible teams, titles, and leagues
            if (
              h.includes(term) ||
              a.includes(term) ||
              t.includes(term) ||
              c.includes(term) ||
              s.includes(term)
            ) {
              return true;
            }

            // Word-by-word match for multi-word queries (e.g. "Real Madrid")
            if (words.length > 1) {
              return words.every(
                (w) =>
                  h.includes(w) ||
                  a.includes(w) ||
                  t.includes(w) ||
                  c.includes(w) ||
                  s.includes(w)
              );
            }

            return false;
          };

          // If fetchedList is already filtered by backend, verify; otherwise, fetch full list and filter
          if (fetchedList.length === 0 || !fetchedList.some(matchesSearch)) {
            try {
              const allRes = await api.get('/matches?all=true&limit=1000');
              if (allRes.data?.success && Array.isArray(allRes.data.data?.matches)) {
                fetchedList = allRes.data.data.matches.filter(matchesSearch);
              }
            } catch (err) {}
          } else {
            fetchedList = fetchedList.filter(matchesSearch);
          }
        }

        if (!isCancelled) {
          setMatches(fetchedList);
        }
      } catch (err) {
        if (!isCancelled) setMatches([]);
      } finally {
        if (!isCancelled) {
          setLoading(false);
          stopTopLoader();
        }
      }
    };

    fetchSearchResults();

    return () => {
      isCancelled = true;
      stopTopLoader();
    };
  }, [activeQuery]);

  // Keep live scores updated seamlessly
  useLiveScoreSync(matches, setMatches);

  // Trigger search on submit or click
  const handleExecuteSearch = (termToUse?: string) => {
    const q = (termToUse !== undefined ? termToUse : searchInput).trim();
    if (!q) {
      router.push('/search');
      return;
    }
    startTopLoader();
    router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  // Distinct sports available in this search result set
  const availableSports = useMemo(() => {
    const sportCounts: { [sport: string]: number } = {};
    matches.forEach((m) => {
      const sport = m.categoryName || 'Other';
      sportCounts[sport] = (sportCounts[sport] || 0) + 1;
    });
    return Object.entries(sportCounts).sort((a, b) => b[1] - a[1]);
  }, [matches]);

  // Filtered by sport
  const sportFilteredMatches = useMemo(() => {
    if (selectedSport === 'all') return matches;
    return matches.filter((m) => (m.categoryName || 'Other').toLowerCase() === selectedSport.toLowerCase());
  }, [matches, selectedSport]);

  // Partitioned by status
  const liveMatches = useMemo(() => {
    return sportFilteredMatches.filter((m) => m.status === 'live');
  }, [sportFilteredMatches]);

  const upcomingMatches = useMemo(() => {
    return sportFilteredMatches.filter((m) => m.status === 'upcoming');
  }, [sportFilteredMatches]);

  const finishedMatches = useMemo(() => {
    return sportFilteredMatches.filter((m) => m.status === 'finished');
  }, [sportFilteredMatches]);

  const displayedMatches = useMemo(() => {
    if (activeTab === 'live') return liveMatches;
    if (activeTab === 'upcoming') return upcomingMatches;
    if (activeTab === 'finished') return finishedMatches;
    // 'all': live first, then upcoming, then finished
    return [...liveMatches, ...upcomingMatches, ...finishedMatches];
  }, [activeTab, liveMatches, upcomingMatches, finishedMatches]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-4 pb-16 flex-1 w-full">
      {/* 1. TOP BREADCRUMB & HEADER */}
      <div className="mb-6 space-y-4">
        {/* <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-muted)]">
          <Link href="/" className="hover:text-[var(--text-white)] transition-colors flex items-center gap-1">
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Home</span>
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-[var(--text-white)]">Search</span>
          {activeQuery && (
            <>
              <ChevronRight className="h-3 w-3" />
              <span className="text-[#F8C831] font-bold truncate max-w-[200px]">
                &quot;{activeQuery}&quot;
              </span>
            </>
          )}
        </div> */}

        {/* SEARCH BAR BOX */}
       
      </div>

      {/* 2. RESULTS SUMMARY & FILTERS BAR */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border-glass)] pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[var(--text-white)] tracking-tight flex items-center gap-2">
            <span>Search Results</span>
            {!loading && (
              <span className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-[#F8C831]/10 text-[#F8C831] border border-[#F8C831]/20">
                {sportFilteredMatches.length} {sportFilteredMatches.length === 1 ? 'match' : 'matches'}
              </span>
            )}
          </h1>
          {activeQuery ? (
            <p className="text-xs text-[var(--text-muted)] mt-1 font-medium">
              Showing all matches related to &quot;<span className="text-[var(--text-white)] font-bold">{activeQuery}</span>&quot;
            </p>
          ) : (
            <p className="text-xs text-[var(--text-muted)] mt-1 font-medium">
              Showing all available live & upcoming matches
            </p>
          )}
        </div>

        {/* STATUS TABS (ALL / LIVE / UPCOMING / FINISHED) */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 text-xs font-bold shrink-0">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 ${
              activeTab === 'all'
                ? 'bg-[#F8C831] text-black border-[#F8C831] shadow-sm'
                : 'border-[var(--border-glass)] bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-white)]'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>All ({sportFilteredMatches.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('live')}
            className={`px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 ${
              activeTab === 'live'
                ? 'bg-[#40b857] text-white border-[#40b857] shadow-sm'
                : 'border-[var(--border-glass)] bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-white)]'
            }`}
          >
            <Radio className="h-3.5 w-3.5 text-rose-500 animate-pulse" />
            <span>Live ({liveMatches.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('upcoming')}
            className={`px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 ${
              activeTab === 'upcoming'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                : 'border-[var(--border-glass)] bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-white)]'
            }`}
          >
            <Clock3 className="h-3.5 w-3.5" />
            <span>Upcoming ({upcomingMatches.length})</span>
          </button>

         
        </div>
      </div>

      {/* 3. SPORT CATEGORY SUB-FILTERS (IF MULTIPLE SPORTS FOUND) */}
      {availableSports.length > 1 && (
        <div className="mb-6 flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          <span className="text-xs font-bold text-[var(--text-muted)] mr-1 shrink-0">Filter Sport:</span>
          <button
            onClick={() => setSelectedSport('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0 ${
              selectedSport === 'all'
                ? 'bg-[#F8C831] text-black shadow-sm'
                : 'bg-[var(--bg-card)] text-[var(--text-muted)] border border-[var(--border-glass)] hover:text-[var(--text-white)]'
            }`}
          >
            All Sports ({matches.length})
          </button>
          {availableSports.map(([sport, count]) => (
            <button
              key={sport}
              onClick={() => setSelectedSport(sport)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0 ${
                selectedSport.toLowerCase() === sport.toLowerCase()
                  ? 'bg-[#F8C831] text-black shadow-sm'
                  : 'bg-[var(--bg-card)] text-[var(--text-muted)] border border-[var(--border-glass)] hover:text-[var(--text-white)]'
              }`}
            >
              {sport} ({count})
            </button>
          ))}
        </div>
      )}

      {/* 4. RESULTS DISPLAY */}
      {loading ? (
        <div className="space-y-2.5">
          {[...Array(6)].map((_, i) => (
            <MatchCardSkeleton key={i} />
          ))}
        </div>
      ) : displayedMatches.length === 0 ? (
        <div className="p-10 text-center rounded-2xl border border-[var(--border-glass)] bg-[var(--bg-card)] shadow-lg space-y-4 max-w-xl mx-auto my-8">
          <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/20 text-[#F8C831] flex items-center justify-center mx-auto text-2xl">
            <Search className="h-7 w-7" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[var(--text-white)]">No matches found</h3>
            <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1.5">
              {activeQuery
                ? `We couldn't find any events matching "${activeQuery}". Try checking the spelling or searching for a different team or sport.`
                : 'Type a team name or sport in the search box above to find live scores and upcoming fixtures.'}
            </p>
          </div>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            {activeQuery && (
              <button
                onClick={() => {
                  setSearchInput('');
                  setActiveQuery('');
                  router.push('/search');
                }}
                className="px-4 py-2 rounded-xl border border-[var(--border-glass)] bg-[var(--bg-main)] text-xs font-bold text-[var(--text-white)] hover:border-[#F8C831] transition-all"
              >
                Clear Search
              </button>
            )}
            <Link
              href="/"
              className="px-5 py-2 rounded-xl bg-[#F8C831] hover:bg-yellow-400 text-xs font-black text-black shadow-md transition-all"
            >
              Browse All Matches
            </Link>
          </div>
        </div>
      ) : (
        <motion.div
          key={activeQuery + activeTab + selectedSport}
          initial={{ opacity: 0.5, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-3"
        >
          {displayedMatches.map((m) => (
            <MatchCard key={m.id} match={m} />
          ))}
        </motion.div>
      )}
    </div>
  );
}
