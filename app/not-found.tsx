'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import { MatchCard, MatchItem } from '@/components/home/MatchCard';
import { Radio, Home, Sparkles, Tv, Flame } from 'lucide-react';

export default function NotFound() {
  const [liveEvents, setLiveEvents] = useState<MatchItem[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<MatchItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    const fetchNotFoundEvents = async () => {
      try {
        const res = await api.get('/matches?limit=40');
        if (isMounted && res.data?.success && Array.isArray(res.data?.data?.matches)) {
          const allMatches: MatchItem[] = res.data.data.matches.filter(
            (m: MatchItem) => m.status !== 'finished'
          );

          // 1. Live Events
          const live = allMatches.filter((m) => m.status === 'live');

          // 2. Today's Upcoming Matches (Randomized)
          const upcoming = allMatches.filter((m) => m.status === 'upcoming');

          // Shuffle upcoming matches randomly on each 404 page load
          const shuffledUpcoming = [...upcoming].sort(() => 0.5 - Math.random());

          setLiveEvents(live);
          setUpcomingEvents(shuffledUpcoming.slice(0, 6));
        }
      } catch (err) {
        // fallback ignore
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchNotFoundEvents();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-6 pb-16 flex-1 w-full space-y-10">
      {/* 1. HERO 404 BANNER */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1.0] }}
        className="relative overflow-hidden rounded-3xl border border-[var(--border-glass)] bg-[var(--bg-card)] p-8 sm:p-12 text-center space-y-6 mx-auto max-w-3xl"
      >
        {/* Glow backdrop effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#F8C831]/10 via-amber-500/5 to-transparent pointer-events-none" />
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 h-48 w-96 rounded-full bg-[#F8C831]/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full bg-[#F8C831]/10 border border-[#F8C831]/25 px-4 py-1 text-xs font-black text-[#F8C831] uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5" />
            <span>404 - Page Not Found</span>
          </div>

          {/* Big Graphic 404 */}
          <div className="flex items-center justify-center gap-2 text-6xl sm:text-8xl font-black text-[var(--text-white)] tracking-tighter">
            <span>4</span>
            <div className="h-14 w-14 sm:h-20 sm:w-20 rounded-full border-4 border-[#F8C831] bg-[#F8C831]/20 flex items-center justify-center text-3xl sm:text-4xl shadow-[0_0_30px_rgba(248,200,49,0.3)]">
              ⚽
            </div>
            <span>4</span>
          </div>

          {/* Heading & Subtext */}
          <h1 className="text-xl sm:text-3xl font-black text-[var(--text-white)] tracking-tight">
            Offside! Page Couldn't Be Found
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] max-w-md mx-auto leading-relaxed">
            The page or stream you are looking for might have been moved, renamed, or is no longer available.
          </p>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-xl bg-[#F8C831] hover:bg-yellow-400 text-black font-black text-xs sm:text-sm px-6 py-3 shadow-lg shadow-yellow-500/20 transition-all transform hover:scale-105 active:scale-95 cursor-pointer uppercase tracking-wider"
            >
              <Home className="h-4 w-4" />
              <span>Back to Home</span>
            </Link>
          </div>
        </div>
      </motion.div>

      {/* 2. LIVE EVENTS SECTION (IF ANY LIVE MATCHES EXIST) */}
      {liveEvents.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--border-glass)] pb-3">
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
                <Flame className="h-4 w-4 animate-pulse" />
              </div>
              <h2 className="text-base sm:text-xl font-black text-[var(--text-white)] tracking-wide flex items-center gap-2">
                <span>Live Events Now</span>
                <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              </h2>
            </div>
            <span className="text-xs font-extrabold text-red-400 bg-red-500/10 px-2.5 py-0.5 rounded-full border border-red-500/20">
              {liveEvents.length} LIVE
            </span>
          </div>

          <div className="space-y-2.5">
            {liveEvents.map((match, idx) => (
              <motion.div
                key={match.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: Math.min(idx * 0.04, 0.2) }}
              >
                <MatchCard match={match} />
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* 3. RANDOM UPCOMING MATCHES SECTION */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--border-glass)] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-[#F8C831]/10 border border-[#F8C831]/20 flex items-center justify-center text-[#F8C831]">
              <Radio className="h-4 w-4" />
            </div>
            <h2 className="text-base sm:text-xl font-black text-[var(--text-white)] tracking-wide">
              Upcoming Events
            </h2>
          </div>
          <Link
            href="/"
            className="text-xs font-extrabold text-[#F8C831] hover:underline flex items-center gap-1"
          >
            <span>View All Schedule</span> →
          </Link>
        </div>

        {/* Matches Grid / List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 w-full rounded-2xl bg-slate-300 dark:bg-zinc-800 animate-pulse" />
            ))}
          </div>
        ) : upcomingEvents.length > 0 ? (
          <div className="space-y-2.5">
            {upcomingEvents.map((match, idx) => (
              <motion.div
                key={match.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: Math.min(idx * 0.04, 0.2) }}
              >
                <MatchCard match={match} />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center border border-[var(--border-glass)] rounded-2xl bg-[var(--bg-card)] text-xs text-[var(--text-muted)] space-y-2">
            <Tv className="h-8 w-8 mx-auto text-[var(--text-muted)] opacity-50" />
            <p className="font-semibold">Check out live streams on our homepage.</p>
          </div>
        )}
      </div>
    </div>
  );
}
