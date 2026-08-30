'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import api from '@/lib/api';
import { getCategories } from '@/lib/categories';
import { slugify } from '@/lib/utils';
import { AdRenderer } from '../ads/AdRenderer';
import { startTopLoader } from './TopLoadingBar';
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
  ChevronRight
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

export interface AdsSettings {
  headAds?: string;
  navAds?: string;
  modalSignupAds?: string;
  footerAds?: string;
  floatMobileAds?: string;
  floatDesktopAds?: string;
  histatsScript?: string;
  membershipReferralLink?: string;
  globalSignInReferralLink?: string;
}

export interface Category {
  id: number;
  sportName: string;
  iconUrl?: string;
  thumbUrl?: string;
}

// Helper icon mapping for sports
const getSportIcon = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('foot') || n.includes('socc')) return '⚽';
  if (n.includes('fight') || n.includes('ufc') || n.includes('box')) return '🥊';
  if (n.includes('nfl') || n.includes('americ')) return '🏈';
  if (n.includes('formu') || n.includes('motor') || n.includes('f1')) return '🏎️';
  if (n.includes('rugb') || n.includes('afl')) return '🏉';
  if (n.includes('base') || n.includes('mlb')) return '⚾';
  if (n.includes('bask') || n.includes('nba')) return '🏀';
  if (n.includes('tenn') || n.includes('ping')) return '🎾';
  if (n.includes('voll') || n.includes('volly')) return '🏐';
  if (n.includes('cycl') || n.includes('bike')) return '🚴';
  if (n.includes('cric')) return '🏏';
  if (n.includes('golf')) return '⛳';
  if (n.includes('ice') || n.includes('nhl')) return '🏒';
  if (n.includes('esport') || n.includes('game')) return '🎮';
  if (n.includes('other')) return '⭐';
  return '🏆';
};

// Helper to ensure valid external URL
const formatExternalUrl = (url?: string) => {
  if (!url || !url.trim()) return '#';
  const trimmed = url.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  return `https://${trimmed}`;
};

const DEFAULT_CATEGORIES: Category[] = [
  { id: 1, sportName: 'Soccer' },
  { id: 2, sportName: 'Motorsport' },
  { id: 3, sportName: 'Fighting' },
  { id: 5, sportName: 'American Football' },
  { id: 4, sportName: 'Basketball' },
  { id: 6, sportName: 'Rugby' },
  { id: 7, sportName: 'Tennis' },
  { id: 8, sportName: 'Cycling' },
  { id: 9, sportName: 'Volleyball' },
  { id: 10, sportName: 'Table Tennis' },
  { id: 11, sportName: 'Others' },
];

