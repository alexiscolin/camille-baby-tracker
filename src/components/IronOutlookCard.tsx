import { format } from 'date-fns';
import type { IronOutlook } from '../utils/iron-outlook';
import type { MilkSource } from '../types/events';
import type { SeedFood } from '../types/food';
import styles from './IronOutlookCard.module.css';

interface IronOutlookCardProps {
  outlook: IronOutlook;
  source: MilkSource;
  mlPerDay: number;
  /** The day she turns six months, for the sentence that names it. */
  sixMonthsOn: Date;
  onPick: (food: SeedFood) => void;
}

/** One decimal is the precision the figures deserve; two would imply a scale we do not have. */
const mg = (value: number) => `${value.toFixed(1)} mg`;

const MILK_NOUN: Record<MilkSource, string> = {
  breast: 'Breast milk',
  mixed: 'Breast milk',
  formula: 'Formula',
  none: 'Milk',
};

/**
 * Iron gets a plain-language answer of its own, because the grid cannot give
 * one. On the whole-diet percentage a breastfed baby's iron simply reads low
 * month after month, which says there is a problem without saying what to do
 * about it. What a parent needs is the number their cooking has to hit.
 */
export function IronOutlookCard({
  outlook, source, mlPerDay, sixMonthsOn, onPick,
}: IronOutlookCardProps) {
  const { need, fromMilk, needFromFood, shortBy, startsAtSixMonths, suggestions, caution } = outlook;
  const covered = needFromFood === 0;

  return (
    <section className={styles.card} aria-labelledby="iron-outlook">
      <h3 className={styles.title} id="iron-outlook">Iron</h3>

      {covered ? (
        <p className={styles.lead}>
          Formula brings {mg(fromMilk)} a day at {mlPerDay} ml, which covers the {mg(need)} she
          needs. No reason to push iron-rich foods for iron's sake.
        </p>
      ) : (
        <>
          <p className={styles.lead}>
            {startsAtSixMonths ? (
              <>
                From six months — {format(sixMonthsOn, 'd MMM')} — her meals will need to bring
                about <strong>{mg(needFromFood)}</strong> a day. It does not rise after that.
              </>
            ) : (
              <>
                Her meals need to bring about <strong>{mg(needFromFood)}</strong> a day.
              </>
            )}
          </p>
          <p className={styles.detail}>
            {MILK_NOUN[source]} brings {mg(fromMilk)} of the {mg(need)} she needs
            {source === 'none' ? '' : ` at ${mlPerDay} ml a day`}.
            {!startsAtSixMonths && shortBy > 0 && ` Today her meals are ${mg(shortBy)} short.`}
            {!startsAtSixMonths && shortBy === 0 && ' Her meals are there.'}
          </p>
        </>
      )}

      {suggestions.length > 0 && (
        <>
          <ul className={styles.foods}>
            {suggestions.map((food) => (
              <li key={food.id}>
                <button type="button" className={styles.food} onClick={() => onPick(food)}>
                  {food.name}
                  <span className={styles.per100}>{mg(food.nutrients.ironMg)}/100 g</span>
                </button>
              </li>
            ))}
          </ul>
          {caution && <p className={styles.caution}>{caution}</p>}
        </>
      )}
    </section>
  );
}
