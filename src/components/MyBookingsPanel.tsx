import { Booking } from '../types';
import { formatDisplayDate, minutesToLabel, timeToMinutes } from '../utils/date';

type Props = {
  bookings: Booking[];
  onCancel: (booking: Booking) => void;
  canManageBooking: (booking: Booking) => boolean;
  title?: string;
};

export const MyBookingsPanel = ({
  bookings,
  onCancel,
  canManageBooking,
  title = 'My Bookings',
}: Props) => {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
      </div>

      {bookings.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500 dark:border-slate-600 dark:text-slate-400">
          No upcoming bookings found.
        </p>
      ) : (
        <div className="space-y-2">
          {bookings.map((booking) => (
            <div
              key={booking.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 p-3 dark:border-slate-700"
            >
              <div>
                <p className="font-medium text-slate-800 dark:text-slate-100">{booking.meetingTitle}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {booking.roomName} • {formatDisplayDate(booking.date)} •{' '}
                  {minutesToLabel(timeToMinutes(booking.startTime))} -{' '}
                  {minutesToLabel(timeToMinutes(booking.endTime))}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {booking.userName} ({booking.userEmail})
                </p>
              </div>
              {canManageBooking(booking) && (
                <button
                  type="button"
                  onClick={() => onCancel(booking)}
                  className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20"
                >
                  Cancel
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
