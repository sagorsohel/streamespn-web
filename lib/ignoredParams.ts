// Helper to parse and filter ignored query parameters from environment variables

export function getIgnoredQueryParams(): string[] {
  const envVal =
    process.env.IGNORED_QUERY_PARAMS ||
    process.env.NEXT_PUBLIC_IGNORED_QUERY_PARAMS ||
    'alpha,ref,utm_source,utm_medium,utm_campaign,utm_term,utm_content,fbclid,gclid,pro,ali,artv,king';

  return envVal
    .split(',')
    .map((k) => k.trim().toLowerCase())
    .filter(Boolean);
}

export function filterIgnoredParams(searchParams: URLSearchParams): {
  hasIgnored: boolean;
  cleanParams: URLSearchParams;
} {
  const ignored = getIgnoredQueryParams();
  if (ignored.length === 0) {
    return { hasIgnored: false, cleanParams: searchParams };
  }

  const cleanParams = new URLSearchParams(searchParams.toString());
  let hasIgnored = false;

  // Wildcard '*' support: ignore all query params except internal Next.js ones (_rsc)
  if (ignored.includes('*')) {
    for (const key of Array.from(cleanParams.keys())) {
      if (key !== '_rsc') {
        cleanParams.delete(key);
        hasIgnored = true;
      }
    }
    return { hasIgnored, cleanParams };
  }

  for (const key of Array.from(cleanParams.keys())) {
    if (ignored.includes(key.toLowerCase())) {
      cleanParams.delete(key);
      hasIgnored = true;
    }
  }

  return { hasIgnored, cleanParams };
}
