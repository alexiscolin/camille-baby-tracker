import { memo } from 'react';
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
  AreaChart,
  Area,
} from 'recharts';
import {
  TrendingUp,
  Moon,
  Sun,
  ArrowLeftRight,
  Timer,
  Clock,
  BarChart3,
  Calendar,
  Layers,
} from 'lucide-react';
import type { ChartDataPoint } from '../utils/chart-data';
import type { ChartType, RangeType } from '../utils/chart-helpers';
import { CHART_COLORS, TOOLTIP_STYLE } from '../utils/chart-helpers';
import { EVENT_CONFIG, EVENT_TYPES } from '../utils/event-config';
import type { DailySummary } from '../types/events';
import type {
  DayNightSplit,
  LRTrendPoint,
  IntervalTrendPoint,
  DurationTrendPoint,
  HourDistribution,
} from '../utils/quick-stats';
import styles from './StatsPage.module.css';

const AXIS_TICK = { fontSize: 12, fill: 'var(--color-text-muted)' };
const AXIS_TICK_SM = { fontSize: 11, fill: 'var(--color-text-muted)' };
const AXIS_LINE = { stroke: 'var(--color-border-light)' };
const MARGIN = { top: 10, right: 10, left: -10, bottom: 5 };
const MARGIN_TIGHT = { top: 10, right: 10, left: -15, bottom: 5 };
const MARGIN_NARROW = { top: 10, right: 10, left: -5, bottom: 5 };

interface StatsChartsProps {
  chartData: ChartDataPoint[];
  chartType: ChartType;
  totalEvents: number;
  averages: Record<string, string>;
  todaySummary: DailySummary;
  avgSummary: DailySummary;
  range: RangeType;
  dayNight: DayNightSplit;
  lrTrend: LRTrendPoint[];
  intervalTrend: IntervalTrendPoint[];
  durationTrend: DurationTrendPoint[];
  hourDist: HourDistribution[];
}

