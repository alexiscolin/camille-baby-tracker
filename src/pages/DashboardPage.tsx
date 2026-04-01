import { useState, useMemo, useRef, useEffect, useCallback, lazy, Suspense } from 'react';
import { subDays, startOfDay, endOfDay } from 'date-fns';
import { useToday } from '../hooks/useToday';
import { useRangeEvents } from '../hooks/useRangeEvents';
import { groupEventsByDay } from '../utils/event-groups';
import { buildChartData } from '../utils/chart-data';
import { getDayKey, parseDayKey, formatBabyAge } from '../utils/date';
import { computeSummary } from '../utils/summary';
import { EVENT_CONFIG, EVENT_TYPES } from '../utils/event-config';
import {
  computeAverageSummary,
  computeDailyAverages,
  getRangeDays,
} from '../utils/chart-helpers';
import type { RangeType, ChartType } from '../utils/chart-helpers';
import { CacheIndicator } from '../components/CacheIndicator';
import { QuickStats } from '../components/QuickStats';
import { SummaryCard } from '../components/SummaryCard';
import { CalendarStrip } from '../components/CalendarStrip';
import { DaySection } from '../components/DaySection';
import { EventModal } from '../components/EventModal';
import { SegmentedControl } from '../components/SegmentedControl';
import type { BabyEvent, Baby } from '../types/events';
import styles from './DashboardPage.module.css';

const ActivityRadar = lazy(() =>
  import('../components/ActivityRadar').then((m) => ({ default: m.ActivityRadar })),
);

const LazyBarChart = lazy(() =>
  import('./DashboardChart').then((m) => ({ default: m.DashboardChart })),
);

const DAYS_PER_PAGE = 7;

const RANGE_OPTIONS = ['7d', '14d', '30d'] as const;
const RANGE_LABELS: Record<RangeType, string> = { '7d': '7d', '14d': '14d', '30d': '30d' };
const CHART_TYPE_OPTIONS = ['line', 'bar'] as const;
const CHART_TYPE_LABELS: Record<ChartType, string> = { line: 'Line', bar: 'Bar' };

