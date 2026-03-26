import { BookingDuration } from '../types';
import { minutesToLabel, timeToMinutes } from '../utils/date';

type Props = {
  isOpen: boolean;
  roomName: string;
  dateLabel: string;
  startTime: string;
  bookerName: string;
  meetingTitle: string;
  duration: BookingDuration;
  onBookerNameChange: (value: string) => void;
  onMeetingTitleChange: (value: string) => void;
  onDurationChange: (value: BookingDuration) => void;
  onClose: () => void;
  onSubmit: () => void;
};

export const BookingModal = ({
  isOpen,
  roomName,
  dateLabel,
  startTime,
  bookerName,
  meetingTitle,
  duration,
  onBookerNameChange,
  onMeetingTitleChange,
  onDurationChange,
  onClose,
  onSubmit,
}: Props) => {
  if (!isOpen) return null;

  const endLabel = minutesToLabel(timeToMinutes(startTime) + duration);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl dark:bg-slate-900">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Create booking</h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{roomName} • {dateLabel} • {minutesToLabel(timeToMinutes(startTime))} - {endLabel}</p>

        <div className="mt-4 space-y-3">
          <label className="block text-sm">
            <span className="mb-1 block text-slate-700 dark:text-slate-300">Booker name *</span>
            <input
              value={bookerName}
              onChange={(event) => onBookerNameChange(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-eco-500 focus:ring-2 focus:ring-eco-100 dark:border-slate-600 dark:bg-slate-800"
              placeholder="e.g. Budi Santoso"
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block text-slate-700 dark:text-slate-300">Meeting title *</span>
            <input
              value={meetingTitle}
              onChange={(event) => onMeetingTitleChange(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-eco-500 focus:ring-2 focus:ring-eco-100 dark:border-slate-600 dark:bg-slate-800"
              placeholder="e.g. Product Roadmap Review"
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block text-slate-700 dark:text-slate-300">Duration *</span>
            <select
              value={duration}
              onChange={(event) => onDurationChange(Number(event.target.value) as BookingDuration)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-eco-500 focus:ring-2 focus:ring-eco-100 dark:border-slate-600 dark:bg-slate-800"
            >
              <option value={30}>30 minutes</option>
              <option value={60}>1 hour</option>
              <option value={120}>2 hours</option>
            </select>
          </label>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600">
            Cancel
          </button>
          <button type="button" onClick={onSubmit} className="rounded-lg bg-eco-600 px-3 py-2 font-medium text-white hover:bg-eco-700">
            Confirm booking
          </button>
        </div>
      </div>
    </div>
  );
};
