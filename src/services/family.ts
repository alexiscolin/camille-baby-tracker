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
} from 'firebase/firestore';
import { db } from './firebase';
import type { Family, Baby } from '../types/events';

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

export async function addBaby(
  familyId: string,
  firstName: string,
  birthDate: Date,
): Promise<string> {
  const docRef = await addDoc(
    collection(db, 'families', familyId, 'babies'),
    {
      firstName,
      birthDate: Timestamp.fromDate(birthDate),
      createdAt: Timestamp.now(),
    },
  );
  await updateDoc(doc(db, 'families', familyId), {
    babies: arrayUnion(docRef.id),
  });
  return docRef.id;
}
