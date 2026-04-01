import { useState, useEffect } from 'react';
import { startOfDay } from 'date-fns';

/**
 * Returns a stable `today` Date that auto-refreshes at midnight.
 * Prevents stale data when the app stays open overnight.
 */
export function useToday(): Date {
  const [today, setToday] = useState(() => new Date());

  useEffect(() => {
    function msUntilMidnight(): number {
      const now = new Date();
      const tomorrow = startOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1));
      return tomorrow.getTime() - now.getTime() + 100; // +100ms buffer
    }

    let timer: ReturnType<typeof setTimeout>;

    function scheduleRefresh() {
      timer = setTimeout(() => {
        setToday(new Date());
        scheduleRefresh();
      }, msUntilMidnight());
    }

    scheduleRefresh();
    return () => clearTimeout(timer);
  }, []);

  return today;
}
