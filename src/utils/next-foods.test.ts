import { describe, it, expect } from 'vitest';
import { Timestamp } from 'firebase/firestore';
import { subDays } from 'date-fns';
import { rankNextFoods, getAllergenStatus, getPace } from './next-foods';
import type { NextFoodCandidate } from './next-foods';
import type { WeaningProgress } from './weaning-progress';
import { FOOD_SEED } from '../data/food-seed';
import type { Food, SeedFood } from '../types/food';

const NOW = new Date('2026-09-15T09:00:00');
const ts = (d: Date) => Timestamp.fromDate(d);

const food = (over: Partial<Food>): Food => ({
  id: 'x', name: 'X', group: 'vegetable', allergens: [], gramsPerTsp: 5,
  minStage: 1, status: 'safe', usageCount: 1, exposureCount: 3,
  reactionEventIds: [], nutrientSource: 'seed', firstTriedAt: ts(subDays(NOW, 20)), ...over,
});

const fromSeed = (id: string, daysAgo: number, over: Partial<Food> = {}): Food => {
  const s = FOOD_SEED.find((f) => f.id === id);
  if (!s) throw new Error(id);
  return food({ id, name: s.name, group: s.group, allergens: [...s.allergens],
    minStage: s.minStage, firstTriedAt: ts(subDays(NOW, daysAgo)), ...over });
};

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

const progress = (over: Partial<WeaningProgress> = {}): WeaningProgress => ({
  ageMonths: 8, ageStage: 2, startedAt: subDays(NOW, 40), daysSinceStart: 40,
  phase: 'proteins', stage: 2, mealsPerDay: 2, eczema: false, ...over,
});

const find = (list: NextFoodCandidate[], id: string) => {
  const c = list.find((x) => x.seed.id === id);
  if (!c) throw new Error(`${id} not ranked`);
  return c;
};

