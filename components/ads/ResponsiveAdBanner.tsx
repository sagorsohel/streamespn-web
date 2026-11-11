'use client';

import React, { useEffect, useRef, useState } from 'react';
import { getAdsSettingsSync, subscribeAdsSettings, AdsSettings } from '@/lib/adsCache';

interface ResponsiveAdBannerProps {
  initialCode?: string;
  className?: string;
  placement?: 'home' | 'player' | 'general';
}

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
    container.innerHTML = '';

    // Create wrapper to parse HTML string into DOM nodes
    const temp = document.createElement('div');
    temp.innerHTML = rawCode;

    // 1. Append non-script elements (e.g. <ins class="adsbygoogle">, images, divs, iframes)
    Array.from(temp.childNodes).forEach((node) => {
      if (node.nodeName !== 'SCRIPT') {
        container.appendChild(node.cloneNode(true));
      }
    });

    // 2. Re-create and execute all external / non-push <script> tags
    // NOTE: DO NOT synchronously execute inline scripts that call adsbygoogle.push()!
    // Immediate execution before CSS layout causes "No slot size for availableWidth=0".
    const scripts = Array.from(temp.querySelectorAll('script'));
    scripts.forEach((oldScript) => {
      const isPushScript = (oldScript.text || '').includes('adsbygoogle');
      if (isPushScript) {
        // Skip synchronous push script — we handle it safely in step 3 below once width > 0
        return;
      }

      const newScript = document.createElement('script');
      Array.from(oldScript.attributes).forEach((attr) => {
        newScript.setAttribute(attr.name, attr.value);
      });
      newScript.text = oldScript.text;
      container.appendChild(newScript);
    });

    // 3. For Google AdSense (<ins class="adsbygoogle">):
    // Wait until browser completes layout and container.offsetWidth > 0 before calling push({})
    if (rawCode.includes('adsbygoogle')) {
      let isCancelled = false;

      const attemptPush = (retries = 15) => {
        if (isCancelled || !containerRef.current) return;

        const ins = containerRef.current.querySelector('ins.adsbygoogle') as HTMLElement | null;
        if (!ins) return;

        // Check if already initialized by Google
        if (ins.getAttribute('data-adsbygoogle-status')) return;

        const currentWidth = containerRef.current.offsetWidth || containerRef.current.clientWidth;

        if (currentWidth > 0) {
          try {
            ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
          } catch (e) {
            // silent catch
          }
        } else if (retries > 0) {
          // Width not computed yet (layout in-flight) - retry after short interval
          setTimeout(() => attemptPush(retries - 1), 60);
        }
      };

      // Initial check with small delay to allow browser paint & reflow
      const timer = setTimeout(() => attemptPush(15), 50);

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
      style={{ minHeight: '90px' }}
    >
      <div
        ref={containerRef}
        suppressHydrationWarning
        className="w-full block mx-auto text-center overflow-hidden"
        style={{ minWidth: '280px', minHeight: '90px' }}
        data-ad-placement={placement}
      />
    </div>
  );
};
