'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { AdRenderer } from './AdRenderer';
import { HARDCODED_LIST_ADSENSE } from './hardcodedAdsense';
import {
  AdsSettings,
  fetchAdsSettingsAsync,
  getAdsSettingsSync,
  subscribeAdsSettings,
} from '@/lib/adsCache';

/**
 * Ad shown under the "UPCOMING" / "More Events" heading, above the match cards.
 * Always the hardcoded Google in-article unit; the admin panel only switches it ON/OFF.
 */
// Master switch in code: set to true to bring the ad back (admin ON/OFF still applies on top).
const MATCH_LIST_AD_ENABLED = false;

export const MatchListAd: React.FC<{ className?: string }> = ({ className = '' }) => {
  const pathname = usePathname();
  const [settings, setSettings] = useState<AdsSettings>(() => getAdsSettingsSync());

  useEffect(() => {
    const unsubscribe = subscribeAdsSettings((s) => setSettings(s));
    fetchAdsSettingsAsync().then((s) => s && setSettings(s));
    return () => unsubscribe();
  }, []);

  if (!MATCH_LIST_AD_ENABLED || settings?.isMatchListAdsEnabled === false) return null;

  return (
    <div suppressHydrationWarning className={`w-full ${className}`}>
      <AdRenderer uniqueKey="match-list-ad" refreshKey={pathname} code={HARDCODED_LIST_ADSENSE} />
    </div>
  );
};
