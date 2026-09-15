import { differenceInCalendarDays, differenceInMonths } from 'date-fns';
import type { Timestamp } from 'firebase/firestore';
import type { Food, FoodGroup, WeaningPhase, WeaningStage } from '../types/food';
import { getWeaningStage } from './weaning-stage';
import { NON_SOLID_IDS, PHASE_DAYS, PROGRESSION_STAGE_DAYS } from './weaning-rules';

/**
 * Where the baby is in weaning. Age alone is only a guide (「月齢はあくまでも
 * 目安」, 授乳・離乳の支援ガイド p.34): what has been introduced, and since when,
 * decides what comes next.
 */
export interface WeaningProgress {
  ageMonths: number;
  /** Age-only stage. Null under 5 months. */
  ageStage: WeaningStage | null;
  startedAt: Date | null;
  daysSinceStart: number | null;
  /** The 初期 phase; always 'proteins' from stage 2. */
  phase: WeaningPhase;
  /** The lower of the age stage and the progression stage. Null under 5 months. */
  stage: WeaningStage | null;
  mealsPerDay: 1 | 2 | 3;
  eczema: boolean;
}

export function isIntroduced(food: Food): food is Food & { firstTriedAt: Timestamp } {
  return Boolean(food.firstTriedAt);
}

function introducedSolids(foods: Food[]) {
  return foods.filter(isIntroduced).filter((f) => !NON_SOLID_IDS.has(f.id));
}

/** The first solid food logged. Drinks do not start weaning. */
export function deriveWeaningStart(foods: Food[]): Date | null {
  return introducedSolids(foods).reduce<Date | null>((earliest, f) => {
    const d = f.firstTriedAt.toDate();
    return !earliest || d < earliest ? d : earliest;
  }, null);
}

function progressionStage(days: number, hasProtein: boolean): WeaningStage {
  if (days < PROGRESSION_STAGE_DAYS[2] || !hasProtein) return 1;
  if (days < PROGRESSION_STAGE_DAYS[3]) return 2;
  if (days < PROGRESSION_STAGE_DAYS[4]) return 3;
  return 4;
}

export function getWeaningProgress(input: {
  birthDate: Date;
  weaningStartedAt?: Date;
  eczema?: boolean;
  foods: Food[];
  now: Date;
}): WeaningProgress {
  const { birthDate, foods, now } = input;
  const introduced = introducedSolids(foods);
  const has = (groups: readonly FoodGroup[]) => introduced.some((f) => groups.includes(f.group));

  const start = input.weaningStartedAt ?? deriveWeaningStart(foods);
  const startedAt = start && start.getTime() <= now.getTime() ? start : null;
  const daysSinceStart = startedAt ? differenceInCalendarDays(now, startedAt) : null;
  const days = daysSinceStart ?? 0;

  const hasGrain = has(['grain']);
  const hasVegFruit = has(['vegetable', 'fruit']);
  const hasProtein = has(['protein', 'dairy']);
  // The "already introduced" branches follow a family that went faster.
  const vegetablesOpen = hasVegFruit || hasProtein || (hasGrain && days >= PHASE_DAYS.vegetables);
  const proteinsOpen = hasProtein || (hasVegFruit && days >= PHASE_DAYS.proteins);

  const ageStage = getWeaningStage(birthDate, now);
  const byProgress = startedAt ? progressionStage(days, hasProtein) : 1;
  const stage = ageStage === null ? null : (Math.min(ageStage, byProgress) as WeaningStage);

  let phase: WeaningPhase = 'porridge';
  if (vegetablesOpen) phase = 'vegetables';
  if (proteinsOpen || (stage ?? 1) >= 2) phase = 'proteins';

  return {
    ageMonths: differenceInMonths(now, birthDate),
    ageStage,
    startedAt,
    daysSinceStart,
    phase,
    stage,
    mealsPerDay: stage === null || stage === 1 ? 1 : stage === 2 ? 2 : 3,
    eczema: input.eczema ?? false,
  };
}