describe('rankNextFoods — the guide order', () => {
  // The bug the family reported: one week in, allergens were the top picks.
  it('should suggest no allergen to a 7-month-old one week into weaning', () => {
    const foods = [fromSeed('okayu-10x', 7), fromSeed('carrot', 1)];
    const p = progress({ ageMonths: 7, stage: 1, phase: 'vegetables', daysSinceStart: 7, mealsPerDay: 1 });
    const result = rankNextFoods({ seed: FOOD_SEED, foods, progress: p, now: NOW });
    const now = result.filter((c) => c.readiness === 'now');
    expect(now.length).toBeGreaterThan(0);
    const forbidden = ['egg', 'milk', 'wheat', 'soy', 'peanut', 'walnut', 'cashew', 'almond',
      'macadamia', 'pistachio', 'shrimp', 'crab', 'buckwheat'];
    for (const c of now) {
      expect(c.seed.allergens.filter((a) => forbidden.includes(a)), c.seed.id).toEqual([]);
    }
    expect(['vegetable', 'fruit']).toContain(now[0].seed.group);
  });

  it('should offer only porridge before weaning starts', () => {
    const p = progress({ ageMonths: 6, ageStage: 1, stage: 1, phase: 'porridge', startedAt: null, daysSinceStart: null, mealsPerDay: 1 });
    const now = rankNextFoods({ seed: FOOD_SEED, foods: [], progress: p, now: NOW })
      .filter((c) => c.readiness === 'now');
    expect(now.map((c) => c.seed.id)).toEqual(['okayu-10x']);
  });

  it('should explain when vegetables and proteins open', () => {
    const p = progress({ stage: 1, phase: 'porridge', daysSinceStart: 2, mealsPerDay: 1 });
    const result = rankNextFoods({ seed: FOOD_SEED, foods: [fromSeed('okayu-10x', 2)], progress: p, now: NOW });
    expect(find(result, 'carrot').reasons[0]).toMatch(/vegetables are in/i);
    expect(find(result, 'silken-tofu').reasons[0]).toMatch(/protein foods start/i);
  });

  it('should hold egg yolk until silken tofu or white fish is in, then push it', () => {
    const base = [fromSeed('okayu-10x', 20), fromSeed('carrot', 12)];
    const p = progress({ ageMonths: 6, ageStage: 1, stage: 1, phase: 'proteins', daysSinceStart: 20, mealsPerDay: 1 });
    const before = rankNextFoods({ seed: FOOD_SEED, foods: base, progress: p, now: NOW });
    expect(find(before, 'egg-yolk')).toMatchObject({ readiness: 'later' });
    expect(find(before, 'egg-yolk').reasons[0]).toMatch(/after silken tofu or white fish/i);

    const after = rankNextFoods({ seed: FOOD_SEED, foods: [...base, fromSeed('silken-tofu', 5)], progress: p, now: NOW });
    const yolk = find(after, 'egg-yolk');
    expect(yolk.readiness).toBe('now');
    expect(yolk.reasons.join(' ')).toMatch(/not to delay/i);
    expect(after.find((c) => c.readiness === 'now')?.seed.id).toBe('egg-yolk');
  });

  it('should keep white → red → blue-backed fish in order', () => {
    const foods = [fromSeed('okayu-5x', 40), fromSeed('carrot', 35), fromSeed('silken-tofu', 30)];
    const result = rankNextFoods({ seed: FOOD_SEED, foods, progress: progress({ stage: 3, ageStage: 3, ageMonths: 9 }), now: NOW });
    expect(find(result, 'salmon-boiled').reasons[0]).toMatch(/after white fish/i);
    const withCod = rankNextFoods({ seed: FOOD_SEED, foods: [...foods, fromSeed('cod', 10)], progress: progress({ stage: 3, ageStage: 3, ageMonths: 9 }), now: NOW });
    expect(find(withCod, 'salmon-boiled').readiness).toBe('now');
    expect(find(withCod, 'aji-boiled').reasons[0]).toMatch(/after red fish/i);
  });

  it('should wait for the entry food of an allergen', () => {
    const foods = [fromSeed('okayu-5x', 40), fromSeed('carrot', 35), fromSeed('cod', 30)];
    const result = rankNextFoods({ seed: FOOD_SEED, foods, progress: progress(), now: NOW });
    expect(find(result, 'natto').reasons[0]).toMatch(/after silken tofu/i);
  });

  it('should explain a stage that is not reached yet', () => {
    const result = rankNextFoods({ seed: FOOD_SEED, foods: [fromSeed('okayu-10x', 30)], progress: progress({ stage: 1, ageStage: 1, ageMonths: 6, phase: 'proteins' }), now: NOW });
    expect(find(result, 'okayu-5x').reasons[0]).toMatch(/stage 2/i);
  });
});

