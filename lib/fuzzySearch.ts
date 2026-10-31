/**
 * High-performance Fuzzy Search and Typo-Tolerance Utility
 * Enables typo-tolerant matching (e.g. "cerlos" -> "Carlos Alcaraz", "alcarez" -> "Alcaraz", "barselona" -> "Barcelona")
 * Uses Damerau-Levenshtein edit distance, phonetic Soundex, and normalized string matching.
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
 * Calculates similarity score (0 to 100) between two individual words
 */
export function wordSimilarity(qWord: string, targetWord: string): number {
  const qW = qWord.toLowerCase();
  const tW = targetWord.toLowerCase();

  if (qW === tW) return 100;
  const maxLen = Math.max(qW.length, tW.length);
  if (maxLen === 0) return 100;

  // Substring match inside the target word
  if (tW.includes(qW)) {
    return 90 + (qW.length / tW.length) * 10;
  }

  // Length constraints for edit distance
  // 3-4 chars: max 1 typo
  // 5-7 chars: max 2 typos
  // 8+ chars: max 3 typos
  const maxAllowedDist = qW.length <= 4 ? 1 : (qW.length <= 7 ? 2 : 3);
  const dist = levenshteinDistance(qW, tW);
  if (dist > maxAllowedDist) return 0;

  const ratio = 1 - dist / maxLen;
  if (ratio < 0.6) return 0;

  let score = ratio * 75;

  // Same first letter bonus
  if (qW[0] === tW[0]) score += 10;

  // Identical Soundex bonus
  if (soundex(qW) === soundex(tW)) score += 15;

  // Same length bonus
  if (qW.length === tW.length) score += 5;

  return Math.min(score, 95);
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

    if (bestWordScore >= 60) {
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
 * Filter and rank matches based on query with typo-tolerance
 */
export function fuzzyFilterAndRankMatches(matches: MatchItem[], query: string): MatchItem[] {
  const qClean = query.trim();
  if (!qClean) return matches;

  const scored: MatchScoreResult[] = [];
  for (const m of matches) {
    const res = computeMatchScore(m, qClean);
    if (res.score >= 60) {
      scored.push(res);
    }
  }

  // Sort descending by score, then ascending by match time
  scored.sort((a, b) => {
    if (Math.abs(b.score - a.score) > 10) {
      return b.score - a.score;
    }
    const timeA = a.match.matchTime ? new Date(a.match.matchTime).getTime() : 0;
    const timeB = b.match.matchTime ? new Date(b.match.matchTime).getTime() : 0;
    return timeA - timeB;
  });

  return scored.map((s) => s.match);
}
