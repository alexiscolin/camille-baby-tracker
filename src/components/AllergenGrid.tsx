import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { X } from 'lucide-react';
import { ALLERGEN_LABELS } from '../utils/allergens';
import { statusLabel } from '../utils/food-status';
import { MAINTENANCE_GAP_DAYS } from '../utils/next-foods';
import type { Allergen } from '../utils/allergens';
import type { AllergenStatus } from '../utils/next-foods';
import type { FoodStatus } from '../types/food';
import modal from './EventModal.module.css';
import styles from './AllergenGrid.module.css';

/**
 * A 4-character slice fits the token and stays unambiguous for every allergen
 * except salmon roe, which would otherwise read the same as salmon. The full
 * name is on the accessible label and in the detail sheet.
 */
const SHORT_OVERRIDES: Partial<Record<Allergen, string>> = { salmon_roe: 'Roe' };

function shortLabel(allergen: Allergen): string {
  return SHORT_OVERRIDES[allergen] ?? ALLERGEN_LABELS[allergen].slice(0, 4);
}

/**
 * Colour carries status. `suspected` shares the watch colour rather than the
 * allergy colour: a suspicion is not a diagnosis.
 */
const STATUS_CLASS: Record<FoodStatus, string> = {
  safe: styles.clear,
  watch: styles.watch,
  suspected: styles.watch,
  confirmed_allergy: styles.alert,
  avoid: styles.alert,
  untried: styles.none,
};

interface AllergenGridProps {
  statuses: AllergenStatus[];
  onSelect: (status: AllergenStatus) => void;
}

export function AllergenGrid({ statuses, onSelect }: AllergenGridProps) {
  return (
    <div>
      <div className={styles.grid}>
        {statuses.map((s) => (
          <button
            key={s.allergen}
            type="button"
            data-testid="allergen-token"
            className={[
              styles.token,
              STATUS_CLASS[s.status],
              s.mandatory ? styles.mandatory : '',
              s.needsMaintenance ? styles.lapsed : '',
            ].join(' ')}
            aria-label={`${ALLERGEN_LABELS[s.allergen]} — ${statusLabel(s)}`}
            onClick={() => onSelect(s)}
          >
            {shortLabel(s.allergen)}
          </button>
        ))}
      </div>
      <p className={styles.legend}>
        <span className={`${styles.dot} ${styles.clear}`} /> no reaction
        <span className={`${styles.dot} ${styles.watch}`} /> watch
        <span className={`${styles.dot} ${styles.alert}`} /> allergy
        <span className={`${styles.dot} ${styles.none}`} /> not introduced
        <span className={styles.legendNote}>ringed = labelled allergen (特定原材料)</span>
      </p>
    </div>
  );
}

interface AllergenSheetProps {
  status: AllergenStatus;
  /** How many catalog foods carry this allergen — 0 means nothing to update. */
  foodCount: number;
  onClose: () => void;
  /** `null` clears a manual status back to whatever the log supports. */
  onSetStatus: (allergen: Allergen, status: FoodStatus | null) => void;
}

/**
 * Reuses EventModal's overlay: ✕, outside click and Escape all close it.
 */
export function AllergenSheet({ status, foodCount, onClose, onSetStatus }: AllergenSheetProps) {
  // Clearing wipes status + reactionEventIds across every food carrying this
  // allergen — including ones flagged by an unrelated, real reaction. That
  // blast radius gets the same two-tap confirmation as deleting an event.
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    document.body.classList.add('modal-open');
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.body.classList.remove('modal-open');
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const rows: [string, string][] = [
    ['Status', statusLabel(status)],
    ['First tried', status.firstTriedAt ? format(status.firstTriedAt, 'd MMM yyyy') : '—'],
    ['Last eaten', status.lastTriedAt ? format(status.lastTriedAt, 'd MMM yyyy') : '—'],
    ['Exposures logged', String(status.exposureCount)],
  ];

  function toggle(next: FoodStatus) {
    const resolved = status.status === next ? null : next;
    if (resolved === null) {
      setConfirmClear(true);
      return;
    }
    onSetStatus(status.allergen, resolved);
  }

  return (
    <div className={modal.overlay} onClick={onClose}>
      <div className={modal.modal} onClick={(e) => e.stopPropagation()}>
        <div className={modal.modalHeader}>
          <h2 className={modal.modalTitle}>{ALLERGEN_LABELS[status.allergen]}</h2>
          <button className={modal.closeBtn} onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {status.mandatory && (
          <p className={styles.sheetNote}>
            One of the 8 allergens Japan requires to be labelled (特定原材料).
          </p>
        )}

        <dl className={styles.rows}>
          {rows.map(([label, value]) => (
            <div key={label} className={styles.row}>
              <dt className={styles.rowLabel}>{label}</dt>
              <dd className={styles.rowValue}>{value}</dd>
            </div>
          ))}
        </dl>

        {status.needsMaintenance && (
          <p className={styles.warning}>
            Not eaten for over {MAINTENANCE_GAP_DAYS} days. Tolerance is kept up by
            regular re-exposure — worth serving again.
          </p>
        )}

        {confirmClear ? (
          <div className={modal.deleteConfirm}>
            <span>
              Clear the flag on {foodCount} food{foodCount > 1 ? 's' : ''}? This forgets
              which meals flagged it, including any from a separate reaction.
            </span>
            <button
              type="button"
              className={modal.deleteConfirmBtn}
              onClick={() => {
                onSetStatus(status.allergen, null);
                setConfirmClear(false);
              }}
            >
              Yes, clear
            </button>
            <button
              type="button"
              className={modal.cancelBtn}
              onClick={() => setConfirmClear(false)}
            >
              Cancel
            </button>
          </div>
        ) : (
          <>
            <div className={styles.actions}>
              <button
                type="button"
                className={styles.actionBtn}
                aria-pressed={status.status === 'watch'}
                disabled={foodCount === 0}
                onClick={() => toggle('watch')}
              >
                Watch
              </button>
              <button
                type="button"
                className={`${styles.actionBtn} ${styles.actionAlert}`}
                aria-pressed={status.status === 'confirmed_allergy'}
                disabled={foodCount === 0}
                onClick={() => toggle('confirmed_allergy')}
              >
                Allergy
              </button>
            </div>
            <p className={styles.sheetNote}>
              {foodCount === 0
                ? 'No food in your catalog carries this allergen yet.'
                : `Applies to the ${foodCount} food${foodCount > 1 ? 's' : ''} in your catalog carrying it.`}
            </p>
            {foodCount > 0 && (
              <p className={styles.sheetNote}>
                Tapping the active button again clears the flag and forgets which meals
                flagged it. The meals themselves are kept.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
