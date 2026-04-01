import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Timestamp } from 'firebase/firestore';
import { EventModal } from './EventModal';
import type { FeedingEvent, PeeEvent, MedicationEvent } from '../types/events';

const mockAddEvent = vi.fn();
const mockUpdateEvent = vi.fn();
const mockDeleteEvent = vi.fn();

vi.mock('../services/events', () => ({
  addEvent: (...args: unknown[]) => mockAddEvent(...args),
  updateEvent: (...args: unknown[]) => mockUpdateEvent(...args),
  deleteEvent: (...args: unknown[]) => mockDeleteEvent(...args),
}));

function makePeeEvent(): PeeEvent {
  return {
    id: 'evt-1',
    babyId: 'baby-1',
    type: 'pee',
    timestamp: Timestamp.fromDate(new Date(2026, 3, 1, 10, 30)),
    createdBy: 'user-1',
    createdAt: Timestamp.fromDate(new Date()),
  };
}

function makeFeedingEvent(): FeedingEvent {
  return {
    id: 'evt-2',
    babyId: 'baby-1',
    type: 'feeding',
    feedingType: 'right',
    durationMinutes: 15,
    infection: true,
    engorgement: false,
    timestamp: Timestamp.fromDate(new Date(2026, 3, 1, 9, 0)),
    createdBy: 'user-1',
    createdAt: Timestamp.fromDate(new Date()),
  };
}

function makeMedicationEvent(): MedicationEvent {
  return {
    id: 'evt-3',
    babyId: 'baby-1',
    type: 'medication',
    medicationName: 'Vitamin D',
    dose: '1 drop',
    timestamp: Timestamp.fromDate(new Date(2026, 3, 1, 8, 0)),
    createdBy: 'user-1',
    createdAt: Timestamp.fromDate(new Date()),
  };
}

const baseProps = {
  familyId: 'fam-1',
  babyId: 'baby-1',
  userId: 'user-1',
  onClose: vi.fn(),
};

