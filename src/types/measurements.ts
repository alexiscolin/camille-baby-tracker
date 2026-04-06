import type { Timestamp } from 'firebase/firestore';

export type MeasurementType = 'weight' | 'height' | 'head';

export const MEASUREMENT_TYPES: MeasurementType[] = ['weight', 'height', 'head'];

export interface Measurement {
  id: string;
  babyId: string;
  type: MeasurementType;
  value: number;
  date: Timestamp;
  createdBy: string;
  createdAt: Timestamp;
  notes?: string;
}
