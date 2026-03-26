# EcoCare Meeting Room Booking App

Production-ready React + TypeScript + Tailwind web app for **EcoCare Head Office** room booking at **meetings.ecocare.id**.

## What changed (new requirements)

This version upgrades the app from local-only booking into an authenticated multi-user system with shared cloud persistence.

### ✅ Booking duration (custom range)
- Users can select **custom start and end times** (30-minute increments).
- Supports long bookings (e.g. 5 hours, half-day, full-day within office hours).
- Still prevents:
  - overlaps,
  - invalid ranges,
  - bookings outside 8:00 AM–5:00 PM.

### ✅ Authentication + access control
- Google sign-in enabled with Firebase Authentication.
- Every booking is tied to authenticated user (`userId`, `userEmail`, `bookerName`).
- Normal users can:
  - create bookings,
  - see only their own bookings in **My Bookings**,
  - cancel only their own bookings.
- Optional admin mode:
  - set `VITE_ADMIN_EMAILS` to allow admin users to view/manage all bookings.

### ✅ Shared backend persistence
- Uses **Firebase Firestore** (cloud database), not localStorage-only.
- Bookings are shared across users/devices in real time.

## Features
- 3 rooms: Board Room, Small Meeting Room, Podcast Room.
- Day navigation (previous/next/today).
- 30-minute slot grid view.
- Modal booking form with custom start/end times.
- Hover cancel button on booked slots (authorization-aware).
- Upcoming bookings panel with search/filter.
- Toast feedback.
- Dark mode.
- Responsive desktop/tablet layout.

## Tech stack
- React 18 + TypeScript + Vite
- Tailwind CSS
- Firebase Auth (Google)
- Firebase Firestore

## Environment variables
Create `.env`:

```bash
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
# Optional admin emails (comma separated)
VITE_ADMIN_EMAILS=admin1@ecocare.id,admin2@ecocare.id
```

## Local development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Deployment to meetings.ecocare.id

1. Add production Firebase environment variables in your deploy platform.
2. Build the static assets (`npm run build`).
3. Deploy `dist/` to static hosting (Nginx/Netlify/Vercel/Cloudflare Pages).
4. Ensure Google OAuth redirect domain includes your production domain.

### Nginx SPA fallback

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

## Firestore data model
Collection: `bookings`

Fields:
- `roomId`, `roomName`
- `date` (YYYY-MM-DD)
- `startTime`, `endTime` (HH:mm)
- `startAt`, `endAt` (Timestamp)
- `meetingTitle`
- `bookerName`, `userId`, `userEmail`
- `createdAt`

## Recommended Firestore security rules (example)

```txt
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /bookings/{bookingId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow delete: if request.auth != null && resource.data.userId == request.auth.uid;
      allow update: if false;
    }
  }
}
```

(Adjust admin policies based on your internal security model.)
