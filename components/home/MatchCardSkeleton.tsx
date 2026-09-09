'use client';

import React from 'react';

export const MatchCardSkeleton: React.FC = () => {
  return (
    <div className="rounded-xl border border-[var(--border-glass)] bg-[var(--bg-card)] px-3.5 sm:px-5 py-3 animate-pulse">
      
      {/* 1. MOBILE SKELETON (EXACT 2-ROW LAYOUT OF MOBILE MATCHCARD) */}
      <div className="flex sm:hidden flex-col gap-2 w-full">
        {/* Top Row: League Logo + League Name & Status/Time Pill */}
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="h-4 w-4 rounded-full bg-slate-300 dark:bg-zinc-800 shrink-0" />
            <div className="h-3 w-28 rounded bg-slate-300 dark:bg-zinc-800" />
          </div>
          <div className="h-4 w-20 rounded-full bg-slate-300 dark:bg-zinc-800 shrink-0" />
        </div>

        {/* Bottom Row: Home Team (Right) + VS + Away Team (Left) */}
        <div className="flex items-center justify-center gap-1.5 w-full py-0.5">
          <div className="h-3.5 w-24 rounded bg-slate-300 dark:bg-zinc-800 flex-1" />
          <div className="h-6 w-6 rounded-full bg-slate-300 dark:bg-zinc-800 shrink-0" />
          <div className="h-3 w-4 rounded bg-slate-300 dark:bg-zinc-800 shrink-0 mx-0.5" />
          <div className="h-6 w-6 rounded-full bg-slate-300 dark:bg-zinc-800 shrink-0" />
          <div className="h-3.5 w-24 rounded bg-slate-300 dark:bg-zinc-800 flex-1" />
        </div>
      </div>

      {/* 2. DESKTOP SKELETON (EXACT 3-COLUMN LAYOUT OF DESKTOP MATCHCARD) */}
      <div className="hidden sm:flex items-center justify-between w-full">
        {/* Left Column: League Logo + Time/Status + League Name */}
        <div className="flex items-center gap-3 w-[170px] xs:w-[210px] sm:w-[250px] shrink-0 min-w-0">
          <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-slate-300 dark:bg-zinc-800 shrink-0" />
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="h-3 w-24 rounded bg-slate-300 dark:bg-zinc-800" />
            <div className="h-3.5 w-32 rounded bg-slate-300 dark:bg-zinc-800" />
          </div>
        </div>

        {/* Center Column: Teams & VS / Score Box */}
        <div className="flex-1 flex items-center justify-center min-w-0 px-2 sm:px-4">
          <div className="w-full flex items-center justify-center max-w-xl gap-2">
            <div className="h-4 w-28 rounded bg-slate-300 dark:bg-zinc-800 flex-1" />
            <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-slate-300 dark:bg-zinc-800 shrink-0" />
            <div className="h-4 w-10 rounded bg-slate-300 dark:bg-zinc-800 shrink-0 mx-2" />
            <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-slate-300 dark:bg-zinc-800 shrink-0" />
            <div className="h-4 w-28 rounded bg-slate-300 dark:bg-zinc-800 flex-1" />
          </div>
        </div>

        {/* Right Column: Watch / Live Action Pill Button */}
        <div className="shrink-0 w-[85px] sm:w-[105px] flex justify-end">
          <div className="h-7 sm:h-8 w-16 sm:w-20 rounded-full bg-slate-300 dark:bg-zinc-800" />
        </div>
      </div>

    </div>
  );
};
