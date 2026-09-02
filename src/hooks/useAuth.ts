import { useState, useEffect } from 'react';
import type { User } from 'firebase/auth';
import { onAuthChanged, signOut } from '../services/auth';
import { isEmailAllowed } from '../services/allowed-users';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(true);
  /**
   * The allowlist check is a Firestore read, so it throws when the network or
   * the rules refuse it. That rejection used to escape this callback, leaving
   * `loading` true for ever: the app sat on its loading screen with no login
   * form, no message and nothing to retry. It fails closed — an unverifiable
   * account is not an admitted one — but it has to say so.
   */
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthChanged(async (u) => {
      if (!u) {
        setUser(null);
        setAllowed(true);
        setError(null);
        setLoading(false);
        return;
      }

      try {
        const emailOk = await isEmailAllowed(u.email ?? '');
        if (!emailOk) {
          await signOut();
          setUser(null);
          setAllowed(false);
          setError(null);
          setLoading(false);
          return;
        }

        setUser(u);
        setAllowed(true);
        setError(null);
      } catch (checkFailed) {
        setUser(null);
        setAllowed(true);
        setError(
          checkFailed instanceof Error
            ? `Could not verify this account — ${checkFailed.message}`
            : 'Could not verify this account.',
        );
      } finally {
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  return { user, loading, allowed, error };
}
