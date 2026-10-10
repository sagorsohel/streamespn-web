import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import SearchResultsView from './SearchResultsView';
import { MatchCardSkeleton } from '@/components/home/MatchCardSkeleton';

export const metadata: Metadata = {
  title: 'Search Sports Matches, Live Scores & Schedules | StreamESPN',
  description:
    'Search for live sports scores, fixtures, upcoming matches, team schedules, and sports streams on StreamESPN.',
};

function SearchPageFallback() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-4 pb-16 flex-1 w-full space-y-6">
      <div className="h-28 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-glass)] animate-pulse" />
      <div className="space-y-3">
        {[...Array(6)].map((_, i) => (
          <MatchCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchPageFallback />}>
      <SearchResultsView />
    </Suspense>
  );
}
