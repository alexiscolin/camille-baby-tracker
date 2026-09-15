import { describe, it, expect } from 'vitest';
import { Timestamp } from 'firebase/firestore';
import { subDays } from 'date-fns';
import { buildShoppingList } from './shopping-list';
import { isPacedAllergen } from './next-foods';
import type { WeaningProgress } from './weaning-progress';
import { FOOD_SEED } from '../data/food-seed';
import type { Food } from '../types/food';

const NOW = new Date('2026-09-15T09:00:00');
const fromSeed = (id: string, daysAgo: number, over: Partial<Food> = {}): Food => {
  const s = FOOD_SEED.find((f) => f.id === id);
  if (!s) throw new Error(id);
  return { id, name: s.name, group: s.group, allergens: [...s.allergens], gramsPerTsp: 5,
    minStage: s.minStage, status: 'untried', usageCount: 5, exposureCount: 5, reactionEventIds: [],
    nutrientSource: 'seed', firstTriedAt: Timestamp.fromDate(subDays(NOW, daysAgo)),
    lastTriedAt: Timestamp.fromDate(subDays(NOW, 1)), ...over };
};
const progress = (over: Partial<WeaningProgress> = {}): WeaningProgress => ({
  ageMonths: 8, ageStage: 2, startedAt: subDays(NOW, 40), daysSinceStart: 47,
  phase: 'proteins', stage: 2, mealsPerDay: 2, eczema: false, ...over,
});
const build = (p: WeaningProgress, foods: Food[], now = NOW) =>
  buildShoppingList({ progress: p, foods, seed: FOOD_SEED, now });

describe('buildShoppingList', () => {
  it('should return nothing before 5 months', () => {
    expect(build(progress({ stage: null, ageStage: null, ageMonths: 4 }), [])).toBeNull();
  });

  it('should list only porridge for a baby about to start', () => {
    const list = build(progress({ ageMonths: 6, ageStage: 1, stage: 1, phase: 'porridge', startedAt: null, daysSinceStart: null, mealsPerDay: 1 }), []);
    expect(list?.vegFruit).toEqual([]);
    expect(list?.protein).toEqual([]);
    expect(list?.grain.map((l) => l.foodId)).toEqual(['okayu-10x']);
    expect(list?.grain[0]).toMatchObject({ reason: 'new', grams: 210, packs: 1 });
    expect(list?.grain[0].buy).toMatchObject({ kind: 'coop' });
    expect(list?.grain[0].nameJa).toBe('10倍がゆ');
  });

  it('should size a stage-2 staple grain from the guide portion', () => {
    const foods = [fromSeed('okayu-5x', 40), fromSeed('carrot', 30), fromSeed('silken-tofu', 20)];
    const list = build(progress(), foods);
    // Guide p.34: 全がゆ up to 80 g × 2 meals × 7 days, less 15 g per new grain tasted this week.
    const newGrains = list?.grain.filter((l) => l.reason === 'new').length ?? 0;
    expect(list?.grain.find((l) => l.reason === 'staple')).toMatchObject({
      foodId: 'okayu-5x', grams: Math.ceil((80 * 14 - 15 * newGrains) / 10) * 10,
    });
  });

  it('should split protein meals across kinds, never summing portions', () => {
    const foods = [fromSeed('okayu-5x', 40), fromSeed('carrot', 30), fromSeed('silken-tofu', 20), fromSeed('cod', 15)];
    const list = build(progress(), foods);
    const staples = list?.protein.filter((l) => l.reason === 'staple') ?? [];
    expect(staples.find((l) => l.foodId === 'silken-tofu')?.grams).toBe(280); // 7 meals × 40 g
    expect(staples.find((l) => l.foodId === 'cod')?.grams).toBe(110);         // 7 meals × 15 g, rounded up
  });

  it('should plan at most one new food a day and space new allergens', () => {
    const foods = [fromSeed('okayu-5x', 40), fromSeed('carrot', 30), fromSeed('silken-tofu', 20), fromSeed('cod', 15)];
    const list = build(progress(), foods);
    const fresh = [...(list?.grain ?? []), ...(list?.vegFruit ?? []), ...(list?.protein ?? [])].filter((l) => l.reason === 'new');
    expect(fresh.length).toBeLessThanOrEqual(7);
    const withAllergen = fresh.filter((l) => FOOD_SEED.find((s) => s.id === l.foodId)?.allergens.some(isPacedAllergen));
    expect(withAllergen.length).toBeLessThanOrEqual(3);
  });

  it('should add a portion for an allergen not eaten this week', () => {
    // Stage 1: no other egg food is suggested yet, so nothing else keeps egg up.
    const foods = [fromSeed('okayu-10x', 28), fromSeed('carrot', 20),
      fromSeed('silken-tofu', 18, { usageCount: 9 }), fromSeed('cod', 16, { usageCount: 9 }),
      fromSeed('chicken-sasami-boiled', 14, { usageCount: 9 }),
      fromSeed('egg-yolk', 12, { lastTriedAt: Timestamp.fromDate(subDays(NOW, 10)), usageCount: 1 })];
    const list = build(progress({ stage: 1, ageStage: 1, ageMonths: 6, mealsPerDay: 1, daysSinceStart: 28 }), foods);
    expect(list?.protein.find((l) => l.foodId === 'egg-yolk')).toMatchObject({ reason: 'maintenance', eggs: 1 });
  });

  it('should not add a keep-up line for an allergen already on the list', () => {
    const lapsed = { lastTriedAt: Timestamp.fromDate(subDays(NOW, 10)), usageCount: 9 };
    const foods = [fromSeed('okayu-5x', 40), fromSeed('carrot', 35), fromSeed('silken-tofu', 30, lapsed)];
    const tofu = build(progress(), foods)?.protein.filter((l) => l.foodId === 'silken-tofu') ?? [];
    expect(tofu.map((l) => l.reason)).toEqual(['staple']);
  });

  it('should spread the week\'s new foods across grain, vegetables and protein', () => {
    const foods = [fromSeed('okayu-5x', 40), fromSeed('silken-tofu', 30), fromSeed('cod', 20)];
    const list = build(progress(), foods);
    expect(list?.vegFruit.filter((l) => l.reason === 'new').length).toBeLessThanOrEqual(3);
    expect(list?.protein.filter((l) => l.reason === 'new').length).toBeLessThanOrEqual(3);
  });

  it('should buy the island carrot in November and the frozen purée in September', () => {
    const foods = [fromSeed('okayu-5x', 40), fromSeed('carrot', 30, { usageCount: 20 })];
    const sept = build(progress(), foods)?.vegFruit.find((l) => l.foodId === 'carrot');
    const nov = build(progress(), foods, new Date('2026-11-10T09:00:00'))?.vegFruit.find((l) => l.foodId === 'carrot');
    expect(sept?.buy).toMatchObject({ kind: 'coop' });
    expect(nov?.buy).toMatchObject({ kind: 'local', name: '島にんじん' });
  });

  it('should carry the preparation note', () => {
    const foods = [fromSeed('okayu-5x', 40), fromSeed('shirasu', 30), fromSeed('carrot', 30)];
    expect(build(progress(), foods)?.protein.find((l) => l.foodId === 'shirasu')?.note).toMatch(/desalt/i);
  });
});
