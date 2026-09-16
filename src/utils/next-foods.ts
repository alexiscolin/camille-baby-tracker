import { addDays, format, isSameDay, startOfDay } from 'date-fns';
import type { Food, FoodGroup, FoodStatus, NutrientKey, SeedFood, WeaningStage } from '../types/food';
import { FOOD_GROUPS } from '../types/food';
import type { Allergen } from './allergens';
import { ALLERGENS, allergenLabel, isAllergen, isMandatoryAllergen } from './allergens';
import { isManualStatus } from './food-status';
import type { WeaningProgress } from './weaning-progress';
import { isIntroduced } from './weaning-progress';
import {
  ALLERGEN_ENTRY, ASK_DOCTOR_ALLERGENS, ECZEMA_DOCTOR_ALLERGENS, FIRST_TASTE_GRAMS, IRON_RICH_MG,
  LADDERS, MAINTENANCE_GAP_DAYS, NEW_ALLERGEN_SPACING_DAYS, NUTRIENT_NUDGE_FROM_MONTHS,
  PACED_ALLERGENS, PHASE_GROUPS, PUSHED_ALLERGEN, VITAMIN_D_SOURCE_UG,
} from './weaning-rules';
import { NUTRIENT_LABEL } from '../data/nutrient-reference';
import type { ReferenceValue } from './nutrient-weather';

export { MAINTENANCE_GAP_DAYS };

const DAY_MS = 24 * 60 * 60 * 1000;

export type Readiness = 'now' | 'later' | 'doctor' | 'held';

export type NextFoodsInput = {
  seed: readonly SeedFood[];
  foods: Food[];
  progress: WeaningProgress;
  now: Date;
  /** Published intakes for this age and sex. Without them nothing is said about limits. */
  reference?: readonly ReferenceValue[];
  /** Nutrients the last week came up short of, worst first. */
  gaps?: readonly NutrientKey[];
};

export type NextFoodCandidate = {
  seed: SeedFood;
  readiness: Readiness;
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

export type Pace = {
  /** A food first tried today. City weaning guides (那覇市, 奈良市) suggest at most one new food a day. */
  newToday: Food | null;
  lastAllergen: { name: string; at: Date } | null;
  /** When the next new allergen fits; null when one is fine today. */
  allergensOpenFrom: Date | null;
};

const READINESS_ORDER: Record<Readiness, number> = { now: 0, later: 1, doctor: 2, held: 3 };

const STATUS_PRIORITY: readonly FoodStatus[] = [
  'confirmed_allergy', 'avoid', 'suspected', 'watch', 'safe', 'untried',
];

const STAGE_LATER_REASON: Record<WeaningStage, string> = {
  1: '',
  2: 'At stage 2 — tongue-mashable foods, around 7–8 months.',
  3: 'At stage 3 — gum-mashable foods, around 9–11 months.',
  4: 'At stage 4 — around 12–18 months.',
};

/**
 * The food groups a weaning meal is built from (guide p.32: 穀類, 野菜・果物,
 * たんぱく質性食品). Fats, seaweed and seasonings are extras: they never earn the
 * "first of its group" or variety bonus, or they would crowd out fish and egg.
 */
const CORE_GROUPS: readonly FoodGroup[] = ['grain', 'vegetable', 'fruit', 'protein', 'dairy'];

const GROUP_NOUN: Partial<Record<FoodGroup, string>> = {
  grain: 'grain', vegetable: 'vegetable', fruit: 'fruit', protein: 'protein food', dairy: 'dairy food',
};

const PACED = new Set<string>(PACED_ALLERGENS);

/** A serving has to carry this share of the daily figure to count as a source of it. */
const SOURCE_SHARE = 0.1;
const GAP_BONUS = 25;

const servingAmount = (s: SeedFood, key: NutrientKey) =>
  s.nutrients[key] * (FIRST_TASTE_GRAMS / 100);

/**
 * Whether a first serving of this food would pass a published upper limit.
 *
 * Chicken liver is why this exists: 14 000 ugRAE of vitamin A per 100 g against
 * a 600 ugRAE daily limit, so four grams reaches the limit for the day — on a
 * food this app suggests for its iron, and that Japanese guidance does
 * recommend, in teaspoons and not every day. The food is never withheld; the
 * amount is what matters, and the amount is what the warning talks about.
 */
export function ceilingWarning(
  s: SeedFood,
  reference: readonly ReferenceValue[] = [],
): string | null {
  for (const { key, ceiling } of reference) {
    if (ceiling === undefined || ceiling <= 0) continue;
    const times = servingAmount(s, key) / ceiling;
    if (times <= 1) continue;
    const howMuch = times >= 2 ? `about ${Math.round(times)} times` : 'past';
    return `A ${FIRST_TASTE_GRAMS} g serving is ${howMuch} the daily ${NUTRIENT_LABEL[key].toLowerCase()} limit — a teaspoon at most, and not every day.`;
  }
  return null;
}

/** Foods worth suggesting for a gap: a trace of the nutrient is not an answer to it. */
function answersGap(
  s: SeedFood,
  gaps: readonly NutrientKey[],
  reference: readonly ReferenceValue[],
): NutrientKey | null {
  for (const key of gaps) {
    const target = reference.find((r) => r.key === key);
    if (!target || target.amount <= 0) continue;
    if (servingAmount(s, key) >= target.amount * SOURCE_SHARE) return key;
  }
  return null;
}

/** Whether a first taste of this allergen is spaced from others and timed for clinic hours. */
export function isPacedAllergen(allergen: string): boolean {
  return PACED.has(allergen);
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
      if (isAllergen(allergen) && !map.has(allergen)) map.set(allergen, f.name);
    }
  }
  return map;
}

