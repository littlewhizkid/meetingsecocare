import { Booking } from '../types';
import { minutesToLabel, timeToMinutes } from '../utils/date';

type Props = {
  slots: string[];
  bookings: Booking[];
  onSlotClick: (time: string) => void;
  onCancelBooking: (booking: Booking) => void;
  canManageBooking: (booking: Booking) => boolean;
};

const findBookingAtTime = (bookings: Booking[], slotTime: string): Booking | undefined => {
  const slotMinutes = timeToMinutes(slotTime);
  return bookings.find((booking) => {
    const start = timeToMinutes(booking.startTime);
    const end = timeToMinutes(booking.endTime);
    return slotMinutes >= start && slotMinutes < end;
  });
};

export const BookingGrid = ({ slots, bookings, onSlotClick, onCancelBooking, canManageBooking }: Props) => {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
      <div className="grid grid-cols-[110px_1fr] text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        <div className="border-b border-r border-slate-200 p-3 dark:border-slate-700">Time</div>
        <div className="border-b border-slate-200 p-3 dark:border-slate-700">Schedule</div>
      </div>

      {slots.map((slot) => {
        const booking = findBookingAtTime(bookings, slot);
        const isStart = booking?.startTime === slot;

        return (
          <div key={slot} className="grid grid-cols-[110px_1fr]">
            <div className="border-r border-t border-slate-200 px-3 py-3 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
              {minutesToLabel(timeToMinutes(slot))}
            </div>
            <div className="border-t border-slate-200 p-1 dark:border-slate-700">
              {!booking && (
                <button
                  type="button"
                  onClick={() => onSlotClick(slot)}
                  className="w-full rounded-md border border-dashed border-slate-300 px-3 py-3 text-left text-sm text-slate-400 transition hover:border-eco-400 hover:bg-eco-50 hover:text-eco-700 dark:border-slate-600 dark:text-slate-500 dark:hover:bg-slate-800"
                >
                  Available — Click to book
                </button>
              )}

              {booking && (
                <div className="group relative min-h-[52px] rounded-md bg-eco-50 px-3 py-3 text-sm text-eco-900 dark:bg-eco-900/20 dark:text-eco-100">
                  {isStart ? (
                    <>
                      <p className="font-semibold">{booking.meetingTitle}</p>
                      <p className="text-xs">{booking.bookerName}</p>
                      <p className="text-xs">
                        {minutesToLabel(timeToMinutes(booking.startTime))} - {minutesToLabel(timeToMinutes(booking.endTime))}
                      </p>
                    </>
                  ) : (
                    <p className="pt-1 text-xs text-eco-700/70 dark:text-eco-300/80">Booked</p>
                  )}

                  {canManageBooking(booking) && (
                    <button
                      type="button"
                      aria-label="Cancel booking"
                      onClick={() => onCancelBooking(booking)}
                      className="absolute right-2 top-2 hidden h-6 w-6 items-center justify-center rounded-full bg-white text-red-600 shadow group-hover:flex dark:bg-slate-800"
                    >
                      ✕
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
