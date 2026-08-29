import React from 'react';
import type { Metadata } from 'next';
import api from '@/lib/api';
import { SubcategoryOrMatchView } from './SubcategoryOrMatchView';

interface NestedPageProps {
  params: Promise<{ categorySlug: string; subcategorySlug: string }>;
}

export async function generateMetadata({ params }: NestedPageProps): Promise<Metadata> {
  const { categorySlug, subcategorySlug } = await params;

  try {
    const matchRes = await api.get(`/matches/${subcategorySlug}`, { timeout: 25000 });
    if (matchRes.data?.success && matchRes.data?.data?.match) {
      const match = matchRes.data.data.match;
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

  const cleanCat = categorySlug ? categorySlug.replace(/-/g, ' ') : 'Sports';
  const cleanSub = subcategorySlug ? subcategorySlug.replace(/-/g, ' ') : '';
  const title = cleanSub
    ? `${cleanSub.toUpperCase()} (${cleanCat.toUpperCase()}) Live Streams | StreamESPN`
    : `${cleanCat.toUpperCase()} Live Streams | StreamESPN`;

  return {
    title,
    description: `Watch ${cleanSub || cleanCat} live streams HD. Enjoy fast and lag-free sports coverage.`,
  };
}

export default async function SubcategoryPage({ params }: NestedPageProps) {
  const { categorySlug, subcategorySlug } = await params;
  return <SubcategoryOrMatchView categorySlug={categorySlug} subcategorySlug={subcategorySlug} />;
}
