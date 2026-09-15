import { TimeSlot } from '@/types';

// Generate slots from 08:00 to 17:00 in 30-min increments.
// Start slots: 08:00–16:30 (16:30 is the last valid 30-min start).
// End slots: 08:30–17:00.
function generateSlots(includeEnd: boolean): TimeSlot[] {
  const slots: TimeSlot[] = [];
  for (let h = 8; h <= 17; h++) {
    const isEndBoundary = h === 17;
    for (let m = 0; m < 60; m += 30) {
      if (isEndBoundary) {
        if (!includeEnd) continue;      // 17:00 only for end slots
        if (m !== 0) continue;          // only 17:00, not 17:30
      }
      const hh = String(h).padStart(2, '0');
      const mm = String(m).padStart(2, '0');
      const time = `${hh}:${mm}`;
      const period = h < 12 ? 'AM' : 'PM';
      const displayH = h > 12 ? h - 12 : h;
      const label = `${displayH}:${mm} ${period}`;
      slots.push({ time, label });
    }
  }
  return slots;
}

export const START_TIME_SLOTS: TimeSlot[] = generateSlots(false).filter(s => s.time !== '17:00');
export const END_TIME_SLOTS: TimeSlot[] = generateSlots(true).filter(s => s.time !== '08:00');

// All display band-start labels for the grid: 08:00–16:30 (18 half-hour
// bands covering 08:00–17:00; each label marks the START of its band)
export const DISPLAY_SLOTS: TimeSlot[] = generateSlots(false);