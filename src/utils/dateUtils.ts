import { DateTime, Interval } from 'luxon';

export const OFFICE_TZ = 'Asia/Jakarta';
export const WORKING_START = '08:00';
export const WORKING_END = '17:00';
export const SLOT_MINUTES = 30;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export function isValidDateStr(dateStr: string): boolean {
  if (!DATE_RE.test(dateStr)) return false;
  return DateTime.fromISO(dateStr, { zone: OFFICE_TZ }).isValid;
}

export function isValidTimeStr(timeStr: string): boolean {
  if (!TIME_RE.test(timeStr)) return false;
  const dt = DateTime.fromFormat(timeStr, 'HH:mm', { zone: OFFICE_TZ });
  return dt.isValid;
}

export function isSlotAligned(timeStr: string): boolean {
  return timeToMinutes(timeStr) % SLOT_MINUTES === 0;
}

/** Civil date in office timezone -> YYYY-MM-DD */
export function getTodayStr(): string {
  return DateTime.now().setZone(OFFICE_TZ).toISODate() as string;
}

/** Current office-timezone wall clock as minutes since midnight */
export function nowMinutesOffice(): number {
  const now = DateTime.now().setZone(OFFICE_TZ);
  return now.hour * 60 + now.minute;
}

/** YYYY-MM-DD + HH:mm wall clock (office tz) -> UTC Date */
export function officeDateTimeToDate(dateStr: string, timeStr: string): Date {
  return DateTime.fromISO(`${dateStr}T${timeStr}:00`, { zone: OFFICE_TZ }).toJSDate();
}

/** UTC instant -> YYYY-MM-DD in office timezone */
export function dateToDateStr(instant: Date | string): string {
  return toDate(instant).toISODate() as string;
}

/** UTC instant -> HH:mm in office timezone */
export function dateToTimeStr(instant: Date | string): string {
  return toDate(instant).toFormat('HH:mm');
}

function toDate(instant: Date | string): DateTime {
  return DateTime.fromISO(typeof instant === 'string' ? instant : instant.toISOString(), { zone: 'utc' }).setZone(OFFICE_TZ);
}

export function parseDate(dateStr: string): Date {
  // Midnight of the civil date in office timezone (for display comparisons)
  return DateTime.fromISO(`${dateStr}T00:00:00`, { zone: OFFICE_TZ }).toJSDate();
}

export function formatDate(date: Date): string {
  return DateTime.fromJSDate(date).setZone(OFFICE_TZ).toFormat('yyyy-MM-dd');
}

export function formatDisplayDate(dateStr: string): string {
  return DateTime.fromISO(dateStr, { zone: OFFICE_TZ }).toFormat('cccc, d LLLL yyyy');
}

export function formatDisplayDateShort(dateStr: string): string {
  return DateTime.fromISO(dateStr, { zone: OFFICE_TZ }).toFormat('d LLL yyyy');
}

export function addDaysToStr(dateStr: string, days: number): string {
  return DateTime.fromISO(dateStr, { zone: OFFICE_TZ }).plus({ days }).toISODate() as string;
}

export function daysBetweenInclusive(startStr: string, endStr: string): number {
  const start = DateTime.fromISO(startStr, { zone: OFFICE_TZ });
  const end = DateTime.fromISO(endStr, { zone: OFFICE_TZ });
  return Math.round(end.diff(start, 'days').days) + 1;
}

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/** Minutes since office-midnight -> HH:mm */
export function dayMinutesToTime(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function formatTimeDisplay(time: string): string {
  return DateTime.fromFormat(time, 'HH:mm', { zone: OFFICE_TZ }).toFormat('h:mm a');
}

/** Office-tz civil day bounds as UTC instants: [start, end) */
export function dayRangeUTC(dateStr: string): { start: Date; end: Date } {
  const start = DateTime.fromISO(`${dateStr}T00:00:00`, { zone: OFFICE_TZ });
  return { start: start.toJSDate(), end: start.plus({ days: 1 }).toJSDate() };
}

export function isToday(dateStr: string): boolean {
  return dateStr === getTodayStr();
}

/** Is the slot (date + 30-min start) entirely in the past, per office time? */
export function isPastSlot(dateStr: string, slotTime: string): boolean {
  const today = getTodayStr();
  if (dateStr < today) return true;
  if (dateStr > today) return false;
  return timeToMinutes(slotTime) + SLOT_MINUTES <= nowMinutesOffice();
}

/** Is a booking interval entirely in the past, per office time? */
export function isPastInterval(startAt: Date | string, endAt: Date | string): boolean {
  return toDate(endAt) <= DateTime.now().setZone(OFFICE_TZ);
}

/** Do two half-open UTC intervals overlap? */
export function intervalsOverlap(
  aStart: Date, aEnd: Date, bStart: Date | string, bEnd: Date | string
): boolean {
  const bS = typeof bStart === 'string' ? new Date(bStart) : bStart;
  const bE = typeof bEnd === 'string' ? new Date(bEnd) : bEnd;
  return aStart < bE && aEnd > bS;
}

/** Format an interval for display in office tz; all-day shows inclusive dates */
export function formatBookingRange(b: { startAt: string; endAt: string; allDay: boolean }): string {
  const start = toDate(b.startAt);
  const end = toDate(b.endAt);
  if (b.allDay) {
    const inclusiveEnd = end.minus({ days: 1 });
    const startStr = start.toFormat('d LLL yyyy');
    const endStr = inclusiveEnd.toFormat('d LLL yyyy');
    return startStr === endStr ? startStr : `${startStr} – ${endStr}`;
  }
  const sameDay = start.hasSame(end, 'day');
  if (sameDay) {
    return `${start.toFormat('d LLL yyyy')} · ${start.toFormat('h:mm a')} – ${end.toFormat('h:mm a')}`;
  }
  return `${start.toFormat('d LLL, h:mm a')} – ${end.toFormat('d LLL, h:mm a')}`;
}

export { DateTime, Interval };