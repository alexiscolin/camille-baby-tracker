import { useMemo, useRef } from 'react';
import { format, subDays, isSameDay } from 'date-fns';
import { CalendarDays, ChevronRight } from 'lucide-react';
import { isToday } from '../utils/date';
import styles from './CalendarStrip.module.css';

interface CalendarStripProps {
  days: number;
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
  onLoadMore: () => void;
}

export function CalendarStrip({ days, selectedDate, onSelectDate, onLoadMore }: CalendarStripProps) {
  const today = useMemo(() => new Date(), []);
  const inputRef = useRef<HTMLInputElement>(null);

  const dateList = useMemo(() => {
    const list: Date[] = [];
    for (let i = 0; i < days; i++) {
      list.push(subDays(today, i));
    }
    return list;
  }, [today, days]);

  function handleDatePick(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    if (val) {
      const [y, m, d] = val.split('-').map(Number);
      onSelectDate(new Date(y, m - 1, d));
    }
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.strip}>
        {dateList.map((date) => {
          const key = format(date, 'yyyy-MM-dd');
          const isSelected = selectedDate ? isSameDay(date, selectedDate) : isToday(date);

          return (
            <button
              key={key}
              className={`${styles.day} ${isSelected ? styles.selected : ''} ${isToday(date) ? styles.today : ''}`}
              onClick={() => onSelectDate(date)}
            >
              <span className={styles.dayName}>{format(date, 'EEE')}</span>
              <span className={styles.dayNum}>{format(date, 'd')}</span>
              <span className={styles.dayMonth}>{format(date, 'MMM')}</span>
            </button>
          );
        })}
      </div>
      <div className={styles.actions}>
        <button
          className={styles.actionBtn}
          onClick={onLoadMore}
          title="Load more days"
        >
          <ChevronRight size={16} />
        </button>
        <button
          className={styles.actionBtn}
          onClick={() => inputRef.current?.showPicker()}
          title="Pick a date"
        >
          <CalendarDays size={16} />
        </button>
        <input
          ref={inputRef}
          type="date"
          className={styles.hiddenInput}
          onChange={handleDatePick}
          max={format(today, 'yyyy-MM-dd')}
          tabIndex={-1}
        />
      </div>
    </div>
  );
}
