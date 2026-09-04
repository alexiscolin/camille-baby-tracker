import type { Timestamp } from 'firebase/firestore';
import type { MealEvent } from './food';

export type EventType = 'feeding' | 'pee' | 'poop' | 'medication' | 'bath' | 'meal' | 'milestone';

export type FeedingType = 'breast' | 'bottle';

/** @deprecated Legacy type from when each event tracked a single side */
export type LegacyFeedingType = 'left' | 'right';

export interface BaseEvent {
  id: string;
  babyId: string;
  type: EventType;
  timestamp: Timestamp;
  createdBy: string;
  createdAt: Timestamp;
  notes?: string;
}

export interface FeedingEvent extends BaseEvent {
  type: 'feeding';
  feedingType: FeedingType;
  leftCount: number;
  rightCount: number;
  durationMinutes?: number;
  infection?: boolean;
  engorgement?: boolean;
}

export interface PeeEvent extends BaseEvent {
  type: 'pee';
}

export interface PoopEvent extends BaseEvent {
  type: 'poop';
  color?: string;
  consistency?: string;
}

export interface MedicationEvent extends BaseEvent {
  type: 'medication';
  medicationName: string;
  dose: string;
}

export interface BathEvent extends BaseEvent {
  type: 'bath';
}

/**
 * Something that happened once and will not happen again: first steps, first
 * tooth, first word. The title is free text — a list of expected milestones
 * would be a list of things to feel behind on. `notes` carries the detail.
 */
export interface MilestoneEvent extends BaseEvent {
  type: 'milestone';
  title: string;
}

export type BabyEvent =
  | FeedingEvent | PeeEvent | PoopEvent | MedicationEvent | BathEvent | MealEvent
  | MilestoneEvent;

export type BabySex = 'male' | 'female';

export interface Baby {
  id: string;
  firstName: string;
  birthDate: Timestamp;
  sex?: BabySex;
  /**
   * Event types this family has stopped tracking. Absent means all of them are
   * tracked, so nothing needs migrating; see `visibleEventTypes`.
   */
  hiddenEventTypes?: EventType[];
  createdAt: Timestamp;
}

export interface Family {
  id: string;
  name: string;
  members: string[];
  babies: string[];
  createdAt: Timestamp;
}

export type DailySummary = Record<EventType, number>;