describe('rankNextFoods — allergen policy', () => {
  it('should route peanut and tree nuts to the paediatrician, never to now', () => {
    const result = rankNextFoods({ seed: FOOD_SEED, foods: [], progress: progress({ stage: 4, ageStage: 4, ageMonths: 14 }), now: NOW });
    for (const id of ['peanut-paste', 'walnut-ground', 'cashew-ground', 'soba-boiled']) {
      expect(find(result, id).readiness, id).toBe('doctor');
    }
    expect(find(result, 'peanut-paste').reasons[0]).toMatch(/paediatrician/i);
  });

  it('should treat an allergen already introduced by the family as a normal food', () => {
    const foods = [fromSeed('peanut-paste', 30)];
    const result = rankNextFoods({ seed: [seed({ id: 'peanut-cookie', allergens: ['peanut'], minStage: 1 })], foods, progress: progress(), now: NOW });
    expect(result[0].readiness).not.toBe('doctor');
  });

  it('should send egg, milk and wheat to the doctor when the baby has eczema', () => {
    const foods = [fromSeed('okayu-10x', 20), fromSeed('carrot', 12), fromSeed('silken-tofu', 5)];
    const p = progress({ ageMonths: 6, ageStage: 1, stage: 1, daysSinceStart: 20, mealsPerDay: 1, eczema: true });
    const yolk = find(rankNextFoods({ seed: FOOD_SEED, foods, progress: p, now: NOW }), 'egg-yolk');
    expect(yolk.readiness).toBe('doctor');
    expect(yolk.reasons[0]).toMatch(/eczema/i);
  });

  it('should space new allergens and say from when', () => {
    const foods = [fromSeed('okayu-5x', 40), fromSeed('silken-tofu', 30), fromSeed('egg-yolk', 1)];
    const result = rankNextFoods({ seed: FOOD_SEED, foods, progress: progress(), now: NOW });
    const yoghurt = find(result, 'plain-yoghurt');
    expect(yoghurt.readiness).toBe('later');
    expect(yoghurt.reasons[0]).toMatch(/between new allergens/i);
  });

  it('should hold back a food sharing an allergen with a suspected food', () => {
    const result = rankNextFoods({ seed: [seed({ id: 'kiwi', allergens: ['kiwi'] })],
      foods: [food({ id: 'mango', name: 'Mango', status: 'suspected', allergens: ['kiwi'] })],
      progress: progress(), now: NOW });
    expect(result[0]).toMatchObject({ readiness: 'held', heldBy: { allergen: 'kiwi', foodName: 'Mango' } });
  });

  it('should ignore an allergen key retired from the labelling list', () => {
    const result = rankNextFoods({ seed: [seed({ id: 'daikon' })],
      foods: [food({ id: 'm', name: 'M', status: 'suspected', allergens: ['matsutake' as never] })],
      progress: progress(), now: NOW });
    expect(result[0].readiness).toBe('now');
  });
});

describe('rankNextFoods — ages, exclusions and order', () => {
  it('should never list unsuggested foods such as honey or water', () => {
    const ids = rankNextFoods({ seed: FOOD_SEED, foods: [], progress: progress({ stage: 4, ageStage: 4, ageMonths: 15 }), now: NOW })
      .map((c) => c.seed.id);
    expect(ids).not.toContain('honey');
    expect(ids).not.toContain('water');
  });

  it('should put squid off until after weaning', () => {
    const result = rankNextFoods({ seed: FOOD_SEED, foods: [], progress: progress({ stage: 4, ageStage: 4, ageMonths: 15 }), now: NOW });
    expect(find(result, 'squid-boiled')).toMatchObject({ readiness: 'later' });
    expect(find(result, 'squid-boiled').reasons[0]).toMatch(/not during weaning/i);
  });

  it('should exclude foods already in the catalog', () => {
    const result = rankNextFoods({ seed: [seed({ id: 'carrot' }), seed({ id: 'daikon' })],
      foods: [food({ id: 'carrot' })], progress: progress(), now: NOW });
    expect(result.map((c) => c.seed.id)).toEqual(['daikon']);
  });

  it('should order now, later, doctor, held', () => {
    const order = { now: 0, later: 1, doctor: 2, held: 3 };
    const result = rankNextFoods({ seed: FOOD_SEED, foods: [fromSeed('okayu-10x', 10)], progress: progress({ stage: 1, phase: 'vegetables' }), now: NOW });
    const ranks = result.map((c) => order[c.readiness]);
    expect([...ranks].sort((a, b) => a - b)).toEqual(ranks);
  });

  it('should not let seaweed, oils or sesame paste crowd out fish and egg', () => {
    const foods = [fromSeed('okayu-10x', 45), fromSeed('carrot', 38), fromSeed('kabocha', 35),
      fromSeed('silken-tofu', 30), fromSeed('cod', 25), fromSeed('egg-yolk', 20), fromSeed('banana', 16)];
    const top = rankNextFoods({ seed: FOOD_SEED, foods, progress: progress(), now: NOW })
      .filter((c) => c.readiness === 'now').slice(0, 5);
    for (const c of top) expect(['fat', 'other'], c.seed.id).not.toContain(c.seed.group);
  });

  it('should nudge iron-rich foods from 6 months without claiming a deficit', () => {
    const result = rankNextFoods({ seed: [
      seed({ id: 'daikon' }),
      seed({ id: 'komatsuna', nutrients: { ...seed({}).nutrients, ironMg: 2.1 } }),
    ], foods: [food({ id: 'carrot' })], progress: progress(), now: NOW });
    expect(result[0].seed.id).toBe('komatsuna');
    expect(result[0].reasons.join(' ')).toMatch(/rich in iron/i);
    expect(result[0].reasons.join(' ')).not.toMatch(/running low/i);
  });

  it('should alternate groups among tied candidates', () => {
    const result = rankNextFoods({ seed: [
      seed({ id: 'a1', group: 'vegetable' }), seed({ id: 'a2', group: 'vegetable' }),
      seed({ id: 'b1', group: 'fruit' }), seed({ id: 'b2', group: 'fruit' }),
    ], foods: [food({ id: 'v', group: 'vegetable' }), food({ id: 'f', group: 'fruit' })], progress: progress(), now: NOW });
    expect(result.map((c) => c.seed.group)).toEqual(['vegetable', 'fruit', 'vegetable', 'fruit']);
  });

  it('should carry the seed note', () => {
    const result = rankNextFoods({ seed: FOOD_SEED, foods: [fromSeed('okayu-10x', 10)], progress: progress({ stage: 1, phase: 'vegetables' }), now: NOW });
    expect(find(result, 'apple').seed.note).toMatch(/cook/i);
  });
});

