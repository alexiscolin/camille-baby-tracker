import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Timestamp } from 'firebase/firestore';
import { GrowthPage } from './GrowthPage';
import type { Baby } from '../types/events';
import type { Measurement } from '../types/measurements';

const mockAddMeasurement = vi.fn();
const mockDeleteMeasurement = vi.fn();

vi.mock('../services/measurements', () => ({
  addMeasurement: (...args: unknown[]) => mockAddMeasurement(...args),
  deleteMeasurement: (...args: unknown[]) => mockDeleteMeasurement(...args),
}));

const mockMeasurements: Measurement[] = [];

vi.mock('../hooks/useMeasurements', () => ({
  useMeasurements: () => ({
    measurements: mockMeasurements,
    loading: false,
    fromCache: false,
    hasPendingWrites: false,
  }),
}));

function makeBaby(overrides: Partial<Baby> = {}): Baby {
  return {
    id: 'baby-1',
    firstName: 'Emma',
    birthDate: Timestamp.fromDate(new Date(2026, 2, 1)),
    sex: 'female',
    createdAt: Timestamp.fromDate(new Date()),
    ...overrides,
  };
}

function makeMeasurement(overrides: Partial<Measurement> = {}): Measurement {
  return {
    id: 'm-1',
    babyId: 'baby-1',
    type: 'weight',
    value: 3.5,
    date: Timestamp.fromDate(new Date(2026, 2, 5)),
    createdBy: 'user-1',
    createdAt: Timestamp.fromDate(new Date()),
    ...overrides,
  };
}

const baseProps = {
  familyId: 'fam-1',
  babyId: 'baby-1',
  userId: 'user-1',
};

