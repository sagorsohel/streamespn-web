'use client';

import React, { useEffect, useRef } from 'react';

interface InlineAdProps {
  code: string;
  placement?: string;
  className?: string;
}

/**
 * Renders ad code directly in the page DOM and executes its <script> tags.
 * Used for Google AdSense (needs the parent page) and script-only snippets
 * (pop-under / social bar / native loaders) that must run on the real page.
 */
export const InlineAd: React.FC<InlineAdProps> = ({ code, placement = 'general', className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !code) return;

    if (container.getAttribute('data-loaded-code') !== code) {
      container.innerHTML = code;
      container.setAttribute('data-loaded-code', code);
    }

    const scripts = Array.from(container.querySelectorAll('script'));
    let hasAdSensePush = false;

    scripts.forEach((oldScript) => {
      if (oldScript.getAttribute('data-executed') === 'true') return;
      const scriptText = oldScript.textContent || '';

      // adsbygoogle.push() is invoked once the container has a real width
      if (scriptText.includes('adsbygoogle') && scriptText.includes('.push(')) {
        hasAdSensePush = true;
        oldScript.remove();
        return;
      }

      const newScript = document.createElement('script');
      Array.from(oldScript.attributes).forEach((attr) => newScript.setAttribute(attr.name, attr.value));
      newScript.textContent = scriptText;
      newScript.setAttribute('data-executed', 'true');
      oldScript.parentNode?.replaceChild(newScript, oldScript);
    });

    if (hasAdSensePush || code.includes('adsbygoogle')) {
      let cancelled = false;
      const attemptPush = (retries = 20) => {
        if (cancelled || !containerRef.current) return;
        const ins = containerRef.current.querySelector('ins.adsbygoogle') as HTMLElement | null;
        if (!ins || ins.getAttribute('data-adsbygoogle-status')) return;

        if ((containerRef.current.offsetWidth || containerRef.current.clientWidth) > 0) {
          try {
            ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
          } catch {
            // ignore
          }
        } else if (retries > 0) {
          setTimeout(() => attemptPush(retries - 1), 50);
        }
      };
      const timer = setTimeout(() => attemptPush(20), 50);
      return () => {
        cancelled = true;
        clearTimeout(timer);
      };
    }
  }, [code]);

  return (
    <div
      ref={containerRef}
      suppressHydrationWarning
      data-ad-placement={placement}
      className={`w-full flex justify-center items-center flex-col mx-auto text-center [&_img]:max-w-full [&_img]:h-auto [&_img]:inline-block [&_iframe]:max-w-full [&_iframe]:mx-auto ${className}`}
      dangerouslySetInnerHTML={{ __html: code }}
    />
  );
};
