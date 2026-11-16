'use client';

import React, { useEffect, useState } from 'react';
import { getAdsSettingsSync, subscribeAdsSettings, AdsSettings } from '@/lib/adsCache';
import { AdRenderer } from './AdRenderer';

import { HARDCODED_ADSENSE } from './hardcodedAdsense';

interface ResponsiveAdBannerProps {
  initialCode?: string;
  className?: string;
  placement?: 'home' | 'player' | 'general';
}

/**
 * Top Banner Ad (Home above Trending & Single Match above Player).
 * Accepts any ad code: Google AdSense, Adsterra/other ad-network scripts, iframes, HTML/image banners.
 * The code comes from the admin "Top Banner Ad" box; when it is switched OFF the API sends an empty string.
 */
export const ResponsiveAdBanner: React.FC<ResponsiveAdBannerProps> = ({
  initialCode,
  className = '',
  placement = 'general',
}) => {
  const [adsSettings, setAdsSettings] = useState<AdsSettings>(() => getAdsSettingsSync());

  useEffect(() => {
    const unsubscribe = subscribeAdsSettings((s) => setAdsSettings(s));
    return () => unsubscribe();
  }, []);

  // Once live settings are known they win over the (possibly stale) initialCode,
  // so turning the banner OFF in admin hides it.
  const live = adsSettings && adsSettings.footerAds !== undefined ? adsSettings : null;
  const enabled = live ? live.isFooterAdsEnabled !== false : true;
  // Admin code wins; if the box is empty (and not switched OFF) the hardcoded AdSense unit is shown
  const finalCode = enabled
    ? ((live ? live.footerAds : initialCode) || '').trim() || HARDCODED_ADSENSE
    : '';

  if (!finalCode) return null;

  return (
    <div suppressHydrationWarning className={`w-full block my-3 text-center clear-both ${className}`} data-ad-placement={placement}>
      <AdRenderer code={finalCode} uniqueKey={`top-banner-${placement}`} />
    </div>
  );
};
