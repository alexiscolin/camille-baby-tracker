import { useState, useEffect, useRef } from 'react';
import { Check, AlertCircle, Trash2, X } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';
import { addEvent, updateEvent, deleteEvent } from '../services/events';
import { EVENT_CONFIG, EVENT_TYPES } from '../utils/event-config';
import { getStoolColorWarning, type StoolColorId } from '../utils/stool-color';
import { FeedingFields } from './EventModal/FeedingFields';
import { PoopFields } from './EventModal/PoopFields';
import { MedicationFields } from './EventModal/MedicationFields';
import type { EventType, FeedingType, BabyEvent, FeedingEvent, PoopEvent, MedicationEvent } from '../types/events';
import { getTimeString, addMinutesToTime, computeDurationMinutes } from '../utils/time';
import styles from './EventModal.module.css';

const MAX_TEXT_LENGTH = 200;
const MAX_NOTES_LENGTH = 500;
const MAX_DURATION_MINUTES = 300;

type EventModalProps = {
  familyId: string;
  babyId: string;
  userId: string;
  onClose: () => void;
  babyBirthDate?: Date;
} & (
  | { mode: 'edit'; event: BabyEvent }
  | { mode: 'add'; date: Date }
);

function sanitizeText(text: string, maxLength: number): string {
  return text.trim().slice(0, maxLength);
}

