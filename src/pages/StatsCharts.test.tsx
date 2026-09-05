import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatsCharts } from './StatsCharts';
import { createEmptySummary } from '../utils/summary';
import type { ComponentProps } from 'react';

const BASE: ComponentProps<typeof StatsCharts> = {
  chartData: [],
  chartType: 'line',
  totalEvents: 0,
  averages: {},
  todaySummary: createEmptySummary(),
  avgSummary: createEmptySummary(),
  range: '7d',
  dayNight: { day: 0, night: 0, dayPercent: 0 },
  lrTrend: [],
  intervalTrend: [],
  durationTrend: [],
  hourDist: [],
  feedingActive: false,
  mealActive: false,
  slotDist: [],
  acceptanceTrend: [],
};

const FEEDING_SECTIONS = ['Day vs Night', 'L/R Balance', 'Feeding Intervals', 'Feeding Duration', 'Feeding Hours'];
const MEAL_SECTIONS = ['Meal Times', 'Acceptance'];

describe('StatsCharts', () => {
  it('should draw the feeding sections while feeding is still logged', () => {
    render(<StatsCharts {...BASE} feedingActive />);
    for (const title of FEEDING_SECTIONS) {
      expect(screen.getByText(title)).toBeInTheDocument();
    }
  });

  it('should drop the feeding sections once feeding has stopped', () => {
    render(<StatsCharts {...BASE} mealActive />);
    for (const title of FEEDING_SECTIONS) {
      expect(screen.queryByText(title)).not.toBeInTheDocument();
    }
  });

  it('should draw the meal sections once meals are logged', () => {
    render(<StatsCharts {...BASE} mealActive />);
    for (const title of MEAL_SECTIONS) {
      expect(screen.getByText(title)).toBeInTheDocument();
    }
  });

  it('should not draw the meal sections while no meal is logged', () => {
    render(<StatsCharts {...BASE} feedingActive />);
    for (const title of MEAL_SECTIONS) {
      expect(screen.queryByText(title)).not.toBeInTheDocument();
    }
  });

  it('should always keep the type-agnostic overview', () => {
    render(<StatsCharts {...BASE} />);
    expect(screen.getByText('Daily Overview')).toBeInTheDocument();
  });
});
