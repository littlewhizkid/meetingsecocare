# EcoCare Meeting Rooms

Internal meeting room booking system for EcoCare Head Office.

**URL:** https://meetings.ecocare.id

## Tech Stack

- **Frontend/Backend:** Next.js 14 (App Router)
- **Auth:** NextAuth.js v4 — username/password (Credentials provider)
- **Database:** Prisma ORM + PostgreSQL
- **Styling:** Tailwind CSS
- **Language:** TypeScript
- **Dates/Times:** Luxon — all bookings in Asia/Jakarta (WIB), stored as UTC

## Features

- Book meeting rooms with start/end **date and time** (30-min increments, 8 AM–5 PM)
- Bookings can span multiple days (continuous room hold)
- **All-day bookings** with an inclusive date range (e.g. Dec 14–16 occupies all three days)
- Create bookings from the "New Event" button or by clicking any free slot
- Edit or cancel bookings (owner or admin)
- Overlap prevention enforced **at the database level** (Postgres exclusion constraint) — race-safe
- Users see only their own bookings; Admins see all
- CSV-based user management — create/update accounts in bulk
- Day-by-day schedule view with booking grid, all-day lane, and cross-day clipping

## Prerequisites

- Node.js 18+
- npm

## Local Development

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env.local
```

Edit `.env.local`:
```
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<run: openssl rand -base64 32>
DATABASE_URL="postgresql://user:password@localhost:5432/ecocare_meetings?schema=public"
```

### 3. Set up the database

PostgreSQL is required (16 or 17 recommended). Create a database and user, then:

```bash
npm run db:deploy
```

### 4. Create users

**Option A — CSV import (recommended):**

Edit `users.csv.example`, rename it to `users.csv`, then run:
```bash
npm run users:import -- --file users.csv
```

CSV format:
```csv
name,email,password,role
Admin EcoCare,admin@gmail.com,yourpassword,ADMIN
Budi Santoso,budi@gmail.com,userpassword,USER
```
`role` is optional (defaults to USER). `ADMIN` users can view and cancel all bookings.

**Option B — Seed data (demo only):**
```bash
npm run db:seed
# Admin: admin@ecocare.id / admin1234
# User:  budi@ecocare.id  / user1234
```

### 5. Start dev server
```bash
npm run dev
```

Open http://localhost:3000

## User Management

### Adding/updating users via CSV

Create a CSV file with the columns `name,email,password,role`:

```csv
name,email,password,role
John Smith,john@gmail.com,securepass,USER
Admin User,admin@gmail.com,adminpass,ADMIN
```

Import it:
```bash
npm run users:import -- --file path/to/users.csv
```

- Existing users (matched by email) will be **updated**.
- New users will be **created**.
- Passwords are always hashed (never stored in plain text).
- Run this anytime to add or update users.

### Roles

| Role | Can Do |
|------|--------|
| `USER` | Book rooms, view/cancel their own bookings |
| `ADMIN` | Everything above + view/cancel all bookings |

## Production Deployment

### Option A: Vercel (recommended)

1. Push to GitHub
2. Import repo on [vercel.com](https://vercel.com)
3. Add a Postgres database (Vercel Storage → Postgres)
4. Set environment variables in Vercel dashboard:
   - `NEXTAUTH_URL` = `https://meetings.ecocare.id`
   - `NEXTAUTH_SECRET` = your secret
   - `DATABASE_URL` = your Postgres connection string
5. Deploy — Vercel runs `prisma generate && next build` automatically
6. During a maintenance window, run migration (see "Production migration note" below):
   ```bash
   npx prisma migrate deploy
   ```
7. Import your users CSV from local machine (pointing DATABASE_URL to prod DB)

> **Production migration note:** the migration history was rebased for
> PostgreSQL (`20260914000000_postgres_baseline`). If your production database
> already has tables (from the pre-Postgres SQLite history or a manual
> `prisma db push`), do NOT run `migrate deploy` directly — baseline it first
> with `npx prisma migrate resolve --applied 20260914000000_postgres_baseline`
> after verifying the schema matches, or restore the backup. The
> `20260914120000_interval_booking_model` migration then converts the legacy
> `date`/`startTime`/`endTime` columns to `startAt`/`endAt`/`allDay`
> (interpreted as Asia/Jakarta wall-clock times) and adds the overlap
> prevention constraint.

### Option B: Self-hosted (nginx + Node.js)

1. Set up a server with Node.js 18+
2. Install PostgreSQL and create a database
3. Clone the repo and install dependencies:
   ```bash
   npm install
   ```
4. Create `.env.local` with production values (PostgreSQL URL)
5. Build and migrate:
   ```bash
   npx prisma migrate deploy
   npm run build
   ```
6. Import users:
   ```bash
   npm run users:import -- --file users.csv
   ```
7. Start:
   ```bash
   npm start
   ```
8. Configure nginx as a reverse proxy to port 3000:
   ```nginx
   server {
     listen 80;
     server_name meetings.ecocare.id;
     location / {
       proxy_pass http://localhost:3000;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection 'upgrade';
       proxy_set_header Host $host;
       proxy_cache_bypass $http_upgrade;
     }
   }
   ```
9. Set up SSL with Let's Encrypt: `certbot --nginx -d meetings.ecocare.id`
10. Use PM2 to keep the app running: `pm2 start npm --name ecocare-meetings -- start`

## Booking Rules

- Timezone: Asia/Jakarta (WIB, UTC+7) — all dates/times are interpreted in WIB and stored as UTC
- Working hours: 8:00 AM – 5:00 PM (30-minute increments)
- Timed bookings may span multiple dates; the room is held continuously
- All-day bookings occupy every day in the selected inclusive range (checkout-style: the stored end is midnight after the last day)
- End times are exclusive: a booking may start exactly when another ends (back-to-back is allowed)
- No overlapping bookings per room — enforced by a Postgres exclusion constraint (concurrency-safe)

## Testing

```bash
npm run typecheck          # TypeScript
npm test                   # Vitest unit + DB integration tests (requires local Postgres)
npm run test:e2e           # Playwright E2E (requires dev server or auto-starts one)
```
