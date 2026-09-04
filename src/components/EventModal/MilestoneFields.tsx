import { useId } from 'react';
import styles from '../EventModal.module.css';

interface MilestoneFieldsProps {
  title: string;
  onTitleChange: (value: string) => void;
  maxLength: number;
}

/**
 * Free text, not a picker. A fixed list of expected milestones is a list of
 * things to feel behind on, and every family's are their own.
 */
export function MilestoneFields({ title, onTitleChange, maxLength }: MilestoneFieldsProps) {
  const id = useId();
  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>What happened</label>
      <input
        id={id}
        type="text"
        value={title}
        placeholder="First steps"
        maxLength={maxLength}
        onChange={(e) => onTitleChange(e.target.value)}
      />
    </div>
  );
}
