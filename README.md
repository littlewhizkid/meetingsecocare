# EcoCare Meeting Room Booking App

Simple production-ready React + TypeScript + Tailwind web app for **EcoCare Head Office** room booking, intended for deployment at **meetings.ecocare.id**.

## Features

- Room-specific schedules:
  - Board Room
  - Small Meeting Room
  - Podcast Room
- Day-view schedule with:
  - previous/next day arrows
  - Today button
- 30-minute slot booking from **8:00 AM–5:00 PM**
- Booking modal with required fields:
  - Booker name
  - Meeting title
  - Duration (30m / 1h / 2h)
- Overlap prevention and office-hour validation
- Booking cancellation with confirmation
- Persistent local storage (`localStorage`) by room and date
- Seed bookings on first run
- “My Bookings” panel with upcoming bookings and booker-name filter
- Toast notifications
- Dark mode toggle
- Responsive layout for desktop and tablet

## Tech Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS

## Local Development

```bash
npm install
npm run dev
```

Open the local URL from Vite (usually `http://localhost:5173`).

## Production Build

```bash
npm run build
npm run preview
```

Build output is generated in `dist/`.

## Deployment Notes (meetings.ecocare.id)

This app is static and can be deployed to any static host (Nginx, Netlify, Vercel, Cloudflare Pages, S3+CloudFront).

### Example: Nginx on `meetings.ecocare.id`

1. Build locally or in CI:
   ```bash
   npm ci
   npm run build
   ```
2. Upload `dist/` contents to server path, for example:
   `/var/www/meetings.ecocare.id`
3. Use an Nginx server block like:

```nginx
server {
    listen 80;
    server_name meetings.ecocare.id;

    root /var/www/meetings.ecocare.id;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /assets/ {
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}
```

4. Add TLS (recommended using Let's Encrypt).

## Data Storage

- Browser `localStorage` key: `ecocare_meeting_bookings_v1`
- Data shape:
  - `roomId -> date(YYYY-MM-DD) -> Booking[]`

## Future Enhancements

- Backend API integration (multi-user shared data)
- Authentication & role-based cancellation rules
- Room availability analytics
