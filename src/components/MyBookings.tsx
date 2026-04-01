'use client';
import { useState, useEffect } from 'react';
import { Booking } from '@/types';
import { ROOMS } from '@/constants';
import { formatDisplayDate, formatTimeDisplay, timeToMinutes } from '@/utils/dateUtils';

interface Props {
  isOpen: boolean;
  isAdmin: boolean;
  onClose: () => void;
  onCancelBooking: (booking: Booking) => void;
}

export function MyBookings({ isOpen, isAdmin, onClose, onCancelBooking }: Props) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    const endpoint = isAdmin ? '/api/bookings' : '/api/bookings?mine=true';
    fetch(endpoint)
      .then(r => r.json())
      .then((data: Booking[]) => {
        // Filter to upcoming only
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        const nowMins = now.getHours() * 60 + now.getMinutes();
        const upcoming = data
          .filter(b => {
            if (b.date > todayStr) return true;
            if (b.date === todayStr) return timeToMinutes(b.endTime) > nowMins;
            return false;
          })
          .sort((a, b) => {
            if (a.date !== b.date) return a.date.localeCompare(b.date);
            return timeToMinutes(a.startTime) - timeToMinutes(b.startTime);
          });
        setBookings(upcoming);
      })
      .catch(() => setBookings([]))
      .finally(() => setLoading(false));
  }, [isOpen, isAdmin]);

  const filtered = bookings.filter(b =>
    !searchQuery ||
    b.bookerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.meetingTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.roomName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoomIcon = (roomId: string) => ROOMS.find(r => r.id === roomId)?.icon ?? '📅';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative ml-auto w-full max-w-md bg-white h-full flex flex-col shadow-2xl">
        {/* Header */}
        <div className="bg-brand-600 px-6 py-5 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-white font-bold text-lg">
                {isAdmin ? 'All Upcoming Bookings' : 'My Bookings'}
              </h2>
              <p className="text-green-100 text-sm mt-0.5">
                {filtered.length} upcoming {filtered.length === 1 ? 'booking' : 'bookings'}
              </p>
            </div>
            <button onClick={onClose} className="text-white/80 hover:text-white text-3xl leading-none">×</button>
          </div>
          {/* Search */}
          <div className="mt-4">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={isAdmin ? 'Search by name, title, or room...' : 'Search by title or room...'}
              className="w-full bg-white/20 text-white placeholder-green-200 border border-white/30 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:bg-white/30"
            />
          </div>
        </div>

        {/* Booking list */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-32 text-gray-400">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400 gap-3">
              <span className="text-4xl">📭</span>
              <p className="text-sm font-medium text-center">
                {searchQuery ? 'No bookings match your search' : 'No upcoming bookings'}
              </p>
              {!searchQuery && (
                <p className="text-xs text-center text-gray-300">
                  Click on an empty slot in the calendar to make a booking
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(booking => (
                <div key={booking.id} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl flex-shrink-0 mt-0.5">{getRoomIcon(booking.roomId)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 text-sm truncate">{booking.meetingTitle}</div>
                      <div className="text-xs text-brand-600 font-medium mt-0.5">{booking.roomName}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {formatDisplayDate(booking.date)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatTimeDisplay(booking.startTime)} – {formatTimeDisplay(booking.endTime)}
                      </div>
                      {isAdmin && (
                        <div className="text-xs text-gray-400 mt-1">Booked by {booking.bookerName}</div>
                      )}
                    </div>
                    <button
                      onClick={() => onCancelBooking(booking)}
                      className="flex-shrink-0 px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
