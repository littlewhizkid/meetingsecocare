import { Room, TimeSlot } from '@/types';

export const ROOMS: Room[] = [
  {
    id: 'board-room',
    name: 'Board Room',
    description: 'Main conference room with projector & video conferencing',
    capacity: '12 people',
    icon: '🏛️',
  },
  {
    id: 'small-meeting-room',
    name: 'Small Meeting Room',
    description: 'Intimate discussion space with whiteboard',
    capacity: '6 people',
    icon: '💼',
  },
  {
    id: 'podcast-room',
    name: 'Podcast Room',
    description: 'Soundproofed recording studio',
    capacity: '10 people',
    icon: '🎙️',
  },
  {
    id: 'interview-room',
    name: 'Interview Room',
    description: 'Private space for interviews and 1-on-1s',
    capacity: '4 people',
    icon: '🤝',
  },
];

export const WORKING_START = '08:00';
export const WORKING_END = '17:00';

// Generate slots from 08:00 to 16:30 in 30-min increments (18 slots for start times)
// End time slots: 08:30 to 17:00
function generateSlots(includeEnd: boolean): TimeSlot[] {
  const slots: TimeSlot[] = [];
  for (let h = 8; h < 17; h++) {
    for (let m = 0; m < 60; m += 30) {
      if (!includeEnd && h === 16 && m === 30) continue; // 16:30 is last valid start
      // skip 17:00 for start slots
      const hh = String(h).padStart(2, '0');
      const mm = String(m).padStart(2, '0');
      const time = `${hh}:${mm}`;
      const period = h < 12 ? 'AM' : 'PM';
      const displayH = h > 12 ? h - 12 : h;
      const label = `${displayH}:${mm} ${period}`;
      slots.push({ time, label });
    }
  }
  if (includeEnd) {
    slots.push({ time: '17:00', label: '5:00 PM' });
  }
  return slots;
}

export const START_TIME_SLOTS: TimeSlot[] = generateSlots(false);
export const END_TIME_SLOTS: TimeSlot[] = generateSlots(true).filter(s => s.time !== '08:00');

// All display slots (08:00 to 16:30) for the grid
export const DISPLAY_SLOTS: TimeSlot[] = generateSlots(false);
