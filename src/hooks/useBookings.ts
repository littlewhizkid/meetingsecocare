import { useCallback, useEffect, useMemo, useState } from 'react';
import { ROOMS } from '../constants';
import { Booking } from '../types';
import { validateBooking } from '../utils/bookings';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '/api';

const withAuthHeaders = (token?: string) => ({
  'Content-Type': 'application/json',
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

export const useBookings = (
  roomId: string,
  date: string,
  userId?: string,
  showAllForAdmin = false,
  accessToken?: string,
) => {
  const [roomDayBookings, setRoomDayBookings] = useState<Booking[]>([]);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);

  const fetchRoomDayBookings = useCallback(async () => {
    const params = new URLSearchParams({ roomId, date });
    const response = await fetch(`${API_BASE_URL}/bookings?${params.toString()}`, {
      headers: withAuthHeaders(accessToken),
    });
    if (!response.ok) throw new Error('Failed to load room bookings.');
    const data = (await response.json()) as Booking[];
    setRoomDayBookings(data);
  }, [roomId, date, accessToken]);

  const fetchMyBookings = useCallback(async () => {
    if (!userId && !showAllForAdmin) {
      setMyBookings([]);
      return;
    }

    const params = new URLSearchParams(showAllForAdmin ? {} : { userId: userId ?? '' });
    const response = await fetch(`${API_BASE_URL}/bookings/upcoming?${params.toString()}`, {
      headers: withAuthHeaders(accessToken),
    });
    if (!response.ok) throw new Error('Failed to load upcoming bookings.');
    const data = (await response.json()) as Booking[];
    setMyBookings(data);
  }, [userId, showAllForAdmin, accessToken]);

  useEffect(() => {
    fetchRoomDayBookings().catch(() => setRoomDayBookings([]));
  }, [fetchRoomDayBookings]);

  useEffect(() => {
    fetchMyBookings().catch(() => setMyBookings([]));
  }, [fetchMyBookings]);

  const addBooking = async (params: {
    roomId: string;
    date: string;
    startTime: string;
    endTime: string;
    meetingTitle: string;
    userId: string;
    userEmail: string;
    userName: string;
  }): Promise<{ ok: true } | { ok: false; error: string }> => {
    const room = ROOMS.find((item) => item.id === params.roomId);
    if (!room) return { ok: false, error: 'Invalid room.' };

    const validationError = validateBooking(roomDayBookings, {
      date: params.date,
      startTime: params.startTime,
      endTime: params.endTime,
      meetingTitle: params.meetingTitle,
    });
    if (validationError) return { ok: false, error: validationError };

    const response = await fetch(`${API_BASE_URL}/bookings`, {
      method: 'POST',
      headers: withAuthHeaders(accessToken),
      body: JSON.stringify({
        roomId: params.roomId,
        roomName: room.name,
        date: params.date,
        startTime: params.startTime,
        endTime: params.endTime,
        meetingTitle: params.meetingTitle.trim(),
        userId: params.userId,
        userName: params.userName,
        userEmail: params.userEmail,
      }),
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as { message?: string };
      return { ok: false, error: body.message ?? 'Unable to create booking.' };
    }

    await Promise.all([fetchRoomDayBookings(), fetchMyBookings()]);
    return { ok: true };
  };

  const removeBooking = async (bookingId: string) => {
    await fetch(`${API_BASE_URL}/bookings/${bookingId}`, {
      method: 'DELETE',
      headers: withAuthHeaders(accessToken),
    });
    await Promise.all([fetchRoomDayBookings(), fetchMyBookings()]);
  };

  const upcomingSorted = useMemo(
    () => [...myBookings].sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()),
    [myBookings],
  );

  return { roomDayBookings, myBookings: upcomingSorted, addBooking, removeBooking };
};
