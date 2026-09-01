import type { Food, FoodStatus, MealEvent, MealItem } from '../types/food';

const CLEAN_EXPOSURES_FOR_SAFE = 3;
const MANUAL_STATUSES: readonly FoodStatus[] = ['confirmed_allergy', 'avoid'];

export function isManualStatus(status: FoodStatus): boolean {
  return MANUAL_STATUSES.includes(status);
}

export function deriveStatus(
  food: Pick<Food, 'status' | 'exposureCount' | 'reactionEventIds'>,
  cleanExposuresSinceReaction: number,
): FoodStatus {
  if (isManualStatus(food.status)) return food.status;

  const hasReaction = food.reactionEventIds.length > 0;
  if (!hasReaction) {
    return food.exposureCount >= CLEAN_EXPOSURES_FOR_SAFE ? 'safe' : 'untried';
  }
  if (cleanExposuresSinceReaction === 0) return 'suspected';
  if (cleanExposuresSinceReaction >= CLEAN_EXPOSURES_FOR_SAFE) return 'safe';
  return 'watch';
}

/** Foods to suspect after a reaction: the novel ones, or all of them. */
export function novelFoodIds(items: MealItem[]): string[] {
  const novel = items.filter((i) => i.firstTry).map((i) => i.foodId);
  return novel.length > 0 ? novel : items.map((i) => i.foodId);
}

export function applyReaction(foods: Food[], meal: MealEvent, mealId: string): Food[] {
  const suspects = new Set(
    meal.reaction?.suspectedFoodIds.length
      ? meal.reaction.suspectedFoodIds
      : novelFoodIds(meal.items),
  );
  return foods.map((food) => {
    if (!suspects.has(food.id) || isManualStatus(food.status)) return food;
    if (food.reactionEventIds.includes(mealId)) return food;
    return {
      ...food,
      status: 'suspected',
      reactionEventIds: [...food.reactionEventIds, mealId],
    };
  });
}

const LABELS: Record<Exclude<FoodStatus, 'safe'>, string> = {
  untried: 'Not introduced',
  watch: 'Watch',
  suspected: 'Suspected',
  confirmed_allergy: 'Allergy',
  avoid: 'Avoid',
};

/**
 * Never says "safe". Three uneventful meals mean "no reaction observed",
 * not "harmless" — the distinction matters most on the major allergens.
 */
export function statusLabel(food: Pick<Food, 'status' | 'exposureCount'>): string {
  if (food.status === 'safe') return `No reaction ×${food.exposureCount}`;
  return LABELS[food.status];
}
