import { SLOT_MINUTES, WORK_END_MINUTES, WORK_START_MINUTES } from '../constants';
import { Booking } from '../types';
import { minutesToTime, timeToMinutes } from './date';

export const generateSlots = (): string[] => {
  const slots: string[] = [];
  for (let mins = WORK_START_MINUTES; mins < WORK_END_MINUTES; mins += SLOT_MINUTES) {
    slots.push(minutesToTime(mins));
  }
  return slots;
};

export const validateBooking = (
  existingBookings: Booking[],
  candidate: { date: string; startTime: string; endTime: string; meetingTitle: string },
): string | null => {
  const start = timeToMinutes(candidate.startTime);
  const end = timeToMinutes(candidate.endTime);

  if (!candidate.meetingTitle.trim()) return 'Meeting title is required.';
  if (end <= start) return 'End time must be after start time.';
  if (start < WORK_START_MINUTES || end > WORK_END_MINUTES) {
    return 'Booking must be within office hours (8:00 AM–5:00 PM).';
  }

  if ((start - WORK_START_MINUTES) % SLOT_MINUTES !== 0 || (end - WORK_START_MINUTES) % SLOT_MINUTES !== 0) {
    return 'Start and end times must follow 30-minute increments.';
  }

  const overlaps = existingBookings.some((booking) => {
    const existingStart = timeToMinutes(booking.startTime);
    const existingEnd = timeToMinutes(booking.endTime);
    return start < existingEnd && end > existingStart;
  });

  if (overlaps) return 'That time overlaps with an existing booking.';

  return null;
};
