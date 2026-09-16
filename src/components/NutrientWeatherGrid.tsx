import { memo } from 'react';
import { NUTRIENT_LABEL } from '../data/nutrient-reference';
import { formatAmount } from '../utils/chart-helpers';
import type { Band, WeatherRow } from '../utils/nutrient-weather';
import styles from './NutrientWeatherGrid.module.css';

interface NutrientWeatherGridProps {
  rows: WeatherRow[];
  days: { date: Date; label: string }[];
}

/**
 * Said in words as well as drawn as a colour: a band has to survive being read
 * out by a screen reader, and half of these cells look alike to a colour-blind
 * eye.
 */
const BAND_WORD: Record<Band, string> = {
  met: 'on target',
  partial: 'part way',
  low: 'little',
};

const TREND_LABEL = { up: 'rising', down: 'falling', flat: '' } as const;
const TREND_ARROW = { up: '↑', down: '↓', flat: '' } as const;

export const NutrientWeatherGrid = memo(function NutrientWeatherGrid({
  rows,
  days,
}: NutrientWeatherGridProps) {
  return (
    <table className={styles.grid}>
      <caption className={styles.caption}>
        What the meals brought each day, against what they still owe once milk is counted.
      </caption>
      <thead>
        <tr>
          <th scope="col" className={styles.rowHead}>Nutrient</th>
          {days.map((day) => (
            <th key={day.date.toISOString()} scope="col" className={styles.dayHead}>
              {day.label}
            </th>
          ))}
          <th scope="col" className={styles.verdictHead}>{days.length} days</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const name = NUTRIENT_LABEL[row.key];
          return (
            <tr key={row.key}>
              <th scope="row" className={styles.rowHead}>
                {name}
                {row.kind === 'limit' && <span className={styles.kindNote}> (limit)</span>}
                {row.overCeiling && (
                  <span className={styles.overNote}>
                    {' '}over the {name.toLowerCase()} limit
                  </span>
                )}
              </th>

              {row.cells.map((cell, i) => (
                <td
                  key={cell.date}
                  className={styles.cell}
                  data-band={cell.band ?? 'none'}
                  data-over={cell.overCeiling}
                  // The dot is decoration; this is the cell's actual content.
                  aria-label={[
                    name,
                    days[i]?.label,
                    formatAmount(cell.amount),
                    cell.band ? `— ${BAND_WORD[cell.band]}` : '',
                    cell.overCeiling ? '— over the daily limit' : '',
                  ].filter(Boolean).join(' ')}
                >
                  <span className={styles.dot} aria-hidden="true" />
                </td>
              ))}

              <td className={styles.verdict}>
                {row.ratio === null ? (
                  <span className={styles.ungraded} aria-label={`${name} not graded at this age`}>
                    —
                  </span>
                ) : (
                  <>
                    {Math.round(row.ratio * 100)} %
                    {row.trend && row.trend !== 'flat' && (
                      <span className={styles.trend} aria-label={TREND_LABEL[row.trend]}>
                        {TREND_ARROW[row.trend]}
                      </span>
                    )}
                  </>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
});
