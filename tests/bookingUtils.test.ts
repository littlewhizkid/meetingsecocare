import { describe, it, expect } from 'vitest';
import {
  officeDateTimeToDate,
  dayRangeUTC,
  dateToDateStr,
  dateToTimeStr,
  formatBookingRange,
  intervalsOverlap,
  isValidDateStr,
  isValidTimeStr,
  isSlotAligned,
  daysBetweenInclusive,
  addDaysToStr,
  dayMinutesToTime,
  timeToMinutes,
} from '@/utils/dateUtils';
import { hasOverlap, clipToDay, minutesIntoDay, getUpcomingBookings } from '@/utils/bookingUtils';
import { Booking } from '@/types';

describe('office timezone conversions (Asia/Jakarta, UTC+7)', () => {
  it('converts civil office datetime to UTC by subtracting 7 hours', () => {
    const d = officeDateTimeToDate('2026-09-20', '09:00');
    expect(d.toISOString()).toBe('2026-09-20T02:00:00.000Z');
  });

  it('converts midnight correctly', () => {
    const d = officeDateTimeToDate('2026-09-20', '00:00');
    expect(d.toISOString()).toBe('2026-09-19T17:00:00.000Z');
  });

  it('round-trips instants back to office civil values', () => {
    const inst = officeDateTimeToDate('2026-09-20', '16:30');
    expect(dateToDateStr(inst)).toBe('2026-09-20');
    expect(dateToTimeStr(inst)).toBe('16:30');
  });

  it('computes civil day bounds as half-open UTC interval', () => {
    const { start, end } = dayRangeUTC('2026-09-20');
    expect(start.toISOString()).toBe('2026-09-19T17:00:00.000Z');
    expect(end.toISOString()).toBe('2026-09-20T17:00:00.000Z');
  });
});

describe('validation helpers', () => {
  it('accepts valid dates and rejects malformed ones', () => {
    expect(isValidDateStr('2026-09-20')).toBe(true);
    expect(isValidDateStr('2026-13-01')).toBe(false);
    expect(isValidDateStr('20-09-2026')).toBe(false);
    expect(isValidDateStr('')).toBe(false);
  });

  it('accepts valid times and rejects malformed ones', () => {
    expect(isValidTimeStr('08:00')).toBe(true);
    expect(isValidTimeStr('23:59')).toBe(true);
    expect(isValidTimeStr('24:00')).toBe(false);
    expect(isValidTimeStr('9:00')).toBe(false);
    expect(isValidTimeStr('')).toBe(false);
  });

  it('checks 30-minute alignment', () => {
    expect(isSlotAligned('09:00')).toBe(true);
    expect(isSlotAligned('09:30')).toBe(true);
    expect(isSlotAligned('09:15')).toBe(false);
  });
});

describe('interval overlap (half-open)', () => {
  const s = (date: string, time: string) => officeDateTimeToDate(date, time);

  it('rejects partial overlaps in both directions', () => {
    const a = s('2026-09-20', '09:00');
    const b = officeDateTimeToDate('2026-09-20', '10:30');
    expect(intervalsOverlap(a, s('2026-09-20', '10:00'), s('2026-09-20', '09:30'), b)).toBe(true);
  });

  it('allows adjacent bookings (end === start)', () => {
    expect(
      intervalsOverlap(
        s('2026-09-20', '09:00'),
        s('2026-09-20', '10:00'),
        s('2026-09-20', '10:00'),
        s('2026-09-20', '11:00')
      )
    ).toBe(false);
  });

  it('detects cross-day overlap', () => {
    expect(
      intervalsOverlap(
        s('2026-09-20', '09:00'),
        officeDateTimeToDate('2026-09-21', '10:00'),
        officeDateTimeToDate('2026-09-20', '16:00'),
        officeDateTimeToDate('2026-09-22', '09:00')
      )
    ).toBe(true);
  });
});

describe('hasOverlap with booking objects', () => {
  const mk = (id: string, roomId: string, startISO: string, endISO: string): Booking => ({
    id, roomId, roomName: 'R', startAt: startISO, endAt: endISO, allDay: false,
    bookerName: 'X', meetingTitle: 'T', userId: 'u', createdAt: '', updatedAt: '',
  });

  const existing: Booking[] = [
    mk('b1', 'room1', '2026-09-20T02:00:00.000Z', '2026-09-20T03:30:00.000Z'), // 09:00–10:30 WIB
  ];

  it('flags a clashing new booking in the same room', () => {
    expect(
      hasOverlap('room1', new Date('2026-09-20T03:00:00Z'), new Date('2026-09-20T04:00:00Z'), existing)
    ).toBe(true);
  });

  it('ignores bookings in other rooms', () => {
    expect(
      hasOverlap('room2', new Date('2026-09-20T03:00:00Z'), new Date('2026-09-20T04:00:00Z'), existing)
    ).toBe(false);
  });

  it('excludes the edited booking itself by id', () => {
    expect(
      hasOverlap('room1', new Date('2026-09-20T02:00:00Z'), new Date('2026-09-20T03:30:00Z'), existing, 'b1')
    ).toBe(false);
  });

  it('all-day interval conflicts with any timed booking on occupied dates', () => {
    const allDay: Booking[] = [
      mk('ad1', 'room1', '2026-09-20T17:00:00.000Z', '2026-09-23T17:00:00.000Z'), // Sep 20–23 all-day
    ];
    // timed booking on Sep 22 09:00–10:00 WIB overlaps
    expect(
      hasOverlap('room1', new Date('2026-09-22T02:00:00Z'), new Date('2026-09-22T03:00:00Z'), allDay)
    ).toBe(true);
  });
});

