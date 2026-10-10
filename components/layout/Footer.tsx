'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import api from '@/lib/api';
import { AdRenderer } from '../ads/AdRenderer';
import { Tv, Shield, Globe, Radio, Sparkles, Lock, X } from 'lucide-react';
import { slugify } from '@/lib/utils';
import {
  getAdsSettingsSync,
  subscribeAdsSettings,
  fetchAdsSettingsAsync,
  AdsSettings,
} from '@/lib/adsCache';

const formatExternalUrl = (url?: string) => {
  if (!url || !url.trim()) return '#';
  const trimmed = url.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  return `https://${trimmed}`;
};

interface FooterProps {
  initialAdsSettings?: AdsSettings;
}

// In-memory cache for Footer Top Leagues to prevent repetitive API calls during navigation
let cachedTopSubcategories: any[] | null = null;
let topSubcategoriesPromise: Promise<any[]> | null = null;
let lastCacheTimestamp = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache

export const Footer: React.FC<FooterProps> = ({ initialAdsSettings }) => {
  const pathname = usePathname();
  const [mounted, setMounted] = useState<boolean>(false);
  const [adsSettings, setAdsSettings] = useState<AdsSettings>(() => {
    if (initialAdsSettings && (initialAdsSettings.footerAds || initialAdsSettings.membershipReferralLink || initialAdsSettings.histatsScript)) {
      return initialAdsSettings;
    }
    return {};
  });
  const [showFloatDesktop, setShowFloatDesktop] = useState<boolean>(true);
  const [topSubcategories, setTopSubcategories] = useState<any[]>(() => cachedTopSubcategories || []);
  const histatsContainerRef = useRef<HTMLDivElement>(null);
  const injectedHistatsRef = useRef<string>('');

  useEffect(() => {
    setMounted(true);
    setAdsSettings(getAdsSettingsSync());
    const unsubscribe = subscribeAdsSettings((updated) => {
      setAdsSettings(updated);
    });
    fetchAdsSettingsAsync();

    let isMounted = true;
    const fetchTopSubcategories = async () => {
      const now = Date.now();
      if (cachedTopSubcategories && now - lastCacheTimestamp < CACHE_TTL_MS) {
        if (isMounted) setTopSubcategories(cachedTopSubcategories);
        return;
      }
      if (topSubcategoriesPromise) {
        const cached = await topSubcategoriesPromise;
        if (isMounted && cached) setTopSubcategories(cached);
        return;
      }

      topSubcategoriesPromise = (async () => {
        try {
          const res = await api.get('/subcategories?home=true');
          if (res.data?.success && Array.isArray(res.data.data?.subcategories)) {
            const subs = res.data.data.subcategories;
            // Filter subcategories with >= 10 matches today/upcoming
            const qualifying = subs.filter((s: any) => Number(s.matchCount || 0) >= 10);

            // Get top subcategories across up to 4 distinct categories
            const selected: any[] = [];
            const seenCategories = new Set<string>();

            for (const sub of qualifying) {
              const catKey = sub.categoryName || String(sub.categoryId);
              if (!seenCategories.has(catKey)) {
                seenCategories.add(catKey);
                selected.push(sub);
              }
              if (selected.length >= 4) break;
            }

            // Fill remaining slots up to 4 if less than 4 categories have >= 10 matches
            if (selected.length < 4) {
              for (const sub of qualifying) {
                if (!selected.some((s) => s.id === sub.id)) {
                  selected.push(sub);
                  if (selected.length >= 4) break;
                }
              }
            }

            cachedTopSubcategories = selected;
            lastCacheTimestamp = Date.now();
            return selected;
          }
        } catch (e) {
          // ignore
        } finally {
          topSubcategoriesPromise = null;
        }
        return [];
      })();

      const data = await topSubcategoriesPromise;
      if (isMounted && data) {
        setTopSubcategories(data);
      }
    };

    fetchTopSubcategories();

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Inject Histats / Analytics tracking code directly into main window context (NOT inside an iframe)
  useEffect(() => {
    if (!mounted || !adsSettings.histatsScript) return;
    if (injectedHistatsRef.current === adsSettings.histatsScript) return;

    const container = histatsContainerRef.current;
    if (!container) return;

    injectedHistatsRef.current = adsSettings.histatsScript;
    container.innerHTML = '';

    const temp = document.createElement('div');
    temp.innerHTML = adsSettings.histatsScript;

    // Dynamically create script tags so the browser executes them in the window context with actual URL
    temp.querySelectorAll('script').forEach((oldScript) => {
      const newScript = document.createElement('script');
      Array.from(oldScript.attributes).forEach((attr) => {
        newScript.setAttribute(attr.name, attr.value);
      });
      if (oldScript.innerHTML) {
        newScript.appendChild(document.createTextNode(oldScript.innerHTML));
      }
      container.appendChild(newScript);
    });

    // Also support noscript / pixel images
    temp.querySelectorAll('noscript, img, a').forEach((node) => {
      container.appendChild(node.cloneNode(true));
    });
  }, [mounted, adsSettings.histatsScript]);

  // Track page hits across Next.js SPA client-side route navigation
  useEffect(() => {
    if (!mounted) return;
    if (typeof window !== 'undefined' && (window as any)._Hasync) {
      try {
        (window as any)._Hasync.push(['Histats.track_hits', '']);
      } catch (e) {
        // ignore
      }
    }
  }, [pathname, mounted]);

  return (
    <footer className="w-full border-t border-[var(--border-glass)] bg-[var(--bg-main)] text-[var(--text-muted)] text-xs mt-16 pb-12 relative">

      {/* 📊 HISTATS / ANALYTICS TRACKING CODE INJECTOR (Direct Window Execution for 100% Tracking Accuracy & Real URLs) */}
      {mounted && adsSettings.histatsScript && (
        <div
          id="histats-analytics-container"
          ref={histatsContainerRef}
          aria-hidden="true"
          style={{
            position: 'absolute',
            width: '1px',
            height: '1px',
            overflow: 'hidden',
            opacity: 0.01,
            pointerEvents: 'none',
            bottom: 0,
            left: 0,
          }}
        />
      )}

      {/* FOOTER AD BANNER SLOT */}
      {mounted && adsSettings.footerAds && (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-6">
          <div className="rounded-2xl border border-[var(--border-glass)] bg-[var(--bg-card)] p-2 shadow-sm flex items-center justify-center overflow-hidden">
            <AdRenderer code={adsSettings.footerAds} uniqueKey="footer-ad" refreshKey={pathname} />
          </div>
        </div>
      )}

      {/* FLOATING MOBILE AD SLOT */}
      {mounted && adsSettings.floatMobileAds && (
        <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden  p-1 flex justify-center shadow-2xl">
          <AdRenderer code={adsSettings.floatMobileAds} uniqueKey="float-mobile-ad" refreshKey={pathname} />
        </div>
      )}

      {/* FLOATING DESKTOP AD SLOT CENTERED AT BOTTOM */}
      {mounted && adsSettings.floatDesktopAds && showFloatDesktop && (
        <div className="hidden lg:flex flex-col fixed bottom-4 left-1/2 -translate-x-1/2 z-40 rounded-2xl backdrop-blur-md">
          <AdRenderer code={adsSettings.floatDesktopAds} uniqueKey="float-desktop-ad" refreshKey={pathname} />
        </div>
      )}

      <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-10 space-y-8">

        {/* TOP SECTION: BRAND ON LEFT, POPULAR SPORTS & QUICK LINKS ON RIGHT */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-8 pb-8 border-b border-[var(--border-glass)]">

          {/* LEFT: BRAND LOGO & TAGLINE */}
          <div className="space-y-3 max-w-sm">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-rose-600 via-amber-500 to-yellow-400 shadow-md">
                <Tv className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-black text-[var(--text-white)] tracking-wide">
                STREAM<span className="text-[#F8C831]">ESPN</span>
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
Follow live sports scores, upcoming fixtures, match schedules, team news, and the latest updates for soccer, basketball, tennis, and more on StreamESPN.            </p>
          </div>

          {/* RIGHT: POPULAR SPORTS & QUICK LINKS */}
          <div className="flex flex-wrap sm:flex-nowrap gap-12 sm:gap-20">
            {/* COLUMN: POPULAR SPORTS */}
            <div className="space-y-3 min-w-[140px]">
              <h4 className="text-xs font-black uppercase text-[var(--text-white)] tracking-wider flex items-center gap-1.5">
                <Radio className="h-3.5 w-3.5 text-[#F8C831]" /> Popular Sports
              </h4>
              <ul className="space-y-2 text-xs font-semibold">
                <li>
                  <Link href="/soccer" className="hover:text-[var(--text-white)] transition-colors flex items-center gap-1">
                    ⚽ Soccer 
                  </Link>
                </li>
                <li>
                  <Link href="/basketball" className="hover:text-[var(--text-white)] transition-colors flex items-center gap-1">
                    🏀 Basketball 
                  </Link>
                </li>
                <li>
                  <Link href="/american-football" className="hover:text-[var(--text-white)] transition-colors flex items-center gap-1">
                    🏈 NFL / American Football
                  </Link>
                </li>
                <li>
                  <Link href="/tennis" className="hover:text-[var(--text-white)] transition-colors flex items-center gap-1">
                    🎾 Tennis 
                  </Link>
                </li>
              </ul>
            </div>

            {/* COLUMN: TOP LEAGUES (Only shown if there are subcategories with >= 10 matches) */}
            {topSubcategories.length > 0 && (
              <div className="space-y-3 min-w-[140px]">
                <h4 className="text-xs font-black uppercase text-[var(--text-white)] tracking-wider flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-amber-400" /> Top Leagues
                </h4>
                <ul className="space-y-2 text-xs font-semibold">
                  {topSubcategories.map((sub) => {
                    const catSlug = slugify(sub.categoryName || 'sport');
                    const subSlug = slugify(sub.name);
                    return (
                      <li key={sub.id}>
                        <Link
                          href={`/${catSlug}/${subSlug}`}
                          className="hover:text-[var(--text-white)] transition-colors flex items-center gap-1.5"
                        >
                          <span>🔥</span>
                          <span>{sub.name}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>

        </div>

        {/* BOTTOM COPYRIGHT & LEGAL NOTICE */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-[11px] text-[var(--text-muted)]">
          <p>© {new Date().getFullYear()} <strong className="text-[var(--text-white)]">StreamESPN</strong>. All rights reserved.</p>
          <div className="flex items-center gap-3 sm:gap-4 text-xs font-bold flex-wrap">
            <Link href="/about-us" className="hover:text-[var(--text-white)] transition-colors">About Us</Link>
            <span className="text-[var(--border-glass)]">•</span>
            <Link href="/privacy-policy" className="hover:text-[var(--text-white)] transition-colors">Privacy Policy</Link>
            <span className="text-[var(--border-glass)]">•</span>
            <Link href="/terms-and-conditions" className="hover:text-[var(--text-white)] transition-colors">Terms &amp; Conditions</Link>
            <span className="text-[var(--border-glass)]">•</span>
            <Link href="/dmca" className="hover:text-[var(--text-white)] transition-colors">DMCA</Link>
            <span className="text-[var(--border-glass)]">•</span>
            <Link href="/contact-us" className="hover:text-[var(--text-white)] transition-colors">Contact Us</Link>
          </div>
        </div>

      </div>
    </footer>
  );
};
