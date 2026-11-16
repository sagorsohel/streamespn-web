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
      // Keep checking: push whenever the <ins> has a real width but Google has not processed it yet
      // (handles late layout, slow adsbygoogle.js load and ignored early pushes). Stops once processed.
      let ticks = 0;
      const check = () => {
        const ins = containerRef.current?.querySelector('ins.adsbygoogle') as HTMLElement | null;
        if (!ins) return;
        if (ins.getAttribute('data-adsbygoogle-status')) {
          clearInterval(interval);
          return;
        }
        if ((ins.offsetWidth || ins.clientWidth) > 0) {
          try {
            ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
          } catch {
            // ignore
          }
        }
        // retry a few times (about 30s) then give up
        if (++ticks >= 15) clearInterval(interval);
      };
      const interval = setInterval(check, 2000);
      const first = setTimeout(check, 100);
      return () => {
        clearInterval(interval);
        clearTimeout(first);
      };
    }
  }, [code]);

  return (
    <div
      ref={containerRef}
      suppressHydrationWarning
      data-ad-placement={placement}
      className={`w-full flex justify-center items-center flex-col mx-auto text-center [&_ins.adsbygoogle]:!block [&_ins.adsbygoogle]:w-full [&_ins.adsbygoogle]:min-h-[50px] [&_img]:max-w-full [&_img]:h-auto [&_img]:inline-block [&_iframe]:max-w-full [&_iframe]:mx-auto ${className}`}
      dangerouslySetInnerHTML={{ __html: code }}
    />
  );
};
