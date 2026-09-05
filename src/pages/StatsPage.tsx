import { useState, useMemo, useCallback, lazy, Suspense } from 'react';
import { subDays, startOfDay, endOfDay } from 'date-fns';
import {
  TrendingUp,
  Timer,
  Clock,
  Activity,
  Zap,
  Salad,
  Sprout,
  Percent,
} from 'lucide-react';
import { useToday } from '../hooks/useToday';
import { useRangeEvents } from '../hooks/useRangeEvents';
import { buildChartData } from '../utils/chart-data';
import { formatBabyAge } from '../utils/date';

import {
  getDayNightSplit,
  getFeedingHourDistribution,
  buildFeedingDurationTrend,
  buildFeedingIntervalTrend,
  buildLRTrend,
  buildAcceptanceTrend,
  getAverageFeedingInterval,
  getMealSlotDistribution,
  getNewFoodsCount,
  getAcceptanceRate,
  isTypeActive,
} from '../utils/quick-stats';
import {
  computeAverageSummary,
  computeDailyAverages,
  getRangeDays,
} from '../utils/chart-helpers';
import { MIN_RADAR_AXES } from '../utils/event-config';
import { useVisibleRateTypes, useVisibleEventTypes } from '../hooks/useVisibleEventTypes';
import { QUICK_STATS_LOOKBACK_DAYS } from '../components/QuickStatsCards';
import type { RangeType, ChartType } from '../utils/chart-helpers';
import { CacheIndicator } from '../components/CacheIndicator';
import { SegmentedControl } from '../components/SegmentedControl';
import { computeSummary } from '../utils/summary';
import { getDayKey } from '../utils/date';
import type { Baby, EventType } from '../types/events';
import styles from './StatsPage.module.css';

const ActivityRadar = lazy(() =>
  import('../components/ActivityRadar').then((m) => ({ default: m.ActivityRadar })),
);

const StatsCharts = lazy(() =>
  import('./StatsCharts').then((m) => ({ default: m.StatsCharts })),
);

interface StatsPageProps {
  familyId: string;
  babyId: string;
  baby: Baby | null;
}

const RANGE_OPTIONS = ['7d', '14d', '30d'] as const;
const RANGE_LABELS: Record<RangeType, string> = { '7d': '7 days', '14d': '14 days', '30d': '30 days' };
const CHART_TYPE_OPTIONS = ['line', 'bar'] as const;
const CHART_TYPE_LABELS: Record<ChartType, string> = { line: 'Line', bar: 'Bar' };

/** Same windows the dashboard tiles use; see `isTypeActive`. */
const FEEDING_LOOKBACK_DAYS = 7;
const MEAL_LOOKBACK_DAYS = 7;

