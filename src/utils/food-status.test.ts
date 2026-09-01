import { describe, it, expect } from 'vitest';
import { Timestamp } from 'firebase/firestore';
import { deriveStatus, novelFoodIds, applyReaction, withdrawReaction, statusLabel, isManualStatus } from './food-status';
import type { Food, FoodStatus, MealEvent, MealItem } from '../types/food';

const food = (
  status: FoodStatus,
  exposures: number,
  reactions: string[] = [],
): Pick<Food, 'status' | 'exposureCount' | 'reactionEventIds'> => ({
  status,
  exposureCount: exposures,
  reactionEventIds: reactions,
});

/** A full Food record for applyReaction tests, with sensible defaults. */
const makeFood = (id: string, overrides: Partial<Food> = {}): Food => ({
  id,
  name: id,
  group: 'other',
  allergens: [],
  gramsPerTsp: 5,
  minStage: 1,
  status: 'untried',
  usageCount: 1,
  exposureCount: 1,
  reactionEventIds: [],
  nutrientSource: 'seed',
  ...overrides,
});

const mealItem = (foodId: string, firstTry = false): MealItem => ({
  foodId,
  name: foodId,
  quantity: 1,
  unit: 'tsp',
  firstTry,
});

const makeMeal = (overrides: Partial<MealEvent> = {}): MealEvent => ({
  id: 'meal-1',
  babyId: 'baby-1',
  type: 'meal',
  timestamp: Timestamp.fromDate(new Date('2026-01-01')),
  createdBy: 'user-1',
  createdAt: Timestamp.fromDate(new Date('2026-01-01')),
  mealSlot: 'lunch',
  items: [],
  ...overrides,
});

describe('deriveStatus', () => {
  it('should keep a food untried below three clean exposures', () => {
    expect(deriveStatus(food('untried', 0), 0)).toBe('untried');
    expect(deriveStatus(food('untried', 2), 2)).toBe('untried');
  });

  it('should promote to safe after three clean exposures', () => {
    expect(deriveStatus(food('untried', 3), 3)).toBe('safe');
  });

  it('should keep a suspected food suspected with no clean re-exposure', () => {
    expect(deriveStatus(food('suspected', 4, ['e1']), 0)).toBe('suspected');
  });

  it('should move suspected to watch after one clean re-exposure', () => {
    expect(deriveStatus(food('suspected', 5, ['e1']), 1)).toBe('watch');
  });

  it('should move watch back to safe after three clean re-exposures', () => {
    expect(deriveStatus(food('suspected', 7, ['e1']), 3)).toBe('safe');
  });

  it('should never derive a manual status away', () => {
    expect(deriveStatus(food('confirmed_allergy', 9), 9)).toBe('confirmed_allergy');
    expect(deriveStatus(food('avoid', 9), 9)).toBe('avoid');
  });
});

describe('novelFoodIds', () => {
  it('should return only the items flagged as a first try', () => {
    const items = [
      { foodId: 'a', name: 'A', quantity: 1, unit: 'tsp', firstTry: true },
      { foodId: 'b', name: 'B', quantity: 1, unit: 'tsp', firstTry: false },
      { foodId: 'c', name: 'C', quantity: 1, unit: 'tsp' },
    ] as MealItem[];
    expect(novelFoodIds(items)).toEqual(['a']);
  });

  it('should fall back to every item when nothing is flagged novel', () => {
    const items = [
      { foodId: 'a', name: 'A', quantity: 1, unit: 'tsp' },
      { foodId: 'b', name: 'B', quantity: 1, unit: 'tsp' },
    ] as MealItem[];
    expect(novelFoodIds(items)).toEqual(['a', 'b']);
  });
});

