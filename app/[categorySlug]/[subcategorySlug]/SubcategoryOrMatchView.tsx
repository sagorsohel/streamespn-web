'use client';

import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { CategoryPageComponent } from '../page';
import { SingleMatchViewComponent } from '@/components/match/SingleMatchViewComponent';

interface SubcategoryOrMatchViewProps {
  categorySlug: string;
  subcategorySlug: string;
}

export function SubcategoryOrMatchView({ categorySlug, subcategorySlug }: SubcategoryOrMatchViewProps) {
  const isLikelyMatchSlug = React.useMemo(() => {
    const raw = subcategorySlug || '';
    return raw.includes('-vs-') || /-\d{4}-\d{2}-\d{2}/.test(raw);
  }, [subcategorySlug]);

  const [isMatch, setIsMatch] = useState<boolean | null>(isLikelyMatchSlug ? true : null);

  useEffect(() => {
    let isMounted = true;
    const checkIsMatch = async () => {
      try {
        const rawSlug = subcategorySlug;
        let decodedSlug = rawSlug;
        try {
          decodedSlug = decodeURIComponent(rawSlug);
        } catch (e) {
          // ignore
        }

        let res = await api.get(`/matches/${rawSlug}`, { timeout: 25000 });
        if (!res.data?.success || !res.data?.data?.match) {
          if (decodedSlug !== rawSlug) {
            res = await api.get(`/matches/${decodedSlug}`, { timeout: 25000 });
          }
        }

        if (isMounted) {
          if (res.data?.success && res.data?.data?.match) {
            setIsMatch(true);
          } else if (!isLikelyMatchSlug) {
            setIsMatch(false);
          }
        }
      } catch (err) {
        if (isMounted && !isLikelyMatchSlug) {
          setIsMatch(false);
        }
      }
    };

    checkIsMatch();
    return () => {
      isMounted = false;
    };
  }, [subcategorySlug, isLikelyMatchSlug]);

  if (isMatch === true) {
    return (
      <SingleMatchViewComponent
        categorySlug={categorySlug}
        subcategorySlug="all"
        matchSlug={subcategorySlug}
      />
    );
  }

  return (
    <CategoryPageComponent
      categorySlug={categorySlug}
      subcategorySlug={subcategorySlug}
    />
  );
}
