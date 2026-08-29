'use client';

import React from 'react';

export const MatchCardSkeleton: React.FC = () => {
  return (
    <div className="rounded-xl border border-[var(--border-glass)] bg-[var(--bg-card)] px-3.5 sm:px-5 py-3 animate-pulse">
      
      {/* MOBILE SKELETON (2-ROW LAYOUT - MATCHES SCREENSHOT 1, 2, 3) */}
      <div className="flex sm:hidden flex-col gap-2 w-full">
        {/* Top Row: League Logo + League Name & Status Pill */}
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded-full bg-slate-300 dark:bg-zinc-800" />
            <div className="h-3 w-24 rounded bg-slate-300 dark:bg-zinc-800" />
          </div>
          <div className="h-5 w-16 rounded-full bg-slate-300 dark:bg-zinc-800" />
        </div>

        {/* Bottom Row: Teams vs Teams Centered */}
        <div className="flex items-center justify-center gap-2 py-1">
          <div className="h-3.5 w-20 rounded bg-slate-300 dark:bg-zinc-800" />
          <div className="h-5 w-5 rounded-full bg-slate-300 dark:bg-zinc-800" />
          <div className="h-3 w-4 rounded bg-slate-300 dark:bg-zinc-800" />
          <div className="h-5 w-5 rounded-full bg-slate-300 dark:bg-zinc-800" />
          <div className="h-3.5 w-20 rounded bg-slate-300 dark:bg-zinc-800" />
        </div>
      </div>

      {/* DESKTOP SKELETON (3-COLUMN HORIZONTAL ROW LAYOUT) */}
      <div className="hidden sm:flex items-center justify-between w-full">
        {/* Left Column: Logo + Status + League */}
        <div className="flex items-center gap-3 w-[200px]">
          <div className="h-8 w-8 rounded-full bg-slate-300 dark:bg-zinc-800 shrink-0" />
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="h-3 w-16 rounded bg-slate-300 dark:bg-zinc-800" />
            <div className="h-3.5 w-28 rounded bg-slate-300 dark:bg-zinc-800" />
          </div>
        </div>

        {/* Center Column: Teams & VS */}
        <div className="flex-1 flex items-center justify-center gap-4 px-4">
          <div className="h-3.5 w-28 rounded bg-slate-300 dark:bg-zinc-800" />
          <div className="h-7 w-7 rounded-full bg-slate-300 dark:bg-zinc-800 shrink-0" />
          <div className="h-4 w-10 rounded bg-slate-300 dark:bg-zinc-800 shrink-0" />
          <div className="h-7 w-7 rounded-full bg-slate-300 dark:bg-zinc-800 shrink-0" />
          <div className="h-3.5 w-28 rounded bg-slate-300 dark:bg-zinc-800" />
        </div>

        {/* Right Column: Action Button */}
        <div className="w-[100px] flex justify-end shrink-0">
          <div className="h-8 w-20 rounded-full bg-slate-300 dark:bg-zinc-800" />
        </div>
      </div>

    </div>
  );
};
