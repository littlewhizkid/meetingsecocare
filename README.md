# EcoCare Meeting Rooms

Internal meeting room booking system for EcoCare Head Office.

**URL:** https://meetings.ecocare.id

## Tech Stack

- **Frontend/Backend:** Next.js 14 (App Router)
- **Auth:** NextAuth.js v4 — username/password (Credentials provider)
- **Database:** Prisma ORM — SQLite (dev) / PostgreSQL (prod)
- **Styling:** Tailwind CSS
- **Language:** TypeScript

## Features

- Book meeting rooms with custom start/end time (30-min increments, 8 AM–5 PM)
- Three rooms: Board Room, Small Meeting Room, Podcast Room
- Users see only their own bookings; Admins see all
- CSV-based user management — create/update accounts in bulk
- Overlap prevention and working-hours enforcement
- Day-by-day schedule view with booking grid

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
DATABASE_URL="file:./dev.db"
```

### 3. Set up the database
```bash
npx prisma migrate dev --name init
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
6. After first deploy, run migration:
   ```bash
   npx prisma migrate deploy
   ```
7. Import your users CSV from local machine (pointing DATABASE_URL to prod DB)

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

- Working hours: 8:00 AM – 5:00 PM
- Minimum booking: 30 minutes
- Maximum booking: Full day (8 AM – 5 PM)
- Time slots: 30-minute increments
- No overlapping bookings per room
