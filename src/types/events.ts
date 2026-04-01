import type { Timestamp } from 'firebase/firestore';

export type EventType = 'feeding' | 'pee' | 'poop' | 'medication';

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

export type BabyEvent = FeedingEvent | PeeEvent | PoopEvent | MedicationEvent;

export interface Baby {
  id: string;
  firstName: string;
  birthDate: Timestamp;
  createdAt: Timestamp;
}

export interface Family {
  id: string;
  name: string;
  members: string[];
  babies: string[];
  createdAt: Timestamp;
}

export interface DailySummary {
  feeding: number;
  pee: number;
  poop: number;
  medication: number;
}
