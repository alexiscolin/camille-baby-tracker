import { getDevelopmentOutlook } from '../utils/development-timeline';
import styles from './DevelopmentTimeline.module.css';

interface DevelopmentTimelineProps {
  birthDate: Date;
  /** Injectable so the tests are not hostage to the wall clock. */
  now?: Date;
}

/** The scale the motor bars are drawn on; the last window closes at 17.6. */
const SCALE_MONTHS = 18;

/** French decimals, because the figures are quoted from French sources. */
const months = (value: number) => value.toFixed(1).replace('.', ',');

/**
 * Deliberately vague. The underlying windows are months wide, so a delay to the
 * day would dress an estimate up as a date.
 */
function formatDelay(days: number): string {
  if (days <= 0) return 'maintenant';
  if (days < 14) return `dans ~${days} jours`;
  if (days < 45) return `dans ~${Math.round(days / 7)} semaines`;
  return `dans ~${Math.round(days / 30.4375)} mois`;
}

/**
 * What is coming for the baby, and when the nights are likely to get worse.
 *
 * Only two rough patches are predictable from a calendar, and both are here
 * with the caveat that undermines them. Everything a parenting app normally
 * puts in a feature like this — leaps, sleep regressions, growth spurts — was
 * researched and thrown out; see the header of `development-timeline.ts` for
 * why, before adding any of it back.
 */
export function DevelopmentTimeline({ birthDate, now }: DevelopmentTimelineProps) {
  const { ageMonths, roughNights, nextCheckpoint, motor } = getDevelopmentOutlook(birthDate, now);
  const ahead = motor.filter((m) => m.status !== 'after');

  const nothingToSay =
    roughNights.current.length === 0 &&
    roughNights.upcoming.length === 0 &&
    !nextCheckpoint &&
    ahead.length === 0;

  if (nothingToSay) return null;

  return (
    <section className={styles.card} aria-labelledby="dev-timeline">
      <h3 className={styles.title} id="dev-timeline">Ce qui vient</h3>

      <h4 className={styles.section}>Nuits</h4>
      {/* Answers the question the parent actually has — is tonight going to be
          bad? — before listing anything that is merely ahead. */}
      {roughNights.current.length === 0 && (
        <p className={styles.calm}>Rien de connu en ce moment.</p>
      )}
      {roughNights.current.map((band) => (
        <div key={band.key} className={styles.band}>
          <p className={styles.bandHead}>
            <span className={styles.bandDot} aria-hidden />
            <span className={styles.bandLabel}>{band.label}</span>
            <span className={styles.bandWhen}>en cours</span>
          </p>
          <p className={styles.bandWhat}>{band.what}</p>
          <p className={styles.caveat}>{band.caveat}</p>
          <p className={styles.source}>{band.source}</p>
        </div>
      ))}
      {roughNights.upcoming.map((band) => (
        <div key={band.key} className={styles.band}>
          <p className={styles.bandHead}>
            <span className={`${styles.bandDot} ${styles.bandDotAhead}`} aria-hidden />
            <span className={styles.bandLabel}>{band.label}</span>
            <span className={styles.bandWhen}>{formatDelay(band.startsInDays)}</span>
          </p>
          <p className={styles.bandWhat}>{band.what}</p>
          <p className={styles.caveat}>{band.caveat}</p>
          <p className={styles.source}>{band.source}</p>
        </div>
      ))}

      {roughNights.current.length === 0 && (
        <p className={styles.note}>
          Le reste de ce qui perturbe ses nuits — ramper, se mettre debout, parler — dépend
          d’elle, pas de la date. Les fourchettes ci-dessous disent quand c’est possible.
        </p>
      )}

      {nextCheckpoint && (
        <>
          <h4 className={styles.section}>
            Prochain rendez-vous · {nextCheckpoint.ageMonths} mois
            <span className={styles.when}>{formatDelay(nextCheckpoint.inDays)}</span>
          </h4>
          <ul className={styles.items}>
            {nextCheckpoint.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className={styles.source}>Carnet de santé 2025 — ce que le médecin regardera</p>
        </>
      )}

      {ahead.length > 0 && (
        <>
          <h4 className={styles.section}>Repères moteurs</h4>
          <ul className={styles.motor}>
            {ahead.map((m) => (
              <li key={m.key} className={styles.motorRow}>
                <span className={styles.motorLabel}>{m.label}</span>
                <span className={styles.track} aria-hidden>
                  <span
                    className={styles.window}
                    style={{
                      left: `${(m.p1 / SCALE_MONTHS) * 100}%`,
                      width: `${((m.p99 - m.p1) / SCALE_MONTHS) * 100}%`,
                    }}
                  />
                  <span
                    className={styles.today}
                    style={{ left: `${Math.min(ageMonths / SCALE_MONTHS, 1) * 100}%` }}
                  />
                </span>
                <span className={styles.range}>
                  {months(m.p1)} – {months(m.p99)} mois
                </span>
                {m.note && <span className={styles.motorNote}>{m.note}</span>}
              </li>
            ))}
          </ul>
          <p className={styles.source}>
            OMS, étude multicentrique (n=816) — du 1ᵉʳ au 99ᵉ percentile. Le trait marque où
            elle en est ; toute la largeur est normale.
          </p>
        </>
      )}
    </section>
  );
}
