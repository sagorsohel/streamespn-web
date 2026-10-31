/**
 * High-performance Precise Typo-Tolerance and Fuzzy Search Utility for Web
 * Accurately detects intended matches even with vowel/phonetic typos (e.g. "cerlus" -> "Carlos Alcaraz")
 */

import { MatchItem } from '@/components/home/MatchCard';

/**
 * Phonetic Soundex implementation
 */
export function soundex(s: string): string {
  if (!s) return '';
  const clean = s.toLowerCase().replace(/[^a-z]/g, '');
  if (!clean) return '';
  const firstLetter = clean[0];
  const codes: Record<string, number> = {
    b: 1, f: 1, p: 1, v: 1,
    c: 2, g: 2, j: 2, k: 2, q: 2, s: 2, x: 2, z: 2,
    d: 3, t: 3,
    l: 4,
    m: 5, n: 5,
    r: 6,
  };
  const result: (string | number)[] = [firstLetter.toUpperCase()];
  let prevCode = codes[firstLetter] || 0;
  for (let i = 1; i < clean.length; i++) {
    const curCode = codes[clean[i]];
    if (curCode !== undefined) {
      if (curCode !== prevCode) {
        result.push(curCode);
      }
      prevCode = curCode;
    } else {
      prevCode = 0;
    }
    if (result.length === 4) break;
  }
  while (result.length < 4) result.push(0);
  return result.join('');
}

/**
 * Standard Levenshtein Distance
 */
export function levenshteinDistance(s1: string, s2: string): number {
  const a = s1.toLowerCase();
  const b = s2.toLowerCase();
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const d: number[][] = [];
  for (let i = 0; i <= a.length; i++) d[i] = [i];
  for (let j = 0; j <= b.length; j++) d[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(
        d[i - 1][j] + 1,       // deletion
        d[i][j - 1] + 1,       // insertion
        d[i - 1][j - 1] + cost // substitution
      );
    }
  }
  return d[a.length][b.length];
}

/**
 * Extracts consonant skeleton (e.g. "cerlus" -> "crls", "carlos" -> "crls")
 */
export function getConsonantSkeleton(s: string): string {
  if (!s) return '';
  const clean = s.toLowerCase().replace(/[^a-z]/g, '');
  if (!clean) return '';
  const first = clean[0];
  const rest = clean.slice(1).replace(/[aeiouy]/g, '');
  return first + rest;
}

/**
 * Calculates similarity score (0 to 100) between two individual words
 */
export function wordSimilarity(qWord: string, targetWord: string): number {
  const qW = qWord.toLowerCase();
  const tW = targetWord.toLowerCase();

  if (qW === tW) return 100;
  const maxLen = Math.max(qW.length, tW.length);
  if (maxLen === 0) return 100;

  // Exact substring match inside target word (e.g. "alcar" inside "alcaraz")
  if (tW.includes(qW)) {
    return 90 + (qW.length / tW.length) * 10;
  }

  // Reject if length difference is too large for a typo
  if (Math.abs(qW.length - tW.length) > 2) return 0;

  const dist = levenshteinDistance(qW, tW);
  const sndxQ = soundex(qW);
  const sndxT = soundex(tW);
  const skelQ = getConsonantSkeleton(qW);
  const skelT = getConsonantSkeleton(tW);

  // Phonetic or consonant skeleton match (e.g. "cerlus" ~ "carlos" both have C642 & crls)
  const isPhoneticOrVowelMatch = (sndxQ === sndxT) || (skelQ === skelT && skelQ.length >= 3);

  // If phonetic/vowels match, allow distance up to 2 (or 3 for long words)
  const maxAllowedDist = isPhoneticOrVowelMatch
    ? (qW.length <= 5 ? 2 : 3)
    : (qW.length <= 5 ? 1 : 2);

  if (dist > maxAllowedDist) return 0;

  const ratio = 1 - dist / maxLen;
  if (!isPhoneticOrVowelMatch && ratio < 0.65) return 0;

  let score = ratio * 80;
  if (qW[0] === tW[0]) score += 10;
  if (sndxQ === sndxT) score += 12;
  if (skelQ === skelT && skelQ.length >= 3) score += 10;

  return Math.min(score, 98);
}

export interface MatchScoreResult {
  match: MatchItem;
  score: number;
  matchedName?: string | null;
  isFuzzy: boolean;
}

/**
 * Computes match score against query string (higher score = better match)
 */
