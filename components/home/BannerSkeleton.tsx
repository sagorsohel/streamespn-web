'use client';

import React from 'react';

export const BannerSkeleton: React.FC = () => {
  return (
    <>
      {/* MOBILE SKELETON: MATCHES THE MOBILE CARD SLIDER (MobileLiveSlider) */}
      <div className="block md:hidden space-y-3 pt-2 mb-6 animate-pulse">
        {/* Header Title Skeleton */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded-full bg-slate-300 dark:bg-zinc-800" />
            <div className="h-4 w-28 rounded-md bg-slate-300 dark:bg-zinc-800" />
          </div>
          <div className="h-5 w-16 rounded-full bg-slate-300 dark:bg-zinc-800" />
        </div>

        {/* Swipeable Card Skeleton (Cards matching MobileLiveSlider) */}
        <div className="flex gap-4 overflow-hidden py-1 px-1">
          {[1, 2].map((item) => (
            <div
              key={item}
              className="w-[290px] xs:w-[320px] shrink-0 rounded-[24px] bg-[var(--bg-card)] border border-[var(--border-glass)] p-4.5 shadow-xl space-y-4"
            >
              {/* Top League Title & Venue Skeleton */}
              <div className="flex flex-col items-center space-y-1.5">
                <div className="h-3 w-32 rounded bg-slate-300 dark:bg-zinc-800" />
                <div className="h-2.5 w-20 rounded bg-slate-300 dark:bg-zinc-800" />
              </div>

              {/* Center Matchup: Team 1 - Score - Team 2 */}
              <div className="flex items-center justify-between px-1 gap-2 pt-1">
                <div className="flex flex-col items-center space-y-1.5 flex-1">
                  <div className="h-11 w-11 rounded-full bg-slate-300 dark:bg-zinc-800" />
                  <div className="h-3 w-16 rounded bg-slate-300 dark:bg-zinc-800" />
                </div>

                <div className="flex flex-col items-center space-y-1.5 shrink-0 px-2">
                  <div className="h-6 w-14 rounded bg-slate-300 dark:bg-zinc-800" />
                  <div className="h-4 w-12 rounded-full bg-slate-300 dark:bg-zinc-800" />
                </div>

                <div className="flex flex-col items-center space-y-1.5 flex-1">
                  <div className="h-11 w-11 rounded-full bg-slate-300 dark:bg-zinc-800" />
                  <div className="h-3 w-16 rounded bg-slate-300 dark:bg-zinc-800" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination Dots Skeleton */}
        <div className="flex justify-center items-center gap-1.5 pt-1">
          <div className="h-1.5 w-5 rounded-full bg-[#F8C831]/40" />
          <div className="h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-zinc-800" />
          <div className="h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-zinc-800" />
        </div>
      </div>

      {/* DESKTOP SKELETON: MATCHES THE FULL-WIDTH HERO BANNER (HeroBannerCarousel) */}
      <div className="hidden md:block w-full mb-6 animate-pulse">
        <div className="w-full rounded-2xl border border-[var(--border-glass)] bg-[var(--bg-card)] shadow-2xl min-h-[220px] p-6 flex flex-col items-center justify-between">
          {/* Top Badge Skeleton */}
          <div className="h-6 w-36 rounded-full bg-slate-300 dark:bg-zinc-800" />

          {/* Center Teams Matchup Skeleton */}
          <div className="flex items-center justify-center gap-6 sm:gap-10 w-full py-4">
            {/* Team 1 */}
            <div className="flex items-center gap-3">
              <div className="h-6 w-28 rounded bg-slate-300 dark:bg-zinc-800" />
              <div className="h-12 w-12 rounded-full bg-slate-300 dark:bg-zinc-800" />
            </div>

            {/* VS Box */}
            <div className="h-10 w-16 rounded-xl bg-slate-300 dark:bg-zinc-800" />

            {/* Team 2 */}
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-slate-300 dark:bg-zinc-800" />
              <div className="h-6 w-28 rounded bg-slate-300 dark:bg-zinc-800" />
            </div>
          </div>

          {/* Bottom Time & Button Skeleton */}
          <div className="flex items-center justify-center gap-4 w-full pt-1">
            <div className="h-4 w-40 rounded bg-slate-300 dark:bg-zinc-800" />
            <div className="h-8 w-32 rounded-full bg-[#F8C831]/40" />
          </div>

          {/* Indicator Dots Skeleton */}
          <div className="flex items-center gap-1.5 pt-3">
            <div className="h-1.5 w-5 rounded-full bg-[#F8C831]/40" />
            <div className="h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-zinc-800" />
            <div className="h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-zinc-800" />
            <div className="h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-zinc-800" />
          </div>
        </div>
      </div>
    </>
  );
};
