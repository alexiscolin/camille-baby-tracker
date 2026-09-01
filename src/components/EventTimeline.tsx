import { memo } from 'react';
import type { BabyEvent, FeedingEvent, MedicationEvent } from '../types/events';
import type { MealEvent } from '../types/food';
import { EVENT_CONFIG } from '../utils/event-config';
import { formatTime, timeAgo } from '../utils/date';
import { formatSides } from '../utils/feeding-helpers';
import styles from './EventTimeline.module.css';

/** Keeps a row of many foods readable without wrapping the timeline layout. */
const MAX_MEAL_DETAIL_LENGTH = 40;

function getEventDetail(event: BabyEvent): string {
  switch (event.type) {
    case 'feeding': {
      const f = event as FeedingEvent;
      const side = formatSides(f);
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
    case 'meal': {
      const names = (event as MealEvent).items.map((i) => i.name).join(', ');
      return names.length > MAX_MEAL_DETAIL_LENGTH
        ? `${names.slice(0, MAX_MEAL_DETAIL_LENGTH)}...`
        : names;
    }
    default:
      return '';
  }
}

function getHourLabel(event: BabyEvent, prevEvent: BabyEvent | null): string | null {
  const hour = event.timestamp.toDate().getHours();
  const halfHour = event.timestamp.toDate().getMinutes() >= 30 ? ':30' : ':00';
  const label = `${String(hour).padStart(2, '0')}${halfHour}`;

  if (!prevEvent) return label;

  const prevHour = prevEvent.timestamp.toDate().getHours();
  const prevHalf = prevEvent.timestamp.toDate().getMinutes() >= 30 ? ':30' : ':00';
  const prevLabel = `${String(prevHour).padStart(2, '0')}${prevHalf}`;

  if (label === prevLabel) return null;
  return label;
}

interface EventTimelineProps {
  events: BabyEvent[];
  onEventClick?: (event: BabyEvent) => void;
  showHourMarkers?: boolean;
}

export const EventTimeline = memo(function EventTimeline({ events, onEventClick, showHourMarkers = false }: EventTimelineProps) {
  if (events.length === 0) {
    return (
      <div className={styles.empty}>
        <p>No events recorded yet today</p>
      </div>
    );
  }

  return (
    <div className={styles.timeline}>
      {events.map((event, index) => {
        const config = EVENT_CONFIG[event.type];
        const Icon = config.icon;
        const detail = getEventDetail(event);
        const clickable = !!onEventClick;
        const hourLabel = showHourMarkers ? getHourLabel(event, index > 0 ? events[index - 1] : null) : null;

        return (
          <div key={event.id} className={styles.row}>
            {showHourMarkers && (
              <div className={styles.hourCol}>
                {hourLabel && <span className={styles.hourLabel}>{hourLabel}</span>}
                <div className={styles.hourLine} />
              </div>
            )}
            <div
              className={`${styles.item} ${clickable ? styles.clickable : ''}`}
              onClick={clickable ? () => onEventClick(event) : undefined}
              role={clickable ? 'button' : undefined}
              tabIndex={clickable ? 0 : undefined}
              onKeyDown={clickable ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onEventClick(event);
                }
              } : undefined}
            >
              <div
                className={styles.iconWrap}
                style={{ color: config.color, background: config.bg }}
              >
                <Icon size={18} />
              </div>
              <div className={styles.content}>
                <span className={styles.label}>{config.label}</span>
                <span className={styles.time}>
                  {formatTime(event.timestamp)}
                  {showHourMarkers && (
                    <span className={styles.timeAgo}> · {timeAgo(event.timestamp)}</span>
                  )}
                </span>
                {detail && <span className={styles.detail}>{detail}</span>}
                {event.notes && <span className={styles.notes}>{event.notes}</span>}
              </div>
              {!showHourMarkers && <span className={styles.ago}>{timeAgo(event.timestamp)}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
});
