'use client';

import React, { useEffect, useState } from 'react';
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

export const Footer: React.FC = () => {
  const pathname = usePathname();
  const [adsSettings, setAdsSettings] = useState<AdsSettings>(() => getAdsSettingsSync());
  const [showFloatDesktop, setShowFloatDesktop] = useState<boolean>(true);

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

  return (
    <footer className="w-full border-t border-[var(--border-glass)] bg-[var(--bg-main)] text-[var(--text-muted)] text-xs mt-16 pb-12 relative">

      {/* 📊 HISTATS / ANALYTICS TRACKING CODE INJECTOR (Invisible 1px Container for 100% Tracking Accuracy) */}
      {adsSettings.histatsScript && (
        <div
          id="histats-analytics-container"
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
        >
          <AdRenderer code={adsSettings.histatsScript} />
        </div>
      )}

      {/* FOOTER AD BANNER SLOT */}
      {adsSettings.footerAds && (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-6">
          <div className="rounded-2xl border border-[var(--border-glass)] bg-[var(--bg-card)] p-2 shadow-sm flex items-center justify-center overflow-hidden">
            <AdRenderer code={adsSettings.footerAds} uniqueKey="footer-ad" refreshKey={pathname} />
          </div>
        </div>
      )}

      {/* FLOATING MOBILE AD SLOT */}
      {adsSettings.floatMobileAds && (
        <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-slate-950/95 border-t border-slate-800 p-1 flex justify-center shadow-2xl">
          <AdRenderer code={adsSettings.floatMobileAds} uniqueKey="float-mobile-ad" refreshKey={pathname} />
        </div>
      )}

      {/* FLOATING DESKTOP AD SLOT WITH DISMISS BUTTON */}
      {adsSettings.floatDesktopAds && showFloatDesktop && (
        <div className="hidden lg:flex flex-col fixed bottom-4 right-4 z-40 bg-slate-950/95 border border-slate-800 rounded-2xl p-2 shadow-2xl backdrop-blur-md">
          <div className="flex items-center justify-between px-1 pb-1 text-[10px] text-slate-400 font-bold">
            <span>Advertisement</span>
            <button
              onClick={() => setShowFloatDesktop(false)}
              className="hover:text-white transition-colors p-0.5 rounded-full hover:bg-slate-800"
              title="Close Ad"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
          <AdRenderer code={adsSettings.floatDesktopAds} uniqueKey="float-desktop-ad" refreshKey={pathname} />
        </div>
      )}

      <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-10 space-y-8">

        {/* TOP SECTION: 4-COLUMN FOOTER GRID (2-COLUMNS ON MOBILE) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 pb-8 border-b border-[var(--border-glass)]">

          {/* COLUMN 1: BRAND LOGO & TAGLINE */}
          <div className="space-y-3 col-span-2 md:col-span-1">
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

          {/* COLUMN 2: POPULAR SPORTS */}
          <div className="space-y-3 col-span-1">
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

          {/* COLUMN 3: QUICK LINKS */}
          <div className="space-y-3 col-span-1">
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

          {/* COLUMN 4: TRUST & COMPLIANCE BADGES */}
          <div className="space-y-3 col-span-2 md:col-span-1">
            <h4 className="text-xs font-black uppercase text-[var(--text-white)] tracking-wider flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-emerald-400" /> Security & Compliance
            </h4>
            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-glass)] space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-[var(--text-white)]">
                  <Shield className="h-3.5 w-3.5 text-emerald-400 shrink-0" /> DMCA Protection
                </div>
                <p className="text-[11px] text-[var(--text-muted)] leading-tight">
                  StreamESPN does not host any media files. Content is aggregated from public web servers.
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-glass)] flex items-center gap-2">
                <Globe className="h-4 w-4 text-cyan-400 shrink-0" />
                <span className="font-extrabold text-[var(--text-white)] text-[11px]">Global High-Speed HLS CDN</span>
              </div>
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
