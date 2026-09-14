import { prisma } from '@/lib/prisma';
import {
  OFFICE_TZ,
  WORKING_START,
  WORKING_END,
  officeDateTimeToDate,
  isValidDateStr,
  isValidTimeStr,
  isSlotAligned,
  timeToMinutes,
} from '@/utils/dateUtils';

export interface BookingIntervalInput {
  roomId: string;
  meetingTitle: string;
  allDay: boolean;
  startDate: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
}

export type ValidationResult =
  | { ok: true; startAt: Date; endAt: Date; meetingTitle: string }
  | { ok: false; status: number; error: string };

/**
 * Validates a booking payload and resolves it to a half-open UTC interval.
 *
 * Timed bookings: office hours 08:00–17:00, 30-min alignment, may span days.
 * All-day bookings: startDate is the first occupied civil date and endDate is
 * the LAST occupied civil date (inclusive in the UI). Internally stored as
 * [midnight startDate, midnight endDate+1) in the office timezone.
 */
export async function validateBookingInput(
  input: BookingIntervalInput
): Promise<ValidationResult> {
  const { roomId, allDay } = input;
  const meetingTitle = typeof input.meetingTitle === 'string' ? input.meetingTitle.trim() : '';

  if (!roomId || typeof roomId !== 'string') {
    return { ok: false, status: 400, error: 'Missing room selection' };
  }
  if (!meetingTitle) {
    return { ok: false, status: 400, error: 'Please enter a meeting title' };
  }
  if (meetingTitle.length > 120) {
    return { ok: false, status: 400, error: 'Meeting title must be 120 characters or fewer' };
  }
  if (typeof allDay !== 'boolean') {
    return { ok: false, status: 400, error: 'allDay must be a boolean' };
  }
  if (!isValidDateStr(input.startDate ?? '')) {
    return { ok: false, status: 400, error: 'Invalid start date' };
  }

  let startAt: Date;
  let endAt: Date;

  if (allDay) {
    const startDate = input.startDate;
    const endDate = input.endDate;
    if (!endDate || !isValidDateStr(endDate)) {
      return { ok: false, status: 400, error: 'Invalid end date' };
    }
    if (endDate < startDate) {
      return { ok: false, status: 400, error: 'End date must be on or after the start date' };
    }
    // [midnight of start, midnight of end+1) — UI end date is inclusive
    startAt = officeDateTimeToDate(startDate, '00:00');
    endAt = officeDateTimeToDate(endDate, '00:00');
    endAt = new Date(endAt.getTime() + 24 * 60 * 60 * 1000);
  } else {
    if (!isValidTimeStr(input.startTime ?? '')) {
      return { ok: false, status: 400, error: 'Invalid start time' };
    }
    if (!isValidTimeStr(input.endTime ?? '')) {
      return { ok: false, status: 400, error: 'Invalid end time' };
    }
    const startTime = input.startTime!;
    const endTime = input.endTime!;

    const startMins = timeToMinutes(startTime);
    const endMins = timeToMinutes(endTime);
    if (endMins <= startMins) {
      return { ok: false, status: 400, error: 'End time must be after start time' };
    }
    if (!isSlotAligned(startTime) || !isSlotAligned(endTime)) {
      return { ok: false, status: 400, error: 'Times must be in 30-minute increments' };
    }
    // Office-hours rule applies to each occupied day's boundary times.
    // Cross-day bookings are entered as same-wall-clock end date+time in the
    // UI; the interval must begin at/after 08:00 and end at/before 17:00 on
    // its respective boundary days.
    if (startMins < timeToMinutes(WORKING_START) || endMins > timeToMinutes(WORKING_END)) {
      return { ok: false, status: 400, error: 'Bookings must be within 8:00 AM – 5:00 PM' };
    }

    // End date: default to start date (same-day booking)
    const endDateStr = input.endDate && isValidDateStr(input.endDate) ? input.endDate : input.startDate;
    if (endDateStr < input.startDate) {
      return { ok: false, status: 400, error: 'End date must be on or after the start date' };
    }

    startAt = officeDateTimeToDate(input.startDate, startTime);
    endAt = officeDateTimeToDate(endDateStr, endTime);
  }

  if (endAt <= startAt) {
    return { ok: false, status: 400, error: 'End must be after start' };
  }

  // Reject bookings starting in the past (office time)
  if (startAt.getTime() < Date.now()) {
    return { ok: false, status: 400, error: 'Booking start time is in the past' };
  }

  const room = await prisma.room.findUnique({ where: { id: roomId } });
  if (!room) {
    return { ok: false, status: 400, error: 'Selected room does not exist' };
  }

  return { ok: true, startAt, endAt, meetingTitle };
}

/** Postgres exclusion-constraint violation (23P01) */
export function isOverlapViolation(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const err = error as { code?: string; message?: string };
  if (err.code === '23P01') return true;
  // Prisma 5 may surface exclusion violations as unknown-request errors with
  // the Postgres code embedded in the message.
  return typeof err.message === 'string' && err.message.includes('23P01');
}

export const OFFICE_TIMEZONE = OFFICE_TZ;