import type { BabyEvent, FeedingEvent, MedicationEvent } from '../types/events';
import { EVENT_CONFIG } from '../utils/event-config';
import { formatTime, timeAgo } from '../utils/date';
import styles from './EventTimeline.module.css';

function getEventDetail(event: BabyEvent): string {
  switch (event.type) {
    case 'feeding': {
      const f = event as FeedingEvent;
      const side = f.feedingType === 'left' ? 'Left' : f.feedingType === 'right' ? 'Right' : 'Bottle';
      const duration = f.durationMinutes ? ` - ${f.durationMinutes}min` : '';
      const flags = [
        f.infection && 'Infection',
        f.engorgement && 'Engorgement',
      ].filter(Boolean);
      const flagStr = flags.length > 0 ? ` | ${flags.join(', ')}` : '';
      return `${side}${duration}${flagStr}`;
    }
    case 'medication': {
      const m = event as MedicationEvent;
      return `${m.medicationName} (${m.dose})`;
    }
    default:
      return '';
  }
}

interface EventTimelineProps {
  events: BabyEvent[];
}

export function EventTimeline({ events }: EventTimelineProps) {
  if (events.length === 0) {
    return (
      <div className={styles.empty}>
        <p>No events recorded yet today</p>
      </div>
    );
  }

  return (
    <div className={styles.timeline}>
      {events.map((event) => {
        const config = EVENT_CONFIG[event.type];
        const Icon = config.icon;
        const detail = getEventDetail(event);

        return (
          <div key={event.id} className={styles.item}>
            <div
              className={styles.iconWrap}
              style={{ color: config.color, background: config.bg }}
            >
              <Icon size={18} />
            </div>
            <div className={styles.content}>
              <div className={styles.header}>
                <span className={styles.label}>{config.label}</span>
                <span className={styles.time}>{formatTime(event.timestamp)}</span>
              </div>
              {detail && <span className={styles.detail}>{detail}</span>}
              {event.notes && <span className={styles.notes}>{event.notes}</span>}
            </div>
            <span className={styles.ago}>{timeAgo(event.timestamp)}</span>
          </div>
        );
      })}
    </div>
  );
}
