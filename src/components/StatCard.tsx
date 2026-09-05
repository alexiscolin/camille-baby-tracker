import type { ReactNode } from 'react';
import styles from './QuickStats.module.css';

interface StatCardProps {
  icon: ReactNode;
  value: string;
  label: string;
  hint?: string;
  primary?: boolean;
}

export function StatCard({ icon, value, label, hint, primary }: StatCardProps) {
  return (
    <div className={`${styles.card} ${primary ? styles.cardPrimary : ''}`}>
      <div className={styles.cardIcon}>{icon}</div>
      <div className={styles.cardContent}>
        <span className={styles.cardValue}>{value}</span>
        <span className={styles.cardLabel}>{label}</span>
        {hint && <span className={styles.cardHint}>{hint}</span>}
      </div>
    </div>
  );
}

