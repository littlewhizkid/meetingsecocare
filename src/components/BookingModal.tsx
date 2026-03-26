import { WORK_END_MINUTES, WORK_START_MINUTES } from '../constants';
import { minutesToLabel } from '../utils/date';

type Props = {
  isOpen: boolean;
  roomName: string;
  dateLabel: string;
  initialStartTime: string;
  startTime: string;
  endTime: string;
  meetingTitle: string;
  onStartTimeChange: (value: string) => void;
  onEndTimeChange: (value: string) => void;
  onMeetingTitleChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
};

export const BookingModal = ({
  isOpen,
  roomName,
  dateLabel,
  initialStartTime,
  startTime,
  endTime,
  meetingTitle,
  onStartTimeChange,
  onEndTimeChange,
  onMeetingTitleChange,
  onClose,
  onSubmit,
}: Props) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl dark:bg-slate-900">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Create booking</h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{roomName} • {dateLabel}</p>

        <div className="mt-4 space-y-3">
          <label className="block text-sm">
            <span className="mb-1 block text-slate-700 dark:text-slate-300">Meeting title *</span>
            <input
              value={meetingTitle}
              onChange={(event) => onMeetingTitleChange(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-eco-500 focus:ring-2 focus:ring-eco-100 dark:border-slate-600 dark:bg-slate-800"
              placeholder="e.g. Quarterly Budget Review"
            />
          </label>

          <div className="grid grid-cols-2 gap-2">
            <label className="block text-sm">
              <span className="mb-1 block text-slate-700 dark:text-slate-300">Start time *</span>
              <input
                type="time"
                step={1800}
                min="08:00"
                max="16:30"
                value={startTime}
                onChange={(event) => onStartTimeChange(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-eco-500 focus:ring-2 focus:ring-eco-100 dark:border-slate-600 dark:bg-slate-800"
              />
            </label>

            <label className="block text-sm">
              <span className="mb-1 block text-slate-700 dark:text-slate-300">End time *</span>
              <input
                type="time"
                step={1800}
                min="08:30"
                max="17:00"
                value={endTime}
                onChange={(event) => onEndTimeChange(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-eco-500 focus:ring-2 focus:ring-eco-100 dark:border-slate-600 dark:bg-slate-800"
              />
            </label>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            Start/end must be in 30-minute increments between {minutesToLabel(WORK_START_MINUTES)} and {minutesToLabel(WORK_END_MINUTES)}.
            Initial slot: {initialStartTime}.
          </p>
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
