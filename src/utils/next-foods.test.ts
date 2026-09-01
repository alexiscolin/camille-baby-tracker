import { describe, it, expect } from 'vitest';
import { getIntroductionWindow, rankNextFoods, getAllergenStatus } from './next-foods';
import type { Food, SeedFood } from '../types/food';
import { Timestamp } from 'firebase/firestore';

const NOW = new Date('2026-09-01T08:00:00Z');
const ts = (iso: string) => Timestamp.fromDate(new Date(iso));

const food = (over: Partial<Food>): Food => ({
  id: 'x', name: 'X', group: 'vegetable', allergens: [], gramsPerTsp: 5,
  minStage: 1, status: 'safe', usageCount: 1, exposureCount: 3,
  reactionEventIds: [], nutrientSource: 'seed', ...over,
});

const seed = (over: Partial<SeedFood>): SeedFood => ({
  id: 's', name: 'S', group: 'vegetable', allergens: [], gramsPerTsp: 5,
  minStage: 1, sourceRef: 'ref',
  nutrients: {
    energyKcal: 30, proteinG: 1, fatG: 0, carbsG: 6, fiberG: 1, sugarsG: 2,
    ironMg: 0, calciumMg: 10, zincMg: 0, sodiumMg: 1, potassiumMg: 100,
    vitaminAUgRae: 0, vitaminCMg: 5, vitaminDUg: 0, vitaminB12Ug: 0, folateUg: 10,
  },
  ...over,
});

describe('getIntroductionWindow', () => {
  it('should be open when nothing new was introduced recently', () => {
    const foods = [food({ firstTriedAt: ts('2026-08-20T00:00:00Z') })];
    expect(getIntroductionWindow(foods, NOW)).toEqual({ open: true });
  });

  it('should be closed within three days of the last new food', () => {
    const foods = [food({ firstTriedAt: ts('2026-08-31T00:00:00Z') })];
    const result = getIntroductionWindow(foods, NOW);
    expect(result.open).toBe(false);
  });

  it('should report the date the window reopens', () => {
    const foods = [food({ firstTriedAt: ts('2026-08-31T00:00:00Z') })];
    const result = getIntroductionWindow(foods, NOW);
    if (result.open) throw new Error('expected a closed window');
    expect(result.nextDate.toISOString().slice(0, 10)).toBe('2026-09-03');
  });

  it('should be open when nothing has ever been introduced', () => {
    expect(getIntroductionWindow([], NOW)).toEqual({ open: true });
  });

  it('should be open exactly at the boundary, three days after the last new food', () => {
    // NOW is 2026-09-01T08:00:00Z; three days before that, to the second, is
    // 2026-08-29T08:00:00Z. The window uses >=, so this exact instant must
    // already be open, not still closed.
    const foods = [food({ firstTriedAt: ts('2026-08-29T08:00:00Z') })];
    expect(getIntroductionWindow(foods, NOW)).toEqual({ open: true });
  });
});

