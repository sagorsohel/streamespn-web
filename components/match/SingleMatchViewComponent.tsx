'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { slugify } from '@/lib/utils';
import { MatchCard, MatchItem } from '@/components/home/MatchCard';
import { AdRenderer } from '@/components/ads/AdRenderer';
import { JsonLdSchema } from '@/components/seo/JsonLdSchema';
import {
  getAdsSettingsSync,
  subscribeAdsSettings,
  fetchAdsSettingsAsync,
  AdsSettings,
} from '@/lib/adsCache';
import { formatMatchFullDateTime, formatLiveTimeOnly } from '@/lib/timezone';
import { useLiveScoreSync } from '@/lib/useLiveScoreSync';
import {
  Play,
  Volume2,
  Settings,
  Maximize2,
  Radio,
  Clock3,
  CalendarDays,
  ChevronRight,
  MapPin,
  Trophy,
  Tv,
  X,
  Film,
  Zap,
  Ban,
  Smartphone
} from 'lucide-react';

interface MatchDetailProps {
  categorySlug: string;
  subcategorySlug: string;
  matchSlug: string;
  initialAdsSettings?: AdsSettings;
}

const formatExternalUrl = (url?: string) => {
  if (!url || !url.trim()) return '#';
  const trimmed = url.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  return `https://${trimmed}`;
};

