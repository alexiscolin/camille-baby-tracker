import { NUTRIENT_KEYS } from '../types/food';
import { novelFoodIds } from './food-status';
import type { Food, MealItem, Nutrients, Reaction } from '../types/food';

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

/**
 * The single guarantee that a reaction is attributed conservatively. A reaction
 * after a multi-food meal cannot identify the culprit, so novelFoodIds(items)
 * is the floor and is always kept whole, whatever the UI sent up; the UI's set
 * only ever adds to it. The one thing removed is an id no longer in the meal —
 * a food that was not served cannot have caused this reaction, and that can
 * never cut into the floor, which is a subset of the items by construction.
 *
 * Also drops optional keys that are unset: Firestore rejects `undefined`
 * client-side and firestore.rules rejects `null`, so they must be absent.
 */
export function buildReactionPayload(reaction: Reaction, items: MealItem[]): Reaction {
  return {
    symptoms: reaction.symptoms,
    severity: reaction.severity,
    suspectedFoodIds: [...new Set([
      ...novelFoodIds(items),
      ...reaction.suspectedFoodIds.filter((id) => items.some((i) => i.foodId === id)),
    ])],
    ...(reaction.onsetMinutes !== undefined ? { onsetMinutes: reaction.onsetMinutes } : {}),
    ...(reaction.resolvedMinutes !== undefined ? { resolvedMinutes: reaction.resolvedMinutes } : {}),
    ...(reaction.note ? { note: reaction.note } : {}),
  };
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
