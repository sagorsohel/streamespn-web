import React from 'react';
import type { Metadata } from 'next';
import { prefetchCategoryData } from '@/lib/serverPrefetch';
import { CategoryPageComponent } from './CategoryPageComponent';
import { JsonLdSchema } from '@/components/seo/JsonLdSchema';

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
    sp?.status === '404' ||
    Boolean(sp?.m) ||
    Boolean(sp?.matchslug);

  const data = await prefetchCategoryData(categorySlug);
  const categoryName = data.cateName || categorySlug;
  const pageTitle = isFromNotFound
    ? `(404) - ${categoryName} Fixtures, Live Scores & Schedules | StreamESPN`
    : `${categoryName} Fixtures, Live Scores & Schedules | StreamESPN`;
  const pageDescription = `Follow ${categoryName} live scores, upcoming fixtures, match schedules, team news, results, and the latest match updates on StreamESPN.`;

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

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { categorySlug } = await params;
  const sp = searchParams ? await searchParams : {};
  const isFromNotFound =
    sp?.notfound === 'true' ||
    sp?.notfound === '1' ||
    sp?.error === '404' ||
    sp?.status === '404' ||
    Boolean(sp?.m) ||
    Boolean(sp?.matchslug);

  const data = !isFromNotFound ? await prefetchCategoryData(categorySlug) : null;
  const categoryName = data?.cateName || categorySlug;

  return (
    <>
      {!isFromNotFound && (
        <JsonLdSchema
          type="category"
          categoryName={categoryName}
          categorySlug={categorySlug}
        />
      )}
      <CategoryPageComponent
        categorySlug={categorySlug}
        initialCategory={data?.category || null}
        initialSubcategories={data?.subcategories || []}
        initialMatches={data?.matches || []}
        initialSelectedSubcategory={null}
      />
    </>
  );
}

