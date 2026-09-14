'use client';
import { useState, useEffect, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { Booking, BookingCreateInput } from '@/types';
import { getTodayStr } from '@/utils/dateUtils';
import { useBookings } from '@/hooks/useBookings';
import { useToast } from '@/hooks/useToast';
import { useAdminNotifications } from '@/hooks/useAdminNotifications';
import { useRooms } from '@/hooks/useRooms';
import { DayNavigation } from './DayNavigation';
import { BookingGrid } from './BookingGrid';
import { BookingModal } from './BookingModal';
import { MyBookings } from './MyBookings';
import { ConfirmModal } from './ConfirmModal';
import { Toast } from './Toast';
import { NotificationBell } from './NotificationBell';

export function BookingApp() {
  const { data: session } = useSession();
  const [selectedDate, setSelectedDate] = useState(getTodayStr());
  const [bookingsByRoom, setBookingsByRoom] = useState<Record<string, Booking[]>>({});
  const [loadingGrid, setLoadingGrid] = useState(false);
  const [showMyBookings, setShowMyBookings] = useState(false);

  const { rooms, loading: roomsLoading } = useRooms();

  const [bookingModal, setBookingModal] = useState<{
    isOpen: boolean;
    roomId: string;
    startTime: string;
    allDayPrefill: boolean;
    editingBooking: Booking | null;
  }>({
    isOpen: false,
    roomId: '',
    startTime: '09:00',
    allDayPrefill: false,
    editingBooking: null,
  });

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    booking: Booking | null;
  }>({
    isOpen: false,
    booking: null,
  });

  const { addBooking, updateBooking, cancelBooking } = useBookings();
  const { toasts, showToast, removeToast } = useToast();

  const isAdmin = session?.user?.role === 'ADMIN';
  const userId = session?.user?.id ?? '';
  const userName = session?.user?.name ?? '';

  const { newBookings, unreadCount, markAllSeen, refresh: refreshNotifications } =
    useAdminNotifications(isAdmin);

  // Fetch bookings intersecting the selected day (single request)
  const refreshGrid = useCallback(async () => {
    setLoadingGrid(true);
    try {
      const res = await fetch(`/api/bookings?date=${selectedDate}`);
      const data: Booking[] = res.ok ? await res.json() : [];
      const byRoom: Record<string, Booking[]> = {};
      rooms.forEach(room => { byRoom[room.id] = []; });
      data.forEach(b => {
        if (!byRoom[b.roomId]) byRoom[b.roomId] = [];
        byRoom[b.roomId].push(b);
      });
      setBookingsByRoom(byRoom);
    } catch {
      setBookingsByRoom({});
    } finally {
      setLoadingGrid(false);
    }
  }, [selectedDate, rooms]);

  useEffect(() => {
    refreshGrid();
  }, [refreshGrid]);

  const openNewBooking = (roomId: string, slotTime: string) => {
    const allDay = slotTime === 'allday';
    setBookingModal({
      isOpen: true,
      roomId: roomId || rooms[0]?.id || '',
      startTime: allDay ? '09:00' : slotTime,
      allDayPrefill: allDay,
      editingBooking: null,
    });
  };

  const handleNewEventClick = () => {
    setBookingModal({
      isOpen: true,
      roomId: rooms[0]?.id ?? '',
      startTime: '09:00',
      allDayPrefill: false,
      editingBooking: null,
    });
  };

  const openEditBooking = (booking: Booking) => {
    setBookingModal({
      isOpen: true,
      roomId: booking.roomId,
      startTime: '09:00',
      allDayPrefill: booking.allDay,
      editingBooking: booking,
    });
  };

  const handleBookingSubmit = async (data: BookingCreateInput) => {
    const editing = bookingModal.editingBooking;
    const result = editing
      ? await updateBooking(editing.id, data)
      : await addBooking(data);

    if (result.success) {
      showToast(editing ? 'Booking updated' : `Booking confirmed: ${data.meetingTitle}`, 'success');
      setBookingModal(prev => ({ ...prev, isOpen: false, editingBooking: null }));
      refreshGrid();
      refreshNotifications();
    } else {
      showToast(result.error ?? 'Failed to save booking', 'error');
    }
  };

  const handleCancelRequest = (booking: Booking) => {
    setConfirmModal({ isOpen: true, booking });
  };

  const handleCancelConfirm = async () => {
    if (!confirmModal.booking) return;
    const result = await cancelBooking(confirmModal.booking.id);
    setConfirmModal({ isOpen: false, booking: null });
    if (result.success) {
      showToast('Booking cancelled successfully', 'success');
      refreshGrid();
    } else {
      showToast(result.error ?? 'Failed to cancel booking', 'error');
    }
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden">

      {/* ── Header ── */}
      <header className="bg-white border-b border-gray-200 shadow-sm flex-shrink-0 z-30">
        <div className="w-full px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🌿</span>
            <div>
              <h1 className="text-lg font-bold text-gray-900 leading-tight">ecoCare Meeting Rooms</h1>
              <p className="text-xs text-gray-500">Head Office — Booking System</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* New Event */}
            <button
              onClick={handleNewEventClick}
              className="flex items-center gap-2 px-4 py-2 bg-brand-600 border border-brand-600 text-white rounded-xl text-sm font-semibold hover:bg-brand-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden sm:inline">New Event</span>
            </button>

            {/* My Bookings */}
            <button
              onClick={() => setShowMyBookings(true)}
              className="flex items-center gap-2 px-4 py-2 bg-brand-50 border border-brand-200 text-brand-700 rounded-xl text-sm font-medium hover:bg-brand-100 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="hidden sm:inline">{isAdmin ? 'All Bookings' : 'My Bookings'}</span>
            </button>

            {/* Notification bell — admin only */}
            {isAdmin && (
              <>
                <NotificationBell
                  newBookings={newBookings}
                  unreadCount={unreadCount}
                  onMarkAllSeen={markAllSeen}
                />
                <Link
                  href="/admin"
                  className="p-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-colors text-gray-600"
                  title="Admin Settings"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </Link>
              </>
            )}

            {/* User */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                {(session?.user?.name ?? 'U')[0].toUpperCase()}
              </div>
              <div className="hidden sm:block text-right">
                <div className="text-xs font-semibold text-gray-900">{session?.user?.name}</div>
                {isAdmin && <div className="text-xs text-brand-600 font-medium">Admin</div>}
              </div>
              <button
                onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                className="text-gray-400 hover:text-gray-600 ml-1"
                title="Sign out"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="flex-1 flex flex-col overflow-hidden px-4 py-4 gap-3">

        {/* Day navigation bar */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-6 py-3 flex-shrink-0">
          <DayNavigation selectedDate={selectedDate} onDateChange={setSelectedDate} />
        </div>

        {/* All-rooms grid */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm flex-1 flex flex-col overflow-hidden">
          {roomsLoading || loadingGrid ? (
            <div className="flex-1 flex items-center justify-center text-gray-400 gap-2">
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-sm">Loading schedule…</span>
            </div>
          ) : (
            <BookingGrid
              rooms={rooms}
              selectedDate={selectedDate}
              bookingsByRoom={bookingsByRoom}
              currentUserId={userId}
              isAdmin={isAdmin}
              onSlotClick={openNewBooking}
              onEditBooking={openEditBooking}
              onCancelBooking={handleCancelRequest}
            />
          )}
        </div>
      </main>

      {/* ── Modals ── */}
      <BookingModal
        isOpen={bookingModal.isOpen}
        rooms={rooms}
        date={selectedDate}
        initialRoomId={bookingModal.roomId}
        initialStartTime={bookingModal.startTime}
        allDayPrefill={bookingModal.allDayPrefill}
        editingBooking={bookingModal.editingBooking}
        existingBookings={bookingsByRoom[bookingModal.roomId] ?? []}
        onClose={() => setBookingModal(prev => ({ ...prev, isOpen: false, editingBooking: null }))}
        onSubmit={handleBookingSubmit}
      />

      <MyBookings
        isOpen={showMyBookings}
        isAdmin={isAdmin}
        rooms={rooms}
        onClose={() => setShowMyBookings(false)}
        onCancelBooking={booking => {
          setShowMyBookings(false);
          setConfirmModal({ isOpen: true, booking });
        }}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title="Cancel Booking"
        message={`Are you sure you want to cancel "${confirmModal.booking?.meetingTitle ?? ''}"? This cannot be undone.`}
        confirmLabel="Yes, Cancel Booking"
        onConfirm={handleCancelConfirm}
        onCancel={() => setConfirmModal({ isOpen: false, booking: null })}
      />

      <Toast toasts={toasts} onRemove={removeToast} />
    </div>
  );
}