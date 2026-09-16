import { memo, useMemo, useState } from 'react';
import { format } from 'date-fns';
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { SegmentedControl } from '../components/SegmentedControl';
import { TOOLTIP_STYLE } from '../utils/chart-helpers';
import {
  buildFirstExposureFromCatalog,
  buildGroupIntake,
  buildVarietyCurve,
} from '../utils/food-chart-data';
import { FOOD_GROUPS } from '../types/food';
import { NUTRIENT_LABEL } from '../data/nutrient-reference';
import { NutrientWeatherGrid } from '../components/NutrientWeatherGrid';
import type { WeatherRow } from '../utils/nutrient-weather';
import { formatAmount } from '../utils/chart-helpers';
import type { BabyEvent } from '../types/events';
import type { LabelProps } from 'recharts';
import type { Food, FoodGroup } from '../types/food';
import styles from './FoodPage.module.css';

/**
 * One fixed hue per food group, in FOOD_GROUPS order. The order is the
 * colour-vision-deficiency safety mechanism, not a cosmetic choice: adjacent
 * slots were validated for protan/deutan separation on both surfaces. Re-run
 * the palette validator before reordering or re-hueing anything here.
 */
const GROUP_COLOR: Record<FoodGroup, string> = {
  grain: 'var(--color-group-grain)',
  vegetable: 'var(--color-group-vegetable)',
  fruit: 'var(--color-group-fruit)',
  protein: 'var(--color-group-protein)',
  dairy: 'var(--color-group-dairy)',
  fat: 'var(--color-group-fat)',
  other: 'var(--color-group-other)',
};

const GROUP_LABEL: Record<FoodGroup, string> = {
  grain: 'Grain',
  vegetable: 'Vegetable',
  fruit: 'Fruit',
  protein: 'Protein',
  dairy: 'Dairy',
  fat: 'Fat',
  other: 'Other',
};

const VIEW_OPTIONS = ['weather', 'groups', 'variety', 'started'] as const;
type ChartView = (typeof VIEW_OPTIONS)[number];

const VIEW_LABELS: Record<ChartView, string> = {
  groups: 'Groups',
  variety: 'Variety',
  started: 'Started',
  weather: 'Weather',
};

const VIEW_NOTES: Record<ChartView, string> = {
  groups: 'Grams eaten per food group, per day.',
  variety: 'Distinct foods tried so far, counted once each.',
  started: 'All time, not the selected range: the day each nutrient first entered the diet, and the food that brought it.',
  weather: 'The whole diet, milk included, against what she needs at her age. The verdict is the whole range, not any one day.',
};

const AXIS_TICK = { fontSize: 11, fill: 'var(--color-text-muted)' };
const AXIS_LINE = { stroke: 'var(--color-border-light)' };
const MARGIN = { top: 10, right: 10, left: -12, bottom: 0 };
/** The date scale sits on top: sixteen rows run past a phone screen, and a
 *  bottom axis would be off it on the very view whose question is "when". */
const EXPOSURE_MARGIN = { top: 4, right: 88, left: 0, bottom: 8 };
const ROW_HEIGHT = 26;
const DAY_MS = 24 * 60 * 60 * 1000;


/** SVG text does not ellipsize; a long seed name has to be cut here. Twelve
 *  characters at 11px fit the right margin above on the narrowest phone. */
function truncate(name: string): string {
  return name.length > 12 ? `${name.slice(0, 11).trimEnd()}…` : name;
}

/** Half of recharts' own 0.71em cap height, the shift it applies to centre an
 *  11px label on its anchor. Hard-coded because we bypass its <Text>. */
const LABEL_BASELINE_DY = 3.9;
/** Clear space between the dot's edge and the first glyph. */
const LABEL_GAP = 8;

/**
 * A built-in `position="right"` label is measured against the plot area, and
 * every label here sits *past* that area in the right margin — so recharts
 * computed a near-zero width and wrapped each food name onto a second line
 * that landed in the row below. A plain <text> node never wraps.
 *
 * Recharts hands a scatter label the dot's viewBox top-left, not the anchor
 * it would otherwise compute, so the centring has to be redone here: `value`
 * is already cut to width by `truncate`.
 */
export function ExposureLabel({ x, y, width, height, value }: LabelProps) {
  return (
    <text
      x={Number(x) + Number(width) + LABEL_GAP}
      y={Number(y) + Number(height) / 2}
      dy={LABEL_BASELINE_DY}
      fontSize={11}
      fill="var(--color-text-secondary)"
    >
      {value}
    </text>
  );
}

interface FoodChartsProps {
  events: BabyEvent[];
  byId: Map<string, Food>;
  days: { date: Date; label: string }[];
  /** Empty under six months, when milk is still the whole diet. */
  weatherRows: WeatherRow[];
  /** The milk assumption the targets were built on, stated on screen. */
  milkNote: string;
}

