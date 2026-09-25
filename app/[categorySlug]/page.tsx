import React from 'react';
import type { Metadata } from 'next';
import { getCategories } from '@/lib/categories';
import { slugify } from '@/lib/utils';
import { CategoryPageComponent } from './CategoryPageComponent';

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
    const sportsList = await getCategories();
    if (Array.isArray(sportsList)) {
      const match = sportsList.find(
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

interface PageProps {
  params: Promise<{ categorySlug: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { categorySlug } = await params;
  const sp = searchParams ? await searchParams : {};
  const isFromNotFound =
    sp?.notfound === 'true' ||
    sp?.notfound === '1' ||
    sp?.error === '404' ||
    sp?.status === '404';

  const categoryName = await getCategoryName(categorySlug);
  const pageTitle = isFromNotFound
    ? `(404)- (${categoryName}) Live | StreamESPN`
    : `(${categoryName}) Live | StreamESPN`;

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

export default async function CategoryPage({ params }: PageProps) {
  const { categorySlug } = await params;
  return <CategoryPageComponent categorySlug={categorySlug} />;
}
