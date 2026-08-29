'use client';

import React from 'react';
import Link from 'next/link';
import { PlayCircle } from 'lucide-react';
import { slugify } from '@/lib/utils';

export interface MatchItem {
  id: number;
  matchType: 'team_vs_team' | 'title_event';
  slug?: string | null;
  title?: string | null;
  homeTeam?: string | null;
  homeTeamLogo?: string | null;
  awayTeam?: string | null;
  awayTeamLogo?: string | null;
  homeScore?: string | null;
  awayScore?: string | null;
  livePeriod?: string | null;
  liveMinute?: string | null;
  matchTime: string;
  status: 'upcoming' | 'live' | 'finished';
  venue?: string | null;
  referralLink?: string | null;
  categoryId?: number | null;
  subcategoryId?: number | null;
  categoryName?: string;
  categoryLogo?: string;
  categoryPlayerImage?: string | null;
  categoryThumbUrl?: string | null;
  categoryReferralLink?: string | null;
  subcategoryName?: string;
  subcategoryLogo?: string;
  playerImage?: string | null;
  bgImage?: string | null;
}

import { formatMatchTime, formatMatchDate, getTimezoneAbbr, formatLiveBadgeText } from '@/lib/timezone';

interface MatchCardProps {
  match: MatchItem;
}

