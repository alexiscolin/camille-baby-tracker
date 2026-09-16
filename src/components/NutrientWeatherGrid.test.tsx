import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { NutrientWeatherGrid } from './NutrientWeatherGrid';
import type { WeatherRow } from '../utils/nutrient-weather';

const days = [1, 2, 3].map((n) => ({ date: new Date(2026, 8, n), label: `d${n}` }));

const row = (over: Partial<WeatherRow> = {}): WeatherRow => ({
  key: 'ironMg',
  kind: 'target',
  target: 4.5,
  cells: days.map((_, i) => ({
    date: `2026-09-0${i + 1}`,
    amount: 4.5,
    ratio: 1,
    band: 'met' as const,
    overCeiling: false,
  })),
  perDay: 4.5,
  ratio: 1,
  trend: 'flat',
  overCeiling: false,
  ...over,
});

const cellsOf = (name: string | RegExp) =>
  within(screen.getByRole('row', { name })).getAllByRole('cell');

describe('NutrientWeatherGrid', () => {
  it('should give each nutrient a row named after it', () => {
    render(<NutrientWeatherGrid rows={[row()]} days={days} />);
    expect(screen.getByRole('rowheader', { name: /iron/i })).toBeInTheDocument();
  });

  it('should give each day a column, plus the window verdict', () => {
    render(<NutrientWeatherGrid rows={[row()]} days={days} />);
    expect(cellsOf(/iron/i)).toHaveLength(days.length + 1);
  });

  it('should show the window as a percentage of the target', () => {
    render(<NutrientWeatherGrid rows={[row({ ratio: 0.62 })]} days={days} />);
    expect(screen.getByText(/62\s*%/)).toBeInTheDocument();
  });

  it('should carry each day band so the colour is not the only signal', () => {
    const cells = row().cells.map((c, i) => (i === 1 ? { ...c, band: 'low' as const } : c));
    render(<NutrientWeatherGrid rows={[row({ cells })]} days={days} />);
    expect(cellsOf(/iron/i)[1]).toHaveAttribute('data-band', 'low');
  });

  it('should describe every day in words, not only as a dot', () => {
    render(<NutrientWeatherGrid rows={[row()]} days={days} />);
    expect(cellsOf(/iron/i)[0]).toHaveAccessibleName(/iron.*d1/i);
  });

  it('should say when a row is a ceiling rather than a floor', () => {
    render(<NutrientWeatherGrid rows={[row({ key: 'sodiumMg', kind: 'limit' })]} days={days} />);
    expect(screen.getByRole('rowheader', { name: /sodium/i })).toHaveTextContent(/limit/i);
  });

  it('should leave an ungraded nutrient without a verdict', () => {
    render(<NutrientWeatherGrid
      rows={[row({ key: 'carbsG', kind: 'context', ratio: null, trend: null })]}
      days={days}
    />);
    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
  });

  it('should show an ungraded row as an amount, not as a dash', () => {
    render(<NutrientWeatherGrid
      rows={[row({ key: 'carbsG', kind: 'context', perDay: 6.2, ratio: null, trend: null })]}
      days={days}
    />);
    expect(screen.getByText(/6\.2\s*g/)).toBeInTheDocument();
  });

  it('should still say whether anything went in on an ungraded day', () => {
    const cells = row().cells.map((c, i) => ({ ...c, band: null, amount: i === 1 ? 0 : 6 }));
    render(<NutrientWeatherGrid
      rows={[row({ key: 'carbsG', kind: 'context', cells, ratio: null, trend: null })]}
      days={days}
    />);
    const tds = cellsOf(/carbs/i);
    expect(tds[0]).toHaveAttribute('data-band', 'some');
    expect(tds[1]).toHaveAttribute('data-band', 'none');
  });

  it('should flag the day an upper limit was passed', () => {
    const cells = row().cells.map((c, i) => (i === 2 ? { ...c, overCeiling: true } : c));
    render(<NutrientWeatherGrid rows={[row({ key: 'vitaminAUgRae', cells })]} days={days} />);
    expect(cellsOf(/vitamin a/i)[2]).toHaveAttribute('data-over', 'true');
  });

  it('should warn in words when the week as a whole sits over a limit', () => {
    render(<NutrientWeatherGrid
      rows={[row({ key: 'vitaminAUgRae', overCeiling: true })]}
      days={days}
    />);
    expect(screen.getByRole('rowheader', { name: /vitamin a/i }))
      .toHaveTextContent(/over the vitamin a limit/i);
  });

  it('should say on the row why a nutrient is shown as an amount', () => {
    render(<NutrientWeatherGrid
      rows={[row({ kind: 'context', ratio: null, trend: null, note: 'set above what milk provides' })]}
      days={days}
    />);
    expect(screen.getByRole('rowheader', { name: /iron/i }))
      .toHaveTextContent(/set above what milk provides/i);
  });

  it('should explain what a dot means, graded or not', () => {
    render(<NutrientWeatherGrid rows={[row()]} days={days} />);
    const legend = screen.getByRole('list', { name: /what the dots mean/i });
    expect(within(legend).getByText(/on target/i)).toBeInTheDocument();
    expect(within(legend).getByText(/over the daily limit/i)).toBeInTheDocument();
  });

  it('should explain the ungraded dots instead when nothing is graded', () => {
    render(<NutrientWeatherGrid
      rows={[row({ key: 'carbsG', kind: 'context', ratio: null, trend: null })]}
      days={days}
    />);
    const legend = screen.getByRole('list', { name: /what the dots mean/i });
    expect(within(legend).getByText(/something that day/i)).toBeInTheDocument();
    expect(within(legend).queryByText(/on target/i)).not.toBeInTheDocument();
  });

  it('should show which way a nutrient is moving', () => {
    render(<NutrientWeatherGrid rows={[row({ trend: 'down' })]} days={days} />);
    expect(screen.getByLabelText(/falling/i)).toBeInTheDocument();
  });

  it('should not draw an arrow when nothing is moving', () => {
    render(<NutrientWeatherGrid rows={[row({ trend: 'flat' })]} days={days} />);
    expect(screen.queryByLabelText(/falling|rising/i)).not.toBeInTheDocument();
  });
});
