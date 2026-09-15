import { describe, it, expect } from 'vitest';
import { Timestamp } from 'firebase/firestore';
import { addDays, subDays, subMonths } from 'date-fns';
import { getWeaningProgress, deriveWeaningStart } from './weaning-progress';
import type { Food, FoodGroup } from '../types/food';

const NOW = new Date('2026-09-15T09:00:00');

const tried = (id: string, group: FoodGroup, daysAgo: number, exposureCount = 3): Food => ({
  id, name: id, group, allergens: [], gramsPerTsp: 5, minStage: 1, status: 'untried',
  usageCount: 1, exposureCount, reactionEventIds: [], nutrientSource: 'seed',
  firstTriedAt: Timestamp.fromDate(subDays(NOW, daysAgo)),
});

const progress = (
  months: number,
  foods: Food[],
  extra: { weaningStartedAt?: Date; eczema?: boolean } = {},
) => getWeaningProgress({ birthDate: subMonths(NOW, months), foods, now: NOW, ...extra });

describe('deriveWeaningStart', () => {
  it('should ignore drinks such as formula and water', () => {
    const foods = [tried('formula-prepared', 'dairy', 60), tried('water', 'other', 50), tried('okayu-10x', 'grain', 5)];
    expect(deriveWeaningStart(foods)?.toDateString()).toBe(subDays(NOW, 5).toDateString());
  });

  it('should be null when nothing solid was logged', () => {
    expect(deriveWeaningStart([])).toBeNull();
  });
});

describe('getWeaningProgress', () => {
  it('should have no stage before 5 months', () => {
    expect(progress(4, []).stage).toBeNull();
  });

  it('should treat a 7-month-old who has not started as stage 1, porridge', () => {
    expect(progress(7, [])).toMatchObject({
      ageStage: 2, stage: 1, phase: 'porridge', startedAt: null, daysSinceStart: null, mealsPerDay: 1,
    });
  });

  it('should stay in porridge on day 6 even with porridge in', () => {
    expect(progress(6, [tried('okayu-10x', 'grain', 6)]).phase).toBe('porridge');
  });

  it('should open vegetables on day 7 once porridge is in', () => {
    expect(progress(6, [tried('okayu-10x', 'grain', 7)])).toMatchObject({ phase: 'vegetables', daysSinceStart: 7 });
  });

  it('should open protein foods about a week after the first vegetable, not two weeks after the start', () => {
    // 那覇市: 「野菜を始めてから約1週間たったら たんぱく質を1さじからプラス」
    expect(progress(6, [tried('okayu-10x', 'grain', 14), tried('carrot', 'vegetable', 7)]).phase).toBe('proteins');
    expect(progress(6, [tried('okayu-10x', 'grain', 14), tried('carrot', 'vegetable', 1)]).phase).toBe('vegetables');
    expect(progress(6, [tried('okayu-10x', 'grain', 30), tried('carrot', 'vegetable', 6)]).phase).toBe('vegetables');
  });

  it('should wait until the baby is used to porridge before opening vegetables', () => {
    // 「慣れてきたら」: a porridge eaten at a single meal is not yet a habit.
    expect(progress(6, [tried('okayu-10x', 'grain', 9, 1)]).phase).toBe('porridge');
    expect(progress(6, [tried('okayu-10x', 'grain', 9, 3)]).phase).toBe('vegetables');
  });

  it('should wait until the baby is used to a vegetable before opening protein foods', () => {
    const foods = [tried('okayu-10x', 'grain', 20), tried('carrot', 'vegetable', 10, 1)];
    expect(progress(6, foods).phase).toBe('vegetables');
  });

  it('should follow a family that went faster instead of demoting it', () => {
    expect(progress(6, [tried('okayu-10x', 'grain', 3), tried('carrot', 'vegetable', 2)]).phase).toBe('vegetables');
    expect(progress(6, [tried('okayu-10x', 'grain', 3), tried('silken-tofu', 'protein', 1)]).phase).toBe('proteins');
  });

  it('should keep a 7-month-old one week into weaning at stage 1', () => {
    const foods = [tried('okayu-10x', 'grain', 7), tried('carrot', 'vegetable', 1)];
    expect(progress(7, foods)).toMatchObject({ ageStage: 2, stage: 1, daysSinceStart: 7, mealsPerDay: 1 });
  });

  it('should reach stage 2 after a month with protein foods in, capped by age', () => {
    const foods = [tried('okayu-10x', 'grain', 35), tried('carrot', 'vegetable', 28), tried('cod', 'protein', 20)];
    expect(progress(7, foods)).toMatchObject({ stage: 2, mealsPerDay: 2, phase: 'proteins' });
    expect(progress(6, foods).stage).toBe(1);
  });

  it('should stay at stage 1 after a month without any protein food', () => {
    const foods = [tried('okayu-10x', 'grain', 40), tried('carrot', 'vegetable', 30)];
    expect(progress(8, foods).stage).toBe(1);
  });

  it('should not jump a late starter straight to stage 3', () => {
    const foods = [tried('okayu-10x', 'grain', 40), tried('carrot', 'vegetable', 30), tried('cod', 'protein', 25)];
    expect(progress(10, foods)).toMatchObject({ ageStage: 3, stage: 2 });
  });

  it('should prefer the date set in settings over the first logged food', () => {
    expect(progress(7, [tried('okayu-10x', 'grain', 2)], { weaningStartedAt: subDays(NOW, 20) }).daysSinceStart).toBe(20);
  });

  it('should treat a start date in the future as not started', () => {
    expect(progress(7, [], { weaningStartedAt: addDays(NOW, 3) }).startedAt).toBeNull();
  });

  it('should carry the eczema flag, defaulting to false', () => {
    expect(progress(7, [], { eczema: true }).eczema).toBe(true);
    expect(progress(7, []).eczema).toBe(false);
  });
});
