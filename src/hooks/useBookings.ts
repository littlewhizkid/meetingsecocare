import {
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import { ROOMS } from '../constants';
import { db } from '../firebase';
import { Booking } from '../types';
import { validateBooking } from '../utils/bookings';
import { fromDateKey, timeToMinutes } from '../utils/date';

const bookingsCollection = collection(db, 'bookings');

const mapDoc = (snapshot: { id: string; data: () => Record<string, unknown> }): Booking => {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    roomId: data.roomId as string,
    roomName: data.roomName as string,
    date: data.date as string,
    startTime: data.startTime as string,
    endTime: data.endTime as string,
    meetingTitle: data.meetingTitle as string,
    userName: data.userName as string,
    userId: data.userId as string,
    userEmail: data.userEmail as string,
    createdAt: (data.createdAt as Timestamp).toDate().toISOString(),
    startAt: (data.startAt as Timestamp).toDate().toISOString(),
    endAt: (data.endAt as Timestamp).toDate().toISOString(),
  };
};

export const useBookings = (roomId: string, date: string, userId?: string, showAllForAdmin = false) => {
  const [roomDayBookings, setRoomDayBookings] = useState<Booking[]>([]);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);

  useEffect(() => {
    const q = query(bookingsCollection, where('roomId', '==', roomId), where('date', '==', date), orderBy('startAt', 'asc'));
    return onSnapshot(q, (snapshot) => {
      setRoomDayBookings(snapshot.docs.map((item) => mapDoc(item)));
    });
  }, [roomId, date]);

  useEffect(() => {
    if (!userId && !showAllForAdmin) {
      setMyBookings([]);
      return;
    }

    const baseConstraints = [where('endAt', '>=', Timestamp.fromDate(new Date())), orderBy('endAt', 'asc')];
    const q = showAllForAdmin
      ? query(bookingsCollection, ...baseConstraints)
      : query(bookingsCollection, where('userId', '==', userId), ...baseConstraints);

    return onSnapshot(q, (snapshot) => {
      setMyBookings(snapshot.docs.map((item) => mapDoc(item)));
    });
  }, [userId, showAllForAdmin]);

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

    const [year, month, day] = params.date.split('-').map(Number);
    const [startHours, startMinutes] = params.startTime.split(':').map(Number);
    const [endHours, endMinutes] = params.endTime.split(':').map(Number);
    const startAt = new Date(year, month - 1, day, startHours, startMinutes, 0, 0);
    const endAt = new Date(year, month - 1, day, endHours, endMinutes, 0, 0);

    if (endAt.getTime() <= startAt.getTime()) {
      return { ok: false, error: 'End time must be after start time.' };
    }

    await addDoc(bookingsCollection, {
      roomId: params.roomId,
      roomName: room.name,
      date: params.date,
      startTime: params.startTime,
      endTime: params.endTime,
      meetingTitle: params.meetingTitle.trim(),
      userName: params.userName,
      userId: params.userId,
      userEmail: params.userEmail,
      createdAt: Timestamp.fromDate(new Date()),
      startAt: Timestamp.fromDate(startAt),
      endAt: Timestamp.fromDate(endAt),
      startMinutes: timeToMinutes(params.startTime),
      endMinutes: timeToMinutes(params.endTime),
      dayStamp: Timestamp.fromDate(fromDateKey(params.date)),
    });

    return { ok: true };
  };

  const removeBooking = async (bookingId: string) => {
    await deleteDoc(doc(db, 'bookings', bookingId));
  };

  const upcomingSorted = useMemo(
    () =>
      [...myBookings].sort(
        (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
      ),
    [myBookings],
  );

  return { roomDayBookings, myBookings: upcomingSorted, addBooking, removeBooking };
};
