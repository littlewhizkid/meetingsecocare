'use client';
import { useState, useRef, useEffect } from 'react';
import { formatDisplayDate, getTodayStr, addDaysToStr, parseDate, formatDate } from '@/utils/dateUtils';

interface Props {
  selectedDate: string;
  onDateChange: (date: string) => void;
}

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function CalendarPicker({
  selectedDate,
  onSelect,
  onClose,
}: {
  selectedDate: string;
  onSelect: (date: string) => void;
  onClose: () => void;
}) {
  const sel = parseDate(selectedDate);
  const [viewYear, setViewYear] = useState(sel.getFullYear());
  const [viewMonth, setViewMonth] = useState(sel.getMonth()); // 0-indexed
  const today = getTodayStr();
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  // Build calendar grid
  const firstDay = new Date(viewYear, viewMonth, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // Pad to full rows
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div
      ref={ref}
      className="absolute top-full mt-2 left-1/2 -translate-x-1/2 z-50 bg-white rounded-2xl shadow-xl border border-gray-200 p-4 w-72 select-none"
    >
      {/* Month/year header */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={prevMonth}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
          aria-label="Previous month"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-sm font-semibold text-gray-800">
          {MONTHS[viewMonth]} {viewYear}
        </span>
        <button
          onClick={nextMonth}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
          aria-label="Next month"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map(d => (
          <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>
        ))}
      </div>

      {/* Date cells */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((day, idx) => {
          if (!day) return <div key={idx} />;
          const mm = String(viewMonth + 1).padStart(2, '0');
          const dd = String(day).padStart(2, '0');
          const dateStr = `${viewYear}-${mm}-${dd}`;
          const isSelected = dateStr === selectedDate;
          const isTodayCell = dateStr === today;

          return (
            <button
              key={idx}
              onClick={() => { onSelect(dateStr); onClose(); }}
              className={[
                'w-full aspect-square flex items-center justify-center rounded-lg text-sm transition-colors',
                isSelected
                  ? 'bg-brand-600 text-white font-semibold'
                  : isTodayCell
                  ? 'border border-brand-400 text-brand-700 font-semibold hover:bg-brand-50'
                  : 'text-gray-700 hover:bg-gray-100',
              ].join(' ')}
            >
              {day}
            </button>
          );
        })}
      </div>

      {/* Today shortcut */}
      {selectedDate !== today && (
        <button
          onClick={() => { onSelect(today); onClose(); }}
          className="mt-3 w-full text-xs text-center text-brand-600 hover:text-brand-700 font-medium py-1 rounded-lg hover:bg-brand-50 transition-colors"
        >
          Jump to Today
        </button>
      )}
    </div>
  );
}

export function DayNavigation({ selectedDate, onDateChange }: Props) {
  const [showPicker, setShowPicker] = useState(false);
  const today = getTodayStr();
  const isToday = selectedDate === today;

  return (
    <div className="flex items-center gap-3">
      {/* Prev */}
      <button
        onClick={() => onDateChange(addDaysToStr(selectedDate, -1))}
        className="p-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-colors text-gray-600"
        aria-label="Previous day"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Date display — click to open picker */}
      <div className="relative flex-1 flex justify-center">
        <button
          onClick={() => setShowPicker(v => !v)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-gray-50 transition-colors group"
        >
          <svg className="w-4 h-4 text-gray-400 group-hover:text-brand-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <div className="text-center">
            <div className="font-semibold text-gray-900 text-base leading-tight">
              {formatDisplayDate(selectedDate)}
            </div>
            {isToday && (
              <div className="text-xs text-brand-600 font-medium">Today</div>
            )}
          </div>
        </button>

        {showPicker && (
          <CalendarPicker
            selectedDate={selectedDate}
            onSelect={onDateChange}
            onClose={() => setShowPicker(false)}
          />
        )}
      </div>

      {/* Today button */}
      {!isToday && (
        <button
          onClick={() => onDateChange(today)}
          className="px-3 py-1.5 text-sm font-medium bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
        >
          Today
        </button>
      )}

      {/* Next */}
      <button
        onClick={() => onDateChange(addDaysToStr(selectedDate, 1))}
        className="p-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-colors text-gray-600"
        aria-label="Next day"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}
