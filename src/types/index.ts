export interface Booking {
  id: string;
  roomId: string;
  roomName: string;
  /** Half-open [startAt, endAt) UTC instants */
  startAt: string;
  endAt: string;
  allDay: boolean;
  bookerName: string;
  meetingTitle: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

/** Payload for creating a booking. Times are office-tz wall clocks. */
export interface BookingCreateInput {
  roomId: string;
  meetingTitle: string;
  allDay: boolean;
  /** YYYY-MM-DD */
  startDate: string;
  /** YYYY-MM-DD; required when allDay */
  endDate?: string;
  /** HH:mm; required when !allDay */
  startTime?: string;
  endTime?: string;
}

export interface BookingUpdateInput extends BookingCreateInput {}

export interface Room {
  id: string;
  name: string;
  description: string;
  capacity: string;
  icon: string;
  order?: number;
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