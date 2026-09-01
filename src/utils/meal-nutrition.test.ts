import { describe, it, expect } from 'vitest';
import { toGrams, mealNutrients } from './meal-nutrition';
import type { Food, MealItem, Nutrients } from '../types/food';

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
