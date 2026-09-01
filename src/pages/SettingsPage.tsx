import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { Baby as BabyIcon, AlertCircle, Check, Settings, Download } from 'lucide-react';
import { updateBaby } from '../services/family';
import { formatBabyAge } from '../utils/date';
import { useRangeEvents } from '../hooks/useRangeEvents';
import { useFoods } from '../hooks/useFoods';
import { buildReactionCsv } from '../utils/reaction-export';
import type { Baby, BabySex } from '../types/events';
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
