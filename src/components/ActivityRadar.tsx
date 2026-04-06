import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import type { DailySummary } from '../types/events';
import { EVENT_CONFIG, EVENT_TYPES } from '../utils/event-config';

import styles from './ActivityRadar.module.css';

interface ActivityRadarProps {
  today: DailySummary;
  average: DailySummary;
  title?: string;
}

export function ActivityRadar({ today, average, title = 'Today vs Average' }: ActivityRadarProps) {
  const data = EVENT_TYPES.map((type) => ({
    subject: EVENT_CONFIG[type].label,
    today: today[type],
    average: Number(average[type]),
    fullMark: Math.max(today[type], Number(average[type]), 3) + 2,
  }));

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>{title}</h3>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="var(--color-border-light)" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fontSize: 12, fill: 'var(--color-text-secondary)', fontWeight: 500 }}
          />
          <PolarRadiusAxis
            tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }}
            axisLine={false}
            tickCount={4}
          />
          <Tooltip
            contentStyle={{
              borderRadius: '12px',
              border: 'none',
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              fontSize: '13px',
              padding: '10px 14px',
            }}
          />
          <Radar
            name="7-day avg"
            dataKey="average"
            stroke="var(--color-border)"
            fill="var(--color-border)"
            fillOpacity={0.15}
            strokeWidth={1.5}
            strokeDasharray="4 3"
          />
          <Radar
            name="Today"
            dataKey="today"
            stroke="var(--color-primary)"
            fill="var(--color-primary)"
            fillOpacity={0.25}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
      <div className={styles.legend}>
        <span className={styles.legendItem}>
          <span className={styles.legendDot} style={{ background: 'var(--color-primary)' }} />
          Today
        </span>
        <span className={styles.legendItem}>
          <span className={styles.legendDotDashed} />
          7-day avg
        </span>
      </div>
    </div>
  );
}
