"use client"

import React, { useEffect, useState, useRef } from "react"

import Link from "next/link"
import { useRouter } from "next/navigation"
import api from "@/lib/api"
import { slugify, isValidScore, sanitizeScore } from "@/lib/utils"
import { MatchCard, MatchItem } from "@/components/home/MatchCard"
import { OptimizedImage } from "@/components/common/OptimizedImage"
import { AdRenderer } from "@/components/ads/AdRenderer"
import { JsonLdSchema } from "@/components/seo/JsonLdSchema"
import {
  getAdsSettingsSync,
  subscribeAdsSettings,
  fetchAdsSettingsAsync,
  AdsSettings,
} from "@/lib/adsCache"
import { formatMatchFullDateTime, formatLiveTimeOnly, parseUtcDate } from "@/lib/timezone"
import { useLiveScoreSync } from "@/lib/useLiveScoreSync"
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
  Smartphone,
  ArrowRight,
  MoveRight,
} from "lucide-react"

interface MatchDetailProps {
  categorySlug: string
  subcategorySlug: string
  matchSlug: string
  initialMatch?: MatchItem | null
  initialAdsSettings?: AdsSettings
}

const formatExternalUrl = (url?: string) => {
  if (!url || !url.trim()) return "#"
  const trimmed = url.trim()
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed
  }
  return `https://${trimmed}`
}

