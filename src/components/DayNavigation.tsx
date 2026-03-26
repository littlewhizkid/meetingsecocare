import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDisplayDate } from '../utils/date';

type Props = {
  dateKey: string;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
};

export const DayNavigation = ({ dateKey, onPrev, onNext, onToday }: Props) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Selected date</p>
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{formatDisplayDate(dateKey)}</h2>
      </div>
      <div className="flex items-center gap-2">
        <button type="button" onClick={onPrev} className="rounded-lg border border-slate-300 p-2 hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-800">
          <ChevronLeft size={18} />
        </button>
        <button type="button" onClick={onToday} className="rounded-lg bg-eco-600 px-3 py-2 text-sm font-medium text-white hover:bg-eco-700">
          Today
        </button>
        <button type="button" onClick={onNext} className="rounded-lg border border-slate-300 p-2 hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-800">
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
};
