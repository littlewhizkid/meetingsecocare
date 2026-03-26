export type Room = {
  id: string;
  name: string;
  icon: string;
};

export type BookingDuration = 30 | 60 | 120;

export type Booking = {
  id: string;
  roomId: string;
  roomName: string;
  date: string; // YYYY-MM-DD local date
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  duration: BookingDuration;
  bookerName: string;
  meetingTitle: string;
  createdAt: string;
};

export type BookingsByDate = Record<string, Booking[]>;
export type BookingsStore = Record<string, BookingsByDate>;

export type Toast = {
  id: string;
  kind: 'success' | 'error';
  message: string;
};
