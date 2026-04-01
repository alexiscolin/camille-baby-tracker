import { useState, useEffect } from 'react';
import type { Baby } from '../types/events';
import { getBaby } from '../services/family';

export function useBaby(familyId: string | undefined, babyId: string | undefined) {
  const [baby, setBaby] = useState<Baby | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!familyId || !babyId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    getBaby(familyId, babyId)
      .then((b) => {
        if (!cancelled) {
          setBaby(b);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load baby:', err);
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [familyId, babyId]);

  return { baby, loading };
}
