import { memo } from 'react';
import styles from './SegmentedControl.module.css';

interface SegmentedControlProps<T extends string> {
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  labels?: Partial<Record<T, string>>;
}

function SegmentedControlInner<T extends string>({
  options,
  value,
  onChange,
  labels,
}: SegmentedControlProps<T>) {
  return (
    <div className={styles.segmented}>
      {options.map((option) => (
        <button
          key={option}
          className={`${styles.segmentBtn} ${value === option ? styles.segmentActive : ''}`}
          onClick={() => onChange(option)}
        >
          {labels?.[option] ?? option}
        </button>
      ))}
    </div>
  );
}

export const SegmentedControl = memo(SegmentedControlInner) as typeof SegmentedControlInner;