describe('getPace', () => {
  it('should not pace fruit on the recommended labelling list', () => {
    const pace = getPace([food({ name: 'Banana', allergens: ['banana'], firstTriedAt: ts(NOW) })], NOW);
    expect(pace.allergensOpenFrom).toBeNull();
  });

  it('should report a food first tried today', () => {
    const pace = getPace([food({ name: 'Carrot', firstTriedAt: ts(NOW) })], NOW);
    expect(pace.newToday?.name).toBe('Carrot');
  });

  it('should open the next allergen three calendar days after the last', () => {
    const pace = getPace([food({ name: 'Egg yolk', allergens: ['egg'], firstTriedAt: ts(new Date('2026-09-14T18:00:00')) })], NOW);
    expect(pace.lastAllergen?.name).toBe('Egg yolk');
    expect(pace.allergensOpenFrom?.toDateString()).toBe(new Date('2026-09-17T00:00:00').toDateString());
  });

  it('should leave allergens open when the last one is old enough', () => {
    const pace = getPace([food({ allergens: ['egg'], firstTriedAt: ts(subDays(NOW, 3)) })], NOW);
    expect(pace.allergensOpenFrom).toBeNull();
  });

  it('should count an allergen as new only on its first food', () => {
    const pace = getPace([
      food({ id: 'y', allergens: ['egg'], firstTriedAt: ts(subDays(NOW, 10)) }),
      food({ id: 'w', allergens: ['egg'], firstTriedAt: ts(subDays(NOW, 1)) }),
    ], NOW);
    expect(pace.allergensOpenFrom).toBeNull();
  });
});

describe('getAllergenStatus', () => {
  it('should return one row per allergen, all 29', () => {
    expect(getAllergenStatus([], NOW)).toHaveLength(29);
  });

  it('should flag maintenance just past 7 days, not at 7', () => {
    const at = (d: Date) => [food({ allergens: ['egg'], firstTriedAt: ts(subDays(NOW, 30)), lastTriedAt: ts(d) })];
    const egg = (d: Date) => getAllergenStatus(at(d), NOW).find((a) => a.allergen === 'egg');
    expect(egg(subDays(NOW, 7))?.needsMaintenance).toBe(false);
    expect(egg(new Date(subDays(NOW, 7).getTime() - 1000))?.needsMaintenance).toBe(true);
  });

  it('should not flag maintenance for an allergen never introduced', () => {
    expect(getAllergenStatus([], NOW).find((a) => a.allergen === 'egg')?.needsMaintenance).toBe(false);
  });
});
