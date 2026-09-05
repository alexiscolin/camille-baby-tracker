import { Fragment } from 'react';
import type { ReactNode } from 'react';
import type { BabyEvent } from '../types/events';
import { useVisibleEventTypes } from '../hooks/useVisibleEventTypes';
import { isTypeActive } from '../utils/quick-stats';
import { CARDS, MAX_CARDS } from './QuickStatsCards';
import type { CardContext } from './QuickStatsCards';
import styles from './QuickStats.module.css';

interface QuickStatsProps {
  todayEvents: BabyEvent[];
  recentEvents: BabyEvent[];
}

export function QuickStats({ todayEvents, recentEvents }: QuickStatsProps) {
  const visible = useVisibleEventTypes();
  const now = new Date();
  const ctx: CardContext = { todayEvents, recentEvents, now };

  const cards: { key: string; node: ReactNode }[] = [];
  for (const card of CARDS) {
    if (cards.length === MAX_CARDS) break;
    if (!visible.includes(card.type)) continue;
    if (!isTypeActive(recentEvents, card.type, card.lookbackDays, now)) continue;
    const node = card.render(ctx);
    if (node) cards.push({ key: card.key, node });
  }

  if (cards.length === 0) return null;

  return (
    <div className={styles.grid}>
      {/* Fragments, not wrappers: the cards must stay direct grid children. */}
      {cards.map(({ key, node }) => (
        <Fragment key={key}>{node}</Fragment>
      ))}
    </div>
  );
}
