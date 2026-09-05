import { Clock, ArrowLeftRight, Droplets, Timer, Salad, Sprout, Percent, Bath, Star } from 'lucide-react';
import type { ReactNode } from 'react';
import type { BabyEvent, EventType } from '../types/events';
import {
  getTimeSinceLastFeeding,
  getTimeSinceLastEvent,
  getFeedingBalance,
  getDiaperStatus,
  getAverageFeedingInterval,
  getNewFoodsCount,
  getAcceptanceRate,
  getLastMilestone,
} from '../utils/quick-stats';
import { StatCard } from './StatCard';
import styles from './QuickStats.module.css';

export interface CardContext {
  todayEvents: BabyEvent[];
  recentEvents: BabyEvent[];
  now: Date;
}

export interface CardDef {
  key: string;
  /** The event type this tile reads. No events of it recently, no tile. */
  type: EventType;
  /**
   * How long that type may go unused before the tile steps aside. Per-tile
   * because the rhythms differ by an order of magnitude: feeding is hourly,
   * a bath weekly, a milestone every few months.
   */
  lookbackDays: number;
  /** Null when the tile has data of the right type but nothing to say. */
  render: (ctx: CardContext) => ReactNode | null;
}

/** The row holds four without wrapping into a wall of numbers. */
export const MAX_CARDS = 4;

const MEAL_WINDOW_DAYS = 7;

/**
 * Every tile the dashboard knows how to draw, most relevant first.
 *
 * Nothing here is ever removed when a phase ends — the breastfeeding tiles are
 * still the top of the list the day a feeding is logged again. What changes is
 * which four survive the relevance filter below, so the row follows the baby
 * from breast to solids on its own, with no setting to remember to flip.
 */
export const CARDS: CardDef[] = [
  {
    key: 'meals-today',
    type: 'meal',
    lookbackDays: MEAL_WINDOW_DAYS,
    render: ({ todayEvents, recentEvents, now }) => {
      const count = todayEvents.filter((e) => e.type === 'meal').length;
      const last = getTimeSinceLastEvent(recentEvents, 'meal', now);
      return (
        <StatCard
          icon={<Salad size={18} />}
          value={String(count)}
          label="Meals today"
          hint={last ? `Last ${last.label}` : undefined}
          primary
        />
      );
    },
  },
  {
    key: 'new-foods',
    type: 'meal',
    lookbackDays: MEAL_WINDOW_DAYS,
    render: ({ recentEvents, now }) => (
      <StatCard
        icon={<Sprout size={18} />}
        value={String(getNewFoodsCount(recentEvents, MEAL_WINDOW_DAYS, now))}
        label="New foods (7d)"
        hint="First tries this week"
      />
    ),
  },
  {
    key: 'acceptance',
    type: 'meal',
    lookbackDays: MEAL_WINDOW_DAYS,
    render: ({ recentEvents, now }) => {
      const rate = getAcceptanceRate(recentEvents, MEAL_WINDOW_DAYS, now);
      if (!rate) return null;
      return (
        <StatCard
          icon={<Percent size={18} />}
          value={`${rate.percent}%`}
          label="Eaten (7d)"
          hint={`Finished or mostly, over ${rate.sampled} served`}
        />
      );
    },
  },
  {
    key: 'last-bath',
    type: 'bath',
    lookbackDays: 14,
    render: ({ recentEvents, now }) => {
      const last = getTimeSinceLastEvent(recentEvents, 'bath', now);
      if (!last) return null;
      return <StatCard icon={<Bath size={18} />} value={last.label} label="Last bath" />;
    },
  },
  {
    key: 'last-milestone',
    type: 'milestone',
    lookbackDays: 30,
    render: ({ recentEvents, now }) => {
      const last = getLastMilestone(recentEvents, now);
      if (!last) return null;
      return (
        <StatCard
          icon={<Star size={18} />}
          value={last.label}
          label="Last milestone"
          hint={last.title}
        />
      );
    },
  },
  {
    key: 'last-feeding',
    type: 'feeding',
    lookbackDays: MEAL_WINDOW_DAYS,
    render: ({ recentEvents }) => {
      const lastFeed = getTimeSinceLastFeeding(recentEvents);
      return (
        <StatCard
          icon={<Clock size={18} />}
          value={lastFeed ? lastFeed.label : '—'}
          label="Last feeding"
          hint={lastFeed ? lastFeed.sideHint : undefined}
          primary
        />
      );
    },
  },
  {
    key: 'breast-balance',
    type: 'feeding',
    lookbackDays: MEAL_WINDOW_DAYS,
    render: ({ todayEvents }) => {
      const balance = getFeedingBalance(todayEvents);
      return (
        <div className={styles.card}>
          <div className={styles.cardIcon}>
            <ArrowLeftRight size={18} />
          </div>
          <div className={styles.cardContent}>
            {balance.left + balance.right > 0 ? (
              <>
                <div className={styles.balanceBar}>
                  {balance.left > 0 && (
                    <div className={styles.balanceLeft} style={{ flex: balance.left }}>
                      L:{balance.left}
                    </div>
                  )}
                  {balance.right > 0 && (
                    <div className={styles.balanceRight} style={{ flex: balance.right }}>
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
      );
    },
  },
  {
    key: 'wet-diapers',
    type: 'pee',
    lookbackDays: MEAL_WINDOW_DAYS,
    render: ({ todayEvents }) => {
      const diaper = getDiaperStatus(todayEvents);
      return (
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
      );
    },
  },
  {
    key: 'feeding-interval',
    type: 'feeding',
    lookbackDays: MEAL_WINDOW_DAYS,
    render: ({ recentEvents }) => {
      const interval = getAverageFeedingInterval(recentEvents);
      return (
        <StatCard
          icon={<Timer size={18} />}
          value={interval ? interval.label : '—'}
          label="Avg feeding interval"
          hint="Time between feedings (recent)"
        />
      );
    },
  },
];

/**
 * The longest window any tile looks back over. Pages that render QuickStats
 * must subscribe to at least this many days, or the sparse tiles — bath,
 * milestone — get judged on data that was never loaded and never appear.
 */
export const QUICK_STATS_LOOKBACK_DAYS = Math.max(...CARDS.map((c) => c.lookbackDays));
