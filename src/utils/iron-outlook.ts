import { referenceFor } from '../data/nutrient-reference';
import { milkNutrients } from './nutrient-weather';
import { ceilingWarning } from './next-foods';
import { IRON_RICH_MG, NUTRIENT_NUDGE_FROM_MONTHS } from './weaning-rules';
import type { BabySex, MilkSource } from '../types/events';
import type { Nutrients, SeedFood } from '../types/food';

/**
 * Iron gets its own answer because it is the one nutrient where a breastfed
 * baby's milk never catches up, at any age and any volume, and because the
 * amount her meals have to bring is both large and flat — about 4.3 mg a day
 * from six months onwards, which is essentially the whole requirement.
 *
 * The deciding factor is how she is fed, not how old she is. Japanese infant
 * formula runs 0.78-0.90 mg per 100 mL prepared against breast milk's 0.04, so
 * a bottle-fed baby's milk covers the requirement at 600 mL and a breastfed
 * baby's never does. Age only sets when the requirement rises.
 */
export interface IronOutlook {
  /** The published daily requirement for the whole diet at this age. */
  need: number;
  /** What milk brings at the volume set. */
  fromMilk: number;
  /** What the meals have to bring: the requirement less the milk. */
  needFromFood: number;
  /** How far the meals still are from that, today. */
  shortBy: number;
  /** The job has not started: the requirement rises ninefold at six months. */
  startsAtSixMonths: boolean;
  /** Iron-rich foods already in the seed, richest first. */
  suggestions: SeedFood[];
  /** A serving caution on one of the suggestions, if any carries one. */
  caution: string | null;
}

/** How many foods to name. More than a few reads as a list to work through. */
const SUGGESTION_LIMIT = 4;

const ironOf = (n: Nutrients | undefined) => n?.ironMg ?? 0;

export function ironOutlook(input: {
  ageMonths: number;
  sex?: BabySex;
  source: MilkSource;
  mlPerDay: number;
  /** Iron the meals currently bring per day, averaged over the range shown. */
  fromFood: number;
  byId: ReadonlyMap<string, SeedFood>;
}): IronOutlook {
  const { ageMonths, sex, source, mlPerDay, fromFood, byId } = input;
  const startsAtSixMonths = ageMonths < NUTRIENT_NUDGE_FROM_MONTHS;

  // Under six months the figure worth showing is the one that is coming, not
  // the milk-derived one for today — the whole point is the size of the step.
  const lookAt = Math.max(ageMonths, NUTRIENT_NUDGE_FROM_MONTHS);
  const need = referenceFor(lookAt, sex).find((r) => r.key === 'ironMg')?.amount ?? 0;

  const fromMilk = milkNutrients(source, mlPerDay, byId).ironMg;
  const needFromFood = Math.max(0, need - fromMilk);
  const shortBy = Math.max(0, needFromFood - fromFood);

  // Nothing to suggest when milk already covers it: pushing liver at a
  // formula-fed baby would be advice for a problem she does not have.
  const suggestions = needFromFood === 0 ? [] : [...byId.values()]
    .filter((s) => s.suggest !== false && s.nutrients.ironMg >= IRON_RICH_MG)
    .sort((a, b) => ironOf(b.nutrients) - ironOf(a.nutrients))
    .slice(0, SUGGESTION_LIMIT);

  const reference = referenceFor(lookAt, sex);
  const caution = suggestions
    .map((s) => ceilingWarning(s, reference))
    .find((warning): warning is string => warning !== null) ?? null;

  return { need, fromMilk, needFromFood, shortBy, startsAtSixMonths, suggestions, caution };
}
