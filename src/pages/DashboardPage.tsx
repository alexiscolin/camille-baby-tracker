import { useState } from 'react';
import { useEvents } from '../hooks/useEvents';
import { computeSummary } from '../utils/summary';
import { EVENT_CONFIG, EVENT_TYPES } from '../utils/event-config';
import { SummaryCard } from '../components/SummaryCard';
import { EventTimeline } from '../components/EventTimeline';
import { DateNavigator } from '../components/DateNavigator';
import { CacheIndicator } from '../components/CacheIndicator';
import styles from './DashboardPage.module.css';

interface DashboardPageProps {
  familyId: string;
  babyId: string;
}

export function DashboardPage({ familyId, babyId }: DashboardPageProps) {
  const [date, setDate] = useState(new Date());
  const { events, loading, fromCache, hasPendingWrites } = useEvents(familyId, babyId, date);
  const summary = computeSummary(events);

  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <DateNavigator date={date} onDateChange={setDate} />
        <CacheIndicator fromCache={fromCache} hasPendingWrites={hasPendingWrites} />
      </div>

      <div className={styles.summaryGrid}>
        {EVENT_TYPES.map((type) => {
          const config = EVENT_CONFIG[type];
          const Icon = config.icon;
          return (
            <SummaryCard
              key={type}
              icon={<Icon size={20} />}
              label={config.label}
              count={summary[type]}
              colorVar={config.color}
              bgVar={config.bg}
            />
          );
        })}
      </div>

      <h2 className={styles.sectionTitle}>Timeline</h2>
      <EventTimeline events={events} />
    </div>
  );
}
