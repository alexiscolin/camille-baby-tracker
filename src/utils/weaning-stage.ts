import { differenceInMonths } from 'date-fns';
import type { WeaningStage } from '../types/food';

export const STAGE_LABELS: Record<WeaningStage, string> = {
  1: 'Stage 1 · 5-6 months',
  2: 'Stage 2 · 7-8 months',
  3: 'Stage 3 · 9-11 months',
  4: 'Stage 4 · 12-18 months',
};

export const EXPECTED_MEALS_PER_DAY: Record<WeaningStage, number> = {
  1: 1, 2: 2, 3: 3, 4: 3,
};

/** Returns null before weaning normally starts at 5 months. */
export function getWeaningStage(birthDate: Date, on: Date = new Date()): WeaningStage | null {
  const months = differenceInMonths(on, birthDate);
  if (months < 5) return null;
  if (months < 7) return 1;
  if (months < 9) return 2;
  if (months < 12) return 3;
  return 4;
}
