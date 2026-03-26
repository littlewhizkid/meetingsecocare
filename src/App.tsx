import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { DayNavigation } from './components/DayNavigation';
import { BookingGrid } from './components/BookingGrid';
import { BookingModal } from './components/BookingModal';
import { MyBookingsPanel } from './components/MyBookingsPanel';
import { RoomSelector } from './components/RoomSelector';
import { ToastStack } from './components/ToastStack';
import { ROOMS, THEME_KEY } from './constants';
import { useBookings } from './hooks/useBookings';
import { Booking, BookingDuration, Toast } from './types';
import { generateSlots } from './utils/bookings';
import { formatDisplayDate, fromDateKey, toDateKey } from './utils/date';

const slots = generateSlots();

type Theme = 'light' | 'dark';

function App() {
  const [selectedRoomId, setSelectedRoomId] = useState(ROOMS[0].id);
  const [selectedDate, setSelectedDate] = useState(toDateKey(new Date()));
  const [selectedStartTime, setSelectedStartTime] = useState<string | null>(null);
  const [bookerName, setBookerName] = useState('');
  const [meetingTitle, setMeetingTitle] = useState('');
  const [duration, setDuration] = useState<BookingDuration>(30);
  const [filter, setFilter] = useState('');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light'));

  const { addBooking, removeBooking, getBookingsForRoomAndDate, upcomingBookings } = useBookings();

  const selectedRoom = ROOMS.find((room) => room.id === selectedRoomId) ?? ROOMS[0];
  const bookingsForSelectedRoom = getBookingsForRoomAndDate(selectedRoomId, selectedDate);

  const addToast = (kind: Toast['kind'], message: string) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, kind, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 2600);
  };

  const closeModal = () => {
    setSelectedStartTime(null);
    setDuration(30);
    setBookerName('');
    setMeetingTitle('');
  };

  const shiftDay = (amount: number) => {
    const date = fromDateKey(selectedDate);
    date.setDate(date.getDate() + amount);
    setSelectedDate(toDateKey(date));
  };

  const handleCreateBooking = () => {
    if (!selectedStartTime) return;

    const result = addBooking({
      roomId: selectedRoomId,
      date: selectedDate,
      startTime: selectedStartTime,
      duration,
      bookerName,
      meetingTitle,
    });

    if (!result.ok) {
      addToast('error', result.error);
      return;
    }

    addToast('success', 'Booking created successfully.');
    closeModal();
  };

  const confirmCancellation = (booking: Booking) => {
    const confirmed = window.confirm(`Cancel booking "${booking.meetingTitle}" by ${booking.bookerName}?`);
    if (!confirmed) return;
    removeBooking(booking);
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

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-6 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-6xl space-y-5">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-eco-700 dark:text-eco-400">EcoCare Head Office</p>
            <h1 className="text-2xl font-bold">Meeting Room Booking</h1>
          </div>
          <button
            type="button"
            onClick={toggleTheme}
            className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
          >
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            {theme === 'light' ? 'Dark mode' : 'Light mode'}
          </button>
        </header>

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
              bookings={bookingsForSelectedRoom}
              onSlotClick={setSelectedStartTime}
              onCancelBooking={confirmCancellation}
            />
          </div>

          <MyBookingsPanel
            bookings={upcomingBookings}
            filter={filter}
            onFilterChange={setFilter}
            onCancel={confirmCancellation}
          />
        </div>
      </div>

      <BookingModal
        isOpen={Boolean(selectedStartTime)}
        roomName={selectedRoom.name}
        dateLabel={formatDisplayDate(selectedDate)}
        startTime={selectedStartTime ?? '08:00'}
        bookerName={bookerName}
        meetingTitle={meetingTitle}
        duration={duration}
        onBookerNameChange={setBookerName}
        onMeetingTitleChange={setMeetingTitle}
        onDurationChange={setDuration}
        onClose={closeModal}
        onSubmit={handleCreateBooking}
      />

      <ToastStack toasts={toasts} />
    </div>
  );
}

export default App;
