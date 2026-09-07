'use client';

import React, { useMemo, useEffect, useState, useRef } from 'react';

interface AdRendererProps {
  code?: string;
  className?: string;
  uniqueKey?: string | number;
  refreshKey?: string | number;
  autoRefreshSeconds?: number;
}

export const AdRenderer: React.FC<AdRendererProps> = ({
  code,
  className = '',
  refreshKey,
}) => {
  const rawCode = (code || '').trim();
  const [mounted, setMounted] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const isFirstMount = useRef(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { extractedWidth, extractedHeight } = useMemo(() => {
    if (!rawCode) return { extractedWidth: 320, extractedHeight: 50 };

    let width = 320;
    let height = 50;

    const widthMatch = rawCode.match(/['"]?width['"]?\s*:\s*(\d+)/i);
    if (widthMatch && widthMatch[1]) {
      width = parseInt(widthMatch[1], 10);
    }

    const heightMatch = rawCode.match(/['"]?height['"]?\s*:\s*(\d+)/i);
    if (heightMatch && heightMatch[1]) {
      height = parseInt(heightMatch[1], 10);
    }

    return { extractedWidth: width, extractedHeight: height };
  }, [rawCode]);

  const iframeSrcDoc = useMemo(() => {
    if (!rawCode) return '';
    return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
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
      html, body {
        margin: 0;
        padding: 0;
        overflow: hidden;
        background: transparent !important;
        display: flex;
        justify-content: center;
        align-items: center;
        width: 100%;
        height: 100%;
      }
    </style>
  </head>
  <body>
    ${rawCode}
  </body>
</html>`;
  }, [rawCode]);

  // When refreshKey changes (page navigation to cat/subcat/match), reload in-place smoothly
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    if (iframeRef.current && rawCode && mounted) {
      try {
        iframeRef.current.srcdoc = iframeSrcDoc;
      } catch (e) {
        // silent catch
      }
    }
  }, [refreshKey, iframeSrcDoc, rawCode, mounted]);

  if (!rawCode || !mounted) {
    return null;
  }

  return (
    <div
      suppressHydrationWarning
      className={`flex justify-center items-center overflow-hidden bg-transparent max-w-full w-full relative ${className}`}
      style={{ minHeight: `${extractedHeight}px`, height: `${extractedHeight}px` }}
    >
      <iframe
        ref={iframeRef}
        srcDoc={iframeSrcDoc}
        width={extractedWidth ? `${extractedWidth}px` : '100%'}
        height={`${extractedHeight}px`}
        style={{
          border: 'none',
          overflow: 'hidden',
          background: 'transparent',
          maxWidth: '100%',
        }}
        scrolling="no"
        title="Advertisement"
      />
    </div>
  );
};
