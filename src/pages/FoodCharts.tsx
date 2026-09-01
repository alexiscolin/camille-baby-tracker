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
  buildFirstExposure,
  buildGroupIntake,
  buildNutrientCoverage,
  buildVarietyCurve,
} from '../utils/food-chart-data';
import { FOOD_GROUPS } from '../types/food';
import type { BabyEvent } from '../types/events';
import type { Food, FoodGroup, NutrientKey } from '../types/food';
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

const NUTRIENT_LABEL: Record<NutrientKey, string> = {
  energyKcal: 'Energy',
  proteinG: 'Protein',
  fatG: 'Fat',
  carbsG: 'Carbs',
  fiberG: 'Fibre',
  sugarsG: 'Sugars',
  ironMg: 'Iron',
  calciumMg: 'Calcium',
  zincMg: 'Zinc',
  sodiumMg: 'Sodium',
  potassiumMg: 'Potassium',
  vitaminAUgRae: 'Vitamin A',
  vitaminCMg: 'Vitamin C',
  vitaminDUg: 'Vitamin D',
  vitaminB12Ug: 'Vitamin B12',
  folateUg: 'Folate',
};

/**
 * Coverage is split into one panel per unit. The sixteen nutrients span kcal,
 * grams, milligrams and micrograms; putting them on a shared axis — or on one
 * radar — would compare quantities that are not comparable. One scale per
 * panel, each bar carrying its own value, keeps every comparison honest.
 */
const UNIT_PANELS: { unit: string; keys: readonly NutrientKey[] }[] = [
  { unit: 'kcal', keys: ['energyKcal'] },
  { unit: 'g', keys: ['proteinG', 'fatG', 'carbsG', 'fiberG', 'sugarsG'] },
  { unit: 'mg', keys: ['ironMg', 'calciumMg', 'zincMg', 'sodiumMg', 'potassiumMg', 'vitaminCMg'] },
  { unit: 'µg', keys: ['vitaminAUgRae', 'vitaminDUg', 'vitaminB12Ug', 'folateUg'] },
];

const VIEW_OPTIONS = ['groups', 'variety', 'first', 'coverage'] as const;
type ChartView = (typeof VIEW_OPTIONS)[number];

const VIEW_LABELS: Record<ChartView, string> = {
  groups: 'Groups',
  variety: 'Variety',
  first: 'First',
  coverage: 'Coverage',
};

const VIEW_NOTES: Record<ChartView, string> = {
  groups: 'Grams eaten per food group, per day.',
  variety: 'Distinct foods tried so far, counted once each.',
  first: 'The first day each nutrient appeared in a meal, and the food that brought it.',
  coverage: 'Average per day over the range. One scale per unit — the panels are not comparable.',
};

const AXIS_TICK = { fontSize: 11, fill: 'var(--color-text-muted)' };
const AXIS_LINE = { stroke: 'var(--color-border-light)' };
const MARGIN = { top: 10, right: 10, left: -12, bottom: 0 };
/** The date scale sits on top: the card scrolls, and a bottom axis would be
 *  below the fold on the very view whose whole question is "when". */
const EXPOSURE_MARGIN = { top: 4, right: 78, left: 0, bottom: 8 };
const PANEL_MARGIN = { top: 0, right: 52, left: 0, bottom: 0 };
const ROW_HEIGHT = 26;

/** Two significant-ish digits, so a 0.06 mg trace is still a readable number. */
function formatAmount(value: number): string {
  if (value === 0) return '0';
  if (value < 1) return value.toFixed(2);
  if (value < 10) return value.toFixed(1);
  return String(Math.round(value));
}

/** SVG text does not wrap or ellipsize; a long seed name has to be cut here. */
function truncate(name: string): string {
  return name.length > 14 ? `${name.slice(0, 13)}…` : name;
}

interface FoodChartsProps {
  events: BabyEvent[];
  byId: Map<string, Food>;
  days: { date: Date; label: string }[];
  rangeDays: number;
}

