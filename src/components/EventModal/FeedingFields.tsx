import type { FeedingType } from '../../types/events';
import styles from '../EventModal.module.css';

interface FeedingFieldsProps {
  feedingType: FeedingType;
  onFeedingTypeChange: (value: FeedingType) => void;
  leftCount: number;
  onLeftCountChange: (value: number) => void;
  rightCount: number;
  onRightCountChange: (value: number) => void;
  endTime: string;
  onEndTimeChange: (value: string) => void;
  infection: boolean;
  onInfectionChange: (value: boolean) => void;
  engorgement: boolean;
  onEngorgementChange: (value: boolean) => void;
}

export function FeedingFields({
  feedingType,
  onFeedingTypeChange,
  leftCount,
  onLeftCountChange,
  rightCount,
  onRightCountChange,
  endTime,
  onEndTimeChange,
  infection,
  onInfectionChange,
  engorgement,
  onEngorgementChange,
}: FeedingFieldsProps) {
  return (
    <>
      <div className={styles.field}>
        <label className={styles.label}>Type</label>
        <div className={styles.segmented}>
          {(['breast', 'bottle'] as FeedingType[]).map((ft) => (
            <button
              key={ft}
              className={`${styles.segmentBtn} ${feedingType === ft ? styles.segmentActive : ''}`}
              onClick={() => onFeedingTypeChange(ft)}
            >
              {ft === 'breast' ? 'Breast' : 'Bottle'}
            </button>
          ))}
        </div>
      </div>
      {feedingType === 'breast' && (
        <div className={styles.field}>
          <label className={styles.label}>Sides</label>
          <div className={styles.sideCounters}>
            <div className={styles.sideCounter}>
              <span className={styles.sideLabel}>Left</span>
              <div className={styles.counterControls}>
                <button
                  type="button"
                  className={styles.counterBtn}
                  onClick={() => onLeftCountChange(Math.max(0, leftCount - 1))}
                  disabled={leftCount === 0}
                  aria-label="Decrease left"
                >
                  −
                </button>
                <span className={styles.counterValue} aria-label="Left count">{leftCount}</span>
                <button
                  type="button"
                  className={styles.counterBtn}
                  onClick={() => onLeftCountChange(leftCount + 1)}
                  aria-label="Increase left"
                >
                  +
                </button>
              </div>
            </div>
            <div className={styles.sideCounter}>
              <span className={styles.sideLabel}>Right</span>
              <div className={styles.counterControls}>
                <button
                  type="button"
                  className={styles.counterBtn}
                  onClick={() => onRightCountChange(Math.max(0, rightCount - 1))}
                  disabled={rightCount === 0}
                  aria-label="Decrease right"
                >
                  −
                </button>
                <span className={styles.counterValue} aria-label="Right count">{rightCount}</span>
                <button
                  type="button"
                  className={styles.counterBtn}
                  onClick={() => onRightCountChange(rightCount + 1)}
                  aria-label="Increase right"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className={styles.field}>
        <label className={styles.label} htmlFor="event-end-time">End time (optional)</label>
        <input
          id="event-end-time"
          type="time"
          value={endTime}
          onChange={(e) => onEndTimeChange(e.target.value)}
        />
      </div>
      <div className={styles.checkboxGroup}>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={infection}
            onChange={(e) => onInfectionChange(e.target.checked)}
          />
          <span>Infection</span>
        </label>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={engorgement}
            onChange={(e) => onEngorgementChange(e.target.checked)}
          />
          <span>Engorgement</span>
        </label>
      </div>
    </>
  );
}
