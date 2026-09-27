import { Check } from 'lucide-react';
import { EXPECTED_MILESTONES, type ExpectedMilestone, type MilestoneDomain, type RoughNightBand } from '../utils/development-timeline';
import { buildMilestoneCalendar, CALENDAR_END_MONTH, type CalendarMonth, type CalendarStep } from '../utils/milestone-calendar';
import type { MilestoneEvent } from '../types/events';
import styles from './DevelopmentTimeline.module.css';

interface DevelopmentTimelineProps {
  birthDate: Date;
  recorded: MilestoneEvent[];
  /** "C'est fait": the parent says the step just happened. */
  onDone: (step: ExpectedMilestone) => void;
  /** A ticked step was tapped: open the milestone that ticked it. */
  onOpen: (event: MilestoneEvent) => void;
  /** Keys being written right now, so a double tap does not record twice. */
  pending?: ReadonlySet<string>;
  /** Injectable so the tests are not hostage to the wall clock. */
  now?: Date;
  catalog?: readonly ExpectedMilestone[];
}

const DOMAIN_LABEL: Record<MilestoneDomain, string> = {
  motor: 'Moteur', hands: 'Mains', language: 'Langage', social: 'Social', play: 'Jeu', teeth: 'Dents', sleep: 'Sommeil',
};

/** French decimals, because the figures are quoted from French-facing sources. */
const months = (value: number) => String(Math.round(value * 10) / 10).replace('.', ',');

const monthYear = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' });
const dayMonth = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' });

function windowText({ early, typical, late }: CalendarStep): string {
  if (early !== null && late !== null) return `entre ${months(early)} et ${months(late)} mois`;
  if (early !== null) return `dès ${months(early)} mois`;
  if (late !== null) return `la plupart avant ${months(late)} mois`;
  return `vers ${months(typical as number)} mois`;
}

function rowName(month: number): string {
  if (month === 0) return 'Premier mois';
  if (month === CALENDAR_END_MONTH) return '2 ans et après';
  return `${month} mois`;
}

function Band({ band, running }: { band: RoughNightBand; running?: boolean }) {
  return (
    <div className={styles.band}>
      <p className={styles.bandHead}>
        <span className={`${styles.bandDot} ${running ? '' : styles.bandDotAhead}`} aria-hidden />
        <span className={styles.bandKind}>Nuits</span>
        <span className={styles.bandLabel}>{band.label}</span>
        {running && <span className={styles.bandWhen}>en cours</span>}
      </p>
      <p className={styles.bandWhat}>{band.what}</p>
      <p className={styles.caveat}>{band.caveat}</p>
      <p className={styles.source}>{band.source}</p>
    </div>
  );
}

interface RowProps {
  row: CalendarMonth;
  current: boolean;
  onDone: (step: ExpectedMilestone) => void;
  onOpen: (event: MilestoneEvent) => void;
  pending?: ReadonlySet<string>;
}

function Row({ row, current, onDone, onOpen, pending }: RowProps) {
  return (
    <div className={`${styles.row} ${current ? styles.rowCurrent : ''}`}>
      <h4 className={styles.rowHead}>
        {rowName(row.month)} · {monthYear.format(row.startsOn)}
        {current && <span className={styles.now}>maintenant</span>}
      </h4>

      {row.checkpoint && (
        <div className={styles.checkpoint}>
          <p className={styles.checkpointHead}>
            Examen des {row.checkpoint.ageMonths} mois — ce que le médecin regardera
          </p>
          <ul className={styles.items}>
            {row.checkpoint.items.map((item) => <li key={item}>{item}</li>)}
          </ul>
          <p className={styles.source}>Carnet de santé 2025</p>
        </div>
      )}

      {row.bands.map((band) => <Band key={band.key} band={band} />)}

      {row.steps.length > 0 && (
        <ul className={styles.steps}>
          {row.steps.map((step) => (
            <li key={step.key} className={styles.step}>
              <span className={`${styles.dot} ${styles[`status-${step.status}`]}`} aria-hidden />
              <span className={styles.stepBody}>
                <span className={styles.stepLabel}>{step.label}</span>
                {/* The window stays in sight; the note and the source are one
                    tap away, or the calendar becomes a wall of citations. */}
                <details className={styles.more}>
                  <summary className={styles.stepMeta}>
                    {DOMAIN_LABEL[step.domain]} · {windowText(step)}
                  </summary>
                  {step.note && <span className={styles.stepNote}>{step.note}</span>}
                  <span className={styles.stepSource}>{step.source}</span>
                </details>
              </span>
              {step.done ? (
                <button type="button" className={styles.doneBtn} onClick={() => onOpen(step.done!)}>
                  <Check size={14} aria-hidden /> fait le {dayMonth.format(step.done.timestamp.toDate())}
                </button>
              ) : (
                <button
                  type="button"
                  className={styles.tickBtn}
                  disabled={pending?.has(step.key)}
                  onClick={() => onDone(step)}
                >
                  C’est fait
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * What can happen, month by month, from birth to two years — and a button to
 * record each step the day it happens.
 *
 * Each step sits in the month it most often happens, but the window printed
 * under it is what is normal, and it is always months wide. No step is ever
 * called late: a step past its window is simply still there, and the card ends
 * by pointing to the doctor. Everything a parenting app normally adds here —
 * leaps, sleep regressions, growth spurts — was researched and thrown out; see
 * the header of `development-timeline.ts` before adding any of it back.
 */
export function DevelopmentTimeline({
  birthDate, recorded, onDone, onOpen, pending, now = new Date(), catalog = EXPECTED_MILESTONES,
}: DevelopmentTimelineProps) {
  const calendar = buildMilestoneCalendar(birthDate, now, recorded, catalog);
  const pastSteps = calendar.past.flatMap((row) => row.steps);
  const pastDone = pastSteps.filter((s) => s.status === 'done').length;
  const pastOpen = pastSteps.length - pastDone;
  const rowProps = { onDone, onOpen, pending };

  return (
    <section className={styles.card} aria-labelledby="dev-calendar">
      <h3 className={styles.title} id="dev-calendar">Calendrier</h3>
      <p className={styles.intro}>
        Chaque étape est rangée à son âge typique quand on le connaît, sinon à l’âge où
        la plupart des bébés l’ont faite. Sa fourchette dit ce qui est normal — toute sa
        largeur l’est ; touchez-la pour la source.
      </p>

      {calendar.ongoingBands.map((band) => <Band key={band.key} band={band} running />)}

      {calendar.past.length > 0 && (
        <details className={styles.past}>
          <summary className={styles.pastSummary}>
            Mois passés · {pastDone} fait{pastDone > 1 ? 's' : ''}
            {pastOpen > 0 && `, ${pastOpen} pas encore coché${pastOpen > 1 ? 's' : ''}`}
          </summary>
          {calendar.past.map((row) => <Row key={row.month} row={row} current={false} {...rowProps} />)}
        </details>
      )}

      {calendar.ahead.map((row) => (
        <Row key={row.month} row={row} current={row.month === calendar.currentMonth} {...rowProps} />
      ))}

      <p className={styles.note}>
        « La plupart » veut souvent dire 3 enfants sur 4 : le quatrième n’a pas de
        problème pour autant. Une étape vous inquiète ? Parlez-en au médecin au prochain
        examen — c’est à lui d’en juger, pas à ce calendrier.
      </p>
    </section>
  );
}
