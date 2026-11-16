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
export const MatchListAd: React.FC<{ className?: string }> = ({ className = '' }) => {
  const pathname = usePathname();
  const [settings, setSettings] = useState<AdsSettings>(() => getAdsSettingsSync());

  useEffect(() => {
    const unsubscribe = subscribeAdsSettings((s) => setSettings(s));
    fetchAdsSettingsAsync().then((s) => s && setSettings(s));
    return () => unsubscribe();
  }, []);

  if (settings?.isMatchListAdsEnabled === false) return null;

  return (
    <div suppressHydrationWarning className={`w-full ${className}`}>
      <AdRenderer uniqueKey="match-list-ad" refreshKey={pathname} code={HARDCODED_LIST_ADSENSE} />
    </div>
  );
};
