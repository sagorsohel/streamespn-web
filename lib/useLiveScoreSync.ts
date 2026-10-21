import { useEffect } from 'react';
import api from '@/lib/api';
import { MatchItem } from '@/components/home/MatchCard';

interface LiveScoreData {
  id: number;
  homeScore?: string | null;
  awayScore?: string | null;
  livePeriod?: string | null;
  liveMinute?: string | null;
  status: 'upcoming' | 'live' | 'finished';
}

export const useLiveScoreSync = (
  matches: MatchItem[],
  setMatches: React.Dispatch<React.SetStateAction<MatchItem[]>>
) => {
  const hasLiveMatches = matches.some((m) => m.status === 'live');

  useEffect(() => {
    if (!hasLiveMatches) return;

    const syncLiveScores = async () => {
      try {
        const res = await api.get('/matches/live-scores');
        if (res.data?.success && Array.isArray(res.data?.data)) {
          const liveData: LiveScoreData[] = res.data.data;

          setMatches((prevMatches) => {
            let hasChanged = false;
            const now = Date.now();
            const updated = prevMatches.map((m) => {
              const fresh = liveData.find((l) => l.id === m.id);
              if (fresh) {
                if (
                  m.homeScore !== fresh.homeScore ||
                  m.awayScore !== fresh.awayScore ||
                  m.livePeriod !== fresh.livePeriod ||
                  m.liveMinute !== fresh.liveMinute ||
                  m.status !== fresh.status
                ) {
                  hasChanged = true;
                  return {
                    ...m,
                    homeScore: fresh.homeScore,
                    awayScore: fresh.awayScore,
                    livePeriod: fresh.livePeriod,
                    liveMinute: fresh.liveMinute,
                    status: fresh.status,
                  };
                }
              } else if (m.status === 'live') {
                // If a match was marked live but is no longer returned in active live matches,
                // and it started > 105 minutes ago or is from an earlier day: mark as finished!
                const matchStart = m.matchTime ? new Date(m.matchTime).getTime() : 0;
                const hoursSinceStart = matchStart ? (now - matchStart) / (1000 * 3600) : 0;
                if (!matchStart || hoursSinceStart > 1.75 || hoursSinceStart < -2) {
                  hasChanged = true;
                  return {
                    ...m,
                    status: 'finished' as const,
                    livePeriod: 'FT',
                    liveMinute: 'FT',
                  };
                }
              }
              return m;
            });
            return hasChanged ? updated : prevMatches;
          });
        }
      } catch (err) {
        // silent background polling catch
      }
    };

    // Poll every 15 seconds silently
    const interval = setInterval(syncLiveScores, 15000);

    return () => clearInterval(interval);
  }, [hasLiveMatches, setMatches]);
};
