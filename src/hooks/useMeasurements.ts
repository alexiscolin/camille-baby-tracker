import { useState, useEffect } from 'react';
import type { Measurement } from '../types/measurements';
import { subscribeToMeasurements } from '../services/measurements';

export function useMeasurements(familyId: string | undefined, babyId: string | undefined) {
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [fromCache, setFromCache] = useState(false);
  const [hasPendingWrites, setHasPendingWrites] = useState(false);

  useEffect(() => {
    if (!familyId || !babyId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubscribe = subscribeToMeasurements(
      familyId,
      babyId,
      (result) => {
        setMeasurements(result.measurements);
        setFromCache(result.fromCache);
        setHasPendingWrites(result.hasPendingWrites);
        setLoading(false);
      },
      () => {
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [familyId, babyId]);

  return { measurements, loading, fromCache, hasPendingWrites };
}