describe('applyReaction', () => {
  it('should mark every novel food in the meal suspected, not just one', () => {
    const foods = [makeFood('a'), makeFood('b'), makeFood('c'), makeFood('d')];
    const meal = makeMeal({
      items: [mealItem('a', true), mealItem('b', true), mealItem('c', true), mealItem('d', false)],
    });

    const result = applyReaction(foods, meal, 'meal-1');

    expect(result.find((f) => f.id === 'a')?.status).toBe('suspected');
    expect(result.find((f) => f.id === 'b')?.status).toBe('suspected');
    expect(result.find((f) => f.id === 'c')?.status).toBe('suspected');
    expect(result.find((f) => f.id === 'a')?.reactionEventIds).toEqual(['meal-1']);
    expect(result.find((f) => f.id === 'b')?.reactionEventIds).toEqual(['meal-1']);
    expect(result.find((f) => f.id === 'c')?.reactionEventIds).toEqual(['meal-1']);
    // 'd' was not flagged as a first try, so it is not a suspect here.
    expect(result.find((f) => f.id === 'd')?.status).toBe('untried');
    expect(result.find((f) => f.id === 'd')?.reactionEventIds).toEqual([]);
  });

  it('should leave a manual status untouched even when the food is in the suspected set', () => {
    const foods = [
      makeFood('a', { status: 'confirmed_allergy' }),
      makeFood('b', { status: 'avoid' }),
    ];
    const meal = makeMeal({ items: [mealItem('a', true), mealItem('b', true)] });

    const result = applyReaction(foods, meal, 'meal-1');

    expect(result.find((f) => f.id === 'a')?.status).toBe('confirmed_allergy');
    expect(result.find((f) => f.id === 'a')?.reactionEventIds).toEqual([]);
    expect(result.find((f) => f.id === 'b')?.status).toBe('avoid');
    expect(result.find((f) => f.id === 'b')?.reactionEventIds).toEqual([]);
  });

  it('should not append the same mealId twice when applied twice', () => {
    const foods = [makeFood('a')];
    const meal = makeMeal({ items: [mealItem('a', true)] });

    const once = applyReaction(foods, meal, 'meal-1');
    const twice = applyReaction(once, meal, 'meal-1');

    expect(twice.find((f) => f.id === 'a')?.reactionEventIds).toEqual(['meal-1']);
  });

  it('should honour an explicit suspectedFoodIds list over the novelFoodIds fallback', () => {
    const foods = [makeFood('a'), makeFood('b')];
    const meal = makeMeal({
      items: [mealItem('a', true), mealItem('b', true)],
      reaction: { symptoms: ['rash_local'], severity: 'mild', suspectedFoodIds: ['b'] },
    });

    const result = applyReaction(foods, meal, 'meal-1');

    expect(result.find((f) => f.id === 'a')?.status).toBe('untried');
    expect(result.find((f) => f.id === 'a')?.reactionEventIds).toEqual([]);
    expect(result.find((f) => f.id === 'b')?.status).toBe('suspected');
    expect(result.find((f) => f.id === 'b')?.reactionEventIds).toEqual(['meal-1']);
  });
});

describe('statusLabel', () => {
  it('should never say the word safe', () => {
    expect(statusLabel({ status: 'safe', exposureCount: 5 })).toBe('No reaction ×5');
  });

  it('should label the other statuses', () => {
    expect(statusLabel({ status: 'untried', exposureCount: 0 })).toBe('Not introduced');
    expect(statusLabel({ status: 'watch', exposureCount: 4 })).toBe('Watch');
    expect(statusLabel({ status: 'suspected', exposureCount: 2 })).toBe('Suspected');
    expect(statusLabel({ status: 'confirmed_allergy', exposureCount: 1 })).toBe('Allergy');
    expect(statusLabel({ status: 'avoid', exposureCount: 0 })).toBe('Avoid');
  });
});

describe('isManualStatus', () => {
  it('should treat allergy and avoid as human-set only', () => {
    expect(isManualStatus('confirmed_allergy')).toBe(true);
    expect(isManualStatus('avoid')).toBe(true);
    expect(isManualStatus('safe')).toBe(false);
  });
});

describe('withdrawReaction', () => {
  it('should clear a food suspected only by this meal', () => {
    const foods = [makeFood('natto', { status: 'suspected', reactionEventIds: ['meal-1'] })];
    const [natto] = withdrawReaction(foods, 'meal-1');
    expect(natto.reactionEventIds).toEqual([]);
    expect(natto.status).toBe('untried');
  });

  it('should keep a food suspected by another meal', () => {
    const foods = [
      makeFood('natto', { status: 'suspected', reactionEventIds: ['meal-1', 'meal-2'] }),
    ];
    const [natto] = withdrawReaction(foods, 'meal-1');
    expect(natto.reactionEventIds).toEqual(['meal-2']);
    expect(natto.status).toBe('suspected');
  });

  it('should restore safe when the food has enough clean exposures', () => {
    const foods = [
      makeFood('rice', { status: 'suspected', exposureCount: 4, reactionEventIds: ['meal-1'] }),
    ];
    expect(withdrawReaction(foods, 'meal-1')[0].status).toBe('safe');
  });

  it('should never undo a human-set allergy', () => {
    const foods = [
      makeFood('egg', { status: 'confirmed_allergy', reactionEventIds: ['meal-1'] }),
    ];
    const [egg] = withdrawReaction(foods, 'meal-1');
    expect(egg).toBe(foods[0]);
    expect(egg.status).toBe('confirmed_allergy');
  });

  it('should leave foods this meal never touched identical', () => {
    const foods = [makeFood('kabocha', { reactionEventIds: ['meal-9'] })];
    expect(withdrawReaction(foods, 'meal-1')[0]).toBe(foods[0]);
  });
});