interface DashboardPageProps {
  familyId: string;
  babyId: string;
  userId: string;
  baby: Baby | null;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 6) return 'Good night';
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function DashboardPage({ familyId, babyId, userId, baby }: DashboardPageProps) {
  const mainPanelRef = useRef<HTMLDivElement>(null);
  const timelinePanelRef = useRef<HTMLDivElement>(null);

  const syncTimelineHeight = useCallback(() => {
    if (mainPanelRef.current && timelinePanelRef.current) {
      const h = mainPanelRef.current.offsetHeight;
      timelinePanelRef.current.style.setProperty('--timeline-height', `${h}px`);
    }
  }, []);

  useEffect(() => {
    syncTimelineHeight();
    const observer = new ResizeObserver(syncTimelineHeight);
    if (mainPanelRef.current) observer.observe(mainPanelRef.current);
    return () => observer.disconnect();
  }, [syncTimelineHeight]);

  const [daysToLoad, setDaysToLoad] = useState(DAYS_PER_PAGE);
  const [editEvent, setEditEvent] = useState<BabyEvent | null>(null);
  const [addDate, setAddDate] = useState<Date | null>(null);
  const [scrollToDay, setScrollToDay] = useState<string | null>(null);
  const [chartRange, setChartRange] = useState<RangeType>('7d');
  const [chartType, setChartType] = useState<ChartType>('line');

  const today = useToday();

  // Single subscription: use the widest range needed (max of timeline days and chart days)
  const chartDays = getRangeDays(chartRange);
  const maxDays = Math.max(daysToLoad, chartDays);
  const rangeStart = useMemo(() => startOfDay(subDays(today, maxDays)), [today, maxDays]);
  const rangeEnd = useMemo(() => endOfDay(today), [today]);
  const { events: allEvents, loading, fromCache } = useRangeEvents(familyId, babyId, rangeStart, rangeEnd);

  // Chart data: filter events to chart range
  const chartStart = useMemo(() => startOfDay(subDays(today, chartDays)), [today, chartDays]);
  const chartEvents = useMemo(
    () => allEvents.filter((e) => e.timestamp.toDate() >= chartStart),
    [allEvents, chartStart],
  );
  const chartData = useMemo(
    () => buildChartData(chartEvents, chartStart, today),
    [chartEvents, chartStart, today],
  );

  // Today's summary — reuse eventsByDay instead of re-filtering
  const todayKey = getDayKey(today);
  const eventsByDay = useMemo(() => groupEventsByDay(allEvents), [allEvents]);
  const todayEvents = useMemo(
    () => eventsByDay.get(todayKey) ?? [],
    [eventsByDay, todayKey],
  );
  const todaySummary = useMemo(() => computeSummary(todayEvents), [todayEvents]);

  // Shared computed values from chart-helpers
  const avgSummary = useMemo(() => computeAverageSummary(chartData), [chartData]);
  const averages = useMemo(() => computeDailyAverages(chartData), [chartData]);

  // Re-sync timeline height after lazy-loaded charts render or data changes
  useEffect(() => {
    const raf = requestAnimationFrame(syncTimelineHeight);
    return () => cancelAnimationFrame(raf);
  }, [syncTimelineHeight, loading, chartData.length]);

  // Timeline day keys
  const dayKeys = useMemo(() => {
    const keys: string[] = [];
    for (let i = 0; i < daysToLoad; i++) {
      keys.push(getDayKey(subDays(today, i)));
    }
    return keys;
  }, [today, daysToLoad]);

  const daySectionRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  function handleCalendarSelect(date: Date) {
    const key = getDayKey(date);
    setScrollToDay(key);
    const el = daySectionRefs.current.get(key);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  if (loading && allEvents.length === 0) {
    return <div className={styles.loading}>Loading...</div>;
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <h1 className={styles.greeting}>
          {getGreeting()}
          {baby && <span className={styles.babyName}> — {baby.firstName}</span>}
        </h1>
        <div className={styles.headerRight}>
          {baby && (
            <span className={styles.babyAge}>{formatBabyAge(baby.birthDate.toDate())}</span>
          )}
          <CacheIndicator fromCache={fromCache} hasPendingWrites={false} />
        </div>
      </div>

      <div className={styles.dashboard}>
        {/* Left: Main content */}
        <div className={styles.mainPanel} ref={mainPanelRef}>
          <QuickStats todayEvents={todayEvents} recentEvents={allEvents} />

          {/* Today's summary row (desktop) */}
          <div className={styles.todaySummary}>
            {EVENT_TYPES.map((type) => {
              const config = EVENT_CONFIG[type];
              const Icon = config.icon;
              return (
                <SummaryCard
                  key={type}
                  icon={<Icon size={22} />}
                  label={config.label}
                  count={todaySummary[type]}
                  colorVar={config.color}
                  bgVar={config.bg}
                />
              );
            })}
          </div>

          {/* Chart + Radar row */}
          <div className={styles.chartRadarRow}>
            <div className={styles.chartSection}>
              <div className={styles.chartHeader}>
                <div>
                  <h2 className={styles.chartTitle}>
                    Daily activity
                    <span className={styles.chartRange}>
                      {chartRange === '7d' ? 'last 7 days' : chartRange === '14d' ? 'last 14 days' : 'last 30 days'}
                    </span>
                  </h2>
                  <span className={styles.chartSubtitle}>
                    Grand total: {chartData.reduce((s, d) => s + d.feeding + d.pee + d.poop + d.medication, 0)} events
                  </span>
                </div>
                <div className={styles.chartControls}>
                  <SegmentedControl
                    options={RANGE_OPTIONS}
                    value={chartRange}
                    onChange={setChartRange}
                    labels={RANGE_LABELS}
                  />
                  <SegmentedControl
                    options={CHART_TYPE_OPTIONS}
                    value={chartType}
                    onChange={setChartType}
                    labels={CHART_TYPE_LABELS}
                  />
                </div>
              </div>

              <div className={styles.chartContainer}>
                <Suspense fallback={<div className={styles.loading}>Loading chart...</div>}>
                  <LazyBarChart chartData={chartData} chartType={chartType} />
                </Suspense>
              </div>

              {/* Averages row under chart */}
              <div className={styles.averagesRow}>
                {EVENT_TYPES.map((type) => {
                  const config = EVENT_CONFIG[type];
                  const Icon = config.icon;
                  return (
                    <div key={type} className={styles.avgItem}>
                      <Icon size={14} style={{ color: config.color }} />
                      <span className={styles.avgValue} style={{ color: config.color }}>
                        ~{averages[type]}
                      </span>
                      <span className={styles.avgLabel}>{config.label}/day</span>
                    </div>
                  );
                })}
              </div>
            </div>
            {/* Radar (desktop only) */}
            <div className={styles.radarCol}>
              <Suspense fallback={null}>
                <ActivityRadar today={todaySummary} average={avgSummary} />
              </Suspense>
            </div>
          </div>
        </div>

        {/* Right: Timeline */}
        <div className={styles.timelinePanel} ref={timelinePanelRef}>
          <div className={styles.timelineHeader}>
            <h2 className={styles.timelineTitle}>Timeline</h2>
          </div>
          <CalendarStrip
            days={daysToLoad}
            selectedDate={scrollToDay ? parseDayKey(scrollToDay) : null}
            onSelectDate={handleCalendarSelect}
            onLoadMore={() => setDaysToLoad((prev) => prev + DAYS_PER_PAGE)}
          />
          <div className={styles.timeline}>
            {dayKeys.map((key) => {
              const dayEvents = eventsByDay.get(key) ?? [];
              const date = parseDayKey(key);
              return (
                <div
                  key={key}
                  ref={(el) => {
                    if (el) daySectionRefs.current.set(key, el);
                    else daySectionRefs.current.delete(key);
                  }}
                >
                  <DaySection
                    date={date}
                    events={dayEvents}
                    onEventClick={(event) => setEditEvent(event)}
                    onAddClick={() => setAddDate(date)}
                    showHourMarkers
                  />
                </div>
              );
            })}
          </div>
          <button
            className={styles.loadMoreBtn}
            onClick={() => setDaysToLoad((prev) => prev + DAYS_PER_PAGE)}
          >
            Load earlier days
          </button>
        </div>
      </div>

      {editEvent && (
        <EventModal
          mode="edit"
          event={editEvent}
          familyId={familyId}
          babyId={babyId}
          userId={userId}
          babyBirthDate={baby?.birthDate.toDate()}
          onClose={() => setEditEvent(null)}
        />
      )}

      {addDate && (
        <EventModal
          mode="add"
          date={addDate}
          familyId={familyId}
          babyId={babyId}
          userId={userId}
          babyBirthDate={baby?.birthDate.toDate()}
          onClose={() => setAddDate(null)}
        />
      )}
    </div>
  );
}
