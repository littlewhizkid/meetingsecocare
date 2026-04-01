'use client';
import { useState } from 'react';
import { Booking, Room } from '@/types';
import { DISPLAY_SLOTS } from '@/constants';
import { getBookingAtSlot, getBookingHeightSlots } from '@/utils/bookingUtils';
import { formatTimeDisplay, isPastSlot } from '@/utils/dateUtils';

interface Props {
  rooms: Room[];
  selectedDate: string;
  bookingsByRoom: Record<string, Booking[]>;
  currentUserId: string;
  isAdmin: boolean;
  onSlotClick: (roomId: string, slotTime: string) => void;
  onCancelBooking: (booking: Booking) => void;
}

const SLOT_HEIGHT = 56; // px per 30-min slot

export function BookingGrid({
  rooms,
  selectedDate,
  bookingsByRoom,
  currentUserId,
  isAdmin,
  onSlotClick,
  onCancelBooking,
}: Props) {
  const [hoveredBookingId, setHoveredBookingId] = useState<string | null>(null);
  const totalBodyHeight = SLOT_HEIGHT * DISPLAY_SLOTS.length;

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
            const bookings = (bookingsByRoom[room.id] ?? []).filter(b => b.date === selectedDate);

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
                  const occupied = !!getBookingAtSlot(bookings, room.id, selectedDate, slot.time);

                  return (
                    <div
                      key={slot.time}
                      style={{ top: `${idx * SLOT_HEIGHT}px`, height: `${SLOT_HEIGHT}px` }}
                      className="absolute inset-x-0 border-b border-gray-50"
                    >
                      {!occupied && (
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

                {/* Absolutely positioned booking cards */}
                {bookings.map(booking => {
                  const startIdx = DISPLAY_SLOTS.findIndex(s => s.time === booking.startTime);
                  if (startIdx === -1) return null;
                  const heightSlots = getBookingHeightSlots(booking);
                  const isPast = isPastSlot(selectedDate, booking.startTime);
                  const canCancel = booking.userId === currentUserId || isAdmin;
                  const isHovered = hoveredBookingId === booking.id;

                  return (
                    <div
                      key={booking.id}
                      style={{
                        top: `${startIdx * SLOT_HEIGHT + 3}px`,
                        height: `${heightSlots * SLOT_HEIGHT - 6}px`,
                      }}
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
                        {booking.meetingTitle}
                      </div>
                      <div
                        className={`text-xs mt-0.5 truncate ${
                          isPast ? 'text-gray-400' : 'text-green-100'
                        }`}
                      >
                        {booking.bookerName}
                      </div>
                      {heightSlots >= 2 && (
                        <div
                          className={`text-xs mt-0.5 truncate ${
                            isPast ? 'text-gray-400' : 'text-green-200'
                          }`}
                        >
                          {formatTimeDisplay(booking.startTime)} – {formatTimeDisplay(booking.endTime)}
                        </div>
                      )}

                      {/* Cancel button on hover */}
                      {canCancel && isHovered && !isPast && (
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            onCancelBooking(booking);
                          }}
                          className="absolute top-1.5 right-1.5 w-5 h-5 flex items-center justify-center rounded-full bg-white/20 hover:bg-red-500 text-white text-xs font-bold transition-colors"
                          title="Cancel booking"
                        >
                          ✕
                        </button>
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
