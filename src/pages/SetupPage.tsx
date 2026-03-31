import { useState } from 'react';
import { Baby, AlertCircle } from 'lucide-react';
import { createFamily, addBaby } from '../services/family';
import type { Family } from '../types/events';
import styles from './SetupPage.module.css';

interface SetupPageProps {
  userId: string;
  onComplete: (family: Family) => void;
}

export function SetupPage({ userId, onComplete }: SetupPageProps) {
  const [step, setStep] = useState<'family' | 'baby'>('family');
  const [familyName, setFamilyName] = useState('');
  const [babyName, setBabyName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [familyId, setFamilyId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleCreateFamily(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const id = await createFamily(familyName.trim(), userId);
      setFamilyId(id);
      setStep('baby');
    } catch (err) {
      console.error('Failed to create family:', err);
      setError('Failed to create family. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }

  async function handleAddBaby(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const babyId = await addBaby(familyId, babyName.trim(), new Date(birthDate));
      onComplete({
        id: familyId,
        name: familyName,
        members: [userId],
        babies: [babyId],
      } as Family);
    } catch (err) {
      console.error('Failed to add baby:', err);
      setError('Failed to save baby info. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}>
            <Baby size={32} />
          </div>
          <h1 className={styles.title}>Welcome!</h1>
          <p className={styles.subtitle}>Let's set up your family</p>
        </div>

        {error && (
          <div className={styles.error}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {step === 'family' && (
          <form onSubmit={handleCreateFamily} className={styles.form}>
            <div className={styles.field}>
              <label className={styles.label}>Family name</label>
              <input
                type="text"
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value.slice(0, 100))}
                placeholder="e.g. The Smiths"
                required
                maxLength={100}
              />
            </div>
            <button type="submit" className={styles.btn} disabled={loading || !familyName.trim()}>
              {loading ? 'Creating...' : 'Next'}
            </button>
          </form>
        )}

        {step === 'baby' && (
          <form onSubmit={handleAddBaby} className={styles.form}>
            <div className={styles.field}>
              <label className={styles.label}>Baby's first name</label>
              <input
                type="text"
                value={babyName}
                onChange={(e) => setBabyName(e.target.value.slice(0, 100))}
                placeholder="e.g. Emma"
                required
                maxLength={100}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Birth date</label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                required
              />
            </div>
            <button type="submit" className={styles.btn} disabled={loading || !babyName.trim() || !birthDate}>
              {loading ? 'Saving...' : "Let's go!"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