export function StatsPage({ familyId, babyId, baby }: StatsPageProps) {
  const [range, setRange] = useState<RangeType>('7d');
  const [chartType, setChartType] = useState<ChartType>('line');

  const today = useToday();
  const rateTypes = useVisibleRateTypes();
  const days = getRangeDays(range);
  const startDate = useMemo(() => startOfDay(subDays(today, days)), [today, days]);
  const endDate = useMemo(() => endOfDay(today), [today]);

  /**
   * The relevance test looks back further than the selected range — a bath is
   * fortnightly and a milestone rarer still, so a 7-day subscription would
   * report both as abandoned. Everything below reads `events`, the slice that
   * actually belongs to the range; only the test reads the wider set.
   */
  const relevanceStart = useMemo(
    () => startOfDay(subDays(today, Math.max(days, QUICK_STATS_LOOKBACK_DAYS))),
    [today, days],
  );
  const {
    events: loadedEvents, loading, fromCache, hasPendingWrites,
  } = useRangeEvents(familyId, babyId, relevanceStart, endDate);
  const events = useMemo(
    () => loadedEvents.filter((e) => e.timestamp.toDate() >= startDate),
    [loadedEvents, startDate],
  );

  const chartData = useMemo(
    () => buildChartData(events, startDate, today),
    [events, startDate, today],
  );

  const dayLabels = useMemo(
    () => chartData.map((d) => ({ date: d.date, label: d.label })),
    [chartData],
  );

  const durationTrend = useMemo(() => buildFeedingDurationTrend(events, dayLabels), [events, dayLabels]);
  const intervalTrend = useMemo(() => buildFeedingIntervalTrend(events, dayLabels), [events, dayLabels]);
  const lrTrend = useMemo(() => buildLRTrend(events, dayLabels), [events, dayLabels]);
  const dayNight = useMemo(() => getDayNightSplit(events), [events]);
  const hourDist = useMemo(() => getFeedingHourDistribution(events), [events]);
  const avgInterval = useMemo(() => getAverageFeedingInterval(events), [events]);

  const visibleTypes = useVisibleEventTypes();
  const isActive = useCallback(
    (type: EventType, lookbackDays: number) =>
      visibleTypes.includes(type) && isTypeActive(loadedEvents, type, lookbackDays, today),
    [visibleTypes, loadedEvents, today],
  );
  const feedingActive = isActive('feeding', FEEDING_LOOKBACK_DAYS);
  const mealActive = isActive('meal', MEAL_LOOKBACK_DAYS);

  const slotDist = useMemo(() => getMealSlotDistribution(events), [events]);
  const acceptanceTrend = useMemo(
    () => buildAcceptanceTrend(events, dayLabels),
    [events, dayLabels],
  );
  const newFoods = useMemo(
    () => getNewFoodsCount(loadedEvents, days, today),
    [loadedEvents, days, today],
  );
  const acceptance = useMemo(
    () => getAcceptanceRate(loadedEvents, days, today),
    [loadedEvents, days, today],
  );

  const totalEvents = events.length;
  const totalFeedings = events.filter((e) => e.type === 'feeding').length;
  const totalMeals = events.filter((e) => e.type === 'meal').length;

  const averages = useMemo(() => computeDailyAverages(chartData), [chartData]);

  // Today's summary + average for radar
  const todayKey = getDayKey(today);
  const todaySummary = useMemo(() => {
    const todayEvts = events.filter(
      (e) => getDayKey(e.timestamp.toDate()) === todayKey,
    );
    return computeSummary(todayEvts);
  }, [events, todayKey]);

  const avgSummary = useMemo(() => computeAverageSummary(chartData), [chartData]);

  // Find busiest day
  const busiestDay = useMemo(() => {
    if (chartData.length === 0) return null;
    let max = 0;
    let maxDay = chartData[0];
    for (const d of chartData) {
      const total = rateTypes.reduce<number>((sum, type) => sum + d[type], 0);
      if (total > max) { max = total; maxDay = d; }
    }
    return { label: maxDay.label, count: max };
  }, [chartData, rateTypes]);

  // Peak feeding hour
  const peakHour = useMemo(() => {
    const max = hourDist.reduce((best, h) => h.count > best.count ? h : best, hourDist[0]);
    return max?.count > 0 ? max : null;
  }, [hourDist]);

  if (loading) {
    return <div className={styles.loading}>Loading stats...</div>;
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Statistics</h1>
          {baby && (
            <p className={styles.subtitle}>
              {baby.firstName} — {formatBabyAge(baby.birthDate.toDate())}
            </p>
          )}
        </div>
        <CacheIndicator fromCache={fromCache} hasPendingWrites={hasPendingWrites} />
      </div>

      {/* Controls */}
      <div className={styles.controls}>
        <SegmentedControl options={RANGE_OPTIONS} value={range} onChange={setRange} labels={RANGE_LABELS} />
        <SegmentedControl options={CHART_TYPE_OPTIONS} value={chartType} onChange={setChartType} labels={CHART_TYPE_LABELS} />
      </div>

      {/* Key Metrics Row */}
      <div className={styles.metricsRow}>
        <div className={styles.metricCard}>
          <div className={styles.metricIcon} style={{ background: 'var(--color-primary-bg)', color: 'var(--color-primary)' }}>
            <Activity size={20} />
          </div>
          <div className={styles.metricContent}>
            <span className={styles.metricValue}>{totalEvents}</span>
            <span className={styles.metricLabel}>Total events</span>
          </div>
        </div>
        {feedingActive && (
          <>
            <div className={styles.metricCard}>
              <div className={styles.metricIcon} style={{ background: 'var(--color-feeding-bg)', color: 'var(--color-feeding)' }}>
                <TrendingUp size={20} />
              </div>
              <div className={styles.metricContent}>
                <span className={styles.metricValue}>{totalFeedings}</span>
                <span className={styles.metricLabel}>Total feedings</span>
              </div>
            </div>
            <div className={styles.metricCard}>
              <div className={styles.metricIcon} style={{ background: 'var(--color-pee-bg)', color: 'var(--color-pee)' }}>
                <Timer size={20} />
              </div>
              <div className={styles.metricContent}>
                <span className={styles.metricValue}>{avgInterval?.label ?? '—'}</span>
                <span className={styles.metricLabel}>Avg interval</span>
              </div>
            </div>
          </>
        )}
        {mealActive && (
          <>
            <div className={styles.metricCard}>
              <div className={styles.metricIcon} style={{ background: 'var(--color-meal-bg)', color: 'var(--color-meal)' }}>
                <Salad size={20} />
              </div>
              <div className={styles.metricContent}>
                <span className={styles.metricValue}>{totalMeals}</span>
                <span className={styles.metricLabel}>Total meals</span>
              </div>
            </div>
            <div className={styles.metricCard}>
              <div className={styles.metricIcon} style={{ background: 'var(--color-meal-bg)', color: 'var(--color-meal)' }}>
                <Sprout size={20} />
              </div>
              <div className={styles.metricContent}>
                <span className={styles.metricValue}>{newFoods}</span>
                <span className={styles.metricLabel}>New foods ({range})</span>
              </div>
            </div>
            {acceptance && (
              <div className={styles.metricCard}>
                <div className={styles.metricIcon} style={{ background: 'var(--color-meal-bg)', color: 'var(--color-meal)' }}>
                  <Percent size={20} />
                </div>
                <div className={styles.metricContent}>
                  <span className={styles.metricValue}>{acceptance.percent}%</span>
                  <span className={styles.metricLabel}>Eaten ({acceptance.sampled} served)</span>
                </div>
              </div>
            )}
          </>
        )}
        {busiestDay && (
          <div className={styles.metricCard}>
            <div className={styles.metricIcon} style={{ background: 'var(--color-poop-bg)', color: 'var(--color-poop)' }}>
              <Zap size={20} />
            </div>
            <div className={styles.metricContent}>
              <span className={styles.metricValue}>{busiestDay.count}</span>
              <span className={styles.metricLabel}>Busiest day ({busiestDay.label})</span>
            </div>
          </div>
        )}
        {feedingActive && peakHour && (
          <div className={styles.metricCard}>
            <div className={styles.metricIcon} style={{ background: 'var(--color-medication-bg)', color: 'var(--color-medication)' }}>
              <Clock size={20} />
            </div>
            <div className={styles.metricContent}>
              <span className={styles.metricValue}>{peakHour.label}</span>
              <span className={styles.metricLabel}>Peak feeding hour ({peakHour.count}x)</span>
            </div>
          </div>
        )}
      </div>

      {/* Charts — lazy loaded */}
      <Suspense fallback={<div className={styles.loading}>Loading charts...</div>}>
        <StatsCharts
          chartData={chartData}
          chartType={chartType}
          totalEvents={totalEvents}
          averages={averages}
          todaySummary={todaySummary}
          avgSummary={avgSummary}
          range={range}
          dayNight={dayNight}
          lrTrend={lrTrend}
          intervalTrend={intervalTrend}
          durationTrend={durationTrend}
          hourDist={hourDist}
          feedingActive={feedingActive}
          mealActive={mealActive}
          slotDist={slotDist}
          acceptanceTrend={acceptanceTrend}
        />
      </Suspense>

      {/* Today vs Average Radar */}
      {rateTypes.length >= MIN_RADAR_AXES && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <Activity size={20} className={styles.sectionIcon} />
            <h2 className={styles.sectionTitle}>Today vs Average</h2>
            <span className={styles.sectionHint}>How today compares to the {range} average</span>
          </div>
          <Suspense fallback={null}>
            <ActivityRadar today={todaySummary} average={avgSummary} />
          </Suspense>
        </section>
      )}
    </div>
  );
}