describe('rankNextFoods', () => {
  const base = { foods: [] as Food[], stage: 2 as const, now: NOW,
                 recentNutrients: null };

  it('should exclude foods above the current stage', () => {
    const result = rankNextFoods({ ...base,
      seed: [seed({ id: 'natto', minStage: 3 }), seed({ id: 'carrot', minStage: 1 })] });
    expect(result.map((c) => c.seed.id)).toEqual(['carrot']);
  });

  it('should exclude foods already in the catalog', () => {
    const result = rankNextFoods({ ...base,
      foods: [food({ id: 'carrot', exposureCount: 1 })],
      seed: [seed({ id: 'carrot' }), seed({ id: 'daikon' })] });
    expect(result.map((c) => c.seed.id)).toEqual(['daikon']);
  });

  it('should alternate groups among tied candidates instead of clustering them', () => {
    const result = rankNextFoods({ ...base, seed: [
      seed({ id: 'udon', group: 'grain', allergens: ['wheat'] }),
      seed({ id: 'somen', group: 'grain', allergens: ['wheat'] }),
      seed({ id: 'shokupan', group: 'grain', allergens: ['wheat'] }),
      seed({ id: 'egg-yolk', group: 'protein', allergens: ['egg'] }),
      seed({ id: 'whole-egg', group: 'protein', allergens: ['egg'] }),
      seed({ id: 'omelette', group: 'protein', allergens: ['egg'] }),
    ] });
    expect(result.map((c) => c.seed.group)).toEqual(
      ['grain', 'protein', 'grain', 'protein', 'grain', 'protein'],
    );
    // Order within a group is untouched: only the interleaving moved.
    expect(result.filter((c) => c.seed.group === 'grain').map((c) => c.seed.id))
      .toEqual(['udon', 'somen', 'shokupan']);
  });

  it('should keep a higher-scoring candidate ahead of a more diverse one', () => {
    const result = rankNextFoods({ ...base, seed: [
      seed({ id: 'udon', group: 'grain', allergens: ['wheat'] }),
      seed({ id: 'somen', group: 'grain', allergens: ['wheat'] }),
      seed({ id: 'daikon', group: 'vegetable' }),
    ] });
    expect(result.map((c) => c.seed.id)).toEqual(['udon', 'somen', 'daikon']);
  });

  it('should rank an un-introduced mandatory allergen first', () => {
    const result = rankNextFoods({ ...base,
      seed: [seed({ id: 'daikon' }), seed({ id: 'egg-yolk', allergens: ['egg'] })] });
    expect(result[0].seed.id).toBe('egg-yolk');
    expect(result[0].reasons.join(' ')).toMatch(/allergen/i);
  });

  it('should rank an iron-rich food up when recent iron is low', () => {
    const lowIron = { ironMg: 0.2 } as never;
    const result = rankNextFoods({ ...base, recentNutrients: lowIron,
      seed: [
        seed({ id: 'daikon' }),
        seed({ id: 'liver', group: 'protein',
               nutrients: { ...seed({}).nutrients, ironMg: 9 } }),
      ] });
    expect(result[0].seed.id).toBe('liver');
    expect(result[0].reasons.join(' ')).toMatch(/iron/i);
  });

  it('should hold back a food sharing an allergen with a suspected food', () => {
    const result = rankNextFoods({ ...base,
      foods: [food({ id: 'mango', name: 'Mango', status: 'suspected',
                     allergens: ['kiwi'] })],
      seed: [seed({ id: 'kiwi', allergens: ['kiwi'] })] });
    expect(result[0].heldBy).toEqual({ allergen: 'kiwi', foodName: 'Mango' });
  });

  it('should sort held-back candidates last but still return them', () => {
    const result = rankNextFoods({ ...base,
      foods: [food({ id: 'mango', name: 'Mango', status: 'confirmed_allergy',
                     allergens: ['kiwi'] })],
      seed: [seed({ id: 'kiwi', allergens: ['kiwi'] }), seed({ id: 'daikon' })] });
    expect(result[result.length - 1].seed.id).toBe('kiwi');
    expect(result).toHaveLength(2);
  });

  it('should score a two-mandatory-allergen food the same as a one-allergen food (max, not sum)', () => {
    const [oneAllergen] = rankNextFoods({ ...base,
      seed: [seed({ id: 'egg-yolk', allergens: ['egg'] })] });
    const [twoAllergens] = rankNextFoods({ ...base,
      seed: [seed({ id: 'egg-wheat-mix', allergens: ['egg', 'wheat'] })] });

    expect(twoAllergens.score).toBe(oneAllergen.score);
    expect(twoAllergens.reasons.join(' ')).toMatch(/2 new allergens/i);
  });
});

describe('getAllergenStatus', () => {
  it('should return one row per allergen, all 28', () => {
    expect(getAllergenStatus([], NOW)).toHaveLength(28);
  });

  it('should mark an allergen introduced when a food carrying it was tried', () => {
    const foods = [food({ allergens: ['egg'], firstTriedAt: ts('2026-08-01T00:00:00Z'),
                          lastTriedAt: ts('2026-08-30T00:00:00Z') })];
    const egg = getAllergenStatus(foods, NOW).find((a) => a.allergen === 'egg');
    expect(egg?.introduced).toBe(true);
  });

  it('should flag maintenance when an introduced allergen went 14 days unused', () => {
    const foods = [food({ allergens: ['egg'], firstTriedAt: ts('2026-08-01T00:00:00Z'),
                          lastTriedAt: ts('2026-08-10T00:00:00Z') })];
    const egg = getAllergenStatus(foods, NOW).find((a) => a.allergen === 'egg');
    expect(egg?.needsMaintenance).toBe(true);
  });

  it('should not flag maintenance for a recently eaten allergen', () => {
    const foods = [food({ allergens: ['egg'], firstTriedAt: ts('2026-08-01T00:00:00Z'),
                          lastTriedAt: ts('2026-08-30T00:00:00Z') })];
    const egg = getAllergenStatus(foods, NOW).find((a) => a.allergen === 'egg');
    expect(egg?.needsMaintenance).toBe(false);
  });

  it('should not flag maintenance for an allergen never introduced', () => {
    const egg = getAllergenStatus([], NOW).find((a) => a.allergen === 'egg');
    expect(egg?.needsMaintenance).toBe(false);
  });

  it('should not flag maintenance at exactly 14 days — the gap must be over, not at, the limit', () => {
    // NOW is 2026-09-01T08:00:00Z; 14 days before that, to the second, is
    // 2026-08-18T08:00:00Z. The check is `>`, so exactly 14 days must not
    // trip it yet.
    const foods = [food({ allergens: ['egg'], firstTriedAt: ts('2026-08-01T00:00:00Z'),
                          lastTriedAt: ts('2026-08-18T08:00:00Z') })];
    const egg = getAllergenStatus(foods, NOW).find((a) => a.allergen === 'egg');
    expect(egg?.needsMaintenance).toBe(false);
  });

  it('should flag maintenance just past the 14-day boundary', () => {
    const foods = [food({ allergens: ['egg'], firstTriedAt: ts('2026-08-01T00:00:00Z'),
                          lastTriedAt: ts('2026-08-17T08:00:00Z') })];
    const egg = getAllergenStatus(foods, NOW).find((a) => a.allergen === 'egg');
    expect(egg?.needsMaintenance).toBe(true);
  });
});
