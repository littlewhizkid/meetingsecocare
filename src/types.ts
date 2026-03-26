export type Room = {
  id: string;
  name: string;
  icon: string;
};

export type Booking = {
  id: string;
  roomId: string;
  roomName: string;
  date: string; // YYYY-MM-DD local date
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  meetingTitle: string;
  userId: string;
  userName: string;
  userEmail: string;
  createdAt: string;
  startAt: string;
  endAt: string;
};

export type Toast = {
  id: string;
  kind: 'success' | 'error';
  message: string;
};
