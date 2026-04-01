import { Clock, ArrowLeftRight, Droplets, Timer } from 'lucide-react';
import type { BabyEvent } from '../types/events';
import {
  getTimeSinceLastFeeding,
  getFeedingBalance,
  getDiaperStatus,
  getAverageFeedingInterval,
} from '../utils/quick-stats';
import styles from './QuickStats.module.css';

interface QuickStatsProps {
  todayEvents: BabyEvent[];
  recentEvents: BabyEvent[];
}

export function QuickStats({ todayEvents, recentEvents }: QuickStatsProps) {
  const lastFeed = getTimeSinceLastFeeding(recentEvents);
  const balance = getFeedingBalance(todayEvents);
  const diaper = getDiaperStatus(todayEvents);
  const interval = getAverageFeedingInterval(recentEvents);

  return (
    <div className={styles.grid}>
      {/* Time since last feeding */}
      <div className={`${styles.card} ${styles.cardPrimary}`}>
        <div className={styles.cardIcon}>
          <Clock size={18} />
        </div>
        <div className={styles.cardContent}>
          <span className={styles.cardValue}>
            {lastFeed ? lastFeed.label : '—'}
          </span>
          <span className={styles.cardLabel}>Last feeding</span>
          {lastFeed && (
            <span className={styles.cardHint}>
              {lastFeed.type === 'left' ? 'Left side' : lastFeed.type === 'right' ? 'Right side' : 'Bottle'}
            </span>
          )}
        </div>
      </div>

      {/* L/R Balance */}
      <div className={styles.card}>
        <div className={styles.cardIcon}>
          <ArrowLeftRight size={18} />
        </div>
        <div className={styles.cardContent}>
          {balance.left + balance.right > 0 ? (
            <>
              <div className={styles.balanceBar}>
                {balance.left > 0 && (
                  <div
                    className={styles.balanceLeft}
                    style={{ flex: balance.left }}
                  >
                    L:{balance.left}
                  </div>
                )}
                {balance.right > 0 && (
                  <div
                    className={styles.balanceRight}
                    style={{ flex: balance.right }}
                  >
                    R:{balance.right}
                  </div>
                )}
                {balance.left === 0 && balance.right > 0 && (
                  <div className={styles.balanceEmpty}>L:0</div>
                )}
                {balance.right === 0 && balance.left > 0 && (
                  <div className={styles.balanceEmpty}>R:0</div>
                )}
              </div>
              {balance.nextSide && (
                <span className={styles.nextSide}>
                  Next: {balance.nextSide === 'left' ? 'Left' : 'Right'}
                </span>
              )}
            </>
          ) : (
            <span className={styles.cardValue}>—</span>
          )}
          <span className={styles.cardLabel}>Breast balance today</span>
        </div>
      </div>

      {/* Wet diapers */}
      <div className={`${styles.card} ${styles[`diaper${diaper.status}`]}`}>
        <div className={styles.cardIcon}>
          <Droplets size={18} />
        </div>
        <div className={styles.cardContent}>
          <span className={styles.cardValue}>
            {diaper.count}
            <span className={styles.cardValueSmall}>/{diaper.expected} expected</span>
          </span>
          <span className={styles.cardLabel}>Wet diapers today</span>
          <span className={styles.cardHint}>{diaper.message}</span>
        </div>
      </div>

      {/* Average interval */}
      <div className={styles.card}>
        <div className={styles.cardIcon}>
          <Timer size={18} />
        </div>
        <div className={styles.cardContent}>
          <span className={styles.cardValue}>
            {interval ? interval.label : '—'}
          </span>
          <span className={styles.cardLabel}>Avg feeding interval</span>
          <span className={styles.cardHint}>Time between feedings (recent)</span>
        </div>
      </div>
    </div>
  );
}
