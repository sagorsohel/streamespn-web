import React from 'react';
import type { Metadata } from 'next';
import api from '@/lib/api';
import { SingleMatchViewComponent } from '@/components/match/SingleMatchViewComponent';

interface SingleMatchProps {
  params: Promise<{ categorySlug: string; subcategorySlug: string; matchSlug: string }>;
}

export async function generateMetadata({ params }: SingleMatchProps): Promise<Metadata> {
  const { matchSlug } = await params;

  try {
    const res = await api.get(`/matches/${matchSlug}`, { timeout: 25000 });
    if (res.data?.success && res.data?.data?.match) {
      const match = res.data.data.match;

      let displayTitle = '';
      let displayDescription = '';

      if (match.matchType === 'team_vs_team') {
        const teamA = match.homeTeam || 'Team A';
        const teamB = match.awayTeam || 'Team B';
        displayTitle = `LIVE: ${teamA} vs ${teamB} Match Stream | StreamESPN`;
        displayDescription = `Stream "${teamA} vs ${teamB}" live match including scores, standings, and highlights.`;
      } else {
        const matchTitle = match.title || 'Live Stream';
        displayTitle = `${matchTitle} | StreamESPN`;
        displayDescription = `Stream ${matchTitle} live on StreamESPN. Unlock all high-speed HD streams.`;
      }

      return {
        title: displayTitle,
        description: displayDescription,
        openGraph: {
          title: displayTitle,
          description: displayDescription,
        },
      };
    }
  } catch (e) {
    // silent catch
  }

  return {
    title: 'Live Match Stream | StreamESPN',
    description: 'Stream live match events live on StreamESPN. Unlock all high-speed HD streams.',
  };
}

export default async function SingleMatchPage({ params }: SingleMatchProps) {
  const { categorySlug, subcategorySlug, matchSlug } = await params;
  return (
    <SingleMatchViewComponent
      categorySlug={categorySlug}
      subcategorySlug={subcategorySlug}
      matchSlug={matchSlug}
    />
  );
}
