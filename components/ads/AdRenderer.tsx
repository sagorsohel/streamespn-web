'use client';

import React, { useEffect, useRef } from 'react';

interface AdRendererProps {
  code?: string;
  className?: string;
  uniqueKey?: string | number;
}

export const AdRenderer: React.FC<AdRendererProps> = ({ code, className = '', uniqueKey }) => {
  const mountTimeRef = useRef<number>(typeof window !== 'undefined' ? performance.now() : 0);

  if (!code || !code.trim()) return null;

  const trimmedCode = code.trim();

  // Extract height and width
  let extractedHeight = 50;
  let extractedWidth = 320;

  const heightMatch = trimmedCode.match(/['"]?height['"]?\s*:\s*(\d+)/i);
  if (heightMatch && heightMatch[1]) {
    extractedHeight = parseInt(heightMatch[1], 10);
  }

  const widthMatch = trimmedCode.match(/['"]?width['"]?\s*:\s*(\d+)/i);
  if (widthMatch && widthMatch[1]) {
    extractedWidth = parseInt(widthMatch[1], 10);
  }

  const htmlContent = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>html,body{margin:0;padding:0;width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:transparent;overflow:hidden;}</style></head><body>${trimmedCode}</body></html>`;

  const iframeKey = uniqueKey ? `${uniqueKey}-${trimmedCode.length}` : `ad-${trimmedCode.length}`;

  return (
    <div
      className={`overflow-hidden flex items-center justify-center py-1 max-w-full w-full ${className}`}
      style={{ minHeight: `${extractedHeight}px` }}
    >
      <iframe
        key={iframeKey}
        srcDoc={htmlContent}
        scrolling="no"
        frameBorder="0"
        aria-label="Advertisement"
        onLoad={() => {
          if (typeof window !== 'undefined') {
            const totalLoadTime = Math.round(performance.now() - mountTimeRef.current);
            console.log(`[AdRenderer] 🎯 Ad iframe rendered for "${iframeKey}" in ${totalLoadTime}ms`);
          }
        }}
        style={{
          border: 'none',
          overflow: 'hidden',
          width: '100%',
          maxWidth: `${extractedWidth}px`,
          height: `${extractedHeight}px`,
          display: 'block',
          margin: '0 auto',
        }}
      />
    </div>
  );
};
