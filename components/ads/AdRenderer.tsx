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
  // Helper to construct HTML for iframe with cache-busting on refresh to force fresh ad impression
  const prepareAdHtml = (htmlCode: string, seed: number) => {
    if (!htmlCode) return '';
    let finalCode = htmlCode;
    if (seed > 1) {
      finalCode = htmlCode.replace(
        /(<script\s+[^>]*src=["'])([^"']+)(["'][^>]*>)/gi,
        (match, p1, p2, p3) => {
          const joinChar = p2.includes('?') ? '&' : '?';
          return `${p1}${p2}${joinChar}_cb=${seed}${p3}`;
        }
      );
    }
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>html,body{margin:0;padding:0;width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:transparent;overflow:hidden;}</style></head><body>${finalCode}</body></html>`;
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

  if (!rawCode) return null;

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
      className={`overflow-hidden flex items-center justify-center py-1 max-w-full w-full relative ${className}`}
      style={{ minHeight: `${extractedHeight}px`, height: `${extractedHeight}px` }}
    >
      {/* SLOT 0 IFRAME */}
      {slot0Seed > 0 && (
        <iframe
          key={`${baseKey}-slot0-${slot0Seed}`}
          srcDoc={prepareAdHtml(slot0Content, slot0Seed)}
          scrolling="no"
          frameBorder="0"
          aria-label="Advertisement Slot 0"
          onLoad={() => handleSlotLoad(0)}
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

      {/* SLOT 1 IFRAME */}
      {slot1Seed > 0 && (
        <iframe
          key={`${baseKey}-slot1-${slot1Seed}`}
          srcDoc={prepareAdHtml(slot1Content, slot1Seed)}
          scrolling="no"
          frameBorder="0"
          aria-label="Advertisement Slot 1"
          onLoad={() => handleSlotLoad(1)}
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
