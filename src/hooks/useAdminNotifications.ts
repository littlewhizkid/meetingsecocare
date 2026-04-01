'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Booking } from '@/types';

const LS_KEY = 'ecocare_admin_notif_seen_at';
const POLL_INTERVAL = 30_000; // 30 seconds

export function useAdminNotifications(enabled: boolean) {
  // lastSeenAt: ISO string stored in localStorage — bookings created after this are "new"
  const [lastSeenAt, setLastSeenAt] = useState<string>(() => {
    if (typeof window === 'undefined') return new Date().toISOString();
    return localStorage.getItem(LS_KEY) ?? new Date().toISOString();
  });

  const [newBookings, setNewBookings] = useState<Booking[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const poll = useCallback(async (since: string) => {
    if (!enabled) return;
    try {
      const res = await fetch(`/api/bookings?createdAfter=${encodeURIComponent(since)}`);
      if (!res.ok) return;
      const data: Booking[] = await res.json();
      setNewBookings(data);
    } catch {
      // silently ignore network errors in background poll
    }
  }, [enabled]);

  // Poll on mount and on interval
  useEffect(() => {
    if (!enabled) return;
    poll(lastSeenAt);
    intervalRef.current = setInterval(() => poll(lastSeenAt), POLL_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [enabled, lastSeenAt, poll]);

  const markAllSeen = useCallback(() => {
    const now = new Date().toISOString();
    localStorage.setItem(LS_KEY, now);
    setLastSeenAt(now);
    setNewBookings([]);
  }, []);

  // Re-poll immediately when a new booking is created (call this after POST)
  const refresh = useCallback(() => {
    poll(lastSeenAt);
  }, [poll, lastSeenAt]);

  return {
    newBookings,
    unreadCount: newBookings.length,
    markAllSeen,
    refresh,
  };
}
