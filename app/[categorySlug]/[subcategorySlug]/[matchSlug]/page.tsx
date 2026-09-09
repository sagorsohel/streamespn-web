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
        displayTitle = `LIVE: ${teamA} vs ${teamB} Match Stream`;
        displayDescription = `Stream "${teamA} vs ${teamB}" live match including scores, standings, and highlights.`;
      } else {
        const matchTitle = match.title || 'Live Stream';
        displayTitle = `${matchTitle}`;
        displayDescription = `Stream ${matchTitle} live on StreamESPN. Unlock all high-speed HD streams.`;
      }

      return {
        title: displayTitle,
        description: displayDescription,
        openGraph: {
          title: `${displayTitle} | StreamESPN`,
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

async function getInitialAds() {
  try {
    const urls = [
      process.env.BACKEND_API_URL,
      process.env.NEXT_PUBLIC_API_URL,
      'https://backendapi.streamespn.org/api',
      'http://localhost:5000/api',
    ].filter(Boolean) as string[];

    for (const rawUrl of urls) {
      try {
        const cleanUrl = rawUrl.replace(/\/$/, '');
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1500);
        const res = await fetch(`${cleanUrl}/ads/fast`, {
          next: { revalidate: 30 },
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (res.ok) {
          const data = await res.json();
          if (data?.data?.settings) {
            return data.data.settings;
          }
        }
      } catch {
        // Try next fallback URL
      }
    }
    return {};
  } catch (e) {
    return {};
  }
}

export default async function SingleMatchPage({ params }: SingleMatchProps) {
  const { categorySlug, subcategorySlug, matchSlug } = await params;
  const initialAdsSettings = await getInitialAds();

  return (
    <SingleMatchViewComponent
      categorySlug={categorySlug}
      subcategorySlug={subcategorySlug}
      matchSlug={matchSlug}
      initialAdsSettings={initialAdsSettings}
    />
  );
}
