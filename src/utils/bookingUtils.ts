import { Booking } from '@/types';
import { timeToMinutes } from './dateUtils';

export function hasOverlap(
  bookings: Booking[],
  roomId: string,
  date: string,
  startTime: string,
  endTime: string,
  excludeId?: string
): boolean {
  const newStart = timeToMinutes(startTime);
  const newEnd = timeToMinutes(endTime);
  return bookings
    .filter(b => b.roomId === roomId && b.date === date && b.id !== excludeId)
    .some(b => {
      const bStart = timeToMinutes(b.startTime);
      const bEnd = timeToMinutes(b.endTime);
      return newStart < bEnd && newEnd > bStart;
    });
}

export function getBookingAtSlot(
  bookings: Booking[],
  roomId: string,
  date: string,
  slotTime: string
): Booking | undefined {
  const slotMins = timeToMinutes(slotTime);
  return bookings.find(b => {
    if (b.roomId !== roomId || b.date !== date) return false;
    const start = timeToMinutes(b.startTime);
    const end = timeToMinutes(b.endTime);
    return slotMins >= start && slotMins < end;
  });
}

export function isSlotStart(booking: Booking, slotTime: string): boolean {
  return booking.startTime === slotTime;
}

export function getBookingHeightSlots(booking: Booking): number {
  const start = timeToMinutes(booking.startTime);
  const end = timeToMinutes(booking.endTime);
  return (end - start) / 30;
}

export function getUpcomingBookings(bookings: Booking[]): Booking[] {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const nowMins = now.getHours() * 60 + now.getMinutes();

  return bookings
    .filter(b => {
      if (b.date > todayStr) return true;
      if (b.date === todayStr) return timeToMinutes(b.endTime) > nowMins;
      return false;
    })
    .sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return timeToMinutes(a.startTime) - timeToMinutes(b.startTime);
    });
}
