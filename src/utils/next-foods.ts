import { addDays } from 'date-fns';
import type { Timestamp } from 'firebase/firestore';
import type { Food, FoodGroup, FoodStatus, Nutrients, SeedFood, WeaningStage } from '../types/food';
import { FOOD_GROUPS } from '../types/food';
import type { Allergen } from './allergens';
import { ALLERGENS, ALLERGEN_LABELS, isMandatoryAllergen } from './allergens';
import { isManualStatus } from './food-status';

/** A new allergen or food is held back for this many days after the last one. */
export const INTRODUCTION_GAP_DAYS = 3;
/** Tolerance needs re-exposure within this window, or it's flagged as lapsed. */
export const MAINTENANCE_GAP_DAYS = 14;

const DAY_MS = 24 * 60 * 60 * 1000;

export type NextFoodsInput = {
  seed: readonly SeedFood[];
  foods: Food[];
  stage: WeaningStage;
  now: Date;
  recentNutrients: Nutrients | null;
};

export type NextFoodCandidate = {
  seed: SeedFood;
  score: number;
  reasons: string[];
  heldBy?: { allergen: Allergen; foodName: string };
};

export type AllergenStatus = {
  allergen: Allergen;
  mandatory: boolean;
  introduced: boolean;
  firstTriedAt?: Date;
  lastTriedAt?: Date;
  exposureCount: number;
  status: FoodStatus;
  needsMaintenance: boolean;
};

/**
 * The three nutrients most likely to run short once solids replace some
 * milk/formula intake. Iron leads because infant iron stores deplete from
 * around six months — this is the gap that matters most.
 */
const GAP_NUTRIENT_KEYS = ['ironMg', 'zincMg', 'vitaminDUg'] as const;
type GapNutrient = (typeof GAP_NUTRIENT_KEYS)[number];

const GAP_NUTRIENT_LABEL: Record<GapNutrient, string> = {
  ironMg: 'iron',
  zincMg: 'zinc',
  vitaminDUg: 'vitamin D',
};

/**
 * 7-day reference intake per gap nutrient, taken as 7x Japan's Dietary
 * Reference Intakes (日本人の食事摂取基準) Adequate Intake for infants
 * 6-11 months: iron 5.0 mg/day, zinc 3.0 mg/day, vitamin D 5.0 µg/day.
 * These are planning targets for a checklist screen, not a clinical dose.
 */
const GAP_NUTRIENT_REFERENCE_7DAY: Record<GapNutrient, number> = {
  ironMg: 35,
  zincMg: 21,
  vitaminDUg: 35,
};

/**
 * Per-100g level above which a food is a meaningful contributor rather than
 * a trace source — set so a typical 20-30g weaning portion at the threshold
 * still supplies a noticeable fraction of the daily target (roughly a third
 * of a day's worth of iron/zinc, or a comparable slice of vitamin D).
 */
const STRONG_SOURCE_THRESHOLD: Record<GapNutrient, number> = {
  ironMg: 1.5,
  zincMg: 1,
  vitaminDUg: 1,
};

const STATUS_PRIORITY: readonly FoodStatus[] = [
  'confirmed_allergy', 'avoid', 'suspected', 'watch', 'safe', 'untried',
];

function hasFirstTriedAt(food: Food): food is Food & { firstTriedAt: Timestamp } {
  return Boolean(food.firstTriedAt);
}

function isAllergenIntroduced(foods: Food[], allergen: Allergen): boolean {
  return foods.some((f) => f.allergens.includes(allergen) && hasFirstTriedAt(f));
}

/** Foods whose status should hold back anything sharing their allergen. */
function isBlockingStatus(status: FoodStatus): boolean {
  return status === 'suspected' || isManualStatus(status);
}

function buildHoldBackMap(foods: Food[]): Map<Allergen, string> {
  const map = new Map<Allergen, string>();
  for (const f of foods) {
    if (!isBlockingStatus(f.status)) continue;
    for (const allergen of f.allergens) {
      if (!map.has(allergen)) map.set(allergen, f.name);
    }
  }
  return map;
}

function countByGroup(foods: Food[]): Record<FoodGroup, number> {
  const counts = Object.fromEntries(FOOD_GROUPS.map((g) => [g, 0])) as Record<FoodGroup, number>;
  for (const f of foods) counts[f.group] += 1;
  return counts;
}

function rollupStatus(foods: Food[]): FoodStatus {
  for (const status of STATUS_PRIORITY) {
    if (foods.some((f) => f.status === status)) return status;
  }
  return 'untried';
}

/**
 * Whether a new food/allergen can be introduced today. Japanese weaning
 * guidance spaces new introductions out so a reaction can be traced to a
 * single cause; this reports the window, it doesn't enforce it.
 */
