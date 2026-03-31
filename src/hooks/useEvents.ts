import { useState, useEffect } from 'react';
import { startOfDay, endOfDay } from 'date-fns';
import type { BabyEvent } from '../types/events';
import { subscribeToEvents } from '../services/events';

export function useEvents(
  familyId: string | undefined,
  babyId: string | undefined,
  date: Date,
) {
  const [events, setEvents] = useState<BabyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [fromCache, setFromCache] = useState(false);
  const [hasPendingWrites, setHasPendingWrites] = useState(false);

  useEffect(() => {
    if (!familyId || !babyId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const start = startOfDay(date);
    const end = endOfDay(date);

    const unsubscribe = subscribeToEvents(
      familyId,
      babyId,
      start,
      end,
      (result) => {
        setEvents(result.events);
        setFromCache(result.fromCache);
        setHasPendingWrites(result.hasPendingWrites);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [familyId, babyId, date]);

  return { events, loading, fromCache, hasPendingWrites };
}
