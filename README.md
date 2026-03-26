# EcoCare Meeting Room Booking App

Production-ready React + TypeScript + Tailwind web app for **EcoCare Head Office** room booking at **meetings.ecocare.id**.

## Updates included

### ✅ Custom start/end booking times
- Booking form uses **start time + end time** (no fixed 30/60/120 dropdown).
- 30-minute increments within office hours (8:00 AM–5:00 PM).
- Supports long bookings (5 hours, half-day, full-day) if no overlap.

### ✅ Work-email authentication (no Google/Firebase)
- Firebase dependency removed.
- Users log in with **work email** (`@ecocare.id`) and display name.
- Session is used to attach ownership fields to each booking:
  - `userId`
  - `userName`
  - `userEmail`

### ✅ Ownership-based My Bookings
- “My Bookings” shows authenticated user’s upcoming bookings only.
- Users can cancel only their own bookings.
- Optional admin mode (`VITE_ADMIN_EMAILS`) can view/manage all.

### ✅ Shared backend datastore
- Shared booking logic now uses backend HTTP API endpoints (`VITE_API_BASE_URL`) rather than local-only schedule storage.
- This enables cross-device, cross-user visibility when backed by your server/database.

## Tech stack
- React 18 + TypeScript + Vite
- Tailwind CSS
- Backend API (recommended: Node/Next API + PostgreSQL)

## Environment variables
Create `.env`:

```bash
VITE_API_BASE_URL=https://api.meetings.ecocare.id
VITE_ADMIN_EMAILS=admin1@ecocare.id,admin2@ecocare.id
```

## API contract expected by frontend

### `GET /bookings?roomId={id}&date=YYYY-MM-DD`
Returns day bookings for one room.

### `GET /bookings/upcoming?userId={uid}`
Returns upcoming bookings for a user.
- For admin all-bookings view, frontend calls this without `userId`.

### `POST /bookings`
Body:
- `roomId`, `roomName`
- `date`, `startTime`, `endTime`
- `meetingTitle`
- `userId`, `userName`, `userEmail`

### `DELETE /bookings/:id`
Delete booking by id (server must enforce ownership/admin authorization).

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

1. Configure `VITE_API_BASE_URL` and `VITE_ADMIN_EMAILS` in deployment environment.
2. Build frontend: `npm run build`.
3. Deploy `dist/` to static hosting (Nginx/Cloudflare/Vercel/Netlify).
4. Ensure backend API is deployed and reachable from frontend domain.

### Nginx SPA fallback

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```
