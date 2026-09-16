import { memo } from 'react';
import { format } from 'date-fns';
import { NUTRIENT_LABEL, NUTRIENT_UNIT } from '../data/nutrient-reference';
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

/** Same markup as a cell, so the legend cannot drift from what the grid draws. */
function LegendDot({ band, over, children }: {
  band: string;
  over?: boolean;
  children: string;
}) {
  return (
    <li className={styles.legendItem}>
      <span className={styles.cell} data-band={band} data-over={over ?? false}>
        <span className={styles.dot} aria-hidden="true" />
      </span>
      {children}
    </li>
  );
}

const GRADED_LEGEND: { band: string; over?: boolean; text: string }[] = [
  { band: 'met', text: 'on target' },
  { band: 'partial', text: 'part way' },
  { band: 'low', text: 'little' },
  { band: 'met', over: true, text: 'over the daily limit' },
];

const UNGRADED_LEGEND: { band: string; over?: boolean; text: string }[] = [
  { band: 'some', text: 'something that day' },
  { band: 'none', text: 'nothing that day' },
];

export const NutrientWeatherGrid = memo(function NutrientWeatherGrid({
  rows,
  days,
}: NutrientWeatherGridProps) {
  // Before six months nothing is graded, and a legend of colours that never
  // appear is worse than none at all.
  const graded = rows.some((row) => row.kind !== 'context');
  const legend = graded ? GRADED_LEGEND : UNGRADED_LEGEND;

  const footnotes = rows.flatMap((row) => [
    ...(row.overCeiling
      ? [{ key: row.key, text: `over the daily limit on average`, warn: true }]
      : []),
    ...(row.note ? [{ key: row.key, text: row.note, warn: false }] : []),
  ]);

  return (
    <>
    <table className={styles.grid}>
      <caption className={styles.caption}>
        What the meals brought each day, against what they still owe once milk is counted.
      </caption>
      <thead>
        <tr>
          <th scope="col" className={styles.rowHead}>Nutrient</th>
          {days.map((day) => (
            <th key={day.date.toISOString()} scope="col" className={styles.dayHead}>
              {/* Day of the month only. A column here can be six pixels wide on
                  a thirty-day range, and "Sep 16" would set a width no phone has. */}
              {format(day.date, 'd')}
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
              {/* Name only. A sentence in a header cell sets the column to the
                  width of the sentence; the reasons live under the table. */}
              <th scope="row" className={styles.rowHead}>
                {name}
                {row.kind === 'limit' && <span className={styles.kindNote}> (limit)</span>}
              </th>

              {row.cells.map((cell, i) => (
                <td
                  key={cell.date}
                  className={styles.cell}
                  // An ungraded row has no band, but "did the meals bring any"
                  // is still worth seeing. It reads the food alone: milk is the
                  // same every day, so counting it would fill every dot for
                  // every nutrient milk carries and say nothing at all.
                  data-band={cell.band ?? (cell.fromFood > 0 ? 'some' : 'none')}
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
                  <span className={styles.ungraded}>
                    {formatAmount(row.perDay)} {NUTRIENT_UNIT[row.key]}
                    <span className={styles.perDayNote}> /day</span>
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

    {footnotes.length > 0 && (
      <ul className={styles.notes} aria-label="About these rows">
        {footnotes.map((note) => (
          <li key={note.key} className={note.warn ? styles.noteWarn : undefined}>
            <strong>{NUTRIENT_LABEL[note.key]}</strong> — {note.text}
          </li>
        ))}
      </ul>
    )}

    <ul className={styles.legend} aria-label="What the dots mean">
      {legend.map((item) => (
        <LegendDot key={item.text} band={item.band} over={item.over}>
          {item.text}
        </LegendDot>
      ))}
    </ul>
    </>
  );
});
