"use client"

import React, { useEffect, useState, useRef } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import api from "@/lib/api"
import { getCategories } from "@/lib/categories"
import { slugify } from "@/lib/utils"
import { AdRenderer } from "../ads/AdRenderer"
import { startTopLoader } from "./TopLoadingBar"

import type { AdsSettings } from "@/lib/adsCache"
import { getAdsSettingsSync, setAdsSettingsCache } from "@/lib/adsCache"

// Module-level memory — initialized from cache for instant 0ms display on load
let _adCode = ""
let _membershipLink = ""

if (typeof window !== "undefined") {
  try {
    const cached = getAdsSettingsSync()
    if (cached) {
      _adCode = cached.navAds || cached.modalSignupAds || ""
      _membershipLink = cached.membershipReferralLink || ""
    }
  } catch (e) {}
}

const fetchAdData = (signal?: AbortSignal): Promise<void> =>
  fetch("/api/ads/fast", signal ? { signal } : {})
    .then((r) => r.json())
    .then((data) => {
      const s = data?.data?.settings
      if (s) {
        _adCode = s.navAds || s.modalSignupAds || ""
        _membershipLink = s.membershipReferralLink || ""
        setAdsSettingsCache(s)
      }
    })
    .catch(() => {})

import {
  Search,
  Tv,
  Moon,
  Sun,
  X,
  Menu,
  MoreHorizontal,
  Home,
  Sparkles,
  Zap,
  RotateCcw,
  ExternalLink,
  ChevronRight,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

export type { AdsSettings }

export interface Category {
  id: number
  sportName: string
  iconUrl?: string
  thumbUrl?: string
}

// Helper icon mapping for sports
const getSportIcon = (name: string): React.ReactNode => {
  const n = (name || "").toLowerCase()
  // High School / HS gets a distinct colored football (Electric Blue / Cyan hue)
  if (n.includes("high school") || n.includes("hs")) {
    return (
      <span
        className="inline-block contrast-[115%] hue-rotate-[160deg] saturate-[220%] filter"
        title="High School Football"
      >
        🏈
      </span>
    )
  }
  // American Football / NFL gets standard brown football
  if (n.includes("nfl") || n.includes("americ")) return "🏈"
  if (n.includes("foot") || n.includes("socc")) return "⚽"
  if (n.includes("fight") || n.includes("ufc") || n.includes("box")) return "🥊"
  if (n.includes("formu") || n.includes("motor") || n.includes("f1"))
    return "🏎️"
  if (n.includes("rugb") || n.includes("afl")) return "🏉"
  if (n.includes("base") || n.includes("mlb")) return "⚾"
  if (n.includes("bask") || n.includes("nba")) return "🏀"
  if (n.includes("tenn") || n.includes("ping")) return "🎾"
  if (n.includes("voll") || n.includes("volly")) return "🏐"
  if (n.includes("cycl") || n.includes("bike")) return "🚴"
  if (n.includes("cric")) return "🏏"
  if (n.includes("golf")) return "⛳"
  if (n.includes("ice") || n.includes("nhl")) return "🏒"
  if (n.includes("esport") || n.includes("game")) return "🎮"
  if (n.includes("other")) return "⭐"
  return "🏆"
}

// Helper to ensure valid external URL
const formatExternalUrl = (url?: string) => {
  if (!url || !url.trim()) return "#"
  const trimmed = url.trim()
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed
  }
  return `https://${trimmed}`
}

const DEFAULT_CATEGORIES: Category[] = [
  { id: 1, sportName: "Soccer" },
  { id: 2, sportName: "Motorsport" },
  { id: 3, sportName: "Fighting" },
  { id: 5, sportName: "American Football" },
  { id: 4, sportName: "Basketball" },
  { id: 6, sportName: "Rugby" },
  { id: 7, sportName: "Tennis" },
  { id: 8, sportName: "Cycling" },
  { id: 9, sportName: "Volleyball" },
  { id: 10, sportName: "Table Tennis" },
  { id: 11, sportName: "Others" },
]

interface NavbarProps {
  initialAdsSettings?: AdsSettings
}

