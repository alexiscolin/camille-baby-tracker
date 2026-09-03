import {
  collection,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { MEASUREMENT_TYPES } from '../types/measurements';
import type { Measurement, MeasurementType } from '../types/measurements';

const VALID_TYPES = new Set<MeasurementType>(MEASUREMENT_TYPES);

function measurementsCollection(familyId: string) {
  return collection(db, 'families', familyId, 'measurements');
}

function isValidMeasurementData(data: Record<string, unknown>): boolean {
  return (
    typeof data.babyId === 'string' &&
    typeof data.type === 'string' &&
    VALID_TYPES.has(data.type as MeasurementType) &&
    typeof data.value === 'number' &&
    data.value > 0 &&
    data.date != null &&
    typeof (data.date as { toDate?: unknown }).toDate === 'function' &&
    typeof data.createdBy === 'string'
  );
}

export type NewMeasurement = Omit<Measurement, 'id' | 'createdAt'>;

/**
 * Firestore rejects a document that carries a key whose value is undefined,
 * and this app does not set `ignoreUndefinedProperties`. An optional field the
 * caller left blank must therefore be absent, not present-and-undefined —
 * which is the difference between a measurement that saves and one that throws
 * on every ordinary weigh-in.
 */
function withoutUndefined<T extends object>(data: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined),
  ) as Partial<T>;
}

export function addMeasurement(familyId: string, measurement: NewMeasurement) {
  return addDoc(measurementsCollection(familyId), {
    ...withoutUndefined(measurement),
    createdAt: Timestamp.now(),
  });
}

export function updateMeasurement(
  familyId: string,
  measurementId: string,
  data: Partial<Measurement>,
) {
  return updateDoc(
    doc(db, 'families', familyId, 'measurements', measurementId),
    withoutUndefined(data),
  );
}

export function deleteMeasurement(familyId: string, measurementId: string) {
  return deleteDoc(
    doc(db, 'families', familyId, 'measurements', measurementId),
  );
}

export interface MeasurementSubscriptionResult {
  measurements: Measurement[];
  fromCache: boolean;
  hasPendingWrites: boolean;
}

export function subscribeToMeasurements(
  familyId: string,
  babyId: string,
  callback: (result: MeasurementSubscriptionResult) => void,
  onError?: (error: Error) => void,
) {
  const q = query(
    measurementsCollection(familyId),
    where('babyId', '==', babyId),
    orderBy('date', 'asc'),
  );

  return onSnapshot(
    q,
    { includeMetadataChanges: true },
    (snapshot) => {
      const measurements: Measurement[] = [];
      for (const d of snapshot.docs) {
        const raw = d.data();
        if (!isValidMeasurementData(raw)) continue;
        measurements.push({ id: d.id, ...raw } as Measurement);
      }
      callback({
        measurements,
        fromCache: snapshot.metadata.fromCache,
        hasPendingWrites: snapshot.metadata.hasPendingWrites,
      });
    },
    (error) => {
      if (onError) {
        onError(error);
      } else if (import.meta.env.DEV) {
        console.error('Measurements subscription error:', error);
      }
    },
  );
}
