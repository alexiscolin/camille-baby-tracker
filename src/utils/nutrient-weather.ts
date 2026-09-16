import { format } from 'date-fns';
import { NUTRIENT_KEYS } from '../types/food';
import { emptyNutrients, mealNutrients } from './meal-nutrition';
import type { BabyEvent, MilkSource } from '../types/events';
import type { Food, NutrientKey, Nutrients } from '../types/food';

const DAY_FORMAT = 'yyyy-MM-dd';

/**
 * Which seed row stands in for each milk. Both rows are held per 100 mL — the
 * 成分表 publishes 人乳 per 100 g and gives the conversion in its own 備考
 * (100 mL = 101.7 g), so the density is applied once, in the seed, instead of
 * being a factor every caller has to remember. Formula was already per 100 mL.
 *
 * `mixed` deliberately uses human milk rather than a blend: formula is
 * iron-fortified at roughly twenty times the level, so assuming it would hide
 * a real iron gap. Under-crediting milk errs toward suggesting iron-rich food,
 * which is the direction the guide already pushes for a breastfed baby.
 */
export const MILK_FOOD_ID: Record<MilkSource, string | null> = {
  breast: 'human-milk',
  mixed: 'human-milk',
  formula: 'formula-prepared',
  none: null,
};

export type NutrientKind = 'target' | 'limit' | 'context';

/** One published daily intake, before milk is taken off it. */
export interface ReferenceValue {
  key: NutrientKey;
  kind: NutrientKind;
  amount: number;
  /** The published 耐容上限量, where one exists at this age. */
  ceiling?: number;
}

export interface NutrientTarget {
  key: NutrientKey;
  kind: NutrientKind;
  /** What food has to supply: the reference intake less what milk brings. */
  fromFood: number;
  /** Headroom left for food under the upper limit, once milk is counted. */
  ceiling?: number;
}

export type Band = 'met' | 'partial' | 'low';
export type Trend = 'up' | 'down' | 'flat';

export interface WeatherCell {
  date: string;
  amount: number;
  ratio: number;
  band: Band | null;
  /** Past the upper limit on this day. Independent of `band`: a nutrient can be
   *  short of its target on the week and still blow the limit on one day. */
  overCeiling: boolean;
}

export interface WeatherRow {
  key: NutrientKey;
  kind: NutrientKind;
  /** The daily target this row was graded against, for the tooltip. */
  target: number;
  cells: WeatherCell[];
  /** Mean daily intake over the window, as a share of the target. */
  ratio: number | null;
  trend: Trend | null;
  /** The window average is past the upper limit — a habit, not a one-off day. */
  overCeiling: boolean;
}

/**
 * ponytail: heuristic band edges — no source gives daily cut-offs for an
 * infant, and the guide talks in weeks, not days. They exist to colour a grid,
 * never to diagnose. Move them if a source ever gives real ones.
 */
const MET = 0.8;
const PARTIAL = 0.4;
/** Relative change over the window before a trend is worth drawing an arrow for. */
const TREND_DELTA = 0.1;

const mean = (xs: number[]): number => (xs.length === 0 ? 0 : xs.reduce((a, b) => a + b, 0) / xs.length);

/** A target of zero means milk already covers it, so food has nothing to make up. */
const ratioOf = (amount: number, target: number): number => (target > 0 ? amount / target : 1);

/** What the milk alone brings in a day. Zero once milk has stopped. */
export function milkNutrients(
  source: MilkSource,
  mlPerDay: number,
  byId: Map<string, Food>,
): Nutrients {
  const id = MILK_FOOD_ID[source];
  const per100ml = id ? byId.get(id)?.nutrients : undefined;
  if (!per100ml) return emptyNutrients();

  const factor = mlPerDay / 100;
  const total = emptyNutrients();
  for (const key of NUTRIENT_KEYS) total[key] = per100ml[key] * factor;
  return total;
}

/**
 * The reference intake is for the whole diet; milk covers part of it. What is
 * left is what the meals have to bring, and that is the only number a parent
 * can act on. Floors at zero — a nutrient milk already covers is not a
 * negative target, it is simply not a job for food.
 */
