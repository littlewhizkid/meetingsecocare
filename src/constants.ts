import { Room } from './types';

export const ROOMS: Room[] = [
  { id: 'board-room', name: 'Board Room', icon: '🏢' },
  { id: 'small-meeting-room', name: 'Small Meeting Room', icon: '🧩' },
  { id: 'podcast-room', name: 'Podcast Room', icon: '🎙️' },
];

export const WORK_START_MINUTES = 8 * 60;
export const WORK_END_MINUTES = 17 * 60;
export const SLOT_MINUTES = 30;
export const STORAGE_KEY = 'ecocare_meeting_bookings_v1';
export const THEME_KEY = 'ecocare_theme';
