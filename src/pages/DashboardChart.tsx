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
} from 'recharts';
import type { ChartDataPoint } from '../utils/chart-data';
import type { ChartType } from '../utils/chart-helpers';
import { CHART_COLORS, TOOLTIP_STYLE, hideZero } from '../utils/chart-helpers';
import { EVENT_CONFIG } from '../utils/event-config';
import { useVisibleRateTypes } from '../hooks/useVisibleEventTypes';
import { useIsMobile } from '../hooks/useIsMobile';

interface DashboardChartProps {
  chartData: ChartDataPoint[];
  chartType: ChartType;
}

const AXIS_TICK = { fontSize: 12, fill: 'var(--color-text-muted)' };
const AXIS_LINE = { stroke: 'var(--color-border-light)' };
const MARGIN = { top: 10, right: 10, left: -10, bottom: 5 };
const MARGIN_MOBILE = { top: 5, right: 0, left: 0, bottom: 5 };

export const DashboardChart = memo(function DashboardChart({ chartData, chartType }: DashboardChartProps) {
  const isMobile = useIsMobile();
  const rateTypes = useVisibleRateTypes();
  const margin = isMobile ? MARGIN_MOBILE : MARGIN;

  return (
    <ResponsiveContainer width="100%" height="100%">
      {chartType === 'bar' ? (
        <BarChart data={chartData} margin={margin}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-light)" />
          <XAxis dataKey="label" tick={AXIS_TICK} tickLine={false} axisLine={AXIS_LINE} />
          <YAxis allowDecimals={false} tick={AXIS_TICK} tickLine={false} axisLine={false} hide={isMobile} />
          <Tooltip contentStyle={TOOLTIP_STYLE} formatter={hideZero} />
          <Legend iconType="circle" wrapperStyle={{ fontSize: isMobile ? '11px' : '13px', paddingTop: '8px' }} />
          {rateTypes.map((type) => (
            <Bar key={type} dataKey={type} fill={CHART_COLORS[type]} radius={[4, 4, 0, 0]} name={EVENT_CONFIG[type].label} />
          ))}
        </BarChart>
      ) : (
        <LineChart data={chartData} margin={margin}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-light)" />
          <XAxis dataKey="label" tick={AXIS_TICK} tickLine={false} axisLine={AXIS_LINE} />
          <YAxis allowDecimals={false} tick={AXIS_TICK} tickLine={false} axisLine={false} hide={isMobile} />
          <Tooltip contentStyle={TOOLTIP_STYLE} formatter={hideZero} />
          <Legend iconType="circle" wrapperStyle={{ fontSize: isMobile ? '11px' : '13px', paddingTop: '8px' }} />
          {rateTypes.map((type) => (
            <Line key={type} type="monotone" dataKey={type} stroke={CHART_COLORS[type]} strokeWidth={2.5} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} name={EVENT_CONFIG[type].label} />
          ))}
        </LineChart>
      )}
    </ResponsiveContainer>
  );
});