export function dailyTargets(reference: ReferenceValue[], milk: Nutrients): NutrientTarget[] {
  return reference.map(({ key, kind, amount, ceiling }) => ({
    key,
    kind,
    fromFood: kind === 'context' ? 0 : Math.max(0, amount - milk[key]),
    // The limit is for the whole diet too, so what milk brings eats into the
    // headroom food has left under it.
    ...(ceiling === undefined ? {} : { ceiling: Math.max(0, ceiling - milk[key]) }),
  }));
}

/** On a limit the scale is inverted: staying under it is the good outcome. */
export function bandOf(ratio: number, kind: NutrientKind): Band | null {
  if (kind === 'context') return null;
  if (kind === 'limit') {
    if (ratio > 1) return 'low';
    return ratio >= MET ? 'partial' : 'met';
  }
  if (ratio >= MET) return 'met';
  return ratio >= PARTIAL ? 'partial' : 'low';
}

/**
 * Direction of the amount itself, not of whether it is good news — on a limit
 * row, `up` is the bad way. The row carries its `kind` so the view can say so.
 * The middle day of an odd window is dropped rather than counted twice.
 */
function trendOf(amounts: number[], kind: NutrientKind): Trend | null {
  if (kind === 'context' || amounts.length < 2) return null;
  const half = Math.floor(amounts.length / 2);
  const early = mean(amounts.slice(0, half));
  const late = mean(amounts.slice(amounts.length - half));
  const scale = Math.max(early, late);
  if (scale === 0) return 'flat';
  if (late - early > scale * TREND_DELTA) return 'up';
  if (early - late > scale * TREND_DELTA) return 'down';
  return 'flat';
}

/**
 * One row per target, one cell per day. Days without meals are zero rows, not
 * holes: "nothing went in" is the answer the grid exists to show.
 *
 * The verdict is the window mean rather than any single day. One meal of liver
 * covers several days of iron, so a per-day pass mark would report which
 * vegetable was cooked, not whether the baby is short.
 */
export function buildNutrientWeather(
  events: BabyEvent[],
  byId: Map<string, Food>,
  days: { date: Date; label: string }[],
  targets: NutrientTarget[],
): WeatherRow[] {
  const totalsByDay = new Map<string, Nutrients>();
  for (const day of days) totalsByDay.set(format(day.date, DAY_FORMAT), emptyNutrients());

  for (const event of events) {
    if (event.type !== 'meal') continue;
    const totals = totalsByDay.get(format(event.timestamp.toDate(), DAY_FORMAT));
    if (!totals) continue;
    const eaten = mealNutrients(event.items, byId);
    for (const key of NUTRIENT_KEYS) totals[key] += eaten[key];
  }

  const dayKeys = days.map((day) => format(day.date, DAY_FORMAT));

  const over = (amount: number, ceiling?: number) => ceiling !== undefined && amount > ceiling;

  return targets.map(({ key, kind, fromFood, ceiling }) => {
    const amounts = dayKeys.map((dayKey) => totalsByDay.get(dayKey)![key]);
    const cells = dayKeys.map((date, i) => {
      const ratio = ratioOf(amounts[i], fromFood);
      return {
        date,
        amount: amounts[i],
        ratio,
        band: bandOf(ratio, kind),
        overCeiling: over(amounts[i], ceiling),
      };
    });

    return {
      key,
      kind,
      target: fromFood,
      cells,
      ratio: kind === 'context' ? null : ratioOf(mean(amounts), fromFood),
      trend: trendOf(amounts, kind),
      overCeiling: over(mean(amounts), ceiling),
    };
  });
}

/**
 * The nutrients worth acting on, worst first. Only floors: a ceiling is not
 * something to go shopping for, and an ungraded row has no opinion to give.
 */
export function nutrientGaps(rows: WeatherRow[], count = 2): NutrientKey[] {
  return rows
    .filter((row): row is WeatherRow & { ratio: number } =>
      row.kind === 'target' && row.ratio !== null && row.ratio < MET)
    .sort((a, b) => a.ratio - b.ratio)
    .slice(0, count)
    .map((row) => row.key);
}
