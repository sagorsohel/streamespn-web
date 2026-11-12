'use client';

import React, { useEffect, useRef, useState } from 'react';
import { getAdsSettingsSync, subscribeAdsSettings, AdsSettings } from '@/lib/adsCache';

interface ResponsiveAdBannerProps {
  initialCode?: string;
  className?: string;
  placement?: 'home' | 'player' | 'general';
}

/**
 * ResponsiveAdBanner Component
 * Renders raw HTML / Google AdSense / Image Banners with full Server-Side Rendering (SSR)
 * so that the code is 100% visible in view-source:, and dynamically executes scripts on client.
 */
export const ResponsiveAdBanner: React.FC<ResponsiveAdBannerProps> = ({
  initialCode,
  className = '',
  placement = 'general',
}) => {
  const [adsSettings, setAdsSettings] = useState<AdsSettings>(() => getAdsSettingsSync());
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const unsubscribe = subscribeAdsSettings((newSettings) => {
      setAdsSettings(newSettings);
    });
    return () => unsubscribe();
  }, []);

  const rawCode = (initialCode || adsSettings?.footerAds || (adsSettings as any)?.bannerAds || '').trim();

  useEffect(() => {
    if (!mounted || !containerRef.current || !rawCode) return;

    const container = containerRef.current;

    // Ensure container has the latest rawCode (in case of client-side settings update)
    if (container.getAttribute('data-loaded-code') !== rawCode) {
      container.innerHTML = rawCode;
      container.setAttribute('data-loaded-code', rawCode);
    }

    // Identify and execute all <script> tags dynamically in proper order
    const scripts = Array.from(container.querySelectorAll('script'));
    let hasAdSensePush = false;

    scripts.forEach((oldScript) => {
      // Skip if already executed
      if (oldScript.getAttribute('data-executed') === 'true') return;

      const scriptText = oldScript.textContent || oldScript.innerText || '';

      // If it's the inline adsbygoogle.push() script, remove it now;
      // we'll invoke it safely once container layout width is verified (> 0).
      if (scriptText.includes('adsbygoogle') && scriptText.includes('.push(')) {
        hasAdSensePush = true;
        oldScript.remove();
        return;
      }

      // Re-create script element so the browser actually executes it
      const newScript = document.createElement('script');
      Array.from(oldScript.attributes).forEach((attr) => {
        newScript.setAttribute(attr.name, attr.value);
      });
      newScript.textContent = scriptText;
      newScript.setAttribute('data-executed', 'true');
      oldScript.parentNode?.replaceChild(newScript, oldScript);
    });

    // For Google AdSense: wait until CSS layout renders width > 0 before calling push({})
    if (hasAdSensePush || rawCode.includes('adsbygoogle')) {
      let isCancelled = false;

      const attemptPush = (retries = 20) => {
        if (isCancelled || !containerRef.current) return;

        const ins = containerRef.current.querySelector('ins.adsbygoogle') as HTMLElement | null;
        if (!ins) return;

        // Skip if already processed by Google
        if (ins.getAttribute('data-adsbygoogle-status')) return;

        const currentWidth = containerRef.current.offsetWidth || containerRef.current.clientWidth;

        if (currentWidth > 0) {
          try {
            ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
          } catch (e) {
            // silent catch
          }
        } else if (retries > 0) {
          // Retry after short interval until browser finishes layout
          setTimeout(() => attemptPush(retries - 1), 50);
        }
      };

      const timer = setTimeout(() => attemptPush(20), 50);

      return () => {
        isCancelled = true;
        clearTimeout(timer);
      };
    }
  }, [mounted, rawCode]);

  if (!rawCode) return null;

  return (
    <div
      suppressHydrationWarning
      className={`w-full block my-3 text-center clear-both overflow-hidden ${className}`}
    >
      <div
        ref={containerRef}
        suppressHydrationWarning
        className="w-full flex justify-center items-center flex-col mx-auto text-center overflow-hidden [&_img]:max-w-full [&_img]:h-auto [&_img]:inline-block [&_iframe]:max-w-full [&_iframe]:mx-auto"
        data-ad-placement={placement}
        dangerouslySetInnerHTML={{ __html: rawCode }}
      />
    </div>
  );
};
