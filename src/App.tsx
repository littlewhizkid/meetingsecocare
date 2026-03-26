import { FormEvent, useEffect, useMemo, useState } from 'react';
import { LogOut, Moon, Shield, Sun } from 'lucide-react';
import { DayNavigation } from './components/DayNavigation';
import { BookingGrid } from './components/BookingGrid';
import { BookingModal } from './components/BookingModal';
import { MyBookingsPanel } from './components/MyBookingsPanel';
import { RoomSelector } from './components/RoomSelector';
import { ToastStack } from './components/ToastStack';
import { ADMIN_EMAILS, ROOMS, THEME_KEY } from './constants';
import { useAuth } from './hooks/useAuth';
import { useBookings } from './hooks/useBookings';
import { Booking, Toast } from './types';
import { generateSlots } from './utils/bookings';
import { formatDisplayDate, fromDateKey, toDateKey } from './utils/date';

const slots = generateSlots();

type Theme = 'light' | 'dark';

function App() {
  const [selectedRoomId, setSelectedRoomId] = useState(ROOMS[0].id);
  const [selectedDate, setSelectedDate] = useState(toDateKey(new Date()));
  const [selectedStartTime, setSelectedStartTime] = useState<string | null>(null);
  const [customStartTime, setCustomStartTime] = useState('08:00');
  const [customEndTime, setCustomEndTime] = useState('08:30');
  const [meetingTitle, setMeetingTitle] = useState('');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [theme, setTheme] = useState<Theme>(() =>
    localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light',
  );
  const [adminViewAll, setAdminViewAll] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginName, setLoginName] = useState('');

  const { user, loading, loginWithWorkEmail, logout } = useAuth();
  const isAdmin = Boolean(user?.userEmail && ADMIN_EMAILS.includes(user.userEmail.toLowerCase()));

  const { roomDayBookings, myBookings, addBooking, removeBooking } = useBookings(
    selectedRoomId,
    selectedDate,
    user?.userId,
    isAdmin && adminViewAll,
    user?.accessToken,
  );

  const selectedRoom = ROOMS.find((room) => room.id === selectedRoomId) ?? ROOMS[0];

  const addToast = (kind: Toast['kind'], message: string) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, kind, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 2600);
  };

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await loginWithWorkEmail(loginEmail, loginName);
      setLoginEmail('');
      setLoginName('');
      addToast('success', 'Logged in successfully.');
    } catch (error) {
      addToast('error', error instanceof Error ? error.message : 'Login failed.');
    }
  };

  const closeModal = () => {
    setSelectedStartTime(null);
    setMeetingTitle('');
  };

  const shiftDay = (amount: number) => {
    const date = fromDateKey(selectedDate);
    date.setDate(date.getDate() + amount);
    setSelectedDate(toDateKey(date));
  };

  const handleOpenBooking = (slot: string) => {
    if (!user) {
      addToast('error', 'Please login with your work email first.');
      return;
    }
    setSelectedStartTime(slot);
    setCustomStartTime(slot);
    const [h, m] = slot.split(':').map(Number);
    const end = new Date();
    end.setHours(h, m + 30, 0, 0);
    setCustomEndTime(
      `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`,
    );
  };

  const handleCreateBooking = async () => {
    if (!selectedStartTime || !user) return;

    const result = await addBooking({
      roomId: selectedRoomId,
      date: selectedDate,
      startTime: customStartTime,
      endTime: customEndTime,
      meetingTitle,
      userId: user.userId,
      userEmail: user.userEmail,
      userName: user.userName,
    });

    if (!result.ok) {
      addToast('error', result.error);
      return;
    }

    addToast('success', 'Booking created successfully.');
    closeModal();
  };

  const canManageBooking = (booking: Booking) => {
    if (!user) return false;
    return isAdmin || booking.userId === user.userId;
  };

  const confirmCancellation = async (booking: Booking) => {
    if (!canManageBooking(booking)) {
      addToast('error', 'You can only cancel your own bookings.');
      return;
    }

    const confirmed = window.confirm(`Cancel booking "${booking.meetingTitle}" by ${booking.userName}?`);
    if (!confirmed) return;
    await removeBooking(booking.id);
    addToast('success', 'Booking cancelled.');
  };

  const toggleTheme = () => {
    const next: Theme = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem(THEME_KEY, next);
  };

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const authLabel = useMemo(() => {
    if (!user) return 'Not signed in';
    return `${user.userName} (${user.userEmail})`;
  }, [user]);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-6 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-6xl space-y-5">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-eco-700 dark:text-eco-400">EcoCare Head Office</p>
            <h1 className="text-2xl font-bold">Meeting Room Booking</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">{authLabel}</p>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                type="button"
                onClick={() => setAdminViewAll((prev) => !prev)}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                  adminViewAll
                    ? 'bg-amber-500 text-white'
                    : 'border border-amber-400 text-amber-700 dark:text-amber-300'
                }`}
              >
                <Shield size={16} />
                {adminViewAll ? 'Admin: All bookings' : 'Admin: My bookings'}
              </button>
            )}
            <button
              type="button"
              onClick={toggleTheme}
              className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            >
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
              {theme === 'light' ? 'Dark mode' : 'Light mode'}
            </button>
            {user && (
              <button
                type="button"
                onClick={logout}
                className="flex items-center gap-2 rounded-lg bg-slate-800 px-3 py-2 text-sm text-white dark:bg-slate-700"
              >
                <LogOut size={16} />
                Logout
              </button>
            )}
          </div>
        </header>

        {!user && (
          <form onSubmit={handleLogin} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
            <p className="mb-3 text-sm font-medium">Sign in with your EcoCare work email</p>
            <div className="grid gap-2 md:grid-cols-3">
              <input value={loginName} onChange={(e) => setLoginName(e.target.value)} placeholder="Full name" className="rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-800" />
              <input value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} placeholder="name@ecocare.id" className="rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-800" />
              <button className="rounded-lg bg-eco-600 px-3 py-2 text-white">Login</button>
            </div>
          </form>
        )}

        <RoomSelector rooms={ROOMS} selectedRoomId={selectedRoomId} onSelect={setSelectedRoomId} />

        <DayNavigation
          dateKey={selectedDate}
          onPrev={() => shiftDay(-1)}
          onNext={() => shiftDay(1)}
          onToday={() => setSelectedDate(toDateKey(new Date()))}
        />

        <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
          <div>
            <p className="mb-2 text-sm text-slate-500 dark:text-slate-400">
              {selectedRoom.name} schedule for {formatDisplayDate(selectedDate)}
            </p>
            <BookingGrid
              slots={slots}
              bookings={roomDayBookings}
              onSlotClick={handleOpenBooking}
              onCancelBooking={confirmCancellation}
              canManageBooking={canManageBooking}
            />
          </div>

          <MyBookingsPanel
            bookings={myBookings}
            onCancel={confirmCancellation}
            canManageBooking={canManageBooking}
            title={isAdmin && adminViewAll ? 'All Upcoming Bookings' : 'My Bookings'}
          />
        </div>
      </div>

      <BookingModal
        isOpen={Boolean(selectedStartTime)}
        roomName={selectedRoom.name}
        dateLabel={formatDisplayDate(selectedDate)}
        initialStartTime={selectedStartTime ?? '08:00'}
        startTime={customStartTime}
        endTime={customEndTime}
        meetingTitle={meetingTitle}
        onStartTimeChange={setCustomStartTime}
        onEndTimeChange={setCustomEndTime}
        onMeetingTitleChange={setMeetingTitle}
        onClose={closeModal}
        onSubmit={handleCreateBooking}
      />

      <ToastStack toasts={toasts} />
    </div>
  );
}

export default App;
