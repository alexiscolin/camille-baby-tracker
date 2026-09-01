import { describe, it, expect } from 'vitest';
import { Timestamp } from 'firebase/firestore';
import { buildReactionCsv } from './reaction-export';
import type { BabyEvent } from '../types/events';
import type { Food } from '../types/food';

const D = new Date('2026-08-30T09:15:00Z');
const byId = new Map([
  ['kiwi', { id: 'kiwi', name: 'Kiwi', allergens: ['kiwi'] } as Food],
]);

const reaction = {
  symptoms: ['hives', 'vomiting'], severity: 'moderate',
  onsetMinutes: 25, suspectedFoodIds: ['kiwi'], note: 'around the mouth',
};

const mealWithReaction = {
  id: 'm1', babyId: 'b1', type: 'meal', mealSlot: 'breakfast',
  timestamp: Timestamp.fromDate(D), createdBy: 'u1', createdAt: Timestamp.fromDate(D),
  items: [{ foodId: 'kiwi', name: 'Kiwi', quantity: 2, unit: 'tsp', firstTry: true }],
  reaction,
} as unknown as BabyEvent;

const mealWithout = {
  id: 'm2', babyId: 'b1', type: 'meal', mealSlot: 'lunch',
  timestamp: Timestamp.fromDate(D), createdBy: 'u1', createdAt: Timestamp.fromDate(D),
  items: [{ foodId: 'kiwi', name: 'Kiwi', quantity: 1, unit: 'tsp' }],
} as unknown as BabyEvent;

const withNote = (note: string) => ({
  ...mealWithReaction, reaction: { ...reaction, note },
} as unknown as BabyEvent);

const lines = (csv: string) => csv.trim().split('\n');

describe('buildReactionCsv', () => {
  it('should emit a header row', () => {
    expect(lines(buildReactionCsv([], byId))[0]).toBe(
      'date,time,meal,severity,symptoms,onset_minutes,suspected_foods,allergens,note',
    );
  });

  it('should emit one row per meal carrying a reaction', () => {
    expect(lines(buildReactionCsv([mealWithReaction, mealWithout], byId))).toHaveLength(2);
  });

  it('should include the symptoms, severity and suspected foods', () => {
    const csv = buildReactionCsv([mealWithReaction], byId);
    expect(csv).toContain('moderate');
    expect(csv).toContain('hives;vomiting');
    expect(csv).toContain('Kiwi');
  });

  it('should resolve the allergens of the suspected foods', () => {
    expect(buildReactionCsv([mealWithReaction], byId)).toContain('Kiwi');
  });

  it('should quote a note containing a comma', () => {
    expect(buildReactionCsv([withNote('red, itchy')], byId)).toContain('"red, itchy"');
  });

  it('should escape a double quote inside a field', () => {
    const csv = buildReactionCsv([withNote('said "ow"')], byId);
    expect(csv).toContain('""ow""');
  });

  it('should ignore non-meal events', () => {
    const pee = {
      id: 'p1', babyId: 'b1', type: 'pee', timestamp: Timestamp.fromDate(D),
      createdBy: 'u1', createdAt: Timestamp.fromDate(D),
    } as unknown as BabyEvent;
    expect(lines(buildReactionCsv([pee], byId))).toHaveLength(1);
  });

  it('should sort rows oldest first', () => {
    const later = {
      ...mealWithReaction, id: 'm3',
      timestamp: Timestamp.fromDate(new Date('2026-08-31T09:00:00Z')),
    } as unknown as BabyEvent;
    const rows = lines(buildReactionCsv([later, mealWithReaction], byId));
    expect(rows[1]).toContain('2026-08-30');
    expect(rows[2]).toContain('2026-08-31');
  });
});