export function SingleMatchViewComponent({
  categorySlug,
  subcategorySlug,
  matchSlug,
  initialMatch,
  initialAdsSettings,
}: MatchDetailProps) {
  const router = useRouter()
  const [match, setMatch] = useState<MatchItem | null>(
    () => initialMatch || null
  )
  const [relatedMatches, setRelatedMatches] = useState<MatchItem[]>([])
  const [loading, setLoading] = useState<boolean>(() => !initialMatch)
  const [notFound, setNotFound] = useState<boolean>(false)
  const [mounted, setMounted] = useState<boolean>(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Redirect hierarchically if match is not found: subcategory -> category -> home
  useEffect(() => {
    if (!notFound) return

    let isMounted = true
    const handleRedirect = async () => {
      try {
        const sportsRes = await api.get("/sports", { timeout: 5000 })
        const sportsList =
          sportsRes.data?.success && Array.isArray(sportsRes.data?.data?.sports)
            ? sportsRes.data.data.sports
            : []

        const matchedCategory = sportsList.find(
          (c: any) =>
            slugify(c.sportName || "") === categorySlug.toLowerCase() ||
            c.sportName?.toLowerCase().replace(/\s+/g, "-") ===
              categorySlug.toLowerCase() ||
            c.sportName?.toLowerCase() ===
              categorySlug.replace(/-/g, " ").toLowerCase() ||
            String(c.id) === categorySlug
        )

        if (matchedCategory) {
          const validCategorySlug = slugify(matchedCategory.sportName)

          if (subcategorySlug && subcategorySlug !== "all") {
            try {
              const subRes = await api.get(
                `/subcategories?categoryId=${matchedCategory.id}`,
                { timeout: 5000 }
              )
              const subList =
                subRes.data?.success &&
                Array.isArray(subRes.data?.data?.subcategories)
                  ? subRes.data.data.subcategories
                  : []

              const matchedSub = subList.find(
                (s: any) =>
                  slugify(s.name || "") === subcategorySlug.toLowerCase() ||
                  s.name?.toLowerCase().replace(/\s+/g, "-") ===
                    subcategorySlug.toLowerCase() ||
                  s.name?.toLowerCase() ===
                    subcategorySlug.replace(/-/g, " ").toLowerCase() ||
                  String(s.id) === subcategorySlug
              )

              if (matchedSub) {
                const validSubSlug = slugify(matchedSub.name)
                const cleanMatchSlug = matchSlug
                  ? matchSlug.replace(/^\/+/, "")
                  : ""
                if (isMounted)
                  router.replace(
                    `/${validCategorySlug}/${validSubSlug}?notfound=true${cleanMatchSlug ? `&m=${cleanMatchSlug}` : ""}`
                  )
                return
              }
            } catch (e) {}

            const cleanMatchSlug = matchSlug
              ? matchSlug.replace(/^\/+/, "")
              : ""
            if (isMounted)
              router.replace(
                `/${validCategorySlug}/${subcategorySlug}?notfound=true${cleanMatchSlug ? `&m=${cleanMatchSlug}` : ""}`
              )
            return
          }

          const cleanMatchSlug = matchSlug ? matchSlug.replace(/^\/+/, "") : ""
          if (isMounted)
            router.replace(
              `/${validCategorySlug}?notfound=true${cleanMatchSlug ? `&m=${cleanMatchSlug}` : ""}`
            )
          return
        }
      } catch (e) {}

      const cleanMatchSlug = matchSlug ? matchSlug.replace(/^\/+/, "") : ""
      if (categorySlug && subcategorySlug && subcategorySlug !== "all") {
        if (isMounted)
          router.replace(
            `/${categorySlug}/${subcategorySlug}?notfound=true${cleanMatchSlug ? `&m=${cleanMatchSlug}` : ""}`
          )
      } else if (categorySlug) {
        if (isMounted)
          router.replace(
            `/${categorySlug}?notfound=true${cleanMatchSlug ? `&m=${cleanMatchSlug}` : ""}`
          )
      } else {
        if (isMounted)
          router.replace(
            `/?notfound=true${cleanMatchSlug ? `&m=${cleanMatchSlug}` : ""}`
          )
      }
    }

    handleRedirect()

    return () => {
      isMounted = false
    }
  }, [notFound, categorySlug, subcategorySlug, matchSlug, router])

  // 🔄 REAL-TIME SILENT LIVE SCORE & MINUTE SYNC (15s interval)
  useLiveScoreSync(match ? [match] : [], (updatedArr) => {
    if (typeof updatedArr === "function") {
      setMatch((prev) => {
        if (!prev) return null
        const res = updatedArr([prev])
        return res[0] || prev
      })
    }
  })

  // Ads Settings State (Prefilled with initialAdsSettings for instant 0ms display)
  const [adsSettings, setAdsSettings] = useState<AdsSettings>(
    () => initialAdsSettings || getAdsSettingsSync()
  )

  useEffect(() => {
    setAdsSettings(getAdsSettingsSync())
    const unsubscribe = subscribeAdsSettings((updated) => {
      setAdsSettings(updated)
    })
    fetchAdsSettingsAsync()
    return () => {
      unsubscribe()
    }
  }, [])

  // Player & Stream Modal States
  const [activeServer, setActiveServer] = useState<number>(1)
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [isConnecting, setIsConnecting] = useState<boolean>(false)
  const [showStreamModal, setShowStreamModal] = useState<boolean>(false)

  const initialMatchUsedRef = useRef<boolean>(Boolean(initialMatch))

  // Helper to fetch related matches in background without wiping match UI
  const fetchRelatedMatchesFor = (matchData: MatchItem, isMounted: boolean) => {
    const requests: Promise<any>[] = []
    if (matchData.subcategoryId) {
      requests.push(
        api
          .get(`/matches?subcategoryId=${matchData.subcategoryId}&limit=25`)
          .catch(() => null)
      )
    }
    if (matchData.categoryId) {
      requests.push(
        api
          .get(`/matches?categoryId=${matchData.categoryId}&limit=30`)
          .catch(() => null)
      )
    }

    if (requests.length > 0) {
      Promise.all(requests)
        .then((responses) => {
          if (!isMounted) return

          const subcatRes = matchData.subcategoryId ? responses[0] : null
          const catRes = matchData.subcategoryId ? responses[1] : responses[0]

          const subcatMatches: MatchItem[] =
            subcatRes?.data?.success &&
            Array.isArray(subcatRes?.data?.data?.matches)
              ? subcatRes.data.data.matches
              : []
          const catMatches: MatchItem[] =
            catRes?.data?.success && Array.isArray(catRes?.data?.data?.matches)
              ? catRes.data.data.matches
              : []

          const isMatchTodayOrTomorrow = (dateStr?: string | null) => {
            if (!dateStr) return false
            const d = new Date(dateStr)
            if (isNaN(d.getTime())) return false
            const now = new Date()
            const isMatchToday =
              d.getDate() === now.getDate() &&
              d.getMonth() === now.getMonth() &&
              d.getFullYear() === now.getFullYear()
            const tomorrow = new Date()
            tomorrow.setDate(tomorrow.getDate() + 1)
            const isMatchTomorrow =
              d.getDate() === tomorrow.getDate() &&
              d.getMonth() === tomorrow.getMonth() &&
              d.getFullYear() === tomorrow.getFullYear()
            return isMatchToday || isMatchTomorrow
          }

          // 1. Subcategory matches (exclude current match & finished)
          const cleanSubcat = subcatMatches.filter(
            (m: MatchItem) => m.id !== matchData.id && m.status !== "finished"
          )
          const subcatLive = cleanSubcat.filter(
            (m: MatchItem) => m.status === "live"
          )
          const subcatUpcoming = cleanSubcat.filter(
            (m: MatchItem) =>
              m.status === "upcoming" && isMatchTodayOrTomorrow(m.matchTime)
          )

          // 2. Category matches (exclude current match & finished)
          const cleanCat = catMatches.filter(
            (m: MatchItem) => m.id !== matchData.id && m.status !== "finished"
          )
          const catLive = cleanCat.filter((m: MatchItem) => m.status === "live")
          const catUpcoming = cleanCat.filter(
            (m: MatchItem) =>
              m.status === "upcoming" && isMatchTodayOrTomorrow(m.matchTime)
          )

          let finalEvents: MatchItem[] = []

          if (cleanSubcat.length > 0) {
            finalEvents = [...subcatLive, ...subcatUpcoming]
            if (finalEvents.length < 10) {
              const existingIds = new Set(finalEvents.map((m) => m.id))
              const extraCat = [...catLive, ...catUpcoming].filter(
                (m) => !existingIds.has(m.id)
              )
              finalEvents = [...finalEvents, ...extraCat]
            }
          } else {
            finalEvents = [...catLive, ...catUpcoming]
          }

          setRelatedMatches(finalEvents.slice(0, 10))
        })
        .catch(() => {})
    }
  }

  useEffect(() => {
    let isMounted = true
    setNotFound(false)

    // If SSR already preloaded initialMatch, skip main fetch & spinner
    if (initialMatchUsedRef.current && match) {
      initialMatchUsedRef.current = false
      setLoading(false)
      fetchRelatedMatchesFor(match, isMounted)
      return
    }

    setLoading(true)

    const fetchMatchDetails = async () => {
      try {
        const rawSlug = matchSlug
        let decodedSlug = rawSlug
        try {
          decodedSlug = decodeURIComponent(rawSlug)
        } catch (e) {
          // ignore
        }

        let res = await api.get(`/matches/${rawSlug}`)
        if (!res.data?.success || !res.data?.data?.match) {
          if (decodedSlug !== rawSlug) {
            res = await api.get(`/matches/${decodedSlug}`)
          }
        }

        if (!res.data?.success || !res.data?.data?.match) {
          const spanishVar = rawSlug
            .replace(/espaa/g, "espana")
            .replace(/espana/g, "espaa")
          if (spanishVar !== rawSlug) {
            res = await api.get(`/matches/${spanishVar}`)
          }
        }

        if (res.data?.success && res.data?.data?.match) {
          const matchData: MatchItem = res.data.data.match
          if (isMounted) {
            setMatch(matchData)
            setLoading(false) // ⚡ UNLOCK MAIN MATCH UI IMMEDIATELY (<100ms)
          }

          fetchRelatedMatchesFor(matchData, isMounted)
        } else {
          if (isMounted) setNotFound(true)
        }
      } catch (err) {
        if (isMounted) setNotFound(true)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchMatchDetails()

    return () => {
      isMounted = false
    }
  }, [matchSlug])

  const handlePlayClick = () => {
    setIsPlaying(true)
    setIsConnecting(true)
    setShowStreamModal(false)

    setTimeout(() => {
      setIsConnecting(false)
      setShowStreamModal(true)
    }, 500)
  }

  const handleServerChange = (serverId: number) => {
    setActiveServer(serverId)
    if (isPlaying) {
      setIsConnecting(true)
      setShowStreamModal(false)
      setTimeout(() => {
        setIsConnecting(false)
        setShowStreamModal(true)
      }, 500)
    }
  }

  const isLive = match?.status === "live"
  const isFinished = match?.status === "finished"

  const matchDate = match?.matchTime ? parseUtcDate(match.matchTime) : null
  const rawTimeFormatted = matchDate
    ? matchDate.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZone: "UTC",
      }) + " UTC"
    : "TBA"
  const rawDateFormatted = matchDate
    ? matchDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
      })
    : ""

  const formattedObj = mounted && match?.matchTime
    ? formatMatchFullDateTime(match.matchTime)
    : null
  const timeFormatted = formattedObj
    ? `${formattedObj.time} ${formattedObj.tzAbbr ? `(${formattedObj.tzAbbr})` : ""}`
    : rawTimeFormatted
  const dateFormatted = formattedObj ? formattedObj.date : rawDateFormatted

  const displayCategory = match?.categoryName || categorySlug
  const displaySubcategory = match?.subcategoryName || subcategorySlug

  // 1. Single Page Background Banner (Shows in the page ambient atmosphere):
  // Priority 1: Match/Event Custom Background Banner (match.bgImage)
  // Priority 2: Category Background Banner Image (match.categoryBgImage)
  // Fallback: Category Thumbnail (match.categoryThumbUrl)
  const singlePageBgImage =
    (match?.bgImage && match.bgImage.trim()) ||
    (match?.categoryBgImage && match.categoryBgImage.trim()) ||
    (match?.categoryThumbUrl && match.categoryThumbUrl.trim()) ||
    ""

  // 2. Video Player & Modal Canvas Image (Shows in the video player & modal backdrop):
  // Priority 1: Match/Event Custom Player Image (match.playerImage)
  // Priority 2: Category Player Image (match.categoryPlayerImage)
  // Priority 3: Fallback to Background Banner if no player image is uploaded
  // Priority 4: Category Thumbnail or default
  const playerBackdrop =
    (match?.playerImage && match.playerImage.trim()) ||
    (match?.categoryPlayerImage && match.categoryPlayerImage.trim()) ||
    singlePageBgImage ||
    "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80"

  const matchTitle =
    match?.matchType === "team_vs_team"
      ? `${match.homeTeam} VS ${match.awayTeam}`
      : match?.title || "Match Stream"

  if (notFound) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#070b13] text-white">
        <div className="mb-4 h-10 w-10 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
        <p className="text-sm font-medium text-gray-400">
          Redirecting to event category...
        </p>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen w-full flex-1 overflow-hidden">
      {/* 🏟️ Single Page Hero & Ambient Background Banner */}
      {singlePageBgImage && (
        <div className="pointer-events-none absolute top-0 right-0 left-0 z-0 h-[680px] overflow-hidden select-none sm:h-[860px]">
          <div className="absolute inset-0 overflow-hidden">
            <OptimizedImage
              src={singlePageBgImage}
              alt=""
              fill
              priority
              sizeVariant="preview"
              sizes="100vw"
              className="object-cover object-top opacity-60 transition-opacity duration-700 dark:opacity-65"
            />
          </div>
          {/* Fresh, clean fade overlay that keeps the top crisp and smoothly blends into the page body */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-[var(--bg-main)]/50 to-[var(--bg-main)]" />
        </div>
      )}

      <div className="relative mx-auto w-full max-w-7xl flex-1 px-4 pt-3 pb-12 sm:px-6">
        {match && (
          <JsonLdSchema
            type="event"
            name={matchTitle}
            startDate={
              match.matchTime
                ? new Date(match.matchTime).toISOString()
                : undefined
            }
            homeTeam={match.homeTeam || undefined}
            awayTeam={match.awayTeam || undefined}
            categoryName={match.categoryName || categorySlug}
            categorySlug={
              categorySlug !== "sport"
                ? categorySlug
                : match.categoryName
                  ? slugify(match.categoryName)
                  : "sport"
            }
            tournamentName={
              match.subcategoryName ||
              (subcategorySlug !== "all" ? subcategorySlug : "League")
            }
            tournamentSlug={
              subcategorySlug !== "all"
                ? subcategorySlug
                : match.subcategoryName
                  ? slugify(match.subcategoryName)
                  : "league"
            }
            matchSlug={match.slug || matchSlug}
            venue={match.venue || undefined}
            isLive={isLive}
          />
        )}

        {loading ? (
          <div className="mx-auto w-full max-w-[891px] space-y-6">
            <div className="h-20 w-full animate-pulse rounded-2xl bg-slate-300 dark:bg-zinc-800" />
            <div className="h-[320px] w-full animate-pulse rounded-2xl bg-slate-300 sm:h-[450px] dark:bg-zinc-800" />
            <div className="h-44 w-full animate-pulse rounded-2xl bg-slate-300 dark:bg-zinc-800" />
          </div>
        ) : match ? (
          <div className="space-y-6">
            {/* ========================================================================= */}
            {/* 1. TOP SECTION: TEAMS SCOREBOARD BANNER                                   */}
            {/* ========================================================================= */}
            <div className="mx-auto flex w-full max-w-[891px] items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-[var(--bg-card)] p-4 shadow-sm sm:rounded-[22px] sm:p-5 dark:border-white/10">
              {match.matchType === "team_vs_team" &&
              (match.homeTeam || match.awayTeam) ? (
                <>
                  {/* HOME TEAM: LOGO + NAME (LEFT) */}
                  <div className="flex min-w-0 flex-1 items-center justify-start gap-3 sm:gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center p-1 sm:h-14 sm:w-14">
                      {match.homeTeamLogo ? (
                        <OptimizedImage
                          src={match.homeTeamLogo}
                          alt={match.homeTeam || ""}
                          width={56}
                          height={56}
                          sizeVariant="tiny"
                          className="max-h-full max-w-full object-contain"
                          fallback={
                            <span className="text-xl sm:text-2xl">🛡️</span>
                          }
                        />
                      ) : (
                        <span className="text-xl sm:text-2xl">🛡️</span>
                      )}
                    </div>
                    <span className="truncate text-left text-sm font-black text-[var(--text-white)] sm:text-lg">
                      {match.homeTeam || "Home Team"}
                    </span>
                  </div>

                  {/* CENTER: VS / LIVE SCORE PILL */}
                  <div className="flex shrink-0 flex-col items-center">
                    <div className="flex items-center justify-center rounded-2xl border border-slate-200/80 bg-[var(--bg-main)] px-4 py-2 font-mono text-sm font-black text-[#F8C831] sm:px-6 sm:py-2.5 sm:text-lg dark:border-white/10">
                      {(isLive || isFinished) &&
                      isValidScore(match.homeScore) &&
                      isValidScore(match.awayScore)
                        ? `${sanitizeScore(match.homeScore)} - ${sanitizeScore(match.awayScore)}`
                        : "VS"}
                    </div>
                    {isLive ? (
                      <div className="mt-1.5 flex items-center gap-1.5 rounded-full border border-[#40b857]/20 bg-[#40b857]/10 px-3 py-0.5 text-xs font-extrabold text-[#40b857]">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#40b857]" />
                        <span>{formatLiveTimeOnly(match)}</span>
                      </div>
                    ) : isFinished ? (
                      <div className="mt-1.5 flex items-center gap-1 rounded-full border border-slate-500/20 bg-slate-500/10 px-2.5 py-0.5 text-[11px] font-extrabold tracking-wider text-slate-500 uppercase dark:text-zinc-400">
                        <span>FT</span>
                      </div>
                    ) : null}
                  </div>

                  {/* AWAY TEAM: NAME + LOGO (RIGHT) */}
                  <div className="flex min-w-0 flex-1 items-center justify-end gap-3 sm:gap-4">
                    <span className="truncate text-right text-sm font-black text-[var(--text-white)] sm:text-lg">
                      {match.awayTeam || "Away Team"}
                    </span>
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center p-1 sm:h-14 sm:w-14">
                      {match.awayTeamLogo ? (
                        <OptimizedImage
                          src={match.awayTeamLogo}
                          alt={match.awayTeam || ""}
                          width={56}
                          height={56}
                          sizeVariant="tiny"
                          className="max-h-full max-w-full object-contain"
                          fallback={
                            <span className="text-xl sm:text-2xl">🛡️</span>
                          }
                        />
                      ) : (
                        <span className="text-xl sm:text-2xl">🛡️</span>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="w-full space-y-1 py-2 text-center">
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-0.5 text-xs font-black tracking-wider text-[#F8C831] uppercase">
                    {match.subcategoryLogo || match.categoryLogo ? (
                      <OptimizedImage
                        src={match.subcategoryLogo || match.categoryLogo}
                        alt=""
                        width={20}
                        height={20}
                        sizeVariant="tiny"
                        className="h-4 w-4 object-contain"
                        fallback={<span>🏆</span>}
                      />
                    ) : (
                      <span>🏆</span>
                    )}
                    <span>
                      {match.subcategoryName ||
                        match.categoryName ||
                        "Special Event"}
                    </span>
                  </div>
                  <h1 className="text-lg font-black text-[var(--text-white)] sm:text-2xl">
                    {match.title || match.homeTeam || "Live Stream Event"}
                  </h1>
                </div>
              )}
            </div>

            {/* ========================================================================= */}
            {/* 2. MIDDLE SECTION: VIDEO STREAM PLAYER (891px WIDTH x 500px HEIGHT)        */}
            <div
              suppressHydrationWarning
              className="player-stream-red-border group relative mx-auto w-full max-w-[891px] overflow-hidden rounded-2xl bg-slate-950 shadow-sm sm:rounded-[24px]"
            >
              {/* VIDEO PLAYER CANVAS: 891px x 500px */}
              <div
                suppressHydrationWarning
                className="player-canvas-red-border xs:h-[340px] relative flex h-[240px] w-full items-center justify-center overflow-hidden rounded-2xl bg-black sm:h-[420px] sm:rounded-[24px] md:h-[500px]"
              >
                {/* Stadium backdrop image */}
                <div
                  suppressHydrationWarning
                  className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl sm:rounded-[24px]"
                >
                  <OptimizedImage
                    src={playerBackdrop}
                    alt=""
                    fill
                    sizeVariant="preview"
                    sizes="(max-width: 891px) 100vw, 891px"
                    className="scale-105 object-cover object-center opacity-90 transition-transform duration-700 group-hover:scale-100"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/15 to-black/25" />

                {/* 2A. UNSTARTED OVERLAY SCREEN */}
                {!isPlaying ? (
                  <div
                    onClick={handlePlayClick}
                    className="relative z-10 flex cursor-pointer flex-col items-center justify-center p-6 text-center select-none"
                  >
                    <div className="relative flex items-center justify-center">
                      {/* Subtle Flat Pulse Wave on Hover */}
                      <div className="pointer-events-none absolute -inset-2.5 animate-ping rounded-full border-2 border-[#F8C831]/60 opacity-100 transition-opacity duration-300 group-hover:animate-ping group-hover:opacity-100 sm:-inset-3" />

                      {/* Clean Flat Modern Highlighted Play Button with crisp border */}
                      <button
                        type="button"
                        onClick={handlePlayClick}
                        className="relative flex h-16 w-16 cursor-pointer items-center justify-center rounded-full border-2 border-white bg-[#f8c831b3] text-black shadow-xl shadow-yellow-500/30 transition-all duration-300 group-hover:scale-110 group-hover:border-white group-hover:bg-yellow-400 group-hover:shadow-yellow-500/50 active:scale-95 sm:h-20 sm:w-20 sm:border-[3px]"
                        title="Click to Start Streaming"
                      >
                        <Play className="ml-1 h-7 w-7 fill-white text-white sm:h-9 sm:w-9" />
                      </button>
                    </div>
                  </div>
                ) : isConnecting ? (
                  /* 2B. CONNECTING SPINNER PHASE */
                  <div className="relative z-20 flex h-full w-full items-center justify-center bg-black/25 backdrop-blur-[2px]">
                    <div className="h-14 w-14 animate-spin rounded-full border-4 border-[#F8C831] border-t-transparent drop-shadow-[0_0_12px_rgba(248,200,49,0.8)]" />
                  </div>
                ) : null}

                {/* 2C. STREAM SIGN UP (PRE-RENDERED ON PAGE LOAD FOR INSTANT ZERO-DELAY AD DISPLAY) */}
                <div
                  className={`no-scrollbar fixed inset-0 z-[9999999999] items-center justify-center overflow-y-auto bg-black/75 p-4 backdrop-blur-md transition-all duration-200 sm:absolute sm:z-30 sm:bg-transparent sm:p-0 sm:backdrop-blur-none dark:bg-black/85 ${
                    showStreamModal && !isConnecting && isPlaying
                      ? "pointer-events-auto visible flex opacity-100"
                      : "pointer-events-none invisible flex opacity-0"
                  }`}
                >
                  <div className="my-auto flex w-full max-w-sm flex-col justify-between space-y-3 rounded-2xl border border-slate-200 bg-[var(--bg-card)] p-4 text-[var(--text-white)] shadow-2xl sm:my-0 sm:h-full sm:w-full sm:max-w-none sm:space-y-4 sm:rounded-none sm:border-none sm:bg-[var(--bg-card)]/95 sm:p-6 sm:shadow-none dark:border-white/10">
                    {/* TOP BAR */}
                    <div className="flex shrink-0 items-center justify-between border-b border-slate-100 pb-2.5 dark:border-white/10">
                      <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-white)] sm:text-sm">
                        <Tv className="h-4 w-4 text-[#008ba3] dark:text-cyan-400" />
                        <span className="max-w-[200px] truncate font-extrabold tracking-wide uppercase sm:max-w-md">
                          {matchTitle}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setShowStreamModal(false)
                          setIsPlaying(false)
                        }}
                        className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-[var(--bg-card-hover)] text-[var(--text-muted)] transition-colors hover:text-[var(--text-white)]"
                        title="Close Stream Overlay"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    {/* CENTER BODY */}
                    <div className="my-auto flex flex-1 flex-col items-center justify-center space-y-3 py-2 text-center sm:space-y-4">
                      <h2 className="text-sm font-black tracking-tight text-[var(--text-white)] sm:text-xl">
                        Please Sign Up to Watch live
                      </h2>

                      {/* CYAN CALL TO ACTION BUTTON */}
                      {(() => {
                        const rawLink =
                          (match?.referralLink && match.referralLink.trim()) ||
                          (match?.subcategoryReferralLink &&
                            match.subcategoryReferralLink.trim()) ||
                          (match?.categoryReferralLink &&
                            match.categoryReferralLink.trim()) ||
                          (adsSettings.membershipReferralLink &&
                            adsSettings.membershipReferralLink.trim()) ||
                          (adsSettings.globalSignInReferralLink &&
                            adsSettings.globalSignInReferralLink.trim()) ||
                          "#"
                        const finalUrl = formatExternalUrl(rawLink)

                        return (
                          <a
                            href={finalUrl}
                            target="_self"
                            rel="noopener noreferrer"
                            className="animate-border-pulse flex h-12 w-full max-w-xs cursor-pointer items-center justify-center gap-0 rounded-xl border border-[#ffe885] bg-[#f6c324] px-6 py-3 text-center text-xs font-black tracking-wider text-black uppercase hover:bg-[#fad450] active:scale-95 sm:rounded-2xl sm:text-sm"
                          >
                            <span>SIGN UP & WATCH NOW</span>

                            <MoveRight className="h-4 w-8 stroke-[2.8]" />
                          </a>
                        )
                      })()}

                      {/* SIGNUP AD BANNER - PRE-RENDERED ON PAGE LOAD FOR ZERO DELAY */}
                      {(adsSettings.modalSignupAds || adsSettings.navAds) && (
                        <div className="my-1.5 flex min-h-[52px] w-full max-w-[340px] items-center justify-center bg-transparent">
                          <AdRenderer
                            uniqueKey={`modal-ad-${matchSlug}`}
                            code={
                              adsSettings.modalSignupAds || adsSettings.navAds
                            }
                          />
                        </div>
                      )}

                      {/* 4 FEATURE PILLS GRID */}
                      <div className="grid w-full max-w-xs grid-cols-1 gap-2 pt-1 text-left text-[11px] font-bold text-[var(--text-white)] sm:grid-cols-2">
                        <div className="flex items-center gap-2 rounded-xl border border-slate-200/80 bg-[var(--bg-main)] p-2 backdrop-blur-sm sm:p-2.5 dark:border-white/10">
                          <Film className="h-3.5 w-3.5 shrink-0 text-[#008ba3] dark:text-cyan-400" />
                          <span className="truncate">
                            High Quality Streaming
                          </span>
                        </div>
                        <div className="flex items-center gap-2 rounded-xl border border-slate-200/80 bg-[var(--bg-main)] p-2 backdrop-blur-sm sm:p-2.5 dark:border-white/10">
                          <Zap className="h-3.5 w-3.5 shrink-0 text-[#008ba3] dark:text-cyan-400" />
                          <span className="truncate">Watch Without Limits</span>
                        </div>
                        <div className="flex items-center gap-2 rounded-xl border border-slate-200/80 bg-[var(--bg-main)] p-2 backdrop-blur-sm sm:p-2.5 dark:border-white/10">
                          <Ban className="h-3.5 w-3.5 shrink-0 text-[#008ba3] dark:text-cyan-400" />
                          <span className="truncate">
                            No Ads, 100% Free Access
                          </span>
                        </div>
                        <div className="flex items-center gap-2 rounded-xl border border-slate-200/80 bg-[var(--bg-main)] p-2 backdrop-blur-sm sm:p-2.5 dark:border-white/10">
                          <Smartphone className="h-3.5 w-3.5 shrink-0 text-[#008ba3] dark:text-cyan-400" />
                          <span className="truncate">Watch on any device</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* PLAYER BOTTOM CONTROL BAR */}
                <div className="absolute inset-x-0 bottom-0 z-20 flex items-center justify-between bg-gradient-to-t from-black/90 via-black/70 to-transparent p-3 text-white sm:p-4">
                  {/* LEFT CONTROLS: PLAY & VOLUME */}
                  <div className="flex items-center gap-3 sm:gap-4">
                    <button
                      onClick={handlePlayClick}
                      className="p-1 transition-colors hover:text-[#F8C831]"
                    >
                      <Play
                        className={`h-4 w-4 sm:h-5 sm:w-5 ${isPlaying ? "fill-white" : ""}`}
                      />
                    </button>
                    <button className="p-1 transition-colors hover:text-[#F8C831]">
                      <Volume2 className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                  </div>

                  {/* RIGHT CONTROLS: RED LIVE BADGE, SETTINGS GEAR, FULLSCREEN */}
                  <div className="flex items-center gap-3 sm:gap-4">
                    {/* RED LIVE PILL BADGE */}
                    <span className="flex items-center gap-1 rounded-md border border-red-500/40 bg-red-600/30 px-2.5 py-0.5 font-mono text-[10px] font-black tracking-widest text-red-500 sm:text-xs">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
                      LIVE
                    </span>

                    {/* SETTINGS GEAR */}
                    <button
                      className="p-1 transition-colors hover:text-[#F8C831]"
                      title="Settings"
                    >
                      <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>

                    {/* FULLSCREEN */}
                    <button
                      className="p-1 transition-colors hover:text-[#F8C831]"
                      title="Fullscreen"
                    >
                      <Maximize2 className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* 3. BOTTOM SECTION: MATCH DETAILS (TIME, LOCATION, LEAGUE, OTHERS)          */}
            {/* ========================================================================= */}
            <div className="mx-auto w-full max-w-[891px] space-y-4 rounded-2xl border border-slate-200/80 bg-[var(--bg-card)] p-5 shadow-sm sm:p-6 dark:border-white/10">
              <div className="border-b border-slate-100 pb-3 dark:border-white/10">
                <h3 className="flex items-center gap-2 text-base font-black text-[var(--text-white)]">
                  <Trophy className="h-4 w-4 text-[#F8C831]" /> Event Details &
                  Schedule
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs sm:grid-cols-4 sm:text-sm">
                {/* Time */}
                <div
                  suppressHydrationWarning
                  className="space-y-1 rounded-xl border border-slate-200/80 bg-[var(--bg-main)] p-3.5 dark:border-white/10"
                >
                  <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-[var(--text-muted)] uppercase">
                    <Clock3 className="h-3.5 w-3.5 shrink-0 text-indigo-400" />
                    <span>Match Time</span>
                  </div>
                  <div
                    suppressHydrationWarning
                    className="font-mono font-extrabold text-[var(--text-white)]"
                  >
                    {timeFormatted}
                  </div>
                </div>

                {/* Date */}
                <div
                  suppressHydrationWarning
                  className="space-y-1 rounded-xl border border-slate-200/80 bg-[var(--bg-main)] p-3.5 dark:border-white/10"
                >
                  <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-[var(--text-muted)] uppercase">
                    <CalendarDays className="h-3.5 w-3.5 shrink-0 text-[#F8C831]" />
                    <span>Match Date</span>
                  </div>
                  <div
                    suppressHydrationWarning
                    className="font-extrabold text-[var(--text-white)]"
                  >
                    {dateFormatted}
                  </div>
                </div>

                {/* Location / Venue */}
                <div className="space-y-1 rounded-xl border border-slate-200/80 bg-[var(--bg-main)] p-3.5 dark:border-white/10">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-[var(--text-muted)] uppercase">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                    <span>Location / Venue</span>
                  </div>
                  <div className="truncate font-extrabold text-[var(--text-white)]">
                    {match.venue || "Stadium Venue"}
                  </div>
                </div>

                {/* Tournament / League (Clickable Link to Subcategory Page) */}
                {(() => {
                  const catSlug = slugify(
                    match?.categoryName || categorySlug || "sport"
                  )
                  const subSlug = match?.subcategoryName
                    ? slugify(match.subcategoryName)
                    : subcategorySlug !== "all"
                      ? subcategorySlug
                      : ""
                  const subcategoryLink = subSlug
                    ? `/${catSlug}/${subSlug}`
                    : `/${catSlug}`

                  return (
                    <Link
                      href={subcategoryLink}
                      className="group block cursor-pointer space-y-1 rounded-xl border border-slate-200/80 bg-[var(--bg-main)] p-3.5 transition-all hover:border-[#F8C831] hover:bg-[var(--bg-card-hover)] dark:border-white/10"
                    >
                      <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-[var(--text-muted)] uppercase transition-colors group-hover:text-[#F8C831]">
                        <Trophy className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                        <span>Tournament</span>
                      </div>
                      <div className="flex items-center justify-between gap-1 truncate font-extrabold text-[var(--text-white)] transition-colors group-hover:text-[#F8C831]">
                        <span className="truncate">
                          {displaySubcategory} ({displayCategory})
                        </span>
                        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[var(--text-muted)] group-hover:text-[#F8C831]" />
                      </div>
                    </Link>
                  )
                })()}
              </div>
            </div>

            {/* 4. RELATED MATCHES SECTION */}
            {relatedMatches.length > 0 && (
              <div className="mx-auto w-full max-w-[891px] space-y-4 pt-4">
                <div className="flex items-center justify-between border-b border-[var(--border-glass)] pb-2">
                  <h3 className="flex items-center gap-2 text-base font-black text-[var(--text-white)]">
                    <Radio className="h-4 w-4 text-[#F8C831]" /> More Events
                  </h3>
                  <Link
                    href={`/${slugify(displayCategory)}`}
                    className="text-xs font-bold text-[#F8C831] hover:underline"
                  >
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
  )
}