export function SingleMatchViewComponent({ categorySlug, subcategorySlug, matchSlug, initialAdsSettings }: MatchDetailProps) {
  const router = useRouter();
  const [match, setMatch] = useState<MatchItem | null>(null);
  const [relatedMatches, setRelatedMatches] = useState<MatchItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [notFound, setNotFound] = useState<boolean>(false);

  // Redirect hierarchically if match is not found: subcategory -> category -> home
  useEffect(() => {
    if (!notFound) return;

    let isMounted = true;
    const handleRedirect = async () => {
      try {
        const sportsRes = await api.get('/sports', { timeout: 5000 });
        const sportsList = sportsRes.data?.success && Array.isArray(sportsRes.data?.data?.sports)
          ? sportsRes.data.data.sports
          : [];

        const matchedCategory = sportsList.find(
          (c: any) =>
            slugify(c.sportName || '') === categorySlug.toLowerCase() ||
            c.sportName?.toLowerCase().replace(/\s+/g, '-') === categorySlug.toLowerCase() ||
            c.sportName?.toLowerCase() === categorySlug.replace(/-/g, ' ').toLowerCase() ||
            String(c.id) === categorySlug
        );

        if (matchedCategory) {
          const validCategorySlug = slugify(matchedCategory.sportName);

          if (subcategorySlug && subcategorySlug !== 'all') {
            try {
              const subRes = await api.get(`/subcategories?categoryId=${matchedCategory.id}`, { timeout: 5000 });
              const subList = subRes.data?.success && Array.isArray(subRes.data?.data?.subcategories)
                ? subRes.data.data.subcategories
                : [];

              const matchedSub = subList.find(
                (s: any) =>
                  slugify(s.name || '') === subcategorySlug.toLowerCase() ||
                  s.name?.toLowerCase().replace(/\s+/g, '-') === subcategorySlug.toLowerCase() ||
                  s.name?.toLowerCase() === subcategorySlug.replace(/-/g, ' ').toLowerCase() ||
                  String(s.id) === subcategorySlug
              );

              if (matchedSub) {
                const validSubSlug = slugify(matchedSub.name);
                if (isMounted) router.replace(`/${validCategorySlug}/${validSubSlug}?notfound=true`);
                return;
              }
            } catch (e) { }
          }

          if (isMounted) router.replace(`/${validCategorySlug}?notfound=true`);
          return;
        }
      } catch (e) { }

      if (isMounted) router.replace('/?notfound=true');
    };

    handleRedirect();

    return () => {
      isMounted = false;
    };
  }, [notFound, categorySlug, subcategorySlug, router]);

  // 🔄 REAL-TIME SILENT LIVE SCORE & MINUTE SYNC (15s interval)
  useLiveScoreSync(match ? [match] : [], (updatedArr) => {
    if (typeof updatedArr === 'function') {
      setMatch((prev) => {
        if (!prev) return null;
        const res = updatedArr([prev]);
        return res[0] || prev;
      });
    }
  });

  // Ads Settings State (Prefilled with initialAdsSettings for instant 0ms display)
  const [adsSettings, setAdsSettings] = useState<AdsSettings>(() => initialAdsSettings || getAdsSettingsSync());

  useEffect(() => {
    setAdsSettings(getAdsSettingsSync());
    const unsubscribe = subscribeAdsSettings((updated) => {
      setAdsSettings(updated);
    });
    fetchAdsSettingsAsync();
    return () => {
      unsubscribe();
    };
  }, []);

  // Player & Stream Modal States
  const [activeServer, setActiveServer] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [showStreamModal, setShowStreamModal] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setNotFound(false);

    const fetchMatchDetails = async () => {
      try {
        const rawSlug = matchSlug;
        let decodedSlug = rawSlug;
        try {
          decodedSlug = decodeURIComponent(rawSlug);
        } catch (e) {
          // ignore
        }

        let res = await api.get(`/matches/${rawSlug}`);
        if (!res.data?.success || !res.data?.data?.match) {
          if (decodedSlug !== rawSlug) {
            res = await api.get(`/matches/${decodedSlug}`);
          }
        }

        if (!res.data?.success || !res.data?.data?.match) {
          const spanishVar = rawSlug.replace(/espaa/g, 'espana').replace(/espana/g, 'espaa');
          if (spanishVar !== rawSlug) {
            res = await api.get(`/matches/${spanishVar}`);
          }
        }

        if (res.data?.success && res.data?.data?.match) {
          const matchData: MatchItem = res.data.data.match;
          if (isMounted) {
            setMatch(matchData);
            setLoading(false); // ⚡ UNLOCK MAIN MATCH UI IMMEDIATELY (<100ms)
          }

          // Fetch related matches: subcategory live -> subcategory upcoming -> category live -> category upcoming
          const requests: Promise<any>[] = [];
          if (matchData.subcategoryId) {
            requests.push(api.get(`/matches?subcategoryId=${matchData.subcategoryId}&limit=25`).catch(() => null));
          }
          if (matchData.categoryId) {
            requests.push(api.get(`/matches?categoryId=${matchData.categoryId}&limit=30`).catch(() => null));
          }

          if (requests.length > 0) {
            Promise.all(requests)
              .then((responses) => {
                if (!isMounted) return;

                const subcatRes = matchData.subcategoryId ? responses[0] : null;
                const catRes = matchData.subcategoryId ? responses[1] : responses[0];

                const subcatMatches: MatchItem[] = subcatRes?.data?.success && Array.isArray(subcatRes?.data?.data?.matches)
                  ? subcatRes.data.data.matches
                  : [];
                const catMatches: MatchItem[] = catRes?.data?.success && Array.isArray(catRes?.data?.data?.matches)
                  ? catRes.data.data.matches
                  : [];

                // 1. Subcategory matches (exclude current match & finished)
                const cleanSubcat = subcatMatches.filter((m: MatchItem) => m.id !== matchData.id && m.status !== 'finished');
                const subcatLive = cleanSubcat.filter((m: MatchItem) => m.status === 'live');
                const subcatUpcoming = cleanSubcat.filter((m: MatchItem) => m.status === 'upcoming');

                // 2. Category matches (exclude current match & finished)
                const cleanCat = catMatches.filter((m: MatchItem) => m.id !== matchData.id && m.status !== 'finished');
                const catLive = cleanCat.filter((m: MatchItem) => m.status === 'live');
                const catUpcoming = cleanCat.filter((m: MatchItem) => m.status === 'upcoming');

                let finalEvents: MatchItem[] = [];

                if (cleanSubcat.length > 0) {
                  // Prioritize this subcategory: live first, then upcoming
                  finalEvents = [...subcatLive, ...subcatUpcoming];

                  // Supplement with category events if less than 10
                  if (finalEvents.length < 10) {
                    const existingIds = new Set(finalEvents.map((m) => m.id));
                    const extraCat = [...catLive, ...catUpcoming].filter((m) => !existingIds.has(m.id));
                    finalEvents = [...finalEvents, ...extraCat];
                  }
                } else {
                  // Fallback to this category: live matches first, then upcoming
                  finalEvents = [...catLive, ...catUpcoming];
                }

                setRelatedMatches(finalEvents.slice(0, 10));
              })
              .catch(() => { });
          }
        } else {
          if (isMounted) setNotFound(true);
        }
      } catch (err) {
        if (isMounted) setNotFound(true);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchMatchDetails();
    return () => {
      isMounted = false;
    };
  }, [matchSlug]);

  const handlePlayClick = () => {
    setIsPlaying(true);
    setIsConnecting(true);
    setShowStreamModal(false);

    setTimeout(() => {
      setIsConnecting(false);
      setShowStreamModal(true);
    }, 500);
  };

  const handleServerChange = (serverId: number) => {
    setActiveServer(serverId);
    if (isPlaying) {
      setIsConnecting(true);
      setShowStreamModal(false);
      setTimeout(() => {
        setIsConnecting(false);
        setShowStreamModal(true);
      }, 500);
    }
  };

  const isLive = match?.status === 'live';
  const isFinished = match?.status === 'finished';

  const matchDate = match?.matchTime ? new Date(match.matchTime) : null;
  const rawTimeFormatted = matchDate ? matchDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : 'TBA';
  const rawDateFormatted = matchDate ? matchDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';

  const formattedObj = match?.matchTime ? formatMatchFullDateTime(match.matchTime) : null;
  const timeFormatted = formattedObj ? `${formattedObj.time} ${formattedObj.tzAbbr ? `(${formattedObj.tzAbbr})` : ''}` : rawTimeFormatted;
  const dateFormatted = formattedObj ? formattedObj.date : rawDateFormatted;

  const displayCategory = match?.categoryName || categorySlug;
  const displaySubcategory = match?.subcategoryName || subcategorySlug;

  // 1. Single Page Background Banner (Shows in the page ambient atmosphere):
  // Priority 1: Match/Event Custom Background Banner (match.bgImage)
  // Priority 2: Category Background Banner Image (match.categoryBgImage)
  // Fallback: Category Thumbnail (match.categoryThumbUrl)
  const singlePageBgImage =
    (match?.bgImage && match.bgImage.trim()) ||
    (match?.categoryBgImage && match.categoryBgImage.trim()) ||
    (match?.categoryThumbUrl && match.categoryThumbUrl.trim()) ||
    '';

  // 2. Video Player & Modal Canvas Image (Shows in the video player & modal backdrop):
  // Priority 1: Match/Event Custom Player Image (match.playerImage)
  // Priority 2: Category Player Image (match.categoryPlayerImage)
  // Priority 3: Fallback to Background Banner if no player image is uploaded
  // Priority 4: Category Thumbnail or default
  const playerBackdrop =
    (match?.playerImage && match.playerImage.trim()) ||
    (match?.categoryPlayerImage && match.categoryPlayerImage.trim()) ||
    singlePageBgImage ||
    'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80';

  const matchTitle = match?.matchType === 'team_vs_team' ? `${match.homeTeam} VS ${match.awayTeam}` : match?.title || 'Match Stream';

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#070b13] text-white">
        <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-400 text-sm font-medium">Redirecting to event category...</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex-1 w-full overflow-hidden">
      {/* 🏟️ Single Page Hero & Ambient Background Banner */}
      {singlePageBgImage && (
        <div className="absolute top-0 left-0 right-0 h-[680px] sm:h-[860px] pointer-events-none overflow-hidden select-none z-0">
          <div
            className="absolute inset-0 bg-cover bg-top scale-100 opacity-60 dark:opacity-65 transition-opacity duration-700"
            style={{
              backgroundImage: `url(${singlePageBgImage})`,
            }}
          />
          {/* Fresh, clean fade overlay that keeps the top crisp and smoothly blends into the page body */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-[var(--bg-main)]/50 to-[var(--bg-main)]" />
        </div>
      )}

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 pt-3 pb-12 flex-1 w-full">
        {match && (
          <JsonLdSchema
            type="event"
            name={matchTitle}
            startDate={match.matchTime ? new Date(match.matchTime).toISOString() : undefined}
            homeTeam={match.homeTeam || undefined}
            awayTeam={match.awayTeam || undefined}
            categoryName={match.categoryName || categorySlug}
            isLive={isLive}
          />
        )}

        {loading ? (
          <div className="space-y-6 mx-auto w-full max-w-[891px]">
            <div className="h-20 w-full rounded-2xl bg-slate-300 dark:bg-zinc-800 animate-pulse" />
            <div className="h-[320px] sm:h-[450px] w-full rounded-2xl bg-slate-300 dark:bg-zinc-800 animate-pulse" />
            <div className="h-44 w-full rounded-2xl bg-slate-300 dark:bg-zinc-800 animate-pulse" />
          </div>
        ) : match ? (
          <div className="space-y-6">

            {/* ========================================================================= */}
            {/* 1. TOP SECTION: TEAMS SCOREBOARD BANNER                                   */}
            {/* ========================================================================= */}
            <div className="rounded-2xl sm:rounded-[22px] border border-slate-200/80 dark:border-white/10 shadow-sm bg-[var(--bg-card)] p-4 sm:p-5 flex items-center justify-between gap-4 w-full mx-auto max-w-[891px]">
              {match.matchType === 'team_vs_team' && (match.homeTeam || match.awayTeam) ? (
                <>
                  {/* HOME TEAM: LOGO + NAME (LEFT) */}
                  <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0 justify-start">
                    <div className="h-10 w-10 sm:h-14 sm:w-14 shrink-0 flex items-center justify-center p-1">
                      {match.homeTeamLogo ? (
                        <img src={match.homeTeamLogo} alt="" className="max-h-full max-w-full object-contain" />
                      ) : (
                        <span className="text-xl sm:text-2xl">🛡️</span>
                      )}
                    </div>
                    <span className="text-sm sm:text-lg font-black text-[var(--text-white)] truncate text-left">
                      {match.homeTeam || 'Home Team'}
                    </span>
                  </div>

                  {/* CENTER: VS / LIVE SCORE PILL */}
                  <div className="shrink-0 flex flex-col items-center">
                    <div className="flex items-center justify-center px-4 sm:px-6 py-2 sm:py-2.5 rounded-2xl bg-[var(--bg-main)] border border-slate-200/80 dark:border-white/10 font-black text-sm sm:text-lg font-mono text-[#F8C831]">
                      {isLive || isFinished
                        ? `${match.homeScore ?? 0} - ${match.awayScore ?? 0}`
                        : 'VS'}
                    </div>
                    {isLive && (
                      <div className="mt-1.5 flex items-center gap-1.5 text-xs font-extrabold text-[#40b857] bg-[#40b857]/10 px-3 py-0.5 rounded-full border border-[#40b857]/20">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#40b857] animate-pulse" />
                        <span>{formatLiveTimeOnly(match)}</span>
                      </div>
                    )}
                  </div>

                  {/* AWAY TEAM: NAME + LOGO (RIGHT) */}
                  <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0 justify-end">
                    <span className="text-sm sm:text-lg font-black text-[var(--text-white)] truncate text-right">
                      {match.awayTeam || 'Away Team'}
                    </span>
                    <div className="h-10 w-10 sm:h-14 sm:w-14 shrink-0 flex items-center justify-center p-1">
                      {match.awayTeamLogo ? (
                        <img src={match.awayTeamLogo} alt="" className="max-h-full max-w-full object-contain" />
                      ) : (
                        <span className="text-xl sm:text-2xl">🛡️</span>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="w-full text-center py-2 space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[#F8C831] font-black text-xs uppercase tracking-wider">
                    {match.subcategoryLogo || match.categoryLogo ? (
                      <img src={match.subcategoryLogo || match.categoryLogo} alt="" className="h-4 w-4 object-contain" />
                    ) : (
                      <span>🏆</span>
                    )}
                    <span>{match.subcategoryName || match.categoryName || 'Special Event'}</span>
                  </div>
                  <h1 className="text-lg sm:text-2xl font-black text-[var(--text-white)]">{match.title || match.homeTeam || 'Live Stream Event'}</h1>
                </div>
              )}
            </div>

            {/* ========================================================================= */}
            {/* 2. MIDDLE SECTION: VIDEO STREAM PLAYER (891px WIDTH x 500px HEIGHT)        */}
            {/* ========================================================================= */}
            <div className="relative overflow-hidden rounded-2xl sm:rounded-[24px] border border-slate-200/80 dark:border-white/10 shadow-sm bg-slate-950 group mx-auto w-full max-w-[891px]">

              {/* VIDEO PLAYER CANVAS: 891px x 500px */}
              <div className="relative w-full h-[240px] xs:h-[340px] sm:h-[420px] md:h-[500px] bg-black flex items-center justify-center overflow-hidden">
                {/* Stadium backdrop image */}
                <div
                  className="absolute inset-0 bg-cover bg-center opacity-90 scale-105 transition-transform duration-700 group-hover:scale-100"
                  style={{
                    backgroundImage: `url(${playerBackdrop})`,
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/15 to-black/25" />

                {/* 2A. UNSTARTED OVERLAY SCREEN */}
                {!isPlaying ? (
                  <div
                    onClick={handlePlayClick}
                    className="relative z-10 flex flex-col items-center justify-center p-6 text-center cursor-pointer select-none"
                  >
                    <div className="relative flex items-center justify-center">
                      {/* Subtle Flat Pulse Wave on Hover */}
                      <div className="absolute -inset-2.5 sm:-inset-3 rounded-full border-2 border-[#F8C831]/60 opacity-100 animate-ping group-hover:opacity-100 group-hover:animate-ping pointer-events-none transition-opacity duration-300" />

                      {/* Clean Flat Modern Highlighted Play Button with crisp border */}
                      <button
                        type="button"
                        onClick={handlePlayClick}
                        className="relative flex h-16 w-16  sm:h-20 sm:w-20 items-center justify-center rounded-full bg-[#f8c831b3] text-black border-2 sm:border-[3px] border-white shadow-xl shadow-yellow-500/30 transition-all duration-300 group-hover:scale-110 group-hover:bg-yellow-400 group-hover:border-white group-hover:shadow-yellow-500/50 active:scale-95 cursor-pointer"
                        title="Click to Start Streaming"
                      >
                        <Play className="h-7 w-7 sm:h-9 sm:w-9 fill-white text-white ml-1" />
                      </button>
                    </div>
                  </div>
                ) : isConnecting ? (
                  /* 2B. CONNECTING SPINNER PHASE */
                  <div className="relative z-20 w-full h-full flex items-center justify-center bg-black/25 backdrop-blur-[2px]">
                    <div className="h-14 w-14 rounded-full border-4 border-[#F8C831] border-t-transparent animate-spin drop-shadow-[0_0_12px_rgba(248,200,49,0.8)]" />
                  </div>
                ) : null}

                {/* 2C. STREAM SIGN UP (PRE-RENDERED ON PAGE LOAD FOR INSTANT ZERO-DELAY AD DISPLAY) */}
                <div
                  className={`fixed sm:absolute inset-0 z-[999999] sm:z-30 items-center justify-center bg-black/75 dark:bg-black/85 sm:bg-transparent backdrop-blur-md sm:backdrop-blur-none p-4 sm:p-0 overflow-y-auto no-scrollbar transition-all duration-200 ${showStreamModal && !isConnecting && isPlaying
                    ? 'flex opacity-100 pointer-events-auto visible'
                    : 'flex opacity-0 pointer-events-none invisible'
                    }`}
                >
                  <div className="w-full max-w-sm sm:max-w-none sm:w-full sm:h-full rounded-2xl sm:rounded-none border border-slate-200 dark:border-white/10 sm:border-none bg-[var(--bg-card)] sm:bg-[var(--bg-card)]/95 text-[var(--text-white)] p-4 sm:p-6 shadow-2xl sm:shadow-none flex flex-col justify-between my-auto sm:my-0 space-y-3 sm:space-y-4">

                    {/* TOP BAR */}
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-2.5 shrink-0">
                      <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-[var(--text-white)]">
                        <Tv className="h-4 w-4 text-[#008ba3] dark:text-cyan-400" />
                        <span className="uppercase tracking-wide font-extrabold truncate max-w-[200px] sm:max-w-md">
                          {matchTitle}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setShowStreamModal(false);
                          setIsPlaying(false);
                        }}
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--bg-card-hover)] text-[var(--text-muted)] hover:text-[var(--text-white)] transition-colors cursor-pointer"
                        title="Close Stream Overlay"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    {/* CENTER BODY */}
                    <div className="flex-1 flex flex-col items-center justify-center text-center space-y-3 sm:space-y-4 my-auto py-2">
                      <h2 className="text-sm sm:text-xl font-black text-[var(--text-white)] tracking-tight">
                        Please Sign Up to Watch live
                      </h2>

                      {/* CYAN CALL TO ACTION BUTTON */}
                      {(() => {
                        const rawLink =
                          (match?.referralLink && match.referralLink.trim()) ||
                          (match?.subcategoryReferralLink && match.subcategoryReferralLink.trim()) ||
                          (match?.categoryReferralLink && match.categoryReferralLink.trim()) ||
                          (adsSettings.membershipReferralLink && adsSettings.membershipReferralLink.trim()) ||
                          (adsSettings.globalSignInReferralLink && adsSettings.globalSignInReferralLink.trim()) ||
                          '#';
                        const finalUrl = formatExternalUrl(rawLink);

                        return (
                          <a
                            href={finalUrl}
                            target="_self"
                            rel="noopener noreferrer"
                            className="w-full max-w-xs py-2.5 sm:py-3 px-6 rounded-xl bg-[#008ba3] hover:bg-[#00778c] text-white font-black text-xs sm:text-sm shadow-lg tracking-wider text-center transition-all transform hover:scale-105 active:scale-95 cursor-pointer border border-cyan-400/30 uppercase"
                          >
                            SIGN UP & WATCH NOW!
                          </a>
                        );
                      })()}

                      {/* SIGNUP AD BANNER - PRE-RENDERED ON PAGE LOAD FOR ZERO DELAY */}
                      {(adsSettings.modalSignupAds || adsSettings.navAds) && (
                        <div className="w-full max-w-[340px] bg-transparent flex items-center justify-center my-1.5 min-h-[52px]">
                          <AdRenderer
                            uniqueKey={`modal-ad-${matchSlug}`}
                            code={adsSettings.modalSignupAds || adsSettings.navAds}
                          />
                        </div>
                      )}

                      {/* 4 FEATURE PILLS GRID */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-xs text-[11px] font-bold text-[var(--text-white)] text-left pt-1">
                        <div className="flex items-center gap-2 p-2 sm:p-2.5 rounded-xl bg-[var(--bg-main)] border border-slate-200/80 dark:border-white/10 backdrop-blur-sm">
                          <Film className="h-3.5 w-3.5 text-[#008ba3] dark:text-cyan-400 shrink-0" />
                          <span className="truncate">High Quality Streaming</span>
                        </div>
                        <div className="flex items-center gap-2 p-2 sm:p-2.5 rounded-xl bg-[var(--bg-main)] border border-slate-200/80 dark:border-white/10 backdrop-blur-sm">
                          <Zap className="h-3.5 w-3.5 text-[#008ba3] dark:text-cyan-400 shrink-0" />
                          <span className="truncate">Watch Without Limits</span>
                        </div>
                        <div className="flex items-center gap-2 p-2 sm:p-2.5 rounded-xl bg-[var(--bg-main)] border border-slate-200/80 dark:border-white/10 backdrop-blur-sm">
                          <Ban className="h-3.5 w-3.5 text-[#008ba3] dark:text-cyan-400 shrink-0" />
                          <span className="truncate">No Ads, 100% Free Access</span>
                        </div>
                        <div className="flex items-center gap-2 p-2 sm:p-2.5 rounded-xl bg-[var(--bg-main)] border border-slate-200/80 dark:border-white/10 backdrop-blur-sm">
                          <Smartphone className="h-3.5 w-3.5 text-[#008ba3] dark:text-cyan-400 shrink-0" />
                          <span className="truncate">Watch on any device</span>
                        </div>
                      </div>

                    </div>

                  </div>
                </div>

                {/* PLAYER BOTTOM CONTROL BAR */}
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-3 sm:p-4 flex items-center justify-between text-white z-20">

                  {/* LEFT CONTROLS: PLAY & VOLUME */}
                  <div className="flex items-center gap-3 sm:gap-4">
                    <button
                      onClick={handlePlayClick}
                      className="hover:text-[#F8C831] transition-colors p-1"
                    >
                      <Play className={`h-4 w-4 sm:h-5 sm:w-5 ${isPlaying ? 'fill-white' : ''}`} />
                    </button>
                    <button className="hover:text-[#F8C831] transition-colors p-1">
                      <Volume2 className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                  </div>

                  {/* RIGHT CONTROLS: RED LIVE BADGE, SETTINGS GEAR, FULLSCREEN */}
                  <div className="flex items-center gap-3 sm:gap-4">
                    {/* RED LIVE PILL BADGE */}
                    <span className="px-2.5 py-0.5 rounded-md bg-red-600/30 text-red-500 border border-red-500/40 text-[10px] sm:text-xs font-black tracking-widest flex items-center gap-1 font-mono">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                      LIVE
                    </span>

                    {/* SETTINGS GEAR */}
                    <button className="hover:text-[#F8C831] transition-colors p-1" title="Settings">
                      <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>

                    {/* FULLSCREEN */}
                    <button className="hover:text-[#F8C831] transition-colors p-1" title="Fullscreen">
                      <Maximize2 className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                  </div>

                </div>

              </div>

            </div>

            {/* ========================================================================= */}
            {/* 3. BOTTOM SECTION: MATCH DETAILS (TIME, LOCATION, LEAGUE, OTHERS)          */}
            {/* ========================================================================= */}
            <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm bg-[var(--bg-card)] p-5 sm:p-6 space-y-4 mx-auto w-full max-w-[891px]">
              <div className="border-b border-slate-100 dark:border-white/10 pb-3">
                <h3 className="text-base font-black text-[var(--text-white)] flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-[#F8C831]" /> Event Details & Schedule
                </h3>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs sm:text-sm">
                {/* Time */}
                <div className="p-3.5 rounded-xl bg-[var(--bg-main)] border border-slate-200/80 dark:border-white/10 space-y-1">
                  <div className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5">
                    <Clock3 className="h-3.5 w-3.5 text-indigo-400" /> Match Time
                  </div>
                  <div className="font-extrabold text-[var(--text-white)] font-mono">{timeFormatted}</div>
                </div>

                {/* Date */}
                <div className="p-3.5 rounded-xl bg-[var(--bg-main)] border border-slate-200/80 dark:border-white/10 space-y-1">
                  <div className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5 text-[#F8C831]" /> Match Date
                  </div>
                  <div className="font-extrabold text-[var(--text-white)]">{dateFormatted}</div>
                </div>

                {/* Location / Venue */}
                <div className="p-3.5 rounded-xl bg-[var(--bg-main)] border border-slate-200/80 dark:border-white/10 space-y-1">
                  <div className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-emerald-400" /> Location / Venue
                  </div>
                  <div className="font-extrabold text-[var(--text-white)] truncate">
                    {match.venue || 'Stadium Venue'}
                  </div>
                </div>

                {/* Tournament / League (Clickable Link to Subcategory Page) */}
                {(() => {
                  const catSlug = slugify(match?.categoryName || categorySlug || 'sport');
                  const subSlug = match?.subcategoryName ? slugify(match.subcategoryName) : (subcategorySlug !== 'all' ? subcategorySlug : '');
                  const subcategoryLink = subSlug ? `/${catSlug}/${subSlug}` : `/${catSlug}`;

                  return (
                    <Link
                      href={subcategoryLink}
                      className="p-3.5 rounded-xl bg-[var(--bg-main)] border border-slate-200/80 dark:border-white/10 space-y-1 hover:border-[#F8C831] hover:bg-[var(--bg-card-hover)] transition-all block group cursor-pointer"
                    >
                      <div className="text-[11px] font-bold text-[var(--text-muted)] group-hover:text-[#F8C831] uppercase tracking-wider flex items-center gap-1.5 transition-colors">
                        <Trophy className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                        <span>Tournament</span>
                      </div>
                      <div className="font-extrabold text-[var(--text-white)] group-hover:text-[#F8C831] truncate transition-colors flex items-center justify-between gap-1">
                        <span className="truncate">{displaySubcategory} ({displayCategory})</span>
                        <ChevronRight className="h-3.5 w-3.5 text-[var(--text-muted)] group-hover:text-[#F8C831] shrink-0" />
                      </div>
                    </Link>
                  );
                })()}
              </div>
            </div>

            {/* 4. RELATED MATCHES SECTION */}
            {relatedMatches.length > 0 && (
              <div className="space-y-4 pt-4 mx-auto w-full max-w-[891px]">
                <div className="flex items-center justify-between border-b border-[var(--border-glass)] pb-2">
                  <h3 className="text-base font-black text-[var(--text-white)] flex items-center gap-2">
                    <Radio className="h-4 w-4 text-[#F8C831]" /> More Events
                  </h3>
                  <Link href={`/${slugify(displayCategory)}`} className="text-xs font-bold text-[#F8C831] hover:underline">
                    View All →
                  </Link>
                </div>

                <div className="space-y-2.5">
                  {relatedMatches.slice(0, 10).map((m) => (
                    <MatchCard key={m.id} match={m} />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