describe('EventModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAddEvent.mockResolvedValue('new-id');
    mockUpdateEvent.mockResolvedValue(undefined);
    mockDeleteEvent.mockResolvedValue(undefined);
  });

  describe('add mode', () => {
    it('should show type selection grid in add mode', () => {
      render(
        <EventModal {...baseProps} mode="add" date={new Date()} />,
      );

      expect(screen.getByText('Add Event')).toBeInTheDocument();
      expect(screen.getByText('Feedings')).toBeInTheDocument();
      expect(screen.getByText('Pees')).toBeInTheDocument();
      expect(screen.getByText('Poops')).toBeInTheDocument();
      expect(screen.getByText('Meds')).toBeInTheDocument();
    });

    it('should show form after selecting a type', async () => {
      const user = userEvent.setup();
      render(
        <EventModal {...baseProps} mode="add" date={new Date()} />,
      );

      await user.click(screen.getByText('Pees'));
      expect(screen.getByText('Save')).toBeInTheDocument();
      expect(screen.getByLabelText(/time/i)).toBeInTheDocument();
    });

    it('should save a new pee event', async () => {
      const user = userEvent.setup();
      render(
        <EventModal {...baseProps} mode="add" date={new Date()} />,
      );

      await user.click(screen.getByText('Pees'));
      await user.click(screen.getByText('Save'));

      expect(mockAddEvent).toHaveBeenCalledOnce();
      expect(mockAddEvent.mock.calls[0][0]).toBe('fam-1');
    });
  });

  describe('edit mode', () => {
    it('should show pre-filled form in edit mode', () => {
      const event = makeFeedingEvent();
      render(
        <EventModal {...baseProps} mode="edit" event={event} />,
      );

      expect(screen.getByText('Edit Event')).toBeInTheDocument();
      expect(screen.getByText('Update')).toBeInTheDocument();
      expect(screen.getByDisplayValue('09:00')).toBeInTheDocument();
    });

    it('should pre-fill feeding fields', () => {
      const event = makeFeedingEvent();
      render(
        <EventModal {...baseProps} mode="edit" event={event} />,
      );

      expect(screen.getByDisplayValue('15')).toBeInTheDocument();
      expect(screen.getByLabelText(/infection/i)).toBeChecked();
      expect(screen.getByLabelText(/engorgement/i)).not.toBeChecked();
    });

    it('should pre-fill medication fields', () => {
      const event = makeMedicationEvent();
      render(
        <EventModal {...baseProps} mode="edit" event={event} />,
      );

      expect(screen.getByDisplayValue('Vitamin D')).toBeInTheDocument();
      expect(screen.getByDisplayValue('1 drop')).toBeInTheDocument();
    });

    it('should call updateEvent on save', async () => {
      const user = userEvent.setup();
      const event = makePeeEvent();
      render(
        <EventModal {...baseProps} mode="edit" event={event} />,
      );

      await user.click(screen.getByText('Update'));

      expect(mockUpdateEvent).toHaveBeenCalledOnce();
      expect(mockUpdateEvent.mock.calls[0][0]).toBe('fam-1');
      expect(mockUpdateEvent.mock.calls[0][1]).toBe('evt-1');
    });

    it('should show delete confirmation when delete is clicked', async () => {
      const user = userEvent.setup();
      const event = makePeeEvent();
      render(
        <EventModal {...baseProps} mode="edit" event={event} />,
      );

      await user.click(screen.getByText('Delete'));
      expect(screen.getByText('Delete this event?')).toBeInTheDocument();
      expect(screen.getByText('Yes, delete')).toBeInTheDocument();
    });

    it('should call deleteEvent when confirmed', async () => {
      const user = userEvent.setup();
      const event = makePeeEvent();
      render(
        <EventModal {...baseProps} mode="edit" event={event} />,
      );

      await user.click(screen.getByText('Delete'));
      await user.click(screen.getByText('Yes, delete'));

      expect(mockDeleteEvent).toHaveBeenCalledWith('fam-1', 'evt-1');
    });

    it('should cancel delete when cancel is clicked', async () => {
      const user = userEvent.setup();
      const event = makePeeEvent();
      render(
        <EventModal {...baseProps} mode="edit" event={event} />,
      );

      await user.click(screen.getByText('Delete'));
      await user.click(screen.getByText('Cancel'));

      expect(screen.queryByText('Delete this event?')).not.toBeInTheDocument();
      expect(mockDeleteEvent).not.toHaveBeenCalled();
    });
  });

  describe('validation', () => {
    it('should show error for time more than 24h in the future', async () => {
      const user = userEvent.setup();
      // Use a date far in the future
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 2);

      render(
        <EventModal {...baseProps} mode="add" date={futureDate} />,
      );

      await user.click(screen.getByText('Pees'));
      await user.click(screen.getByText('Save'));

      expect(screen.getByText('Time cannot be more than 24 hours in the future')).toBeInTheDocument();
      expect(mockAddEvent).not.toHaveBeenCalled();
    });

    it('should require medication name and dose', async () => {
      const user = userEvent.setup();
      render(
        <EventModal {...baseProps} mode="add" date={new Date()} />,
      );

      await user.click(screen.getByText('Meds'));

      // Save button should be disabled when name and dose are empty
      const saveBtn = screen.getByText('Save');
      expect(saveBtn).toBeDisabled();
    });

    it('should disable save when medication name is cleared in edit mode', async () => {
      const user = userEvent.setup();
      const event = makeMedicationEvent();
      render(
        <EventModal {...baseProps} mode="edit" event={event} />,
      );

      // Clear the medication name
      const nameInput = screen.getByDisplayValue('Vitamin D');
      await user.clear(nameInput);

      // Update button should be disabled
      expect(screen.getByText('Update')).toBeDisabled();
    });

    it('should truncate notes to max length', async () => {
      const user = userEvent.setup();
      render(
        <EventModal {...baseProps} mode="add" date={new Date()} />,
      );

      await user.click(screen.getByText('Pees'));

      const notesInput = screen.getByPlaceholderText(/additional notes/i);
      // Type a long string — the input has maxLength=500, so it will be truncated by the browser
      const longText = 'a'.repeat(500);
      await user.type(notesInput, longText);

      // Should show character count when near limit
      expect(screen.getByText(/\/500/)).toBeInTheDocument();
    });

    it('should show error when save fails', async () => {
      const user = userEvent.setup();
      mockAddEvent.mockRejectedValueOnce(new Error('Network error'));

      render(
        <EventModal {...baseProps} mode="add" date={new Date()} />,
      );

      await user.click(screen.getByText('Pees'));
      await user.click(screen.getByText('Save'));

      expect(await screen.findByText('Failed to save. Please try again.')).toBeInTheDocument();
    });

    it('should show error when delete fails', async () => {
      const user = userEvent.setup();
      mockDeleteEvent.mockRejectedValueOnce(new Error('Network error'));

      const event = makePeeEvent();
      render(
        <EventModal {...baseProps} mode="edit" event={event} />,
      );

      await user.click(screen.getByText('Delete'));
      await user.click(screen.getByText('Yes, delete'));

      expect(await screen.findByText('Failed to delete. Please try again.')).toBeInTheDocument();
    });
  });

  it('should close on Escape key', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <EventModal {...baseProps} onClose={onClose} mode="add" date={new Date()} />,
    );

    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('should close when overlay is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const { container } = render(
      <EventModal {...baseProps} onClose={onClose} mode="add" date={new Date()} />,
    );

    const overlay = container.firstChild as HTMLElement;
    await user.click(overlay);
    expect(onClose).toHaveBeenCalledOnce();
  });
});