function rollupStatus(foods: Food[]): FoodStatus {
  for (const status of STATUS_PRIORITY) {
    if (foods.some((f) => f.status === status)) return status;
  }
  return 'untried';
}

/**
 * Pace informs; it never hides a suggestion. A paced allergen counts as new
 * on the day its first food was tried.
 */
export function getPace(foods: Food[], now: Date): Pace {
  const tried = foods.filter(isIntroduced);
  const newToday = tried.find((f) => isSameDay(f.firstTriedAt.toDate(), now)) ?? null;

  const firstByAllergen = new Map<Allergen, { name: string; at: Date }>();
  for (const f of tried) {
    const at = f.firstTriedAt.toDate();
    for (const a of f.allergens) {
      if (!isAllergen(a) || !isPacedAllergen(a)) continue;
      const current = firstByAllergen.get(a);
      if (!current || at < current.at) firstByAllergen.set(a, { name: f.name, at });
    }
  }
  const lastAllergen = [...firstByAllergen.values()]
    .reduce<{ name: string; at: Date } | null>((latest, x) => (!latest || x.at > latest.at ? x : latest), null);

  const openFrom = lastAllergen ? startOfDay(addDays(lastAllergen.at, NEW_ALLERGEN_SPACING_DAYS)) : null;
  return {
    newToday,
    lastAllergen,
    allergensOpenFrom: openFrom && now < openFrom ? openFrom : null,
  };
}

/** The label of the first prerequisite still missing, or null. */
function missingPrerequisite(
  s: SeedFood,
  introducedIds: Set<string>,
  introducedAllergens: Set<string>,
): string | null {
  for (const rungs of Object.values(LADDERS)) {
    const index = rungs.findIndex((r) => r.ids.includes(s.id));
    if (index <= 0) continue;
    // A later rung already reached satisfies an earlier one.
    const reached = rungs.slice(index - 1).some((r) => r.ids.some((id) => introducedIds.has(id)));
    if (!reached) return rungs[index - 1].label;
  }
  for (const a of s.allergens) {
    const entry = ALLERGEN_ENTRY[a];
    if (entry && !entry.ids.includes(s.id) && !introducedAllergens.has(a)) return entry.label;
  }
  return null;
}

/** +30 reason when the food opens a new rung or group, else null. */
function stepReason(s: SeedFood, introducedIds: Set<string>, introducedGroups: Set<FoodGroup>): string | null {
  const rungs = Object.values(LADDERS)
    .flatMap((ladder) => ladder)
    .filter((r) => r.ids.includes(s.id));
  if (rungs.length > 0) {
    const fresh = rungs.find((r) => !r.ids.some((id) => introducedIds.has(id)));
    return fresh ? `Next step in the guide's order: ${fresh.label}.` : null;
  }
  const noun = GROUP_NOUN[s.group];
  return !noun || introducedGroups.has(s.group) ? null : `First ${noun}.`;
}

