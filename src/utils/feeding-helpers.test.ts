import { describe, it, expect } from 'vitest';
import { normalizeFeedingEvent, formatSides, getNextSide } from './feeding-helpers';
import type { FeedingEvent } from '../types/events';
import { Timestamp } from 'firebase/firestore';

function makeBreastEvent(leftCount: number, rightCount: number): FeedingEvent {
  return {
    id: 'f-1',
    babyId: 'baby-1',
    type: 'feeding',
    feedingType: 'breast',
    leftCount,
    rightCount,
    timestamp: Timestamp.fromDate(new Date()),
    createdBy: 'user-1',
    createdAt: Timestamp.fromDate(new Date()),
  };
}

function makeBottleEvent(): FeedingEvent {
  return {
    id: 'f-2',
    babyId: 'baby-1',
    type: 'feeding',
    feedingType: 'bottle',
    leftCount: 0,
    rightCount: 0,
    timestamp: Timestamp.fromDate(new Date()),
    createdBy: 'user-1',
    createdAt: Timestamp.fromDate(new Date()),
  };
}

describe('normalizeFeedingEvent', () => {
  it('should convert legacy left to breast with leftCount=1', () => {
    const raw = { feedingType: 'left', type: 'feeding' };
    const result = normalizeFeedingEvent(raw);
    expect(result.feedingType).toBe('breast');
    expect(result.leftCount).toBe(1);
    expect(result.rightCount).toBe(0);
  });

  it('should convert legacy right to breast with rightCount=1', () => {
    const raw = { feedingType: 'right', type: 'feeding' };
    const result = normalizeFeedingEvent(raw);
    expect(result.feedingType).toBe('breast');
    expect(result.leftCount).toBe(0);
    expect(result.rightCount).toBe(1);
  });

  it('should pass through new format unchanged', () => {
    const raw = { feedingType: 'breast', leftCount: 2, rightCount: 1 };
    const result = normalizeFeedingEvent(raw);
    expect(result.feedingType).toBe('breast');
    expect(result.leftCount).toBe(2);
    expect(result.rightCount).toBe(1);
  });

  it('should pass through bottle unchanged', () => {
    const raw = { feedingType: 'bottle', leftCount: 0, rightCount: 0 };
    const result = normalizeFeedingEvent(raw);
    expect(result.feedingType).toBe('bottle');
  });
});

describe('formatSides', () => {
  it('should return "Bottle" for bottle events', () => {
    expect(formatSides(makeBottleEvent())).toBe('Bottle');
  });

  it('should return "L" for left-only single', () => {
    expect(formatSides(makeBreastEvent(1, 0))).toBe('L');
  });

  it('should return "R" for right-only single', () => {
    expect(formatSides(makeBreastEvent(0, 1))).toBe('R');
  });

  it('should return "L + R" for both sides once each', () => {
    expect(formatSides(makeBreastEvent(1, 1))).toBe('L + R');
  });

  it('should show counts when > 1', () => {
    expect(formatSides(makeBreastEvent(2, 1))).toBe('L×2 + R');
  });

  it('should show both counts when both > 1', () => {
    expect(formatSides(makeBreastEvent(2, 3))).toBe('L×2 + R×3');
  });
});

describe('getNextSide', () => {
  it('should suggest right when left was used more', () => {
    expect(getNextSide(makeBreastEvent(2, 1))).toBe('right');
  });

  it('should suggest left when right was used more', () => {
    expect(getNextSide(makeBreastEvent(1, 2))).toBe('left');
  });

  it('should return null when counts are equal', () => {
    expect(getNextSide(makeBreastEvent(1, 1))).toBeNull();
  });

  it('should return null for bottle events', () => {
    expect(getNextSide(makeBottleEvent())).toBeNull();
  });
});