export const FoodCharts = memo(function FoodCharts({
  events,
  byId,
  days,
  weatherRows,
  milkNote,
}: FoodChartsProps) {
  const [view, setView] = useState<ChartView>('weather');

  const groupRows = useMemo(() => buildGroupIntake(events, byId, days), [events, byId, days]);
  const varietyRows = useMemo(() => buildVarietyCurve(events, days), [events, days]);
  /** Lifetime, from the catalog — deliberately independent of the range. */
  const exposure = useMemo(() => buildFirstExposureFromCatalog([...byId.values()]), [byId]);
  /**
   * Sorted newest first because a category axis lays index 0 at the bottom —
   * which puts the earliest nutrient at the top, so the plot reads as a
   * staircase downwards.
   */
  const exposureRows = useMemo(() => exposure
    .filter((row): row is typeof row & { date: Date } => row.date !== null)
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .map((row) => ({
      label: NUTRIENT_LABEL[row.nutrient],
      at: row.date.getTime(),
      foodName: truncate(row.foodName ?? ''),
    })), [exposure]);

  /** A single-day span has no width; pad it so the dots are not all on the axis. */
  const exposureDomain = useMemo((): [number, number] => {
    if (exposureRows.length === 0) return [0, 1];
    const stamps = exposureRows.map((row) => row.at);
    const min = Math.min(...stamps);
    const max = Math.max(...stamps);
    return min === max ? [min - DAY_MS, max + DAY_MS] : [min, max];
  }, [exposureRows]);

  /** Explicit, or a time scale draws one overlapping tick per data point. */
  const exposureTicks = useMemo(() => {
    const [min, max] = exposureDomain;
    return [0, 1, 2].map((i) => min + ((max - min) * i) / 2);
  }, [exposureDomain]);

  const notYet = useMemo(
    () => exposure.filter((row) => row.date === null).map((row) => NUTRIENT_LABEL[row.nutrient]),
    [exposure],
  );

  /**
   * Three of the four views are range-scoped and have nothing to draw without
   * meals. First is not: it reads the lifetime catalog, so an empty range must
   * not hide the answer to "when did we start this nutrient". The picker stays
   * rendered either way, or the exempt view would be unreachable.
   */
  const emptyRange = !events.some((event) => event.type === 'meal') && view !== 'started';

  const scrolls = view === 'started' || view === 'weather';


  return (
    <>
      <div className={styles.controls}>
        <SegmentedControl options={VIEW_OPTIONS} value={view} onChange={setView} labels={VIEW_LABELS} />
      </div>

      <div className={`${styles.chartCard} ${scrolls ? styles.scrollCard : ''}`}>
        {emptyRange && <p className={styles.noData}>No meals logged in this range.</p>}

        {!emptyRange && view === 'groups' && (
          <div data-testid="chart-groups" className={styles.chartFill}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={groupRows} margin={MARGIN}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-light)" />
                <XAxis
                  dataKey="label"
                  tick={AXIS_TICK}
                  tickLine={false}
                  axisLine={AXIS_LINE}
                  interval="preserveStartEnd"
                />
                <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} unit="g" width={44} />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  formatter={(value) =>
                    (Number(value) > 0 ? `${formatAmount(Number(value))} g` : null)
                  }
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                {FOOD_GROUPS.map((group) => (
                  <Bar
                    key={group}
                    dataKey={group}
                    stackId="intake"
                    fill={GROUP_COLOR[group]}
                    name={GROUP_LABEL[group]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {!emptyRange && view === 'variety' && (
          <div data-testid="chart-variety" className={styles.chartFill}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={varietyRows} margin={MARGIN}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-light)" />
                <XAxis
                  dataKey="label"
                  tick={AXIS_TICK}
                  tickLine={false}
                  axisLine={AXIS_LINE}
                  interval="preserveStartEnd"
                />
                <YAxis allowDecimals={false} tick={AXIS_TICK} tickLine={false} axisLine={false} width={32} />
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value) => [value, 'Foods tried']} />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="var(--color-primary)"
                  strokeWidth={2.5}
                  dot={{ r: 3, strokeWidth: 2 }}
                  activeDot={{ r: 5 }}
                  name="Foods tried"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {!emptyRange && view === 'started' && (
          <div data-testid="chart-started">
            {exposureRows.length === 0 ? (
              <p className={styles.noData}>Nothing logged carries nutrient data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={exposureRows.length * ROW_HEIGHT + 32}>
                <ScatterChart margin={EXPOSURE_MARGIN}>
                  <CartesianGrid horizontal={false} stroke="var(--color-border-light)" />
                  <XAxis
                    type="number"
                    dataKey="at"
                    scale="time"
                    orientation="top"
                    domain={exposureDomain}
                    ticks={exposureTicks}
                    tickFormatter={(at: number) => format(at, 'd MMM')}
                    tick={AXIS_TICK}
                    tickLine={false}
                    axisLine={AXIS_LINE}
                  />
                  <YAxis
                    type="category"
                    dataKey="label"
                    width={84}
                    tick={AXIS_TICK}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Scatter data={exposureRows} fill="var(--color-primary)" isAnimationActive={false}>
                    <LabelList dataKey="foodName" content={ExposureLabel} />
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            )}
            {notYet.length > 0 && (
              <p className={styles.chartNote}>Not yet introduced: {notYet.join(', ')}.</p>
            )}
          </div>
        )}

        {!emptyRange && view === 'weather' && (
          <div data-testid="chart-weather">
            {weatherRows.length === 0 ? (
              <p className={styles.noData}>
                Nothing to show yet — weaning starts at about five months.
              </p>
            ) : (
              <>
                <NutrientWeatherGrid rows={weatherRows} days={days} />
                <p className={styles.chartNote}>{milkNote}</p>
              </>
            )}
          </div>
        )}

      </div>

      {!emptyRange && <p className={styles.chartNote}>{VIEW_NOTES[view]}</p>}
    </>
  );
});
