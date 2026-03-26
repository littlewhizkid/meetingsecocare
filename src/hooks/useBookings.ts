import { useMemo, useState } from 'react';
import { ROOMS } from '../constants';
import { Booking, BookingDuration, BookingsStore } from '../types';
import { endTimeFromStart, toUpcomingList, validateBooking } from '../utils/bookings';
import { isUpcoming } from '../utils/date';
import { loadBookings, saveBookings } from '../utils/storage';

export const useBookings = () => {
  const [store, setStore] = useState<BookingsStore>(() => loadBookings());

  const addBooking = (params: {
    roomId: string;
    date: string;
    startTime: string;
    duration: BookingDuration;
    bookerName: string;
    meetingTitle: string;
  }): { ok: true } | { ok: false; error: string } => {
    const room = ROOMS.find((item) => item.id === params.roomId);
    if (!room) {
      return { ok: false, error: 'Invalid room selected.' };
    }

    const bookingDraft: Omit<Booking, 'id' | 'createdAt'> = {
      roomId: params.roomId,
      roomName: room.name,
      date: params.date,
      startTime: params.startTime,
      endTime: endTimeFromStart(params.startTime, params.duration),
      duration: params.duration,
      bookerName: params.bookerName.trim(),
      meetingTitle: params.meetingTitle.trim(),
    };

    const validationError = validateBooking(store, bookingDraft);
    if (validationError) {
      return { ok: false, error: validationError };
    }

    const booking: Booking = {
      ...bookingDraft,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };

    const nextStore: BookingsStore = {
      ...store,
      [params.roomId]: {
        ...(store[params.roomId] ?? {}),
        [params.date]: [...(store[params.roomId]?.[params.date] ?? []), booking].sort((a, b) =>
          a.startTime.localeCompare(b.startTime),
        ),
      },
    };

    setStore(nextStore);
    saveBookings(nextStore);
    return { ok: true };
  };

  const removeBooking = (bookingToRemove: Booking) => {
    const roomData = store[bookingToRemove.roomId] ?? {};
    const dateData = roomData[bookingToRemove.date] ?? [];
    const updatedDateData = dateData.filter((booking) => booking.id !== bookingToRemove.id);

    const nextStore: BookingsStore = {
      ...store,
      [bookingToRemove.roomId]: {
        ...roomData,
        [bookingToRemove.date]: updatedDateData,
      },
    };

    setStore(nextStore);
    saveBookings(nextStore);
  };

  const getBookingsForRoomAndDate = (roomId: string, date: string): Booking[] => {
    return store[roomId]?.[date] ?? [];
  };

  const upcomingBookings = useMemo(() => {
    return toUpcomingList(store).filter((booking) => isUpcoming(booking.date, booking.endTime));
  }, [store]);

  return {
    addBooking,
    removeBooking,
    getBookingsForRoomAndDate,
    upcomingBookings,
  };
};
