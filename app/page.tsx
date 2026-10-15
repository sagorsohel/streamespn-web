import React from 'react';
import { prefetchHomeData } from '@/lib/serverPrefetch';
import { HomePageClient } from '@/components/home/HomePageClient';

export default async function HomePage() {
  const data = await prefetchHomeData();

  return (
    <HomePageClient
      initialCategories={data.categories}
      initialTrendingSubcategories={data.trendingSubcategories}
      initialBannerMatches={data.bannerMatches}
      initialMatches={data.matches}
    />
  );
}
