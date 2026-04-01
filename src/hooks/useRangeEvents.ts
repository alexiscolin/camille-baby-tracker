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
  const [settled, setSettled] = useState(false);
  const [fromCache, setFromCache] = useState(false);
  const [hasPendingWrites, setHasPendingWrites] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const canSubscribe = !!(familyId && babyId);

  useEffect(() => {
    if (!familyId || !babyId) return;

    const unsubscribe = subscribeToEvents(
      familyId,
      babyId,
      startDate,
      endDate,
      (result) => {
        setEvents(result.events);
        setFromCache(result.fromCache);
        setHasPendingWrites(result.hasPendingWrites);
        setSettled(true);
      },
      (err) => {
        setError(err);
        setSettled(true);
      },
    );

    return () => {
      unsubscribe();
      setSettled(false);
      setError(null);
    };
  }, [familyId, babyId, startDate, endDate]);

  const loading = canSubscribe && !settled;

  return { events, loading, fromCache, hasPendingWrites, error };
}
