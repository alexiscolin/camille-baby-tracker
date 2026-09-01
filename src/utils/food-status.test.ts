import { describe, it, expect } from 'vitest';
import { deriveStatus, novelFoodIds, statusLabel, isManualStatus } from './food-status';
import type { MealItem } from '../types/food';

const food = (status: string, exposures: number, reactions: string[] = []) =>
  ({ status, exposureCount: exposures, reactionEventIds: reactions }) as never;

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
