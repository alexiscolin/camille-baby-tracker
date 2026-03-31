import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDate, getPreviousDay, getNextDay, isToday } from '../utils/date';
import styles from './DateNavigator.module.css';

interface DateNavigatorProps {
  date: Date;
  onDateChange: (date: Date) => void;
}

export function DateNavigator({ date, onDateChange }: DateNavigatorProps) {
  return (
    <div className={styles.navigator}>
      <button
        className={styles.button}
        onClick={() => onDateChange(getPreviousDay(date))}
        aria-label="Previous day"
      >
        <ChevronLeft size={20} />
      </button>
      <button
        className={styles.dateLabel}
        onClick={() => onDateChange(new Date())}
        title="Go to today"
      >
        {isToday(date) ? 'Today' : formatDate(date)}
      </button>
      <button
        className={styles.button}
        onClick={() => onDateChange(getNextDay(date))}
        aria-label="Next day"
        disabled={isToday(date)}
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
}
