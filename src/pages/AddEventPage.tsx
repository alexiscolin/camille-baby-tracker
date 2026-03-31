import { useState } from 'react';
import { Check, AlertCircle } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';
import { addEvent } from '../services/events';
import type { EventType, FeedingType } from '../types/events';
import { EVENT_CONFIG, EVENT_TYPES } from '../utils/event-config';
import styles from './AddEventPage.module.css';

const MAX_TEXT_LENGTH = 200;
const MAX_NOTES_LENGTH = 500;
const MAX_DURATION_MINUTES = 300;

interface AddEventPageProps {
  familyId: string;
  babyId: string;
  userId: string;
}

function getCurrentTimeString(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

function sanitizeText(text: string, maxLength: number): string {
  return text.trim().slice(0, maxLength);
}

function parseDuration(value: string): number | undefined {
  if (!value) return undefined;
  const num = parseInt(value, 10);
  if (isNaN(num) || num < 1 || num > MAX_DURATION_MINUTES) return undefined;
  return num;
}

export function AddEventPage({ familyId, babyId, userId }: AddEventPageProps) {
  const [selectedType, setSelectedType] = useState<EventType | null>(null);
  const [time, setTime] = useState(getCurrentTimeString());
  const [feedingType, setFeedingType] = useState<FeedingType>('left');
  const [duration, setDuration] = useState('');
  const [infection, setInfection] = useState(false);
  const [engorgement, setEngorgement] = useState(false);
  const [medicationName, setMedicationName] = useState('');
  const [dose, setDose] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  function reset() {
    setSelectedType(null);
    setTime(getCurrentTimeString());
    setFeedingType('left');
    setDuration('');
    setInfection(false);
    setEngorgement(false);
    setMedicationName('');
    setDose('');
    setNotes('');
    setSaved(false);
    setError('');
  }

  async function handleSave() {
    if (!selectedType) return;
    setError('');

    const [hours, minutes] = time.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) {
      setError('Invalid time');
      return;
    }

    const eventDate = new Date();
    eventDate.setHours(hours, minutes, 0, 0);

    // Reject timestamps more than 24h in the future
    if (eventDate.getTime() > Date.now() + 24 * 60 * 60 * 1000) {
      setError('Time cannot be more than 24 hours in the future');
      return;
    }

    const sanitizedNotes = notes ? sanitizeText(notes, MAX_NOTES_LENGTH) : undefined;

    const base: Record<string, unknown> = {
      babyId,
      type: selectedType,
      timestamp: Timestamp.fromDate(eventDate),
      createdBy: userId,
    };
    if (sanitizedNotes) {
      base.notes = sanitizedNotes;
    }

    setSaving(true);

    try {
      if (selectedType === 'feeding') {
        const feedingData: Record<string, unknown> = {
          ...base,
          type: 'feeding',
          feedingType,
          infection,
          engorgement,
        };
        const dur = parseDuration(duration);
        if (dur !== undefined) {
          feedingData.durationMinutes = dur;
        }
        await addEvent(familyId, feedingData as Parameters<typeof addEvent>[1]);
      } else if (selectedType === 'medication') {
        const name = sanitizeText(medicationName, MAX_TEXT_LENGTH);
        const d = sanitizeText(dose, MAX_TEXT_LENGTH);
        if (!name || !d) {
          setError('Medication name and dose are required');
          setSaving(false);
          return;
        }
        await addEvent(familyId, {
          ...base,
          type: 'medication',
          medicationName: name,
          dose: d,
        });
      } else {
        await addEvent(familyId, base as Parameters<typeof addEvent>[1]);
      }

      setSaved(true);
      setTimeout(reset, 1500);
    } catch (err) {
      console.error('Failed to save event:', err);
      setError('Failed to save. Please check your connection and try again.');
    } finally {
      setSaving(false);
    }
  }

  if (saved) {
    return (
      <div className={styles.success}>
        <div className={styles.successIcon}>
          <Check size={32} />
        </div>
        <p>Event saved!</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Log Event</h1>

      <div className={styles.typeGrid}>
        {EVENT_TYPES.map((type) => {
          const config = EVENT_CONFIG[type];
          const Icon = config.icon;
          const isActive = selectedType === type;
          return (
            <button
              key={type}
              className={`${styles.typeBtn} ${isActive ? styles.typeBtnActive : ''}`}
              style={{
                '--btn-color': config.color,
                '--btn-bg': config.bg,
              } as React.CSSProperties}
              onClick={() => {
                setSelectedType(type);
                setTime(getCurrentTimeString());
                setError('');
              }}
            >
              <Icon size={28} />
              <span>{config.label}</span>
            </button>
          );
        })}
      </div>

      {selectedType && (
        <div className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>Time</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>

          {selectedType === 'feeding' && (
            <>
              <div className={styles.field}>
                <label className={styles.label}>Type</label>
                <div className={styles.segmented}>
                  {(['left', 'right', 'bottle'] as FeedingType[]).map((ft) => (
                    <button
                      key={ft}
                      className={`${styles.segmentBtn} ${feedingType === ft ? styles.segmentActive : ''}`}
                      onClick={() => setFeedingType(ft)}
                    >
                      {ft === 'left' ? 'Left' : ft === 'right' ? 'Right' : 'Bottle'}
                    </button>
                  ))}
                </div>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Duration (min)</label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="Optional"
                  min="1"
                  max={MAX_DURATION_MINUTES}
                />
              </div>
              <div className={styles.checkboxGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={infection}
                    onChange={(e) => setInfection(e.target.checked)}
                  />
                  <span>Infection</span>
                </label>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={engorgement}
                    onChange={(e) => setEngorgement(e.target.checked)}
                  />
                  <span>Engorgement</span>
                </label>
              </div>
            </>
          )}

          {selectedType === 'medication' && (
            <>
              <div className={styles.field}>
                <label className={styles.label}>Medication name</label>
                <input
                  type="text"
                  value={medicationName}
                  onChange={(e) => setMedicationName(e.target.value.slice(0, MAX_TEXT_LENGTH))}
                  placeholder="e.g. Vitamin D"
                  required
                  maxLength={MAX_TEXT_LENGTH}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Dose</label>
                <input
                  type="text"
                  value={dose}
                  onChange={(e) => setDose(e.target.value.slice(0, MAX_TEXT_LENGTH))}
                  placeholder="e.g. 1 drop"
                  required
                  maxLength={MAX_TEXT_LENGTH}
                />
              </div>
            </>
          )}

          <div className={styles.field}>
            <label className={styles.label}>Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value.slice(0, MAX_NOTES_LENGTH))}
              placeholder="Any additional notes..."
              rows={2}
              maxLength={MAX_NOTES_LENGTH}
            />
            {notes.length > MAX_NOTES_LENGTH - 50 && (
              <span className={styles.charCount}>
                {notes.length}/{MAX_NOTES_LENGTH}
              </span>
            )}
          </div>

          {error && (
            <div className={styles.error}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <button
            className={styles.saveBtn}
            onClick={handleSave}
            disabled={saving || (selectedType === 'medication' && (!medicationName.trim() || !dose.trim()))}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      )}
    </div>
  );
}
