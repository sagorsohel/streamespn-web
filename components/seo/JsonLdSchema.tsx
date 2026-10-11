import React from 'react';
import { slugify } from '@/lib/utils';

interface WebSiteSchemaProps {
  type: 'website';
  url?: string;
  name?: string;
}

interface HomeSchemaProps {
  type: 'home';
  url?: string;
  name?: string;
}

interface CategorySchemaProps {
  type: 'category';
  categoryName: string;
  categorySlug: string;
  url?: string;
}

interface SubcategorySchemaProps {
  type: 'subcategory';
  categoryName: string;
  categorySlug: string;
  subcategoryName: string;
  subcategorySlug: string;
  url?: string;
  categoryUrl?: string;
}

interface SportsEventSchemaProps {
  type: 'event' | 'match';
  name: string;
  startDate?: string;
  matchDate?: string;
  matchTime?: string;
  homeTeam?: string;
  awayTeam?: string;
  categoryName?: string;
  categorySlug?: string;
  tournamentName?: string;
  tournamentSlug?: string;
  matchSlug?: string;
  venue?: string;
  url?: string;
  matchUrl?: string;
  categoryUrl?: string;
  tournamentUrl?: string;
  isLive?: boolean;
}

type JsonLdProps = WebSiteSchemaProps | HomeSchemaProps | CategorySchemaProps | SubcategorySchemaProps | SportsEventSchemaProps;

