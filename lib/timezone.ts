/**
 * Timezone & Local Date Formatting Helpers
 * Uses browser device system timezone (Intl API & OS Clock)
 * Works 100% accurately regardless of VPN / proxy server locations.
 */

export const getUserTimezone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch (e) {
    return 'UTC';
  }
};

export const getTimezoneAbbr = (date: Date = new Date()): string => {
  try {
    const timeString = date.toLocaleTimeString('en-US', { timeZoneName: 'short' });
    const parts = timeString.split(' ');
    return parts[parts.length - 1] || '';
  } catch (e) {
    return '';
  }
};

export const parseUtcDate = (utcTimeStr: string | null | undefined): Date | null => {
  if (!utcTimeStr) return null;
  const str = String(utcTimeStr).trim();
  if (!str) return null;

  // If ISO string lacks timezone indicator (e.g. 2026-08-28T00:00:00), append 'Z' for UTC parsing
  let isoStr = str;
  if (!isoStr.endsWith('Z') && !isoStr.includes('+')) {
    if (isoStr.includes('T')) {
      isoStr = isoStr + 'Z';
    } else if (isoStr.includes(' ')) {
      isoStr = isoStr.replace(' ', 'T') + 'Z';
    }
  }

  const d = new Date(isoStr);
  if (!isNaN(d.getTime())) return d;

  const fallback = new Date(str);
  return isNaN(fallback.getTime()) ? null : fallback;
};

export const formatMatchTime = (utcTimeStr: string | null | undefined): string => {
  const date = parseUtcDate(utcTimeStr);
  if (!date) return 'TBA';
  try {
    return date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  } catch (e) {
    return 'TBA';
  }
};

export const formatMatchDate = (utcTimeStr: string | null | undefined): string => {
  const date = parseUtcDate(utcTimeStr);
  if (!date) return '';
  try {
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  } catch (e) {
    return '';
  }
};

export const formatMatchFullDateTime = (utcTimeStr: string | null | undefined): {
  time: string;
  date: string;
  tzAbbr: string;
} => {
  const date = parseUtcDate(utcTimeStr);
  if (!date) return { time: 'TBA', date: '', tzAbbr: '' };
  try {
    const time = date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    const dateStr = date.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });

    const tzAbbr = getTimezoneAbbr(date);

    return { time, date: dateStr, tzAbbr };
  } catch (e) {
    return { time: 'TBA', date: '', tzAbbr: '' };
  }
};

export const formatLiveTimeOnly = (match: {
  livePeriod?: string | null;
  liveMinute?: string | null;
  status: string;
}): string => {
  if (match.status === 'finished') {
    return 'FT';
  }
  if (match.status !== 'live') {
    return '';
  }

  const rawPeriod = (match.livePeriod || '').trim();
  const rawMinute = (match.liveMinute || '').trim();
  const lowerPeriod = rawPeriod.toLowerCase();
  const lowerMinute = rawMinute.toLowerCase();

  // 1. Finished / Full Time check
  if (
    lowerPeriod === 'ft' ||
    lowerPeriod === 'finished' ||
    lowerPeriod === 'final' ||
    lowerMinute === 'ft' ||
    lowerMinute === 'finished' ||
    lowerMinute === 'final'
  ) {
    return 'FT';
  }

  // 2. Half Time (HT) check
  if (
    lowerPeriod === 'ht' ||
    lowerPeriod.includes('half time') ||
    lowerPeriod.includes('halftime') ||
    lowerMinute === 'ht' ||
    lowerMinute.includes('half time') ||
    lowerMinute.includes('halftime')
  ) {
    return 'HT';
  }

  // Clean minute formatting (e.g. "74" -> "74'", "90+6" -> "90+6'")
  const cleanMinute = rawMinute
    ? rawMinute.includes("'")
      ? rawMinute
      : `${rawMinute}'`
    : '';

  // 3. Football / Soccer 1H & 2H: Do NOT show 1H or 2H, show minute only
  if (/^(1h|2h|1st\s*half|2nd\s*half)$/i.test(rawPeriod)) {
    return cleanMinute || 'LIVE';
  }

  // 4. If minute exists and period is empty or duplicate
  if (cleanMinute && (!rawPeriod || rawPeriod.toLowerCase() === rawMinute.toLowerCase())) {
    return cleanMinute;
  }

  // 5. Other sports or overtime periods (e.g. "OT 105'", "Q3 12'")
  if (rawPeriod && cleanMinute) {
    return `${rawPeriod} ${cleanMinute}`;
  }

  if (cleanMinute) {
    return cleanMinute;
  }

  if (rawPeriod) {
    return rawPeriod;
  }

  return 'LIVE';
};

export const formatLiveBadgeText = (match: {
  homeScore?: string | null;
  awayScore?: string | null;
  livePeriod?: string | null;
  liveMinute?: string | null;
  status: string;
}): string => {
  if (match.status !== 'live') return '';
  const scoreStr = `${match.homeScore ?? 0}-${match.awayScore ?? 0}`;
  const details = formatLiveTimeOnly(match);
  return details ? `Live ${scoreStr} • ${details}` : `Live ${scoreStr}`;
};
