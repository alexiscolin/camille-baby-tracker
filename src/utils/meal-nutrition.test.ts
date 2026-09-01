import { describe, it, expect } from 'vitest';
import { Timestamp } from 'firebase/firestore';
import { toGrams, mealNutrients, markFirstTry, buildReactionPayload } from './meal-nutrition';
import type { Food, MealItem, Nutrients, Reaction } from '../types/food';

const zero = (): Nutrients => ({
  energyKcal: 0, proteinG: 0, fatG: 0, carbsG: 0, fiberG: 0, sugarsG: 0,
  ironMg: 0, calciumMg: 0, zincMg: 0, sodiumMg: 0, potassiumMg: 0,
  vitaminAUgRae: 0, vitaminCMg: 0, vitaminDUg: 0, vitaminB12Ug: 0, folateUg: 0,
});

const kabocha = {
  id: 'kabocha', gramsPerTsp: 5,
  nutrients: { ...zero(), energyKcal: 60, proteinG: 1.6, ironMg: 0.5 },
} as Food;

const item = (over: Partial<MealItem>): MealItem =>
  ({ foodId: 'kabocha', name: 'Kabocha', quantity: 1, unit: 'tsp', ...over });

describe('toGrams', () => {
  it('should convert tsp using the food gramsPerTsp', () => {
    expect(toGrams(item({ quantity: 3, unit: 'tsp' }), kabocha)).toBe(15);
  });

  it('should default to 5 g per tsp when the food is unknown', () => {
    expect(toGrams(item({ quantity: 2, unit: 'tsp' }), undefined)).toBe(10);
  });

  it('should pass grams through unchanged', () => {
    expect(toGrams(item({ quantity: 30, unit: 'g' }), kabocha)).toBe(30);
  });

  it('should treat millilitres as grams', () => {
    expect(toGrams(item({ quantity: 50, unit: 'ml' }), kabocha)).toBe(50);
  });

  it('should treat a piece as 30 g by default', () => {
    expect(toGrams(item({ quantity: 2, unit: 'piece' }), kabocha)).toBe(60);
  });
});

describe('mealNutrients', () => {
  const byId = new Map([['kabocha', kabocha]]);

  it('should scale nutrients from per-100 g to the eaten amount', () => {
    const result = mealNutrients([item({ quantity: 4, unit: 'tsp' })], byId);
    // 4 tsp = 20 g = 0.2 x per-100g values
    expect(result.energyKcal).toBeCloseTo(12, 5);
    expect(result.proteinG).toBeCloseTo(0.32, 5);
    expect(result.ironMg).toBeCloseTo(0.1, 5);
  });

  it('should sum across several items', () => {
    const result = mealNutrients(
      [item({ quantity: 2, unit: 'tsp' }), item({ quantity: 2, unit: 'tsp' })],
      byId,
    );
    expect(result.energyKcal).toBeCloseTo(12, 5);
  });

  it('should skip items whose food has no nutrients', () => {
    const result = mealNutrients([item({ foodId: 'unknown' })], new Map());
    expect(result.energyKcal).toBe(0);
  });

  it('should return an all-zero object for an empty meal', () => {
    expect(mealNutrients([], byId)).toEqual(zero());
  });
});

describe('markFirstTry', () => {
  const tried = { id: 'kabocha', firstTriedAt: Timestamp.now() } as Food;
  const untried = { id: 'natto' } as Food;

  it('should not flag a food that has been tried before', () => {
    const byId = new Map([['kabocha', tried]]);
    expect(markFirstTry([item({ foodId: 'kabocha' })], byId)[0].firstTry).toBe(false);
  });

  it('should flag a food in the catalog that has never been tried', () => {
    const byId = new Map([['natto', untried]]);
    expect(markFirstTry([item({ foodId: 'natto' })], byId)[0].firstTry).toBe(true);
  });

  it('should flag a food that is not in the catalog at all', () => {
    expect(markFirstTry([item({ foodId: 'shirasu' })], new Map())[0].firstTry).toBe(true);
  });

  it('should keep every other field of the item', () => {
    const byId = new Map([['kabocha', tried]]);
    const [result] = markFirstTry([item({ quantity: 3, unit: 'g', acceptance: 'half' })], byId);
    expect(result).toMatchObject({ foodId: 'kabocha', quantity: 3, unit: 'g', acceptance: 'half' });
  });
});

describe('buildReactionPayload', () => {
  const reaction = (suspected: string[]): Reaction => ({
    symptoms: ['hives'],
    severity: 'mild',
    suspectedFoodIds: suspected,
  });
  const meal: MealItem[] = [
    item({ foodId: 'natto', firstTry: true }),
    item({ foodId: 'egg', firstTry: true }),
    item({ foodId: 'rice' }),
  ];

  it('should fall back to every novel food when the UI sent nothing', () => {
    expect(buildReactionPayload(reaction([]), meal).suspectedFoodIds)
      .toEqual(['natto', 'egg']);
  });

  it('should keep a novel food the UI left out', () => {
    // The one way attribution can be defeated from outside: a caller naming a
    // single culprit. The floor must survive it.
    expect(buildReactionPayload(reaction(['natto']), meal).suspectedFoodIds)
      .toEqual(expect.arrayContaining(['natto', 'egg']));
  });

  it('should keep a food the user widened onto', () => {
    expect(buildReactionPayload(reaction(['rice']), meal).suspectedFoodIds.sort())
      .toEqual(['egg', 'natto', 'rice']);
  });

  it('should drop a food that is no longer in the meal but keep the floor', () => {
    const result = buildReactionPayload(reaction(['kabocha', 'rice']), meal);
    expect(result.suspectedFoodIds).not.toContain('kabocha');
    expect(result.suspectedFoodIds.sort()).toEqual(['egg', 'natto', 'rice']);
  });

  it('should suspect every item when no food in the meal is novel', () => {
    const familiar = [item({ foodId: 'rice' }), item({ foodId: 'carrot' })];
    expect(buildReactionPayload(reaction([]), familiar).suspectedFoodIds.sort())
      .toEqual(['carrot', 'rice']);
  });

  it('should omit optional keys that are unset', () => {
    const result = buildReactionPayload(reaction([]), meal);
    expect(Object.keys(result).sort())
      .toEqual(['severity', 'suspectedFoodIds', 'symptoms']);
  });
});
