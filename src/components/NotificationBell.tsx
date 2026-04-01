'use client';
import { useRef, useEffect, useState } from 'react';
import { Booking } from '@/types';
import { formatDisplayDate, formatTimeDisplay } from '@/utils/dateUtils';

interface Props {
  newBookings: Booking[];
  unreadCount: number;
  onMarkAllSeen: () => void;
}

export function NotificationBell({ newBookings, unreadCount, onMarkAllSeen }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleOpen = () => {
    setOpen(v => !v);
  };

  const handleMarkSeen = () => {
    onMarkAllSeen();
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors text-gray-500 hover:text-gray-700"
        title="New bookings"
        aria-label="Notifications"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-200 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-gray-900">New Bookings</span>
              {unreadCount > 0 && (
                <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkSeen}
                className="text-xs text-brand-600 hover:text-brand-700 font-medium transition-colors"
              >
                Mark all seen
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
            {newBookings.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-400">
                No new bookings since your last visit
              </div>
            ) : (
              newBookings.map(b => (
                <div key={b.id} className="px-4 py-3 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-gray-900 truncate">{b.meetingTitle}</div>
                      <div className="text-xs text-gray-500 mt-0.5 truncate">{b.bookerName}</div>
                    </div>
                    <span className="text-xs text-brand-600 font-medium bg-brand-50 px-2 py-0.5 rounded-full flex-shrink-0 whitespace-nowrap">
                      {b.roomName}
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-1.5 text-xs text-gray-400">
                    <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>{formatDisplayDate(b.date)}</span>
                    <span>·</span>
                    <span>{formatTimeDisplay(b.startTime)} – {formatTimeDisplay(b.endTime)}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {newBookings.length > 0 && (
            <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50">
              <button
                onClick={handleMarkSeen}
                className="w-full text-xs text-center text-gray-500 hover:text-gray-700 font-medium py-1 transition-colors"
              >
                Dismiss all
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
