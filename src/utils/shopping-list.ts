import { addDays } from 'date-fns';
import type { Food, FoodGroup, SeedFood, WeaningStage } from '../types/food';
import { FOOD_GROUPS } from '../types/food';
import type { BuyHint } from '../data/coop-okinawa';
import { pickBuyHint } from '../data/coop-okinawa';
import { getAllergenStatus, isPacedAllergen, rankNextFoods } from './next-foods';
import type { WeaningProgress } from './weaning-progress';
import { isIntroduced } from './weaning-progress';
import {
  FIRST_TASTE_GRAMS, LADDERS, NEW_ALLERGEN_SPACING_DAYS, NON_SOLID_IDS, PHASE_GROUPS,
} from './weaning-rules';

export type Slot = 'grain' | 'vegFruit' | 'protein';
type ProteinKind = 'fish' | 'meat' | 'tofu' | 'egg' | 'dairy';

export interface ShoppingLine {
  foodId: string;
  name: string;
  nameJa?: string;
  reason: 'staple' | 'new' | 'maintenance';
  /** For the whole week, rounded up to 10 g. */
  grams?: number;
  eggs?: number;
  packs?: number;
  buy: BuyHint;
  note?: string;
}

export interface ShoppingList {
  from: Date;
  to: Date;
  stage: WeaningStage;
  mealsPerDay: 1 | 2 | 3;
  grain: ShoppingLine[];
  vegFruit: ShoppingLine[];
  protein: ShoppingLine[];
}

/**
 * Upper bound of each 1回当たりの目安量 range (授乳・離乳の支援ガイド p.34). Stage 1
 * has no grams in the guide: 那覇市's end-of-month-one amounts. Protein rows are
 * alternatives (「又は」) — one per meal, never summed. `egg` is eggs per meal;
 * stage 1 buys one egg for the week (yolk only).
 */
const PORTIONS: Record<WeaningStage, Record<'grain' | 'vegFruit' | ProteinKind, number>> = {
  1: { grain: 30, vegFruit: 15, fish: 10, meat: 10, tofu: 10, egg: 0, dairy: 0 },
  2: { grain: 80, vegFruit: 30, fish: 15, meat: 15, tofu: 40, egg: 1 / 3, dairy: 70 },
  3: { grain: 90, vegFruit: 40, fish: 15, meat: 15, tofu: 45, egg: 1 / 2, dairy: 80 },
  4: { grain: 90, vegFruit: 50, fish: 20, meat: 20, tofu: 55, egg: 2 / 3, dairy: 100 },
};

/** At most one new food a day, spread so a week is not five leafy greens in a row. */
const NEW_PER_SLOT: Record<Slot, number> = { grain: 1, vegFruit: 3, protein: 3 };
/**
 * New foods planned per week. Practice: first-month calendars (那覇市, 豊見城市,
 * 港区) add about one new food a week and keep each for a few days; later
 * stages allow one a day.
 */
const NEW_PER_WEEK: Record<WeaningStage, number> = { 1: 2, 2: 7, 3: 7, 4: 7 };
const DAYS = 7;
const VEG_FRUIT_STAPLES = 4;
const PROTEIN_KINDS = 3;
const LEGUME_IDS = new Set(['chickpeas-boiled', 'lentils-boiled', 'azuki-boiled', 'kidney-beans-boiled']);
const MEAT_IDS = new Set(LADDERS.meat.flatMap((r) => r.ids));

const roundUp10 = (g: number) => Math.ceil(g / 10) * 10;

function slotOf(group: FoodGroup): Slot | null {
  if (group === 'grain') return 'grain';
  if (group === 'vegetable' || group === 'fruit') return 'vegFruit';
  if (group === 'protein' || group === 'dairy') return 'protein';
  return null;
}

function proteinKind(food: Pick<Food, 'id' | 'group' | 'allergens'>): ProteinKind {
  if (food.group === 'dairy') return 'dairy';
  if (food.allergens.includes('egg')) return 'egg';
  if (MEAT_IDS.has(food.id) || food.allergens.some((a) => a === 'chicken' || a === 'beef' || a === 'pork')) return 'meat';
  if (food.allergens.includes('soy') || LEGUME_IDS.has(food.id)) return 'tofu';
  return 'fish';
}

/**
 * Next week's shopping, from the guide's portions and what the family has
 * logged. Advisory: a plan to buy for, not a menu to follow.
 */
