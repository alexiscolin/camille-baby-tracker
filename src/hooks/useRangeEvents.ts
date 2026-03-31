import { useState, useEffect } from 'react';
import type { BabyEvent } from '../types/events';
import { subscribeToEvents } from '../services/events';

export function useRangeEvents(
  familyId: string | undefined,
  babyId: string | undefined,
  startDate: Date,
  endDate: Date,
) {
  const [events, setEvents] = useState<BabyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [fromCache, setFromCache] = useState(false);

  useEffect(() => {
    if (!familyId || !babyId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToEvents(
      familyId,
      babyId,
      startDate,
      endDate,
      (result) => {
        setEvents(result.events);
        setFromCache(result.fromCache);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [familyId, babyId, startDate, endDate]);

  return { events, loading, fromCache };
}
