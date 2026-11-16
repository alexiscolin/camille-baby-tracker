import { describe, it, expect } from 'vitest';
import { inferCustomFood, repairCustomFood, foldText } from './custom-food';
import type { Food } from '../types/food';

describe('foldText', () => {
  it('should fold katakana, half-width and full-width text to one form', () => {
    expect(foldText('ウドン')).toBe('うどん');
    expect(foldText('ｳﾄﾞﾝ')).toBe('うどん');
    expect(foldText('ｕｄｏｎ')).toBe('udon');
  });
});

describe('inferCustomFood', () => {
  it.each(['kitsune udon', 'udon noodles', 'Udon (frozen)', '冷凍うどん', 'ウドン', 'ｕｄｏｎ'])(
    'should count %s as a wheat grain',
    (name) => {
      const inferred = inferCustomFood(name);
      expect(inferred.group).toBe('grain');
      expect(inferred.allergens).toContain('wheat');
    },
  );

  it('should not call yakisoba buckwheat', () => {
    const inferred = inferCustomFood('焼きそば');
    expect(inferred.allergens).toContain('wheat');
    expect(inferred.allergens).not.toContain('buckwheat');
  });

  it('should prefer the longest seed name it contains', () => {
    expect(inferCustomFood('パン粉 homemade').allergens).toEqual(['wheat']);
  });

  it('should keep the allergens of every food the name contains', () => {
    expect(inferCustomFood('かぼちゃパン').allergens).toContain('wheat');
  });

  it('should not read the butter in peanut butter as milk', () => {
    expect(inferCustomFood('peanut butter').allergens).toEqual(['peanut']);
  });

  it.each(['ソーメン', 'pasta'])('should count %s as wheat', (name) => {
    expect(inferCustomFood(name).allergens).toContain('wheat');
  });

  it('should still apply allergens a word implies without a seed match', () => {
    expect(inferCustomFood('bread roll with egg').allergens).toEqual(
      expect.arrayContaining(['wheat', 'egg']),
    );
  });

  it('should leave an unknown food as other with no allergens', () => {
    expect(inferCustomFood('mystery mash')).toEqual({ group: 'other', allergens: [] });
  });
});

describe('repairCustomFood', () => {
  const custom = (overrides: Partial<Food>): Food => ({
    id: 'kitsune-udon', name: 'Kitsune udon', group: 'other', allergens: [],
    gramsPerTsp: 5, minStage: 1, status: 'untried', usageCount: 1, exposureCount: 1,
    reactionEventIds: [], nutrientSource: 'manual', ...overrides,
  });

  it('should fill in the group and allergens of a custom food saved without them', () => {
    expect(repairCustomFood(custom({}))).toMatchObject({ group: 'grain', allergens: ['wheat'] });
  });

  it('should keep allergens already on the food', () => {
    expect(repairCustomFood(custom({ allergens: ['egg'] })).allergens).toEqual(['egg', 'wheat']);
  });

  it('should leave a seed food alone', () => {
    const seedFood = custom({ nutrientSource: 'seed' });
    expect(repairCustomFood(seedFood)).toBe(seedFood);
  });
});