describe('GrowthPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAddMeasurement.mockResolvedValue({ id: 'new-m' });
    mockDeleteMeasurement.mockResolvedValue(undefined);
    mockMeasurements.length = 0;
  });

  it('should display page title and baby info', () => {
    render(<GrowthPage {...baseProps} baby={makeBaby()} />);

    expect(screen.getByText('Growth')).toBeInTheDocument();
    expect(screen.getByText(/Emma/)).toBeInTheDocument();
  });

  it('should show metric selector with weight, height, head', () => {
    render(<GrowthPage {...baseProps} baby={makeBaby()} />);

    expect(screen.getByText('Weight')).toBeInTheDocument();
    expect(screen.getByText('Height')).toBeInTheDocument();
    expect(screen.getByText('Head Circ.')).toBeInTheDocument();
  });

  it('should show no-sex notice when sex is not set', () => {
    render(<GrowthPage {...baseProps} baby={makeBaby({ sex: undefined })} />);

    expect(screen.getByText(/Set baby's sex/)).toBeInTheDocument();
  });

  it('should not show no-sex notice when sex is set', () => {
    render(<GrowthPage {...baseProps} baby={makeBaby({ sex: 'female' })} />);

    expect(screen.queryByText(/Set baby's sex/)).not.toBeInTheDocument();
  });

  it('should show add measurement form', () => {
    render(<GrowthPage {...baseProps} baby={makeBaby()} />);

    expect(screen.getByText('Add Weight Measurement')).toBeInTheDocument();
    expect(screen.getByLabelText(/Weight \(kg\)/)).toBeInTheDocument();
  });

  it('should switch form label when metric changes', async () => {
    const user = userEvent.setup();
    render(<GrowthPage {...baseProps} baby={makeBaby()} />);

    await user.click(screen.getByText('Height'));

    expect(screen.getByText('Add Height Measurement')).toBeInTheDocument();
    expect(screen.getByLabelText(/Height \(cm\)/)).toBeInTheDocument();
  });

  it('should call addMeasurement on form submit', async () => {
    const user = userEvent.setup();
    render(<GrowthPage {...baseProps} baby={makeBaby()} />);

    const valueInput = screen.getByLabelText(/Weight \(kg\)/);
    await user.type(valueInput, '3.5');
    await user.click(screen.getByText('Add'));

    expect(mockAddMeasurement).toHaveBeenCalledOnce();
    expect(mockAddMeasurement.mock.calls[0][0]).toBe('fam-1');
    expect(mockAddMeasurement.mock.calls[0][1].type).toBe('weight');
    expect(mockAddMeasurement.mock.calls[0][1].value).toBe(3.5);
  });

  it('should disable Add button when value is empty', () => {
    render(<GrowthPage {...baseProps} baby={makeBaby()} />);

    expect(screen.getByText('Add')).toBeDisabled();
  });

  it('should show error for invalid value', async () => {
    const user = userEvent.setup();
    render(<GrowthPage {...baseProps} baby={makeBaby()} />);

    const valueInput = screen.getByLabelText(/Weight \(kg\)/);
    await user.type(valueInput, '0');
    await user.click(screen.getByText('Add'));

    expect(screen.getByText('Please enter a valid value')).toBeInTheDocument();
    expect(mockAddMeasurement).not.toHaveBeenCalled();
  });

  it('should show error when save fails', async () => {
    const user = userEvent.setup();
    mockAddMeasurement.mockRejectedValueOnce(new Error('Network'));
    render(<GrowthPage {...baseProps} baby={makeBaby()} />);

    const valueInput = screen.getByLabelText(/Weight \(kg\)/);
    await user.type(valueInput, '3.5');
    await user.click(screen.getByText('Add'));

    expect(await screen.findByText('Failed to save. Please try again.')).toBeInTheDocument();
  });

  it('should display measurements in history list', () => {
    mockMeasurements.push(makeMeasurement({ value: 3.5 }));
    render(<GrowthPage {...baseProps} baby={makeBaby()} />);

    expect(screen.getByText('3.5')).toBeInTheDocument();
  });

  it('should show empty state when no measurements', () => {
    render(<GrowthPage {...baseProps} baby={makeBaby()} />);

    expect(screen.getByText(/No weight measurements yet/)).toBeInTheDocument();
  });

  it('should call deleteMeasurement when delete is clicked', async () => {
    const user = userEvent.setup();
    mockMeasurements.push(makeMeasurement({ id: 'm-1' }));
    render(<GrowthPage {...baseProps} baby={makeBaby()} />);

    await user.click(screen.getByLabelText('Delete measurement'));

    expect(mockDeleteMeasurement).toHaveBeenCalledWith('fam-1', 'm-1');
  });

  it('should show percentile hint when sex and value are set', async () => {
    const user = userEvent.setup();
    render(<GrowthPage {...baseProps} baby={makeBaby({ sex: 'female' })} />);

    const valueInput = screen.getByLabelText(/Weight \(kg\)/);
    await user.type(valueInput, '4.5');

    // Hint text contains "percentile" — either "between X and Y percentile" or "below/above"
    const hints = screen.getAllByText(/percentile/i);
    // At least 2: the no-sex notice is hidden here, so only the hint div
    expect(hints.length).toBeGreaterThanOrEqual(1);
    expect(hints.some((el) => el.textContent?.includes('Weight'))).toBe(true);
  });

  it('should not show percentile hint without sex', async () => {
    const user = userEvent.setup();
    render(<GrowthPage {...baseProps} baby={makeBaby({ sex: undefined })} />);

    const valueInput = screen.getByLabelText(/Weight \(kg\)/);
    await user.type(valueInput, '3.2');

    expect(screen.queryByText(/between.*percentile/)).not.toBeInTheDocument();
  });

  it('should filter measurements by selected metric', async () => {
    const user = userEvent.setup();
    mockMeasurements.push(
      makeMeasurement({ id: 'm-1', type: 'weight', value: 3.5 }),
      makeMeasurement({ id: 'm-2', type: 'height', value: 50.0 }),
    );
    render(<GrowthPage {...baseProps} baby={makeBaby()} />);

    // Weight view - should show 3.5 but not 50.0
    expect(screen.getByText('3.5')).toBeInTheDocument();
    expect(screen.queryByText('50')).not.toBeInTheDocument();

    // Switch to height
    await user.click(screen.getByText('Height'));
    expect(screen.getByText('50')).toBeInTheDocument();
  });
});
