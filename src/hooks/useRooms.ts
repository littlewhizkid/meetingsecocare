'use client';
import { useState, useEffect, useCallback } from 'react';
import { Room } from '@/types';

export function useRooms() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/rooms');
      if (res.ok) setRooms(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { rooms, loading, refresh };
}
