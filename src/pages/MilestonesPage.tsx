import { useMemo, useState, lazy, Suspense } from 'react';
import { Plus, Star } from 'lucide-react';
import { format } from 'date-fns';
import { useToday } from '../hooks/useToday';
import { useRangeEvents } from '../hooks/useRangeEvents';
import { CacheIndicator } from '../components/CacheIndicator';
import { ModalFallback } from '../components/ModalFallback';
import { withChunkReload } from '../utils/lazy-route';
import { formatBabyAge } from '../utils/date';
import type { Baby, MilestoneEvent } from '../types/events';
import styles from './MilestonesPage.module.css';

/** Same reasoning as the other pages: the modal is only mounted after a tap. */
const EventModal = lazy(
  withChunkReload(() =>
    import('../components/EventModal').then((m) => ({ default: m.EventModal })),
  ),
);

interface MilestonesPageProps {
  familyId: string;
  babyId: string;
  userId: string;
  baby: Baby | null;
}

/**
 * The milestones on their own, newest first.
 *
 * Deliberately not the day-by-day timeline: milestones are months apart, so
 * grouping them by day would be one heading per entry. What matters next to a
 * milestone is how old the baby was, not what time of day it happened.
 */
export function MilestonesPage({ familyId, babyId, userId, baby }: MilestonesPageProps) {
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<MilestoneEvent | null>(null);
  const today = useToday();

  /*
   * Memoised on the instant, not on the Timestamp: `toDate()` builds a new
   * Date every render, and useRangeEvents compares its dependencies by
   * identity. Passing a fresh object each time tore the subscription down and
   * rebuilt it on every render — and a new subscription always opens on a
   * cached snapshot, so the page sat there reporting cached data for ever.
   */
  const birthMs = baby?.birthDate.toMillis();
  const birthDate = useMemo(
    () => (birthMs === undefined ? undefined : new Date(birthMs)),
    [birthMs],
  );

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
        <div className={styles.headerActions}>
          <CacheIndicator fromCache={fromCache} hasPendingWrites={hasPendingWrites} />
          {/* A page about adding milestones needs to be able to add one; the
              empty state used to send the reader off to the timeline. */}
          <button
            type="button"
            className={styles.addBtn}
            onClick={() => setAdding(true)}
            aria-label="Add a milestone"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>

      {milestones.length === 0 ? (
        <p className={styles.empty}>
          Nothing yet — first steps, first tooth, whatever you want to
          remember.
        </p>
      ) : (
        <ol className={styles.list}>
          {milestones.map((milestone) => {
            const at = milestone.timestamp.toDate();
            return (
              <li
                key={milestone.id}
                className={styles.entry}
                onClick={() => setEditing(milestone)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setEditing(milestone);
                  }
                }}
              >
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

      <Suspense fallback={<ModalFallback />}>
        {adding && (
          <EventModal
            mode="add"
            date={today}
            familyId={familyId}
            babyId={babyId}
            userId={userId}
            babyBirthDate={birthDate}
            initialType="milestone"
            onClose={() => setAdding(false)}
          />
        )}

        {editing && (
          <EventModal
            mode="edit"
            event={editing}
            familyId={familyId}
            babyId={babyId}
            userId={userId}
            babyBirthDate={birthDate}
            onClose={() => setEditing(null)}
          />
        )}
      </Suspense>
    </div>
  );
}
