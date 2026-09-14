'use client';
import { useState } from 'react';
import { Booking, Room } from '@/types';
import { DISPLAY_SLOTS } from '@/constants';
import { clipToDay, minutesIntoDay } from '@/utils/bookingUtils';
import {
  formatTimeDisplay,
  isPastSlot,
  dayRangeUTC,
  dateToDateStr,
  dateToTimeStr,
  dayMinutesToTime,
} from '@/utils/dateUtils';

interface Props {
  rooms: Room[];
  selectedDate: string;
  bookingsByRoom: Record<string, Booking[]>;
  currentUserId: string;
  isAdmin: boolean;
  onSlotClick: (roomId: string, slotTime: string) => void;
  onEditBooking: (booking: Booking) => void;
  onCancelBooking: (booking: Booking) => void;
}

const SLOT_HEIGHT = 56; // px per 30-min slot
const ALL_DAY_ROW_HEIGHT = 44; // px

export function BookingGrid({
  rooms,
  selectedDate,
  bookingsByRoom,
  currentUserId,
  isAdmin,
  onSlotClick,
  onEditBooking,
  onCancelBooking,
}: Props) {
  const [hoveredBookingId, setHoveredBookingId] = useState<string | null>(null);
  const totalBodyHeight = SLOT_HEIGHT * DISPLAY_SLOTS.length;
  const dayBounds = dayRangeUTC(selectedDate);
  const today = dateToDateStr(new Date());

  const startsBeforeDay = (b: Booking) => new Date(b.startAt) < dayBounds.start;
  const endsAfterDay = (b: Booking) => new Date(b.endAt) > dayBounds.end;

  return (
    <div className="flex-1 overflow-auto">
      <div className="min-w-[640px]">

        {/* ── Sticky header row ── */}
        <div className="sticky top-0 z-20 bg-white border-b border-gray-200 flex shadow-sm">
          {/* Time gutter corner */}
          <div className="w-20 flex-shrink-0 border-r border-gray-100" />

          {/* Room header cells */}
          {rooms.map((room, i) => (
            <div
              key={room.id}
              className={`flex-1 min-w-[160px] px-3 py-3 flex items-center gap-2.5 ${
                i < rooms.length - 1 ? 'border-r border-gray-100' : ''
              }`}
            >
              <span className="text-xl flex-shrink-0">{room.icon}</span>
              <div className="min-w-0">
                <div className="font-semibold text-sm text-gray-900 leading-tight truncate">{room.name}</div>
                <div className="text-xs text-gray-400 truncate">{room.capacity}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── All-day lane ── */}
        <div className="flex border-b border-gray-200 bg-slate-50/50">
          <div className="w-20 flex-shrink-0 border-r border-gray-100 px-3 py-2.5">
            <span className="text-xs font-medium text-gray-400">All day</span>
          </div>
          {rooms.map((room, i) => {
            const allDayBookings = (bookingsByRoom[room.id] ?? []).filter(
              b => b.allDay && clipToDay(b, dayBounds.start, dayBounds.end)
            );
            const hasAllDay = allDayBookings.length > 0;

            return (
              <div
                key={room.id}
                className={`flex-1 min-w-[160px] px-1.5 py-1.5 relative ${i < rooms.length - 1 ? 'border-r border-gray-100' : ''}`}
                style={{ minHeight: `${ALL_DAY_ROW_HEIGHT}px` }}
              >
                {hasAllDay ? (
                  allDayBookings.map(booking => {
                    const isPast = new Date(booking.endAt) <= new Date();
                    const canModify = booking.userId === currentUserId || isAdmin;
                    const isHovered = hoveredBookingId === booking.id;
                    return (
                      <div
                        key={booking.id}
                        className={`relative rounded-lg px-2.5 py-1.5 shadow-sm transition-shadow select-none ${
                          isPast
                            ? 'bg-gray-200 border border-gray-300'
                            : 'bg-amber-500 border border-amber-600 hover:shadow-md'
                        }`}
                        onMouseEnter={() => setHoveredBookingId(booking.id)}
                        onMouseLeave={() => setHoveredBookingId(null)}
                        title={`${booking.meetingTitle} — all day${startsBeforeDay(booking) ? ' (continues)' : ''}`}
                      >
                        <div className={`font-semibold text-xs leading-tight truncate ${isPast ? 'text-gray-500' : 'text-white'}`}>
                          ☀ {booking.meetingTitle}
                          {startsBeforeDay(booking) && <span className="ml-1 opacity-80">◀</span>}
                          {endsAfterDay(booking) && <span className="ml-1 opacity-80">▶</span>}
                        </div>
                        <div className={`text-xs mt-0.5 truncate ${isPast ? 'text-gray-400' : 'text-amber-100'}`}>
                          {booking.bookerName}
                        </div>
                        {canModify && isHovered && !isPast && (
                          <div className="absolute top-1 right-1 flex gap-1">
                            <button
                              onClick={e => { e.stopPropagation(); onEditBooking(booking); }}
                              className="w-5 h-5 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/40 text-white text-[10px] font-bold transition-colors"
                              title="Edit booking"
                            >✎</button>
                            <button
                              onClick={e => { e.stopPropagation(); onCancelBooking(booking); }}
                              className="w-5 h-5 flex items-center justify-center rounded-full bg-white/20 hover:bg-red-500 text-white text-xs font-bold transition-colors"
                              title="Cancel booking"
                            >✕</button>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <button
                    onClick={() => onSlotClick(room.id, 'allday')}
                    className="absolute inset-1 rounded-lg border-2 border-dashed border-transparent hover:border-amber-300 hover:bg-amber-50 cursor-pointer group transition-all"
                  >
                    <span className="absolute inset-0 flex items-center justify-center text-xs text-amber-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity select-none">
                      + All-day
                    </span>
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Body: time column + room slot columns ── */}
        <div className="flex">

          {/* Time column */}
          <div className="w-20 flex-shrink-0 border-r border-gray-100">
            {DISPLAY_SLOTS.map(slot => (
              <div
                key={slot.time}
                style={{ height: `${SLOT_HEIGHT}px` }}
                className="flex items-start justify-end pr-3 pt-2 border-b border-gray-50"
              >
                <span className="text-xs font-medium text-gray-400 tabular-nums">{slot.label}</span>
              </div>
            ))}
          </div>

          {/* Room slot columns */}
          {rooms.map((room, i) => {
            const roomBookings = (bookingsByRoom[room.id] ?? [])
              .filter(b => !b.allDay)
              .map(b => ({ booking: b, clip: clipToDay(b, dayBounds.start, dayBounds.end) }))
              .filter(x => x.clip !== null) as { booking: Booking; clip: { start: Date; end: Date } }[];

            return (
              <div
                key={room.id}
                className={`flex-1 min-w-[160px] relative ${
                  i < rooms.length - 1 ? 'border-r border-gray-100' : ''
                }`}
                style={{ height: `${totalBodyHeight}px` }}
              >
                {/* Slot background rows + clickable empty slots */}
                {DISPLAY_SLOTS.map((slot, idx) => {
                  const isPast = isPastSlot(selectedDate, slot.time);
                  const slotStartUTC = new Date(dayBounds.start.getTime() + idx * 30 * 60000);
                  const occupied = roomBookings.some(
                    ({ clip }) => clip.start <= slotStartUTC && clip.end > slotStartUTC
                  );
                  const allDayBlock = (bookingsByRoom[room.id] ?? []).some(
                    b => b.allDay && new Date(b.startAt) < new Date(dayBounds.start.getTime() + (idx + 1) * 30 * 60000) && new Date(b.endAt) > slotStartUTC
                  );

                  return (
                    <div
                      key={slot.time}
                      style={{ top: `${idx * SLOT_HEIGHT}px`, height: `${SLOT_HEIGHT}px` }}
                      className="absolute inset-x-0 border-b border-gray-50"
                    >
                      {!occupied && !allDayBlock && (
                        <button
                          onClick={() => !isPast && onSlotClick(room.id, slot.time)}
                          disabled={isPast}
                          className={`absolute inset-1 rounded-lg border-2 border-dashed transition-all ${
                            isPast
                              ? 'border-gray-100 opacity-30 cursor-default'
                              : 'border-transparent hover:border-brand-300 hover:bg-brand-50 cursor-pointer group'
                          }`}
                        >
                          {!isPast && (
                            <span className="absolute inset-0 flex items-center justify-center text-xs text-brand-500 font-medium opacity-0 group-hover:opacity-100 transition-opacity select-none">
                              + Book
                            </span>
                          )}
                        </button>
                      )}
                    </div>
                  );
                })}

                {/* Absolutely positioned booking cards (clipped to day) */}
                {roomBookings.map(({ booking, clip }) => {
                  const startMin = minutesIntoDay(clip.start, dayBounds.start);
                  const endMin = minutesIntoDay(clip.end, dayBounds.start);
                  const topPx = (startMin / 30) * SLOT_HEIGHT;
                  const heightPx = ((endMin - startMin) / 30) * SLOT_HEIGHT - 6;
                  const startsBefore = startsBeforeDay(booking);
                  const endsAfter = endsAfterDay(booking);
                  const isPast = new Date(booking.endAt) <= new Date();
                  const canModify = booking.userId === currentUserId || isAdmin;
                  const isHovered = hoveredBookingId === booking.id;

                  const timeLabel = startsBefore && !endsAfter
                    ? `until ${formatTimeDisplay(dayMinutesToTime(endMin))}`
                    : endsAfter && !startsBefore
                    ? `from ${formatTimeDisplay(dayMinutesToTime(startMin))}`
                    : `${formatTimeDisplay(dayMinutesToTime(startMin))} – ${formatTimeDisplay(dayMinutesToTime(endMin))}`;

                  return (
                    <div
                      key={booking.id}
                      style={{ top: `${topPx + 3}px`, height: `${Math.max(heightPx, 20)}px` }}
                      className={`absolute inset-x-1.5 rounded-xl flex flex-col justify-center px-3 z-10 shadow-sm transition-shadow select-none ${
                        isPast
                          ? 'bg-gray-200 border border-gray-300'
                          : 'bg-brand-600 border border-brand-700 hover:shadow-md'
                      }`}
                      onMouseEnter={() => setHoveredBookingId(booking.id)}
                      onMouseLeave={() => setHoveredBookingId(null)}
                    >
                      <div
                        className={`font-semibold text-xs leading-tight truncate ${
                          isPast ? 'text-gray-500' : 'text-white'
                        }`}
                      >
                        {startsBefore && <span className="mr-1 opacity-80">◀</span>}
                        {booking.meetingTitle}
                        {endsAfter && <span className="ml-1 opacity-80">▶</span>}
                      </div>
                      <div
                        className={`text-xs mt-0.5 truncate ${
                          isPast ? 'text-gray-400' : 'text-green-100'
                        }`}
                      >
                        {booking.bookerName}
                      </div>
                      {(endMin - startMin) >= 60 && (
                        <div
                          className={`text-xs mt-0.5 truncate ${
                            isPast ? 'text-gray-400' : 'text-green-200'
                          }`}
                        >
                          {timeLabel}
                        </div>
                      )}

                      {/* Edit + cancel on hover */}
                      {canModify && isHovered && !isPast && (
                        <div className="absolute top-1.5 right-1.5 flex gap-1">
                          <button
                            onClick={e => { e.stopPropagation(); onEditBooking(booking); }}
                            className="w-5 h-5 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/40 text-white text-[10px] font-bold transition-colors"
                            title="Edit booking"
                          >✎</button>
                          <button
                            onClick={e => { e.stopPropagation(); onCancelBooking(booking); }}
                            className="w-5 h-5 flex items-center justify-center rounded-full bg-white/20 hover:bg-red-500 text-white text-xs font-bold transition-colors"
                            title="Cancel booking"
                          >✕</button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}