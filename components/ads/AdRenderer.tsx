'use client';

import React, { useMemo, useEffect, useRef } from 'react';

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
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const isFirstMount = useRef(true);

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
    <link rel="preconnect" href="https://www.highperformanceformat.com" crossorigin>
    <link rel="dns-prefetch" href="https://www.highperformanceformat.com">
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

  // When refreshKey changes (page navigation to cat/subcat/match), reload the ad in-place smoothly with 0ms blank time!
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    if (iframeRef.current && rawCode) {
      try {
        iframeRef.current.srcdoc = iframeSrcDoc;
      } catch (e) {
        // silent catch
      }
    }
  }, [refreshKey, iframeSrcDoc, rawCode]);

  if (!rawCode) {
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
