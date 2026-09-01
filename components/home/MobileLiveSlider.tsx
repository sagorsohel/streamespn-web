'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { MatchItem } from './MatchCard';
import { Radio } from 'lucide-react';

interface MobileLiveSliderProps {
  matches: MatchItem[];
}

export const MobileLiveSlider: React.FC<MobileLiveSliderProps> = ({ matches }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Take up to 10 live matches (or top featured matches)
  const sliderMatches = matches.slice(0, 10);

  // Auto-slide effect every 3.5 seconds
  useEffect(() => {
    if (sliderMatches.length <= 1) return;

    const interval = setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % sliderMatches.length;
        if (scrollRef.current) {
          const cardWidth = scrollRef.current.firstElementChild?.clientWidth || 290;
          scrollRef.current.scrollTo({
            left: next * (cardWidth + 16),
            behavior: 'smooth',
          });
        }
        return next;
      });
    }, 3500);

    return () => clearInterval(interval);
  }, [sliderMatches.length]);

  if (sliderMatches.length === 0) return null;

  return (
    <div className="block lg:hidden space-y-3 pt-2 mb-6">

      {/* HEADER TITLE */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Radio className="h-4 w-4 text-[#40b857] animate-pulse" />
          <h2 className="text-base font-black text-[var(--text-white)]">
            Live Event
          </h2>
        </div>
        <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
          {sliderMatches.length} Live
        </span>
      </div>

      {/* SWIPEABLE & AUTO-SLIDING CAROUSEL CONTAINER */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory no-scrollbar py-1 px-1 scroll-smooth"
        onScroll={(e) => {
          const target = e.currentTarget;
          const cardWidth = target.firstElementChild?.clientWidth || 290;
          const index = Math.round(target.scrollLeft / (cardWidth + 16));
          if (index !== activeIndex && index >= 0 && index < sliderMatches.length) {
            setActiveIndex(index);
          }
        }}
      >
        {sliderMatches.map((m) => {
          const targetLink = m.referralLink || `/match/${m.slug || m.id}`;
          const isExternal = !!m.referralLink;

          const CardContent = (
            <div className="relative w-[290px] xs:w-[320px] shrink-0 snap-center rounded-[24px] bg-gradient-to-br from-[#37003c] via-[#2d0032] to-[#1a001d] text-white p-4.5 shadow-xl border border-purple-500/30 overflow-hidden group">

              {/* Subtle background emblem pattern */}
              <div className="absolute -right-6 -bottom-6 opacity-10 pointer-events-none">
                <img src={m.subcategoryLogo || m.categoryLogo || 'https://r2.thesportsdb.com/images/media/league/badge/57662.png'} alt="" loading="lazy" decoding="async" className="w-36 h-36 object-contain" />
              </div>

              {/* TOP HEADER INSIDE CARD: Tournament Name & Subtitle */}
              <div className="text-center space-y-0.5 mb-3.5 relative z-10">
                <h3 className="text-xs font-black tracking-wider text-purple-100 uppercase truncate px-2">
                  {m.subcategoryName || m.categoryName || m.title || 'Live Event'}
                </h3>
                <p className="text-[10px] font-semibold text-purple-300/70 truncate">
                  {m.venue || 'Mohegan Sun Arena'}
                </p>
              </div>

              {/* CENTER AREA: TEAMS & SCORE OR TITLE EVENT */}
              {m.matchType === 'team_vs_team' && (m.homeTeam || m.awayTeam) ? (
                <div className="flex items-center justify-between relative z-10 px-1 gap-2">
                  {/* HOME TEAM */}
                  <div className="flex flex-col items-center text-center flex-1 min-w-0 max-w-[105px] xs:max-w-[115px]">
                    <div className="h-11 w-11 sm:h-12 sm:w-12 flex items-center justify-center mb-1">
                      {m.homeTeamLogo ? (
                        <img src={m.homeTeamLogo} alt="" loading="lazy" decoding="async" className="max-h-full max-w-full object-contain drop-shadow-md" />
                      ) : (
                        <span className="text-2xl">🛡️</span>
                      )}
                    </div>
                    <span className="text-xs font-black text-white text-center leading-tight line-clamp-2 w-full drop-shadow">
                      {m.homeTeam || 'Home Team'}
                    </span>
                  </div>

                  {/* CENTER SCORE & LIVE MINUTE BADGE */}
                  <div className="flex flex-col items-center justify-center shrink-0 min-w-[70px] px-1">
                    <span className="text-2xl xs:text-3xl font-black tracking-wider text-[#F8C831] font-sans whitespace-nowrap leading-none mb-1.5 drop-shadow-md">
                      {m.homeScore ?? 0} : {m.awayScore ?? 0}
                    </span>
                    <span className="inline-flex items-center gap-1.5 bg-purple-900/90 text-purple-100 border border-purple-400/40 text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-lg whitespace-nowrap">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      LIVE
                    </span>
                  </div>

                  {/* AWAY TEAM */}
                  <div className="flex flex-col items-center text-center flex-1 min-w-0 max-w-[105px] xs:max-w-[115px]">
                    <div className="h-11 w-11 sm:h-12 sm:w-12 flex items-center justify-center mb-1">
                      {m.awayTeamLogo ? (
                        <img src={m.awayTeamLogo} alt="" loading="lazy" decoding="async" className="max-h-full max-w-full object-contain drop-shadow-md" />
                      ) : (
                        <span className="text-2xl">🛡️</span>
                      )}
                    </div>
                    <span className="text-xs font-black text-white text-center leading-tight line-clamp-2 w-full drop-shadow">
                      {m.awayTeam || 'Away Team'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center relative z-10 py-2 space-y-2">
                  <h4 className="text-sm font-black text-white px-3 py-1.5 bg-purple-900/80 rounded-xl border border-purple-400/30 truncate max-w-full">
                    {m.title || 'Live Stream Highlight Event'}
                  </h4>
                  <span className="inline-flex items-center gap-1.5 bg-purple-900/90 text-purple-100 border border-purple-400/40 text-[10px] font-bold px-3 py-1 rounded-full shadow-lg whitespace-nowrap">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    LIVE
                  </span>
                </div>
              )}

            </div>
          );

          return isExternal ? (
            <a key={m.id} href={targetLink} target="_blank" rel="noopener noreferrer" className="block">
              {CardContent}
            </a>
          ) : (
            <Link key={m.id} href={targetLink} className="block">
              {CardContent}
            </Link>
          );
        })}
      </div>

      {/* PAGINATION INDICATOR DOTS */}
      {sliderMatches.length > 1 && (
        <div className="flex justify-center items-center gap-1.5 pt-1">
          {sliderMatches.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                setActiveIndex(i);
                if (scrollRef.current) {
                  const cardWidth = scrollRef.current.firstElementChild?.clientWidth || 290;
                  scrollRef.current.scrollTo({
                    left: i * (cardWidth + 16),
                    behavior: 'smooth',
                  });
                }
              }}
              className={`h-1.5 rounded-full transition-all duration-300 ${activeIndex === i ? 'w-5 bg-[#40b857]' : 'w-1.5 bg-slate-300 dark:bg-zinc-700'
                }`}
            />
          ))}
        </div>
      )}

    </div>
  );
};