describe('clipToDay', () => {
  const mk = (id: string, startISO: string, endISO: string): Booking => ({
    id, roomId: 'r', roomName: 'R', startAt: startISO, endAt: endISO, allDay: false,
    bookerName: 'X', meetingTitle: 'T', userId: 'u', createdAt: '', updatedAt: '',
  });

  it('clips a booking that started the previous day', () => {
    const booking = mk('x', '2026-09-19T10:00:00Z', '2026-09-20T01:00:00Z'); // ends 08:00 WIB Sep 20
    const { start, end } = dayRangeUTC('2026-09-20');
    const clip = clipToDay(booking, start, end)!;
    expect(clip.start.getTime()).toBe(start.getTime());
    expect(clip.end.getTime()).toBe(new Date('2026-09-20T01:00:00Z').getTime());
    expect(minutesIntoDay(clip.start, start)).toBe(0);
    expect(minutesIntoDay(clip.end, start)).toBe(480); // 08:00
  });

  it('clips a booking that continues into the next day', () => {
    const booking = mk('x', '2026-09-20T09:00:00Z', '2026-09-21T02:00:00Z'); // 16:00 WIB → next day 09:00... actually spans
    const { start, end } = dayRangeUTC('2026-09-20');
    const clip = clipToDay(booking, start, end)!;
    expect(clip.end.getTime()).toBe(end.getTime());
    expect(minutesIntoDay(clip.end, start)).toBe(24 * 60);
  });

  it('returns null when the booking does not intersect the day', () => {
    const booking = mk('x', '2026-09-22T02:00:00Z', '2026-09-22T03:00:00Z');
    const { start, end } = dayRangeUTC('2026-09-20');
    expect(clipToDay(booking, start, end)).toBeNull();
  });
});

describe('all-day semantics', () => {
  it('UI end date is inclusive: Sep 14–16 occupies 3 days', () => {
    // stored: [Sep 14 00:00 WIB, Sep 17 00:00 WIB)
    const start = officeDateTimeToDate('2026-09-14', '00:00');
    const endPlus1 = new Date(officeDateTimeToDate('2026-09-16', '00:00').getTime() + 86400000);
    expect(daysBetweenInclusive('2026-09-14', '2026-09-16')).toBe(3);
    expect(dateToDateStr(start)).toBe('2026-09-14');
    expect(dateToDateStr(endPlus1)).toBe('2026-09-17');
  });

  it('formats all-day ranges with inclusive end', () => {
    const oneDay = { startAt: '2026-09-13T17:00:00.000Z', endAt: '2026-09-14T17:00:00.000Z', allDay: true };
    const threeDays = { startAt: '2026-09-13T17:00:00.000Z', endAt: '2026-09-16T17:00:00.000Z', allDay: true };
    expect(formatBookingRange(oneDay)).toBe('14 Sep 2026');
    expect(formatBookingRange(threeDays)).toBe('14 Sep 2026 – 16 Sep 2026');
  });
});

describe('misc helpers', () => {
  it('adds days across month boundaries', () => {
    expect(addDaysToStr('2026-09-30', 1)).toBe('2026-10-01');
    expect(addDaysToStr('2026-10-01', -1)).toBe('2026-09-30');
  });

  it('converts day-minutes to HH:mm', () => {
    expect(dayMinutesToTime(480)).toBe('08:00');
    expect(dayMinutesToTime(990)).toBe('16:30');
    expect(dayMinutesToTime(1440)).toBe('24:00');
    expect(timeToMinutes('16:30')).toBe(990);
  });

  it('upcoming filter keeps future-end bookings and sorts by start', () => {
    const mk = (id: string, startISO: string, endISO: string): Booking => ({
      id, roomId: 'r', roomName: 'R', startAt: startISO, endAt: endISO, allDay: false,
      bookerName: 'X', meetingTitle: 'T', userId: 'u', createdAt: '', updatedAt: '',
    });
    const now = Date.now();
    const bookings = [
      mk('past', new Date(now - 7200000).toISOString(), new Date(now - 3600000).toISOString()),
      mk('active', new Date(now - 3600000).toISOString(), new Date(now + 3600000).toISOString()),
      mk('later', new Date(now + 7200000).toISOString(), new Date(now + 10800000).toISOString()),
    ];
    const upcoming = getUpcomingBookings(bookings);
    expect(upcoming.map(b => b.id)).toEqual(['active', 'later']);
  });
});