import React from 'react';

interface WebSiteSchemaProps {
  type: 'website';
  url?: string;
  name?: string;
}

interface SportsEventSchemaProps {
  type: 'event';
  name: string;
  startDate?: string;
  homeTeam?: string;
  awayTeam?: string;
  categoryName?: string;
  isLive?: boolean;
}

type JsonLdProps = WebSiteSchemaProps | SportsEventSchemaProps;

export const JsonLdSchema: React.FC<JsonLdProps> = (props) => {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://streamespn.org';

  if (props.type === 'website') {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      'name': props.name || 'StreamESPN',
      'url': props.url || siteUrl,
      'potentialAction': {
        '@type': 'SearchAction',
        'target': `${siteUrl}/?search={search_term_string}`,
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

  if (props.type === 'event') {
    const schema: any = {
      '@context': 'https://schema.org',
      '@type': 'SportsEvent',
      'name': props.name,
      'eventStatus': props.isLive ? 'https://schema.org/EventLive' : 'https://schema.org/EventScheduled',
    };

    if (props.startDate) {
      schema.startDate = props.startDate;
    }

    if (props.homeTeam) {
      schema.homeTeam = {
        '@type': 'SportsTeam',
        'name': props.homeTeam,
      };
    }

    if (props.awayTeam) {
      schema.awayTeam = {
        '@type': 'SportsTeam',
        'name': props.awayTeam,
      };
    }

    if (props.categoryName) {
      schema.sport = props.categoryName;
    }

    return (
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
    );
  }

  return null;
};
