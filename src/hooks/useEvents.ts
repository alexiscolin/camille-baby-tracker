import { useMemo } from 'react';
import { startOfDay, endOfDay } from 'date-fns';
import { useRangeEvents } from './useRangeEvents';

export function useEvents(
  familyId: string | undefined,
  babyId: string | undefined,
  date: Date,
) {
  const start = useMemo(() => startOfDay(date), [date]);
  const end = useMemo(() => endOfDay(date), [date]);
  const { events, loading, fromCache, error } = useRangeEvents(familyId, babyId, start, end);

  return { events, loading, fromCache, hasPendingWrites: false, error };
}
