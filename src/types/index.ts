export interface Booking {
  id: string;
  roomId: string;
  roomName: string;
  date: string;
  startTime: string;
  endTime: string;
  bookerName: string;
  meetingTitle: string;
  userId: string;
  createdAt: string;
}

export interface Room {
  id: string;
  name: string;
  description: string;
  capacity: string;
  icon: string;
}

export interface TimeSlot {
  time: string;  // HH:MM 24h
  label: string; // "8:00 AM"
}

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}
