import { Room } from './types';

export const ROOMS: Room[] = [
  { id: 'board-room', name: 'Board Room', icon: '🏢' },
  { id: 'small-meeting-room', name: 'Small Meeting Room', icon: '🧩' },
  { id: 'podcast-room', name: 'Podcast Room', icon: '🎙️' },
];

export const WORK_START_MINUTES = 8 * 60;
export const WORK_END_MINUTES = 17 * 60;
export const SLOT_MINUTES = 30;
export const THEME_KEY = 'ecocare_theme';
export const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS as string | undefined)?.split(',').map((v) => v.trim().toLowerCase()).filter(Boolean) ?? [];
