import { useState, useEffect } from 'react';
import type { Baby } from '../types/events';
import { subscribeToBaby } from '../services/family';

export function useBaby(familyId: string | undefined, babyId: string | undefined) {
  const [baby, setBaby] = useState<Baby | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!familyId || !babyId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    // A subscription, not a read: Settings writes preferences onto this
    // document and needs them back on screen, and the other parent's phone
    // should see them without a reload.
    return subscribeToBaby(
      familyId,
      babyId,
      (next) => {
        setBaby(next);
        setLoading(false);
      },
      () => setLoading(false),
    );
  }, [familyId, babyId]);

  return { baby, loading };
}
