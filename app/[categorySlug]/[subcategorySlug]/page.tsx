import React from 'react';
import type { Metadata } from 'next';
import api from '@/lib/api';
import { SubcategoryOrMatchView } from './SubcategoryOrMatchView';

interface NestedPageProps {
  params: Promise<{ categorySlug: string; subcategorySlug: string }>;
}

export async function generateMetadata({ params }: NestedPageProps): Promise<Metadata> {
  const { categorySlug, subcategorySlug } = await params;

  const isLikelyMatch = subcategorySlug?.includes('-vs-') || /-\d{4}-\d{2}-\d{2}/.test(subcategorySlug || '');

  if (isLikelyMatch) {
    try {
      const matchRes = await api.get(`/matches/${subcategorySlug}`, { timeout: 25000 });
      if (matchRes.data?.success && matchRes.data?.data?.match) {
        const match = matchRes.data.data.match;
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
  }

  const knownAcronyms: Record<string, string> = {
    aew: 'AEW',
    ufc: 'UFC',
    wwe: 'WWE',
    nba: 'NBA',
    nfl: 'NFL',
    nhl: 'NHL',
    mlb: 'MLB',
    mls: 'MLS',
    f1: 'F1',
    motogp: 'MotoGP',
    bkfc: 'BKFC',
    wrc: 'WRC',
    wnba: 'WNBA',
    hs: 'HS',
    fifa: 'FIFA',
    uefa: 'UEFA',
  };

  const formatSlugToTitle = (slug: string): string => {
    if (!slug) return '';
    return slug
      .split('-')
      .map((word) => knownAcronyms[word.toLowerCase()] || (word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()))
      .join(' ');
  };

  let subName = formatSlugToTitle(subcategorySlug);
  let cateName = formatSlugToTitle(categorySlug);

  try {
    const [subRes, sportsRes] = await Promise.all([
      api.get('/subcategories?all=true', { timeout: 10000 }).catch(() => null),
      api.get('/sports', { timeout: 10000 }).catch(() => null),
    ]);

    if (subRes?.data?.success && Array.isArray(subRes.data?.data?.subcategories)) {
      const match = subRes.data.data.subcategories.find(
        (s: any) =>
          s.name?.toLowerCase() === subcategorySlug.replace(/-/g, ' ').toLowerCase() ||
          s.name?.toLowerCase().replace(/\s+/g, '-') === subcategorySlug.toLowerCase()
      );
      if (match?.name) subName = match.name;
    }

    if (sportsRes?.data?.success && Array.isArray(sportsRes.data?.data?.sports)) {
      const matchedSport = sportsRes.data.data.sports.find(
        (s: any) =>
          s.sportName?.toLowerCase() === categorySlug.replace(/-/g, ' ').toLowerCase() ||
          s.sportName?.toLowerCase().replace(/\s+/g, '-') === categorySlug.toLowerCase()
      );
      if (matchedSport?.sportName) cateName = matchedSport.sportName;
    }
  } catch (e) {
    // fallback
  }

  const pageTitle = `${subName} - ${cateName} | StreamESPN`;

  return {
    title: {
      absolute: pageTitle,
    },
    description: `Watch ${subName} - ${cateName} live streams HD online for free on StreamESPN. High-speed lag-free coverage.`,
    openGraph: {
      title: pageTitle,
      description: `Watch ${subName} - ${cateName} live streams HD online for free on StreamESPN.`,
    },
    twitter: {
      title: pageTitle,
      description: `Watch ${subName} - ${cateName} live streams HD online for free on StreamESPN.`,
    },
  };
}

export default async function SubcategoryPage({ params }: NestedPageProps) {
  const { categorySlug, subcategorySlug } = await params;
  return <SubcategoryOrMatchView categorySlug={categorySlug} subcategorySlug={subcategorySlug} />;
}