export function EventModal(props: EventModalProps) {
  const { familyId, babyId, userId, onClose, mode, babyBirthDate } = props;

  const editEvent = mode === 'edit' ? props.event : null;
  const targetDate = mode === 'add' ? props.date : editEvent!.timestamp.toDate();

  const [selectedType, setSelectedType] = useState<EventType | null>(
    editEvent?.type ?? null,
  );
  const [time, setTime] = useState(getTimeString(targetDate));
  const [feedingType, setFeedingType] = useState<FeedingType>(
    editEvent?.type === 'feeding' ? (editEvent as FeedingEvent).feedingType : 'breast',
  );
  const [leftCount, setLeftCount] = useState(
    editEvent?.type === 'feeding' ? (editEvent as FeedingEvent).leftCount : 1,
  );
  const [rightCount, setRightCount] = useState(
    editEvent?.type === 'feeding' ? (editEvent as FeedingEvent).rightCount : 0,
  );
  const [endTime, setEndTime] = useState(() => {
    if (editEvent?.type === 'feeding' && (editEvent as FeedingEvent).durationMinutes) {
      return addMinutesToTime(getTimeString(targetDate), (editEvent as FeedingEvent).durationMinutes!);
    }
    return '';
  });
  const [infection, setInfection] = useState(
    editEvent?.type === 'feeding' ? (editEvent as FeedingEvent).infection ?? false : false,
  );
  const [engorgement, setEngorgement] = useState(
    editEvent?.type === 'feeding' ? (editEvent as FeedingEvent).engorgement ?? false : false,
  );
  const [medicationName, setMedicationName] = useState(
    editEvent?.type === 'medication' ? (editEvent as MedicationEvent).medicationName : '',
  );
  const [dose, setDose] = useState(
    editEvent?.type === 'medication' ? (editEvent as MedicationEvent).dose : '',
  );
  const [stoolColor, setStoolColor] = useState<StoolColorId | undefined>(
    editEvent?.type === 'poop' ? ((editEvent as PoopEvent).color as StoolColorId | undefined) : undefined,
  );
  const [notes, setNotes] = useState(editEvent?.notes ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const saveInFlight = useRef(false);

  const babyAgeDays = babyBirthDate
    ? Math.floor((Date.now() - babyBirthDate.getTime()) / (1000 * 60 * 60 * 24))
    : null;
  const stoolColorWarning = stoolColor && babyAgeDays !== null
    ? getStoolColorWarning(stoolColor, babyAgeDays)
    : null;

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

  function handleFeedingTypeChange(ft: FeedingType) {
    setFeedingType(ft);
    if (ft === 'bottle') {
      setLeftCount(0);
      setRightCount(0);
    } else if (leftCount === 0 && rightCount === 0) {
      setLeftCount(1);
    }
  }

  function buildEventDate(): Date | null {
    const [hours, minutes] = time.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return null;

    const eventDate = new Date(targetDate);
    eventDate.setHours(hours, minutes, 0, 0);
    return eventDate;
  }

  async function handleSave() {
    if (!selectedType || saveInFlight.current) return;
    saveInFlight.current = true;
    setError('');

    const eventDate = buildEventDate();
    if (!eventDate) {
      setError('Invalid time');
      saveInFlight.current = false;
      return;
    }

    if (eventDate.getTime() > Date.now() + 24 * 60 * 60 * 1000) {
      setError('Time cannot be more than 24 hours in the future');
      saveInFlight.current = false;
      return;
    }

    const sanitizedNotes = notes ? sanitizeText(notes, MAX_NOTES_LENGTH) : undefined;

    setSaving(true);

    try {
      if (mode === 'edit' && editEvent) {
        const updates: Record<string, unknown> = {
          timestamp: Timestamp.fromDate(eventDate),
        };
        if (sanitizedNotes !== undefined) {
          updates.notes = sanitizedNotes;
        } else {
          updates.notes = '';
        }

        if (selectedType === 'feeding') {
          if (feedingType === 'breast' && leftCount === 0 && rightCount === 0) {
            setError('Select at least one side');
            setSaving(false);
            saveInFlight.current = false;
            return;
          }
          updates.feedingType = feedingType;
          updates.leftCount = leftCount;
          updates.rightCount = rightCount;
          updates.infection = infection;
          updates.engorgement = engorgement;
          const dur = computeDurationMinutes(time, endTime, MAX_DURATION_MINUTES);
          if (dur !== undefined) updates.durationMinutes = dur;
        } else if (selectedType === 'poop') {
          updates.color = stoolColor ?? '';
        } else if (selectedType === 'medication') {
          const name = sanitizeText(medicationName, MAX_TEXT_LENGTH);
          const d = sanitizeText(dose, MAX_TEXT_LENGTH);
          if (!name || !d) {
            setError('Medication name and dose are required');
            setSaving(false);
            return;
          }
          updates.medicationName = name;
          updates.dose = d;
        }

        await updateEvent(familyId, editEvent.id, updates);
      } else {
        const base: Record<string, unknown> = {
          babyId,
          type: selectedType,
          timestamp: Timestamp.fromDate(eventDate),
          createdBy: userId,
        };
        if (sanitizedNotes) base.notes = sanitizedNotes;

        if (selectedType === 'feeding') {
          if (feedingType === 'breast' && leftCount === 0 && rightCount === 0) {
            setError('Select at least one side');
            setSaving(false);
            saveInFlight.current = false;
            return;
          }
          const feedingData: Record<string, unknown> = {
            ...base,
            feedingType,
            leftCount,
            rightCount,
            infection,
            engorgement,
          };
          const dur = computeDurationMinutes(time, endTime, MAX_DURATION_MINUTES);
          if (dur !== undefined) feedingData.durationMinutes = dur;
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
            medicationName: name,
            dose: d,
          } as Parameters<typeof addEvent>[1]);
        } else if (selectedType === 'poop' && stoolColor) {
          await addEvent(familyId, {
            ...base,
            color: stoolColor,
          } as Parameters<typeof addEvent>[1]);
        } else {
          await addEvent(familyId, base as Parameters<typeof addEvent>[1]);
        }
      }

      setSaved(true);
      setTimeout(onClose, 1000);
    } catch {
      setError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
      saveInFlight.current = false;
    }
  }

  async function handleDelete() {
    if (!editEvent) return;
    setDeleting(true);
    try {
      await deleteEvent(familyId, editEvent.id);
      onClose();
    } catch {
      setError('Failed to delete. Please try again.');
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  if (saved) {
    return (
      <div className={styles.overlay} onClick={onClose}>
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
          <div className={styles.success}>
            <div className={styles.successIcon}>
              <Check size={28} />
            </div>
            <p>{mode === 'edit' ? 'Updated!' : 'Saved!'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            {mode === 'edit' ? 'Edit Event' : 'Add Event'}
          </h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {mode === 'add' && !selectedType && (
          <div className={styles.typeGrid}>
            {EVENT_TYPES.map((type) => {
              const config = EVENT_CONFIG[type];
              const Icon = config.icon;
              return (
                <button
                  key={type}
                  className={styles.typeBtn}
                  style={{
                    '--btn-color': config.color,
                    '--btn-bg': config.bg,
                  } as React.CSSProperties}
                  onClick={() => setSelectedType(type)}
                >
                  <Icon size={24} />
                  <span>{config.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {selectedType && (
          <div className={styles.form}>
            {mode === 'edit' && (
              <div className={styles.eventTypeBadge}>
                {(() => {
                  const config = EVENT_CONFIG[selectedType];
                  const Icon = config.icon;
                  return (
                    <>
                      <Icon size={16} />
                      <span>{config.label}</span>
                    </>
                  );
                })()}
              </div>
            )}

            <div className={styles.field}>
              <label className={styles.label} htmlFor="event-time">Time</label>
              <input
                id="event-time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>

            {selectedType === 'feeding' && (
              <FeedingFields
                feedingType={feedingType}
                onFeedingTypeChange={handleFeedingTypeChange}
                leftCount={leftCount}
                onLeftCountChange={setLeftCount}
                rightCount={rightCount}
                onRightCountChange={setRightCount}
                endTime={endTime}
                onEndTimeChange={setEndTime}
                infection={infection}
                onInfectionChange={setInfection}
                engorgement={engorgement}
                onEngorgementChange={setEngorgement}
              />
            )}

            {selectedType === 'poop' && (
              <div className={styles.field}>
                <label className={styles.label}>Color (optional)</label>
                <PoopFields
                  color={stoolColor}
                  onColorChange={setStoolColor}
                  warning={stoolColorWarning}
                />
              </div>
            )}

            {selectedType === 'medication' && (
              <MedicationFields
                medicationName={medicationName}
                onMedicationNameChange={setMedicationName}
                dose={dose}
                onDoseChange={setDose}
                maxLength={MAX_TEXT_LENGTH}
              />
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

            <div className={styles.actions}>
              <button
                className={styles.saveBtn}
                onClick={handleSave}
                disabled={saving || (selectedType === 'medication' && (!medicationName.trim() || !dose.trim()))}
              >
                {saving ? 'Saving...' : mode === 'edit' ? 'Update' : 'Save'}
              </button>

              {mode === 'edit' && (
                confirmDelete ? (
                  <div className={styles.deleteConfirm}>
                    <span>Delete this event?</span>
                    <button
                      className={styles.deleteConfirmBtn}
                      onClick={handleDelete}
                      disabled={deleting}
                    >
                      {deleting ? 'Deleting...' : 'Yes, delete'}
                    </button>
                    <button
                      className={styles.cancelBtn}
                      onClick={() => setConfirmDelete(false)}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    className={styles.deleteBtn}
                    onClick={() => setConfirmDelete(true)}
                  >
                    <Trash2 size={16} />
                    <span>Delete</span>
                  </button>
                )
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
