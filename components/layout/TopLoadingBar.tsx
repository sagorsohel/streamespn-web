'use client';

import React, { useEffect, useState, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export const startTopLoader = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('top-loader-start'));
  }
};

export const stopTopLoader = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('top-loader-stop'));
  }
};

interface TopLoadingBarProps {
  isLoading?: boolean;
}

export const TopLoadingBar: React.FC<TopLoadingBarProps> = ({ isLoading: externalLoading }) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState<number>(0);
  const [visible, setVisible] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout[]>([]);

  const clearAllTimers = () => {
    timerRef.current.forEach((t) => clearTimeout(t));
    timerRef.current = [];
  };

  const triggerStart = () => {
    clearAllTimers();
    setVisible(true);
    setProgress(30);
    const t1 = setTimeout(() => setProgress(70), 150);
    const t2 = setTimeout(() => setProgress(88), 400);
    timerRef.current.push(t1, t2);
  };

  const triggerStop = () => {
    clearAllTimers();
    setProgress(100);
    const t1 = setTimeout(() => {
      setVisible(false);
      const t2 = setTimeout(() => setProgress(0), 200);
      timerRef.current.push(t2);
    }, 250);
    timerRef.current.push(t1);
  };

  // Listen for global custom events
  useEffect(() => {
    const handleStart = () => triggerStart();
    const handleStop = () => triggerStop();

    window.addEventListener('top-loader-start', handleStart);
    window.addEventListener('top-loader-stop', handleStop);

    return () => {
      window.removeEventListener('top-loader-start', handleStart);
      window.removeEventListener('top-loader-stop', handleStop);
    };
  }, []);

  // Listen for route changes or externalLoading state
  useEffect(() => {
    if (externalLoading) {
      triggerStart();
    } else {
      triggerStop();
    }
  }, [pathname, searchParams, externalLoading]);

  if (!visible && progress === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[999999] pointer-events-none h-[3.5px] bg-transparent">
      <div
        className="h-full bg-gradient-to-r from-red-600 via-amber-400 to-[#F8C831] shadow-[0_0_12px_#F8C831,0_0_6px_#F8C831] transition-all duration-300 ease-out"
        style={{
          width: `${progress}%`,
          opacity: visible ? 1 : 0,
        }}
      />
    </div>
  );
};
