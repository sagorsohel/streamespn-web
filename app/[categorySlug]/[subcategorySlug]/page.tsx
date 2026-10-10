import React from 'react';
import type { Metadata } from 'next';
import api from '@/lib/api';
import { getCategories } from '@/lib/categories';
import { slugify } from '@/lib/utils';
import { SubcategoryOrMatchView } from './SubcategoryOrMatchView';

interface NestedPageProps {
  params: Promise<{ categorySlug: string; subcategorySlug: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ params, searchParams }: NestedPageProps): Promise<Metadata> {
  const { categorySlug, subcategorySlug } = await params;
  const sp = searchParams ? await searchParams : {};
  const isFromNotFound =
    sp?.notfound === 'true' ||
    sp?.notfound === '1' ||
    sp?.error === '404' ||
    sp?.status === '404' ||
    Boolean(sp?.m) ||
    Boolean(sp?.matchslug);

  const isLikelyMatch = subcategorySlug?.includes('-vs-') || /-\d{4}-\d{2}-\d{2}/.test(subcategorySlug || '');

  if (isLikelyMatch) {
    try {
      const matchRes = await api.get(`/matches/${subcategorySlug}`, { timeout: 25000 });
      if (matchRes.data?.success && matchRes.data?.data?.match) {
        const match = matchRes.data.data.match;
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
    const sportsList = await getCategories();
    if (Array.isArray(sportsList)) {
      const matchedSport = sportsList.find(
        (s: any) =>
          s.sportName?.toLowerCase() === categorySlug.replace(/-/g, ' ').toLowerCase() ||
          slugify(s.sportName) === categorySlug.toLowerCase()
      );
      if (matchedSport?.sportName) cateName = matchedSport.sportName;
    }
  } catch (e) {
    // fallback
  }

  const pageTitle = isFromNotFound
    ? `(404) - ${subName} Fixtures, Live Scores & Schedule | StreamESPN`
    : `${subName} Fixtures, Live Scores & Schedule | StreamESPN`;
  const pageDescription = `Explore ${subName} live scores, upcoming fixtures, match schedules, team news, results, standings, and the latest ${cateName} updates on StreamESPN`;

  return {
    title: {
      absolute: pageTitle,
    },
    description: pageDescription,
    openGraph: {
      title: pageTitle,
      description: pageDescription,
    },
    twitter: {
      title: pageTitle,
      description: pageDescription,
    },
  };
}

export default async function SubcategoryPage({ params }: NestedPageProps) {
  const { categorySlug, subcategorySlug } = await params;
  return <SubcategoryOrMatchView categorySlug={categorySlug} subcategorySlug={subcategorySlug} />;
}