export const JsonLdSchema: React.FC<JsonLdProps> = (props) => {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://streamespn.org';

  if (props.type === 'home') {
    const origin = (props.url || siteUrl).replace(/\/$/, '');
    const schema = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Organization',
          '@id': `${origin}/#organization`,
          'name': props.name || 'StreamESPN',
          'url': `${origin}/`,
        },
        {
          '@type': 'WebSite',
          '@id': `${origin}/#website`,
          'name': props.name || 'StreamESPN',
          'url': `${origin}/`,
          'publisher': {
            '@id': `${origin}/#organization`,
          },
          'inLanguage': 'en',
        },
        {
          '@type': 'WebPage',
          '@id': `${origin}/#webpage`,
          'url': `${origin}/`,
          'name': 'Live Sports Scores, Fixtures & Schedules | StreamESPN',
          'isPartOf': {
            '@id': `${origin}/#website`,
          },
        },
      ],
    };

    return (
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
    );
  }

  if (props.type === 'category') {
    const origin = siteUrl.replace(/\/$/, '');
    const cleanSlug = props.categorySlug.replace(/^\//, '');
    const categoryUrl = props.url || `${origin}/${cleanSlug}`;

    const schema = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'CollectionPage',
          '@id': `${categoryUrl}#webpage`,
          'url': categoryUrl,
          'name': `${props.categoryName} Fixtures, Live Scores & Schedules | StreamESPN`,
          'description': `Follow ${props.categoryName} live scores, upcoming fixtures, match schedules, team news, results, and the latest match updates on StreamESPN.`,
          'isPartOf': {
            '@id': `${origin}/#website`,
          },
          'about': {
            '@type': 'Thing',
            'name': props.categoryName,
          },
          'breadcrumb': {
            '@id': `${categoryUrl}#breadcrumb`,
          },
        },
        {
          '@type': 'BreadcrumbList',
          '@id': `${categoryUrl}#breadcrumb`,
          'itemListElement': [
            {
              '@type': 'ListItem',
              'position': 1,
              'name': 'Home',
              'item': `${origin}/`,
            },
            {
              '@type': 'ListItem',
              'position': 2,
              'name': props.categoryName,
              'item': categoryUrl,
            },
          ],
        },
      ],
    };

    return (
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
    );
  }

  if (props.type === 'subcategory') {
    const origin = siteUrl.replace(/\/$/, '');
    const cleanCatSlug = props.categorySlug.replace(/^\//, '');
    const cleanSubSlug = props.subcategorySlug.replace(/^\//, '');
    const categoryUrl = props.categoryUrl || `${origin}/${cleanCatSlug}`;
    const subcategoryUrl = props.url || `${origin}/${cleanCatSlug}/${cleanSubSlug}`;

    const schema = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'CollectionPage',
          '@id': `${subcategoryUrl}#webpage`,
          'url': subcategoryUrl,
          'name': `${props.subcategoryName} Fixtures, Live Scores & Schedule | StreamESPN`,
          'description': `Explore ${props.subcategoryName} live scores, upcoming fixtures, match schedules, team news, results, standings, and the latest ${props.categoryName} updates on StreamESPN.`,
          'isPartOf': {
            '@id': `${origin}/#website`,
          },
          'about': {
            '@type': 'Thing',
            'name': props.subcategoryName,
          },
          'breadcrumb': {
            '@id': `${subcategoryUrl}#breadcrumb`,
          },
        },
        {
          '@type': 'BreadcrumbList',
          '@id': `${subcategoryUrl}#breadcrumb`,
          'itemListElement': [
            {
              '@type': 'ListItem',
              'position': 1,
              'name': 'Home',
              'item': `${origin}/`,
            },
            {
              '@type': 'ListItem',
              'position': 2,
              'name': props.categoryName,
              'item': categoryUrl,
            },
            {
              '@type': 'ListItem',
              'position': 3,
              'name': props.subcategoryName,
              'item': subcategoryUrl,
            },
          ],
        },
      ],
    };

    return (
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
    );
  }

  if (props.type === 'website') {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      'name': props.name || 'StreamESPN',
      'url': props.url || siteUrl,
      'potentialAction': {
        '@type': 'SearchAction',
        'target': `${siteUrl}/search?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    };

    return (
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
    );
  }

  if (props.type === 'event' || props.type === 'match') {
    const origin = siteUrl.replace(/\/$/, '');

    const catSlug = (props.categorySlug || slugify(props.categoryName || 'sport')).replace(/^\//, '');
    const tourSlug = (props.tournamentSlug || slugify(props.tournamentName || 'league')).replace(/^\//, '');
    const mSlug = (props.matchSlug || slugify(props.name || 'match')).replace(/^\//, '');

    const categoryUrl = props.categoryUrl || `${origin}/${catSlug}`;
    const tournamentUrl = props.tournamentUrl || `${origin}/${catSlug}/${tourSlug}`;
    const matchUrl = props.matchUrl || props.url || `${origin}/${catSlug}/${tourSlug}/${mSlug}`;

    let isoStartDate = props.startDate || '';
    let formattedDate = props.matchDate || '';
    let formattedTime = props.matchTime || '';

    if (props.startDate) {
      try {
        const d = new Date(props.startDate);
        if (!isNaN(d.getTime())) {
          isoStartDate = d.toISOString();
          if (!formattedDate) {
            formattedDate = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
          }
          if (!formattedTime) {
            formattedTime = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'UTC' }) + ' UTC';
          }
        }
      } catch (e) {
        // ignore
      }
    }
    if (!formattedDate) formattedDate = 'TBA';
    if (!formattedTime) formattedTime = 'TBA';

    const matchName = props.name;
    const tournamentName = props.tournamentName || 'League';
    const categoryName = props.categoryName || 'Sports';
    const venueName = props.venue?.trim() ? props.venue.trim() : 'the stadium';
    const homeTeamName = props.homeTeam || 'Home Team';
    const awayTeamName = props.awayTeam || 'Away Team';

    const description = `Follow ${matchName} in the ${tournamentName} on ${formattedDate} at ${formattedTime}. Get ${categoryName} match details, scores, schedules, and updates from ${venueName} on StreamESPN.`;

    const sportsEventNode: any = {
      '@type': 'SportsEvent',
      '@id': `${matchUrl}#event`,
      'name': matchName,
      'description': description,
      'url': matchUrl,
      'sport': categoryName,
      'startDate': isoStartDate || new Date().toISOString(),
      'location': {
        '@type': 'Place',
        'name': venueName,
      },
      'homeTeam': {
        '@type': 'SportsTeam',
        'name': homeTeamName,
      },
      'awayTeam': {
        '@type': 'SportsTeam',
        'name': awayTeamName,
      },
    };

    if (props.isLive !== undefined) {
      sportsEventNode.eventStatus = props.isLive ? 'https://schema.org/EventLive' : 'https://schema.org/EventScheduled';
    }

    const schema = {
      '@context': 'https://schema.org',
      '@graph': [
        sportsEventNode,
        {
          '@type': 'WebPage',
          '@id': `${matchUrl}#webpage`,
          'url': matchUrl,
          'name': `${matchName} Live Score & Match Updates | StreamESPN`,
          'isPartOf': {
            '@id': `${origin}/#website`,
          },
          'mainEntity': {
            '@id': `${matchUrl}#event`,
          },
          'breadcrumb': {
            '@id': `${matchUrl}#breadcrumb`,
          },
        },
        {
          '@type': 'BreadcrumbList',
          '@id': `${matchUrl}#breadcrumb`,
          'itemListElement': [
            {
              '@type': 'ListItem',
              'position': 1,
              'name': 'Home',
              'item': `${origin}/`,
            },
            {
              '@type': 'ListItem',
              'position': 2,
              'name': categoryName,
              'item': categoryUrl,
            },
            {
              '@type': 'ListItem',
              'position': 3,
              'name': tournamentName,
              'item': tournamentUrl,
            },
            {
              '@type': 'ListItem',
              'position': 4,
              'name': matchName,
              'item': matchUrl,
            },
          ],
        },
      ],
    };

    return (
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
    );
  }

  return null;
};
