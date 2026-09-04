import { useMemo } from 'react';
import { Star } from 'lucide-react';
import { format } from 'date-fns';
import { useToday } from '../hooks/useToday';
import { useRangeEvents } from '../hooks/useRangeEvents';
import { CacheIndicator } from '../components/CacheIndicator';
import { formatBabyAge } from '../utils/date';
import type { Baby, MilestoneEvent } from '../types/events';
import styles from './MilestonesPage.module.css';

interface MilestonesPageProps {
  familyId: string;
  babyId: string;
  baby: Baby | null;
}

/**
 * The milestones on their own, newest first.
 *
 * Deliberately not the day-by-day timeline: milestones are months apart, so
 * grouping them by day would be one heading per entry. What matters next to a
 * milestone is how old the baby was, not what time of day it happened.
 */
export function MilestonesPage({ familyId, babyId, baby }: MilestonesPageProps) {
  const today = useToday();
  const birthDate = baby?.birthDate.toDate();

  // From birth, not a rolling window: the first smile does not stop mattering
  // because it was six months ago.
  const start = useMemo(() => birthDate ?? new Date(0), [birthDate]);
  const { events, fromCache, hasPendingWrites } = useRangeEvents(
    familyId,
    babyId,
    start,
    today,
  );

  const milestones = useMemo(
    () => events
      .filter((e): e is MilestoneEvent => e.type === 'milestone')
      .sort((a, b) => b.timestamp.toMillis() - a.timestamp.toMillis()),
    [events],
  );

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Milestones</h1>
          {baby && (
            <p className={styles.subtitle}>
              {milestones.length === 0
                ? 'Nothing recorded yet'
                : `${milestones.length} so far`}
            </p>
          )}
        </div>
        <CacheIndicator fromCache={fromCache} hasPendingWrites={hasPendingWrites} />
      </div>

      {milestones.length === 0 ? (
        <p className={styles.empty}>
          Add one from any day in the timeline — first steps, first tooth,
          whatever you want to remember.
        </p>
      ) : (
        <ol className={styles.list}>
          {milestones.map((milestone) => {
            const at = milestone.timestamp.toDate();
            return (
              <li key={milestone.id} className={styles.entry}>
                <span className={styles.marker}>
                  <Star size={16} />
                </span>
                <div className={styles.body}>
                  <span className={styles.entryTitle}>{milestone.title}</span>
                  <span className={styles.when}>
                    {format(at, 'd MMMM yyyy')}
                    {birthDate && ` · ${formatBabyAge(birthDate, at)}`}
                  </span>
                  {milestone.notes && (
                    <span className={styles.note}>{milestone.notes}</span>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
