'use client';

import React, { useEffect, useState, useRef } from 'react';

interface AdRendererProps {
  code?: string;
  className?: string;
  uniqueKey?: string | number;
}

export const AdRenderer: React.FC<AdRendererProps> = ({ code, className = '', uniqueKey }) => {
  const currentCode = (code || '').trim();
  const [activeCode, setActiveCode] = useState<string>(currentCode);
  const [nextCode, setNextCode] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);

  // Sync / Double-buffer transition when code changes
  useEffect(() => {
    if (currentCode && currentCode !== activeCode) {
      if (!activeCode) {
        setActiveCode(currentCode);
      } else {
        setNextCode(currentCode);
        setIsTransitioning(true);
      }
    }
  }, [currentCode, activeCode]);

  if (!currentCode && !activeCode) return null;

  const activeForSizing = nextCode || activeCode;

  // Extract height and width for zero layout shift
  let extractedHeight = 50;
  let extractedWidth = 320;

  const heightMatch = activeForSizing.match(/['"]?height['"]?\s*:\s*(\d+)/i);
  if (heightMatch && heightMatch[1]) {
    extractedHeight = parseInt(heightMatch[1], 10);
  }

  const widthMatch = activeForSizing.match(/['"]?width['"]?\s*:\s*(\d+)/i);
  if (widthMatch && widthMatch[1]) {
    extractedWidth = parseInt(widthMatch[1], 10);
  }

  const generateHtml = (rawCode: string) =>
    `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>html,body{margin:0;padding:0;width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:transparent;overflow:hidden;}</style></head><body>${rawCode}</body></html>`;

  const baseKey = uniqueKey ? `${uniqueKey}` : `ad`;
  const primaryKey = `${baseKey}-${activeCode.length}`;
  const preloaderKey = nextCode ? `${baseKey}-${nextCode.length}-preload` : null;

  const handleNextLoad = () => {
    if (nextCode) {
      setActiveCode(nextCode);
      setNextCode(null);
      setIsTransitioning(false);
    }
  };

  return (
    <div
      className={`overflow-hidden flex items-center justify-center py-1 max-w-full w-full relative ${className}`}
      style={{ minHeight: `${extractedHeight}px`, height: `${extractedHeight}px` }}
    >
      {/* Primary Visible Ad Iframe (Remains 100% visible while preloading next) */}
      <iframe
        key={primaryKey}
        srcDoc={generateHtml(activeCode)}
        scrolling="no"
        frameBorder="0"
        aria-label="Advertisement"
        style={{
          border: 'none',
          overflow: 'hidden',
          width: '100%',
          maxWidth: `${extractedWidth}px`,
          height: `${extractedHeight}px`,
          display: 'block',
          margin: '0 auto',
          opacity: 1,
          transition: 'opacity 150ms ease-in-out',
        }}
      />

      {/* Invisible Preloader Iframe (Loads new ad in background, swaps instantly on load) */}
      {isTransitioning && nextCode && (
        <iframe
          key={preloaderKey!}
          srcDoc={generateHtml(nextCode)}
          scrolling="no"
          frameBorder="0"
          aria-label="Advertisement Preloader"
          onLoad={handleNextLoad}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            border: 'none',
            overflow: 'hidden',
            width: '100%',
            maxWidth: `${extractedWidth}px`,
            height: `${extractedHeight}px`,
            opacity: 0.001,
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  );
};
