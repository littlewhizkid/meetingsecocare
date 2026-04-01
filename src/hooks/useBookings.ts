'use client';
import { useState, useCallback } from 'react';
import { Booking } from '@/types';

export function useBookings() {
  const [loading, setLoading] = useState(false);

  const fetchRoomBookings = useCallback(async (roomId: string, date: string): Promise<Booking[]> => {
    const res = await fetch(`/api/bookings?roomId=${roomId}&date=${date}`);
    if (!res.ok) return [];
    return res.json();
  }, []);

  const fetchMyBookings = useCallback(async (): Promise<Booking[]> => {
    const res = await fetch('/api/bookings?mine=true');
    if (!res.ok) return [];
    const data = await res.json();
    // Filter to upcoming only on client
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const nowMins = now.getHours() * 60 + now.getMinutes();
    return data.filter((b: Booking) => {
      const [h, m] = b.endTime.split(':').map(Number);
      const endMins = h * 60 + m;
      if (b.date > todayStr) return true;
      if (b.date === todayStr) return endMins > nowMins;
      return false;
    });
  }, []);

  const addBooking = useCallback(async (data: Omit<Booking, 'id' | 'createdAt'>): Promise<{ success: boolean; error?: string; booking?: Booking }> => {
    setLoading(true);
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) return { success: false, error: result.error };
      return { success: true, booking: result };
    } catch {
      return { success: false, error: 'Network error. Please try again.' };
    } finally {
      setLoading(false);
    }
  }, []);

  const cancelBooking = useCallback(async (id: string): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    try {
      const res = await fetch(`/api/bookings/${id}`, { method: 'DELETE' });
      const result = await res.json();
      if (!res.ok) return { success: false, error: result.error };
      return { success: true };
    } catch {
      return { success: false, error: 'Network error. Please try again.' };
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, fetchRoomBookings, fetchMyBookings, addBooking, cancelBooking };
}
