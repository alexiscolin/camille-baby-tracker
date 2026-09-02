import { memo } from 'react';
import { Plus } from 'lucide-react';
import type { BabyEvent } from '../types/events';
import { computeSummary } from '../utils/summary';
import { getRelativeDayLabel, formatShortDate } from '../utils/date';
import { EVENT_CONFIG, EVENT_TYPES } from '../utils/event-config';
import { EventTimeline } from './EventTimeline';
import styles from './DaySection.module.css';

interface DaySectionProps {
  date: Date;
  events: BabyEvent[];
  onEventClick: (event: BabyEvent) => void;
  onAddClick: () => void;
  showHourMarkers?: boolean;
}

export const DaySection = memo(function DaySection({ date, events, onEventClick, onAddClick, showHourMarkers = false }: DaySectionProps) {
  const summary = computeSummary(events);
  const label = getRelativeDayLabel(date);
  /**
   * Only a relative label ("Yesterday") needs the date spelled out beside it.
   * An absolute label already reads "Saturday, August 29", and repeating
   * "Aug 29" after it pushed the row past a 320px screen.
   */
  const shortDate = label === 'Yesterday' ? formatShortDate(date) : '';

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <div className={styles.dateInfo}>
          <h3 className={styles.dayLabel}>{label}</h3>
          {shortDate && <span className={styles.shortDate}>{shortDate}</span>}
        </div>
        <div className={styles.summaryBadges}>
          {EVENT_TYPES.map((type) => {
            const count = summary[type];
            if (count === 0) return null;
            const config = EVENT_CONFIG[type];
            const Icon = config.icon;
            return (
              <span
                key={type}
                className={styles.badge}
                style={{ color: config.color, background: config.bg }}
              >
                <Icon size={12} />
                <span>{count}</span>
              </span>
            );
          })}
        </div>
        <button
          className={styles.addBtn}
          onClick={onAddClick}
          aria-label={`Add event for ${label}`}
        >
          <Plus size={18} />
        </button>
      </div>

      {events.length > 0 ? (
        <EventTimeline events={events} onEventClick={onEventClick} showHourMarkers={showHourMarkers} />
      ) : (
        <p className={styles.empty}>No events recorded</p>
      )}
    </section>
  );
});
