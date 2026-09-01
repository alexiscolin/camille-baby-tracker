import { useState, useEffect } from 'react';
import type { Food } from '../types/food';
import { subscribeToFoods } from '../services/food-catalog';

export function useFoods(familyId: string | undefined) {
  const [foods, setFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(true);
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
        setLoading(false);
      },
      () => {
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [familyId]);

  return { foods, loading: familyId ? loading : false, fromCache, hasPendingWrites };
}