export const Navbar: React.FC<NavbarProps> = ({ initialAdsSettings }) => {
  const pathname = usePathname()
  const router = useRouter()
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState<boolean>(false)
  const [scrolled, setScrolled] = useState<boolean>(false)
  // Read from initial SSR settings or module memory instantly (0ms) — populated on first HTML load!
  const [navAdCode, setNavAdCode] = useState<string>(
    () =>
      initialAdsSettings?.navAds ||
      initialAdsSettings?.modalSignupAds ||
      _adCode
  )
  const [membershipLink, setMembershipLink] = useState<string>(
    () => initialAdsSettings?.membershipReferralLink || _membershipLink
  )
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES)
  const [activeCategoryId, setActiveCategoryId] = useState<string>("home")

  // Sync initial SSR settings into memory immediately if provided
  useEffect(() => {
    if (
      initialAdsSettings &&
      (initialAdsSettings.navAds || initialAdsSettings.membershipReferralLink)
    ) {
      _adCode =
        initialAdsSettings.navAds ||
        initialAdsSettings.modalSignupAds ||
        _adCode
      _membershipLink =
        initialAdsSettings.membershipReferralLink || _membershipLink
      setNavAdCode(_adCode)
      setMembershipLink(_membershipLink)
      setAdsSettingsCache(initialAdsSettings)
    }
  }, [initialAdsSettings])

  // Fetch & sync fresh ad data on mount and on route navigation (category, subcategory, single match)
  useEffect(() => {
    // 1. Show cached memory data instantly (0ms) while fresh fetch is in-flight
    if (_adCode) {
      setNavAdCode(_adCode)
      setMembershipLink(_membershipLink)
    }

    // 2. Fetch fresh data from backend (silent background update)
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 1500)
    fetchAdData(controller.signal).then(() => {
      if (_adCode) setNavAdCode(_adCode)
      if (_membershipLink) setMembershipLink(_membershipLink)
      clearTimeout(timer)
    })

    return () => {
      controller.abort()
      clearTimeout(timer)
    }
  }, [pathname])

  const navigateToCategory = (catSlug: string) => {
    startTopLoader()
    router.push(`/${catSlug}`)
    setTimeout(() => {
      setIsMoreOpen(false)
      setLeftDrawerOpen(false)
    }, 100)
  }

  // Sync active category with current route pathname & scroll to top under sticky navbar
  useEffect(() => {
    setIsMoreOpen(false)
    setLeftDrawerOpen(false)

    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "instant" })
    }

    if (!pathname || pathname === "/") {
      setActiveCategoryId("home")
      return
    }

    const pathSegments = pathname.split("/").filter(Boolean)
    const categorySegment = pathSegments[0] ? pathSegments[0].toLowerCase() : ""

    const matchedCategory = categories.find(
      (cat) =>
        slugify(cat.sportName) === categorySegment ||
        String(cat.id) === categorySegment
    )

    if (matchedCategory) {
      setActiveCategoryId(String(matchedCategory.id))
    } else {
      setActiveCategoryId("")
    }
  }, [pathname, categories])

  // Search & Navigation States
  const [searchQuery, setSearchQuery] = useState<string>("")

  const [leftDrawerOpen, setLeftDrawerOpen] = useState<boolean>(false)
  const [isMoreOpen, setIsMoreOpen] = useState<boolean>(false)
  const [isTvModalOpen, setIsTvModalOpen] = useState<boolean>(false)

  const moreRef = useRef<HTMLDivElement>(null)

  const handleSearchSubmit = (overrideQuery?: string) => {
    const q = (overrideQuery !== undefined ? overrideQuery : searchQuery).trim()
    if (!q) return
    setLeftDrawerOpen(false)
    startTopLoader()
    router.push(`/search?q=${encodeURIComponent(q)}`)
  }

  useEffect(() => {
    setMounted(true)

    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Close ... More dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(event.target as Node)) {
        setIsMoreOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Fetch Categories
  useEffect(() => {
    getCategories()
      .then((sportsData) => {
        if (sportsData && sportsData.length > 0) setCategories(sportsData)
      })
      .catch(() => {})
  }, [])

  const toggleDarkMode = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark")
  }

  const isDark = resolvedTheme === "dark"

  // Dynamic categories strictly from Backend DB
  const mobileVisibleCategories = categories.slice(0, 4)
  const mobileMoreCategories = categories.slice(4)

  // Desktop visible categories (first 6) & remaining
  const visibleCategories = categories.slice(0, 6)
  const moreCategories = categories.slice(6)

  return (
    <>
      <header
        className={`sticky top-0 z-[100] w-full transition-all duration-300 ${
          scrolled
            ? "border-b border-[var(--border-glass)] bg-[var(--bg-header)] backdrop-blur-md"
            : "border-b border-[var(--border-glass)] bg-[var(--bg-header)] backdrop-blur-sm"
        }`}
      >
        {/* 1. TOP HEADER ROW */}
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 sm:px-6">
          {/* BRAND LOGO */}
          <Link href="/" className="group flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-rose-600 via-amber-500 to-yellow-400 shadow-md">
              <Tv className="h-5 w-5 text-white" />
            </div>
            <div className="flex items-baseline text-xl font-black tracking-tight text-[var(--text-white)] sm:text-2xl">
              STREAM<span className="text-[#F8C831]">ESPN</span>
            </div>
          </Link>

          {/* DESKTOP TOP UTILITIES */}
          <div className="hidden items-center gap-3 sm:flex">
            {/* SEARCH INPUT BAR */}
            <div className="relative">
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  handleSearchSubmit()
                }}
                className="group flex h-9 w-48 items-center rounded-full border border-slate-200 bg-slate-100/80 pr-1 pl-5 shadow-2xs transition-all duration-300 focus-within:w-56 focus-within:border-[#F8C831] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#F8C831]/20 hover:border-slate-300 hover:bg-slate-100 sm:w-60 sm:focus-within:w-68 md:w-72 md:focus-within:w-76 dark:border-white/10 dark:bg-neutral-800/60 dark:focus-within:bg-neutral-900 dark:hover:border-white/20 dark:hover:bg-neutral-800/90"
              >
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      handleSearchSubmit()
                    }
                  }}
                  placeholder="Search matches, leagues..."
                  className="w-full bg-transparent pl-2 text-xs font-medium tracking-normal text-neutral-900 placeholder:text-slate-400 focus:outline-none sm:text-sm dark:text-neutral-100 dark:placeholder:text-neutral-500"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="mr-1 flex h-5 w-5 cursor-pointer items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-200/70 hover:text-neutral-700 dark:hover:bg-neutral-700/60 dark:hover:text-neutral-200"
                    title="Clear"
                  >
                    <X className="h-3 w-3 stroke-[2.5]" />
                  </button>
                )}
                <button
                  type="submit"
                  onClick={(e) => {
                    e.preventDefault()
                    handleSearchSubmit()
                  }}
                  title="Search"
                  className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full bg-[#F8C831] text-neutral-950 shadow-2xs transition-all hover:bg-yellow-400 hover:shadow-xs active:scale-90"
                >
                  <Search className="h-3.5 w-3.5 stroke-[2.5]" />
                </button>
              </form>
            </div>

            {/* DARK / LIGHT THEME TOGGLER */}
            <button
              onClick={toggleDarkMode}
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-slate-100/80 text-slate-600 shadow-2xs transition-all hover:border-[#F8C831] hover:border-slate-300 hover:bg-slate-100 hover:text-[#F8C831] dark:border-white/10 dark:bg-neutral-800/60 dark:text-neutral-300 dark:hover:border-white/20 dark:hover:bg-neutral-800/90"
              title="Toggle Dark / Light Theme"
            >
              {mounted && isDark ? (
                <Moon className="h-4 w-4 text-[#F8C831]" />
              ) : (
                <Sun className="h-4 w-4 text-amber-500" />
              )}
            </button>
          </div>

          {/* MOBILE TOP RIGHT: MENU BUTTON (☰ Menu) */}
          <div className="flex items-center gap-2 sm:hidden">
            <button
              onClick={() => setLeftDrawerOpen(true)}
              className="flex items-center gap-1.5 rounded-[3px] border border-[var(--border-glass)] bg-[var(--bg-card)] px-3.5 py-1.5 text-xs font-extrabold text-[var(--text-white)] hover:border-[#F8C831]"
            >
              <Menu className="h-4 w-4 text-[#F8C831]" />
              <span>Menu</span>
            </button>
          </div>
        </div>

        {/* 2. SUB-NAVBAR CATEGORIES ROW */}

        {/* DESKTOP SUB-NAVBAR */}
        <div className="relative hidden border-t border-[var(--border-glass)] bg-[var(--bg-subnav)] px-4 sm:block sm:px-3">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 overflow-visible px-4">
            {/* HORIZONTAL SCROLLABLE CATEGORIES LIST */}
            <div className="no-scrollbar flex flex-1 items-center gap-1 overflow-x-auto py-1.5 text-xs font-bold sm:gap-2 sm:text-sm">
              <Link
                href="/"
                scroll={false}
                className={`relative flex shrink-0 items-center gap-2 px-3.5 py-2 text-xs font-bold transition-all sm:px-4 sm:text-sm ${
                  activeCategoryId === "home"
                    ? "border-b-2 border-[#F8C831] font-black text-[var(--text-white)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text-white)]"
                }`}
              >
                <Home className="h-4 w-4" />
                <span>Home</span>
              </Link>

              {visibleCategories.map((cat) => {
                const isActive = activeCategoryId === String(cat.id)
                const icon = getSportIcon(cat.sportName)
                const catSlug = slugify(cat.sportName)
                return (
                  <Link
                    key={cat.id}
                    href={`/${catSlug}`}
                    scroll={false}
                    className={`flex shrink-0 items-center gap-2 px-3.5 py-2 text-xs font-bold transition-all sm:px-4 sm:text-sm ${
                      isActive
                        ? "border-b-2 border-[#F8C831] font-black text-[var(--text-white)]"
                        : "text-[var(--text-muted)] hover:text-[var(--text-white)]"
                    }`}
                  >
                    <span className="text-base sm:text-lg">{icon}</span>
                    <span>{cat.sportName}</span>
                  </Link>
                )
              })}
            </div>

            {/* DESKTOP ... MORE BUTTON WITH DROPDOWN MENU */}
            {moreCategories.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger
                  className={`flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all sm:px-4 sm:text-sm ${
                    moreCategories.some(
                      (c) => String(c.id) === activeCategoryId
                    )
                      ? "bg-[#F8C831] font-black text-black shadow-md"
                      : "text-[var(--text-muted)] hover:text-[var(--text-white)]"
                  }`}
                >
                  <MoreHorizontal className="h-4 w-4" />
                  <span>More</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-80 p-3" align="end">
                  <DropdownMenuGroup className="no-scrollbar grid max-h-64 grid-cols-2 gap-1.5 overflow-y-auto">
                    {moreCategories.map((cat) => {
                      const icon = getSportIcon(cat.sportName)
                      const isSelected = activeCategoryId === String(cat.id)
                      const catSlug = slugify(cat.sportName)
                      return (
                        <DropdownMenuItem
                          key={cat.id}
                          onClick={() =>
                            router.push(`/${catSlug}`, { scroll: false })
                          }
                          className={`flex cursor-pointer items-center gap-2.5 rounded-xl p-2 text-left text-xs font-bold transition-all sm:text-sm ${
                            isSelected
                              ? "bg-[#F8C831] font-black text-black shadow-md"
                              : "text-[var(--text-white)] hover:bg-[var(--bg-card-hover)]"
                          }`}
                        >
                          <span className="shrink-0 text-base">{icon}</span>
                          <span className="truncate">{cat.sportName}</span>
                        </DropdownMenuItem>
                      )
                    })}
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* MOBILE CIRCLE CATEGORY ICONS BAR */}
        <div className="border-t border-[var(--border-glass)] bg-[var(--bg-subnav)] px-4 py-2.5 sm:hidden">
          <div className="flex items-center justify-around gap-2">
            {mobileVisibleCategories.map((cat) => {
              const isActive = activeCategoryId === String(cat.id)
              const icon = getSportIcon(cat.sportName)
              const catSlug = slugify(cat.sportName)
              return (
                <Link
                  key={cat.id}
                  href={`/${catSlug}`}
                  scroll={false}
                  className="group flex cursor-pointer flex-col items-center gap-1"
                >
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-full text-xl transition-all ${
                      isActive
                        ? "border-2 border-[#F8C831] bg-[#F8C831]/20 shadow-lg shadow-yellow-500/20"
                        : "border border-[var(--border-glass)] bg-[var(--bg-card)] group-hover:border-[#F8C831]"
                    }`}
                  >
                    {icon}
                  </div>
                  <span
                    className={`text-[11px] font-bold ${isActive ? "text-[#F8C831]" : "text-[var(--text-white)]"}`}
                  >
                    {cat.sportName}
                  </span>
                </Link>
              )
            })}

            {/* MOBILE MORE CIRCLE BUTTON WITH DROPDOWN MENU */}
            {mobileMoreCategories.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger className="group flex cursor-pointer flex-col items-center gap-1 outline-none">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#F8C831] bg-amber-400/10 font-black text-[#F8C831] shadow-md">
                    <MoreHorizontal className="h-5 w-5" />
                  </div>
                  <span className="text-[11px] font-extrabold text-[var(--text-white)]">
                    More
                  </span>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-[340px] max-w-[90vw] p-4"
                  align="center"
                >
                  <DropdownMenuGroup className="no-scrollbar grid max-h-[60vh] grid-cols-3 gap-x-2 gap-y-5 overflow-y-auto py-2 text-center">
                    {(mobileMoreCategories.length > 0
                      ? mobileMoreCategories
                      : categories
                    ).map((cat) => {
                      const icon = getSportIcon(cat.sportName)
                      const isSelected = activeCategoryId === String(cat.id)
                      const catSlug = slugify(cat.sportName)
                      return (
                        <DropdownMenuItem
                          key={cat.id}
                          onClick={() =>
                            router.push(`/${catSlug}`, { scroll: false })
                          }
                          className="group flex cursor-pointer flex-col items-center justify-center rounded-xl p-2 focus:bg-white/10"
                        >
                          <div
                            className={`flex h-12 w-12 items-center justify-center rounded-full text-xl transition-all ${
                              isSelected
                                ? "bg-[#F8C831] text-black shadow-md ring-2 ring-[#F8C831]"
                                : "border border-[var(--border-glass)] bg-[var(--bg-card-hover)] group-hover:scale-105 group-hover:border-[#F8C831]"
                            }`}
                          >
                            {icon}
                          </div>
                          <span
                            className={`mt-1.5 max-w-full truncate text-[11px] font-bold ${isSelected ? "text-[#F8C831]" : "text-[var(--text-white)]"}`}
                          >
                            {cat.sportName}
                          </span>
                        </DropdownMenuItem>
                      )
                    })}
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* 3. NAVBAR AD BANNER SLOT */}
        <div
          suppressHydrationWarning
          className="flex w-full items-center justify-center border-t border-[var(--border-glass)] bg-[var(--bg-header)] px-4 py-1.5"
        >
          <div className="mx-auto flex w-full max-w-7xl items-center justify-center">
            <AdRenderer
              uniqueKey="nav-ad"
              refreshKey={pathname}
              code={navAdCode}
            />
          </div>
        </div>
      </header>

      {/* LEFT SIDE DRAWER MENU (PURE WHITE IN LIGHT MODE, SLEEK CHARCOAL IN DARK MODE) */}
      {leftDrawerOpen && (
        <div className="fixed inset-0 z-[999999] flex">
          {/* BACKDROP */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setLeftDrawerOpen(false)}
          />

          {/* SLIDE-OVER DRAWER CONTENT */}
          <div className="relative z-[999999] flex w-80 max-w-[80vw] flex-col justify-between space-y-6 overflow-y-auto border-r border-[var(--border-glass)] bg-[var(--bg-card)] p-5 text-[var(--text-white)] shadow-2xl">
            <div className="space-y-6">
              {/* DRAWER HEADER */}
              <div className="flex items-center justify-between border-b border-[var(--border-glass)] pb-4">
                <Link
                  href="/"
                  onClick={() => setLeftDrawerOpen(false)}
                  className="flex items-center gap-2"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-base font-black text-black shadow-md">
                    🏆
                  </div>
                  <span className="text-lg font-black tracking-tight text-[var(--text-white)]">
                    STREAM<span className="text-[#F8C831]">ESPN</span>
                  </span>
                </Link>

                <button
                  onClick={() => setLeftDrawerOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--bg-card-hover)] text-[var(--text-muted)] transition-colors hover:text-[var(--text-white)]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* SEARCH INPUT BAR */}
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  handleSearchSubmit()
                }}
                className="space-y-2"
              >
                <label className="text-xs font-black tracking-wider text-[var(--text-muted)] uppercase">
                  Search Events
                </label>
                <div className="flex h-10 items-center rounded-xl border border-slate-200 bg-slate-100/80 pr-1.5 pl-4 transition-all focus-within:border-[#F8C831] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#F8C831]/20 hover:border-slate-300 dark:border-white/10 dark:bg-neutral-800/60 dark:focus-within:bg-neutral-900 dark:hover:border-white/20">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        handleSearchSubmit()
                      }
                    }}
                    placeholder="Search teams, events, leagues..."
                    className="w-full bg-transparent py-1 text-xs font-semibold text-neutral-900 placeholder:text-slate-400 focus:outline-none dark:text-neutral-100 dark:placeholder:text-neutral-500"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="mr-1 flex h-5 w-5 cursor-pointer items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-200/70 hover:text-neutral-700 dark:hover:bg-neutral-700/60 dark:hover:text-neutral-200"
                      title="Clear"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button
                    type="submit"
                    onClick={(e) => {
                      e.preventDefault()
                      handleSearchSubmit()
                    }}
                    title="Search"
                    className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-[#F8C831] text-neutral-950 shadow-2xs transition-all hover:bg-yellow-400 active:scale-90"
                  >
                    <Search className="h-3.5 w-3.5 stroke-[2.5]" />
                  </button>
                </div>
              </form>

              {/* CATEGORIES LIST FROM BACKEND */}
              <div className="space-y-2 border-t border-[var(--border-glass)] pt-2">
                <label className="text-xs font-black tracking-wider text-[var(--text-muted)] uppercase">
                  Sports Categories
                </label>
                <div className="space-y-1">
                  <Link
                    href="/"
                    onClick={() => setLeftDrawerOpen(false)}
                    className={`flex w-full items-center justify-between rounded-xl p-2.5 text-xs font-extrabold transition-all ${
                      activeCategoryId === "home"
                        ? "bg-[#F8C831] text-black shadow-sm"
                        : "text-[var(--text-white)] hover:bg-[var(--bg-card-hover)]"
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Home className="h-4 w-4" /> Home
                    </span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>

                  {categories.map((cat) => {
                    const icon = getSportIcon(cat.sportName)
                    const isSelected = activeCategoryId === String(cat.id)
                    const catSlug = slugify(cat.sportName)
                    return (
                      <Link
                        key={cat.id}
                        href={`/${catSlug}`}
                        onClick={() => {
                          setLeftDrawerOpen(false)
                          router.push(`/${catSlug}`, { scroll: false })
                        }}
                        className={`flex w-full cursor-pointer items-center justify-between rounded-xl p-2.5 text-xs font-extrabold transition-all ${
                          isSelected
                            ? "bg-[#F8C831] text-black shadow-sm"
                            : "text-[var(--text-white)] hover:bg-[var(--bg-card-hover)]"
                        }`}
                      >
                        <span className="flex items-center gap-2.5">
                          <span className="text-base">{icon}</span>
                          <span>{cat.sportName}</span>
                        </span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* DRAWER FOOTER WITH THEME SWITCHER */}
            <div className="flex items-center justify-between border-t border-[var(--border-glass)] pt-4 text-xs font-bold text-[var(--text-muted)]">
              <span>Theme Mode</span>
              <button
                onClick={toggleDarkMode}
                className="flex items-center gap-2 rounded-xl border border-[var(--border-glass)] bg-[var(--bg-card-hover)] px-3 py-1.5 text-xs font-extrabold text-[var(--text-white)]"
              >
                {mounted && isDark ? (
                  <Moon className="h-3.5 w-3.5 text-[#F8C831]" />
                ) : (
                  <Sun className="h-3.5 w-3.5 text-amber-500" />
                )}
                <span>{mounted && isDark ? "Dark" : "Light"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TV STREAMING GUIDE MODAL */}
      {isTvModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-md space-y-4 rounded-2xl border border-[var(--border-glass)] bg-[var(--bg-card)] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--border-glass)] pb-3">
              <h3 className="flex items-center gap-2 text-sm font-bold text-[var(--text-white)] sm:text-base">
                <Tv className="h-4 w-4 text-[#F8C831]" /> Watch StreamESPN on
                Smart TV
              </h3>
              <button
                onClick={() => setIsTvModalOpen(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text-white)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3 text-xs leading-relaxed text-[var(--text-muted)] sm:text-sm">
              <p>
                1. Open your Smart TV Browser (Samsung Tizen, LG webOS, Android
                TV, Fire TV).
              </p>
              <p>
                2. Navigate to{" "}
                <span className="font-bold text-[#F8C831]">
                  https://streamespn.com
                </span>
                .
              </p>
              <p>
                3. Select any live match and enjoy Full HD 1080p lag-free
                streaming directly on your TV!
              </p>
            </div>
            <button
              onClick={() => setIsTvModalOpen(false)}
              className="w-full rounded-xl bg-[#F8C831] py-2.5 text-xs font-bold text-black hover:bg-yellow-400 sm:text-sm"
            >
              Got it, Close
            </button>
          </div>
        </div>
      )}
    </>
  )
}