export const MatchCard: React.FC<MatchCardProps> = ({ match }) => {
  const [mounted, setMounted] = React.useState<boolean>(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isLive = match.status === 'live';
  const isFinished = match.status === 'finished';

  const matchDate = match.matchTime ? new Date(match.matchTime) : null;
  const rawTimeFormatted = matchDate ? matchDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : 'TBA';
  const rawDateFormatted = matchDate ? matchDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';

  // Device local timezone formatted strings (evaluates on client device regardless of VPN)
  const timeFormatted = mounted ? formatMatchTime(match.matchTime) : rawTimeFormatted;
  const dateFormatted = mounted ? formatMatchDate(match.matchTime) : rawDateFormatted;
  const tzAbbr = mounted && matchDate ? getTimezoneAbbr(matchDate) : '';

  const catSlug = slugify(match.categoryName || 'sport');
  const subSlug = slugify(match.subcategoryName || 'all');
  const matchSlug = match.slug || String(match.id);
  const targetLink = match.referralLink || `/${catSlug}/${subSlug}/${matchSlug}`;
  const isExternal = !!match.referralLink;

  const RenderCardWrapper = ({ children, className }: { children: React.ReactNode; className: string }) => {
    if (isExternal) {
      return (
        <a href={targetLink} target="_blank" rel="noopener noreferrer" className={className}>
          {children}
        </a>
      );
    }
    return (
      <Link href={targetLink} className={className}>
        {children}
      </Link>
    );
  };

  return (
    <RenderCardWrapper className={`group relative block w-full rounded-[3px] border border-[var(--border-glass)] px-3.5 sm:px-5 py-3 transition-all duration-200 overflow-hidden cursor-pointer hover:border-[#F8C831]/60  ${isLive
      ? 'border-l-2 border-l-[#40b857] bg-[#f2f9f4] dark:bg-emerald-950/20'
      : 'bg-[var(--bg-card)]'
      }`}>

      {/* ========================================================================= */}
      {/* 1. MOBILE VIEW (SCREENSHOT 1, 2, 3 EXACT MATCH FOR MOBILE CARDS)          */}
      {/* ========================================================================= */}
      <div className="flex sm:hidden flex-col gap-2 w-full">

        {/* TOP ROW: LEAGUE INFO ON LEFT & LIVE SCORE PILL / TIME ON RIGHT */}
        <div className="flex items-center justify-between w-full">
          {/* Left: League Logo + League Name */}
          <div className="flex items-center gap-1.5 min-w-0 flex-1 pr-2">
            <div className="h-4 w-4 shrink-0 flex items-center justify-center">
              {match.subcategoryLogo || match.categoryLogo ? (
                <img src={match.subcategoryLogo || match.categoryLogo} alt="" className="max-h-full max-w-full object-contain" />
              ) : (
                <span className="text-[10px]">🏆</span>
              )}
            </div>
            <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 truncate">
              {match.subcategoryName || match.categoryName || match.title || 'League'}
            </span>
          </div>

          {/* Right: Live Score Pill or Time */}
          {isLive ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#40b857] px-2.5 py-0.5 text-[11px] font-extrabold text-white shadow-sm shrink-0">
              <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
              <span>{formatLiveBadgeText(match)}</span>
            </span>
          ) : isFinished ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-200 dark:bg-zinc-800 px-2.5 py-0.5 text-[11px] font-normal text-slate-800 dark:text-zinc-200 shrink-0">
              <span>Final {match.homeScore ?? 0}-{match.awayScore ?? 0}</span>
            </span>
          ) : (
            <span suppressHydrationWarning className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 font-mono shrink-0">
              {timeFormatted} - {dateFormatted}
            </span>
          )}
        </div>

        {/* BOTTOM ROW: CENTER ALIGNED TEAMS & VS */}
        <div className="flex items-center justify-center gap-1.5 w-full py-0.5">
          {match.matchType === 'team_vs_team' && (match.homeTeam || match.awayTeam) ? (
            <>
              {/* Home Team Name */}
              <span className="text-xs font-semibold text-slate-900 dark:text-zinc-100 text-right truncate flex-1">
                {match.homeTeam || 'Home Team'}
              </span>

              {/* Home Team Logo */}
              <div className="h-6 w-6 shrink-0 flex items-center justify-center">
                {match.homeTeamLogo ? (
                  <img src={match.homeTeamLogo} alt="" className="max-h-full max-w-full object-contain" />
                ) : (
                  <span className="text-[10px]">🛡️</span>
                )}
              </div>

              {/* vs */}
              <span className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 px-1 shrink-0">
                vs
              </span>

              {/* Away Team Logo */}
              <div className="h-6 w-6 shrink-0 flex items-center justify-center">
                {match.awayTeamLogo ? (
                  <img src={match.awayTeamLogo} alt="" className="max-h-full max-w-full object-contain" />
                ) : (
                  <span className="text-[10px]">🛡️</span>
                )}
              </div>

              {/* Away Team Name */}
              <span className="text-xs font-semibold text-slate-900 dark:text-zinc-100 text-left truncate flex-1">
                {match.awayTeam || 'Away Team'}
              </span>
            </>
          ) : (
            <div className="text-xs font-bold text-slate-900 dark:text-zinc-100 truncate text-center">
              {match.title || `${match.homeTeam || ''} ${match.awayTeam || ''}`.trim() || 'Live Stream Event'}
            </div>
          )}
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 2. DESKTOP VIEW (3-COLUMN HORIZONTAL ROW LAYOUT)                          */}
      {/* ========================================================================= */}
      <div className="hidden sm:flex items-center justify-between w-full">

        {/* LEFT COLUMN: LEAGUE LOGO + STATUS/TIME + LEAGUE NAME */}
        <div className="flex items-center gap-3 w-[170px] xs:w-[210px] sm:w-[250px] shrink-0 min-w-0">
          <div className="h-8 w-8 sm:h-9 sm:w-9 shrink-0 flex items-center justify-center">
            {match.subcategoryLogo || match.categoryLogo ? (
              <img src={match.subcategoryLogo || match.categoryLogo} alt="" className="max-h-full max-w-full object-contain" />
            ) : (
              <span className="text-base">🏆</span>
            )}
          </div>

          <div className="flex flex-col min-w-0">
            {isLive ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-black text-white px-2 py-0.5 bg-[#40b857] rounded-full w-fit tracking-wider">
                <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                {formatLiveBadgeText(match)}
              </span>
            ) : (
              <span suppressHydrationWarning className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 truncate font-mono">
                {timeFormatted} - {dateFormatted}
              </span>
            )}

            <span className="text-xs font-bold text-slate-800 dark:text-zinc-100 truncate mt-0.5">
              {match.subcategoryName || match.categoryName || match.title || 'League'}
            </span>
          </div>
        </div>

        {/* CENTER COLUMN: TEAMS & SCORE / VS */}
        <div className="flex-1 flex items-center justify-center min-w-0 px-2 sm:px-4">
          {match.matchType === 'team_vs_team' && (match.homeTeam || match.awayTeam) ? (
            <div className="w-full flex items-center justify-center max-w-xl">
              {/* Home Team Name */}
              <span className="flex-1 text-right text-xs sm:text-sm font-semibold text-slate-800 dark:text-zinc-100 truncate pr-2 sm:pr-3">
                {match.homeTeam || 'Home Team'}
              </span>

              {/* Home Team Logo */}
              <div className="h-7 w-7 sm:h-8 sm:w-8 shrink-0 flex items-center justify-center">
                {match.homeTeamLogo ? (
                  <img src={match.homeTeamLogo} alt="" className="max-h-full max-w-full object-contain" />
                ) : (
                  <span className="text-xs">🛡️</span>
                )}
              </div>

              {/* Live / Finished Score or VS */}
              <div className="shrink-0 px-3 sm:px-6 text-center">
                {isLive ? (
                  <div className="flex flex-col items-center">
                    <span className="text-[#40b857] font-bold text-sm sm:text-base tracking-widest font-sans">
                      {match.homeScore ?? 0} - {match.awayScore ?? 0}
                    </span>
                    {(match.livePeriod || match.liveMinute) && (
                      <span className="text-[10px] font-extrabold text-[#40b857] tracking-wider">
                        {match.livePeriod ? match.livePeriod : ''} {match.liveMinute ? (match.liveMinute.includes("'") ? match.liveMinute : `${match.liveMinute}'`) : ''}
                      </span>
                    )}
                  </div>
                ) : isFinished ? (
                  <span className="text-slate-800 dark:text-zinc-100 font-bold text-xs sm:text-sm tracking-widest font-sans">
                    {match.homeScore ?? 0} - {match.awayScore ?? 0}
                  </span>
                ) : (
                  <span className="text-slate-400 dark:text-zinc-500 font-bold text-xs sm:text-sm">
                    vs
                  </span>
                )}
              </div>

              {/* Away Team Logo */}
              <div className="h-7 w-7 sm:h-8 sm:w-8 shrink-0 flex items-center justify-center">
                {match.awayTeamLogo ? (
                  <img src={match.awayTeamLogo} alt="" className="max-h-full max-w-full object-contain" />
                ) : (
                  <span className="text-xs">🛡️</span>
                )}
              </div>

              {/* Away Team Name */}
              <span className="flex-1 text-left text-xs sm:text-sm font-semibold text-slate-800 dark:text-zinc-100 truncate pl-2 sm:pl-3">
                {match.awayTeam || 'Away Team'}
              </span>
            </div>
          ) : (
            <div className="text-xs sm:text-sm font-bold text-slate-800 dark:text-zinc-100 truncate text-center">
              {match.title || `${match.homeTeam || ''} ${match.awayTeam || ''}`.trim() || 'Live Stream Event'}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: ACTION BUTTON */}
        <div className="shrink-0 w-[85px] sm:w-[105px] flex justify-end">
          {isLive ? (
            <span className="inline-flex items-center justify-center gap-1.5 rounded-full bg-[#40b857] group-hover:bg-[#369f49] px-3.5 sm:px-4 py-1.5 text-xs font-bold text-white shadow-sm transition-all">
              <span className="h-1.5 w-1.5 rounded-full bg-white" />
              <span>Live</span>
            </span>
          ) : isFinished ? (
            <span className="inline-flex items-center justify-center gap-1.5 rounded-full border border-slate-300 dark:border-zinc-700 bg-transparent px-3.5 sm:px-4 py-1.5 text-xs font-bold text-slate-800 dark:text-zinc-200 group-hover:bg-[#F8C831] group-hover:border-[#F8C831] group-hover:text-black transition-all">
              <PlayCircle className="h-3.5 w-3.5" />
              <span>Replay</span>
            </span>
          ) : (
            <span className="inline-flex items-center justify-center gap-1.5 rounded-full border border-slate-300 dark:border-zinc-700 bg-transparent px-3.5 sm:px-4 py-1.5 text-xs font-bold text-slate-800 dark:text-zinc-200 group-hover:bg-[#F8C831] group-hover:border-[#F8C831] group-hover:text-black transition-all">
              <PlayCircle className="h-3.5 w-3.5" />
              <span>Watch</span>
            </span>
          )}
        </div>

      </div>

    </RenderCardWrapper>
  );
};
