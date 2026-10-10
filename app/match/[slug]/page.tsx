import React from 'react';
import type { Metadata } from 'next';
import api from '@/lib/api';
import { SingleMatchViewComponent } from '@/components/match/SingleMatchViewComponent';

interface MatchSlugPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: MatchSlugPageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const res = await api.get(`/matches/${slug}`, { timeout: 25000 });
    if (res.data?.success && res.data?.data?.match) {
      const match = res.data.data.match;

      let matchName = '';
      if (match.matchType === 'team_vs_team' && match.homeTeam && match.awayTeam) {
        matchName = `${match.homeTeam} vs ${match.awayTeam}`;
      } else {
        matchName = match.title || (match.homeTeam && match.awayTeam ? `${match.homeTeam} vs ${match.awayTeam}` : 'Match');
      }

      const subcatName = match.subcategoryName || 'League';
      const catName = match.categoryName || 'Sports';
      const venueStr = match.venue?.trim() ? match.venue.trim() : 'the stadium';

      const d = match.matchTime ? new Date(match.matchTime) : null;
      const matchDate = d && !isNaN(d.getTime())
        ? d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
        : 'TBA';
      const matchTime = d && !isNaN(d.getTime())
        ? d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'UTC' }) + ' UTC'
        : 'TBA';

      const displayTitle = `${matchName} Live Score & Match Updates | StreamESPN`;
      const displayDescription = `Follow ${matchName} in the ${subcatName} on ${matchDate} at ${matchTime}. Get ${catName} match details, schedules, scores, and updates from ${venueStr} on StreamESPN`;

      return {
        title: {
          absolute: displayTitle,
        },
        description: displayDescription,
        openGraph: {
          title: displayTitle,
          description: displayDescription,
        },
        twitter: {
          title: displayTitle,
          description: displayDescription,
        },
      };
    }
  } catch (e) {
    // silent catch
  }

  return {
    title: 'Live Match Stream',
    description: 'Stream live match events live on StreamESPN. Unlock all high-speed HD streams.',
    openGraph: {
      title: 'Live Match Stream | StreamESPN',
      description: 'Stream live match events live on StreamESPN. Unlock all high-speed HD streams.',
    },
  };
}

export default async function LegacyMatchPage({ params }: MatchSlugPageProps) {
  const { slug } = await params;
  return (
    <SingleMatchViewComponent
      categorySlug="sport"
      subcategorySlug="all"
      matchSlug={slug}
    />
  );
}
