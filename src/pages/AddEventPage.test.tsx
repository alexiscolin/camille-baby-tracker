import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AddEventPage } from './AddEventPage';

const mockAddEvent = vi.fn();

vi.mock('../services/events', () => ({
  addEvent: (...args: unknown[]) => mockAddEvent(...args),
}));

describe('AddEventPage', () => {
  const defaultProps = {
    familyId: 'fam-1',
    babyId: 'baby-1',
    userId: 'user-1',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockAddEvent.mockResolvedValue('event-id');
  });

  it('should show infection and engorgement checkboxes when feeding is selected', async () => {
    const user = userEvent.setup();
    render(<AddEventPage {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: /feeding/i }));

    expect(screen.getByLabelText(/infection/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/engorgement/i)).toBeInTheDocument();
  });

  it('should not show infection and engorgement checkboxes for non-feeding events', async () => {
    const user = userEvent.setup();
    render(<AddEventPage {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: /pee/i }));

    expect(screen.queryByLabelText(/infection/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/engorgement/i)).not.toBeInTheDocument();
  });

  it('should save feeding event with infection flag when checked', async () => {
    const user = userEvent.setup();
    render(<AddEventPage {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: /feeding/i }));
    await user.click(screen.getByLabelText(/infection/i));
    await user.click(screen.getByRole('button', { name: /save/i }));

    expect(mockAddEvent).toHaveBeenCalledOnce();
    const savedEvent = mockAddEvent.mock.calls[0][1];
    expect(savedEvent.infection).toBe(true);
    expect(savedEvent.engorgement).toBe(false);
  });

  it('should save feeding event with engorgement flag when checked', async () => {
    const user = userEvent.setup();
    render(<AddEventPage {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: /feeding/i }));
    await user.click(screen.getByLabelText(/engorgement/i));
    await user.click(screen.getByRole('button', { name: /save/i }));

    expect(mockAddEvent).toHaveBeenCalledOnce();
    const savedEvent = mockAddEvent.mock.calls[0][1];
    expect(savedEvent.infection).toBe(false);
    expect(savedEvent.engorgement).toBe(true);
  });

  it('should save feeding event with both flags when both are checked', async () => {
    const user = userEvent.setup();
    render(<AddEventPage {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: /feeding/i }));
    await user.click(screen.getByLabelText(/infection/i));
    await user.click(screen.getByLabelText(/engorgement/i));
    await user.click(screen.getByRole('button', { name: /save/i }));

    expect(mockAddEvent).toHaveBeenCalledOnce();
    const savedEvent = mockAddEvent.mock.calls[0][1];
    expect(savedEvent.infection).toBe(true);
    expect(savedEvent.engorgement).toBe(true);
  });

  it('should not include infection/engorgement flags for non-feeding events', async () => {
    const user = userEvent.setup();
    render(<AddEventPage {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: /pee/i }));
    await user.click(screen.getByRole('button', { name: /save/i }));

    expect(mockAddEvent).toHaveBeenCalledOnce();
    const savedEvent = mockAddEvent.mock.calls[0][1];
    expect(savedEvent.infection).toBeUndefined();
    expect(savedEvent.engorgement).toBeUndefined();
  });
});
