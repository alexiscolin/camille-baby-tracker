import { format } from 'date-fns';
import type { BuyHint } from '../data/coop-okinawa';
import type { ShoppingLine, ShoppingList as List } from '../utils/shopping-list';
import styles from './ShoppingList.module.css';

const SECTIONS = [
  ['grain', 'Grain'],
  ['vegFruit', 'Vegetables & fruit'],
  ['protein', 'Protein'],
] as const;

const TAG: Record<ShoppingLine['reason'], string | null> = { staple: null, new: 'New', maintenance: 'Keep up' };

function where(buy: BuyHint): string {
  if (buy.kind === 'coop') return `🧊 ${buy.product}${buy.leadWeeks === 2 ? ' · 2 weeks' : ''}`;
  if (buy.kind === 'local') return `🥬 ${buy.name} (local, in season)`;
  return '🛒 In store';
}

function amount(l: ShoppingLine): string {
  const parts = [
    l.grams !== undefined ? `up to ${l.grams} g` : null,
    l.eggs !== undefined ? `${l.eggs} egg${l.eggs > 1 ? 's' : ''}` : null,
    l.packs !== undefined ? `${l.packs} pack${l.packs > 1 ? 's' : ''}` : null,
  ];
  return parts.filter(Boolean).join(' · ');
}

export function ShoppingList({ list }: { list: List }) {
  return (
    <div className={styles.list}>
      <p className={styles.period}>
        {format(list.from, 'EEE d MMM')} – {format(list.to, 'EEE d MMM')} · {list.mealsPerDay} meal{list.mealsPerDay > 1 ? 's' : ''} a day
      </p>
      <p className={styles.cycle}>
        🧊 Frozen: order in this week's 宅配 — it arrives next week (other brands in
        すくすくスマイル take two weeks). 🥬 Fresh and local: in store. The Coop range
        changes; check the catalogue.
      </p>
      {SECTIONS.map(([key, title]) => list[key].length > 0 && (
        <div key={key} className={styles.section}>
          <h3 className={styles.heading}>{title}</h3>
          <ul className={styles.lines}>
            {list[key].map((l) => (
              <li key={`${l.reason}-${l.foodId}`} className={styles.line}>
                <div className={styles.row}>
                  <span className={styles.name}>
                    {l.name}
                    {l.nameJa && <span className={styles.nameJa} lang="ja">{l.nameJa}</span>}
                  </span>
                  {TAG[l.reason] && <span className={styles.tag}>{TAG[l.reason]}</span>}
                </div>
                <span className={styles.where}>{where(l.buy)}</span>
                <span className={styles.amount}>{amount(l)}</span>
                {l.note && <span className={styles.note}>{l.note}</span>}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
