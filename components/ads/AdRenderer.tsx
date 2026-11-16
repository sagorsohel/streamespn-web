'use client';

import React, { useMemo, useEffect, useState, useRef, useCallback } from 'react';
import { InlineAd } from './InlineAd';

interface AdRendererProps {
  code?: string;
  className?: string;
  uniqueKey?: string | number;
  refreshKey?: string | number;
  autoRefreshSeconds?: number;
}

type AdMode = 'adsense' | 'inline' | 'iframe';

/**
 * - AdSense           -> rendered on the real page (needs the parent's adsbygoogle.js)
 * - script-only code  -> rendered on the real page (pop-under, social bar, loaders)
 * - everything else   -> sandbox-free iframe (document.write based ad networks such as
 *                        Adsterra atOptions/invoke.js, iframes, images, html, custom JS)
 */
const detectMode = (code: string): AdMode => {
  if (/adsbygoogle/i.test(code)) return 'adsense';
  const hasAtOptions = /atOptions/i.test(code);
  const visibleMarkup = code
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, '')
    .trim();
  if (!hasAtOptions && !visibleMarkup && /<script/i.test(code)) return 'inline';
  return 'iframe';
};

export const AdRenderer: React.FC<AdRendererProps> = ({ code, className = '', refreshKey }) => {
  const rawCode = (code || '').trim();
  const [mounted, setMounted] = useState(false);
  const [height, setHeight] = useState<number | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const isFirstMount = useRef(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  const mode = useMemo<AdMode>(() => (rawCode ? detectMode(rawCode) : 'iframe'), [rawCode]);

  // Initial height hint from the code (e.g. atOptions height) until real content is measured
  const hintHeight = useMemo(() => {
    const m = rawCode.match(/['"]?height['"]?\s*[:=]\s*['"]?(\d+)/i);
    return m ? parseInt(m[1], 10) : 50;
  }, [rawCode]);

  const iframeSrcDoc = useMemo(() => {
    if (!rawCode) return '';
    return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <base target="_blank">
    <script>
      try {
        if (!window.performance) window.performance = {};
        var p = window.performance;
        var orig = p.getEntriesByType;
        p.getEntriesByType = function(t) {
          if (t === 'navigation') {
            var res = orig ? orig.call(p, t) : [];
            if (!res || !res.length) {
              return [{ startTime: 0, responseStart: 0, domContentLoadedEventEnd: 0, loadEventEnd: 0 }];
            }
            return res;
          }
          return orig ? orig.call(p, t) : [];
        };
      } catch (e) {}
    </script>
    <style>
      html, body { margin: 0; padding: 0; background: transparent !important; overflow: hidden; }
      body { display: flex; flex-direction: column; align-items: center; }
      img, iframe, video { max-width: 100%; }
    </style>
  </head>
  <body>
    ${rawCode}
  </body>
</html>`;
  }, [rawCode]);

  // Resize the iframe to whatever the ad actually renders (ads load asynchronously)
  const measure = useCallback(() => {
    try {
      const doc = iframeRef.current?.contentDocument;
      if (!doc || !doc.body) return;
      const h = Math.ceil(Math.max(doc.body.scrollHeight, doc.body.offsetHeight));
      if (h > 0) setHeight((prev) => (prev === h ? prev : h));
    } catch {
      // cross-origin access blocked — keep hint height
    }
  }, []);

  useEffect(() => {
    if (mode !== 'iframe' || !mounted || !rawCode) return;
    const interval = setInterval(measure, 500);
    const stop = setTimeout(() => clearInterval(interval), 20000);
    return () => {
      clearInterval(interval);
      clearTimeout(stop);
    };
  }, [mode, mounted, rawCode, iframeSrcDoc, measure]);

  // Reload in place when navigating (refreshKey changes)
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    if (mode === 'iframe' && iframeRef.current && rawCode && mounted) {
      try {
        iframeRef.current.srcdoc = iframeSrcDoc;
      } catch {
        // ignore
      }
    }
  }, [refreshKey, iframeSrcDoc, rawCode, mounted, mode]);

  if (!rawCode || !mounted) return null;

  if (mode !== 'iframe') {
    return (
      <div suppressHydrationWarning className={`w-full max-w-full ${className}`}>
        <InlineAd code={rawCode} />
      </div>
    );
  }

  const h = height ?? hintHeight;

  return (
    <div
      suppressHydrationWarning
      className={`flex justify-center items-center bg-transparent max-w-full w-full relative ${className}`}
      style={{ minHeight: `${h}px` }}
    >
      <iframe
        ref={iframeRef}
        srcDoc={iframeSrcDoc}
        onLoad={measure}
        width="100%"
        height={`${h}px`}
        style={{ border: 'none', overflow: 'hidden', background: 'transparent', maxWidth: '100%', width: '100%' }}
        scrolling="no"
        title="Advertisement"
      />
    </div>
  );
};
