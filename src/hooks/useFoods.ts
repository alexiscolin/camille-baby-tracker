import { useState, useEffect } from 'react';
import type { Food } from '../types/food';
import { subscribeToFoods } from '../services/food-catalog';

export function useFoods(familyId: string | undefined) {
  const [foods, setFoods] = useState<Food[]>([]);
  // Tracks which family the data in state actually belongs to, so `loading`
  // can be derived from a mismatch instead of reset with a synchronous
  // setState in the effect body (which trips react-hooks/set-state-in-effect).
  // This also means `loading` stays true across a familyId change until the
  // new family's first snapshot (or error) arrives, instead of going stale.
  const [loadedFamilyId, setLoadedFamilyId] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);
  const [hasPendingWrites, setHasPendingWrites] = useState(false);

  useEffect(() => {
    if (!familyId) return;

    const unsubscribe = subscribeToFoods(
      familyId,
      (result) => {
        setFoods(result.foods);
        setFromCache(result.fromCache);
        setHasPendingWrites(result.hasPendingWrites);
        setLoadedFamilyId(familyId);
      },
      () => {
        setLoadedFamilyId(familyId);
      },
    );

    return unsubscribe;
  }, [familyId]);

  const loading = familyId ? loadedFamilyId !== familyId : false;

  return { foods, loading, fromCache, hasPendingWrites };
}
