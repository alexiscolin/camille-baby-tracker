import { useState, useEffect } from 'react';
import type { User } from 'firebase/auth';
import { onAuthChanged, signOut } from '../services/auth';
import { isEmailAllowed } from '../services/allowed-users';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChanged(async (u) => {
      if (!u) {
        setUser(null);
        setAllowed(true);
        setLoading(false);
        return;
      }

      const emailOk = await isEmailAllowed(u.email ?? '');
      if (!emailOk) {
        await signOut();
        setUser(null);
        setAllowed(false);
        setLoading(false);
        return;
      }

      setUser(u);
      setAllowed(true);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return { user, loading, allowed };
}
