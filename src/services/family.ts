import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  arrayUnion,
  Timestamp,
  doc,
  getDoc,
  onSnapshot,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Family, Baby, BabySex } from '../types/events';

export async function getFamilyForUser(userId: string): Promise<Family | null> {
  const q = query(
    collection(db, 'families'),
    where('members', 'array-contains', userId),
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const d = snapshot.docs[0];
  return { id: d.id, ...d.data() } as Family;
}

export async function createFamily(
  name: string,
  userId: string,
): Promise<string> {
  const docRef = await addDoc(collection(db, 'families'), {
    name,
    members: [userId],
    babies: [],
    createdAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function getBaby(
  familyId: string,
  babyId: string,
): Promise<Baby | null> {
  const d = await getDoc(doc(db, 'families', familyId, 'babies', babyId));
  if (!d.exists()) return null;
  return { id: d.id, ...d.data() } as Baby;
}

/**
 * The baby document, live.
 *
 * A one-shot read left every consumer holding it as it was at mount, so a
 * write from Settings never came back to the screen — an unticked event type
 * ticked itself straight back on the next render — and the other parent's
 * phone only saw a change after a reload. Events, measurements and foods are
 * all subscriptions already; this is the same shape.
 */
export function subscribeToBaby(
  familyId: string,
  babyId: string,
  callback: (baby: Baby | null) => void,
  onError?: (error: Error) => void,
) {
  return onSnapshot(
    doc(db, 'families', familyId, 'babies', babyId),
    (snapshot) => {
      callback(snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as Baby) : null);
    },
    (error) => {
      if (onError) onError(error);
    },
  );
}

export async function updateBaby(
  familyId: string,
  babyId: string,
  data: Partial<Pick<Baby, 'firstName' | 'sex' | 'hiddenEventTypes'>>,
) {
  return updateDoc(doc(db, 'families', familyId, 'babies', babyId), data);
}

export async function addBaby(
  familyId: string,
  firstName: string,
  birthDate: Date,
  sex?: BabySex,
): Promise<string> {
  const data: Record<string, unknown> = {
    firstName,
    birthDate: Timestamp.fromDate(birthDate),
    createdAt: Timestamp.now(),
  };
  if (sex) data.sex = sex;
  const docRef = await addDoc(
    collection(db, 'families', familyId, 'babies'),
    data,
  );
  await updateDoc(doc(db, 'families', familyId), {
    babies: arrayUnion(docRef.id),
  });
  return docRef.id;
}
