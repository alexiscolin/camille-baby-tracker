import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

export async function isEmailAllowed(email: string): Promise<boolean> {
  if (!email) return false;
  const snap = await getDoc(doc(db, 'allowedEmails', email));
  return snap.exists();
}