/**
 * Ranks the seed foods the family has not logged, following Japanese
 * guidance: 授乳・離乳の支援ガイド 2019 order and stages, JSPACI on allergens.
 * Every food gets one readiness; nothing is dropped except `suggest: false`
 * rows, so a parent always sees the reason and can log it anyway.
 */
export function rankNextFoods(
  { seed, foods, progress, now, reference = [], gaps = [] }: NextFoodsInput,
): NextFoodCandidate[] {
  const { stage } = progress;
  if (stage === null) return [];

  const existingIds = new Set(foods.map((f) => f.id));
  const introduced = foods.filter(isIntroduced);
  const introducedIds = new Set(introduced.map((f) => f.id));
  const introducedAllergens = new Set<string>(introduced.flatMap((f) => f.allergens));
  const introducedGroups = new Set(introduced.map((f) => f.group));
  const holdBackMap = buildHoldBackMap(foods);
  const pace = getPace(foods, now);
  const doctorAllergens = new Set<Allergen>([
    ...ASK_DOCTOR_ALLERGENS,
    ...(progress.eczema ? ECZEMA_DOCTOR_ALLERGENS : []),
  ]);
  const openGroups = new Set<FoodGroup>(stage === 1 ? PHASE_GROUPS[progress.phase] : FOOD_GROUPS);

  const groupCounts = Object.fromEntries(FOOD_GROUPS.map((g) => [g, 0])) as Record<FoodGroup, number>;
  for (const f of foods) groupCounts[f.group] += 1;
  const minGroupCount = Math.min(...CORE_GROUPS.map((g) => groupCounts[g]));

  const classify = (s: SeedFood): NextFoodCandidate => {
    // Computed up front so it is said whatever the readiness turns out to be:
    // a food held back for months is still one to serve by the teaspoon later.
    const warning = ceilingWarning(s, reference);
    const waiting = (readiness: Readiness, reason: string): NextFoodCandidate =>
      ({ seed: s, readiness, score: 0, reasons: warning ? [reason, warning] : [reason] });
    const newAllergens = s.allergens.filter((a) => !introducedAllergens.has(a));
    const newPaced = newAllergens.filter(isPacedAllergen);

    const heldAllergen = s.allergens.find((a) => holdBackMap.has(a));
    if (heldAllergen) {
      const foodName = holdBackMap.get(heldAllergen) as string;
      return {
        ...waiting('held', `Shares ${allergenLabel(heldAllergen)} with ${foodName}, which is flagged.`),
        heldBy: { allergen: heldAllergen, foodName },
      };
    }

    // The age floor comes first: raw fish roe at 6 months is "not yet", not a
    // question for the paediatrician.
    if (s.minAgeMonths !== undefined && progress.ageMonths < s.minAgeMonths) {
      return waiting('later', s.minAgeMonths > 18
        ? `Not during weaning (from about ${s.minAgeMonths} months).`
        : `From ${s.minAgeMonths} months.`);
    }

    const doctorAllergen = newAllergens.find((a) => doctorAllergens.has(a));
    if (doctorAllergen) {
      const label = allergenLabel(doctorAllergen);
      return waiting('doctor', progress.eczema && ECZEMA_DOCTOR_ALLERGENS.includes(doctorAllergen)
        ? `With eczema, introduce ${label} with your doctor.`
        : `Japanese guidance gives no early-introduction advice for ${label} — decide with your paediatrician.`);
    }

    if (!openGroups.has(s.group)) {
      return waiting('later', PHASE_GROUPS.vegetables.includes(s.group)
        ? 'Once vegetables are in (around day 7).'
        : 'Once protein foods start (around day 14).');
    }

    if (s.minStage > stage) return waiting('later', STAGE_LATER_REASON[s.minStage]);

    const missing = missingPrerequisite(s, introducedIds, introducedAllergens);
    if (missing) return waiting('later', `After ${missing}.`);

    if (newPaced.length > 0 && pace.allergensOpenFrom && pace.lastAllergen) {
      return waiting('later',
        `From ${format(pace.allergensOpenFrom, 'EEE d MMM')} — a few days between new allergens (last: ${pace.lastAllergen.name}).`);
    }

    const reasons: string[] = [];
    let score = 0;
    if (s.allergens.includes(PUSHED_ALLERGEN) && !introducedAllergens.has(PUSHED_ALLERGEN)) {
      score += 40;
      reasons.push('Japanese guidance says not to delay egg — well cooked, a tiny amount first.');
    }
    const step = stepReason(s, introducedIds, introducedGroups);
    if (step) {
      score += 30;
      reasons.push(step);
    }
    // A food that would pass an upper limit keeps its place and its warning, but
    // stops collecting the bonuses that would push it to the top of the list.
    const nudgeable = warning === null && progress.ageMonths >= NUTRIENT_NUDGE_FROM_MONTHS;
    if (nudgeable && s.nutrients.ironMg >= IRON_RICH_MG) {
      score += 20;
      reasons.push('Rich in iron — the guide asks for iron-rich foods from about 6 months.');
    }
    if (nudgeable && s.nutrients.vitaminDUg >= VITAMIN_D_SOURCE_UG) {
      score += 10;
      reasons.push('A source of vitamin D, which breastfed babies can run short of.');
    }
    const gap = nudgeable ? answersGap(s, gaps, reference) : null;
    if (gap) {
      score += GAP_BONUS;
      reasons.push(`The last week was short of ${NUTRIENT_LABEL[gap].toLowerCase()}, and this is a source of it.`);
    }
    if (CORE_GROUPS.includes(s.group) && groupCounts[s.group] === minGroupCount) {
      score += 20;
      reasons.push(`Adds variety — ${s.group} is the least-represented group so far.`);
    }
    if (s.minStage === stage) {
      score += 5;
      reasons.push('Made for this stage.');
    }
    if (newPaced.length > 1) {
      reasons.push(`Carries ${newPaced.length} new allergens — harder to attribute a reaction if one occurs.`);
    }
    if (warning) reasons.push(warning);
    return { seed: s, readiness: 'now', score, reasons };
  };

  const candidates = seed
    .filter((s) => s.suggest !== false && !existingIds.has(s.id))
    .map(classify)
    .sort((a, b) => READINESS_ORDER[a.readiness] - READINESS_ORDER[b.readiness] || b.score - a.score);

  return spreadGroups(candidates);
}

