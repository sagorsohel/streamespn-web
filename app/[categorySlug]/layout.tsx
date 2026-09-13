import React from 'react';
import type { Metadata } from 'next';
import api from '@/lib/api';
import { slugify } from '@/lib/utils';

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

async function getCategoryName(categorySlug: string): Promise<string> {
  try {
    const res = await api.get('/sports', { timeout: 10000 });
    if (res.data?.success && Array.isArray(res.data?.data?.sports)) {
      const match = res.data.data.sports.find(
        (s: any) =>
          slugify(s.sportName) === categorySlug.toLowerCase() ||
          s.sportName.toLowerCase() === categorySlug.replace(/-/g, ' ').toLowerCase()
      );
      if (match?.sportName) return match.sportName;
    }
  } catch (e) {
    // fallback
  }
  return formatSlugToTitle(categorySlug);
}

interface CategoryLayoutProps {
  children: React.ReactNode;
  params: Promise<{ categorySlug: string }>;
}

export async function generateMetadata({ params }: { params: Promise<{ categorySlug: string }> }): Promise<Metadata> {
  const { categorySlug } = await params;
  const categoryName = await getCategoryName(categorySlug);
  const pageTitle = `(${categoryName}) Live | StreamESPN`;

  return {
    title: {
      absolute: pageTitle,
    },
    description: `Watch ${categoryName} live streams HD online for free on StreamESPN. High-speed lag-free streams, scores, and schedules.`,
    openGraph: {
      title: pageTitle,
      description: `Watch ${categoryName} live streams HD online for free on StreamESPN. High-speed lag-free streams, scores, and schedules.`,
    },
    twitter: {
      title: pageTitle,
      description: `Watch ${categoryName} live streams HD online for free on StreamESPN. High-speed lag-free streams, scores, and schedules.`,
    },
  };
}

export default function CategoryLayout({ children }: CategoryLayoutProps) {
  return <>{children}</>;
}
