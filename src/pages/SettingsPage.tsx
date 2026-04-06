import { useState } from 'react';
import { format } from 'date-fns';
import { Baby as BabyIcon, AlertCircle, Check, Settings } from 'lucide-react';
import { updateBaby } from '../services/family';
import { formatBabyAge } from '../utils/date';
import type { Baby, BabySex } from '../types/events';
import styles from './SettingsPage.module.css';

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
