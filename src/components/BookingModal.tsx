'use client';
import { useState, useEffect } from 'react';
import { Booking } from '@/types';
import { START_TIME_SLOTS, END_TIME_SLOTS } from '@/constants';
import { formatDisplayDate, formatTimeDisplay, timeToMinutes } from '@/utils/dateUtils';
import { hasOverlap } from '@/utils/bookingUtils';

interface Props {
  isOpen: boolean;
  roomName: string;
  roomId: string;
  date: string;
  initialStartTime: string;
  existingBookings: Booking[];
  userName: string;
  onClose: () => void;
  onSubmit: (data: {
    startTime: string;
    endTime: string;
    bookerName: string;
    meetingTitle: string;
  }) => Promise<void>;
}

export function BookingModal({
  isOpen, roomName, roomId, date, initialStartTime, existingBookings, userName, onClose, onSubmit
}: Props) {
  const [startTime, setStartTime] = useState(initialStartTime);
  const [endTime, setEndTime] = useState('');
  const [bookerName, setBookerName] = useState(userName);
  const [meetingTitle, setMeetingTitle] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStartTime(initialStartTime);
      setBookerName(userName);
      setMeetingTitle('');
      setErrors({});
      setSubmitError('');
      setSubmitting(false);
      // Set a default end time 1 hour after start
      const startMins = timeToMinutes(initialStartTime);
      const endMins = Math.min(startMins + 60, timeToMinutes('17:00'));
      const eh = Math.floor(endMins / 60);
      const em = endMins % 60;
      setEndTime(`${String(eh).padStart(2,'0')}:${String(em).padStart(2,'0')}`);
    }
  }, [isOpen, initialStartTime, userName]);

  // Filter available end times based on selected start
  const availableEndTimes = END_TIME_SLOTS.filter(
    s => timeToMinutes(s.time) > timeToMinutes(startTime)
  );

  const validate = () => {
    const e: Record<string, string> = {};
    if (!bookerName.trim()) e.bookerName = 'Please enter your name';
    if (!meetingTitle.trim()) e.meetingTitle = 'Please enter a meeting title';
    if (!endTime) e.endTime = 'Please select an end time';
    if (endTime && timeToMinutes(endTime) <= timeToMinutes(startTime)) {
      e.endTime = 'End time must be after start time';
    }
    if (endTime && timeToMinutes(endTime) > timeToMinutes('17:00')) {
      e.endTime = 'Booking must end by 5:00 PM';
    }
    if (startTime && endTime && hasOverlap(existingBookings, roomId, date, startTime, endTime)) {
      setSubmitError('This time overlaps with an existing booking. Please choose a different time.');
    }
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    if (hasOverlap(existingBookings, roomId, date, startTime, endTime)) {
      setSubmitError('This time overlaps with an existing booking. Please choose a different time.');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({ startTime, endTime, bookerName: bookerName.trim(), meetingTitle: meetingTitle.trim() });
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const duration = endTime
    ? (() => {
        const mins = timeToMinutes(endTime) - timeToMinutes(startTime);
        if (mins < 60) return `${mins} min`;
        if (mins % 60 === 0) return `${mins / 60} hr${mins / 60 > 1 ? 's' : ''}`;
        return `${Math.floor(mins / 60)}h ${mins % 60}min`;
      })()
    : null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md modal-enter">
        {/* Header */}
        <div className="bg-brand-600 rounded-t-2xl px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-white font-bold text-lg">New Booking</h2>
              <p className="text-green-100 text-sm mt-0.5">{roomName} · {formatDisplayDate(date)}</p>
            </div>
            <button onClick={onClose} className="text-white/80 hover:text-white text-2xl leading-none">×</button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Time selection */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Start Time</label>
              <select
                value={startTime}
                onChange={e => {
                  setStartTime(e.target.value);
                  // Reset end time if it's now invalid
                  if (endTime && timeToMinutes(endTime) <= timeToMinutes(e.target.value)) {
                    setEndTime('');
                  }
                }}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              >
                {START_TIME_SLOTS.map(s => (
                  <option key={s.time} value={s.time}>{s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">End Time</label>
              <select
                value={endTime}
                onChange={e => { setEndTime(e.target.value); setErrors(prev => ({ ...prev, endTime: '' })); }}
                className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent ${errors.endTime ? 'border-red-400' : 'border-gray-200'}`}
              >
                <option value="">Select end time</option>
                {availableEndTimes.map(s => (
                  <option key={s.time} value={s.time}>{s.label}</option>
                ))}
              </select>
              {errors.endTime && <p className="text-red-500 text-xs mt-1">{errors.endTime}</p>}
            </div>
          </div>

          {duration && (
            <div className="bg-brand-50 border border-brand-200 rounded-xl px-4 py-2.5 flex items-center gap-2">
              <span className="text-brand-700 font-medium text-sm">Duration: {duration}</span>
              <span className="text-brand-500 text-sm">({formatTimeDisplay(startTime)} – {formatTimeDisplay(endTime)})</span>
            </div>
          )}

          {/* Booker name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Your Name</label>
            <input
              type="text"
              value={bookerName}
              onChange={e => { setBookerName(e.target.value); setErrors(prev => ({ ...prev, bookerName: '' })); }}
              placeholder="e.g. Budi Santoso"
              className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent ${errors.bookerName ? 'border-red-400' : 'border-gray-200'}`}
            />
            {errors.bookerName && <p className="text-red-500 text-xs mt-1">{errors.bookerName}</p>}
          </div>

          {/* Meeting title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Meeting Title</label>
            <input
              type="text"
              value={meetingTitle}
              onChange={e => { setMeetingTitle(e.target.value); setErrors(prev => ({ ...prev, meetingTitle: '' })); }}
              placeholder="e.g. Product Review Q4"
              className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent ${errors.meetingTitle ? 'border-red-400' : 'border-gray-200'}`}
            />
            {errors.meetingTitle && <p className="text-red-500 text-xs mt-1">{errors.meetingTitle}</p>}
          </div>

          {submitError && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm">
              {submitError}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors text-sm">
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2.5 bg-brand-600 text-white rounded-xl font-semibold hover:bg-brand-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Booking...' : 'Confirm Booking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
