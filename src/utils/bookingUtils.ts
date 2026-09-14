import { Booking } from '@/types';

/**
 * Half-open interval overlap: [aStart, aEnd) vs [bStart, bEnd).
 * Adjacent bookings (aEnd === bStart) do NOT overlap.
 * Accepts ISO strings or Dates for existing booking bounds.
 */
export function hasOverlap(
  roomId: string,
  startAt: Date,
  endAt: Date,
  existing: Booking[],
  excludeId?: string
): boolean {
  return existing
    .filter(b => b.roomId === roomId && b.id !== excludeId)
    .some(b => {
      const bStart = new Date(b.startAt);
      const bEnd = new Date(b.endAt);
      return startAt < bEnd && endAt > bStart;
    });
}

/**
 * Clip a booking's interval to the displayed civil day [00:00, 24:00) in
 * office time. Returns null if the booking does not intersect the day.
 */
export function clipToDay(
  booking: Booking,
  dayStartUTC: Date,
  dayEndUTC: Date
): { start: Date; end: Date } | null {
  const start = new Date(booking.startAt);
  const end = new Date(booking.endAt);
  if (start >= dayEndUTC || end <= dayStartUTC) return null;
  return {
    start: start < dayStartUTC ? dayStartUTC : start,
    end: end > dayEndUTC ? dayEndUTC : end,
  };
}

/** Minutes from office-midnight for an instant clipped to a given day */
export function minutesIntoDay(instant: Date, dayStartUTC: Date): number {
  return Math.round((instant.getTime() - dayStartUTC.getTime()) / 60000);
}

export function getUpcomingBookings(bookings: Booking[]): Booking[] {
  const now = new Date();
  return bookings
    .filter(b => new Date(b.endAt) > now)
    .sort((a, b) => {
      const aStart = new Date(a.startAt).getTime();
      const bStart = new Date(b.startAt).getTime();
      return aStart - bStart;
    });
}