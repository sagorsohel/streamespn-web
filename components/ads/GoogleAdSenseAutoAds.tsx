'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Google AdSense Auto Ads & SPA Route Change Trigger
 * Automatically enables page-level ads (Auto Ads, Anchor Ads, Vignette Ads)
 * and notifies Google AdSense when routes change in Next.js.
 */
export const GoogleAdSenseAutoAds: React.FC = () => {
  const pathname = usePathname();
  const initialTriggerDone = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Small delay to allow Next.js DOM to settle on route change
    const timer = setTimeout(() => {
      try {
        const adsbygoogle = ((window as any).adsbygoogle = (window as any).adsbygoogle || []);

        if (!initialTriggerDone.current) {
          // Initialize Auto Ads / Page-Level Ads across the entire domain
          adsbygoogle.push({
            google_ad_client: 'ca-pub-9896387565016359',
            enable_page_level_ads: true,
            overlays: { bottom: true },
          });
          initialTriggerDone.current = true;
        } else {
          // Trigger AdSense page-view re-scan on SPA navigation
          adsbygoogle.push({});
        }
      } catch (e) {
        // silent catch
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [pathname]);

  return null;
};

