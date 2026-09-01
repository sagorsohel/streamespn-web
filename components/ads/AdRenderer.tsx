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
  const [adLoaded, setAdLoaded] = useState<boolean>(false);

  // Helper to construct HTML for iframe with high-priority script execution and browser HTTP caching
  const prepareAdHtml = (htmlCode: string) => {
    if (!htmlCode) return '';
    const optimizedHtml = htmlCode.replace(
      /(<script\s+[^>]*src=["'])([^"']+)(["'][^>]*>)/gi,
      (match, p1, p2, p3) => {
        if (!match.includes('fetchpriority')) {
          return `${p1}${p2}${p3.replace('>', ' fetchpriority="high">')}`;
        }
        return match;
      }
    );
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="preconnect" href="https://www.highperformanceformat.com" crossorigin><link rel="dns-prefetch" href="https://www.highperformanceformat.com"><style>html,body{margin:0;padding:0;width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:transparent;overflow:hidden;}</style></head><body>${optimizedHtml}</body></html>`;
  };

  // Dual Slot Contents & Seeds - Initialize slot0 synchronously with rawCode & seed 1 for instant 0ms rendering!
  const [slot0Content, setSlot0Content] = useState<string>(rawCode);
  const [slot0Seed, setSlot0Seed] = useState<number>(rawCode ? 1 : 0);

  const [slot1Content, setSlot1Content] = useState<string>('');
  const [slot1Seed, setSlot1Seed] = useState<number>(0);

  // Active Slot: 0 or 1
  const [activeSlot, setActiveSlot] = useState<0 | 1>(0);

  const isMountedRef = useRef<boolean>(false);
  const lastRefreshKeyRef = useRef<string | number | undefined>(refreshKey);
  const pendingSlotRef = useRef<0 | 1 | null>(null);

  const fallbackTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Track client mount via ref — no extra state/render cycle needed
  const [isMounted, setIsMounted] = useState<boolean>(false);
  useEffect(() => { setIsMounted(true); }, []);

  // Sync slot content if rawCode prop changes
  useEffect(() => {
    if (!rawCode) return;
    if (activeSlot === 0) {
      setSlot0Content(rawCode);
      if (slot0Seed === 0) setSlot0Seed(1);
    } else {
      setSlot1Content(rawCode);
      if (slot1Seed === 0) setSlot1Seed(1);
    }
    isMountedRef.current = true;
    lastRefreshKeyRef.current = refreshKey;
  }, [rawCode]);

  // Function to trigger ad refresh into the inactive slot smoothly in background (less than 1 sec!)
  const triggerRefresh = () => {
    if (!rawCode) return;
    const newSeed = Date.now() + Math.floor(Math.random() * 100000);
    const targetSlot: 0 | 1 = activeSlot === 0 ? 1 : 0;
    pendingSlotRef.current = targetSlot;

    if (targetSlot === 0) {
      setSlot0Content(rawCode);
      setSlot0Seed(newSeed);
    } else {
      setSlot1Content(rawCode);
      setSlot1Seed(newSeed);
    }

    // Fast 400ms timer to swap slots smoothly (less than 1 sec!)
    if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
    fallbackTimerRef.current = setTimeout(() => {
      if (pendingSlotRef.current === targetSlot) {
        setActiveSlot(targetSlot);
        pendingSlotRef.current = null;
      }
    }, 400);
  };

  // Trigger ad refresh when refreshKey changes
  useEffect(() => {
    if (refreshKey !== undefined && refreshKey !== lastRefreshKeyRef.current) {
      const prevKey = lastRefreshKeyRef.current;
      lastRefreshKeyRef.current = refreshKey;
      if (prevKey !== undefined) {
        triggerRefresh();
      }
    }
  }, [refreshKey]);

  // Periodic auto-refresh interval (e.g. every 25 seconds)
  useEffect(() => {
    if (!rawCode || autoRefreshSeconds <= 0) return;

    const interval = setInterval(() => {
      triggerRefresh();
    }, autoRefreshSeconds * 1000);

    return () => clearInterval(interval);
  }, [rawCode, autoRefreshSeconds, activeSlot]);

  // Handler when inactive slot iframe fires onLoad
  const handleSlotLoad = (slotIndex: 0 | 1) => {
    if (pendingSlotRef.current === slotIndex) {
      if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
      setActiveSlot(slotIndex);
      pendingSlotRef.current = null;
    }
  };

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

  const baseKey = uniqueKey ? `${uniqueKey}` : `ad`;

  return (
    <div
      suppressHydrationWarning
      className={`overflow-hidden flex items-center justify-center py-1 max-w-full w-full relative ${className}`}
      style={{ minHeight: `${extractedHeight}px`, height: `${extractedHeight}px` }}
    >
      {/* Pure Clean Skeleton Pulse Placeholder */}
      {!adLoaded && (
        <div className="absolute inset-0 bg-[var(--bg-card-hover)] opacity-70 animate-pulse rounded-xl pointer-events-none" />
      )}

      {/* SLOT 0 IFRAME (Rendered directly in initial SSR HTML for 0ms instant execution!) */}
      {Boolean(slot0Content) && (
        <iframe
          key={`${baseKey}-slot0-${slot0Seed || 1}`}
          srcDoc={prepareAdHtml(slot0Content)}
          loading="eager"
          scrolling="no"
          frameBorder="0"
          aria-label="Advertisement Slot 0"
          onLoad={() => {
            setAdLoaded(true);
            handleSlotLoad(0);
          }}
          style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            border: 'none',
            overflow: 'hidden',
            width: '100%',
            maxWidth: `${extractedWidth}px`,
            height: `${extractedHeight}px`,
            opacity: activeSlot === 0 ? 1 : 0,
            zIndex: activeSlot === 0 ? 2 : 1,
            pointerEvents: activeSlot === 0 ? 'auto' : 'none',
            transition: 'opacity 200ms ease-in-out',
          }}
        />
      )}

      {/* SLOT 1 IFRAME (For smooth silent background refreshes) */}
      {isMounted && slot1Seed > 0 && Boolean(slot1Content) && (
        <iframe
          key={`${baseKey}-slot1-${slot1Seed}`}
          srcDoc={prepareAdHtml(slot1Content)}
          loading="eager"
          scrolling="no"
          frameBorder="0"
          aria-label="Advertisement Slot 1"
          onLoad={() => {
            setAdLoaded(true);
            handleSlotLoad(1);
          }}
          style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            border: 'none',
            overflow: 'hidden',
            width: '100%',
            maxWidth: `${extractedWidth}px`,
            height: `${extractedHeight}px`,
            opacity: activeSlot === 1 ? 1 : 0,
            zIndex: activeSlot === 1 ? 2 : 1,
            pointerEvents: activeSlot === 1 ? 'auto' : 'none',
            transition: 'opacity 200ms ease-in-out',
          }}
        />
      )}
    </div>
  );
};
