import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BookingModal } from '@/components/BookingModal';
import { Booking, Room } from '@/types';

const rooms: Room[] = [
  { id: 'board-room', name: 'Board Room', description: '', capacity: '12', icon: '🏛️' },
  { id: 'podcast-room', name: 'Podcast Room', description: '', capacity: '10', icon: '🎙️' },
];

const defaultProps = {
  isOpen: true,
  rooms,
  date: '2026-09-20',
  initialRoomId: 'board-room',
  initialStartTime: '09:00',
  allDayPrefill: false,
  editingBooking: null,
  existingBookings: [],
  onClose: vi.fn(),
  onSubmit: vi.fn().mockResolvedValue(undefined),
};

describe('BookingModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders create mode with default date/time prefills', async () => {
    render(<BookingModal {...defaultProps} />);
    expect(screen.getByText('New Booking')).toBeInTheDocument();
    expect(screen.getByLabelText('Start date')).toHaveValue('2026-09-20');
    expect(screen.getByLabelText('End date')).toHaveValue('2026-09-20');
    expect(screen.getByLabelText('Start time')).toHaveValue('09:00');
    // default end is 1 hour later
    expect(screen.getByLabelText('End time')).toHaveValue('10:00');
  });

  it('hides time controls when all-day is checked and submits all-day payload', async () => {
    const user = userEvent.setup();
    render(<BookingModal {...defaultProps} />);

    await user.click(screen.getByLabelText('All-day booking'));
    expect(screen.queryByLabelText('Start time')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('End time')).not.toBeInTheDocument();
    expect(screen.getByText('End date (last day)')).toBeInTheDocument();

    await user.type(screen.getByLabelText('Meeting Title'), 'Offsite prep');
    // extend end date by one day for a 2-day all-day booking
    await user.clear(screen.getByLabelText('End date (last day)'));
    await user.type(screen.getByLabelText('End date (last day)'), '2026-09-21');

    await user.click(screen.getByRole('button', { name: 'Confirm Booking' }));

    await waitFor(() => {
      expect(defaultProps.onSubmit).toHaveBeenCalledWith({
        roomId: 'board-room',
        meetingTitle: 'Offsite prep',
        allDay: true,
        startDate: '2026-09-20',
        endDate: '2026-09-21',
      });
    });
  });

  it('submits a timed same-day booking with times', async () => {
    const user = userEvent.setup();
    render(<BookingModal {...defaultProps} />);

    await user.type(screen.getByLabelText('Meeting Title'), 'Standup');
    await user.click(screen.getByRole('button', { name: 'Confirm Booking' }));

    await waitFor(() => {
      expect(defaultProps.onSubmit).toHaveBeenCalledWith({
        roomId: 'board-room',
        meetingTitle: 'Standup',
        allDay: false,
        startDate: '2026-09-20',
        endDate: '2026-09-20',
        startTime: '09:00',
        endTime: '10:00',
      });
    });
  });

  it('blocks submit without a title', async () => {
    const user = userEvent.setup();
    render(<BookingModal {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: 'Confirm Booking' }));
    expect(screen.getByText('Please enter a meeting title')).toBeInTheDocument();
    expect(defaultProps.onSubmit).not.toHaveBeenCalled();
  });

  it('prefills all-day from the all-day lane and shows edit mode for a booking', async () => {
    const user = userEvent.setup();
    const editing: Booking = {
      id: 'b1',
      roomId: 'podcast-room',
      roomName: 'Podcast Room',
      // Sep 14 all-day: [Sep 14 00:00, Sep 15 00:00) WIB = Sep 13 17:00Z
      startAt: '2026-09-13T17:00:00.000Z',
      endAt: '2026-09-14T17:00:00.000Z',
      allDay: true,
      bookerName: 'Budi',
      meetingTitle: 'Existing offsite',
      userId: 'u1',
      createdAt: '',
      updatedAt: '',
    };
    render(<BookingModal {...defaultProps} editingBooking={editing} />);

    expect(screen.getByText('Edit Booking')).toBeInTheDocument();
    expect(screen.getByLabelText('Meeting Title')).toHaveValue('Existing offsite');
    // UI end date is the inclusive last occupied day (Sep 14)
    expect(screen.getByLabelText('End date (last day)')).toHaveValue('2026-09-14');
    expect(screen.getByLabelText('Start date')).toHaveValue('2026-09-14');

    await user.click(screen.getByRole('button', { name: 'Save Changes' }));
    await waitFor(() => {
      expect(defaultProps.onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ allDay: true, startDate: '2026-09-14', endDate: '2026-09-14' })
      );
    });
  });

  it('prevents end date before start date', async () => {
    const user = userEvent.setup();
    render(<BookingModal {...defaultProps} />);
    const endDate = screen.getByLabelText('End date');
    expect(endDate).toHaveAttribute('min', '2026-09-20');
  });
});