/** Two candidates the sort could not separate, so we are free to reorder them. */
function isTied(a: NextFoodCandidate, b: NextFoodCandidate): boolean {
  return a.score === b.score && a.readiness === b.readiness;
}

/**
 * Within a block of tied candidates, take the first whose group differs from
 * the one just placed; no candidate ever overtakes a higher-ranked one.
 */
function spreadGroups(sorted: NextFoodCandidate[]): NextFoodCandidate[] {
  const remaining = [...sorted];
  const out: NextFoodCandidate[] = [];
  let lastGroup: FoodGroup | null = null;

  while (remaining.length > 0) {
    const index = remaining.findIndex(
      (c) => isTied(c, remaining[0]) && c.seed.group !== lastGroup,
    );
    const [picked] = remaining.splice(index === -1 ? 0 : index, 1);
    out.push(picked);
    lastGroup = picked.seed.group;
  }

  return out;
}

/**
 * Per-allergen status across the whole catalog, for the maintenance
 * checklist. `needsMaintenance` only ever applies to an allergen that has
 * actually been introduced — never-tried is "not started", not "lapsed".
 */
export function getAllergenStatus(foods: Food[], now: Date): AllergenStatus[] {
  return ALLERGENS.map((allergen) => {
    const relevant = foods.filter((f) => f.allergens.includes(allergen));
    const triedFoods = relevant.filter(isIntroduced);
    const introduced = triedFoods.length > 0;

    const firstTriedAt = introduced
      ? new Date(Math.min(...triedFoods.map((f) => f.firstTriedAt.toDate().getTime())))
      : undefined;
    const lastTriedAt = introduced
      ? new Date(Math.max(...triedFoods.map((f) => (f.lastTriedAt ?? f.firstTriedAt).toDate().getTime())))
      : undefined;

    // Keeping exposure up is advice about the major allergens; nothing asks
    // for weekly apple or gelatin.
    const needsMaintenance = isPacedAllergen(allergen)
      && introduced && lastTriedAt !== undefined
      && now.getTime() - lastTriedAt.getTime() > MAINTENANCE_GAP_DAYS * DAY_MS;

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