export function buildShoppingList(input: {
  /** Computed for a week from now, so a phase that opens mid-week is covered. */
  progress: WeaningProgress;
  foods: Food[];
  seed: readonly SeedFood[];
  now: Date;
}): ShoppingList | null {
  const { progress, foods, seed, now } = input;
  const { stage, mealsPerDay } = progress;
  if (stage === null) return null;

  const portions = PORTIONS[stage];
  const meals = mealsPerDay * DAYS;
  const month = addDays(now, DAYS).getMonth() + 1;
  const seedById = new Map(seed.map((s) => [s.id, s]));
  const openGroups = new Set<FoodGroup>(stage === 1 ? PHASE_GROUPS[progress.phase] : FOOD_GROUPS);
  const slotOpen: Record<Slot, boolean> = {
    grain: true,
    vegFruit: openGroups.has('vegetable'),
    protein: openGroups.has('protein'),
  };

  const line = (food: Pick<Food, 'id' | 'name'>, reason: ShoppingLine['reason'], amount: { grams?: number; eggs?: number }): ShoppingLine => {
    const buy = pickBuyHint(food.id, month);
    const grams = amount.grams !== undefined ? roundUp10(amount.grams) : undefined;
    const packs = buy.kind === 'coop' && buy.packGrams && grams ? Math.ceil(grams / buy.packGrams) : undefined;
    const seedRow = seedById.get(food.id);
    const note = seedRow?.note;
    return {
      foodId: food.id, name: food.name, reason, buy,
      ...(seedRow ? { nameJa: seedRow.nameJa } : {}),
      ...(grams !== undefined ? { grams } : {}),
      ...(amount.eggs !== undefined ? { eggs: amount.eggs } : {}),
      ...(packs !== undefined ? { packs } : {}),
      ...(note ? { note } : {}),
    };
  };

  // 1. New foods: one a day, new major allergens spaced (spec §8). No unlock
  // simulation: a rung opened by Monday's food is next week's list.
  const planned: SeedFood[] = [];
  let lastAllergenDay = -Infinity;
  for (const c of rankNextFoods({ seed, foods, progress, now })) {
    if (planned.length >= NEW_PER_WEEK[stage]) break;
    if (c.readiness !== 'now') continue;
    const slot = slotOf(c.seed.group);
    if (!slot || !slotOpen[slot]) continue;
    if (planned.filter((p) => slotOf(p.group) === slot).length >= NEW_PER_SLOT[slot]) continue;
    if (c.seed.allergens.some(isPacedAllergen)) {
      if (planned.length - lastAllergenDay < NEW_ALLERGEN_SPACING_DAYS) continue;
      lastAllergenDay = planned.length;
    }
    planned.push(c.seed);
  }

  // 2. Staples: the most-used introduced solids per slot.
  const introduced = foods
    .filter(isIntroduced)
    .filter((f) => !NON_SOLID_IDS.has(f.id) && seedById.get(f.id)?.suggest !== false)
    .sort((a, b) => b.usageCount - a.usageCount);
  const inSlot = (slot: Slot) => introduced.filter((f) => slotOf(f.group) === slot);

  const grainStaples = slotOpen.grain ? inSlot('grain').slice(0, 1) : [];
  const vegStaples = slotOpen.vegFruit ? inSlot('vegFruit').slice(0, VEG_FRUIT_STAPLES) : [];
  const kindStaples = new Map<ProteinKind, Food>();
  if (slotOpen.protein) {
    for (const f of inSlot('protein')) {
      const kind = proteinKind(f);
      if (portions[kind] === 0 && kind !== 'egg') continue;
      if (!kindStaples.has(kind) && kindStaples.size < PROTEIN_KINDS) kindStaples.set(kind, f);
    }
  }

  const sections: Record<Slot, ShoppingLine[]> = { grain: [], vegFruit: [], protein: [] };

  // Grain and vegetables: the slot's weekly total, minus first tastes, split across staples.
  // A slot with no staple gives its whole total to its new foods instead.
  for (const slot of ['grain', 'vegFruit'] as const) {
    const staples = slot === 'grain' ? grainStaples : vegStaples;
    const fresh = planned.filter((s) => slotOf(s.group) === slot);
    const total = portions[slot] * meals;
    if (staples.length === 0) {
      for (const s of fresh) sections[slot].push(line(s, 'new', { grams: total / fresh.length }));
      continue;
    }
    for (const s of fresh) sections[slot].push(line(s, 'new', { grams: FIRST_TASTE_GRAMS }));
    const left = Math.max(total - fresh.length * FIRST_TASTE_GRAMS, 0);
    for (const f of staples) sections[slot].push(line(f, 'staple', { grams: left / staples.length }));
  }

  // Protein: the week's meals split across kinds; each kind uses its own portion.
  for (const s of planned.filter((x) => slotOf(x.group) === 'protein')) {
    sections.protein.push(line(s, 'new', proteinKind(s) === 'egg' ? { eggs: 1 } : { grams: FIRST_TASTE_GRAMS }));
  }
  const kindMeals = kindStaples.size > 0 ? meals / kindStaples.size : 0;
  for (const [kind, f] of kindStaples) {
    sections.protein.push(line(f, 'staple', kind === 'egg'
      ? { eggs: Math.max(1, Math.ceil(kindMeals * portions.egg)) }
      : { grams: kindMeals * portions[kind] }));
  }

  // 3. Maintenance: an introduced allergen not eaten lately and not already on the list.
  const listed = [...sections.grain, ...sections.vegFruit, ...sections.protein];
  const covered = new Set(listed.flatMap((l) => seedById.get(l.foodId)?.allergens ?? foods.find((f) => f.id === l.foodId)?.allergens ?? []));
  for (const status of getAllergenStatus(foods, now)) {
    if (!status.needsMaintenance || covered.has(status.allergen)) continue;
    const f = introduced.find((x) => x.allergens.includes(status.allergen));
    const slot = f ? slotOf(f.group) : null;
    if (!f || !slot) continue;
    const kind = proteinKind(f);
    sections[slot].push(line(f, 'maintenance', slot === 'protein'
      ? (kind === 'egg' ? { eggs: 1 } : { grams: portions[kind] || FIRST_TASTE_GRAMS })
      : { grams: portions[slot] }));
    for (const a of f.allergens) covered.add(a);
  }

  return {
    from: addDays(now, 1),
    to: addDays(now, DAYS),
    stage,
    mealsPerDay,
    ...sections,
  };
}