export const StatsCharts = memo(function StatsCharts({
  chartData,
  chartType,
  totalEvents,
  averages,
  dayNight,
  lrTrend,
  intervalTrend,
  durationTrend,
  hourDist,
}: StatsChartsProps) {
  return (
    <>
      {/* Main Chart */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <BarChart3 size={20} className={styles.sectionIcon} />
          <h2 className={styles.sectionTitle}>Daily Overview</h2>
          <span className={styles.sectionHint}>Grand total: {totalEvents} events</span>
        </div>
        <div className={styles.chartCard}>
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'bar' ? (
              <BarChart data={chartData} margin={MARGIN}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-light)" />
                <XAxis dataKey="label" tick={AXIS_TICK} tickLine={false} axisLine={AXIS_LINE} />
                <YAxis allowDecimals={false} tick={AXIS_TICK} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '13px', paddingTop: '8px' }} />
                <Bar dataKey="feeding" fill={CHART_COLORS.feeding} radius={[4, 4, 0, 0]} name="Feedings" />
                <Bar dataKey="pee" fill={CHART_COLORS.pee} radius={[4, 4, 0, 0]} name="Pees" />
                <Bar dataKey="poop" fill={CHART_COLORS.poop} radius={[4, 4, 0, 0]} name="Poops" />
                <Bar dataKey="medication" fill={CHART_COLORS.medication} radius={[4, 4, 0, 0]} name="Meds" />
              </BarChart>
            ) : (
              <LineChart data={chartData} margin={MARGIN}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-light)" />
                <XAxis dataKey="label" tick={AXIS_TICK} tickLine={false} axisLine={AXIS_LINE} />
                <YAxis allowDecimals={false} tick={AXIS_TICK} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '13px', paddingTop: '8px' }} />
                <Line type="monotone" dataKey="feeding" stroke={CHART_COLORS.feeding} strokeWidth={2.5} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} name="Feedings" />
                <Line type="monotone" dataKey="pee" stroke={CHART_COLORS.pee} strokeWidth={2.5} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} name="Pees" />
                <Line type="monotone" dataKey="poop" stroke={CHART_COLORS.poop} strokeWidth={2.5} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} name="Poops" />
                <Line type="monotone" dataKey="medication" stroke={CHART_COLORS.medication} strokeWidth={2.5} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} name="Meds" />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </section>

      {/* Stacked Area: Daily Distribution */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <Layers size={20} className={styles.sectionIcon} />
          <h2 className={styles.sectionTitle}>Daily Distribution</h2>
          <span className={styles.sectionHint}>Proportion of each event type per day</span>
        </div>
        <div className={styles.chartCard}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={MARGIN}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-light)" />
              <XAxis dataKey="label" tick={AXIS_TICK} tickLine={false} axisLine={AXIS_LINE} />
              <YAxis allowDecimals={false} tick={AXIS_TICK} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '13px', paddingTop: '8px' }} />
              <Area type="monotone" dataKey="feeding" stackId="1" stroke={CHART_COLORS.feeding} fill={CHART_COLORS.feeding} fillOpacity={0.6} name="Feedings" />
              <Area type="monotone" dataKey="pee" stackId="1" stroke={CHART_COLORS.pee} fill={CHART_COLORS.pee} fillOpacity={0.5} name="Pees" />
              <Area type="monotone" dataKey="poop" stackId="1" stroke={CHART_COLORS.poop} fill={CHART_COLORS.poop} fillOpacity={0.5} name="Poops" />
              <Area type="monotone" dataKey="medication" stackId="1" stroke={CHART_COLORS.medication} fill={CHART_COLORS.medication} fillOpacity={0.5} name="Meds" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Daily Averages */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <TrendingUp size={20} className={styles.sectionIcon} />
          <h2 className={styles.sectionTitle}>Daily Averages</h2>
        </div>
        <div className={styles.avgGrid}>
          {EVENT_TYPES.map((type) => {
            const config = EVENT_CONFIG[type];
            const Icon = config.icon;
            return (
              <div key={type} className={styles.avgCard}>
                <div className={styles.avgIcon} style={{ color: config.color, background: config.bg }}>
                  <Icon size={18} />
                </div>
                <span className={styles.avgValue}>~{averages[type] ?? '0'}</span>
                <span className={styles.avgLabel}>{config.label}/day</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Two-column grid for smaller charts */}
      <div className={styles.chartsGrid}>
        {/* Day/Night */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <Sun size={20} className={styles.sectionIcon} />
            <Moon size={20} className={styles.sectionIcon} />
            <h2 className={styles.sectionTitle}>Day vs Night</h2>
          </div>
          <div className={styles.dayNightCard}>
            <p className={styles.hint}>Day: 6:00–20:00 / Night: 20:00–6:00</p>
            <div className={styles.dayNightBar}>
              {dayNight.day + dayNight.night > 0 ? (
                <>
                  <div className={styles.dayBar} style={{ flex: dayNight.day || 0.1 }}>
                    <Sun size={14} />
                    <span>{dayNight.day}</span>
                  </div>
                  <div className={styles.nightBar} style={{ flex: dayNight.night || 0.1 }}>
                    <Moon size={14} />
                    <span>{dayNight.night}</span>
                  </div>
                </>
              ) : (
                <span className={styles.noData}>No feeding data</span>
              )}
            </div>
            {dayNight.day + dayNight.night > 0 && (
              <span className={styles.dayNightPercent}>
                {dayNight.dayPercent}% day / {100 - dayNight.dayPercent}% night
              </span>
            )}
          </div>
        </section>

        {/* L/R Balance */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <ArrowLeftRight size={20} className={styles.sectionIcon} />
            <h2 className={styles.sectionTitle}>L/R Balance</h2>
          </div>
          <div className={styles.chartCard}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={lrTrend} margin={MARGIN_TIGHT}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-light)" />
                <XAxis dataKey="label" tick={AXIS_TICK_SM} tickLine={false} />
                <YAxis allowDecimals={false} tick={AXIS_TICK_SM} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="left" stackId="lr" fill="var(--color-primary)" name="Left" />
                <Bar dataKey="right" stackId="lr" fill="var(--color-feeding)" radius={[4, 4, 0, 0]} name="Right" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Feeding Intervals */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <Timer size={20} className={styles.sectionIcon} />
            <h2 className={styles.sectionTitle}>Feeding Intervals</h2>
            <span className={styles.sectionHint}>Avg time between feedings</span>
          </div>
          <div className={styles.chartCard}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={intervalTrend} margin={MARGIN_NARROW}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-light)" />
                <XAxis dataKey="label" tick={AXIS_TICK_SM} tickLine={false} />
                <YAxis allowDecimals={false} tick={AXIS_TICK_SM} tickLine={false} unit="m" axisLine={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value) => [`${value}min`, 'Interval']} />
                <Line type="monotone" dataKey="avgMinutes" stroke="var(--color-primary)" strokeWidth={2.5} dot={{ r: 4, strokeWidth: 2 }} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Feeding Duration */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <Clock size={20} className={styles.sectionIcon} />
            <h2 className={styles.sectionTitle}>Feeding Duration</h2>
            <span className={styles.sectionHint}>Avg session length</span>
          </div>
          <div className={styles.chartCard}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={durationTrend} margin={MARGIN_NARROW}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-light)" />
                <XAxis dataKey="label" tick={AXIS_TICK_SM} tickLine={false} />
                <YAxis allowDecimals={false} tick={AXIS_TICK_SM} tickLine={false} unit="m" axisLine={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value) => [`${value}min`, 'Duration']} />
                <Line type="monotone" dataKey="avgMinutes" stroke="var(--color-feeding)" strokeWidth={2.5} dot={{ r: 4, strokeWidth: 2 }} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* Feeding Hours (full width) */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <Calendar size={20} className={styles.sectionIcon} />
          <h2 className={styles.sectionTitle}>Feeding Hours</h2>
          <span className={styles.sectionHint}>When feedings happen throughout the day</span>
        </div>
        <div className={styles.chartCard}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hourDist} margin={MARGIN_TIGHT}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-light)" />
              <XAxis
                dataKey="label"
                tick={AXIS_TICK_SM}
                tickLine={false}
                interval={1}
              />
              <YAxis allowDecimals={false} tick={AXIS_TICK_SM} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value) => [value, 'Feedings']} />
              <Bar dataKey="count" fill="var(--color-feeding)" radius={[4, 4, 0, 0]} name="Feedings" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </>
  );
});
