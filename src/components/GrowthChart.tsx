import { useMemo } from 'react';
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  ComposedChart,
  Scatter,
} from 'recharts';
import { differenceInDays } from 'date-fns';
import { getGrowthData, METRIC_UNITS, METRIC_LABELS } from '../utils/who-growth-data';
import type { GrowthMetric } from '../utils/who-growth-data';
import type { BabySex } from '../types/events';
import type { Measurement } from '../types/measurements';

interface GrowthChartProps {
  metric: GrowthMetric;
  sex: BabySex;
  birthDate: Date;
  measurements: Measurement[];
}

const TOOLTIP_STYLE = {
  borderRadius: '12px',
  border: 'none',
  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
  fontSize: '13px',
  padding: '12px 16px',
} as const;

const AXIS_TICK = { fontSize: 11, fill: 'var(--color-text-muted)' };
const PERCENTILE_STROKE = 'var(--color-border)';
const BAND_FILL = 'var(--color-primary-bg)';

export function GrowthChart({ metric, sex, birthDate, measurements }: GrowthChartProps) {
  const chartData = useMemo(() => {
    const whoData = getGrowthData(metric, sex);

    // Build percentile curve data points
    const curvePoints = whoData.map((row) => ({
      month: row.month,
      p3: row.p3,
      p15: row.p15,
      p50: row.p50,
      p85: row.p85,
      p97: row.p97,
      // Band for shading between p3 and p97
      band: [row.p3, row.p97] as [number, number],
      baby: undefined as number | undefined,
    }));

    // Add baby's measurement points
    const babyPoints = measurements.map((m) => {
      const days = differenceInDays(m.date.toDate(), birthDate);
      const ageMonths = Math.round((days / 30.44) * 10) / 10;
      return { month: ageMonths, value: m.value };
    });

    // Merge baby points into curve data
    for (const bp of babyPoints) {
      // Find closest month in curve data or add new point
      const existing = curvePoints.find((cp) => Math.abs(cp.month - bp.month) < 0.3);
      if (existing) {
        existing.baby = bp.value;
      } else {
        // Interpolate WHO values at this age (reuse whoData from above)
        let p3 = 0, p15 = 0, p50 = 0, p85 = 0, p97 = 0;
        for (let i = 0; i < whoData.length; i++) {
          if (whoData[i].month >= bp.month) {
            if (i === 0) {
              ({ p3, p15, p50, p85, p97 } = whoData[0]);
            } else {
              const prev = whoData[i - 1];
              const next = whoData[i];
              const t = (bp.month - prev.month) / (next.month - prev.month);
              p3 = prev.p3 + t * (next.p3 - prev.p3);
              p15 = prev.p15 + t * (next.p15 - prev.p15);
              p50 = prev.p50 + t * (next.p50 - prev.p50);
              p85 = prev.p85 + t * (next.p85 - prev.p85);
              p97 = prev.p97 + t * (next.p97 - prev.p97);
            }
            break;
          }
        }
        curvePoints.push({
          month: bp.month,
          p3, p15, p50, p85, p97,
          band: [p3, p97],
          baby: bp.value,
        });
      }
    }

    // Sort by month
    curvePoints.sort((a, b) => a.month - b.month);

    return curvePoints;
  }, [metric, sex, birthDate, measurements]);

  const unit = METRIC_UNITS[metric];
  const label = METRIC_LABELS[metric];

  return (
    <ResponsiveContainer width="100%" height="100%">
      {/* bottom: the axis label sits under the ticks, and 5px cut its descenders
          against the card, which clips its overflow. */}
      <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -5, bottom: 16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-light)" />
        <XAxis
          dataKey="month"
          tick={AXIS_TICK}
          tickLine={false}
          /* Centred, not right-anchored: against the card's right edge the
             closing bracket was the next thing to be cut. */
          label={{ value: 'Age (months)', position: 'insideBottom', offset: -14, fontSize: 11, fill: 'var(--color-text-muted)' }}
        />
        <YAxis
          tick={AXIS_TICK}
          tickLine={false}
          axisLine={false}
          label={{ value: `${label} (${unit})`, angle: -90, position: 'insideLeft', offset: 15, fontSize: 11, fill: 'var(--color-text-muted)' }}
        />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          formatter={(value, name) => {
            if (name === 'baby') return [`${value} ${unit}`, `${label}`];
            return [`${value} ${unit}`, String(name)];
          }}
          labelFormatter={(month) => `${Number(month).toFixed(1)} months`}
        />

        {/* Shaded band between P3 and P97 */}
        <Area
          type="monotone"
          dataKey="band"
          fill={BAND_FILL}
          stroke="none"
          fillOpacity={0.4}
          name="Normal range"
          legendType="none"
        />

        {/* Percentile lines */}
        <Line type="monotone" dataKey="p3" stroke={PERCENTILE_STROKE} strokeWidth={1} strokeDasharray="4 4" dot={false} name="3rd" />
        <Line type="monotone" dataKey="p15" stroke={PERCENTILE_STROKE} strokeWidth={1} strokeDasharray="2 2" dot={false} name="15th" />
        <Line type="monotone" dataKey="p50" stroke="var(--color-primary-light)" strokeWidth={2} dot={false} name="50th" />
        <Line type="monotone" dataKey="p85" stroke={PERCENTILE_STROKE} strokeWidth={1} strokeDasharray="2 2" dot={false} name="85th" />
        <Line type="monotone" dataKey="p97" stroke={PERCENTILE_STROKE} strokeWidth={1} strokeDasharray="4 4" dot={false} name="97th" />

        {/* Baby's measurements */}
        <Scatter
          dataKey="baby"
          fill="var(--color-primary)"
          stroke="white"
          strokeWidth={2}
          r={6}
          name="baby"
        />
        <Line
          type="monotone"
          dataKey="baby"
          stroke="var(--color-primary)"
          strokeWidth={2.5}
          dot={{ r: 5, fill: 'var(--color-primary)', strokeWidth: 2, stroke: 'white' }}
          connectNulls
          name="baby"
          legendType="none"
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
