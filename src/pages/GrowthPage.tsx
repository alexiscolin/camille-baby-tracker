import { useState, useMemo } from 'react';
import { Timestamp } from 'firebase/firestore';
import { format, differenceInMonths, differenceInDays } from 'date-fns';
import {
  TrendingUp,
  Ruler,
  Weight,
  CircleDot,
  Trash2,
  AlertCircle,
  Info,
} from 'lucide-react';
import { useMeasurements } from '../hooks/useMeasurements';
import { addMeasurement, deleteMeasurement } from '../services/measurements';
import { CacheIndicator } from '../components/CacheIndicator';
import { SegmentedControl } from '../components/SegmentedControl';
import { GrowthChart } from '../components/GrowthChart';
import {
  estimatePercentileRange,
  METRIC_LABELS,
  METRIC_UNITS,
} from '../utils/who-growth-data';
import type { GrowthMetric } from '../utils/who-growth-data';
import type { MeasurementType } from '../types/measurements';
import type { Baby } from '../types/events';
import { formatBabyAge } from '../utils/date';
import styles from './GrowthPage.module.css';

interface GrowthPageProps {
  familyId: string;
  babyId: string;
  userId: string;
  baby: Baby | null;
}

const METRIC_OPTIONS = ['weight', 'height', 'head'] as const;
const METRIC_OPTION_LABELS: Record<GrowthMetric, string> = METRIC_LABELS;

const METRIC_ICONS: Record<GrowthMetric, typeof Weight> = {
  weight: Weight,
  height: Ruler,
  head: CircleDot,
};

function getAgeMonths(birthDate: Date, measureDate: Date): number {
  const months = differenceInMonths(measureDate, birthDate);
  const days = differenceInDays(measureDate, birthDate);
  return months + (days % 30.44) / 30.44;
}

