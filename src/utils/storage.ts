import { ROOMS, STORAGE_KEY } from '../constants';
import { Booking, BookingsStore } from '../types';
import { endTimeFromStart } from './bookings';
import { toDateKey } from './date';

const buildSeedData = (): BookingsStore => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const seed: Booking[] = [
    {
      id: crypto.randomUUID(),
      roomId: 'board-room',
      roomName: 'Board Room',
      date: toDateKey(today),
      startTime: '09:00',
      endTime: endTimeFromStart('09:00', 60),
      duration: 60,
      bookerName: 'Ayu Pratama',
      meetingTitle: 'Weekly Leadership Sync',
      createdAt: new Date().toISOString(),
    },
    {
      id: crypto.randomUUID(),
      roomId: 'small-meeting-room',
      roomName: 'Small Meeting Room',
      date: toDateKey(today),
      startTime: '13:30',
      endTime: endTimeFromStart('13:30', 30),
      duration: 30,
      bookerName: 'Rafi Hidayat',
      meetingTitle: 'Recruitment Interview',
      createdAt: new Date().toISOString(),
    },
    {
      id: crypto.randomUUID(),
      roomId: 'podcast-room',
      roomName: 'Podcast Room',
      date: toDateKey(tomorrow),
      startTime: '10:00',
      endTime: endTimeFromStart('10:00', 120),
      duration: 120,
      bookerName: 'Nadia Siregar',
      meetingTitle: 'Podcast Recording',
      createdAt: new Date().toISOString(),
    },
  ];

  const store: BookingsStore = Object.fromEntries(ROOMS.map((room) => [room.id, {}]));
  seed.forEach((booking) => {
    if (!store[booking.roomId]) {
      store[booking.roomId] = {};
    }
    if (!store[booking.roomId][booking.date]) {
      store[booking.roomId][booking.date] = [];
    }
    store[booking.roomId][booking.date].push(booking);
  });

  return store;
};

export const loadBookings = (): BookingsStore => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const seed = buildSeedData();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    return seed;
  }

  try {
    return JSON.parse(raw) as BookingsStore;
  } catch {
    const seed = buildSeedData();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    return seed;
  }
};

export const saveBookings = (store: BookingsStore): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
};
