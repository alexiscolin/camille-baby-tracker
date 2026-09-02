import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { Baby as BabyIcon, AlertCircle, Check, Settings, Download, ListChecks } from 'lucide-react';
import { updateBaby } from '../services/family';
import { formatBabyAge } from '../utils/date';
import { EVENT_CONFIG, EVENT_TYPES } from '../utils/event-config';
import { useRangeEvents } from '../hooks/useRangeEvents';
import { useFoods } from '../hooks/useFoods';
import { buildReactionCsv } from '../utils/reaction-export';
import type { Baby, BabySex, EventType } from '../types/events';
import styles from './SettingsPage.module.css';

function downloadCsv(csv: string, filename: string) {
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

interface SettingsPageProps {
  familyId: string;
  babyId: string;
  baby: Baby | null;
}

export function SettingsPage({ familyId, babyId, baby }: SettingsPageProps) {
  const [firstName, setFirstName] = useState(baby?.firstName ?? '');
  const [sex, setSex] = useState<BabySex | ''>(baby?.sex ?? '');
  const [saving, setSaving] = useState(false);
  /**
   * Written straight through on each tick rather than behind the Save button:
   * this is a preference, not a form, and the snapshot listener is what puts
   * the new value back on screen — including on the other parent's phone.
   */
  const hiddenTypes = baby?.hiddenEventTypes ?? [];
  const [savingTypes, setSavingTypes] = useState(false);
  const [typesError, setTypesError] = useState('');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  // Whole history, not a rolling window: this export answers "what happened
  // since day one", so the range runs from birth to the moment the page
  // opened rather than the last-N-days window the dashboard uses.
  // The subscription only opens once the user actually asks for the export
  // (wantsHistory) — without this gate, every visit to Settings (e.g. just
  // to rename the baby) would open a live listener over the baby's entire
  // event history.
  const [wantsHistory, setWantsHistory] = useState(false);
  const rangeStart = useMemo(
    () => baby?.birthDate.toDate() ?? new Date(0),
    [baby?.birthDate],
  );
  const rangeEnd = useMemo(() => new Date(), []);
  const { events, loading: historyLoading } = useRangeEvents(
    wantsHistory ? familyId : undefined,
    babyId,
    rangeStart,
    rangeEnd,
  );
  const { foods } = useFoods(familyId);
  const foodsById = useMemo(() => new Map(foods.map((f) => [f.id, f])), [foods]);
  const reactionCsv = useMemo(
    () => buildReactionCsv(events, foodsById),
    [events, foodsById],
  );
  const hasReactions = reactionCsv.trim().split('\n').length > 1;

  const hasChanges = firstName.trim() !== (baby?.firstName ?? '')
    || (sex || undefined) !== baby?.sex;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!firstName.trim()) return;

    setSaving(true);
    setError('');
    setSaved(false);

    try {
      await updateBaby(familyId, babyId, {
        firstName: firstName.trim(),
        ...(sex ? { sex } : {}),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function toggleType(type: EventType) {
    // The last tracked type cannot be removed: the add button would have
    // nothing to offer. The checkbox is disabled too; this is the real guard.
    const next = hiddenTypes.includes(type)
      ? hiddenTypes.filter((t) => t !== type)
      : [...hiddenTypes, type];
    if (next.length >= EVENT_TYPES.length) return;

    setSavingTypes(true);
    setTypesError('');
    try {
      await updateBaby(familyId, babyId, { hiddenEventTypes: next });
    } catch {
      setTypesError('Could not save. Please try again.');
    } finally {
      setSavingTypes(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>Settings</h1>
      </div>

      {/* Baby Profile */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <BabyIcon size={20} className={styles.sectionIcon} />
          Baby Profile
        </h2>

        {baby && (
          <>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Age</span>
              <span className={styles.infoValue}>{formatBabyAge(baby.birthDate.toDate())}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Birth date</span>
              <span className={styles.infoValue}>{format(baby.birthDate.toDate(), 'MMMM d, yyyy')}</span>
            </div>
          </>
        )}

        <form className={styles.form} onSubmit={handleSave}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="baby-name">First name</label>
            <input
              id="baby-name"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value.slice(0, 100))}
              required
              maxLength={100}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="baby-sex">Sex (for growth curves)</label>
            <select
              id="baby-sex"
              value={sex}
              onChange={(e) => setSex(e.target.value as BabySex | '')}
            >
              <option value="">— Not set —</option>
              <option value="male">Boy</option>
              <option value="female">Girl</option>
            </select>
          </div>

          <div className={styles.actions}>
            <button
              type="submit"
              className={styles.saveBtn}
              disabled={saving || !firstName.trim() || !hasChanges}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>

          {saved && (
            <div className={styles.success}>
              <Check size={16} />
              <span>Saved!</span>
            </div>
          )}
          {error && (
            <div className={styles.error}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}
        </form>
      </div>

      {/* ─── Tracked events ─── */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <ListChecks size={20} className={styles.sectionIcon} />
          Tracked events
        </h2>
        <p className={styles.hint}>
          Untick what you no longer record. It leaves the add button, the
          summary tiles and every chart. Nothing is deleted — what you already
          logged stays in the timeline, and ticking it back brings it all back.
        </p>
        <ul className={styles.checkList}>
          {EVENT_TYPES.map((type) => {
            const config = EVENT_CONFIG[type];
            const Icon = config.icon;
            const tracked = !hiddenTypes.includes(type);
            const lastOne = tracked && hiddenTypes.length === EVENT_TYPES.length - 1;
            return (
              <li key={type}>
                <label className={styles.checkRow}>
                  <input
                    type="checkbox"
                    className={styles.checkbox}
                    checked={tracked}
                    disabled={lastOne || savingTypes}
                    onChange={() => toggleType(type)}
                  />
                  <Icon size={18} style={{ color: config.color }} />
                  <span className={styles.checkLabel}>{config.label}</span>
                </label>
              </li>
            );
          })}
        </ul>
        {typesError && (
          <div className={styles.error}>
            <AlertCircle size={16} />
            <span>{typesError}</span>
          </div>
        )}
      </div>

      {/* Reaction History */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <Download size={20} className={styles.sectionIcon} />
          Reaction History
        </h2>
        <p className={styles.hint}>
          Export every logged reaction as a CSV for a doctor's visit.
        </p>
        <div className={styles.actions}>
          {!wantsHistory ? (
            <button
              type="button"
              className={styles.saveBtn}
              onClick={() => setWantsHistory(true)}
            >
              Load reaction history
            </button>
          ) : historyLoading ? (
            <button type="button" className={styles.saveBtn} disabled>
              Loading...
            </button>
          ) : (
            <button
              type="button"
              className={styles.saveBtn}
              disabled={!hasReactions}
              onClick={() => downloadCsv(reactionCsv, `reaction-history-${format(new Date(), 'yyyy-MM-dd')}.csv`)}
            >
              {hasReactions ? 'Download CSV' : 'No reactions logged'}
            </button>
          )}
        </div>
      </div>

      {/* App Info */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <Settings size={20} className={styles.sectionIcon} />
          About
        </h2>
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>App</span>
          <span className={styles.infoValue}>Baby Tracker</span>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>Version</span>
          <span className={styles.infoValue}>1.0.0</span>
        </div>
      </div>
    </div>
  );
}