export function computeMatchScore(match: MatchItem, query: string): MatchScoreResult {
  const qClean = query.toLowerCase().trim();
  if (!qClean) return { match, score: 0, isFuzzy: false };

  const qNorm = qClean.replace(/[\s\-_]+/g, '');
  const qWords = qClean.split(/[\s\-_]+/).filter(Boolean);

  const home = (match.homeTeam || '').toLowerCase();
  const away = (match.awayTeam || '').toLowerCase();
  const title = (match.title || '').toLowerCase();
  const sub = (match.subcategoryName || '').toLowerCase();
  const cat = (match.categoryName || '').toLowerCase();

  const fullText = `${home} ${away} ${title} ${sub} ${cat}`.trim();
  const fullNorm = fullText.replace(/[\s\-_]+/g, '');

  // 1. Exact phrase substring match (highest score)
  if (fullText.includes(qClean)) {
    const matchedName = [match.homeTeam, match.awayTeam, match.title, match.subcategoryName].find(
      (n) => n && n.toLowerCase().includes(qClean)
    );
    return {
      match,
      score: 1000 + (qClean.length / fullText.length) * 100,
      matchedName: matchedName || undefined,
      isFuzzy: false,
    };
  }

  // 1b. Normalized match (ignores spaces/hyphens, e.g. "deminaur" -> "Alex de Minaur")
  if (fullNorm.includes(qNorm)) {
    return {
      match,
      score: 950,
      matchedName: (match.homeTeam || match.awayTeam || match.title) || undefined,
      isFuzzy: false,
    };
  }

  // 2. All query words exist in text as substrings
  if (qWords.length > 1 && qWords.every((w) => fullText.includes(w))) {
    return {
      match,
      score: 800,
      matchedName: (match.title || `${match.homeTeam} vs ${match.awayTeam}`) || undefined,
      isFuzzy: false,
    };
  }

  // 3. Typo-tolerant word-by-word fuzzy comparison
  const textWords = fullText.split(/[\s\-_,.:;()\/]+/).filter((w) => w.length >= 2);
  let totalScore = 0;
  let allMatched = true;
  let bestCandidateName = '';

  for (const qW of qWords) {
    let bestWordScore = 0;
    let bestMatchedWord = '';

    for (const tW of textWords) {
      const sc = wordSimilarity(qW, tW);
      if (sc > bestWordScore) {
        bestWordScore = sc;
        bestMatchedWord = tW;
        if (bestWordScore >= 95) break;
      }
    }

    if (bestWordScore >= 65) {
      totalScore += bestWordScore;
      if (!bestCandidateName && bestMatchedWord) {
        bestCandidateName = bestMatchedWord;
      }
    } else {
      allMatched = false;
    }
  }

  if (!allMatched) {
    return { match, score: 0, isFuzzy: false };
  }

  const averageScore = totalScore / qWords.length;
  return {
    match,
    score: averageScore,
    matchedName: bestCandidateName,
    isFuzzy: averageScore < 800,
  };
}

/**
 * Filter and rank matches based on query with strict typo-tolerance and confidence gap filtering
 */
export function fuzzyFilterAndRankMatches(matches: MatchItem[], query: string): MatchItem[] {
  const qClean = query.trim();
  if (!qClean) return matches;

  const scored: MatchScoreResult[] = [];
  for (const m of matches) {
    const res = computeMatchScore(m, qClean);
    if (res.score >= 65) {
      scored.push(res);
    }
  }

  if (scored.length === 0) return [];

  // Sort by score descending first
  scored.sort((a, b) => b.score - a.score);

  // Confidence gap filtering:
  // If top match has a high score (>= 80), only keep close high-confidence matches (topScore - 15)
  // This eliminates unrelated random matches
  const topScore = scored[0].score;
  const cutoff = topScore >= 80 ? Math.max(65, topScore - 15) : 65;
  const filtered = scored.filter((s) => s.score >= cutoff);

  const now = Date.now();
  const statusPriority: Record<string, number> = { live: 1, upcoming: 2, finished: 3 };

  // Sort descending by score, status, and closest match time
  filtered.sort((a, b) => {
    if (Math.abs(b.score - a.score) > 5) {
      return b.score - a.score;
    }
    const pA = statusPriority[a.match.status] || 4;
    const pB = statusPriority[b.match.status] || 4;
    if (pA !== pB) return pA - pB;

    const custA = (a.match as any).isCustomized ? 1 : 0;
    const custB = (b.match as any).isCustomized ? 1 : 0;
    if (custA !== custB) return custB - custA;

    const timeA = a.match.matchTime ? new Date(a.match.matchTime).getTime() : 0;
    const timeB = b.match.matchTime ? new Date(b.match.matchTime).getTime() : 0;
    return Math.abs(timeA - now) - Math.abs(timeB - now);
  });

  return filtered.map((s) => s.match);
}
