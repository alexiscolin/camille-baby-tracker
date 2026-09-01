import { describe, it, expect } from 'vitest';
import { slugify, foodFromSeed, isValidFoodData } from './food-catalog';
import type { SeedFood } from '../types/food';

const seed: SeedFood = {
  id: 'kabocha',
  name: 'Kabocha squash',
  group: 'vegetable',
  allergens: [],
  gramsPerTsp: 5,
  minStage: 1,
  sourceRef: 'pumpkin, western, boiled',
  nutrients: {
    energyKcal: 60, proteinG: 1.6, fatG: 0.3, carbsG: 12.2, fiberG: 3.6,
    sugarsG: 4.1, ironMg: 0.5, calciumMg: 14, zincMg: 0.3, sodiumMg: 1,
    potassiumMg: 430, vitaminAUgRae: 330, vitaminCMg: 32, vitaminDUg: 0,
    vitaminB12Ug: 0, folateUg: 38,
  },
};

describe('slugify', () => {
  it('should lowercase and hyphenate', () => {
    expect(slugify('Kabocha Squash')).toBe('kabocha-squash');
  });

  it('should strip punctuation and collapse separators', () => {
    expect(slugify('Okayu (10:1)  rice')).toBe('okayu-10-1-rice');
  });

  it('should trim leading and trailing hyphens', () => {
    expect(slugify('  --Tofu--  ')).toBe('tofu');
  });

  it('should keep non-latin names usable by falling back to a stable hash', () => {
    const slug = slugify('しらす');
    expect(slug).not.toBe('');
    expect(slug).toMatch(/^[a-z0-9-]+$/);
    expect(slugify('しらす')).toBe(slug);
  });
});

describe('foodFromSeed', () => {
  it('should carry the seed data across', () => {
    const food = foodFromSeed(seed);
    expect(food.id).toBe('kabocha');
    expect(food.name).toBe('Kabocha squash');
    expect(food.group).toBe('vegetable');
    expect(food.minStage).toBe(1);
    expect(food.nutrients).toEqual(seed.nutrients);
    expect(food.sourceRef).toBe(seed.sourceRef);
  });

  it('should start untried with no exposures', () => {
    const food = foodFromSeed(seed);
    expect(food.status).toBe('untried');
    expect(food.usageCount).toBe(0);
    expect(food.exposureCount).toBe(0);
    expect(food.reactionEventIds).toEqual([]);
  });

  it('should mark the nutrient source as seed', () => {
    expect(foodFromSeed(seed).nutrientSource).toBe('seed');
  });
});

describe('isValidFoodData', () => {
  const valid = {
    name: 'Tofu', group: 'protein', allergens: ['soy'], gramsPerTsp: 5,
    minStage: 2, status: 'untried', usageCount: 0, exposureCount: 0,
    reactionEventIds: [], nutrientSource: 'seed',
  };

  it('should accept a well-formed document', () => {
    expect(isValidFoodData(valid)).toBe(true);
  });

  it('should reject a missing name', () => {
    expect(isValidFoodData({ ...valid, name: '' })).toBe(false);
  });

  it('should reject an unknown group', () => {
    expect(isValidFoodData({ ...valid, group: 'candy' })).toBe(false);
  });

  it('should reject an unknown status', () => {
    expect(isValidFoodData({ ...valid, status: 'delicious' })).toBe(false);
  });

  it('should reject an out-of-range stage', () => {
    expect(isValidFoodData({ ...valid, minStage: 9 })).toBe(false);
  });

  it('should reject an unknown nutrient source', () => {
    expect(isValidFoodData({ ...valid, nutrientSource: 'ai' })).toBe(false);
  });

  it('should reject non-array allergens', () => {
    expect(isValidFoodData({ ...valid, allergens: 'soy' })).toBe(false);
  });
});
