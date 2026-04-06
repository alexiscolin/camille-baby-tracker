import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Timestamp } from 'firebase/firestore';
import { SettingsPage } from './SettingsPage';
import type { Baby } from '../types/events';

const mockUpdateBaby = vi.fn();

vi.mock('../services/family', () => ({
  updateBaby: (...args: unknown[]) => mockUpdateBaby(...args),
}));

function makeBaby(overrides: Partial<Baby> = {}): Baby {
  return {
    id: 'baby-1',
    firstName: 'Emma',
    birthDate: Timestamp.fromDate(new Date(2026, 2, 1)),
    createdAt: Timestamp.fromDate(new Date()),
    ...overrides,
  };
}

const baseProps = {
  familyId: 'fam-1',
  babyId: 'baby-1',
};

describe('SettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdateBaby.mockResolvedValue(undefined);
  });

  it('should display baby profile section', () => {
    render(<SettingsPage {...baseProps} baby={makeBaby()} />);

    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Baby Profile')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Emma')).toBeInTheDocument();
  });

  it('should pre-fill sex when set', () => {
    render(<SettingsPage {...baseProps} baby={makeBaby({ sex: 'female' })} />);

    const select = screen.getByLabelText(/sex/i) as HTMLSelectElement;
    expect(select.value).toBe('female');
  });

  it('should show birth date and age', () => {
    render(<SettingsPage {...baseProps} baby={makeBaby()} />);

    expect(screen.getByText('March 1, 2026')).toBeInTheDocument();
  });

  it('should disable save when no changes', () => {
    render(<SettingsPage {...baseProps} baby={makeBaby()} />);

    expect(screen.getByText('Save')).toBeDisabled();
  });

  it('should enable save when name changes', async () => {
    const user = userEvent.setup();
    render(<SettingsPage {...baseProps} baby={makeBaby()} />);

    const nameInput = screen.getByDisplayValue('Emma');
    await user.clear(nameInput);
    await user.type(nameInput, 'Lina');

    expect(screen.getByText('Save')).not.toBeDisabled();
  });

  it('should enable save when sex changes', async () => {
    const user = userEvent.setup();
    render(<SettingsPage {...baseProps} baby={makeBaby()} />);

    await user.selectOptions(screen.getByLabelText(/sex/i), 'female');

    expect(screen.getByText('Save')).not.toBeDisabled();
  });

  it('should call updateBaby on save', async () => {
    const user = userEvent.setup();
    render(<SettingsPage {...baseProps} baby={makeBaby()} />);

    await user.selectOptions(screen.getByLabelText(/sex/i), 'female');
    await user.click(screen.getByText('Save'));

    expect(mockUpdateBaby).toHaveBeenCalledWith('fam-1', 'baby-1', {
      firstName: 'Emma',
      sex: 'female',
    });
  });

  it('should show success message after save', async () => {
    const user = userEvent.setup();
    render(<SettingsPage {...baseProps} baby={makeBaby()} />);

    await user.selectOptions(screen.getByLabelText(/sex/i), 'male');
    await user.click(screen.getByText('Save'));

    expect(await screen.findByText('Saved!')).toBeInTheDocument();
  });

  it('should show error when save fails', async () => {
    const user = userEvent.setup();
    mockUpdateBaby.mockRejectedValueOnce(new Error('Network'));
    render(<SettingsPage {...baseProps} baby={makeBaby()} />);

    await user.selectOptions(screen.getByLabelText(/sex/i), 'female');
    await user.click(screen.getByText('Save'));

    expect(await screen.findByText('Failed to save. Please try again.')).toBeInTheDocument();
  });
});
