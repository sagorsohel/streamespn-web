'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { PlayCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { slugify } from '@/lib/utils';
import { MatchItem } from './MatchCard';

interface HeroBannerCarouselProps {
  matches: MatchItem[];
}

export const HeroBannerCarousel: React.FC<HeroBannerCarouselProps> = ({ matches }) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const total = matches.length;

  // Auto-slide every 5 seconds if not hovered and more than 1 match
  useEffect(() => {
    if (total <= 1 || isHovered) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % total);
    }, 5000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [total, isHovered]);

  if (!matches || matches.length === 0) return null;

  const currentMatch = matches[currentIndex] || matches[0];

  const catSlug = slugify(currentMatch.categoryName || 'sport');
  const subSlug = slugify(currentMatch.subcategoryName || 'all');
  const matchSlug = currentMatch.slug || String(currentMatch.id);
  const targetLink = `/${catSlug}/${subSlug}/${matchSlug}`;

  const subcatLogo =
    currentMatch.subcategoryLogo &&
    !currentMatch.subcategoryLogo.includes('/event/poster/') &&
    !currentMatch.subcategoryLogo.includes('/event/thumb/')
      ? currentMatch.subcategoryLogo
      : currentMatch.categoryLogo || null;

  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % total);
  };

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="hidden md:block w-full mb-6 relative group"
    >
      <Link
        href={targetLink}
        className="block w-full relative overflow-hidden rounded-2xl border border-[var(--border-glass)] bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 shadow-2xl min-h-[220px] p-6 text-white cursor-pointer hover:border-[#F8C831]/50 transition-all"
      >
        {/* Background Image with Smooth Fade */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`bg-${currentMatch.id}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.38 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
            style={{
              backgroundImage: `url(${currentMatch.playerImage ||
                currentMatch.bgImage ||
                currentMatch.categoryPlayerImage ||
                currentMatch.categoryThumbUrl ||
                'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80'
                })`,
            }}
          />
        </AnimatePresence>

        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none" />

        {/* Slide Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`content-${currentMatch.id}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="relative z-10 w-full flex flex-col items-center text-center space-y-3.5"
          >
            {/* Status Badge */}
            <span className="inline-flex items-center gap-1.5 text-xs font-black text-white px-3.5 py-1 bg-[#40b857] rounded-full shadow-lg">
              <span className="h-2 w-2 rounded-full bg-white animate-ping" />
              {currentMatch.status === 'live' ? 'Featured Live Event' : 'Upcoming '}
            </span>

            {/* Teams vs Banner or Title Event Banner */}
            {currentMatch.matchType === 'team_vs_team' && (currentMatch.homeTeam || currentMatch.awayTeam) ? (
              <div className="flex items-center justify-center gap-4 sm:gap-8 w-full">
                <div className="flex items-center gap-2.5">
                  <span className="text-base sm:text-2xl font-black text-white">
                    {currentMatch.homeTeam || 'Home Team'}
                  </span>
                  {currentMatch.homeTeamLogo && (
                    <img
                      src={currentMatch.homeTeamLogo}
                      alt=""
                      className="h-8 w-8 sm:h-12 sm:w-12 object-contain drop-shadow-md"
                    />
                  )}
                </div>

                <div className="px-4 py-1.5 bg-black/60 rounded-xl font-mono text-base sm:text-lg font-black text-[#F8C831] border border-white/10 shadow-inner">
                  {currentMatch.homeScore !== null && currentMatch.awayScore !== null
                    ? `${currentMatch.homeScore} - ${currentMatch.awayScore}`
                    : 'VS'}
                </div>

                <div className="flex items-center gap-2.5">
                  {currentMatch.awayTeamLogo && (
                    <img
                      src={currentMatch.awayTeamLogo}
                      alt=""
                      className="h-8 w-8 sm:h-12 sm:w-12 object-contain drop-shadow-md"
                    />
                  )}
                  <span className="text-base sm:text-2xl font-black text-white">
                    {currentMatch.awayTeam || 'Away Team'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center space-y-2 py-1 max-w-2xl mx-auto">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#F8C831]/20 border border-[#F8C831]/40 text-[#F8C831] text-xs font-black uppercase tracking-wider">
                  {subcatLogo ? (
                    <img src={subcatLogo} alt="" className="h-4 w-4 object-contain" />
                  ) : (
                    <span>🏆</span>
                  )}
                  <span>{currentMatch.subcategoryName || currentMatch.categoryName || 'Special Live Event'}</span>
                </div>
                <h2 className="text-xl sm:text-3xl font-black text-white tracking-tight drop-shadow-md">
                  {currentMatch.title || 'Live Stream Highlight Event'}
                </h2>
              </div>
            )}

            {/* TIME & WATCH STREAM BUTTON */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-1">
              <span className="text-xs font-extrabold text-amber-300 font-mono inline-flex items-center gap-1.5">
                {subcatLogo && (
                  <img src={subcatLogo} alt="" className="h-3.5 w-3.5 object-contain inline-block" />
                )}
                {currentMatch.matchTime
                  ? new Date(currentMatch.matchTime).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                  })
                  : ''}{' '}
                - {currentMatch.subcategoryName || currentMatch.categoryName || 'Tournament'}
              </span>

              {/* EYE-CATCHING WATCH BUTTON */}
              <span className="inline-flex items-center gap-2 rounded-xl bg-[#F8C831] hover:bg-yellow-400 px-5 py-2 text-xs sm:text-sm font-black text-black shadow-lg transition-transform group-hover:scale-105">
                <PlayCircle className="h-4 w-4 fill-black text-[#F8C831]" />
                <span>Watch Stream</span>
              </span>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Carousel Indicators (Dots) */}
        {total > 1 && (
          <div className="absolute bottom-2.5 left-0 right-0 z-20 flex items-center justify-center gap-1.5 pointer-events-auto">
            {matches.map((_, idx) => (
              <button
                key={`dot-${idx}`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setCurrentIndex(idx);
                }}
                className={`transition-all rounded-full ${currentIndex === idx
                    ? 'w-6 h-1.5 bg-[#F8C831]'
                    : 'w-1.5 h-1.5 bg-white/40 hover:bg-white/70'
                  }`}
                title={`Slide ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </Link>

      {/* Navigation Arrows (Prev / Next) */}
      {total > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-30 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 border border-white/10 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 hover:bg-black/80 hover:text-[#F8C831] hover:border-[#F8C831]/50 transition-all shadow-lg"
            title="Previous Match"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-30 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 border border-white/10 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 hover:bg-black/80 hover:text-[#F8C831] hover:border-[#F8C831]/50 transition-all shadow-lg"
            title="Next Match"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}
    </div>
  );
};
