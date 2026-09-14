'use client';
import { useState, useEffect } from 'react';
import { Booking, Room, BookingCreateInput } from '@/types';
import { START_TIME_SLOTS, END_TIME_SLOTS } from '@/constants';
import {
  formatDisplayDate,
  formatTimeDisplay,
  timeToMinutes,
  addDaysToStr,
  daysBetweenInclusive,
} from '@/utils/dateUtils';
import { DateTime } from 'luxon';

interface Props {
  isOpen: boolean;
  rooms: Room[];
  date: string;
  initialRoomId: string;
  initialStartTime: string;
  allDayPrefill: boolean;
  /** When set, the modal is in edit mode for this booking */
  editingBooking: Booking | null;
  existingBookings: Booking[];
  onClose: () => void;
  onSubmit: (data: BookingCreateInput) => Promise<void>;
}

function isoToOfficeDate(iso: string): string {
  return DateTime.fromISO(iso, { zone: 'utc' }).setZone('Asia/Jakarta').toISODate() ?? '';
}

function isoToOfficeTime(iso: string): string {
  return DateTime.fromISO(iso, { zone: 'utc' }).setZone('Asia/Jakarta').toFormat('HH:mm');
}

export function BookingModal({
  isOpen, rooms, date, initialRoomId, initialStartTime, allDayPrefill,
  editingBooking, existingBookings, onClose, onSubmit,
}: Props) {
  const [roomId, setRoomId] = useState(initialRoomId);
  const [allDay, setAllDay] = useState(false);
  const [startDate, setStartDate] = useState(date);
  const [endDate, setEndDate] = useState(date);
  const [startTime, setStartTime] = useState(initialStartTime);
  const [endTime, setEndTime] = useState('');
  const [meetingTitle, setMeetingTitle] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setErrors({});
    setSubmitError('');
    setSubmitting(false);

    if (editingBooking) {
      const b = editingBooking;
      setRoomId(b.roomId);
      setAllDay(b.allDay);
      setMeetingTitle(b.meetingTitle);
      const start = isoToOfficeDate(b.startAt);
      if (b.allDay) {
        // stored end is exclusive midnight; UI end date is inclusive
        setStartDate(start);
        setEndDate(isoToOfficeDate(DateTime.fromISO(b.endAt, { zone: 'utc' }).minus({ days: 1 }).toISO() ?? ''));
        setStartTime('09:00');
        setEndTime('10:00');
      } else {
        setStartDate(start);
        setEndDate(isoToOfficeDate(b.endAt));
        setStartTime(isoToOfficeTime(b.startAt));
        setEndTime(isoToOfficeTime(b.endAt));
      }
    } else {
      setRoomId(initialRoomId || rooms[0]?.id || '');
      setAllDay(allDayPrefill);
      setStartDate(date);
      setEndDate(date);
      setMeetingTitle('');
      setStartTime(initialStartTime);
      const startMins = timeToMinutes(initialStartTime);
      const endMins = Math.min(startMins + 60, timeToMinutes('17:00'));
      const eh = Math.floor(endMins / 60);
      const em = endMins % 60;
      setEndTime(`${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`);
    }
  }, [isOpen, editingBooking, initialRoomId, initialStartTime, allDayPrefill, date, rooms]);

  const availableEndTimes = END_TIME_SLOTS.filter(
    s => timeToMinutes(s.time) > timeToMinutes(startTime)
  );

  const validate = () => {
    const e: Record<string, string> = {};
    if (!roomId) e.roomId = 'Please select a room';
    if (!meetingTitle.trim()) e.meetingTitle = 'Please enter a meeting title';
    if (allDay) {
      if (!startDate) e.startDate = 'Please select a start date';
      if (!endDate) e.endDate = 'Please select an end date';
      if (startDate && endDate && endDate < startDate) {
        e.endDate = 'End date must be on or after the start date';
      }
    } else {
      if (!startDate) e.startDate = 'Please select a start date';
      if (!endDate) e.endDate = 'Please select an end date';
      if (startDate && endDate && endDate < startDate) {
        e.endDate = 'End date must be on or after the start date';
      }
      if (!endTime) e.endTime = 'Please select an end time';
      if (endTime && timeToMinutes(endTime) <= timeToMinutes(startTime)) {
        e.endTime = 'End time must be after start time';
      }
      if (endTime && timeToMinutes(endTime) > timeToMinutes('17:00')) {
        e.endTime = 'Booking must end by 5:00 PM';
      }
    }
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);
    try {
      await onSubmit({
        roomId,
        meetingTitle: meetingTitle.trim(),
        allDay,
        startDate,
        endDate,
        ...(allDay ? {} : { startTime, endTime }),
      });
    } catch {
      setSubmitError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const selectedRoom = rooms.find(r => r.id === roomId);

  const summary = (() => {
    if (allDay) {
      const days = startDate && endDate && endDate >= startDate ? daysBetweenInclusive(startDate, endDate) : 0;
      return days === 1
        ? `All day · ${formatDisplayDate(startDate)}`
        : `All day · ${days} days (${startDate} → ${endDate})`;
    }
    if (!startDate || !endDate || !startTime || !endTime) return null;
    if (startDate === endDate) {
      const mins = timeToMinutes(endTime) - timeToMinutes(startTime);
      const dur = mins < 60 ? `${mins} min` : mins % 60 === 0 ? `${mins / 60} hr` : `${Math.floor(mins / 60)}h ${mins % 60}min`;
      return `${formatDisplayDate(startDate)} · ${formatTimeDisplay(startTime)} – ${formatTimeDisplay(endTime)} (${dur})`;
    }
    return `${startDate} ${formatTimeDisplay(startTime)} → ${endDate} ${formatTimeDisplay(endTime)}`;
  })();

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md modal-enter max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-brand-600 rounded-t-2xl px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-white font-bold text-lg">
                {editingBooking ? 'Edit Booking' : 'New Booking'}
              </h2>
              <p className="text-green-100 text-sm mt-0.5">
                {selectedRoom ? `${selectedRoom.icon} ${selectedRoom.name}` : 'Select a room'}
              </p>
            </div>
            <button onClick={onClose} className="text-white/80 hover:text-white text-2xl leading-none" aria-label="Close">×</button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Room */}
          <div>
            <label htmlFor="booking-room" className="block text-sm font-medium text-gray-700 mb-1.5">Room</label>
            <select
              id="booking-room"
              value={roomId}
              onChange={e => { setRoomId(e.target.value); setErrors(prev => ({ ...prev, roomId: '' })); }}
              className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent ${errors.roomId ? 'border-red-400' : 'border-gray-200'}`}
            >
              {rooms.map(r => (
                <option key={r.id} value={r.id}>{r.icon} {r.name}</option>
              ))}
            </select>
            {errors.roomId && <p className="text-red-500 text-xs mt-1">{errors.roomId}</p>}
          </div>

          {/* All-day toggle */}
          <label className="flex items-center gap-2.5 bg-brand-50 border border-brand-200 rounded-xl px-4 py-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={allDay}
              onChange={e => {
                setAllDay(e.target.checked);
                setErrors({});
              }}
              className="w-4 h-4 accent-brand-600"
            />
            <span className="text-sm font-medium text-brand-700">All-day booking</span>
          </label>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="booking-start-date" className="block text-sm font-medium text-gray-700 mb-1.5">Start date</label>
              <input
                id="booking-start-date"
                type="date"
                value={startDate}
                onChange={e => {
                  const v = e.target.value;
                  setStartDate(v);
                  if (endDate && v && endDate < v) setEndDate(v);
                  setErrors(prev => ({ ...prev, startDate: '', endDate: '' }));
                }}
                className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent ${errors.startDate ? 'border-red-400' : 'border-gray-200'}`}
              />
              {errors.startDate && <p className="text-red-500 text-xs mt-1">{errors.startDate}</p>}
            </div>
            <div>
              <label htmlFor="booking-end-date" className="block text-sm font-medium text-gray-700 mb-1.5">
                {allDay ? 'End date (last day)' : 'End date'}
              </label>
              <input
                id="booking-end-date"
                type="date"
                value={endDate}
                min={startDate || undefined}
                onChange={e => { setEndDate(e.target.value); setErrors(prev => ({ ...prev, endDate: '' })); }}
                className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent ${errors.endDate ? 'border-red-400' : 'border-gray-200'}`}
              />
              {errors.endDate && <p className="text-red-500 text-xs mt-1">{errors.endDate}</p>}
            </div>
          </div>

          {/* Times (hidden when all-day) */}
          {!allDay && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="booking-start-time" className="block text-sm font-medium text-gray-700 mb-1.5">Start time</label>
                <select
                  id="booking-start-time"
                  value={startTime}
                  onChange={e => {
                    setStartTime(e.target.value);
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
                <label htmlFor="booking-end-time" className="block text-sm font-medium text-gray-700 mb-1.5">End time</label>
                <select
                  id="booking-end-time"
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
          )}

          {/* Summary */}
          {summary && (
            <div className="bg-brand-50 border border-brand-200 rounded-xl px-4 py-2.5">
              <span className="text-brand-700 font-medium text-sm">{summary}</span>
            </div>
          )}

          {/* Meeting title */}
          <div>
            <label htmlFor="booking-title" className="block text-sm font-medium text-gray-700 mb-1.5">Meeting Title</label>
            <input
              id="booking-title"
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
              {submitting ? 'Saving...' : editingBooking ? 'Save Changes' : 'Confirm Booking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}