export function getIntroductionWindow(
  foods: Food[],
  now: Date,
): { open: true } | { open: false; nextDate: Date } {
  const lastIntroducedAt = foods.reduce<Date | null>((latest, f) => {
    if (!hasFirstTriedAt(f)) return latest;
    const d = f.firstTriedAt.toDate();
    return !latest || d > latest ? d : latest;
  }, null);

  if (!lastIntroducedAt) return { open: true };

  const nextDate = addDays(lastIntroducedAt, INTRODUCTION_GAP_DAYS);
  if (now.getTime() >= nextDate.getTime()) return { open: true };
  return { open: false, nextDate };
}

/**
 * Ranks candidate foods the family hasn't logged yet. Un-introduced major
 * allergens score highest — current paediatric guidance (LEAP, PETIT) is to
 * introduce them early and repeatedly, not to delay them, which is the
 * opposite of most parents' instinct. Foods that would collide with a
 * suspected/confirmed/avoided allergen are still returned, just sorted last
 * and marked with `heldBy`, so the parent can see and override the reasoning.
 */
export function rankNextFoods(input: NextFoodsInput): NextFoodCandidate[] {
  const { seed, foods, stage, recentNutrients } = input;
  const existingIds = new Set(foods.map((f) => f.id));
  const holdBackMap = buildHoldBackMap(foods);
  const groupCounts = countByGroup(foods);
  const minGroupCount = Math.min(...Object.values(groupCounts));

  const candidates: NextFoodCandidate[] = seed
    .filter((s) => s.minStage <= stage && !existingIds.has(s.id))
    .map((s) => {
      const reasons: string[] = [];
      let score = 0;

      for (const allergen of s.allergens) {
        if (isAllergenIntroduced(foods, allergen)) continue;
        if (isMandatoryAllergen(allergen)) {
          score += 100;
          reasons.push(
            `Introduces the un-tried allergen ${ALLERGEN_LABELS[allergen]} — early, repeated exposure is current guidance.`,
          );
        } else {
          score += 60;
          reasons.push(`Introduces the un-tried allergen ${ALLERGEN_LABELS[allergen]}.`);
        }
      }

      if (recentNutrients) {
        for (const key of GAP_NUTRIENT_KEYS) {
          const reference = GAP_NUTRIENT_REFERENCE_7DAY[key];
          const deficit = (reference - recentNutrients[key]) / reference;
          if (deficit > 0 && s.nutrients[key] >= STRONG_SOURCE_THRESHOLD[key]) {
            score += 50 * deficit;
            reasons.push(`Good source of ${GAP_NUTRIENT_LABEL[key]}, which has been running low this week.`);
          }
        }
      }

      if (groupCounts[s.group] === minGroupCount) {
        score += 20;
        reasons.push(`Adds variety — ${s.group} is the least-represented group logged so far.`);
      }

      if (s.minStage === stage) {
        score += 5;
        reasons.push('Age-appropriate for the current stage, not just permitted.');
      }

      const heldAllergen = s.allergens.find((a) => holdBackMap.has(a));
      const heldBy = heldAllergen
        ? { allergen: heldAllergen, foodName: holdBackMap.get(heldAllergen) as string }
        : undefined;

      return heldBy ? { seed: s, score, reasons, heldBy } : { seed: s, score, reasons };
    });

  return candidates.sort((a, b) => {
    if (Boolean(a.heldBy) !== Boolean(b.heldBy)) return a.heldBy ? 1 : -1;
    return b.score - a.score;
  });
}

/**
 * Per-allergen status across the whole catalog, for the maintenance
 * checklist. `needsMaintenance` only ever applies to an allergen that has
 * actually been introduced — never-tried is "not started", not "lapsed".
 */
export function getAllergenStatus(foods: Food[], now: Date): AllergenStatus[] {
  return ALLERGENS.map((allergen) => {
    const relevant = foods.filter((f) => f.allergens.includes(allergen));
    const triedFoods = relevant.filter(hasFirstTriedAt);
    const introduced = triedFoods.length > 0;

    const firstTriedAt = introduced
      ? new Date(Math.min(...triedFoods.map((f) => f.firstTriedAt.toDate().getTime())))
      : undefined;
    const lastTriedAt = introduced
      ? new Date(Math.max(...triedFoods.map((f) => (f.lastTriedAt ?? f.firstTriedAt).toDate().getTime())))
      : undefined;

    const needsMaintenance =
      introduced && lastTriedAt !== undefined && now.getTime() - lastTriedAt.getTime() > MAINTENANCE_GAP_DAYS * DAY_MS;

    return {
      allergen,
      mandatory: isMandatoryAllergen(allergen),
      introduced,
      firstTriedAt,
      lastTriedAt,
      exposureCount: relevant.reduce((sum, f) => sum + f.exposureCount, 0),
      status: rollupStatus(relevant),
      needsMaintenance,
    };
  });
}
