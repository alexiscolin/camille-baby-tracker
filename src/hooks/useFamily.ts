import { useState, useEffect } from 'react';
import type { Family } from '../types/events';
import { getFamilyForUser } from '../services/family';

export function useFamily(userId: string | undefined) {
  const [family, setFamily] = useState<Family | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    getFamilyForUser(userId)
      .then((f) => {
        if (!cancelled) {
          setFamily(f);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error('Failed to load family:', err);
          setError('Failed to load family data');
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [userId]);

  return { family, loading, error, setFamily };
}
