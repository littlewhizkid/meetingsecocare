'use client';
import { useState, useCallback } from 'react';
import { Booking, BookingCreateInput } from '@/types';

export function useBookings() {
  const [loading, setLoading] = useState(false);

  const addBooking = useCallback(async (
    data: BookingCreateInput
  ): Promise<{ success: boolean; error?: string; booking?: Booking }> => {
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

  const updateBooking = useCallback(async (
    id: string,
    data: BookingCreateInput
  ): Promise<{ success: boolean; error?: string; booking?: Booking }> => {
    setLoading(true);
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: 'PATCH',
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

  return { loading, addBooking, updateBooking, cancelBooking };
}