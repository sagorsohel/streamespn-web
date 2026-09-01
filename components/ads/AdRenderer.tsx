'use client';

import React, { useEffect, useState, useRef } from 'react';

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
  uniqueKey,
  refreshKey,
  autoRefreshSeconds = 25,
}) => {
  const rawCode = (code || '').trim();
  const [renderSeed, setRenderSeed] = useState<number>(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastRefreshKeyRef = useRef<string | number | undefined>(refreshKey);

  // Trigger fresh ad render when refreshKey (e.g. route/page change) changes
  useEffect(() => {
    if (refreshKey !== undefined && refreshKey !== lastRefreshKeyRef.current) {
      lastRefreshKeyRef.current = refreshKey;
      setRenderSeed((prev) => prev + 1);
    }
  }, [refreshKey]);

  // Periodic auto-refresh interval
  useEffect(() => {
    if (!rawCode || autoRefreshSeconds <= 0) return;

    const interval = setInterval(() => {
      setRenderSeed((prev) => prev + 1);
    }, autoRefreshSeconds * 1000);

    return () => clearInterval(interval);
  }, [rawCode, autoRefreshSeconds]);

  const codeForSizing = rawCode;
  let extractedHeight = 50;
  let extractedWidth = 320;

  const heightMatch = codeForSizing.match(/['"]?height['"]?\s*:\s*(\d+)/i);
  if (heightMatch && heightMatch[1]) {
    extractedHeight = parseInt(heightMatch[1], 10);
  }

  const widthMatch = codeForSizing.match(/['"]?width['"]?\s*:\s*(\d+)/i);
  if (widthMatch && widthMatch[1]) {
    extractedWidth = parseInt(widthMatch[1], 10);
  }

  // Native doc.write injection to guarantee 100% execution of Adsterra document.write scripts
  useEffect(() => {
    if (!containerRef.current || !rawCode) return;
    const container = containerRef.current;
    container.innerHTML = '';

    const iframe = document.createElement('iframe');
    iframe.style.width = '100%';
    iframe.style.maxWidth = `${extractedWidth}px`;
    iframe.style.height = `${extractedHeight}px`;
    iframe.style.border = 'none';
    iframe.style.overflow = 'hidden';
    iframe.scrolling = 'no';
    iframe.setAttribute('frameBorder', '0');
    iframe.setAttribute('aria-label', 'Advertisement');

    container.appendChild(iframe);

    try {
      const doc = iframe.contentWindow?.document || iframe.contentDocument;
      if (doc) {
        doc.open();
        doc.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><style>html,body{margin:0;padding:0;width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:transparent;overflow:hidden;}</style></head><body>${rawCode}</body></html>`);
        doc.close();
      }
    } catch (e) {
      // Fallback if cross-origin or restriction
      iframe.srcdoc = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>html,body{margin:0;padding:0;width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:transparent;overflow:hidden;}</style></head><body>${rawCode}</body></html>`;
    }
  }, [rawCode, renderSeed, extractedWidth, extractedHeight]);

  if (!rawCode) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      suppressHydrationWarning
      className={`overflow-hidden flex items-center justify-center py-1 max-w-full w-full relative ${className}`}
      style={{ minHeight: `${extractedHeight}px`, height: `${extractedHeight}px` }}
    >
      {/* SSR Initial Iframe Placeholder */}
      <iframe
        srcDoc={`<!DOCTYPE html><html><head><meta charset="utf-8"><style>html,body{margin:0;padding:0;width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:transparent;overflow:hidden;}</style></head><body>${rawCode}</body></html>`}
        scrolling="no"
        frameBorder="0"
        aria-label="Advertisement"
        style={{
          border: 'none',
          overflow: 'hidden',
          width: '100%',
          maxWidth: `${extractedWidth}px`,
          height: `${extractedHeight}px`,
        }}
      />
    </div>
  );
};
