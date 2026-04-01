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
import { CHART_COLORS, TOOLTIP_STYLE } from '../utils/chart-helpers';
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
  const margin = isMobile ? MARGIN_MOBILE : MARGIN;

  return (
    <ResponsiveContainer width="100%" height="100%">
      {chartType === 'bar' ? (
        <BarChart data={chartData} margin={margin}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-light)" />
          <XAxis dataKey="label" tick={AXIS_TICK} tickLine={false} axisLine={AXIS_LINE} />
          <YAxis allowDecimals={false} tick={AXIS_TICK} tickLine={false} axisLine={false} hide={isMobile} />
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Legend iconType="circle" wrapperStyle={{ fontSize: isMobile ? '11px' : '13px', paddingTop: '8px' }} />
          <Bar dataKey="feeding" fill={CHART_COLORS.feeding} radius={[4, 4, 0, 0]} name="Feedings" />
          <Bar dataKey="pee" fill={CHART_COLORS.pee} radius={[4, 4, 0, 0]} name="Pees" />
          <Bar dataKey="poop" fill={CHART_COLORS.poop} radius={[4, 4, 0, 0]} name="Poops" />
          <Bar dataKey="medication" fill={CHART_COLORS.medication} radius={[4, 4, 0, 0]} name="Meds" />
        </BarChart>
      ) : (
        <LineChart data={chartData} margin={margin}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-light)" />
          <XAxis dataKey="label" tick={AXIS_TICK} tickLine={false} axisLine={AXIS_LINE} />
          <YAxis allowDecimals={false} tick={AXIS_TICK} tickLine={false} axisLine={false} hide={isMobile} />
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Legend iconType="circle" wrapperStyle={{ fontSize: isMobile ? '11px' : '13px', paddingTop: '8px' }} />
          <Line type="monotone" dataKey="feeding" stroke={CHART_COLORS.feeding} strokeWidth={2.5} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} name="Feedings" />
          <Line type="monotone" dataKey="pee" stroke={CHART_COLORS.pee} strokeWidth={2.5} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} name="Pees" />
          <Line type="monotone" dataKey="poop" stroke={CHART_COLORS.poop} strokeWidth={2.5} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} name="Poops" />
          <Line type="monotone" dataKey="medication" stroke={CHART_COLORS.medication} strokeWidth={2.5} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} name="Meds" />
        </LineChart>
      )}
    </ResponsiveContainer>
  );
});
