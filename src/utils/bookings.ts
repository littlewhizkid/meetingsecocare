import { Booking, BookingDuration, BookingsStore } from '../types';
import { SLOT_MINUTES, WORK_END_MINUTES, WORK_START_MINUTES } from '../constants';
import { minutesToTime, timeToMinutes } from './date';

export const generateSlots = (): string[] => {
  const slots: string[] = [];
  for (let mins = WORK_START_MINUTES; mins < WORK_END_MINUTES; mins += SLOT_MINUTES) {
    slots.push(minutesToTime(mins));
  }
  return slots;
};

export const endTimeFromStart = (startTime: string, duration: BookingDuration): string => {
  return minutesToTime(timeToMinutes(startTime) + duration);
};

export const validateBooking = (
  store: BookingsStore,
  candidate: Omit<Booking, 'id' | 'createdAt'>,
): string | null => {
  const start = timeToMinutes(candidate.startTime);
  const end = timeToMinutes(candidate.endTime);

  if (!candidate.bookerName.trim() || !candidate.meetingTitle.trim()) {
    return 'Please fill in all required fields.';
  }

  if (start < WORK_START_MINUTES || end > WORK_END_MINUTES) {
    return 'Booking must be within office hours (8:00 AM–5:00 PM).';
  }

  if ((start - WORK_START_MINUTES) % SLOT_MINUTES !== 0 || (end - WORK_START_MINUTES) % SLOT_MINUTES !== 0) {
    return 'Booking times must align to 30-minute slots.';
  }

  const dayBookings = store[candidate.roomId]?.[candidate.date] ?? [];
  const overlaps = dayBookings.some((booking) => {
    const existingStart = timeToMinutes(booking.startTime);
    const existingEnd = timeToMinutes(booking.endTime);
    return start < existingEnd && end > existingStart;
  });

  if (overlaps) {
    return 'That time overlaps with an existing booking.';
  }

  return null;
};

export const toUpcomingList = (store: BookingsStore): Booking[] => {
  const bookings: Booking[] = [];
  Object.values(store).forEach((roomBookings) => {
    Object.values(roomBookings).forEach((dateBookings) => bookings.push(...dateBookings));
  });

  return bookings.sort((a, b) => {
    const aDate = new Date(`${a.date}T${a.startTime}:00`).getTime();
    const bDate = new Date(`${b.date}T${b.startTime}:00`).getTime();
    return aDate - bDate;
  });
};