export function GrowthPage({ familyId, babyId, userId, baby }: GrowthPageProps) {
  const [selectedMetric, setSelectedMetric] = useState<GrowthMetric>('weight');
  const [measureDate, setMeasureDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [measureValue, setMeasureValue] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const {
    measurements, loading, fromCache, hasPendingWrites, error: loadError,
  } = useMeasurements(familyId, babyId);

  const babySex = baby?.sex;
  const birthDate = baby?.birthDate.toDate();

  const filteredMeasurements = useMemo(
    () => measurements.filter((m) => m.type === selectedMetric),
    [measurements, selectedMetric],
  );

  const percentileHint = useMemo(() => {
    if (!babySex || !birthDate || !measureValue) return null;
    const val = parseFloat(measureValue);
    if (isNaN(val) || val <= 0) return null;
    const date = new Date(measureDate);
    if (isNaN(date.getTime())) return null;
    const ageMonths = getAgeMonths(birthDate, date);
    if (ageMonths < 0 || ageMonths > 24) return null;
    return estimatePercentileRange(selectedMetric, babySex, ageMonths, val);
  }, [babySex, birthDate, measureValue, measureDate, selectedMetric]);

  async function handleAdd() {
    const val = parseFloat(measureValue);
    if (isNaN(val) || val <= 0) {
      setError('Please enter a valid value');
      return;
    }
    const date = new Date(measureDate);
    if (isNaN(date.getTime())) {
      setError('Please enter a valid date');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await addMeasurement(familyId, {
        babyId,
        type: selectedMetric as MeasurementType,
        value: val,
        date: Timestamp.fromDate(date),
        createdBy: userId,
        notes: notes.trim() || undefined,
      });
      setMeasureValue('');
      setNotes('');
    } catch (saveFailed) {
      // Not "please try again": the write that broke this was rejected
      // identically every time, and a generic message hid that for weeks.
      setError(
        saveFailed instanceof Error
          ? `Could not save — ${saveFailed.message}`
          : 'Could not save this measurement.',
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(measurementId: string) {
    try {
      await deleteMeasurement(familyId, measurementId);
    } catch (deleteFailed) {
      setError(
        deleteFailed instanceof Error
          ? `Could not delete — ${deleteFailed.message}`
          : 'Could not delete this measurement.',
      );
    }
  }

  if (loading) {
    return <div className={styles.loading}>Loading growth data...</div>;
  }

  const Icon = METRIC_ICONS[selectedMetric];

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Growth</h1>
          {baby && (
            <p className={styles.subtitle}>
              {baby.firstName} — {formatBabyAge(baby.birthDate.toDate())}
            </p>
          )}
        </div>
        <CacheIndicator fromCache={fromCache} hasPendingWrites={hasPendingWrites} />
      </div>

      {/*
        * Distinct from the form's `error` below: this one means the list on
        * screen is not the family's data. Without it a refused read looks
        * exactly like a family that has not measured anything yet.
        */}
      {loadError && (
        <div className={styles.loadError} role="alert">
          <AlertCircle size={16} />
          <span>Could not load measurements — {loadError}</span>
        </div>
      )}

      {/* Metric Selector */}
      <div className={styles.controls}>
        <SegmentedControl
          options={METRIC_OPTIONS}
          value={selectedMetric}
          onChange={setSelectedMetric}
          labels={METRIC_OPTION_LABELS}
        />
      </div>

      {/* No Sex Notice */}
      {!babySex && (
        <div className={styles.noSexNotice}>
          <Info size={16} />
          <span>Set baby's sex in settings to see WHO percentile curves.</span>
        </div>
      )}

      {/* Add Measurement Form */}
      <div className={styles.addSection}>
        <h2 className={styles.addTitle}>Add {METRIC_LABELS[selectedMetric]} Measurement</h2>
        <div className={styles.addForm}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="measure-date">Date</label>
            <input
              id="measure-date"
              type="date"
              value={measureDate}
              onChange={(e) => setMeasureDate(e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="measure-value">{METRIC_LABELS[selectedMetric]} ({METRIC_UNITS[selectedMetric]})</label>
            <input
              id="measure-value"
              type="number"
              step="0.1"
              min="0"
              value={measureValue}
              onChange={(e) => setMeasureValue(e.target.value)}
              placeholder={`e.g. ${selectedMetric === 'weight' ? '3.5' : '50.0'}`}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="measure-notes">Notes (optional)</label>
            <input
              id="measure-notes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value.slice(0, 200))}
              placeholder="e.g. clinic visit"
              maxLength={200}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>&nbsp;</label>
            <button
              className={styles.addBtn}
              onClick={handleAdd}
              disabled={saving || !measureValue}
            >
              {saving ? 'Saving...' : 'Add'}
            </button>
          </div>
        </div>
        {percentileHint && (
          <div className={styles.percentileHint}>
            {METRIC_LABELS[selectedMetric]}: {percentileHint}
          </div>
        )}
        {error && (
          <div className={styles.error}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Growth Chart */}
      {babySex && birthDate && (
        <div className={styles.chartSection}>
          <div className={styles.sectionHeader}>
            <Icon size={20} className={styles.sectionIcon} />
            <h2 className={styles.sectionTitle}>{METRIC_LABELS[selectedMetric]} Curve</h2>
          </div>
          <div className={styles.chartCard}>
            <GrowthChart
              metric={selectedMetric}
              sex={babySex}
              birthDate={birthDate}
              measurements={filteredMeasurements}
            />
          </div>
        </div>
      )}

      {/* Measurements List */}
      <div className={styles.chartSection}>
        <div className={styles.sectionHeader}>
          <TrendingUp size={20} className={styles.sectionIcon} />
          <h2 className={styles.sectionTitle}>History</h2>
        </div>
        {filteredMeasurements.length === 0 ? (
          <div className={styles.measurementsList}>
            <div className={styles.empty}>
              No {METRIC_LABELS[selectedMetric].toLowerCase()} measurements yet
            </div>
          </div>
        ) : (
          <div className={styles.measurementsList}>
            {[...filteredMeasurements].reverse().map((m) => {
              const ageMonths = birthDate ? getAgeMonths(birthDate, m.date.toDate()) : null;
              const percentile = babySex && ageMonths !== null && ageMonths >= 0 && ageMonths <= 24
                ? estimatePercentileRange(selectedMetric, babySex, ageMonths, m.value)
                : null;
              return (
                <div key={m.id} className={styles.measurementRow}>
                  <span className={styles.measurementValue}>
                    {m.value}
                    <span className={styles.measurementUnit}> {METRIC_UNITS[selectedMetric]}</span>
                  </span>
                  <span className={styles.measurementDate}>
                    {format(m.date.toDate(), 'MMM d, yyyy')}
                    {ageMonths !== null && ` (${Math.floor(ageMonths)}m)`}
                  </span>
                  {percentile && (
                    <span className={styles.measurementPercentile}>{percentile}</span>
                  )}
                  <button
                    className={styles.deleteBtn}
                    onClick={() => handleDelete(m.id)}
                    aria-label="Delete measurement"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