export const FoodCharts = memo(function FoodCharts({
  events,
  byId,
  days,
  rangeDays,
}: FoodChartsProps) {
  const [view, setView] = useState<ChartView>('groups');

  const groupRows = useMemo(() => buildGroupIntake(events, byId, days), [events, byId, days]);
  const varietyRows = useMemo(() => buildVarietyCurve(events, days), [events, days]);
  const exposure = useMemo(() => buildFirstExposure(events, byId), [events, byId]);
  const coverage = useMemo(
    () => buildNutrientCoverage(events, byId, rangeDays),
    [events, byId, rangeDays],
  );

  /**
   * Introduced nutrients placed on the day axis by index. Sorted newest first
   * because a category axis lays index 0 at the bottom — which puts the
   * earliest nutrient at the top, so the plot reads as a staircase downwards.
   */
  const exposureRows = useMemo(() => {
    const dayIndex = new Map(days.map((day, i) => [format(day.date, 'yyyy-MM-dd'), i]));
    return exposure
      .filter((row): row is typeof row & { date: Date } => row.date !== null)
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .map((row) => ({
        label: NUTRIENT_LABEL[row.nutrient],
        dayIndex: dayIndex.get(format(row.date, 'yyyy-MM-dd')) ?? 0,
        foodName: truncate(row.foodName ?? ''),
      }));
  }, [exposure, days]);

  const notYet = useMemo(
    () => exposure.filter((row) => row.date === null).map((row) => NUTRIENT_LABEL[row.nutrient]),
    [exposure],
  );

  const perDay = useMemo(
    () => Object.fromEntries(coverage.map((row) => [row.nutrient, row.perDay])) as Record<NutrientKey, number>,
    [coverage],
  );

  /** Every fifth day or so, so a 30-day axis does not collide with itself. */
  const dayTicks = useMemo(() => {
    const step = Math.max(1, Math.ceil(days.length / 5));
    return days.map((_, i) => i).filter((i) => i % step === 0);
  }, [days]);

  const hasMeals = events.some((event) => event.type === 'meal');
  if (!hasMeals) {
    return <p className={styles.noData}>No meals logged in this range.</p>;
  }

  const scrolls = view === 'first' || view === 'coverage';

  return (
    <>
      <div className={styles.controls}>
        <SegmentedControl options={VIEW_OPTIONS} value={view} onChange={setView} labels={VIEW_LABELS} />
      </div>

      <div className={`${styles.chartCard} ${scrolls ? styles.scrollCard : ''}`}>
        {view === 'groups' && (
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
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value) => `${formatAmount(Number(value))} g`} />
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

        {view === 'variety' && (
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

        {view === 'first' && (
          <div data-testid="chart-first">
            {exposureRows.length === 0 ? (
              <p className={styles.noData}>Nothing logged carries nutrient data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={exposureRows.length * ROW_HEIGHT + 32}>
                <ScatterChart margin={EXPOSURE_MARGIN}>
                  <CartesianGrid horizontal={false} stroke="var(--color-border-light)" />
                  <XAxis
                    type="number"
                    dataKey="dayIndex"
                    orientation="top"
                    domain={[-0.5, days.length - 0.5]}
                    ticks={dayTicks}
                    tickFormatter={(index: number) => days[index]?.label ?? ''}
                    tick={AXIS_TICK}
                    tickLine={false}
                    axisLine={AXIS_LINE}
                  />
                  <YAxis
                    type="category"
                    dataKey="label"
                    width={92}
                    tick={AXIS_TICK}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Scatter data={exposureRows} fill="var(--color-primary)" isAnimationActive={false}>
                    <LabelList
                      dataKey="foodName"
                      position="right"
                      offset={8}
                      fill="var(--color-text-secondary)"
                      fontSize={11}
                    />
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            )}
            {notYet.length > 0 && (
              <p className={styles.chartNote}>Not seen in this range: {notYet.join(', ')}.</p>
            )}
          </div>
        )}

        {view === 'coverage' && (
          <div data-testid="chart-coverage">
            {UNIT_PANELS.map((panel) => (
              <div key={panel.unit} className={styles.panel}>
                <span className={styles.panelLabel}>per day · {panel.unit}</span>
                <ResponsiveContainer width="100%" height={panel.keys.length * ROW_HEIGHT}>
                  <BarChart
                    layout="vertical"
                    margin={PANEL_MARGIN}
                    data={panel.keys.map((key) => ({
                      label: NUTRIENT_LABEL[key],
                      value: perDay[key],
                      text: formatAmount(perDay[key]),
                    }))}
                  >
                    <XAxis type="number" hide />
                    <YAxis
                      type="category"
                      dataKey="label"
                      width={92}
                      tick={AXIS_TICK}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Bar
                      dataKey="value"
                      fill="var(--color-primary)"
                      barSize={10}
                      radius={[0, 4, 4, 0]}
                      isAnimationActive={false}
                    >
                      <LabelList
                        dataKey="text"
                        position="right"
                        offset={8}
                        fill="var(--color-text-secondary)"
                        fontSize={11}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className={styles.chartNote}>{VIEW_NOTES[view]}</p>
    </>
  );
});
