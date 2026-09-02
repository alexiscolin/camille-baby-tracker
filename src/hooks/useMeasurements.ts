import { useState, useEffect } from 'react';
import type { Measurement } from '../types/measurements';
import { subscribeToMeasurements } from '../services/measurements';

export function useMeasurements(familyId: string | undefined, babyId: string | undefined) {
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [fromCache, setFromCache] = useState(false);
  const [hasPendingWrites, setHasPendingWrites] = useState(false);
  /**
   * A refused or failed subscription used to be discarded here, so a family
   * member who could not read the collection saw the same empty chart and
   * empty list as a family that had simply not measured anything yet. The
   * message Firestore gives ("Missing or insufficient permissions.", "The
   * query requires an index.") is the only thing that tells the two apart.
   */
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!familyId || !babyId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = subscribeToMeasurements(
      familyId,
      babyId,
      (result) => {
        setMeasurements(result.measurements);
        setFromCache(result.fromCache);
        setHasPendingWrites(result.hasPendingWrites);
        setError(null);
        setLoading(false);
      },
      (subscriptionError) => {
        setError(subscriptionError.message);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [familyId, babyId]);

  return { measurements, loading, fromCache, hasPendingWrites, error };
}
