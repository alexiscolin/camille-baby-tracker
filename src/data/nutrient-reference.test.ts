import { describe, it, expect } from 'vitest';
import { ASSUMED_MILK_ML, referenceFor } from './nutrient-reference';
import { NUTRIENT_KEYS } from '../types/food';
import type { NutrientKey } from '../types/food';

const keyed = (ageMonths: number, sex: 'male' | 'female' = 'female') =>
  Object.fromEntries(referenceFor(ageMonths, sex).map((r) => [r.key, r])) as
    Record<NutrientKey, ReturnType<typeof referenceFor>[number]>;

describe('referenceFor', () => {
  it('should have no opinion before weaning food is meant to feed anyone', () => {
    expect(referenceFor(4, 'female')).toEqual([]);
    expect(referenceFor(5, 'female')).toEqual([]);
    expect(referenceFor(6, 'female').length).toBeGreaterThan(0);
  });

  it('should cover every nutrient the grid draws, at every age', () => {
    for (const age of [6, 8, 9, 11, 12, 17]) {
      const keys = referenceFor(age, 'male').map((r) => r.key);
      expect(new Set(keys), `age ${age}`).toEqual(new Set(NUTRIENT_KEYS));
      expect(keys.length, `age ${age}`).toBe(NUTRIENT_KEYS.length);
    }
  });

  it('should give iron the 2025 figure, which no longer splits by sex', () => {
    expect(keyed(8, 'male').ironMg.amount).toBe(4.5);
    expect(keyed(8, 'female').ironMg.amount).toBe(4.5);
    expect(keyed(11, 'female').ironMg.amount).toBe(4.5);
  });

  it('should never put a ceiling on iron, which the 2025 edition withdrew', () => {
    for (const age of [6, 9, 12]) {
      expect(keyed(age).ironMg.ceiling, `age ${age}`).toBeUndefined();
    }
  });

  it('should split energy by sex and by the two infant bands', () => {
    expect(keyed(7, 'male').energyKcal.amount).toBe(650);
    expect(keyed(7, 'female').energyKcal.amount).toBe(600);
    expect(keyed(10, 'male').energyKcal.amount).toBe(700);
    expect(keyed(10, 'female').energyKcal.amount).toBe(650);
  });

  it('should raise protein between the two infant bands', () => {
    expect(keyed(7).proteinG.amount).toBe(15);
    expect(keyed(10).proteinG.amount).toBe(25);
  });

  it('should not grade sodium while the guide only gives an adequacy figure', () => {
    expect(keyed(7).sodiumMg.kind).toBe('context');
    expect(keyed(10).sodiumMg.kind).toBe('context');
  });

  it('should turn salt into a ceiling once the guide sets one, and split it by sex', () => {
    const boy = keyed(14, 'male').sodiumMg;
    const girl = keyed(14, 'female').sodiumMg;
    expect(boy.kind).toBe('limit');
    // 3.0 g and 2.5 g of salt, as sodium.
    expect(boy.amount).toBeCloseTo(1181, 0);
    expect(girl.amount).toBeCloseTo(984, 0);
  });

  it('should carry the vitamin A ceiling at every age, because liver can pass it in grams', () => {
    for (const age of [6, 9, 12]) {
      expect(keyed(age).vitaminAUgRae.ceiling, `age ${age}`).toBe(600);
    }
  });

  it('should not invent a folate ceiling before the guide sets one', () => {
    expect(keyed(8).folateUg.ceiling).toBeUndefined();
    expect(keyed(14).folateUg.ceiling).toBe(200);
  });

  it('should leave the macronutrients with no published infant figure ungraded', () => {
    for (const key of ['fatG', 'carbsG', 'fiberG', 'sugarsG'] as const) {
      expect(keyed(8)[key].kind, key).toBe('context');
    }
  });

  it('should never publish a target of zero, which would grade every day as met', () => {
    for (const age of [6, 9, 12]) {
      for (const row of referenceFor(age, 'male')) {
        if (row.kind === 'context') continue;
        expect(row.amount, `${row.key} at ${age}`).toBeGreaterThan(0);
      }
    }
  });
});

describe('ASSUMED_MILK_ML', () => {
  it('should follow the volumes each band was actually derived from', () => {
    expect(ASSUMED_MILK_ML(7)).toBe(600);
    expect(ASSUMED_MILK_ML(10)).toBe(450);
  });
});
