import type { ReactNode } from 'react';
import styles from './SummaryCard.module.css';

interface SummaryCardProps {
  icon: ReactNode;
  label: string;
  count: number;
  colorVar: string;
  bgVar: string;
}

export function SummaryCard({ icon, label, count, colorVar, bgVar }: SummaryCardProps) {
  return (
    <div className={styles.card} style={{ '--card-color': colorVar, '--card-bg': bgVar } as React.CSSProperties}>
      <div className={styles.iconWrap}>{icon}</div>
      <span className={styles.count}>{count}</span>
      <span className={styles.label}>{label}</span>
    </div>
  );
}
