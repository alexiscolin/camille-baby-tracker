import { NUTRIENT_KEYS } from '../types/food';
import type { Food, MealItem, Nutrients } from '../types/food';

const DEFAULT_GRAMS_PER_TSP = 5;
const DEFAULT_GRAMS_PER_PIECE = 30;

/** Converts an eaten amount to grams. Millilitres are treated as grams. */
export function toGrams(item: MealItem, food?: Pick<Food, 'gramsPerTsp'>): number {
  switch (item.unit) {
    case 'tsp':
      return item.quantity * (food?.gramsPerTsp ?? DEFAULT_GRAMS_PER_TSP);
    case 'piece':
      return item.quantity * DEFAULT_GRAMS_PER_PIECE;
    case 'g':
    case 'ml':
    default:
      return item.quantity;
  }
}

/**
 * Flags every item whose food has never been eaten. Must be computed from the
 * catalog as it stands *before* the meal is saved — reading it back after
 * `firstTriedAt` has been written would mark nothing as a first try, and the
 * whole allergy attribution chain hangs off this flag.
 */
export function markFirstTry(items: MealItem[], byId: Map<string, Food>): MealItem[] {
  return items.map((item) => ({
    ...item,
    firstTry: !byId.get(item.foodId)?.firstTriedAt,
  }));
}

function emptyNutrients(): Nutrients {
  return Object.fromEntries(NUTRIENT_KEYS.map((k) => [k, 0])) as unknown as Nutrients;
}

/** Sums per-100 g nutrients scaled to what was actually eaten. */
export function mealNutrients(items: MealItem[], byId: Map<string, Food>): Nutrients {
  const total = emptyNutrients();
  for (const item of items) {
    const food = byId.get(item.foodId);
    if (!food?.nutrients) continue;
    const factor = toGrams(item, food) / 100;
    for (const key of NUTRIENT_KEYS) {
      total[key] += food.nutrients[key] * factor;
    }
  }
  return total;
}
