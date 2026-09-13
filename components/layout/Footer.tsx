'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import api from '@/lib/api';
import { AdRenderer } from '../ads/AdRenderer';
import { Tv, Shield, Globe, Radio, Sparkles, Lock, X } from 'lucide-react';
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
  const histatsContainerRef = useRef<HTMLDivElement>(null);
  const injectedHistatsRef = useRef<string>('');

  useEffect(() => {
    setMounted(true);
    setAdsSettings(getAdsSettingsSync());
    const unsubscribe = subscribeAdsSettings((updated) => {
      setAdsSettings(updated);
    });
    fetchAdsSettingsAsync();
    return () => {
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
              Watch your favorite live sports events online for FREE. Fast HLS streaming CDN optimized for PC, Mac, iPad, iPhone, and Android.
            </p>
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
                    ⚽ Soccer Streams
                  </Link>
                </li>
                <li>
                  <Link href="/basketball" className="hover:text-[var(--text-white)] transition-colors flex items-center gap-1">
                    🏀 Basketball Streams
                  </Link>
                </li>
                <li>
                  <Link href="/american-football" className="hover:text-[var(--text-white)] transition-colors flex items-center gap-1">
                    🏈 NFL / American Football
                  </Link>
                </li>
                <li>
                  <Link href="/tennis" className="hover:text-[var(--text-white)] transition-colors flex items-center gap-1">
                    🎾 Tennis Streams
                  </Link>
                </li>
              </ul>
            </div>

            {/* COLUMN: QUICK LINKS */}
            <div className="space-y-3 min-w-[140px]">
              <h4 className="text-xs font-black uppercase text-[var(--text-white)] tracking-wider flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" /> Quick Links
              </h4>
              <ul className="space-y-2 text-xs font-semibold">
                <li>
                  <Link href="/" className="hover:text-[var(--text-white)] transition-colors">
                    🔥 Live Events
                  </Link>
                </li>
                <li>
                  <Link href="/replay" className="hover:text-[var(--text-white)] transition-colors">
                    📺 Highlights
                  </Link>
                </li>
                <li>
                  <a
                    href={formatExternalUrl(adsSettings.membershipReferralLink)}
                    suppressHydrationWarning
                    rel="noopener noreferrer"
                    className="hover:text-[#F8C831] transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Lock className="h-3 w-3 text-amber-400" /> VIP Access
                  </a>
                </li>
                <li>
                  <a
                    href={formatExternalUrl(adsSettings.globalSignInReferralLink)}
                    suppressHydrationWarning
                    rel="noopener noreferrer"
                    className="hover:text-[#F8C831] transition-colors cursor-pointer"
                  >
                    🔐 Free Sign In
                  </a>
                </li>
              </ul>
            </div>
          </div>

        </div>

        {/* BOTTOM COPYRIGHT & LEGAL NOTICE */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-[11px] text-[var(--text-muted)]">
          <p>© {new Date().getFullYear()} <strong className="text-[var(--text-white)]">StreamESPN</strong>. All rights reserved. Premium Live Sports Streaming Platform.</p>
          <div className="flex items-center gap-4 text-xs font-bold">
            <Link href="/" className="hover:text-[var(--text-white)] transition-colors">Privacy Policy</Link>
            <span className="text-[var(--border-glass)]">•</span>
            <Link href="/" className="hover:text-[var(--text-white)] transition-colors">Terms of Service</Link>
            <span className="text-[var(--border-glass)]">•</span>
            <Link href="/" className="hover:text-[var(--text-white)] transition-colors">DMCA</Link>
          </div>
        </div>

      </div>
    </footer>
  );
};