const getInitialAdsSettings = (): AdsSettings => {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('streamespn_ads_settings');
      if (stored) return JSON.parse(stored);
    } catch (e) { }
  }
  return {};
};

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState<boolean>(false);
  const [scrolled, setScrolled] = useState<boolean>(false);

  const [adsSettings, setAdsSettings] = useState<AdsSettings>(getInitialAdsSettings);
  const [activeAdTab, setActiveAdTab] = useState<'nav' | 'modal'>('nav');
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [activeCategoryId, setActiveCategoryId] = useState<string>('home');

  // 🔄 40 SECONDS NAVBAR AD <-> 20 SECONDS MODAL SIGNUP AD ROTATION LOOP
  useEffect(() => {
    const hasNav = !!adsSettings.navAds;
    const hasModal = !!adsSettings.modalSignupAds;

    if (hasNav && hasModal) {
      let timer: NodeJS.Timeout;
      if (activeAdTab === 'nav') {
        timer = setTimeout(() => {
          setActiveAdTab('modal');
        }, 40000); // 40 Seconds Navbar Ad
      } else {
        timer = setTimeout(() => {
          setActiveAdTab('nav');
        }, 20000); // 20 Seconds Modal Signup Ad
      }
      return () => clearTimeout(timer);
    } else if (hasNav) {
      setActiveAdTab('nav');
    } else if (hasModal) {
      setActiveAdTab('modal');
    }
  }, [adsSettings.navAds, adsSettings.modalSignupAds, activeAdTab]);

  const navigateToCategory = (catSlug: string) => {
    startTopLoader();
    router.push(`/${catSlug}`);
    setTimeout(() => {
      setIsMoreOpen(false);
      setLeftDrawerOpen(false);
    }, 100);
  };

  // Sync active category with current route pathname & scroll to top under sticky navbar
  useEffect(() => {
    setIsMoreOpen(false);
    setLeftDrawerOpen(false);

    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }

    if (!pathname || pathname === '/') {
      setActiveCategoryId('home');
      return;
    }

    const pathSegments = pathname.split('/').filter(Boolean);
    const categorySegment = pathSegments[0] ? pathSegments[0].toLowerCase() : '';

    const matchedCategory = categories.find(
      (cat) => slugify(cat.sportName) === categorySegment || String(cat.id) === categorySegment
    );

    if (matchedCategory) {
      setActiveCategoryId(String(matchedCategory.id));
    } else {
      setActiveCategoryId('');
    }
  }, [pathname, categories]);

  // Search & Navigation States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState<boolean>(false);

  const [leftDrawerOpen, setLeftDrawerOpen] = useState<boolean>(false);
  const [isMoreOpen, setIsMoreOpen] = useState<boolean>(false);
  const [isTvModalOpen, setIsTvModalOpen] = useState<boolean>(false);

  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);

    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close ... More dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(event.target as Node)) {
        setIsMoreOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch Ads & Categories dynamically from Backend API (Instant independent calls)
  useEffect(() => {
    // 1. Fetch Ads Immediately & update localStorage
    api
      .get('/ads')
      .then((res) => {
        if (res.data?.success && res.data?.data?.settings) {
          const settings = res.data.data.settings;
          setAdsSettings(settings);
          try {
            localStorage.setItem('streamespn_ads_settings', JSON.stringify(settings));
          } catch (e) { }
        }
      })
      .catch(() => { });

    // 2. Fetch Categories independently
    getCategories()
      .then((sportsData) => {
        if (sportsData && sportsData.length > 0) {
          setCategories(sportsData);
        }
      })
      .catch(() => { });
  }, []);

  // Search API Call
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await api.get('/matches');
        if (res.data?.success) {
          const allMatches = res.data.data.matches || [];
          const term = searchQuery.toLowerCase();
          const filtered = allMatches.filter((m: any) => {
            const h = m.homeTeam ? m.homeTeam.toLowerCase().includes(term) : false;
            const a = m.awayTeam ? m.awayTeam.toLowerCase().includes(term) : false;
            const t = m.title ? m.title.toLowerCase().includes(term) : false;
            const c = m.categoryName ? m.categoryName.toLowerCase().includes(term) : false;
            return h || a || t || c;
          });
          setSearchResults(filtered.slice(0, 6));
        }
      } catch (err) {
        // ignore
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const toggleDarkMode = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  const isDark = resolvedTheme === 'dark';

  // Dynamic categories strictly from Backend DB
  const mobileVisibleCategories = categories.slice(0, 4);
  const mobileMoreCategories = categories.slice(4);

  // Desktop visible categories (first 6) & remaining
  const visibleCategories = categories.slice(0, 6);
  const moreCategories = categories.slice(6);

  return (
    <>
      <header className={`sticky top-0 z-[100] w-full transition-all duration-300 ${scrolled
        ? 'border-b border-[var(--border-glass)] bg-[var(--bg-header)] backdrop-blur-md '
        : 'border-b border-[var(--border-glass)] bg-[var(--bg-header)] backdrop-blur-sm'
        }`}>

        {/* 1. TOP HEADER ROW */}
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 sm:px-6">

          {/* BRAND LOGO */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-rose-600 via-amber-500 to-yellow-400 shadow-md">
              <Tv className="h-5 w-5 text-white" />
            </div>
            <div className="flex items-baseline font-black tracking-tight text-xl sm:text-2xl text-[var(--text-white)]">
              STREAM<span className="text-[#F8C831]">ESPN</span>
            </div>
          </Link>

          {/* DESKTOP TOP UTILITIES */}
          <div className="hidden sm:flex items-center gap-3">

            {/* SEARCH INPUT BAR */}
            <div className="relative">
              <div className="flex items-center rounded-full border border-[var(--border-glass)] bg-[var(--bg-card)] px-4 py-2 text-xs sm:text-sm focus-within:border-[#F8C831] transition-all">
                <Search className="h-4 w-4 text-[var(--text-muted)] mr-2 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsSearchOpen(true);
                  }}
                  placeholder="Search"
                  className="w-36 md:w-52 bg-transparent text-[var(--text-white)] placeholder-[var(--text-dim)] focus:outline-none text-xs sm:text-sm font-medium"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="text-[var(--text-muted)] hover:text-[var(--text-white)]">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* SEARCH RESULTS DROPDOWN */}
              {isSearchOpen && searchQuery && (
                <div className="absolute right-0 top-12 w-80 rounded-2xl border border-[var(--border-glass)] bg-[var(--bg-card)] p-3 shadow-2xl z-50 space-y-2 backdrop-blur-xl">
                  <div className="flex items-center justify-between border-b border-[var(--border-glass)] pb-2 text-xs text-[var(--text-muted)] font-bold">
                    <span>Events Results</span>
                    <button onClick={() => setIsSearchOpen(false)} className="hover:text-[var(--text-white)]">
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {searching ? (
                    <div className="p-4 text-center text-xs text-[var(--text-muted)]">Searching live data...</div>
                  ) : searchResults.length === 0 ? (
                    <div className="p-4 text-center text-xs text-[var(--text-muted)]">No matches found</div>
                  ) : (
                    <div className="space-y-1.5">
                      {searchResults.map((m) => (
                        <Link
                          key={m.id}
                          href={`/match/${m.slug || m.id}`}
                          onClick={() => setIsSearchOpen(false)}
                          className="flex items-center justify-between p-2 rounded-xl bg-[var(--bg-main)] hover:bg-[var(--bg-card-hover)] transition-all"
                        >
                          <div className="truncate text-xs sm:text-sm font-semibold text-[var(--text-white)]">
                            {m.matchType === 'team_vs_team' ? `${m.homeTeam} vs ${m.awayTeam}` : m.title}
                          </div>
                          <span className="text-[10px] sm:text-xs font-bold text-[#F8C831] px-2 py-0.5 bg-amber-500/10 rounded-md border border-amber-500/20">
                            {m.categoryName || 'Sport'}
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* DARK / LIGHT THEME TOGGLER */}
            <button
              onClick={toggleDarkMode}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border-glass)] bg-[var(--bg-card)] text-[var(--text-muted)] hover:border-[#F8C831] hover:text-[#F8C831] transition-all"
              title="Toggle Dark / Light Theme"
            >
              {mounted && isDark ? (
                <Moon className="h-4 w-4 text-[#F8C831]" />
              ) : (
                <Sun className="h-4 w-4 text-amber-500" />
              )}
            </button>

            {/* MEMBERSHIP SOLID BUTTON */}
            <a
              href={formatExternalUrl(adsSettings.membershipReferralLink)}

              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-xl bg-[#F8C831] px-4 py-2 text-xs sm:text-sm font-black text-black shadow-md hover:bg-yellow-400 transition-all cursor-pointer"
            >
              Membership
            </a>

          </div>

          {/* MOBILE TOP RIGHT: MENU BUTTON (☰ Menu) */}
          <div className="sm:hidden flex items-center  gap-2">
            <button
              onClick={() => setLeftDrawerOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-[3px] border border-[var(--border-glass)] bg-[var(--bg-card)] text-xs font-extrabold text-[var(--text-white)] hover:border-[#F8C831] "
            >
              <Menu className="h-4 w-4 text-[#F8C831]" />
              <span>Menu</span>
            </button>
          </div>

        </div>

        {/* 2. SUB-NAVBAR CATEGORIES ROW */}

        {/* DESKTOP SUB-NAVBAR */}
        <div className="hidden sm:block border-t border-[var(--border-glass)] bg-[var(--bg-subnav)] px-4 sm:px-3 relative">
          <div className="mx-auto flex max-w-7xl px-4 items-center justify-between gap-2 overflow-visible">

            {/* HORIZONTAL SCROLLABLE CATEGORIES LIST */}
            <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar py-1.5 text-xs sm:text-sm font-bold flex-1">
              <Link
                href="/"
                scroll={false}
                className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-bold transition-all shrink-0 relative ${activeCategoryId === 'home'
                  ? 'text-[var(--text-white)] font-black border-b-2 border-[#F8C831]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-white)]'
                  }`}
              >
                <Home className="h-4 w-4" />
                <span>Home</span>
              </Link>

              {visibleCategories.map((cat) => {
                const isActive = activeCategoryId === String(cat.id);
                const icon = getSportIcon(cat.sportName);
                const catSlug = slugify(cat.sportName);
                return (
                  <Link
                    key={cat.id}
                    href={`/${catSlug}`}
                    scroll={false}
                    className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-bold shrink-0 transition-all ${isActive
                      ? 'text-[var(--text-white)] font-black border-b-2 border-[#F8C831]'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-white)]'
                      }`}
                  >
                    <span className="text-base sm:text-lg">{icon}</span>
                    <span>{cat.sportName}</span>
                  </Link>
                );
              })}
            </div>

            {/* DESKTOP ... MORE BUTTON WITH DROPDOWN MENU */}
            {moreCategories.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger
                  className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-bold transition-all shrink-0 rounded-xl cursor-pointer ${moreCategories.some(c => String(c.id) === activeCategoryId)
                    ? 'bg-[#F8C831] text-black shadow-md font-black'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-white)]'
                    }`}
                >
                  <MoreHorizontal className="h-4 w-4" />
                  <span>More</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-80 p-3" align="end">


                  <DropdownMenuGroup className="grid grid-cols-2 gap-1.5 max-h-64 overflow-y-auto no-scrollbar">
                    {moreCategories.map((cat) => {
                      const icon = getSportIcon(cat.sportName);
                      const isSelected = activeCategoryId === String(cat.id);
                      const catSlug = slugify(cat.sportName);
                      return (
                        <DropdownMenuItem
                          key={cat.id}
                          onClick={() => router.push(`/${catSlug}`, { scroll: false })}
                          className={`flex items-center gap-2.5 p-2 rounded-xl text-left text-xs sm:text-sm font-bold transition-all cursor-pointer ${isSelected
                            ? 'bg-[#F8C831] text-black shadow-md font-black'
                            : 'text-[var(--text-white)] hover:bg-[var(--bg-card-hover)]'
                            }`}
                        >
                          <span className="text-base shrink-0">{icon}</span>
                          <span className="truncate">{cat.sportName}</span>
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

          </div>
        </div>

        {/* MOBILE CIRCLE CATEGORY ICONS BAR */}
        <div className="sm:hidden border-t border-[var(--border-glass)] bg-[var(--bg-subnav)] px-4 py-2.5">
          <div className="flex items-center justify-around gap-2">

            {mobileVisibleCategories.map((cat) => {
              const isActive = activeCategoryId === String(cat.id);
              const icon = getSportIcon(cat.sportName);
              const catSlug = slugify(cat.sportName);
              return (
                <Link
                  key={cat.id}
                  href={`/${catSlug}`}
                  scroll={false}
                  className="flex flex-col items-center gap-1 group cursor-pointer"
                >
                  <div className={`flex h-12 w-12 items-center justify-center rounded-full text-xl transition-all ${isActive
                    ? 'bg-[#F8C831]/20 border-2 border-[#F8C831] shadow-lg shadow-yellow-500/20'
                    : 'bg-[var(--bg-card)] border border-[var(--border-glass)] group-hover:border-[#F8C831]'
                    }`}>
                    {icon}
                  </div>
                  <span className={`text-[11px] font-bold ${isActive ? 'text-[#F8C831]' : 'text-[var(--text-white)]'}`}>
                    {cat.sportName}
                  </span>
                </Link>
              );
            })}

            {/* MOBILE MORE CIRCLE BUTTON WITH DROPDOWN MENU */}
            {mobileMoreCategories.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger className="flex flex-col items-center gap-1 group cursor-pointer outline-none">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#F8C831] bg-amber-400/10 text-[#F8C831] shadow-md font-black">
                    <MoreHorizontal className="h-5 w-5" />
                  </div>
                  <span className="text-[11px] font-extrabold text-[var(--text-white)]">
                    More
                  </span>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[340px] max-w-[90vw] p-4" align="center">
                  <DropdownMenuGroup className="grid grid-cols-3 gap-y-5 gap-x-2 max-h-[60vh] overflow-y-auto no-scrollbar py-2 text-center">
                    {(mobileMoreCategories.length > 0 ? mobileMoreCategories : categories).map((cat) => {
                      const icon = getSportIcon(cat.sportName);
                      const isSelected = activeCategoryId === String(cat.id);
                      const catSlug = slugify(cat.sportName);
                      return (
                        <DropdownMenuItem
                          key={cat.id}
                          onClick={() => router.push(`/${catSlug}`, { scroll: false })}
                          className="flex flex-col items-center justify-center group cursor-pointer p-2 rounded-xl focus:bg-white/10"
                        >
                          <div className={`flex h-12 w-12 items-center justify-center rounded-full text-xl transition-all ${isSelected
                            ? 'bg-[#F8C831] text-black shadow-md ring-2 ring-[#F8C831]'
                            : 'bg-[var(--bg-card-hover)] border border-[var(--border-glass)] group-hover:border-[#F8C831] group-hover:scale-105'
                            }`}>
                            {icon}
                          </div>
                          <span className={`text-[11px] font-bold mt-1.5 truncate max-w-full ${isSelected ? 'text-[#F8C831]' : 'text-[var(--text-white)]'}`}>
                            {cat.sportName}
                          </span>
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

          </div>
        </div>

        {/* 3. NAVBAR AD BANNER SLOT (STICKY ALONG WITH NAVBAR ON MOBILE & DESKTOP) */}
        {(adsSettings.navAds || adsSettings.modalSignupAds) && (
          <div className="w-full border-t border-[var(--border-glass)] bg-[var(--bg-header)] px-4 py-1.5 flex justify-center items-center">
            <div className="mx-auto max-w-7xl w-full flex items-center justify-center">
              <AdRenderer
                uniqueKey="nav-ad"
                refreshKey={`${pathname}-${activeAdTab}`}
                code={activeAdTab === 'nav' ? (adsSettings.navAds || adsSettings.modalSignupAds) : (adsSettings.modalSignupAds || adsSettings.navAds)}
              />
            </div>
          </div>
        )}

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
          <div className="relative w-80 max-w-[80vw] bg-[var(--bg-card)] text-[var(--text-white)] border-r border-[var(--border-glass)] p-5 shadow-2xl flex flex-col justify-between z-[999999] space-y-6 overflow-y-auto">

            <div className="space-y-6">
              {/* DRAWER HEADER */}
              <div className="flex items-center justify-between border-b border-[var(--border-glass)] pb-4">
                <Link href="/" onClick={() => setLeftDrawerOpen(false)} className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-black font-black text-base shadow-md">
                    🏆
                  </div>
                  <span className="font-black tracking-tight text-lg text-[var(--text-white)]">
                    STREAM<span className="text-[#F8C831]">ESPN</span>
                  </span>
                </Link>

                <button
                  onClick={() => setLeftDrawerOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--bg-card-hover)] text-[var(--text-muted)] hover:text-[var(--text-white)] transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* SEARCH INPUT BAR */}
              <div className="space-y-2">
                <label className="text-xs font-black text-[var(--text-muted)] uppercase tracking-wider">Search Events</label>
                <div className="flex items-center rounded-xl border border-[var(--border-glass)] bg-[var(--bg-main)] px-3.5 py-2 text-xs">
                  <Search className="h-4 w-4 text-[var(--text-muted)] mr-2 shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setIsSearchOpen(true);
                    }}
                    placeholder="Search teams, events..."
                    className="w-full bg-transparent text-[var(--text-white)] placeholder-[var(--text-dim)] focus:outline-none text-xs font-semibold"
                  />
                </div>
              </div>

              {/* MEMBERSHIP SOLID BUTTON */}
              <div className="pt-2">
                <a
                  href={formatExternalUrl(adsSettings.membershipReferralLink)}
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full rounded-xl bg-[#F8C831] py-3 text-xs font-extrabold text-black shadow-lg shadow-yellow-500/20 hover:bg-yellow-400 transition-all cursor-pointer"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>VIP Membership Access</span>
                </a>
              </div>

              {/* CATEGORIES LIST FROM BACKEND */}
              <div className="space-y-2 pt-2 border-t border-[var(--border-glass)]">
                <label className="text-xs font-black text-[var(--text-muted)] uppercase tracking-wider">Sports Categories</label>
                <div className="space-y-1">
                  <Link
                    href="/"
                    onClick={() => setLeftDrawerOpen(false)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-extrabold transition-all ${activeCategoryId === 'home'
                      ? 'bg-[#F8C831] text-black shadow-sm'
                      : 'text-[var(--text-white)] hover:bg-[var(--bg-card-hover)]'
                      }`}
                  >
                    <span className="flex items-center gap-2.5"><Home className="h-4 w-4" /> Home</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>

                  {categories.map((cat) => {
                    const icon = getSportIcon(cat.sportName);
                    const isSelected = activeCategoryId === String(cat.id);
                    const catSlug = slugify(cat.sportName);
                    return (
                      <Link
                        key={cat.id}
                        href={`/${catSlug}`}
                        onClick={() => {
                          setLeftDrawerOpen(false);
                          router.push(`/${catSlug}`, { scroll: false });
                        }}
                        className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${isSelected
                          ? 'bg-[#F8C831] text-black shadow-sm'
                          : 'text-[var(--text-white)] hover:bg-[var(--bg-card-hover)]'
                          }`}
                      >
                        <span className="flex items-center gap-2.5">
                          <span className="text-base">{icon}</span>
                          <span>{cat.sportName}</span>
                        </span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* DRAWER FOOTER WITH THEME SWITCHER */}
            <div className="pt-4 border-t border-[var(--border-glass)] flex items-center justify-between text-xs font-bold text-[var(--text-muted)]">
              <span>Theme Mode</span>
              <button
                onClick={toggleDarkMode}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[var(--border-glass)] bg-[var(--bg-card-hover)] text-xs font-extrabold text-[var(--text-white)]"
              >
                {mounted && isDark ? <Moon className="h-3.5 w-3.5 text-[#F8C831]" /> : <Sun className="h-3.5 w-3.5 text-amber-500" />}
                <span>{mounted && isDark ? 'Dark' : 'Light'}</span>
              </button>
            </div>

          </div>

        </div>
      )}

      {/* TV STREAMING GUIDE MODAL */}
      {isTvModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl border border-[var(--border-glass)] bg-[var(--bg-card)] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border-glass)] pb-3">
              <h3 className="text-sm sm:text-base font-bold text-[var(--text-white)] flex items-center gap-2">
                <Tv className="h-4 w-4 text-[#F8C831]" /> Watch StreamESPN on Smart TV
              </h3>
              <button onClick={() => setIsTvModalOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-white)]">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3 text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
              <p>1. Open your Smart TV Browser (Samsung Tizen, LG webOS, Android TV, Fire TV).</p>
              <p>2. Navigate to <span className="text-[#F8C831] font-bold">https://streamespn.com</span>.</p>
              <p>3. Select any live match and enjoy Full HD 1080p lag-free streaming directly on your TV!</p>
            </div>
            <button
              onClick={() => setIsTvModalOpen(false)}
              className="w-full rounded-xl bg-[#F8C831] py-2.5 text-xs sm:text-sm font-bold text-black hover:bg-yellow-400"
            >
              Got it, Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};
