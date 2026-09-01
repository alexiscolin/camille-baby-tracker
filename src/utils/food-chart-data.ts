import { format } from 'date-fns';
import { mealNutrients, toGrams } from './meal-nutrition';
import { NUTRIENT_KEYS, FOOD_GROUPS } from '../types/food';
import type { BabyEvent } from '../types/events';
import type { Food, FoodGroup, MealEvent, NutrientKey } from '../types/food';

const DAY_FORMAT = 'yyyy-MM-dd';

export type GroupIntakeRow = { date: string; label: string } & Record<FoodGroup, number>;

function emptyGroupTotals(): Record<FoodGroup, number> {
  return Object.fromEntries(FOOD_GROUPS.map((g) => [g, 0])) as Record<FoodGroup, number>;
}

function mealEvents(events: BabyEvent[]): MealEvent[] {
  return events.filter((event): event is MealEvent => event.type === 'meal');
}

/** Grams eaten per food group per day, with a zero row for days without meals. */
export function buildGroupIntake(
  events: BabyEvent[],
  byId: Map<string, Food>,
  days: { date: Date; label: string }[],
): GroupIntakeRow[] {
  const totalsByDay = new Map<string, Record<FoodGroup, number>>();
  for (const day of days) {
    totalsByDay.set(format(day.date, DAY_FORMAT), emptyGroupTotals());
  }

  for (const event of mealEvents(events)) {
    const key = format(event.timestamp.toDate(), DAY_FORMAT);
    const totals = totalsByDay.get(key);
    if (!totals) continue;
    for (const item of event.items) {
      const food = byId.get(item.foodId);
      if (!food) continue;
      totals[food.group] += toGrams(item, food);
    }
  }

  return days.map((day) => {
    const key = format(day.date, DAY_FORMAT);
    return { date: key, label: day.label, ...totalsByDay.get(key)! };
  });
}

/** Cumulative count of distinct foods ever eaten, up to and including each day. */
export function buildVarietyCurve(
  events: BabyEvent[],
  days: { date: Date; label: string }[],
): { label: string; total: number }[] {
  const eatenByDay = new Map<string, Set<string>>();
  for (const day of days) {
    eatenByDay.set(format(day.date, DAY_FORMAT), new Set<string>());
  }

  for (const event of mealEvents(events)) {
    const key = format(event.timestamp.toDate(), DAY_FORMAT);
    const eaten = eatenByDay.get(key);
    if (!eaten) continue;
    for (const item of event.items) eaten.add(item.foodId);
  }

  const seen = new Set<string>();
  return days.map((day) => {
    const eaten = eatenByDay.get(format(day.date, DAY_FORMAT))!;
    for (const foodId of eaten) seen.add(foodId);
    return { label: day.label, total: seen.size };
  });
}

/** For each nutrient, the earliest meal date it appeared in, and the food responsible. */
export function buildFirstExposure(
  events: BabyEvent[],
  byId: Map<string, Food>,
): { nutrient: NutrientKey; date: Date | null; foodName: string | null }[] {
  const chronological = [...mealEvents(events)]
    .sort((a, b) => a.timestamp.toMillis() - b.timestamp.toMillis());

  const first = new Map<NutrientKey, { date: Date; foodName: string }>();

  for (const meal of chronological) {
    for (const item of meal.items) {
      const nutrients = mealNutrients([item], byId);
      for (const key of NUTRIENT_KEYS) {
        if (nutrients[key] > 0 && !first.has(key)) {
          const food = byId.get(item.foodId);
          first.set(key, { date: meal.timestamp.toDate(), foodName: food?.name ?? item.name });
        }
      }
    }
  }

  return NUTRIENT_KEYS.map((nutrient) => {
    const hit = first.get(nutrient);
    return { nutrient, date: hit?.date ?? null, foodName: hit?.foodName ?? null };
  });
}

/** Average daily intake of each nutrient over the given number of days. */
export function buildNutrientCoverage(
  events: BabyEvent[],
  byId: Map<string, Food>,
  days: number,
): { nutrient: NutrientKey; perDay: number }[] {
  const totals = Object.fromEntries(NUTRIENT_KEYS.map((k) => [k, 0])) as Record<NutrientKey, number>;

  for (const event of mealEvents(events)) {
    const nutrients = mealNutrients(event.items, byId);
    for (const key of NUTRIENT_KEYS) totals[key] += nutrients[key];
  }

  return NUTRIENT_KEYS.map((nutrient) => ({ nutrient, perDay: totals[nutrient] / days }));
}
