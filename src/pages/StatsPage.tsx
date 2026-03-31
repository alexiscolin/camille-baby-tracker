import { useState, useMemo } from 'react';
import { subDays } from 'date-fns';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { useRangeEvents } from '../hooks/useRangeEvents';
import { buildChartData } from '../utils/chart-data';
import { EVENT_CONFIG, EVENT_TYPES } from '../utils/event-config';
import { CacheIndicator } from '../components/CacheIndicator';
import styles from './StatsPage.module.css';

interface StatsPageProps {
  familyId: string;
  babyId: string;
}

type RangeType = '7d' | '14d' | '30d';
type ChartType = 'bar' | 'line';

export function StatsPage({ familyId, babyId }: StatsPageProps) {
  const [range, setRange] = useState<RangeType>('7d');
  const [chartType, setChartType] = useState<ChartType>('bar');

  const endDate = useMemo(() => new Date(), []);
  const startDate = useMemo(() => {
    const days = range === '7d' ? 7 : range === '14d' ? 14 : 30;
    return subDays(endDate, days);
  }, [range, endDate]);

  const { events, loading, fromCache } = useRangeEvents(familyId, babyId, startDate, endDate);
  const chartData = useMemo(
    () => buildChartData(events, startDate, endDate),
    [events, startDate, endDate],
  );

  if (loading) {
    return <div className={styles.loading}>Loading stats...</div>;
  }

  const COLORS = Object.fromEntries(
    EVENT_TYPES.map((t) => [t, EVENT_CONFIG[t].color]),
  ) as Record<string, string>;

  return (
    <div className={styles.page}>
      <div className={styles.titleRow}>
        <h1 className={styles.title}>Statistics</h1>
        <CacheIndicator fromCache={fromCache} />
      </div>

      <div className={styles.controls}>
        <div className={styles.segmented}>
          {(['7d', '14d', '30d'] as RangeType[]).map((r) => (
            <button
              key={r}
              className={`${styles.segmentBtn} ${range === r ? styles.segmentActive : ''}`}
              onClick={() => setRange(r)}
            >
              {r === '7d' ? '7 days' : r === '14d' ? '14 days' : '30 days'}
            </button>
          ))}
        </div>

        <div className={styles.segmented}>
          {(['bar', 'line'] as ChartType[]).map((ct) => (
            <button
              key={ct}
              className={`${styles.segmentBtn} ${chartType === ct ? styles.segmentActive : ''}`}
              onClick={() => setChartType(ct)}
            >
              {ct === 'bar' ? 'Bar' : 'Line'}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.chartContainer}>
        <ResponsiveContainer width="100%" height={300}>
          {chartType === 'bar' ? (
            <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-light)" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: '12px',
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  fontSize: '13px',
                }}
              />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="feeding" fill={COLORS.feeding} radius={[4, 4, 0, 0]} name="Feedings" />
              <Bar dataKey="pee" fill={COLORS.pee} radius={[4, 4, 0, 0]} name="Pees" />
              <Bar dataKey="poop" fill={COLORS.poop} radius={[4, 4, 0, 0]} name="Poops" />
              <Bar dataKey="medication" fill={COLORS.medication} radius={[4, 4, 0, 0]} name="Meds" />
            </BarChart>
          ) : (
            <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-light)" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: '12px',
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  fontSize: '13px',
                }}
              />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
              <Line type="monotone" dataKey="feeding" stroke={COLORS.feeding} strokeWidth={2} dot={{ r: 3 }} name="Feedings" />
              <Line type="monotone" dataKey="pee" stroke={COLORS.pee} strokeWidth={2} dot={{ r: 3 }} name="Pees" />
              <Line type="monotone" dataKey="poop" stroke={COLORS.poop} strokeWidth={2} dot={{ r: 3 }} name="Poops" />
              <Line type="monotone" dataKey="medication" stroke={COLORS.medication} strokeWidth={2} dot={{ r: 3 }} name="Meds" />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      <div className={styles.averages}>
        <h2 className={styles.subtitle}>Daily Averages</h2>
        <div className={styles.avgGrid}>
          {EVENT_TYPES.map((type) => {
            const total = chartData.reduce((sum, d) => sum + d[type], 0);
            const avg = chartData.length > 0 ? (total / chartData.length).toFixed(1) : '0';
            return (
              <div key={type} className={styles.avgCard}>
                <span className={styles.avgValue}>{avg}</span>
                <span className={styles.avgLabel}>{EVENT_CONFIG[type].label}/day</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
