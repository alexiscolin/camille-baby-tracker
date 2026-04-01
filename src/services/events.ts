import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  deleteDoc,
  doc,
  updateDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import type { BabyEvent, FeedingEvent, PeeEvent, PoopEvent, MedicationEvent } from '../types/events';

type NewEvent =
  | Omit<FeedingEvent, 'id' | 'createdAt'>
  | Omit<PeeEvent, 'id' | 'createdAt'>
  | Omit<PoopEvent, 'id' | 'createdAt'>
  | Omit<MedicationEvent, 'id' | 'createdAt'>;

function eventsCollection(familyId: string) {
  return collection(db, 'families', familyId, 'events');
}

export function addEvent(
  familyId: string,
  event: NewEvent,
) {
  return addDoc(eventsCollection(familyId), {
    ...event,
    createdAt: Timestamp.now(),
  });
}

export function updateEvent(
  familyId: string,
  eventId: string,
  data: Partial<BabyEvent>,
) {
  return updateDoc(doc(db, 'families', familyId, 'events', eventId), data);
}

export function deleteEvent(familyId: string, eventId: string) {
  return deleteDoc(doc(db, 'families', familyId, 'events', eventId));
}

export interface SubscriptionResult {
  events: BabyEvent[];
  fromCache: boolean;
  hasPendingWrites: boolean;
}

export function subscribeToEvents(
  familyId: string,
  babyId: string,
  startDate: Date,
  endDate: Date,
  callback: (result: SubscriptionResult) => void,
  onError?: (error: Error) => void,
) {
  const q = query(
    eventsCollection(familyId),
    where('babyId', '==', babyId),
    where('timestamp', '>=', Timestamp.fromDate(startDate)),
    where('timestamp', '<=', Timestamp.fromDate(endDate)),
    orderBy('timestamp', 'desc'),
  );

  return onSnapshot(
    q,
    { includeMetadataChanges: true },
    (snapshot) => {
      const events = snapshot.docs.map(
        (d) => ({ id: d.id, ...d.data() }) as BabyEvent,
      );
      callback({
        events,
        fromCache: snapshot.metadata.fromCache,
        hasPendingWrites: snapshot.metadata.hasPendingWrites,
      });
    },
    (error) => {
      if (onError) {
        onError(error);
      } else if (import.meta.env.DEV) {
        console.error('Firestore subscription error:', error);
      }
    },
  );
}
